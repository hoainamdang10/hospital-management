# Hospital Management System - Development Rules & Guidelines

## 1. KIẾN TRÚC HỆ THỐNG (Architecture Rules)

### Microservices Pattern

- **Schema-per-service**: Mỗi service chỉ được truy cập vào schema riêng của mình

  - `auth_schema` - Auth Service
  - `doctor_schema` - Doctor Service
  - `patient_schema` - Patient Service
  - `appointment_schema` - Appointment Service
  - `medical_records_schema` - Medical Records Service

- **No cross-service hard FK constraints**: Chỉ sử dụng soft references (UUID) giữa các services
- **Event-driven communication**: Services giao tiếp qua events, không direct database access
- **API Gateway pattern**: Tất cả external requests phải đi qua API Gateway (port 3100)
- **Service boundaries**: Rõ ràng về responsibility của từng service

### Communication Patterns

- **Pure API Gateway Communication**: Tất cả service-to-service communication đi qua API Gateway
- **GraphQL Gateway**: Port 3200 với DataLoader cho N+1 optimization
- **Real-time subscriptions**: WebSocket cho live updates
- **Backward compatibility**: Maintain API versioning

## 2. BẢO MẬT (Security Rules)

### Database Security

- **RLS (Row Level Security)**: Bắt buộc cho tất cả tables nhạy cảm
- **Audit logging**: Track mọi thao tác CRUD trên dữ liệu bệnh nhân
- **100% HIPAA compliance**: Healthcare data protection standards
- **32 healthcare-specific policies**: Comprehensive security policies

### Authentication & Authorization

- **JWT token validation**: Cho mọi API calls
- **Auth Service integration**: Sử dụng Auth Service thay vì direct Supabase
- **Two-factor authentication**: Support 2FA fields
- **Role-based access control**: Admin, Doctor, Patient roles

### Data Protection

- **Input validation và sanitization**: Tất cả inputs
- **No sensitive data in logs**: Không log passwords, medical records
- **Encryption at rest**: Sensitive data encryption
- **API rate limiting**: Prevent abuse

## 3. NAMING CONVENTIONS

### Database (snake_case)

```
Tables: patient_profiles, medical_records, doctor_schedules
Columns: full_name, is_active, created_at, updated_at
Schemas: auth_schema, doctor_schema, patient_schema
```

### API Endpoints (kebab-case)

```
/api/v1/patient-records
/api/v1/doctor-schedules
/api/v1/appointment-bookings
/api/v1/medical-histories
```

### TypeScript

```typescript
// Variables/Functions: camelCase
const patientData = {};
function createAppointment() {}

// Types/Interfaces: PascalCase
interface PatientProfile {}
type DoctorSchedule = {};
```

### Environment Variables (UPPER_SNAKE_CASE)

```
DATABASE_URL
JWT_SECRET
REDIS_HOST
SUPABASE_ANON_KEY
```

### Event Names (dot.notation)

```
patient.created
appointment.booked
doctor.schedule.updated
medical_record.accessed
```

## 4. DATA STANDARDS

### ID System

- **UUID v7**: Primary keys cho better performance và sorting
- **Department-based IDs**: Doctors (CARD-DOC-YYYYMM-XXX)
- **Date-based IDs**: Patients (PAT-YYYYMM-XXX)

### Timestamps

- **ISO 8601**: `2024-01-15T10:30:00+07:00` (với timezone Vietnam)
- **Standard fields**: `created_at`, `updated_at`, `deleted_at`

### Localization

- **Vietnamese language support**: Error messages, UI text
- **Proper Vietnamese formatting**: Phone numbers (10 digits, start with 0)
- **License format**: VN-{2 letters}-{4 digits}

### API Standards

- **Consistent error response format**: Standardized structure
- **Proper HTTP status codes**: 200, 201, 400, 401, 403, 404, 500
- **Idempotency keys**: Cho critical operations (payments, appointments)
- **Response times**: < 200ms target

## 5. CODE QUALITY

### TypeScript Standards

- **Strict mode**: `"strict": true` trong tsconfig.json
- **Proper typing**: No `any` types, comprehensive interfaces
- **Error handling**: Try-catch blocks với meaningful messages

### Validation

- **Zod schemas**: Input validation cho tất cả APIs
- **Runtime validation**: Type safety at runtime
- **Schema validation**: Database schema compliance

### Database

- **Connection pooling**: 5-20 connections, optimize performance
- **Query optimization**: < 100ms target
- **Redis caching**: 85%+ hit rate target

### Logging

- **Structured logging**: JSON format với proper log levels
- **No sensitive data**: Sanitize logs
- **Request tracking**: Correlation IDs

## 6. TESTING STANDARDS

### Test Coverage

- **Unit tests**: Business logic coverage
- **Integration tests**: API endpoints testing
- **E2E tests**: Critical user journeys
- **Performance tests**: Database queries < 200ms

### Test Data

- **Test accounts**:
  - doctor@hospital.com (Doctor123..)
  - patient@hospital.com (Patient123)
  - admin@hospital.com (Admin123.)

## 7. PERFORMANCE REQUIREMENTS

### Database Performance

- **Query response**: < 100ms
- **API response**: < 200ms
- **Connection pool**: 5-20 connections
- **Cache hit rate**: 85%+

### Scalability

- **Kubernetes-ready**: Health endpoints
- **Horizontal scaling**: Stateless services
- **Load balancing**: API Gateway distribution

## 8. COMPLIANCE & STANDARDS

### Healthcare Compliance

- **FHIR compliance**: 85%+ level maintenance
- **HIPAA requirements**: Full compliance
- **Audit trails**: Complete logging
- **Data retention**: Healthcare standards

### Development Standards

- **Git workflow**: Feature branches, PR reviews
- **Code reviews**: Mandatory for all changes
- **Documentation**: OpenAPI/Swagger specs
- **Deployment**: Docker containerization

## 9. MONITORING & OBSERVABILITY

### Health Monitoring

- **Health check endpoints**: All services
- **Metrics collection**: Response times, error rates
- **Distributed tracing**: Request flow tracking
- **Alert thresholds**: Critical metrics monitoring

### Logging Standards

- **Structured logs**: JSON format
- **Log levels**: DEBUG, INFO, WARN, ERROR
- **Correlation IDs**: Request tracking
- **No PII in logs**: Privacy protection

## 10. RESILIENCE PATTERNS

### Circuit Breaker Pattern

```typescript
// Circuit Breaker Configuration
const circuitBreakerConfig = {
  timeout: 5000, // 5s for external calls
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // 30s recovery timeout
  requestVolumeThreshold: 20,
  sleepWindowInMilliseconds: 5000,
};

// Internal service calls: 2s timeout
// Database queries: 5s timeout
// File uploads: 30s timeout
```

### Retry Policies

```typescript
// Exponential Backoff Configuration
const retryConfig = {
  retries: 3, // Max retries for idempotent operations
  factor: 2, // Exponential factor
  minTimeout: 100, // 100ms initial delay
  maxTimeout: 800, // 800ms max delay
  randomize: true, // ±25% jitter to prevent thundering herd

  // Retry conditions
  retryCondition: (error) => {
    return error.code >= 500 || error.code === "NETWORK_ERROR";
  },
};
```

### Bulkhead Pattern

```typescript
// Resource Isolation
const threadPoolConfig = {
  criticalOperations: { maxConcurrency: 10 }, // Patient data access
  nonCriticalOperations: { maxConcurrency: 5 }, // Reporting, analytics
  externalServices: { maxConcurrency: 3 }, // Third-party APIs
  fileOperations: { maxConcurrency: 2 }, // File uploads/downloads
};
```

### Saga Pattern

```typescript
// Distributed Transaction Management
enum SagaType {
  CHOREOGRAPHY = "choreography", // Simple workflows
  ORCHESTRATION = "orchestration", // Complex medical workflows
}

// Compensation Actions Required for:
// - Patient registration
// - Appointment booking
// - Payment processing
// - Medical record updates
```

## 11. ERROR HANDLING STANDARDS

### Standardized Error Codes

```typescript
// Healthcare-Specific Error Codes
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
  INVALID_LICENSE_FORMAT = "VALIDATION_2004",

  // Business Logic (3000-3099)
  PATIENT_NOT_FOUND = "BUSINESS_3001",
  DOCTOR_NOT_AVAILABLE = "BUSINESS_3002",
  APPOINTMENT_CONFLICT = "BUSINESS_3003",
  MEDICAL_RECORD_LOCKED = "BUSINESS_3004",
  CONSENT_REQUIRED = "BUSINESS_3005",

  // System (4000-4099)
  DATABASE_ERROR = "SYSTEM_4001",
  EXTERNAL_SERVICE_ERROR = "SYSTEM_4002",
  RATE_LIMIT_EXCEEDED = "SYSTEM_4003",
  MAINTENANCE_MODE = "SYSTEM_4004",

  // FHIR (5000-5099)
  FHIR_VALIDATION_ERROR = "FHIR_5001",
  FHIR_RESOURCE_NOT_FOUND = "FHIR_5002",
  FHIR_QUOTA_EXCEEDED = "FHIR_5003",
}
```

### Error Response Format

```typescript
interface StandardErrorResponse {
  error: {
    code: HealthcareErrorCodes;
    message: string; // Vietnamese user message
    details?: string; // Technical details (dev only)
    timestamp: string; // ISO 8601
    requestId: string; // Correlation ID
    path: string; // API endpoint
    suggestions?: string[]; // User action suggestions
  };
  meta?: {
    retryAfter?: number; // Seconds to wait before retry
    documentation?: string; // Link to error documentation
  };
}
```

### Fallback Mechanisms

```typescript
// Service Degradation Strategy
const fallbackConfig = {
  patientSearch: {
    primary: "elasticsearch",
    fallback: "database_search",
    timeout: 2000,
  },

  appointmentBooking: {
    primary: "real_time_booking",
    fallback: "queue_based_booking",
    timeout: 5000,
  },

  medicalRecords: {
    primary: "fhir_server",
    fallback: "cached_records",
    timeout: 3000,
  },
};
```

## 12. CI/CD PIPELINE (GitHub Actions - Free Tier)

### Pipeline Configuration

```yaml
# .github/workflows/ci-cd.yml
name: Hospital Management CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      # Code Quality Checks
      - run: npm ci
      - run: npm run lint # ESLint
      - run: npm run format:check # Prettier
      - run: npm run type-check # TypeScript

      # Security Scan (Free Tier)
      - run: npm audit --audit-level=moderate
      - uses: snyk/actions/node@master # Free tier: 200 tests/month
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      # Unit & Integration Tests
      - run: npm ci
      - run: npm run test:unit # Jest unit tests
      - run: npm run test:integration # API endpoint tests
      - run: npm run test:coverage # Coverage >80% required

      # Upload coverage to Codecov (Free)
      - uses: codecov/codecov-action@v3

  build:
    needs: [code-quality, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3

      # Multi-stage Docker build
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: hospital-management:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to Staging
        run: |
          # Deploy to Supabase staging project
          # Update environment variables
          # Run database migrations
          echo "Deploying to staging..."

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        run: |
          # Deploy to Supabase production project
          # Update environment variables
          # Run database migrations
          echo "Deploying to production..."
```

### Branch Strategy

```
main (production)
├── develop (integration)
├── feature/patient-registration
├── feature/appointment-booking
├── hotfix/security-patch
└── release/v1.2.0
```

### Code Review Checklist

```markdown
## Security Review

- [ ] No hardcoded secrets or API keys
- [ ] PHI data handling follows HIPAA guidelines
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS prevention measures

## Performance Review

- [ ] Database queries optimized (<100ms)
- [ ] API response times <200ms
- [ ] Proper caching implemented
- [ ] Connection pooling configured

## Code Quality

- [ ] TypeScript strict mode compliance
- [ ] Unit tests added/updated (>80% coverage)
- [ ] Error handling implemented
- [ ] Logging added for debugging

## API Documentation

- [ ] OpenAPI/Swagger specs updated
- [ ] Request/response examples provided
- [ ] Error responses documented
- [ ] Changelog updated

## FHIR Compliance

- [ ] FHIR resource validation
- [ ] Proper resource relationships
- [ ] Terminology bindings correct
- [ ] Medplum integration tested
```

## 13. FHIR INTEGRATION (Medplum Free Tier)

### Medplum Free Tier Limits

```typescript
// Rate Limits (Free Tier)
const medplumLimits = {
  requests: {
    auth: 160, // requests per IP per minute
    others: 6000, // requests per IP per minute
  },

  fhirInteractions: {
    read: 1, // point per operation
    create: 100, // points per operation
    update: 100, // points per operation
    delete: 100, // points per operation
    search: 20, // points per operation
    history: 10, // points per operation
  },

  // Free tier quota (estimated)
  monthlyQuota: 50000, // FHIR interaction points
  storageLimit: "1GB", // Resource storage
  users: 100, // Active users
};
```

### FHIR Resource Mapping

```typescript
// Core FHIR Resources for Hospital Management
interface FHIRResourceMapping {
  // Patient Management
  Patient: {
    identifier: string[]; // PAT-YYYYMM-XXX
    name: HumanName[];
    telecom: ContactPoint[];
    address: Address[];
    birthDate: string;
    gender: "male" | "female" | "other";
  };

  // Healthcare Providers
  Practitioner: {
    identifier: string[]; // CARD-DOC-YYYYMM-XXX
    name: HumanName[];
    qualification: Qualification[];
    specialty: CodeableConcept[];
  };

  // Appointments
  Appointment: {
    status:
      | "proposed"
      | "pending"
      | "booked"
      | "arrived"
      | "fulfilled"
      | "cancelled";
    serviceType: CodeableConcept[];
    participant: AppointmentParticipant[];
    start: string; // ISO 8601
    end: string;
  };

  // Medical Records
  Observation: {
    status: "registered" | "preliminary" | "final" | "amended";
    code: CodeableConcept;
    subject: Reference; // Patient reference
    performer: Reference[]; // Practitioner reference
    valueQuantity?: Quantity;
    valueString?: string;
  };

  // Encounters
  Encounter: {
    status: "planned" | "arrived" | "in-progress" | "finished" | "cancelled";
    class: Coding;
    subject: Reference; // Patient reference
    participant: EncounterParticipant[];
    period: Period;
  };
}
```

### Medplum Integration Strategy

```typescript
// Medplum Client Configuration
import { MedplumClient } from "@medplum/core";

const medplumClient = new MedplumClient({
  baseUrl: process.env.MEDPLUM_BASE_URL,
  clientId: process.env.MEDPLUM_CLIENT_ID,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET,

  // Rate limiting configuration
  rateLimitConfig: {
    maxRequestsPerMinute: 5000, // Stay under 6000 limit
    maxFhirPointsPerMinute: 8000, // Conservative limit
    retryOnRateLimit: true,
    retryDelay: 1000, // 1s delay on rate limit
  },
});

// FHIR Operations with Error Handling
class FHIRService {
  async createPatient(patientData: Patient): Promise<Patient> {
    try {
      // Validate FHIR resource before creation
      const validatedPatient = await this.validateFHIRResource(patientData);

      // Create with retry logic
      return await this.retryOperation(() =>
        medplumClient.createResource(validatedPatient)
      );
    } catch (error) {
      if (error.code === "FHIR_QUOTA_EXCEEDED") {
        // Implement queue-based processing
        await this.queueFHIROperation("create", "Patient", patientData);
        throw new Error("FHIR_QUOTA_EXCEEDED");
      }
      throw error;
    }
  }

  async searchPatients(searchParams: any): Promise<Bundle> {
    // Implement caching to reduce FHIR calls
    const cacheKey = `patient_search_${JSON.stringify(searchParams)}`;
    const cached = await this.getFromCache(cacheKey);

    if (cached) return cached;

    const result = await medplumClient.searchResources("Patient", searchParams);
    await this.setCache(cacheKey, result, 300); // 5 min cache

    return result;
  }
}
```

### FHIR Compliance Strategy

```typescript
// 85%+ FHIR Compliance Requirements
const fhirComplianceChecklist = {
  resourceValidation: {
    required: ["Patient", "Practitioner", "Appointment", "Observation"],
    optional: ["Encounter", "DiagnosticReport", "Medication", "Procedure"],
    customExtensions: "vietnamese_healthcare_extensions",
  },

  terminologyBindings: {
    required: ["SNOMED CT", "LOINC", "ICD-10"],
    vietnamese: "vietnamese_medical_terminology",
    customCodeSystems: "hospital_specific_codes",
  },

  interoperability: {
    exportFormats: ["JSON", "XML"],
    bulkDataExport: true,
    smartOnFhir: false, // Not required for thesis
    cdsHooks: false, // Not required for thesis
  },
};
```

## 14. DATA PROTECTION & PRIVACY

### Data Anonymization Rules

```typescript
// Data Anonymization for Testing/Development
interface AnonymizationRules {
  // Patient Data
  patientData: {
    name: "FAKER_VIETNAMESE_NAME";
    phone: "FAKER_PHONE_VN";
    email: "FAKER_EMAIL";
    address: "FAKER_ADDRESS_VN";
    nationalId: "HASH_WITH_SALT";
    medicalHistory: "REDACTED";
  };

  // Doctor Data
  doctorData: {
    name: "FAKER_VIETNAMESE_NAME";
    phone: "FAKER_PHONE_VN";
    email: "FAKER_EMAIL";
    licenseNumber: "HASH_WITH_SALT";
  };

  // Preserve for testing
  preserveFields: [
    "id",
    "created_at",
    "updated_at",
    "appointment_status",
    "medical_record_type"
  ];
}
```

### Backup & Disaster Recovery

```typescript
// Backup Strategy (Free Tier Compatible)
const backupStrategy = {
  // Supabase automatic backups (free tier)
  supabaseBackups: {
    frequency: "daily",
    retention: "7_days",
    pointInTimeRecovery: false, // Not available in free tier
  },

  // Manual backup procedures
  manualBackups: {
    frequency: "weekly",
    target: "github_private_repo", // Encrypted backup files
    encryption: "AES_256",
    retention: "4_weeks",
  },

  // Critical data export
  criticalDataExport: {
    frequency: "daily",
    format: "FHIR_JSON",
    destination: "secure_cloud_storage",
    encryption: true,
  },
};
```

### Patient Consent Management

```typescript
// Consent Tracking System
interface ConsentManagement {
  consentTypes: {
    DATA_PROCESSING: "Xử lý dữ liệu cá nhân";
    MEDICAL_TREATMENT: "Điều trị y tế";
    DATA_SHARING: "Chia sẻ dữ liệu với bên thứ ba";
    RESEARCH_PARTICIPATION: "Tham gia nghiên cứu y khoa";
    MARKETING_COMMUNICATION: "Nhận thông tin marketing";
  };

  consentStatus: "granted" | "denied" | "withdrawn" | "expired";

  auditTrail: {
    timestamp: string; // ISO 8601
    action: "grant" | "deny" | "withdraw" | "update";
    ipAddress: string;
    userAgent: string;
    witnessId?: string; // For in-person consent
  }[];
}
```

### Data Retention Policies

```typescript
// Healthcare Data Retention (Vietnam Standards)
const dataRetentionPolicies = {
  medicalRecords: {
    retention: "20_years", // Vietnamese healthcare law
    archiveAfter: "7_years",
    deleteAfter: "20_years",
  },

  appointmentRecords: {
    retention: "5_years",
    archiveAfter: "2_years",
    deleteAfter: "5_years",
  },

  auditLogs: {
    retention: "7_years", // HIPAA requirement
    archiveAfter: "3_years",
    deleteAfter: "7_years",
  },

  userSessions: {
    retention: "90_days",
    deleteAfter: "90_days",
  },

  backupData: {
    retention: "1_year",
    deleteAfter: "1_year",
  },
};
```

## 15. API DOCUMENTATION STANDARDS

### OpenAPI Specification

```yaml
# openapi.yml
openapi: 3.0.3
info:
  title: Hospital Management System API
  version: 1.0.0
  description: |
    Comprehensive API for hospital management system

    ## Authentication
    All endpoints require JWT token in Authorization header:
    `Authorization: Bearer <token>`

    ## Rate Limiting
    - 100 requests per minute per user
    - 1000 requests per minute per IP

    ## Error Handling
    All errors follow standardized format with Vietnamese messages

  contact:
    name: Hospital Management Team
    email: dev@hospital.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.hospital.local/v1
    description: Development server
  - url: https://staging-api.hospital.com/v1
    description: Staging server
  - url: https://api.hospital.com/v1
    description: Production server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message, timestamp, requestId, path]
          properties:
            code:
              type: string
              example: "PATIENT_NOT_FOUND"
            message:
              type: string
              example: "Không tìm thấy bệnh nhân"
            details:
              type: string
              example: "Patient with ID PAT-202401-001 not found"
            timestamp:
              type: string
              format: date-time
              example: "2024-01-15T10:30:00+07:00"
            requestId:
              type: string
              example: "req_123456789"
            path:
              type: string
              example: "/api/v1/patients/PAT-202401-001"
            suggestions:
              type: array
              items:
                type: string
              example: ["Kiểm tra lại mã bệnh nhân", "Liên hệ quản trị viên"]

security:
  - bearerAuth: []
```

### API Versioning Strategy

```typescript
// API Versioning Rules
const versioningStrategy = {
  // URL versioning (preferred)
  urlVersioning: {
    pattern: "/api/v{major}/endpoint",
    examples: ["/api/v1/patients", "/api/v2/appointments"],
    deprecationNotice: "6_months_advance",
  },

  // Header versioning (fallback)
  headerVersioning: {
    header: "API-Version",
    format: "v1.2.3",
    defaultVersion: "v1.0.0",
  },

  // Backward compatibility
  backwardCompatibility: {
    supportedVersions: ["v1.0", "v1.1", "v1.2"],
    deprecationPolicy: "12_months",
    sunsetPolicy: "18_months",
  },
};
```

### Documentation Generation

```typescript
// Auto-generated documentation
const documentationConfig = {
  // Swagger UI
  swaggerUI: {
    path: "/api/docs",
    theme: "hospital_theme",
    authentication: true,
    tryItOut: true,
  },

  // Postman Collection
  postmanCollection: {
    autoGenerate: true,
    includeExamples: true,
    includeTests: true,
    exportPath: "/docs/postman",
  },

  // SDK Generation
  sdkGeneration: {
    languages: ["typescript", "python", "java"],
    autoPublish: false,
    includeExamples: true,
  },
};
```

## 16. EMERGENCY PROCEDURES

### System Outage Response

```typescript
// Emergency Response Procedures
const emergencyProcedures = {
  // Severity Levels
  severityLevels: {
    CRITICAL: {
      description: "System completely down, patient safety at risk",
      responseTime: "15_minutes",
      escalation: "immediate_all_hands",
    },
    HIGH: {
      description: "Major functionality impaired",
      responseTime: "30_minutes",
      escalation: "senior_dev_team",
    },
    MEDIUM: {
      description: "Some features unavailable",
      responseTime: "2_hours",
      escalation: "dev_team",
    },
    LOW: {
      description: "Minor issues, workarounds available",
      responseTime: "24_hours",
      escalation: "assigned_developer",
    },
  },

  // Emergency Contacts
  emergencyContacts: {
    systemAdmin: "admin@hospital.com",
    leadDeveloper: "lead@hospital.com",
    databaseAdmin: "dba@hospital.com",
    securityTeam: "security@hospital.com",
  },

  // Rollback Procedures
  rollbackProcedures: {
    codeRollback: {
      method: "git_revert",
      timeLimit: "10_minutes",
      approvalRequired: false,
    },
    databaseRollback: {
      method: "backup_restore",
      timeLimit: "30_minutes",
      approvalRequired: true,
    },
    configRollback: {
      method: "environment_restore",
      timeLimit: "5_minutes",
      approvalRequired: false,
    },
  },
};
```

### Data Breach Response

```typescript
// HIPAA Breach Response Protocol
const breachResponseProtocol = {
  // Immediate Actions (0-1 hour)
  immediateActions: [
    "Isolate affected systems",
    "Preserve evidence",
    "Assess scope of breach",
    "Notify security team",
    "Document incident timeline",
  ],

  // Short-term Actions (1-24 hours)
  shortTermActions: [
    "Conduct forensic analysis",
    "Identify affected patients",
    "Assess risk to individuals",
    "Implement containment measures",
    "Prepare breach notification",
  ],

  // Long-term Actions (1-60 days)
  longTermActions: [
    "Notify affected individuals (60 days)",
    "Report to authorities (72 hours)",
    "Conduct security review",
    "Implement preventive measures",
    "Update security policies",
  ],

  // Notification Requirements
  notificationRequirements: {
    individuals: {
      timeframe: "60_days",
      method: "written_notice",
      content: "breach_details_and_mitigation",
    },
    authorities: {
      timeframe: "72_hours",
      recipient: "ministry_of_health_vietnam",
      method: "official_report",
    },
    media: {
      condition: "if_more_than_500_individuals",
      timeframe: "60_days",
      method: "public_announcement",
    },
  },
};
```

### Emergency Access Protocols

```typescript
// Break-glass Access for Medical Emergencies
const emergencyAccessProtocol = {
  // Emergency Access Levels
  accessLevels: {
    MEDICAL_EMERGENCY: {
      description: "Life-threatening situation",
      accessScope: "full_patient_record",
      duration: "24_hours",
      auditLevel: "comprehensive",
    },
    URGENT_CARE: {
      description: "Urgent medical attention needed",
      accessScope: "relevant_medical_data",
      duration: "8_hours",
      auditLevel: "standard",
    },
  },

  // Authorization Process
  authorizationProcess: {
    step1: "Emergency access request",
    step2: "Supervisor approval (if available)",
    step3: "System grants temporary access",
    step4: "Comprehensive audit logging",
    step5: "Post-incident review (within 24h)",
  },

  // Audit Requirements
  auditRequirements: {
    logFields: [
      "user_id",
      "patient_id",
      "access_reason",
      "emergency_type",
      "supervisor_approval",
      "data_accessed",
      "duration",
      "ip_address",
    ],
    reviewProcess: "mandatory_24h_review",
    retentionPeriod: "7_years",
  },
};
```

---

**Áp dụng nhất quán tất cả các quy tắc này trong quá trình development để đảm bảo chất lượng và bảo mật của Hospital Management System.**

## 📋 TÓM TẮT CÁC BỔ SUNG CHÍNH

### ✅ **Đã Bổ Sung:**

1. **Resilience Patterns** - Circuit breaker, retry policies, bulkhead pattern
2. **Error Handling Standards** - Standardized error codes, fallback mechanisms
3. **CI/CD Pipeline** - GitHub Actions workflow optimized cho free tier
4. **FHIR Integration** - Medplum free tier integration với rate limiting
5. **Data Protection** - Anonymization, backup, consent management
6. **API Documentation** - OpenAPI specs, versioning strategy
7. **Emergency Procedures** - Outage response, breach protocol, emergency access

### 🎯 **Medplum Free Tier Benefits:**

- **6,000 requests/minute** cho API calls
- **FHIR-compliant** data storage
- **Built-in HIPAA compliance**
- **Open source** (no vendor lock-in)
- **Vietnamese healthcare extensions** support
- **Caching strategy** để optimize quota usage

### 💡 **Free Tier Stack Hoàn Chỉnh:**

- **Database**: Supabase (500MB, 2GB bandwidth)
- **FHIR Server**: Medplum (6K requests/min, 1GB storage)
- **CI/CD**: GitHub Actions (2000 minutes/month)
- **Monitoring**: UptimeRobot (50 monitors free)
- **Security**: Snyk (200 tests/month)
- **Documentation**: Swagger UI (self-hosted)

**File DEVELOPMENT_RULES.md hiện đã comprehensive và ready cho production-grade hospital management system!**
