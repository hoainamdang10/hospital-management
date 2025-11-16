# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hospital Management System V2** - A microservices-based healthcare management platform built with Clean Architecture, Domain-Driven Design (DDD), CQRS, and Event-Driven Architecture patterns.

**Overall Completion**: 55-60% (3 core services production-ready, 3 in active development, 2 basic/incomplete)
**Architecture**: Clean Architecture + DDD + CQRS + Event-Driven
**Node Version**: >= 18.0.0
**Package Manager**: npm >= 9.0.0

## Essential Commands

### Quick Start
```bash
# From repository root
cd backend/services-v2
npm install

# Switch environment (local vs docker)
npm run env:local     # For local development (services on host, infra in docker)
npm run env:docker    # For full docker deployment
npm run env:status    # Check current environment

# Start infrastructure (Redis + RabbitMQ)
npm run dev:infrastructure

# Start core services (Identity, Patient, Provider)
npm run dev:core

# Start business services (Appointments, Clinical, Billing, Notifications)
npm run dev:business

# Start all services
npm run dev:all

# Stop services
npm run dev:stop

# Clean slate (removes volumes)
npm run dev:clean
```

### Service Health Checks
```bash
# Core Services (Production-Ready)
curl http://localhost:3001/health  # Identity Service
curl http://localhost:3003/health  # Patient Registry
curl http://localhost:3002/health  # Provider/Staff

# Business Services (In Development)
curl http://localhost:3004/health  # Appointments
curl http://localhost:3007/health  # Clinical EMR
curl http://localhost:3009/health  # Billing
curl http://localhost:3011/health  # Notifications
curl http://localhost:3025/health  # Department

# API Gateway
curl http://localhost:3101/health
```

### Build & Test
```bash
# Build all services
npm run build:all

# Build specific service
npm run build:identity
npm run build:patient
npm run build:provider

# Run all tests
npm run test:all

# Test specific service
npm run test:identity
cd identity-service && npm test
cd identity-service && npm run test:watch
cd identity-service && npm run test:coverage
```

### Development Workflow
```bash
# Single service development
cd backend/services-v2/identity-service
npm run dev                    # Development mode with hot reload
npm run build                  # Build service
npm test                       # Run tests
npm run lint                   # Lint code
npm run lint:fix               # Fix linting issues
npm run format                 # Format with Prettier

# Frontend development
cd frontend
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Production build
npm run type-check             # TypeScript validation
npm test                       # Run Jest tests
npm run e2e                    # Run Playwright E2E tests
```

## Architecture

### Clean Architecture Layers

Services follow strict Clean Architecture with four layers:

```
┌─────────────────────────────────────────┐
│    Presentation Layer                   │  ← Controllers, Routes, DTOs
│    (presentation/)                      │
├─────────────────────────────────────────┤
│    Application Layer                    │  ← Use Cases, CQRS (Commands/Queries)
│    (application/)                       │
├─────────────────────────────────────────┤
│    Domain Layer                         │  ← Entities, Value Objects, Events
│    (domain/)                            │     (NO external dependencies)
├─────────────────────────────────────────┤
│    Infrastructure Layer                 │  ← Repositories, DB, Event Bus
│    (infrastructure/)                    │
└─────────────────────────────────────────┘
```

**Critical Dependency Rules**:
- Domain layer MUST NOT depend on anything (pure business logic)
- Application layer depends ONLY on domain
- Infrastructure and Presentation depend on domain and application
- Never violate the dependency flow

### Service Structure

Each microservice follows this structure:
```
<service>/
├── src/
│   ├── domain/              # Entities, Value Objects, Domain Events
│   ├── application/         # Use Cases (Commands & Queries)
│   ├── infrastructure/      # Database, Event Bus, External APIs
│   ├── presentation/        # Controllers, Routes, DTOs
│   ├── utils/              # Utilities (logger, validation)
│   ├── bootstrap/          # Dependency injection setup (some services)
│   ├── main.ts             # Entry point (most services)
│   └── index.ts            # Entry point (Clinical EMR, Notifications)
├── tests/
│   ├── unit/               # Fast, isolated tests
│   └── integration/        # Database/API integration tests
├── migrations/             # Database migrations (if applicable)
├── package.json
├── tsconfig.json
└── Dockerfile
```

**Note**: Some services use `index.ts` instead of `main.ts` as entry point. Notifications service has two entry points: `index.ts` (API) and `consumer.ts` (event consumer).

### Event-Driven Communication

Services communicate via RabbitMQ events:
- Event naming: `<service>.<entity>.<action>` (e.g., `patient.patient.registered`)
- Publishers: Emit events after state changes
- Consumers: React to events from other services
- Shared events defined in: `backend/services-v2/shared/events/`

### CQRS Pattern

- **Commands**: Modify state (Create, Update, Delete)
- **Queries**: Read state (no side effects)
- Handlers in `application/use-cases/commands/` and `application/use-cases/queries/`

## Service Ports & Status

**All services use 300X internal ports** (standardized from previous 302X external mapping).

| Service | Port | Status | Completion | Schema | Description |
|---------|------|--------|------------|--------|-------------|
| Identity Service | **3001** | ✅ **Production Ready** | **95%** | `auth_schema` | Authentication, Authorization, RBAC |
| Patient Registry | **3003** | ✅ **Production Ready** | **90%** | `patient_schema` | Patient management, medical history |
| Provider/Staff | **3002** | ✅ **Production Ready** | **88%** | `provider_schema` | Doctor/staff management, schedules |
| Appointments | **3004** | 🔄 **In Development** | **75%** | `appointments_schema` | Appointment booking, queue management |
| Clinical EMR | **3007** | 🔄 **In Development** | **60%** | `clinical_schema` | Medical records, FHIR compliance |
| Notifications | **3011** | 🔄 **In Development** | **65%** | `notifications_schema` | Email, SMS, push notifications |
| Billing | **3009** | ⚠️ **Basic Only** | **50%** | `billing_schema` | Invoicing, payments, insurance |
| Department | **3025** | ❌ **Skeleton** | **15%** | `department_schema` | Department management |
| API Gateway | **3101** | 🔄 **In Development** | **~40%** | - | Unified API entry point |

**Infrastructure**:
- Redis: Port **6379** (same for local and docker)
- RabbitMQ: Port **5672** (same for local and docker)
- RabbitMQ Management UI: Port **15672** (credentials: admin/admin)

**Frontend**: Port **3000** (Next.js 15.3.2 + React 18.3.1)

### Service Status Details

#### ✅ Production-Ready Services (3/8)

**Identity Service (95%)**
- 44 use cases (authentication, MFA, RBAC, session management)
- 99 test files (87 unit + 12 integration)
- Comprehensive monitoring (health checks, Prometheus metrics)
- Circuit breakers, graceful shutdown, audit logging
- **Ready for production deployment**

**Patient Registry (90%)**
- 32 use cases (registration, insurance, consent, patient linking/merging)
- 51 test files (35 unit + 16 integration)
- Outbox pattern, graceful degradation, FHIR-compliant
- **Ready for production with minor documentation improvements**

**Provider/Staff Service (88%)**
- 28 use cases (staff lifecycle, credentials, certifications, schedules)
- 61 test files (38 unit + 23 integration)
- CQRS with read models, performance metrics tracking
- **Ready for production with minor enhancements**

#### 🔄 In Active Development (3/8)

**Appointments Service (75%)**
- 33 use cases (scheduling, queue, reminders, recurring appointments)
- 56 test files (38 unit + 18 integration)
- CQRS, outbox pattern, conflict detection
- **Missing**: Integration verification with Notifications, Billing, Clinical services
- **Timeline to production**: 3-4 weeks

**Clinical EMR Service (60%)**
- 27 use cases (medical records, prescriptions, lab results, imaging)
- 22 test files
- **Missing**: Controllers/routes (presentation layer incomplete), FHIR R4 verification, ICD-10 coding
- **Timeline to production**: 10-12 weeks

**Notifications Service (65%)**
- 19 use cases (multi-channel delivery, templates, preferences)
- 16 test files
- **Missing**: Scheduled notifications (cron jobs), delivery status tracking, throttling
- **Timeline to production**: 5-6 weeks

#### ⚠️ Basic/Incomplete (2/8)

**Billing Service (50%)**
- 16 basic use cases
- Only 13 test files (weak coverage)
- **Critical Missing**: Payment plans, discounts, Vietnamese VAT, comprehensive testing
- **BillingController.old.ts** exists (incomplete refactoring)
- **Timeline to production**: 8-10 weeks

**Department Service (15%)**
- **SKELETON ONLY** - Only 16 TypeScript files, 0 use cases, 4 test files
- No functional logic implemented
- **Recommendation**: Optional for MVP, implement post-launch
- **Timeline to basic functionality**: 8-10 weeks

### Scheduler Service Status

**❌ REMOVED** - Scheduler service directory does not exist. Functionality migrated to:
- Appointment reminders → Cron jobs in Notifications service (to be implemented)
- Recurring appointments → Built into Appointments service
- Background tasks → Individual service cron jobs

**References to clean up:**
- `.env.local` line 93: `SCHEDULER_SERVICE_URL`
- `.env.docker` line 93: `SCHEDULER_SERVICE_URL`
- `scripts/switch-env.ps1` line 39: Service list
- Notifications `.env`: `SCHEDULER_API_KEY`

## Database Architecture

### Schema-per-Service Pattern

Each service has an isolated Supabase schema:
- `auth_schema` - Identity Service (21 migrations)
- `patient_schema` - Patient Registry (10 migrations)
- `provider_schema` - Provider/Staff (migrations present)
- `appointments_schema` - Appointments (13 migrations)
- `clinical_schema` - Clinical EMR (migrations present)
- `billing_schema` - Billing (migrations present)
- `notifications_schema` - Notifications (migrations present)
- `department_schema` - Department (migrations present)
- ~~`scheduler_schema`~~ - Removed

**Rules**:
- NO cross-service foreign keys (use UUIDs for references)
- Enable Row Level Security (RLS) on sensitive tables
- Use optimized Supabase client from `shared/infrastructure/database/`
- Connection pooling configured (15 connections dev, 20 prod)
- **Supabase free tier limit**: 60 total connections (⚠️ 8 services × 15 = 120 potential connections - monitor usage!)

### Shared Infrastructure

Location: `backend/services-v2/shared/`

Key shared components:
- **Optimized Supabase Client**: `shared/infrastructure/database/optimized-supabase-client.ts`
- **RabbitMQ Event Bus**: `shared/infrastructure/event-bus/`
- **Domain Events**: `shared/events/`
- **Base Classes**: `shared/domain/` (AggregateRoot, Entity, ValueObject)
- **Test Utilities**: `shared/testing/`

**Always use shared infrastructure** instead of creating service-specific implementations.

## Development Guidelines

### Coding Standards

1. **TypeScript Strict Mode**: Always enabled
2. **No `any` types**: Use proper interfaces/types
3. **Explicit return types**: Required for all public methods
4. **Clean Architecture**: Strictly enforce dependency rules
5. **Test Coverage**: Target 90%+ for domain logic, 80%+ overall (actual varies 10-90% by service)

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Classes/Types | PascalCase | `User`, `PatientRepository` |
| Interfaces | `I` prefix | `IUserRepository` |
| Variables/Functions | camelCase | `userId`, `createUser()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Files | kebab-case | `user-repository.ts` |
| Endpoints | kebab-case | `/api/patients` |

### Import Order

```typescript
// 1. External dependencies
import { Request, Response } from 'express';

// 2. Shared modules
import { AggregateRoot } from '@shared/domain';
import { logger } from '@shared/infrastructure/logging';

// 3. Domain layer
import { User } from '../domain/entities/User';

// 4. Application layer
import { CreateUserCommand } from '../application/commands/CreateUserCommand';

// 5. Infrastructure layer
import { SupabaseUserRepository } from '../infrastructure/repositories/SupabaseUserRepository';
```

### Testing Requirements

```bash
# Run tests before committing
npm test

# Inside service directory
npm test                       # All tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
```

**Test Structure**:
- Unit tests: `tests/unit/` (mock all external dependencies)
- Integration tests: `tests/integration/` (use real DB/API)
- Test fixtures: `tests/fixtures/` (JSON test data)
- Naming: `<Class>.test.ts` (e.g., `CreateUserUseCase.test.ts`)

**Actual Test Coverage by Service:**
| Service | Unit | Integration | Total | Coverage Estimate |
|---------|------|-------------|-------|-------------------|
| Identity | 87 | 12 | 99 | 85-90% ✅ |
| Patient | 35 | 16 | 51 | 80-85% ✅ |
| Provider | 38 | 23 | 61 | 80-85% ✅ |
| Appointments | 38 | 18 | 56 | 75-80% ⚠️ |
| Billing | ~10 | ~3 | 13 | 40-50% ❌ |
| Clinical | ~18 | ~4 | 22 | 50-60% ❌ |
| Notifications | ~12 | ~4 | 16 | 55-65% ⚠️ |
| Department | ~3 | ~1 | 4 | 10-15% ❌ |

### Git Commit Format

Follow Conventional Commits:

```
<type>(<scope>): <subject>

Examples:
feat(patient): add medical history tracking
fix(identity): resolve JWT token expiration issue
test(appointments): add booking conflict validation tests
refactor(billing): extract payment processing logic
docs(readme): update setup instructions
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
**Scopes**: Service names (identity, patient, provider, appointments, clinical, billing, notifications, department)

## Environment Configuration

### Environment Switching

The project supports two environments with automatic `.env` switching:

```bash
# Switch to local development (services on host, infrastructure in docker)
npm run env:local

# Switch to docker (all services and infrastructure in docker)
npm run env:docker

# Check current environment
npm run env:status
```

**Script location**: `backend/services-v2/scripts/switch-env.ps1`

**Behavior**:
- Copies appropriate `.env.local` or `.env.docker` to `.env` for root and all services
- `.env.local`: Redis/RabbitMQ at `localhost:6379/5672`, service URLs at `localhost:300X`
- `.env.docker`: Redis/RabbitMQ at `redis-v2:6379/rabbitmq-v2:5672`, service URLs at `<service-name>:300X`

### Required Environment Variables

Create `.env.local` and `.env.docker` in `backend/services-v2/`:

**Common variables:**
```env
# Supabase (Required)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_JWT_SECRET=your-jwt-secret

# Security
JWT_SECRET=your-jwt-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3101

# External Services
SENDGRID_API_KEY=SG.xxx
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Monitoring
LOG_LEVEL=info
LOG_FORMAT=json
```

**Environment-specific (Local):**
```env
NODE_ENV=development
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:admin@localhost:5672

# Service URLs for inter-service communication
IDENTITY_SERVICE_URL=http://localhost:3001
PATIENT_REGISTRY_SERVICE_URL=http://localhost:3003
PROVIDER_STAFF_SERVICE_URL=http://localhost:3002
APPOINTMENTS_SERVICE_URL=http://localhost:3004
CLINICAL_EMR_SERVICE_URL=http://localhost:3007
BILLING_SERVICE_URL=http://localhost:3009
NOTIFICATIONS_SERVICE_URL=http://localhost:3011
DEPARTMENT_SERVICE_URL=http://localhost:3025
```

**Environment-specific (Docker):**
```env
NODE_ENV=production
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# Service URLs using Docker network
IDENTITY_SERVICE_URL=http://identity-service:3001
PATIENT_REGISTRY_SERVICE_URL=http://patient-registry-service:3003
PROVIDER_STAFF_SERVICE_URL=http://provider-staff-service:3002
# ... (other services with docker service names)
```

**Security**:
- Never commit `.env` files (already in .gitignore)
- `.env.local` and `.env.docker` contain actual credentials (also in .gitignore)
- Use `.env.example` for templates
- Rotate secrets regularly
- Use different credentials for dev/staging/production
- Use Supabase MCP to verify project configuration

## Frontend Architecture

**Stack**: Next.js 15.3.2 + React 18.3.1 + TypeScript 5.8.3

**Key Technologies**:
- **Styling**: Tailwind CSS 4.1.7
- **UI Components**: Radix UI + Shadcn/ui
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Playwright

**Structure**:
```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (landing)/         # Landing pages
│   ├── admin/             # Admin dashboard
│   ├── doctor/            # Doctor dashboard
│   ├── nurse/             # Nurse dashboard
│   ├── patient/           # Patient dashboard
│   ├── about/             # About page
│   ├── blog/              # Blog
│   ├── careers/           # Careers
│   ├── contact/           # Contact
│   ├── doctors/           # Doctor listings
│   ├── faq/               # FAQ
│   ├── news/              # News
│   ├── pricing/           # Pricing
│   ├── privacy/           # Privacy policy
│   ├── services/          # Services pages
│   ├── terms/             # Terms of service
│   └── api/               # API routes (if needed)
├── components/            # Reusable React components
├── lib/                   # Utilities, API clients
├── types/                 # TypeScript types
└── modules/               # Feature modules
```

**API Integration**:
- Frontend currently connects to V1 endpoints
- V2 integration requires API Gateway completion
- Use type-safe API clients (consider generating from OpenAPI specs)

## MCP Servers & Tools

This repository is configured with MCP servers for enhanced development:

1. **Supabase MCP**: Direct database access and schema verification
   - Always verify schema through MCP, don't trust migration files alone
   - Check project ID and credentials

2. **Filesystem MCP**: File operations with full path support
   - Always use absolute paths from `D:\hospital-management-V2\`

3. **Context7**: Up-to-date documentation for libraries

**Best Practice**: When working with database, always verify current schema state via Supabase MCP before making changes.

## Common Development Tasks

### Adding a New Use Case

1. Create command/query in `application/use-cases/commands/` or `.../queries/`
2. Implement handler with domain logic
3. Add validation (DTOs, domain rules)
4. Write unit tests (mock repositories)
5. Write integration tests (real DB)
6. Update controller in `presentation/controllers/`
7. Add route in `presentation/routes/`

### Adding a New Entity

1. Create entity in `domain/entities/`
2. Extend `AggregateRoot` or `Entity` from `@shared/domain`
3. Add domain events if state changes
4. Create repository interface in `domain/repositories/`
5. Implement repository in `infrastructure/repositories/`
6. Write comprehensive unit tests

### Creating a Domain Event

1. Define event in `domain/events/`
2. Add to shared events if cross-service: `shared/events/`
3. Emit event in aggregate after state change
4. Create event handler in `application/event-handlers/`
5. Register handler in event bus configuration
6. Test event publishing and handling

### Debugging Service Issues

```bash
# Check service logs
docker-compose -f backend/services-v2/docker-compose.v2.yml logs -f <service-name>

# Check health endpoints (use correct ports!)
curl http://localhost:3001/health  # Identity
curl http://localhost:3003/health  # Patient
curl http://localhost:3002/health  # Provider

# Check RabbitMQ management UI
# http://localhost:15672 (admin/admin)

# Check Redis connection
redis-cli -p 6379 ping

# Restart specific service
docker-compose -f backend/services-v2/docker-compose.v2.yml restart <service-name>
```

## Healthcare Compliance

- **HIPAA Compliance**: Enforced for patient data (audit logging in Identity, Patient, Provider services)
- **FHIR R4**: Partially implemented in Patient service, planned for Clinical EMR service
- **Vietnamese Standards**: BHYT/BHTN insurance integration (Patient service)
- **Audit Logging**: All CRUD operations tracked in production-ready services
- **Row Level Security (RLS)**: Enabled on sensitive tables (verified in Patient, Provider services)

## Known Issues & Limitations

### Service Completion Gaps

1. **Billing Service Incomplete (50%)**
   - Payment lifecycle features missing (plans, installments, discounts)
   - Vietnamese VAT calculation not implemented
   - Only 13 test files (needs 80+ for production)
   - BillingController.old.ts suggests incomplete refactoring
   - **Estimated work**: 8-10 weeks to production-ready

2. **Clinical EMR Presentation Layer Missing (60%)**
   - Controllers and routes not implemented
   - FHIR R4 compliance not verified
   - ICD-10/SNOMED CT coding standards missing
   - Vietnamese e-prescription standards unclear
   - **Estimated work**: 10-12 weeks to production-ready

3. **Department Service Skeleton Only (15%)**
   - Only structure present, no functional logic
   - 0 use cases implemented, 4 test files only
   - Requires complete rebuild
   - **Recommendation**: Optional for MVP, implement post-launch
   - **Estimated work**: 8-10 weeks for basic functionality

4. **Appointments Service Integration Gaps (75%)**
   - Scheduler integration (reminders) - needs cron jobs or Scheduler service
   - Billing integration verification pending
   - Clinical EMR integration verification pending
   - **Estimated work**: 3-4 weeks to production-ready

5. **Notifications Service Missing Features (65%)**
   - No scheduled notifications (cron jobs needed)
   - No delivery status tracking (SendGrid/Twilio webhooks)
   - No throttling/rate limiting
   - No unsubscribe mechanism
   - **Estimated work**: 5-6 weeks to production-ready

### Infrastructure & Architecture

6. **Scheduler Service Removed**
   - Directory does not exist
   - References remain in `.env.local`, `.env.docker`, `switch-env.ps1`
   - Appointment reminders need cron jobs implementation
   - Background task scheduling moved to individual services

7. **Supabase Connection Limits**
   - Free tier = 60 connections
   - 8 services × ~15 connections = 120 potential (over limit!)
   - Monitor usage, may need tier upgrade
   - Consider reducing connection pool sizes

8. **Frontend Migration Incomplete**
   - Frontend still connects to V1 endpoints
   - Requires API Gateway completion for V2 integration
   - API Gateway currently ~40% complete

9. **Service Integration Testing**
   - Cross-service workflows not fully verified
   - Appointment → Clinical → Billing flow incomplete
   - Event-driven workflows need E2E testing

10. **Event Replay Not Implemented**
    - Outbox pattern exists in some services
    - Full event sourcing/replay not implemented
    - Makes debugging historical issues difficult

11. **Distributed Tracing Not Implemented**
    - Planned but not yet implemented
    - Makes debugging cross-service issues difficult
    - Consider OpenTelemetry implementation

12. **Inconsistent Monitoring**
    - Health checks excellent in Identity, good in Patient/Provider/Appointments
    - Health checks unclear in Billing, Clinical, Notifications
    - Prometheus metrics only in Identity service
    - No unified monitoring dashboard

### Testing & Quality

13. **Test Coverage Varies Widely**
    - Core services: 80-90% ✅
    - Business services: 40-80% ⚠️
    - Department service: 10-15% ❌
    - Comprehensive integration tests missing

14. **Documentation Gaps**
    - Swagger/OpenAPI not visible in Patient, Provider services
    - API Gateway documentation incomplete
    - Deployment procedures not documented

## Project Completion Timeline

### Production-Ready Now (3/8 services)
- ✅ Identity Service (95%)
- ✅ Patient Registry (90%)
- ✅ Provider/Staff (88%)

**Action**: Deploy Phase 1 immediately with monitoring

### Near-Term (3-6 weeks)
- 🔄 Appointments Service (75%) - 3-4 weeks
- 🔄 Notifications Service (65%) - 5-6 weeks

**Action**: Integration testing and production infrastructure

### Medium-Term (8-12 weeks)
- 🔄 Clinical EMR Service (60%) - 10-12 weeks
- ⚠️ Billing Service (50%) - 8-10 weeks

**Action**: Complete presentation layer, testing, Vietnamese compliance

### Long-Term (8-10 weeks, optional for MVP)
- ❌ Department Service (15%) - 8-10 weeks
- 🔄 API Gateway (~40%) - TBD

**Action**: Rebuild Department service, complete API Gateway

### Estimated Timeline to Full Production
- **Minimum (aggressive)**: 23 weeks (5.5 months)
- **Conservative**: 26-32 weeks (6.5-8 months)

### Recommended Phased Deployment
1. **Phase 1 (Now)**: Identity, Patient, Provider
2. **Phase 2 (+4 weeks)**: Appointments
3. **Phase 3 (+6 weeks)**: Notifications
4. **Phase 4 (+12 weeks)**: Clinical EMR + Billing (parallel development)
5. **Phase 5 (Optional)**: Department

## Additional Resources

- **Main README**: `README.md` - Project overview
- **Services README**: `backend/services-v2/README.md` - Detailed service documentation
- **Agent Guidelines**: `AGENTS.md` - Guidelines for AI coding agents
- **Architecture Audit**: `backend/services-v2/ARCHITECTURE_AUDIT_REPORT.md` - Detailed architecture analysis

## Platform Notes

This project is primarily developed on Windows with PowerShell. Commands may need adaptation for macOS/Linux (e.g., `type` → `cat`, `findstr` → `grep`).

**PowerShell-specific scripts:**
- `scripts/switch-env.ps1` - Environment switching (requires PowerShell)
- Use `npm run env:local` or `npm run env:docker` instead of calling script directly
