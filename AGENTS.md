# AGENTS.md - Hospital Management System V2

**Machine-Friendly Documentation for Coding Agents**

## Overview

Hospital Management System V2 - Clean Architecture + DDD + CQRS + Event-Driven microservices.

**Architecture**: Clean Architecture (4 layers: Domain, Application, Infrastructure, Presentation)
**Tech Stack**: Node.js 18+, TypeScript, Docker, Supabase (PostgreSQL), Redis, RabbitMQ
**Services**: 7 core services (3 completed: Identity, Patient, Provider | 4 in development: Scheduling, Clinical, Billing, Notifications)
**Status**: 40-50% Complete

## Setup

### Prerequisites

```bash
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
docker --version
```

### Environment Configuration

Create `.env` in `backend/services-v2/`:

```bash
# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Service Config
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# Infrastructure (Auto-configured)
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3101
```

### Database Setup

Run in Supabase SQL Editor:

```sql
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS patient_schema;
CREATE SCHEMA IF NOT EXISTS provider_schema;
CREATE SCHEMA IF NOT EXISTS scheduling_schema;
CREATE SCHEMA IF NOT EXISTS clinical_schema;
CREATE SCHEMA IF NOT EXISTS billing_schema;
CREATE SCHEMA IF NOT EXISTS notification_schema;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Build

### Start Services

```bash
cd backend/services-v2

# Start infrastructure (Redis, RabbitMQ)
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d

# Start core services (Identity, Patient, Provider)
docker-compose -f docker-compose.v2.yml --profile core up -d

# Start all services (including in-development)
docker-compose -f docker-compose.v2.yml --profile dev up -d
```

### Docker Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down

# Clean restart
docker-compose down -v
docker-compose --profile core up -d
```

## Test

### Health Checks

```bash
# Identity Service
curl http://localhost:3021/health

# Patient Registry
curl http://localhost:3023/health

# Provider/Staff
curl http://localhost:3022/health
```

### Run Tests

```bash
# All services
cd backend/services-v2
npm run test:all

# Specific service
cd identity-service-consolidated
npm test
```

## Development Workflow

### Service Development

```bash
# Start individual services
cd backend
npm run dev:gateway    # API Gateway
npm run dev:doctor     # Doctor Service
npm run dev:patient    # Patient Service
npm run dev:appointment # Appointment Service

# Start multiple services
npm run dev:core       # Gateway + Core services
```

### Database Operations

```bash
# Setup database tables
cd backend
npm run setup:tables

# Run migrations
npm run migrate:all

# Seed test data
npm run db:seed

# Cleanup test data
npm run db:cleanup
```

### Code Quality

```bash
# Linting
cd backend
npm run lint

cd frontend
npm run lint

# Formatting
npm run format
```

## Conventions

### Naming Standards

- **Database**: snake_case (patient_profiles, medical_records)
- **API Endpoints**: kebab-case (/api/v1/patient-records)
- **TypeScript**: camelCase (variables), PascalCase (types)
- **Environment Variables**: UPPER_SNAKE_CASE

### File Structure - V2

```
hospital-management-V2/
├── backend/
│   └── services-v2/              # 🎯 Clean Architecture V2 Services
│       ├── identity-service/           # ✅ Auth & User Management
│       ├── patient-registry-service/   # ✅ Patient Management
│       ├── provider-staff-service/     # ✅ Doctor/Staff Management
│       ├── scheduling-service/         # 🔄 Appointments (In Development)
│       ├── clinical-emr-service/       # 🔄 Medical Records (In Development)
│       ├── billing-service/            # 🔄 Billing (In Development)
│       ├── notifications-service/      # 🔄 Notifications (In Development)
│       ├── shared/                     # Shared domain primitives
│       ├── scripts/                    # Deployment scripts
│       └── docker-compose.v2.yml       # V2 orchestration
├── frontend/                     # Next.js 15 (needs V2 migration)
├── README.md                     # Project overview
├── V2-QUICK-START.md            # Quick start guide
└── AGENTS.md                     # This file
```

### Service Structure (Clean Architecture)

```
service-name/
├── src/
│   ├── domain/            # Business logic, entities, value objects, domain events
│   ├── application/       # Use cases, CQRS handlers, application services
│   ├── infrastructure/    # Repositories, external services, database
│   └── presentation/      # Controllers, routes, DTOs
├── tests/
├── Dockerfile
└── package.json
```

### API Standards

- **Response Time**: < 200ms target
- **Error Format**: Standardized JSON with Vietnamese messages
- **Authentication**: JWT tokens via Auth Service
- **Rate Limiting**: 100 requests/minute per user

## Dependencies

### Runtime Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker**: Latest version
- **Docker Compose**: v2+

### Key Dependencies

- **Backend**: Express.js, TypeScript, Supabase client, Redis, RabbitMQ
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Infrastructure**: Docker, Redis, RabbitMQ, Prometheus, Grafana

### Service Ports - V2

```
# V2 Services (External Ports)
3021  - Identity Service (✅ Ready)
3023  - Patient Registry Service (✅ Ready)
3022  - Provider/Staff Service (✅ Ready)
3024  - Scheduling Service (🔄 In Development)
3027  - Clinical EMR Service (🔄 In Development)
3029  - Billing Service (🔄 In Development)
3031  - Notifications Service (🔄 In Development)
3101  - API Gateway V2 (❌ Not Started)

# Infrastructure
6380  - Redis V2
5673  - RabbitMQ V2
15673 - RabbitMQ Management UI V2

# Frontend
3000  - Next.js Frontend (⚠️ Still connects to V1)
```

## Quick Commands - V2

```bash
# Complete V2 development setup
cd backend/services-v2
docker-compose -f docker-compose.v2.yml --profile core up -d

# Check V2 service health
curl http://localhost:3021/health  # Identity
curl http://localhost:3023/health  # Patient Registry
curl http://localhost:3022/health  # Provider/Staff

# View V2 service logs
cd backend/services-v2
docker-compose logs -f identity-service
docker-compose logs -f patient-registry-service
docker-compose logs -f provider-staff-service

# Clean restart V2
docker-compose down && docker-compose --profile core up -d

# Stop all V2 services
docker-compose down

# Stop and remove all data (clean slate)
docker-compose down -v
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3000, 3100, 3200 are available
2. **Docker issues**: Restart Docker Desktop, run `docker compose down -v`
3. **Environment variables**: Verify all required .env files exist
4. **Database connection**: Check Supabase credentials and network

### Debug Commands

```bash
# Check service logs
docker compose logs [service-name]

# Verify environment
cd backend && npm run db:check

# Test database connection
cd backend && node scripts/check-database-status.js
```

---

## V2 Development Guidelines

### Clean Architecture Pattern

V2 services MUST follow Clean Architecture:

**Layer Structure:**
```
src/
├── domain/            # Business logic, entities, value objects, domain events
├── application/       # Use cases, CQRS handlers, application services
├── infrastructure/    # Repositories, external services, database
└── presentation/      # Controllers, routes, DTOs
```

### Domain-Driven Design (DDD)

- **Aggregates**: Use `AggregateRoot` base class
- **Value Objects**: Immutable objects with validation
- **Entities**: Objects with identity
- **Domain Events**: Publish events for important business actions

### CQRS Pattern

- **Commands**: Mutations that change state
- **Queries**: Read operations without side effects
- **Handlers**: Separate command and query handlers

### Code Standards for V2

1. **Always check completed services first** (Identity, Patient, Provider) for patterns to follow
2. **Never mix layers** - respect Clean Architecture boundaries
3. **Domain logic stays in domain layer** - no business logic in controllers
4. **Use TypeScript strict mode** - no `any` types
5. **Write tests for domain logic** - target 90%+ coverage
6. **Follow Vietnamese healthcare standards** - PAT-YYYYMM-XXX patient IDs, etc.

### Essential Reading for Agents

Before coding V2 services:
1. `backend/services-v2/README.md` - V2 overview
2. `backend/services-v2/ARCHITECTURE_AUDIT_REPORT.md` - Patterns to replicate
3. `backend/services-v2/STRATEGIC_DEVELOPMENT_PLAN.md` - Development roadmap
4. Study completed services: identity-service, patient-registry-service, provider-staff-service

---

**Note**: V2 is a complete rewrite with Clean Architecture. Xem V2-QUICK-START.md để setup môi trường development. File này chỉ chứa essential commands và guidelines cho coding agents working on V2.
