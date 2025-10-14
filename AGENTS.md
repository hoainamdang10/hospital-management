# Hospital Management System V2 - Agent Guidelines

> **Machine-friendly documentation for coding agents working with Clean Architecture microservices**

## 1. Repository Overview

**Project**: Hospital Management System V2
**Architecture**: Clean Architecture + DDD + CQRS + Event-Driven Microservices
**Status**: 🚧 In Active Development (40-50% Complete)
**Version**: 2.0.0-alpha

### Tech Stack
- **Runtime**: Node.js >= 18.0.0, npm >= 9.0.0
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL) with schema-per-service
- **Caching**: Redis 7
- **Messaging**: RabbitMQ 3
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest
- **Frontend**: Next.js 15 + React 18 + TypeScript

### Service Status
**Production-Ready (3/7)**:
- `identity-service` - Authentication & Authorization (Port 3021)
- `patient-registry-service` - Patient Management (Port 3023)
- `provider-staff-service` - Doctor/Staff Management (Port 3022)

**In Development (4/7)**:
- `scheduling-service` - Appointments & Queue (Port 3024)
- `clinical-emr-service` - Medical Records & FHIR (Port 3027)
- `billing-service` - Payments & Insurance (Port 3029)
- `notifications-service` - Multi-channel Alerts (Port 3031)

**Not Started (1/7)**:
- `api-gateway` - Unified Entry Point (Port 3101)

---

## 2. Project Structure

```
hospital-management-V2/
├── backend/
│   └── services-v2/              # Clean Architecture Services
│       ├── identity-service/           # ✅ Auth & User Management
│       ├── patient-registry-service/   # ✅ Patient Management
│       ├── provider-staff-service/     # ✅ Doctor/Staff Management
│       ├── scheduling-service/         # 🔄 Appointments
│       ├── clinical-emr-service/       # 🔄 Medical Records
│       ├── billing-service/            # 🔄 Billing
│       ├── notifications-service/      # 🔄 Notifications
│       ├── api-gateway/                # ❌ API Gateway (planned)
│       ├── shared/                     # Shared domain primitives
│       │   ├── domain/                 # Base entities, value objects
│       │   ├── application/            # Base use cases
│       │   ├── infrastructure/         # Event bus, middleware
│       │   ├── events/                 # Domain events
│       │   ├── testing/                # Test frameworks
│       │   └── workflows/              # Cross-service workflows
│       ├── scripts/                    # Deployment & validation
│       ├── docker-compose.v2.yml       # V2 orchestration
│       └── package.json                # Monorepo scripts
│
├── frontend/                     # Next.js 15 Application
│   ├── app/                     # App Router
│   ├── components/              # React components
│   ├── modules/                 # Feature modules
│   └── middleware.ts            # Auth middleware
│
├── AGENTS.md                    # 🤖 This file
├── DEVELOPMENT_RULES.md         # Development standards
├── README.md                    # Human-readable overview
└── package.json                 # Root dependencies
```

### Service Internal Structure (Clean Architecture)
```
<service-name>/
├── src/
│   ├── domain/                  # Business logic (no dependencies)
│   │   ├── entities/           # Domain entities
│   │   ├── value-objects/      # Immutable value objects
│   │   ├── aggregates/         # Aggregate roots
│   │   ├── events/             # Domain events
│   │   └── repositories/       # Repository interfaces
│   ├── application/             # Use cases (depends on domain)
│   │   ├── use-cases/          # Business use cases
│   │   ├── commands/           # CQRS commands
│   │   ├── queries/            # CQRS queries
│   │   └── services/           # Application services
│   ├── infrastructure/          # External concerns
│   │   ├── persistence/        # Database implementations
│   │   ├── repositories/       # Repository implementations
│   │   ├── event-bus/          # RabbitMQ integration
│   │   └── cache/              # Redis integration
│   ├── presentation/            # API layer
│   │   ├── controllers/        # HTTP controllers
│   │   ├── routes/             # Express routes
│   │   ├── dto/                # Data transfer objects
│   │   └── middleware/         # Request middleware
│   └── main.ts                  # Application entry point
├── tests/
│   ├── unit/                    # Unit tests (domain/application)
│   ├── integration/             # Integration tests
│   ├── fixtures/                # Test data
│   └── helpers/                 # Test utilities
├── migrations/                  # Database migrations
├── Dockerfile                   # Container definition
├── package.json                 # Service dependencies
└── tsconfig.json                # TypeScript config
```

---

## 3. Setup & Installation

### Prerequisites
```bash
# Required versions
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
docker --version
```

### Initial Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd hospital-management-V2

# 2. Install root dependencies
npm install

# 3. Install backend services dependencies
cd backend/services-v2
npm install

# 4. Configure environment
# Create .env file in backend/services-v2/
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Environment Configuration
Create `backend/services-v2/.env`:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Service Configuration
NODE_ENV=development
JWT_SECRET=your_jwt_secret_for_services

# Infrastructure (auto-configured in docker-compose)
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
```

**⚠️ SECURITY**: Never commit `.env` files. Store secrets securely.

---

## 4. Build, Test, and Development Commands

### From `backend/services-v2/` directory:

#### Infrastructure Management
```bash
# Start Redis + RabbitMQ only
npm run dev:infrastructure

# Start core services (Identity, Patient, Provider)
npm run dev:core

# Start all services (including WIP)
npm run dev:all

# Stop all services
npm run dev:stop

# Clean slate (remove containers + volumes)
npm run dev:clean
```

#### Build Commands
```bash
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

#### Testing Commands
```bash
# Run all tests
npm run test:all

# Test specific service
npm run test:identity
npm run test:patient
npm run test:provider

# Inside a service directory:
cd identity-service
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:integration    # Integration tests only
```

#### Health Checks
```bash
# Check all services health
npm run health:check

# Check individual service
curl http://localhost:3021/health  # Identity
curl http://localhost:3023/health  # Patient
curl http://localhost:3022/health  # Provider
```

#### Logs
```bash
# View all logs
npm run logs:all

# View specific service logs
npm run logs:identity
npm run logs:patient
npm run logs:provider
```

#### Service-Specific Development
```bash
# Work on a single service
cd identity-service
npm run dev                 # Start in dev mode
npm run build               # Build TypeScript
npm run lint                # Run ESLint
npm run lint:fix            # Fix linting issues
npm run format              # Format with Prettier
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev                 # Start on http://localhost:3000
npm run build               # Production build
npm run lint                # Lint check
npm run typecheck           # TypeScript check
```

---

## 5. Testing Guidelines

### Test Framework
- **Framework**: Jest
- **Coverage Target**: >= 90% for domain logic
- **Test Types**: Unit, Integration, E2E

### Test Structure
```
tests/
├── unit/                        # Fast, isolated tests
│   ├── domain/                 # Domain entities, value objects
│   ├── application/            # Use cases, commands, queries
│   └── presentation/           # Controllers, DTOs
├── integration/                 # Tests with external dependencies
│   ├── repositories/           # Database integration
│   ├── event-bus/              # RabbitMQ integration
│   └── api/                    # Full API tests
├── fixtures/                    # Test data
│   ├── users.json
│   ├── patients.json
│   └── ...
└── helpers/                     # Test utilities
    ├── test-database.ts
    └── mock-factories.ts
```

### Test Naming Convention
```typescript
// Filename: *.test.ts
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

### Testing Best Practices
1. **Mock External Dependencies**: Never hit Supabase directly in tests
2. **Use Fixtures**: Store test data in `tests/fixtures/`
3. **Test Edge Cases**: Include error scenarios, boundary conditions
4. **Security Tests**: Regression tests for auth, permissions, billing
5. **Integration Tests**: Test repository implementations with test database

### Running Tests
```bash
# Before merging
cd backend/services-v2
npm run test:all

# Local iteration
cd identity-service
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:integration    # Integration only
```

---

## 6. Coding Style & Naming Conventions

### TypeScript Configuration
- **Strict Mode**: Enabled
- **No `any`**: Use interfaces/types instead
- **Explicit Return Types**: Required for public methods

### Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Domain Types | PascalCase | `User`, `Patient`, `Appointment` |
| Interfaces | PascalCase with `I` prefix | `IUserRepository`, `IEventBus` |
| Variables | camelCase | `userId`, `patientName` |
| Constants | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| Environment Variables | UPPER_SNAKE_CASE | `SUPABASE_URL`, `JWT_SECRET` |
| REST Endpoints | kebab-case | `/api/users`, `/api/patient-records` |
| Files | kebab-case | `user-repository.ts`, `create-user.use-case.ts` |

### Code Formatting
```bash
# Prettier defaults
- Indentation: 2 spaces
- Quotes: Single quotes
- Semicolons: Required
- Trailing commas: ES5

# Format before commit
npm run format
```

### Clean Architecture Boundaries
**CRITICAL**: Respect dependency rules:
```
✅ Allowed:
- domain → (no dependencies)
- application → domain
- infrastructure → domain, application
- presentation → domain, application

❌ Forbidden:
- domain → application, infrastructure, presentation
- application → infrastructure, presentation
- infrastructure → presentation
```

### Import Organization
```typescript
// 1. External dependencies
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// 2. Shared domain
import { AggregateRoot } from '@shared/domain';

// 3. Internal domain
import { User } from '../domain/entities/User';

// 4. Application layer
import { CreateUserUseCase } from '../application/use-cases/CreateUserUseCase';

// 5. Infrastructure
import { SupabaseUserRepository } from '../infrastructure/repositories/SupabaseUserRepository';
```

---

## 7. Architecture Principles

### Clean Architecture Layers

#### 1. Domain Layer (Core Business Logic)
- **No external dependencies**
- Contains: Entities, Value Objects, Aggregates, Domain Events
- Pure business rules
- Framework-agnostic

```typescript
// Example: domain/entities/User.ts
export class User extends AggregateRoot {
  private constructor(
    id: string,
    private email: Email,
    private password: Password,
    private role: UserRole
  ) {
    super(id);
  }

  public static create(props: UserProps): User {
    // Business validation
    return new User(/* ... */);
  }
}
```

#### 2. Application Layer (Use Cases)
- **Depends only on domain**
- Contains: Use Cases, Commands, Queries, Application Services
- Orchestrates domain objects
- Transaction boundaries

```typescript
// Example: application/use-cases/CreateUserUseCase.ts
export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: IEventBus
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // Use case logic
    const user = User.create(command);
    await this.userRepository.save(user);
    await this.eventBus.publish(new UserCreatedEvent(user));
    return user;
  }
}
```

#### 3. Infrastructure Layer (External Concerns)
- **Implements interfaces from domain/application**
- Contains: Repositories, Event Bus, Cache, External APIs
- Database access
- Third-party integrations

```typescript
// Example: infrastructure/repositories/SupabaseUserRepository.ts
export class SupabaseUserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async save(user: User): Promise<void> {
    // Supabase implementation
  }
}
```

#### 4. Presentation Layer (API)
- **HTTP/REST interface**
- Contains: Controllers, Routes, DTOs, Middleware
- Request validation
- Response formatting

```typescript
// Example: presentation/controllers/UserController.ts
export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  async createUser(req: Request, res: Response): Promise<void> {
    const dto = CreateUserDTO.fromRequest(req.body);
    const user = await this.createUserUseCase.execute(dto);
    res.status(201).json(UserResponseDTO.fromDomain(user));
  }
}
```

### CQRS Pattern
- **Commands**: Modify state (Create, Update, Delete)
- **Queries**: Read state (no side effects)
- Separate models for read/write operations

### Event-Driven Communication
- **Domain Events**: Published when aggregate state changes
- **Event Bus**: RabbitMQ for inter-service communication
- **Event Handlers**: Subscribe to events from other services

```typescript
// Example: Publishing event
await this.eventBus.publish(new PatientRegisteredEvent({
  patientId: patient.id,
  timestamp: new Date()
}));

// Example: Handling event
@EventHandler(PatientRegisteredEvent)
export class SendWelcomeEmailHandler {
  async handle(event: PatientRegisteredEvent): Promise<void> {
    // Send welcome email
  }
}
```

---

## 8. Security & Configuration

### Environment Variables
**Location**: `backend/services-v2/.env`

**Required Variables**:
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_JWT_SECRET=your-jwt-secret

# Service
NODE_ENV=development|production
JWT_SECRET=your-service-jwt-secret
PORT=3001

# Infrastructure
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
```

### Security Best Practices

#### 1. Authentication & Authorization
- **JWT Validation**: All API calls require valid JWT
- **Role-Based Access Control (RBAC)**: 5 core roles
  - `SUPER_ADMIN` - System administration
  - `ADMIN` - Organization management
  - `DOCTOR` - Medical staff
  - `NURSE` - Nursing staff
  - `PATIENT` - Patient access
- **Password Policies**: Enforced in identity-service
- **2FA Support**: Available for sensitive operations

#### 2. Database Security
- **Row Level Security (RLS)**: Enabled on all sensitive tables
- **Schema-per-Service**: Each service has isolated schema
- **Audit Logging**: Track all CRUD operations
- **HIPAA Compliance**: Healthcare data protection standards

#### 3. API Security
- **Rate Limiting**: Configured in `identity-service/src/main.ts`
- **CORS**: Whitelist allowed origins
- **Helmet.js**: Security headers
- **Input Validation**: All inputs sanitized
- **No Sensitive Data in Logs**: Never log passwords, tokens, medical records

#### 4. Configuration Management
- **Never commit `.env` files**
- **Rotate keys after staging deployments**
- **Use environment variables, not hardcoded values**
- **Validate JWT changes against password policy tests**

### Rate Limiting Configuration
```typescript
// identity-service/src/main.ts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

---

## 9. Service-Specific Guidelines

### Identity Service (Port 3021)
**Status**: ✅ Production-Ready
**Responsibilities**: Authentication, Authorization, User Management, RBAC

**Key Features**:
- JWT-based authentication
- Pure RBAC with 5 core roles
- Password policies & validation
- Login attempt tracking
- Session management
- MFA support (planned)

**Database Schema**: `auth_schema`
**Key Tables**: `users`, `roles`, `user_roles`, `login_attempts`, `user_sessions`

**API Endpoints**:
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
POST   /api/auth/logout            # Logout
POST   /api/auth/refresh           # Refresh token
GET    /api/users/:id              # Get user by ID
PUT    /api/users/:id              # Update user
DELETE /api/users/:id              # Delete user
GET    /api/users/:id/permissions  # Check permissions
```

**Development**:
```bash
cd backend/services-v2/identity-service
npm run dev                 # Start dev server
npm test                    # Run tests
npm run test:coverage       # Coverage report
```

---

### Patient Registry Service (Port 3023)
**Status**: ✅ Production-Ready
**Responsibilities**: Patient Management, Medical History, Demographics

**Key Features**:
- Patient registration with Vietnamese ID validation
- Medical history tracking
- Emergency contact management
- Insurance information (BHYT/BHTN)
- HIPAA-compliant data handling

**Database Schema**: `patient_schema`
**Key Tables**: `patients`, `medical_history`, `emergency_contacts`, `insurance_info`

**API Endpoints**:
```
POST   /api/patients               # Register patient
GET    /api/patients/:id           # Get patient details
PUT    /api/patients/:id           # Update patient
DELETE /api/patients/:id           # Delete patient
GET    /api/patients/:id/history   # Medical history
POST   /api/patients/:id/contacts  # Add emergency contact
```

**Development**:
```bash
cd backend/services-v2/patient-registry-service
npm run dev
npm test
```

---

### Provider/Staff Service (Port 3022)
**Status**: ✅ Production-Ready
**Responsibilities**: Doctor/Staff Management, Credentials, Schedules

**Key Features**:
- Doctor/nurse profile management
- Medical credentials & certifications
- Department assignments
- Working schedules
- Specialization tracking

**Database Schema**: `provider_schema`
**Key Tables**: `providers`, `credentials`, `departments`, `schedules`

**API Endpoints**:
```
POST   /api/providers              # Register provider
GET    /api/providers/:id          # Get provider details
PUT    /api/providers/:id          # Update provider
GET    /api/providers/:id/schedule # Get schedule
POST   /api/providers/:id/credentials # Add credential
```

**Development**:
```bash
cd backend/services-v2/provider-staff-service
npm run dev
npm test
```

---

### Scheduling Service (Port 3024)
**Status**: 🔄 In Development
**Responsibilities**: Appointments, Queue Management, Calendar

**Planned Features**:
- Appointment booking
- Queue management
- Calendar integration
- Reminder notifications
- Conflict detection

**Database Schema**: `scheduling_schema`

---

### Clinical EMR Service (Port 3027)
**Status**: 🔄 In Development
**Responsibilities**: Medical Records, FHIR Compliance, Clinical Data

**Planned Features**:
- Electronic Medical Records (EMR)
- FHIR R4 compliance
- Clinical notes
- Lab results
- Prescription management

**Database Schema**: `clinical_schema`

---

### Billing Service (Port 3029)
**Status**: 🔄 In Development
**Responsibilities**: Payments, Insurance Claims, Invoicing

**Planned Features**:
- Invoice generation
- Payment processing
- Insurance claims (BHYT/BHTN)
- Payment history
- Refund management

**Database Schema**: `billing_schema`

---

### Notifications Service (Port 3031)
**Status**: 🔄 In Development
**Responsibilities**: Multi-channel Notifications, Alerts

**Planned Features**:
- Email notifications
- SMS alerts
- In-app notifications
- Push notifications
- Notification preferences

**Database Schema**: `notifications_schema`

---

## 10. Commit & Pull Request Guidelines

### Commit Message Format
Follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Scopes**: Service names
- `identity`, `patient`, `provider`, `scheduling`, `clinical`, `billing`, `notifications`

**Examples**:
```bash
feat(patient): add medical history tracking
fix(identity): resolve JWT expiration bug
docs(readme): update V2 quick start guide
test(provider): add credential validation tests
refactor(scheduling): improve appointment conflict detection
```

### Commit Best Practices
1. **Atomic Commits**: One logical change per commit
2. **Imperative Tone**: "Add feature" not "Added feature"
3. **Reference Tickets**: Include ticket IDs in footer
4. **Avoid Bundling**: Don't mix changes from different services

### Pull Request Guidelines

#### PR Title
```
[SERVICE] Type: Brief description
```
Examples:
```
[Identity] feat: Add MFA support
[Patient] fix: Resolve patient ID generation bug
[Provider] refactor: Improve credential validation
```

#### PR Description Template
```markdown
## Motivation
Why is this change needed?

## Changes
- List of changes made
- Architectural impacts
- Database schema changes

## Testing
- [ ] Unit tests pass (`npm run test:identity`)
- [ ] Integration tests pass
- [ ] Manual testing completed
- Screenshots (for frontend changes)

## Risks & Rollback
- Potential risks
- Rollback plan
- Migration notes (if applicable)

## Reviewers
@username1 @username2
```

#### PR Checklist
- [ ] Code follows Clean Architecture principles
- [ ] Tests added/updated (>= 90% coverage)
- [ ] Documentation updated
- [ ] No sensitive data in logs
- [ ] Environment variables documented
- [ ] Database migrations included (if schema changes)
- [ ] Security considerations addressed
- [ ] Performance impact assessed

---

## 11. Database Management

### Schema-per-Service Pattern
Each service has its own isolated schema:
- `auth_schema` - Identity Service
- `patient_schema` - Patient Registry
- `provider_schema` - Provider/Staff Service
- `scheduling_schema` - Scheduling Service
- `clinical_schema` - Clinical EMR Service
- `billing_schema` - Billing Service
- `notifications_schema` - Notifications Service

### Migration Management
**Location**: `<service>/migrations/`

**Naming Convention**: `<number>_<description>.sql`
```
001_create_users_table.sql
002_add_mfa_columns.sql
003_create_roles_table.sql
```

**Running Migrations**:
```bash
# Manual migration
psql -h <host> -U <user> -d <database> -f migrations/001_create_users_table.sql

# Automated (planned)
npm run migrate:up
npm run migrate:down
```

### Database Best Practices
1. **No Cross-Service Foreign Keys**: Use soft references (UUIDs)
2. **Enable RLS**: Row Level Security on sensitive tables
3. **Audit Logging**: Track all CRUD operations
4. **Indexes**: Add indexes for frequently queried columns
5. **Migrations**: Always include rollback scripts

---

## 12. Event-Driven Architecture

### Event Bus (RabbitMQ)
**Connection**: `amqp://admin:admin@rabbitmq-v2:5672`
**Management UI**: http://localhost:15673

### Event Naming Convention
```
<service>.<entity>.<action>
```

**Examples**:
- `identity.user.created`
- `patient.patient.registered`
- `scheduling.appointment.booked`
- `billing.payment.completed`

### Publishing Events
```typescript
import { EventBus } from '@shared/infrastructure/event-bus';

// Publish event
await eventBus.publish({
  type: 'patient.patient.registered',
  data: {
    patientId: patient.id,
    timestamp: new Date(),
    metadata: { /* ... */ }
  }
});
```

### Subscribing to Events
```typescript
import { EventHandler } from '@shared/infrastructure/event-bus';

@EventHandler('patient.patient.registered')
export class SendWelcomeEmailHandler {
  async handle(event: PatientRegisteredEvent): Promise<void> {
    // Handle event
    await this.emailService.sendWelcomeEmail(event.data.patientId);
  }
}
```

### Event Best Practices
1. **Idempotency**: Handlers should be idempotent
2. **Error Handling**: Implement retry logic with exponential backoff
3. **Dead Letter Queue**: Handle failed events
4. **Event Versioning**: Include version in event schema
5. **Monitoring**: Track event processing metrics

---

## 13. Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :3021  # macOS/Linux
netstat -ano | findstr :3021  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### 2. Docker Container Won't Start
```bash
# Check logs
docker logs hospital-identity-service-v2

# Restart container
docker restart hospital-identity-service-v2

# Clean slate
cd backend/services-v2
npm run dev:clean
npm run dev:core
```

#### 3. Database Connection Failed
```bash
# Verify Supabase credentials in .env
cat backend/services-v2/.env

# Test connection
curl -H "apikey: YOUR_ANON_KEY" \
  https://YOUR_PROJECT.supabase.co/rest/v1/
```

#### 4. Tests Failing
```bash
# Clear Jest cache
cd identity-service
npm test -- --clearCache

# Run specific test
npm test -- CreateUserUseCase.test.ts

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### 5. TypeScript Build Errors
```bash
# Clean build
rm -rf dist
npm run build

# Check TypeScript config
cat tsconfig.json
```

### Health Check Endpoints
```bash
# Check service health
curl http://localhost:3021/health  # Identity
curl http://localhost:3023/health  # Patient
curl http://localhost:3022/health  # Provider

# Expected response
{
  "status": "healthy",
  "service": "identity-service",
  "version": "2.0.0",
  "timestamp": "2025-01-07T10:00:00.000Z"
}
```

---

## 14. Additional Resources

### Documentation
- **[README.md](./README.md)** - Human-readable project overview
- **[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)** - Detailed development standards
- **[backend/services-v2/README.md](./backend/services-v2/README.md)** - V2 services overview
- **Service READMEs**: Each service has its own README with specific details

### Architecture Documents
- **[ARCHITECTURE_AUDIT_REPORT.md](./backend/services-v2/ARCHITECTURE_AUDIT_REPORT.md)** - Audit of completed services
- **[STRATEGIC_DEVELOPMENT_PLAN.md](./backend/services-v2/STRATEGIC_DEVELOPMENT_PLAN.md)** - 4-week completion roadmap
- **[PORT-MAPPING.md](./backend/services-v2/PORT-MAPPING.md)** - Service port configuration

### External Resources
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **DDD**: https://martinfowler.com/bliki/DomainDrivenDesign.html
- **CQRS**: https://martinfowler.com/bliki/CQRS.html
- **Event-Driven Architecture**: https://martinfowler.com/articles/201701-event-driven.html
- **Supabase Docs**: https://supabase.com/docs
- **RabbitMQ Tutorials**: https://www.rabbitmq.com/getstarted.html

---

## 15. Quick Reference

### Port Mapping
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
| Frontend | 3000 | ⚠️ V1 (needs migration) |

### Essential Commands
```bash
# Start development
cd backend/services-v2
npm run dev:core              # Core services only
npm run dev:all               # All services

# Testing
npm run test:all              # All tests
npm run test:identity         # Specific service

# Health checks
npm run health:check          # All services
curl http://localhost:3021/health  # Specific service

# Logs
npm run logs:all              # All logs
npm run logs:identity         # Specific service

# Clean up
npm run dev:stop              # Stop services
npm run dev:clean             # Remove containers + volumes
```

### Environment Variables Quick Reference
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_JWT_SECRET=your-jwt-secret

# Service
NODE_ENV=development
JWT_SECRET=your-service-jwt-secret

# Infrastructure
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
```

---

**Last Updated**: 2025-01-07
**Version**: 2.0.0-alpha
**Maintained By**: Hospital Management System V2 Team

**For Coding Agents**: This document is optimized for machine readability. Follow the guidelines strictly to maintain code quality and architectural consistency.

