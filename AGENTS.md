# AGENTS.md - Hospital Management System V2

> **Minimal, machine-friendly guide for coding agents**

## Quick Reference

**Project**: Hospital Management System V2
**Architecture**: Clean Architecture + DDD + CQRS + Event-Driven
**Status**: 50-60% Complete (3 core services ready, 4 in development)
**Node**: >= 18.0.0 | **npm**: >= 9.0.0
**OS**: Windows (PowerShell) | macOS/Linux (Bash)

### Agent Rules

1. **MCP Usage**: Luôn sử dụng các MCP đã được cấu hình (Supabase MCP, Filesystem MCP) để tận dụng tối đa hiệu suất
2. **No Documentation Files**: TUYỆT ĐỐI KHÔNG tạo markdown CHANGELOG, REPORT, kế hoạch chi tiết khi thực hiện xong task
3. **Database Verification**: Luôn check Supabase project ID và verify database schema qua MCP, không tin vào migration files
4. **Cleanup**: Các file code debug phải cleanup sau khi hoàn thành nhiệm vụ
5. **Full Paths**: Luôn dùng đường dẫn đầy đủ khi dùng filesystem MCP
6. **Language**: Trả lời bằng tiếng Việt, giữ nguyên thuật ngữ kỹ thuật tiếng Anh

### Essential Commands

```bash
# Setup (from repository root)
cd backend/services-v2
npm install

# Infrastructure (Redis + RabbitMQ)
npm run dev:infrastructure

# Core Services (Identity, Patient, Provider)
npm run dev:core

# Business Services (Appointments, Clinical, Billing)
npm run dev:business

# Supporting Services (Notifications)
npm run dev:supporting

# All Services
npm run dev:all

# Build & Test
npm run build:all            # Build all services
npm run test:all             # Run all tests

# Health Checks
curl http://localhost:3001/health  # Identity
curl http://localhost:3002/health  # Patient
curl http://localhost:3003/health  # Provider
curl http://localhost:3004/health  # Appointments
curl http://localhost:3009/health  # Billing
curl http://localhost:3011/health  # Notifications
curl http://localhost:3101/health  # API Gateway

# Windows PowerShell Health Check
Invoke-WebRequest -Uri http://localhost:3001/health

# Cleanup
npm run dev:stop             # Stop services
npm run dev:clean            # Remove containers + volumes
```

### Service Ports

| Service | Port | Status | Coverage |
|---------|------|--------|----------|
| identity-service | 3001 | ✅ Ready | 90%+ |
| patient-registry-service | 3002 | ✅ Ready | 90%+ |
| provider-staff-service (+ Departments) | 3003 | ✅ Ready | 85%+ |
| appointments-service | 3004 | 🔄 Dev | 70%+ |
| billing-service | 3009 | 🔄 Dev | 50%+ |
| notifications-service | 3011 | 🔄 Dev | 60%+ |
| api-gateway | 3101 | 🔄 Dev | 70%+ |
| **Infrastructure** | | | |
| Redis | 6379 (Docker: 6380) | ✅ Infra | - |
| RabbitMQ | 5672 (Docker: 5673) | ✅ Infra | - |
| RabbitMQ UI | 15672 (Docker: 15673) | ✅ Infra | - |
| **Frontend** | | | |
| Next.js App | 3000 | ✅ Ready | 60%+ |
| **Removed Services** | | | |
| ~~clinical-emr-service~~ | ~~3005~~ | ❌ Disabled | MVP scope |
| ~~department-service~~ | ~~3025~~ | ❌ Merged | Into provider-staff |

---

## Repository Structure

```
hospital-management-V2/
├── backend/
│   └── services-v2/                    # Microservices root
│       ├── identity-service/           # ✅ Auth & User Management
│       ├── patient-registry-service/   # ✅ Patient Management
│       ├── provider-staff-service/     # ✅ Doctor/Staff + Department Management
│       ├── appointments-service/       # 🔄 Appointments & Scheduling
│       ├── clinical-emr-service/       # 🔄 Medical Records & FHIR
│       ├── billing-service/            # 🔄 Payments & Billing
│       ├── notifications-service/      # 🔄 Notifications
│       ├── api-gateway/                # 🔄 API Gateway
│       ├── shared/                     # Shared domain primitives
│       │   ├── domain/                 # Base entities, value objects
│       │   ├── application/            # Base use cases, services
│       │   ├── infrastructure/         # DB, event bus, logging
│       │   ├── events/                 # Domain events
│       │   ├── testing/                # Test utilities
│       │   ├── workflows/              # Cross-service workflows
│       │   └── sdk/                    # Client SDKs
│       ├── docker-compose.v2.yml       # Orchestration
│       ├── package.json                # Monorepo scripts
│       └── scripts/                    # Utility scripts
├── frontend/                           # Next.js 15 + React 18
│   ├── app/                           # Next.js App Router
│   ├── modules/                       # Feature modules
│   ├── components/                    # React components
│   └── package.json                   # Frontend dependencies
├── .augment/                          # Augment AI configuration
│   └── rules/                         # AI behavior rules
├── package.json                       # Root dependencies
├── AGENTS.md                          # This file
└── README.md                          # Project overview
```

### Service Structure (Clean Architecture)

```
<service>/src/
├── domain/          # Business logic (no dependencies)
├── application/     # Use cases (CQRS commands/queries)
├── infrastructure/  # DB, cache, event bus
└── presentation/    # Controllers, routes, DTOs

<service>/tests/
├── unit/           # Fast, isolated tests
└── integration/    # DB, API tests
```

---

## Setup

### 1. Prerequisites

```bash
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
docker --version
```

### 2. Install Dependencies

```bash
cd backend/services-v2
npm install
```

### 3. Environment Configuration

Create `backend/services-v2/.env`:

```env
# Supabase (Required) - Verify project ID via Supabase MCP
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_JWT_SECRET=your-jwt-secret

# Service
NODE_ENV=development
JWT_SECRET=your-jwt-secret
PORT=3001  # Service-specific port (standardized 300x format)

# Infrastructure (auto-configured by docker-compose)
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# External Services (Optional)
SENDGRID_API_KEY=SG.xxx  # For email notifications
TWILIO_ACCOUNT_SID=xxx   # For SMS notifications
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+xxx

# Monitoring (Optional)
LOG_LEVEL=info
LOG_FORMAT=json
```

**⚠️ Security:**
- Never commit `.env` files
- Use Supabase MCP to verify project ID
- Rotate keys regularly
- Use different keys for dev/staging/production

### 4. Start Services

```bash
# Start infrastructure
npm run dev:infrastructure

# Start core services
npm run dev:core

# Verify
curl http://localhost:3001/health
```

---

## Development Workflows

### Build

```bash
# From backend/services-v2/
npm run build:all              # All services
npm run build:identity         # Specific service
npm run build:patient
npm run build:provider
```

### Test

```bash
# All tests
npm run test:all

# Specific service
npm run test:identity
cd identity-service && npm test

# Inside service directory
npm test                       # All tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run test:integration       # Integration only
```

### Logs & Debugging

```bash
# View logs
npm run logs:all
npm run logs:identity

# Health checks
npm run health:check
curl http://localhost:3001/health
```

### Single Service Development

```bash
cd identity-service
npm run dev                    # Dev mode
npm run build                  # Build
npm run lint                   # Lint
npm run lint:fix               # Fix linting
npm run format                 # Prettier
```

### Frontend Development

```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # http://localhost:3000
npm run build                  # Production build
npm run start                  # Start production server
npm run typecheck              # TypeScript check
npm run lint                   # ESLint check
npm test                       # Run Jest tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

**Frontend Stack:**
- Next.js 15.3.2 (App Router)
- React 18.3.1
- TypeScript 5.8.3
- Tailwind CSS 4.1.7
- Jest 29.7.0 + Testing Library

---

## MCP Servers & Tools

### Available MCP Servers

**1. Supabase MCP**
- **Purpose**: Direct database access and schema verification
- **Usage**: Always verify database schema before making changes
- **Critical**: Migration files may be outdated, use MCP as source of truth
- **Commands**: Check project ID, verify schemas, query tables

**2. Filesystem MCP**
- **Purpose**: File operations with full path support
- **Usage**: Always use absolute paths from `D:\hospital-management-V2`
- **Critical**: Required for file operations in Windows environment

**3. Auggie MCP**
- **Purpose**: AI-assisted development tasks
- **Usage**: Complex refactoring, code generation, analysis

### MCP Best Practices

```bash
# Always verify Supabase project ID
# Use Supabase MCP to check schema before migrations

# Always use full paths for filesystem operations
# Example: D:\hospital-management-V2\backend\services-v2\identity-service\src\...

# Use Auggie for complex tasks
# Example: Refactoring entire service, generating boilerplate
```

---

## Shared Modules

### Location
`backend/services-v2/shared/`

### Structure

```
shared/
├── domain/                    # Base domain primitives
│   ├── AggregateRoot.ts      # Base aggregate
│   ├── Entity.ts             # Base entity
│   ├── ValueObject.ts        # Base value object
│   └── DomainEvent.ts        # Base domain event
├── application/               # Base application layer
│   ├── base/                 # Base use cases
│   ├── services/             # Application services
│   └── use-cases/            # Use case templates
├── infrastructure/            # Shared infrastructure
│   ├── database/             # Supabase client, optimization
│   ├── event-bus/            # RabbitMQ event bus
│   ├── logging/              # Pino logger
│   ├── middleware/           # Express middleware
│   └── validation/           # Input validation
├── events/                    # Domain events
│   ├── EventBusConfiguration.ts
│   ├── VietnameseHealthcareEvents.ts
│   └── DepartmentEvents.ts
├── testing/                   # Test utilities
│   ├── IntegrationTestFramework.ts
│   ├── EndToEndTestSuite.ts
│   └── PerformanceTestSuite.ts
├── workflows/                 # Cross-service workflows
│   ├── PatientJourneyWorkflow.ts
│   ├── AppointmentBillingWorkflow.ts
│   └── NotificationTriggerWorkflow.ts
└── sdk/                       # Client SDKs
    └── (future client SDKs)
```

### Usage in Services

```typescript
// Import from shared modules
import { AggregateRoot } from '@shared/domain';
import { createOptimizedSupabaseClient } from '@shared/infrastructure/database';
import { RabbitMQEventBus } from '@shared/infrastructure/event-bus';
import { logger } from '@shared/utils/logger';

// Use in service
export class Patient extends AggregateRoot {
  // Implementation
}
```

### Key Shared Components

**1. Optimized Supabase Client**
- Location: `shared/infrastructure/database/optimized-supabase-client.ts`
- Features: Connection pooling, query optimization, caching
- Usage: All services MUST use this instead of raw Supabase client

**2. RabbitMQ Event Bus**
- Location: `shared/infrastructure/event-bus/`
- Features: Event publishing, subscription, retry logic
- Usage: All inter-service communication

**3. Domain Events**
- Location: `shared/events/`
- Features: Standardized event naming, Vietnamese healthcare events
- Convention: `<service>.<entity>.<action>`

**4. Test Utilities**
- Location: `shared/testing/`
- Features: Integration test framework, E2E test suite
- Usage: All services should use these for consistent testing

---

## Testing

### Framework & Coverage

- **Framework**: Jest
- **Coverage Target**: >= 90% domain, >= 80% overall
- **Types**: Unit, Integration

### Test Structure

```
tests/
├── unit/           # Fast, isolated (domain, application)
├── integration/    # DB, event bus, API
├── fixtures/       # Test data (JSON)
└── helpers/        # Test utilities
```

### Naming Convention

```typescript
// File: CreateUserUseCase.test.ts
describe('CreateUserUseCase', () => {
  describe('execute', () => {
    it('should create user with valid data', async () => {
      // Arrange, Act, Assert
    });
  });
});
```

### Best Practices

1. Mock external dependencies (Supabase, Redis, RabbitMQ)
2. Use fixtures for test data
3. Test edge cases and errors
4. Never commit failing tests
5. Run tests before PR

### Commands

```bash
# All tests
npm run test:all

# Service tests
cd identity-service
npm test                    # All
npm run test:watch          # Watch
npm run test:coverage       # Coverage
npm run test:integration    # Integration only
```

---

## Coding Standards

### TypeScript

- **Strict mode**: Enabled
- **No `any`**: Use interfaces/types
- **Explicit return types**: Required for public methods

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Classes/Types | PascalCase | `User`, `Patient` |
| Interfaces | `I` prefix | `IUserRepository` |
| Variables | camelCase | `userId` |
| Constants | UPPER_SNAKE_CASE | `MAX_ATTEMPTS` |
| Files | kebab-case | `user-repository.ts` |
| Endpoints | kebab-case | `/api/users` |

### Clean Architecture Rules

**Dependency Flow** (CRITICAL):

```
✅ Allowed:
domain → (nothing)
application → domain
infrastructure → domain, application
presentation → domain, application

❌ Forbidden:
domain → anything
application → infrastructure, presentation
```

### Code Formatting

```bash
# Prettier (2 spaces, single quotes, semicolons)
npm run format
```

### Import Order

```typescript
// 1. External
import { Request } from 'express';

// 2. Shared
import { AggregateRoot } from '@shared/domain';

// 3. Domain
import { User } from '../domain/entities/User';

// 4. Application
import { CreateUserUseCase } from '../application/use-cases/CreateUserUseCase';

// 5. Infrastructure
import { SupabaseUserRepository } from '../infrastructure/repositories/SupabaseUserRepository';
```

---

## Architecture Patterns

### Clean Architecture Layers

1. **Domain** - Business logic, no dependencies
2. **Application** - Use cases, CQRS (commands/queries)
3. **Infrastructure** - DB, cache, event bus implementations
4. **Presentation** - Controllers, routes, DTOs

### CQRS

- **Commands**: Modify state (Create, Update, Delete)
- **Queries**: Read state (no side effects)

### Event-Driven

```typescript
// Publish event
await eventBus.publish(new PatientRegisteredEvent({
  patientId: patient.id,
  timestamp: new Date()
}));

// Handle event
@EventHandler(PatientRegisteredEvent)
export class SendWelcomeEmailHandler {
  async handle(event: PatientRegisteredEvent): Promise<void> {
    // Send email
  }
}
```

### Event Naming

```
<service>.<entity>.<action>

Examples:
- identity.user.created
- patient.patient.registered
- billing.payment.completed
```

---

## Security

### Authentication & Authorization

- **JWT**: All API calls require valid JWT
- **RBAC**: 5 roles (SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PATIENT)
- **Password Policies**: Enforced in identity-service
- **2FA**: Available for sensitive operations

### Database Security

- **RLS**: Row Level Security enabled
- **Schema-per-Service**: Isolated schemas
- **Audit Logging**: Track all CRUD operations
- **HIPAA Compliance**: Healthcare data protection

### API Security

- **Rate Limiting**: 100 requests/15min per IP
- **CORS**: Whitelist allowed origins
- **Helmet.js**: Security headers
- **Input Validation**: All inputs sanitized
- **No Sensitive Data in Logs**: Never log passwords, tokens, medical records

### Configuration

- Never commit `.env` files
- Rotate keys regularly
- Use environment variables
- Validate changes with tests

---

## Services Overview

### Core Services (Ready for Production)

#### Identity Service (3001) ✅

**Status**: Production Ready | **Coverage**: 90%+

**Responsibilities**: Authentication, Authorization, User Management, RBAC

**Key Features**:
- JWT authentication with Supabase
- 5 roles: SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PATIENT
- Password policies & validation
- Email verification (SendGrid/Resend)
- Rate limiting & security headers
- Circuit breaker pattern
- Prometheus metrics

**Schema**: `auth_schema`

**Tech Stack**: Express, TypeScript, Supabase, Redis, RabbitMQ, Pino

**Endpoints**:
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/users/:id
PUT  /api/users/:id
GET  /health
GET  /metrics
```

#### Patient Registry (3002) ✅

**Status**: Production Ready | **Coverage**: 90%+

**Responsibilities**: Patient Management, Medical History, Insurance

**Key Features**:
- Vietnamese ID (CCCD) validation
- Medical history tracking
- Emergency contacts
- Insurance (BHYT/BHTN) management
- HIPAA compliance
- Audit logging
- Event-driven updates

**Schema**: `patient_schema`

**Tech Stack**: Express, TypeScript, Supabase, RabbitMQ

**Endpoints**:
```
POST /api/patients
GET  /api/patients/:id
PUT  /api/patients/:id
GET  /api/patients/:id/history
POST /api/patients/:id/insurance
GET  /health
```

#### Provider/Staff (3003) ✅

**Status**: Production Ready | **Coverage**: 85%+

**Responsibilities**: Doctor/Staff Management, Department Management, Schedules, Credentials

**Key Features**:
- Doctor/Staff profiles
- Credentials & certifications
- **Department management (merged module)**
- Department assignments
- Schedule management
- Specializations
- Availability tracking

**Schema**: `provider_schema` (includes departments tables)

**Tech Stack**: Express, TypeScript, Supabase, RabbitMQ

**Endpoints**:
```
POST /api/v1/staff
GET  /api/v1/staff/:id
PUT  /api/v1/staff/:id
GET  /api/v1/staff/:id/schedule
POST /api/v1/staff/:id/credentials
GET  /api/v1/departments
GET  /api/v1/departments/:id
POST /api/v1/departments
PUT  /api/v1/departments/:id
GET  /health
```

**Note**: Department Service đã được merge vào Provider/Staff Service. Departments được quản lý như một module trong cùng bounded context "Staff & Organization Management".

### Business Services (In Development)

#### Appointments Service (3004) 🔄

**Status**: 70% Complete | **Coverage**: 70%+

**Responsibilities**: Appointment Booking, Queue Management, Scheduling

**Key Features**:
- Appointment booking & cancellation
- Queue management (check-in with position calculation)
- Conflict detection (PostgreSQL exclusion constraints)
- Available time slots calculation
- Reminder notifications (via cron jobs in Notifications service)

**Schema**: `appointments_schema`

**Tech Stack**: Express, TypeScript, Supabase, RabbitMQ

**Endpoints**:
```
POST /api/appointments
GET  /api/appointments/:id
PUT  /api/appointments/:id
DELETE /api/appointments/:id
GET  /api/appointments/queue
POST /api/appointments/:id/reschedule
GET  /health
```

#### Clinical EMR (3005) 🔄

**Status**: 60% Complete | **Coverage**: 60%+

**Responsibilities**: Electronic Medical Records, FHIR Compliance

**Key Features**:
- EMR management
- FHIR R4 compliance
- Clinical notes
- Lab results
- Prescriptions
- Medical imaging references
- Audit trail

**Schema**: `clinical_schema`

**Tech Stack**: Express, TypeScript, Supabase, RabbitMQ

**Endpoints**:
```
POST /api/emr/records
GET  /api/emr/records/:id
POST /api/emr/records/:id/notes
POST /api/emr/records/:id/prescriptions
GET  /api/emr/records/:id/history
GET  /health
```

#### Billing Service (3006) 🔄

**Status**: 50% Complete | **Coverage**: 50%+

**Responsibilities**: Invoicing, Payments, Insurance Claims

**Key Features**:
- Invoice generation
- Payment processing
- Insurance claims (BHYT/BHTN)
- Refunds
- Payment history
- Integration with Vietnamese payment gateways

**Schema**: `payment_schema`

**Tech Stack**: Express, TypeScript, Supabase, RabbitMQ

**Endpoints**:
```
POST /api/billing/invoices
GET  /api/billing/invoices/:id
POST /api/billing/payments
POST /api/billing/claims
GET  /api/billing/history/:patientId
GET  /health
```

### Supporting Services

#### Notifications Service (3007) 🔄

**Status**: 60% Complete | **Coverage**: 60%+

**Responsibilities**: Multi-channel Notifications

**Key Features**:
- Email notifications (SendGrid)
- SMS notifications (Twilio)
- In-app notifications
- Push notifications
- Template management
- Delivery tracking
- **Appointment reminder cron job** (runs every 5 minutes)

**Schema**: `notifications_schema`

**Tech Stack**: Express, TypeScript, Supabase, RabbitMQ, SendGrid, Twilio

**Endpoints**:
```
POST /api/notifications/email
POST /api/notifications/sms
GET  /api/notifications/:userId
PUT  /api/notifications/:id/read
GET  /health
```

#### API Gateway (3009) 🔄

**Status**: 70% Complete | **Coverage**: 70%+

**Responsibilities**: Unified API Entry Point, Routing, Security

**Key Features**:
- Request routing
- JWT validation
- Rate limiting (Redis)
- CORS handling
- Circuit breaker
- Request/response logging
- Prometheus metrics

**Tech Stack**: Express, TypeScript, Redis, Prometheus

**Endpoints**:
```
/* Proxies to all services
GET  /health
GET  /metrics
```

---

## Git Workflow

### Commit Format (Conventional Commits)

```
<type>(<scope>): <subject>

Examples:
feat(patient): add medical history tracking
fix(identity): resolve JWT expiration bug
test(provider): add credential validation tests
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes**: `identity`, `patient`, `provider`, `appointments`, `clinical`, `billing`, `notifications`, `department`

### PR Checklist

- [ ] Clean Architecture principles followed
- [ ] Tests added/updated (>= 90% coverage)
- [ ] No sensitive data in logs
- [ ] Environment variables documented
- [ ] Database migrations included (if schema changes)

---

## Database

### Schema-per-Service

- `auth_schema` - Identity
- `patient_schema` - Patient Registry
- `provider_schema` - Provider/Staff + Departments (merged)
- `appointments_schema` - Appointments
- `clinical_schema` - Clinical EMR
- `billing_schema` - Billing
- `notifications_schema` - Notifications

**Removed Legacy Schemas:**
- ~~`departments_schema`~~ - Merged into `provider_schema`
- ~~`payment_schema`~~ - Duplicate of `billing_schema`
- ~~`scheduler`~~ - Service removed

### Migrations

**Location**: `<service>/migrations/`

**Naming**: `001_create_users_table.sql`

**Best Practices**:
- No cross-service foreign keys (use UUIDs)
- Enable RLS on sensitive tables
- Add indexes for frequently queried columns
- Always include rollback scripts

---

## Platform-Specific Commands

### Windows (PowerShell)

```powershell
# Find process using port
netstat -ano | findstr :3001
Get-Process -Id <PID>

# Kill process
taskkill /PID <PID> /F
Stop-Process -Id <PID> -Force

# Health check
Invoke-WebRequest -Uri http://localhost:3001/health

# View logs
docker logs hospital-identity-service-v2 -f

# Environment variables
$env:NODE_ENV = "development"
Get-ChildItem Env:

# File operations (use full paths)
cd D:\hospital-management-V2\backend\services-v2
```

### macOS/Linux (Bash)

```bash
# Find process using port
lsof -i :3001
ps aux | grep node

# Kill process
kill -9 <PID>
pkill -f "node.*identity-service"

# Health check
curl http://localhost:3001/health

# View logs
docker logs hospital-identity-service-v2 -f

# Environment variables
export NODE_ENV=development
printenv
```

---

## Troubleshooting

### Port Already in Use

**Windows:**
```powershell
# Find and kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use Docker
docker ps
docker stop hospital-identity-service-v2
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>

# Or use Docker
docker ps
docker stop hospital-identity-service-v2
```

### Docker Issues

```bash
# Check logs
docker logs hospital-identity-service-v2

# Restart
docker restart hospital-identity-service-v2

# Clean slate
npm run dev:clean
npm run dev:core
```

### Database Connection Failed

**Step 1: Verify Credentials**
```bash
# Windows
type backend\services-v2\.env

# macOS/Linux
cat backend/services-v2/.env
```

**Step 2: Use Supabase MCP to Verify**
- Check project ID matches SUPABASE_URL
- Verify service role key is valid
- Check schema exists

**Step 3: Test Connection**
```bash
# Windows PowerShell
$headers = @{ "apikey" = "YOUR_KEY" }
Invoke-WebRequest -Uri "https://YOUR_PROJECT.supabase.co/rest/v1/" -Headers $headers

# macOS/Linux
curl -H "apikey: YOUR_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
```

**Step 4: Check Supabase Optimization Config**
- Location: `shared/infrastructure/database/supabase-optimization.config.ts`
- Verify connection pool settings
- Check max connections (15 for dev, 20 for prod)
- Ensure not exceeding Supabase free tier limits (60 connections)

### Tests Failing

```bash
# Clear cache
npm test -- --clearCache

# Run specific test
npm test -- CreateUserUseCase.test.ts

# Debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Build Errors

**Windows:**
```powershell
# Clean build
Remove-Item -Recurse -Force dist
npm run build

# Check TypeScript config
type tsconfig.json

# Check for circular dependencies
npm run build 2>&1 | Select-String "circular"
```

**macOS/Linux:**
```bash
# Clean build
rm -rf dist && npm run build

# Check TypeScript config
cat tsconfig.json

# Check for circular dependencies
npm run build 2>&1 | grep "circular"
```

### Common Issues

**1. TypeScript Errors**
- Check `tsconfig.json` paths configuration
- Verify `tsc-alias` is installed
- Run `npm run build` to see detailed errors

**2. Module Resolution**
- Ensure `@shared` alias is configured in `tsconfig.json`
- Check `paths` in `tsconfig.json`
- Verify imports use correct paths

**3. Supabase Connection Pool Exhausted**
- Check active connections via Supabase MCP
- Verify connection pool settings in `supabase-optimization.config.ts`
- Ensure services are closing connections properly
- Free tier limit: 60 connections

**4. RabbitMQ Connection Failed**
- Verify RabbitMQ is running: `docker ps | grep rabbitmq`
- Check credentials: admin/admin (default)
- Verify port 5673 is not in use
- Check RabbitMQ UI: http://localhost:15673

**5. Redis Connection Failed**
- Verify Redis is running: `docker ps | grep redis`
- Check port 6380 is not in use
- Test connection: `redis-cli -p 6380 ping`

**6. Frontend Build Errors**
- Clear Next.js cache: `rm -rf .next` (or `Remove-Item -Recurse .next`)
- Reinstall dependencies: `npm install`
- Check Node version: `node --version` (>= 18.0.0)
- Verify Tailwind CSS config

---

## Dependencies

### Root Dependencies

**Location**: `package.json` (repository root)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.56.0",
    "axios": "^1.10.0",
    "context7": "^1.0.3",
    "dotenv": "^17.2.1",
    "mcp-knowledge-graph": "^1.2.0",
    "puppeteer": "^24.11.0",
    "typescript": "^5.8.3"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "playwright": "^1.56.0",
    "ts-jest": "^29.1.2"
  }
}
```

### Backend Service Dependencies

**Common Dependencies** (all services):
- `express`: ^4.18.2
- `typescript`: ^5.2.2
- `@supabase/supabase-js`: ^2.38.0
- `amqplib`: ^0.10.3 (RabbitMQ)
- `redis`: ^4.6.10
- `pino`: ^10.1.0 (logging)
- `jest`: ^29.7.0 (testing)
- `dotenv`: ^16.3.1

**Service-Specific**:
- Identity: `bcrypt`, `jsonwebtoken`, `resend`, `@sendgrid/mail`
- Notifications: `@sendgrid/mail`, `twilio`
- API Gateway: `helmet`, `express-rate-limit`, `prom-client`

### Frontend Dependencies

**Location**: `frontend/package.json`

```json
{
  "dependencies": {
    "next": "15.3.2",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "tailwindcss": "^4.1.7",
    "typescript": "5.8.3",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "eslint": "^9.0.0"
  }
}
```

### Installing Dependencies

```bash
# Root dependencies
npm install

# Backend services (all)
cd backend/services-v2
npm run install:all

# Specific service
cd backend/services-v2/identity-service
npm install

# Frontend
cd frontend
npm install
```

---

## Resources

### Internal Documentation

- [README.md](./README.md) - Project overview & quick start
- [backend/services-v2/README.md](./backend/services-v2/README.md) - Services detailed overview
- [backend/services-v2/PORT-MAPPING.md](./backend/services-v2/PORT-MAPPING.md) - Port configuration
- [backend/services-v2/COMPREHENSIVE_AUDIT_REPORT.md](./backend/services-v2/COMPREHENSIVE_AUDIT_REPORT.md) - Architecture audit
- [.augment/rules/AI-behavior.md](./.augment/rules/AI-behavior.md) - AI agent behavior rules

### Service-Specific Documentation

- [identity-service/README.md](./backend/services-v2/identity-service/README.md)
- [patient-registry-service/README.md](./backend/services-v2/patient-registry-service/README.md)
- [provider-staff-service/README.md](./backend/services-v2/provider-staff-service/README.md)
- [appointments-service/README.md](./backend/services-v2/appointments-service/README.md)
- [clinical-emr-service/README.md](./backend/services-v2/clinical-emr-service/README.md)
- [billing-service/README.md](./backend/services-v2/billing-service/README.md)
- [notifications-service/README.md](./backend/services-v2/notifications-service/README.md)
- [api-gateway/README.md](./backend/services-v2/api-gateway/README.md)

### External Resources

**Architecture & Patterns:**
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - Uncle Bob's original article
- [DDD](https://martinfowler.com/bliki/DomainDrivenDesign.html) - Domain-Driven Design by Martin Fowler
- [CQRS](https://martinfowler.com/bliki/CQRS.html) - Command Query Responsibility Segregation
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html) - Event-driven systems

**Technologies:**
- [Supabase Docs](https://supabase.com/docs) - Database & authentication
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html) - Message broker
- [Redis Documentation](https://redis.io/docs/) - Caching & rate limiting
- [Next.js 15 Docs](https://nextjs.org/docs) - Frontend framework
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide

**Testing:**
- [Jest Documentation](https://jestjs.io/docs/getting-started) - Testing framework
- [Testing Library](https://testing-library.com/docs/) - React testing
- [Playwright](https://playwright.dev/docs/intro) - E2E testing

**Vietnamese Healthcare:**
- [BHYT Guidelines](https://baohiemxahoi.gov.vn/) - Vietnamese health insurance
- [FHIR R4](https://www.hl7.org/fhir/) - Healthcare data standards

---

## Quick Reference Card

### Most Used Commands

```bash
# Start development
cd backend/services-v2
npm run dev:infrastructure  # Start Redis + RabbitMQ
npm run dev:core           # Start core services

# Health checks
curl http://localhost:3001/health  # Identity
curl http://localhost:3002/health  # Patient
curl http://localhost:3003/health  # Provider

# Build & test
npm run build:all
npm run test:all

# Cleanup
npm run dev:stop
npm run dev:clean
```

### Critical Paths

```
D:\hospital-management-V2\backend\services-v2\          # Services root
D:\hospital-management-V2\backend\services-v2\shared\   # Shared modules
D:\hospital-management-V2\frontend\                     # Frontend
D:\hospital-management-V2\.augment\rules\               # AI rules
```

### Environment Variables (Required)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_JWT_SECRET=your-jwt-secret
NODE_ENV=development
```

### Key Contacts & Support

- **Repository**: https://github.com/Kutou01/hospital-management
- **Issues**: https://github.com/Kutou01/hospital-management/issues
- **Supabase Project**: Verify via Supabase MCP

---

**Version**: 2.0.0-alpha
**Last Updated**: 2025-01-11
**For Coding Agents**: Minimal, machine-friendly guide. Follow strictly.
**Platform**: Windows (Primary) | macOS/Linux (Supported)
