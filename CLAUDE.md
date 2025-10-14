# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hospital Management System V2 - A microservices-based healthcare management platform built with Clean Architecture, Domain-Driven Design (DDD), CQRS, and Event-Driven patterns.

**Status**: 🚧 In Active Development (40-50% Complete)
**Version**: 2.0.0-alpha

## Technology Stack

- **Runtime**: Node.js >= 18.0.0
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL) with schema-per-service isolation
- **Caching**: Redis 7
- **Messaging**: RabbitMQ 3
- **Testing**: Jest with ts-jest
- **Containerization**: Docker & Docker Compose

## Common Commands

### Development Setup

```bash
# From repository root - Install dependencies
cd backend/services-v2
npm install

# Configure environment (required before running)
# Create .env file in backend/services-v2/ with Supabase credentials
cp .env.example .env
```

### Running Services

```bash
# All commands run from: backend/services-v2/

# Start infrastructure only (Redis + RabbitMQ)
npm run dev:infrastructure

# Start core services (Identity, Patient Registry, Provider/Staff)
npm run dev:core

# Start all services (including WIP services)
npm run dev:all

# Stop all services
npm run dev:stop

# Clean slate (remove containers + volumes)
npm run dev:clean
```

### Building Services

```bash
# From: backend/services-v2/

# Build all services
npm run build:all

# Build specific service
npm run build:identity
npm run build:patient
npm run build:provider
npm run build:scheduling
npm run build:clinical
npm run build:billing
npm run build:notifications
```

### Testing

```bash
# From: backend/services-v2/

# Run all service tests
npm run test:all

# Test specific service
npm run test:identity
npm run test:patient
npm run test:provider

# Within a specific service directory (e.g., identity-service):
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm test -- tests/unit      # Unit tests only
npm test -- tests/integration  # Integration tests only
npm test -- CreateUserUseCase.test.ts  # Specific test file
```

### Health Checks and Monitoring

```bash
# From: backend/services-v2/

# Check all services health
npm run health:check

# Check individual service
curl http://localhost:3021/health  # Identity Service
curl http://localhost:3023/health  # Patient Registry
curl http://localhost:3022/health  # Provider/Staff

# View logs
npm run logs:all              # All services
npm run logs:identity         # Specific service
```

### Service-Level Development

```bash
# Work on a single service (e.g., identity-service)
cd backend/services-v2/identity-service

npm run dev                 # Start in dev mode
npm run build               # Build TypeScript
npm test                    # Run tests
npm run lint                # Run ESLint
npm run lint:fix            # Fix linting issues
```

## Architecture Overview

### Microservices Structure

The system consists of 7 microservices following Clean Architecture principles:

**Production-Ready Services** (3/7):
- `identity-service` (Port 3021) - Authentication, Authorization, RBAC
- `patient-registry-service` (Port 3023) - Patient Management
- `provider-staff-service` (Port 3022) - Doctor/Staff Management

**In Development** (4/7):
- `scheduling-service` (Port 3024) - Appointments & Queue Management
- `clinical-emr-service` (Port 3027) - Electronic Medical Records
- `billing-service` (Port 3029) - Payments & Insurance Claims
- `notifications-service` (Port 3031) - Multi-channel Notifications

**Planned**:
- `api-gateway` (Port 3101) - Unified API Entry Point

### Clean Architecture Layers

Each service follows a strict 4-layer architecture:

```
<service-name>/
├── src/
│   ├── domain/              # Core business logic (no external dependencies)
│   │   ├── entities/        # Business entities
│   │   ├── value-objects/   # Immutable value types
│   │   ├── aggregates/      # Aggregate roots (DDD)
│   │   ├── events/          # Domain events
│   │   └── repositories/    # Repository interfaces (contracts only)
│   │
│   ├── application/         # Use cases (depends only on domain)
│   │   ├── use-cases/       # Business use cases
│   │   ├── commands/        # CQRS commands
│   │   ├── queries/         # CQRS queries
│   │   └── services/        # Application services
│   │
│   ├── infrastructure/      # External integrations
│   │   ├── repositories/    # Repository implementations (Supabase)
│   │   ├── auth/            # Authentication (Supabase Auth)
│   │   ├── cache/           # Caching (Redis)
│   │   ├── events/          # Event bus (RabbitMQ)
│   │   └── resilience/      # Circuit breakers, graceful degradation
│   │
│   ├── presentation/        # API layer
│   │   ├── controllers/     # HTTP controllers
│   │   ├── routes/          # Express routes
│   │   ├── dto/             # Data transfer objects
│   │   └── middleware/      # Request middleware (auth, validation)
│   │
│   └── main.ts              # Application entry point
│
├── tests/
│   ├── unit/                # Fast, isolated tests
│   ├── integration/         # Tests with external dependencies
│   ├── fixtures/            # Test data
│   └── helpers/             # Test utilities
│
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Critical Architecture Rules

**Dependency Direction** (strictly enforced):
```
✅ Allowed:
- domain → (no dependencies)
- application → domain
- infrastructure → domain, application
- presentation → domain, application, infrastructure

❌ Forbidden:
- domain → anything else
- application → infrastructure, presentation
- infrastructure → presentation
```

### Database Architecture

- **Schema-per-Service**: Each service has an isolated PostgreSQL schema in Supabase
- **No Cross-Service Foreign Keys**: Services use UUIDs for soft references
- **Schemas**: `auth_schema`, `patient_schema`, `provider_schema`, `scheduling_schema`, `clinical_schema`, `billing_schema`, `notification_schema`
- **Row Level Security (RLS)**: Enabled on all sensitive tables
- **Audit Logging**: All CRUD operations tracked for HIPAA compliance

### Event-Driven Communication

- **Event Bus**: RabbitMQ for inter-service communication
- **Event Naming**: `<service>.<entity>.<action>` (e.g., `patient.patient.registered`)
- **Domain Events**: Published when aggregate state changes
- **Idempotency**: Event handlers must be idempotent

## TypeScript Configuration

### Path Aliases

All services use consistent path aliases (defined in `tsconfig.json`):

```typescript
// Import examples
import { User } from '@domain/entities/User';
import { CreateUserUseCase } from '@application/use-cases/CreateUserUseCase';
import { SupabaseUserRepository } from '@infrastructure/repositories/SupabaseUserRepository';
import { UserController } from '@presentation/controllers/UserController';
import { AggregateRoot } from '@shared/domain';
```

### Strict Mode Settings

- `strict: true` - All strict checks enabled
- `noUnusedLocals: true` - No unused variables allowed
- `noUnusedParameters: true` - No unused parameters allowed
- `noImplicitReturns: true` - All code paths must return
- `noFallthroughCasesInSwitch: true` - Switch cases must break
- **No `any` types** - Use explicit interfaces/types

## Testing Guidelines

### Test Structure

Tests are organized by type:
- `tests/unit/` - Fast, isolated tests (no external dependencies)
- `tests/integration/` - Tests with real Supabase/Redis/RabbitMQ
- `tests/fixtures/` - Shared test data
- `tests/helpers/` - Test utilities and factories

### Test Configuration

The identity-service uses Jest projects configuration:
- **Unit Tests**: 5 second timeout, 100% max workers
- **Integration Tests**: 30 second timeout, 50% max workers

When writing tests, place them in the appropriate directory based on whether they use external dependencies.

### Running Tests

```bash
# Run all tests in a service
npm test

# Run only unit tests
npm test -- tests/unit

# Run only integration tests
npm test -- tests/integration

# Run specific test file
npm test -- CreateUserUseCase.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Naming Convention

```typescript
// Filename: <ComponentName>.test.ts
// Example: CreateUserUseCase.test.ts

describe('CreateUserUseCase', () => {
  describe('execute', () => {
    it('should create user with valid data', async () => {
      // Arrange, Act, Assert
    });

    it('should throw error when email already exists', async () => {
      // Test error cases
    });
  });
});
```

## Environment Variables

**Location**: `backend/services-v2/.env`

**Required Variables**:
```env
# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_JWT_SECRET=your-jwt-secret

# Service Configuration
NODE_ENV=development|production
JWT_SECRET=your-service-jwt-secret

# Infrastructure (auto-configured in Docker)
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
```

**⚠️ Security**: Never commit `.env` files. All secrets must be stored securely.

## Port Mapping

| Service | Port | Status |
|---------|------|--------|
| API Gateway | 3101 | ❌ Not Started |
| Identity Service | 3021 | ✅ Production-Ready |
| Provider/Staff Service | 3022 | ✅ Production-Ready |
| Patient Registry | 3023 | ✅ Production-Ready |
| Scheduling Service | 3024 | 🔄 In Development |
| Clinical EMR Service | 3027 | 🔄 In Development |
| Billing Service | 3029 | 🔄 In Development |
| Notifications Service | 3031 | 🔄 In Development |
| Redis | 6380 | ✅ Infrastructure |
| RabbitMQ | 5673 | ✅ Infrastructure |
| RabbitMQ Management | 15673 | ✅ Infrastructure |

## Service-Specific Notes

### Identity Service (Port 3021)

**Status**: ✅ Production-Ready (97.9% test coverage)

Key features:
- JWT-based authentication with Supabase Auth
- Pure RBAC system with 5 core roles (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT)
- Permission-based access control (`resource:action` format)
- Circuit breaker pattern with graceful degradation
- HIPAA compliance with audit logging
- Vietnamese healthcare standards support

**API Endpoints**:
- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - Logout user
- `GET /api/v1/users/:userId` - Get user profile
- `PATCH /api/v1/users/:userId` - Update user
- `GET /api/v1/permissions/:userId` - Get user permissions
- `GET /health` - Health check with component details

### Patient Registry Service (Port 3023)

**Status**: ✅ Production-Ready

Key features:
- Patient registration with Vietnamese ID validation
- Medical history tracking
- Emergency contact management
- Insurance information (BHYT/BHTN)
- HIPAA-compliant data handling

### Provider/Staff Service (Port 3022)

**Status**: ✅ Production-Ready

Key features:
- Doctor/nurse profile management
- Medical credentials & certifications
- Department assignments
- Working schedules
- Specialization tracking

## Code Style and Conventions

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Domain Types | PascalCase | `User`, `Patient`, `Appointment` |
| Interfaces | PascalCase with `I` prefix | `IUserRepository`, `IEventBus` |
| Variables | camelCase | `userId`, `patientName` |
| Constants | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| Environment Variables | UPPER_SNAKE_CASE | `SUPABASE_URL`, `JWT_SECRET` |
| REST Endpoints | kebab-case | `/api/users`, `/api/patient-records` |
| Files | kebab-case | `user-repository.ts`, `create-user-use-case.ts` |

### Import Organization

Organize imports in this order:
```typescript
// 1. External dependencies
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// 2. Shared domain
import { AggregateRoot } from '@shared/domain';

// 3. Internal domain
import { User } from '@domain/entities/User';

// 4. Application layer
import { CreateUserUseCase } from '@application/use-cases/CreateUserUseCase';

// 5. Infrastructure
import { SupabaseUserRepository } from '@infrastructure/repositories/SupabaseUserRepository';
```

## Git Workflow

### Commit Message Format

Follow Conventional Commits:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes**: Service names (`identity`, `patient`, `provider`, `scheduling`, `clinical`, `billing`, `notifications`)

**Examples**:
```bash
feat(patient): add medical history tracking
fix(identity): resolve JWT expiration bug
docs(readme): update V2 quick start guide
test(provider): add credential validation tests
refactor(scheduling): improve appointment conflict detection
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker logs hospital-identity-service-v2

# Restart service
docker restart hospital-identity-service-v2

# Clean slate
cd backend/services-v2
npm run dev:clean
npm run dev:core
```

### Port Already in Use

```bash
# Find process using port (Windows)
netstat -ano | findstr :3021

# Kill process (Windows)
taskkill /PID <PID> /F

# Find process using port (macOS/Linux)
lsof -i :3021

# Kill process (macOS/Linux)
kill -9 <PID>
```

### Tests Failing

```bash
# Clear Jest cache
cd identity-service
npm test -- --clearCache

# Run specific test
npm test -- CreateUserUseCase.test.ts

# Run with verbose output
npm test -- --verbose
```

### Database Connection Issues

```bash
# Verify Supabase credentials in .env
cat backend/services-v2/.env

# Test health endpoint
curl http://localhost:3021/health
```

## Security Best Practices

### Authentication & Authorization
- All API calls require valid JWT (except public endpoints)
- RBAC with 5 core roles (SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PATIENT)
- Permission format: `resource:action` (e.g., `patients:read`, `medical_records:write`)
- Wildcard permissions supported (`*:*`, `patients:*`)

### HIPAA Compliance
- Audit logging enabled for all operations
- PHI data encryption at rest and in transit
- Row Level Security (RLS) on sensitive tables
- Emergency access logging for break-glass scenarios

### Vietnamese Healthcare Standards
- Support for BHYT/BHTN insurance
- Vietnamese ID (Citizen ID) validation
- Ministry of Health reporting standards compliance

## Additional Resources

- **AGENTS.md** - Comprehensive agent guidelines (machine-friendly documentation)
- **Service READMEs** - Each service has detailed README in its directory
- **Identity Service Documentation**:
  - `identity-service/docs/AI_AGENT_GUIDE.md` - AI agent guidelines
  - `identity-service/docs/DATABASE_SCHEMA.md` - Database schema
  - `identity-service/docs/api/IDENTITY_API_CONTRACT.md` - API contracts
  - `identity-service/docs/ops/IDENTITY_RUNBOOK.md` - Operational runbook

## Key Principles for Claude Code

1. **Respect Clean Architecture Boundaries**: Never import from outer layers into inner layers
2. **Write Tests First**: All new features must have unit tests (>= 90% coverage target for domain logic)
3. **Use Path Aliases**: Always use `@domain`, `@application`, `@infrastructure`, `@presentation` imports
4. **No `any` Types**: Use explicit interfaces and types
5. **Event-Driven Communication**: Services communicate via domain events, not direct calls
6. **Schema-per-Service**: Each service owns its database schema exclusively
7. **HIPAA Compliance**: Never log sensitive medical data, maintain audit trails
8. **TypeScript Strict Mode**: All code must pass strict type checking
9. **Idempotent Operations**: All event handlers and critical operations must be idempotent
10. **Security First**: Validate all inputs, check permissions, log security events
