# AGENTS.md - Hospital Management System V2

> **Minimal, machine-friendly guide for coding agents**

## Quick Reference
Luôn sử dụng các mcp đã được cấu hình để tận dụng tối đa hiệu suất và hiệu quả trong việc phát triển và triển khai các dịch vụ.
Không được tạo md báo cáo, trừ khi user yêu cầu.
**Project**: Hospital Management System V2
**Architecture**: Clean Architecture + DDD + CQRS + Event-Driven
**Status**: 40-50% Complete
**Node**: >= 18.0.0 | **npm**: >= 9.0.0

### Essential Commands

```bash
# Setup
cd backend/services-v2 && npm install

# Infrastructure
npm run dev:infrastructure    # Redis + RabbitMQ
npm run dev:core             # Core services (Identity, Patient, Provider)
npm run dev:all              # All services

# Build & Test
npm run build:all            # Build all services
npm run test:all             # Run all tests

# Health Check
curl http://localhost:3021/health  # Identity
curl http://localhost:3023/health  # Patient
curl http://localhost:3022/health  # Provider

# Cleanup
npm run dev:stop             # Stop services
npm run dev:clean            # Remove containers + volumes
```

### Service Ports

| Service | Port | Status |
|---------|------|--------|
| identity-service | 3021 | ✅ Ready |
| patient-registry-service | 3023 | ✅ Ready |
| provider-staff-service | 3022 | ✅ Ready |
| appointments-service | 3024 | 🔄 Dev |
| clinical-emr-service | 3027 | 🔄 Dev |
| billing-service | 3029 | 🔄 Dev |
| notifications-service | 3031 | 🔄 Dev |
| api-gateway | 3101 | ❌ Not Started |
| Redis | 6380 | ✅ Infra |
| RabbitMQ | 5673 | ✅ Infra |
| RabbitMQ UI | 15673 | ✅ Infra |

---

## Repository Structure

```
hospital-management-V2/
├── backend/services-v2/         # Microservices root
│   ├── identity-service/       # Auth & User Management
│   ├── patient-registry-service/
│   ├── provider-staff-service/
│   ├── appointments-service/
│   ├── clinical-emr-service/
│   ├── billing-service/
│   ├── notifications-service/
│   ├── shared/                 # Shared domain primitives
│   ├── docker-compose.v2.yml   # Orchestration
│   └── package.json            # Monorepo scripts
├── frontend/                   # Next.js 15 app
└── AGENTS.md                   # This file
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
# Supabase (Required)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_JWT_SECRET=your-jwt-secret

# Service
NODE_ENV=development
JWT_SECRET=your-jwt-secret

# Infrastructure (auto-configured)
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
```

**⚠️ Never commit `.env` files**

### 4. Start Services

```bash
# Start infrastructure
npm run dev:infrastructure

# Start core services
npm run dev:core

# Verify
curl http://localhost:3021/health
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
curl http://localhost:3021/health
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

### Frontend

```bash
cd frontend
npm run dev                    # http://localhost:3000
npm run build                  # Production build
npm run typecheck              # TypeScript check
```

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

### Identity Service (3021) ✅

**Responsibilities**: Auth, User Management, RBAC

**Key Features**: JWT auth, 5 roles (SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PATIENT), password policies

**Schema**: `auth_schema`

**Endpoints**:
```
POST /api/auth/register
POST /api/auth/login
GET  /api/users/:id
```

### Patient Registry (3023) ✅

**Responsibilities**: Patient Management, Medical History

**Key Features**: Vietnamese ID validation, medical history, emergency contacts, insurance (BHYT/BHTN)

**Schema**: `patient_schema`

**Endpoints**:
```
POST /api/patients
GET  /api/patients/:id
GET  /api/patients/:id/history
```

### Provider/Staff (3022) ✅

**Responsibilities**: Doctor/Staff Management

**Key Features**: Credentials, departments, schedules, specializations

**Schema**: `provider_schema`

**Endpoints**:
```
POST /api/providers
GET  /api/providers/:id
GET  /api/providers/:id/schedule
```

### Appointments (3024) 🔄

**Responsibilities**: Appointments, Queue Management

**Planned**: Booking, queue, calendar, reminders, conflict detection

**Schema**: `appointments_schema`

### Clinical EMR (3027) 🔄

**Responsibilities**: Medical Records, FHIR Compliance

**Planned**: EMR, FHIR R4, clinical notes, lab results, prescriptions

**Schema**: `clinical_schema`

### Billing (3029) 🔄

**Responsibilities**: Payments, Insurance Claims

**Planned**: Invoices, payments, insurance (BHYT/BHTN), refunds

**Schema**: `billing_schema`

### Notifications (3031) 🔄

**Responsibilities**: Multi-channel Notifications

**Planned**: Email, SMS, in-app, push notifications

**Schema**: `notifications_schema`

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

**Scopes**: `identity`, `patient`, `provider`, `appointments`, `clinical`, `billing`, `notifications`

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
- `provider_schema` - Provider/Staff
- `appointments_schema` - Appointments
- `clinical_schema` - Clinical EMR
- `billing_schema` - Billing
- `notifications_schema` - Notifications

### Migrations

**Location**: `<service>/migrations/`

**Naming**: `001_create_users_table.sql`

**Best Practices**:
- No cross-service foreign keys (use UUIDs)
- Enable RLS on sensitive tables
- Add indexes for frequently queried columns
- Always include rollback scripts

---

## Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -i :3021              # macOS/Linux
netstat -ano | findstr :3021  # Windows

# Kill process
kill -9 <PID>              # macOS/Linux
taskkill /PID <PID> /F     # Windows
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

```bash
# Verify credentials
cat backend/services-v2/.env

# Test connection
curl -H "apikey: YOUR_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
```

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

```bash
# Clean build
rm -rf dist && npm run build

# Check config
cat tsconfig.json
```

---

## Resources

### Documentation

- [README.md](./README.md) - Project overview
- [backend/services-v2/README.md](./backend/services-v2/README.md) - Services overview
- [PORT-MAPPING.md](./backend/services-v2/PORT-MAPPING.md) - Port configuration

### External

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [DDD](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [CQRS](https://martinfowler.com/bliki/CQRS.html)
- [Supabase Docs](https://supabase.com/docs)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)

---

**Version**: 2.0.0-alpha
**Last Updated**: 2025-10-29
**For Coding Agents**: Minimal, machine-friendly guide. Follow strictly.
