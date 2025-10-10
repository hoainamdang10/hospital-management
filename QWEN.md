# Hospital Management System V2 - QWEN Context

## Project Overview

This is a comprehensive microservices-based hospital management system built with clean architecture principles. It is version 2.0.0 of the system, currently in active development (40-50% complete). The system implements Clean Architecture, Domain-Driven Design (DDD), CQRS, and event-driven patterns with a focus on Vietnamese healthcare compliance standards.

The project is structured as a monorepo with separate backend microservices and a Next.js 15 frontend application.

### Architecture Pattern
- **Backend**: Clean Architecture + DDD + CQRS + Event-Driven Microservices
- **Frontend**: Next.js 15 + React 18 + TypeScript with Tailwind CSS
- **Database**: Supabase (PostgreSQL) with schema-per-service design
- **Caching**: Redis 7
- **Messaging**: RabbitMQ 3
- **Infrastructure**: Docker & Docker Compose

## Services Structure

### Backend Services
The backend is located in `backend/services-v2/` and contains 7 core services:

1. **Identity Service** (Port 3021) - ✅ Ready - Authentication, authorization, user management
2. **Patient Registry** (Port 3023) - ✅ Ready - Patient demographics, registration
3. **Provider/Staff** (Port 3022) - ✅ Ready - Doctor, nurse, staff management
4. **Scheduling Service** (Port 3024) - 🔄 In Dev - Appointments, slots, availability
5. **Clinical/EMR Service** (Port 3027) - 🔄 In Dev - Medical records, prescriptions
6. **Billing Service** (Port 3029) - 🔄 In Dev - Invoices, payments, insurance
7. **Notifications Service** (Port 3031) - 🔄 In Dev - Email, SMS, push notifications

### Infrastructure Services
- Redis V2 (Port 6380) - Caching and session storage
- RabbitMQ V2 (Port 5673) - Message queue for events
- RabbitMQ Management (Port 15673) - Admin UI

## Development Guidelines

### Microservices Patterns
- **Schema-per-service**: Each service has its own database schema
  - `auth_schema` - Auth Service
  - `patient_schema` - Patient Service
  - `provider_schema` - Provider Service
  - `scheduling_schema` - Scheduling Service
  - `clinical_schema` - Clinical Service
  - `billing_schema` - Billing Service
  - `notification_schema` - Notification Service
- **No cross-service hard FK constraints**: Only soft references (UUID) between services
- **Event-driven communication**: Services communicate via events
- **API Gateway pattern**: All external requests must go through API Gateway

### Security Rules
- **RLS (Row Level Security)**: Mandatory for all sensitive tables
- **Audit logging**: Track all CRUD operations on patient data
- **100% HIPAA compliance**: Healthcare data protection standards
- **JWT token validation**: For all API calls
- **Input validation and sanitization**: All inputs must be validated
- **No sensitive data in logs**: Never log passwords or medical records

### Naming Conventions
- **Database**: snake_case (tables: patient_profiles, columns: full_name, created_at)
- **API Endpoints**: kebab-case (/api/v1/patient-records)
- **TypeScript**: camelCase for variables/functions, PascalCase for types/interfaces
- **Environment Variables**: UPPER_SNAKE_CASE
- **Event Names**: dot.notation (patient.created, appointment.booked)

### ID System
- **UUID v7**: Primary keys for better performance and sorting
- **Department-based IDs**: Doctors (CARD-DOC-YYYYMM-XXX)
- **Date-based IDs**: Patients (PAT-YYYYMM-XXX)

### API Standards
- **Consistent error response format**: Standardized structure
- **Proper HTTP status codes**: 200, 201, 400, 401, 403, 404, 500
- **ISO 8601 Timestamps**: With timezone Vietnam (2024-01-15T10:30:00+07:00)

## Building and Running

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker Desktop
- Supabase account

### Setup
1. Clone the repository and navigate to the project root:
   ```bash
   cd hospital-management-V2
   cd backend/services-v2
   npm install
   ```

2. Configure environment variables:
   ```bash
   # Create .env file in backend/services-v2/
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   JWT_SECRET=your_jwt_secret
   ```

3. Start infrastructure services:
   ```bash
   # Start Redis and RabbitMQ
   docker-compose -f docker-compose.v2.yml --profile infrastructure up -d
   ```

4. Start core services:
   ```bash
   # Start Identity, Patient Registry, Provider/Staff services
   docker-compose -f docker-compose.v2.yml --profile core up -d
   ```

5. For complete setup, start all services:
   ```bash
   docker-compose -f docker-compose.v2.yml --profile full up -d
   ```

### Service Health Checks
- Identity Service: http://localhost:3021/health
- Patient Registry: http://localhost:3023/health
- Provider/Staff: http://localhost:3022/health

### Frontend
- Navigate to `frontend/` directory
- Run `npm install` to install dependencies
- Run `npm run dev` to start development server on port 3000
- Access at http://localhost:3000

## Development Conventions

### Code Quality
- TypeScript strict mode ("strict": true in tsconfig.json)
- Proper typing, no "any" types
- Zod schemas for input validation
- Try-catch blocks with meaningful error messages

### Testing Standards
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user journeys
- Target: >90% code coverage

### Error Handling
The system uses standardized error codes with Vietnamese user messages:

```typescript
enum HealthcareErrorCodes {
  // Authentication (1000-1099)
  INVALID_TOKEN = "AUTH_1001",
  TOKEN_EXPIRED = "AUTH_1002",
  INSUFFICIENT_PERMISSIONS = "AUTH_1003",
  MFA_REQUIRED = "AUTH_1004",

  // Validation (2000-2099)
  INVALID_INPUT = "VALIDATION_2001",
  MISSING_REQUIRED_FIELD = "VALIDATION_2002",
  INVALID_PHONE_FORMAT = "VALIDATION_2003",

  // Business Logic (3000-3099)
  PATIENT_NOT_FOUND = "BUSINESS_3001",
  DOCTOR_NOT_AVAILABLE = "BUSINESS_3002",
  APPOINTMENT_CONFLICT = "BUSINESS_3003",
  MEDICAL_RECORD_LOCKED = "BUSINESS_3004",
  CONSENT_REQUIRED = "BUSINESS_3005",
}
```

### Resilience Patterns
- Circuit Breaker with 5s timeout, 50% error threshold, 30s reset timeout
- Exponential backoff retry with 3 max retries
- Bulkhead pattern for resource isolation
- Saga pattern for distributed transaction management

### FHIR Integration
The system implements 85%+ FHIR compliance with Medplum integration for healthcare interoperability.

## Project Status
- **Services Completed**: 3/7 (43%)
- **Code Coverage**: ~60% (Target: 90%+)
- **HIPAA Compliance**: 100% for completed services
- **Vietnamese Standards**: Full compliance

## Directory Structure
```
hospital-management-V2/
├── backend/
│   └── services-v2/              # Clean Architecture V2 Services
│       ├── identity-service/           # Auth & User Management
│       ├── patient-registry-service/   # Patient Management
│       ├── provider-staff-service/     # Doctor/Staff Management
│       ├── scheduling-service/         # Appointments & Scheduling
│       ├── clinical-emr-service/       # Medical Records & FHIR
│       ├── billing-service/            # Payments & Billing
│       ├── notifications-service/      # Notifications
│       ├── shared/                     # Shared domain primitives
│       ├── scripts/                    # Deployment & validation scripts
│       └── docker-compose.v2.yml       # V2 orchestration
├── frontend/                     # Next.js 15 + React 18 + TypeScript
│   ├── app/                     # Next.js App Router
│   ├── components/              # React components
│   └── middleware.ts            # Auth middleware
├── DEVELOPMENT_RULES.md         # Development standards
└── README.md                    # Project documentation
```

## Key Technologies
- **Backend**: Node.js 18+ with TypeScript, Express.js
- **Database**: Supabase PostgreSQL
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Caching**: Redis 7
- **Messaging**: RabbitMQ 3
- **Containerization**: Docker & Docker Compose
- **UI Components**: Shadcn/ui + Lucide React
- **State Management**: React Hooks + Context API

## Testing Commands
- Run all tests: `npm run test:all`
- Run specific service tests: `npm run test:identity` (or patient, provider, etc.)
- Run tests with coverage: `npm run test:coverage`

## Documentation
- Complete API documentation follows OpenAPI 3.0 specification
- Individual service README files in each service directory
- Architecture audit reports and strategic development plans available in backend/services-v2/docs/
- Vietnamese healthcare compliance documentation included