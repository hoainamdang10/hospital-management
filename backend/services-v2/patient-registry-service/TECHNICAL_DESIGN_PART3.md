# Patient Registry Service V2 - Technical Design (Part 3)

## 🧪 8. TESTING STRATEGY

### 8.1 Testing Pyramid

```
        /\
       /  \
      / E2E \          5% - End-to-End Tests
     /______\
    /        \
   /Integration\       25% - Integration Tests
  /____________\
 /              \
/  Unit Tests    \     70% - Unit Tests
/________________\
```

### 8.2 Unit Tests

**Target**: 90%+ code coverage

**Focus Areas**:
- Domain logic (aggregates, entities, value objects)
- Business rules validation
- Domain events

**Example**:
```typescript
// tests/unit/domain/Patient.test.ts
describe('Patient Aggregate', () => {
  describe('register', () => {
    it('should create new patient with valid data', () => {
      const props = {
        userId: 'user-123',
        personalInfo: PersonalInfo.create({
          fullName: 'Nguyễn Văn A',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          nationalId: '123456789',
          nationality: 'Vietnamese'
        }),
        contactInfo: ContactInfo.create({ ... }),
        basicMedicalInfo: BasicMedicalInfo.create({ ... }),
        emergencyContacts: [],
        consents: [],
        createdBy: 'admin'
      };

      const patient = Patient.register(props);

      expect(patient.getPatientId()).toBeDefined();
      expect(patient.getStatus()).toBe(PatientStatus.ACTIVE);
      expect(patient.getUncommittedEvents()).toHaveLength(1);
      expect(patient.getUncommittedEvents()[0]).toBeInstanceOf(PatientRegisteredEvent);
    });

    it('should throw error if national ID is invalid', () => {
      const props = {
        ...validProps,
        personalInfo: PersonalInfo.create({
          ...validPersonalInfo,
          nationalId: '123'  // Invalid format
        })
      };

      expect(() => Patient.register(props)).toThrow('CMND/CCCD không đúng định dạng');
    });
  });

  describe('mergeInto', () => {
    it('should merge duplicate patient into master', () => {
      const patient = Patient.register(validProps);
      const masterPatientId = PatientId.create('PAT-202501-001');

      patient.mergeInto(masterPatientId);

      expect(patient.getStatus()).toBe(PatientStatus.MERGED);
      expect(patient.getProps().mergedInto).toEqual(masterPatientId);
      expect(patient.getUncommittedEvents()).toContainEqual(
        expect.any(PatientMergedEvent)
      );
    });

    it('should throw error if patient already merged', () => {
      const patient = Patient.register(validProps);
      const masterPatientId = PatientId.create('PAT-202501-001');
      patient.mergeInto(masterPatientId);

      expect(() => patient.mergeInto(masterPatientId)).toThrow('Patient already merged');
    });
  });
});
```

### 8.3 Integration Tests

**Target**: 100% use case coverage with real Supabase data

**Focus Areas**:
- Use cases with real database
- Repository implementations
- External service integrations
- Event publishing

**Setup**:
```typescript
// tests/setup.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

beforeAll(async () => {
  // Clean test data
  await supabase.from('patient_profiles').delete().eq('patient_id', 'like', 'PAT-TEST-%');
});

afterEach(async () => {
  // Clean up after each test
  await supabase.from('patient_profiles').delete().eq('patient_id', 'like', 'PAT-TEST-%');
});
```

**Example**:
```typescript
// tests/integration/patient-registration.test.ts
describe('Patient Registration Integration Tests', () => {
  let registerPatientUseCase: RegisterPatientUseCase;
  let patientRepository: SupabasePatientRepository;

  beforeEach(() => {
    patientRepository = new SupabasePatientRepository(supabase);
    registerPatientUseCase = new RegisterPatientUseCase(patientRepository);
  });

  it('should register new patient with real Supabase data', async () => {
    const request: RegisterPatientRequest = {
      userId: 'test-user-123',
      personalInfo: {
        fullName: 'Nguyễn Văn Test',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '123456789',
        nationality: 'Vietnamese'
      },
      contactInfo: {
        primaryPhone: '0901234567',
        email: 'test@example.com',
        preferredContactMethod: 'phone',
        address: {
          street: '123 Test Street',
          ward: 'Test Ward',
          district: 'Test District',
          city: 'Test City',
          country: 'Vietnam'
        }
      },
      basicMedicalInfo: {
        bloodType: 'A+',
        knownAllergies: ['Penicillin']
      },
      emergencyContacts: [{
        name: 'Test Contact',
        relationship: 'Spouse',
        primaryPhone: '0907654321',
        isPrimary: true
      }],
      requestedBy: 'admin'
    };

    const response = await registerPatientUseCase.execute(request);

    expect(response.success).toBe(true);
    expect(response.patientId).toMatch(/^PAT-\d{6}-\d{3}$/);

    // Verify in database
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('patient_id', response.patientId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.full_name).toBe('Nguyễn Văn Test');
    expect(data.status).toBe('active');
  });

  it('should throw error if national ID already exists', async () => {
    // Register first patient
    await registerPatientUseCase.execute(validRequest);

    // Try to register with same national ID
    await expect(
      registerPatientUseCase.execute(validRequest)
    ).rejects.toThrow('CMND/CCCD đã tồn tại trong hệ thống');
  });
});
```

### 8.4 E2E Tests

**Target**: Critical user journeys

**Focus Areas**:
- Complete patient registration flow
- Patient search and matching
- Patient merge workflow

**Example**:
```typescript
// tests/e2e/patient-journey.test.ts
describe('Patient Journey E2E Tests', () => {
  it('should complete full patient registration and search journey', async () => {
    // 1. Register patient
    const registerResponse = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPatientData)
      .expect(201);

    const patientId = registerResponse.body.data.patientId;

    // 2. Get patient profile
    const getResponse = await request(app)
      .get(`/api/v1/patients/${patientId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(getResponse.body.data.patientId).toBe(patientId);

    // 3. Search for patient
    const searchResponse = await request(app)
      .get('/api/v1/patients/search?query=Nguyễn')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(searchResponse.body.data.patients).toContainEqual(
      expect.objectContaining({ patientId })
    );

    // 4. Update patient info
    const updateResponse = await request(app)
      .put(`/api/v1/patients/${patientId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ contactInfo: updatedContactInfo })
      .expect(200);

    expect(updateResponse.body.data.contactInfo).toEqual(updatedContactInfo);
  });
});
```

### 8.5 Test Data Management

**Strategy**: Use real Supabase data with test prefixes

**Test Patient IDs**: `PAT-TEST-XXX`
**Test User IDs**: `test-user-XXX`
**Test National IDs**: `999XXXXXX` (reserved for testing)

**Cleanup**:
```sql
-- Clean test data
DELETE FROM patient_schema.patient_profiles WHERE patient_id LIKE 'PAT-TEST-%';
DELETE FROM patient_schema.patient_insurance WHERE patient_id LIKE 'PAT-TEST-%';
DELETE FROM patient_schema.patient_emergency_contacts WHERE patient_id LIKE 'PAT-TEST-%';
```

---

## 🚀 9. DEPLOYMENT PLAN

### 9.1 Deployment Phases

#### **Phase 1: Infrastructure Setup** (Day 1)

**Tasks**:
1. Create `patient_schema` in Supabase
2. Run database migrations
3. Set up Redis cache
4. Configure RabbitMQ queues
5. Deploy monitoring (Prometheus, Grafana)

**Validation**:
```bash
# Check database schema
psql -h <supabase-host> -U postgres -d postgres -c "\dn patient_schema"

# Check tables
psql -h <supabase-host> -U postgres -d postgres -c "\dt patient_schema.*"

# Check Redis
redis-cli -h redis-v2 ping

# Check RabbitMQ
curl http://localhost:15673/api/overview
```

#### **Phase 2: Service Deployment** (Day 2)

**Tasks**:
1. Build Docker image
2. Deploy to Docker Compose
3. Configure environment variables
4. Start service
5. Health check validation

**Commands**:
```bash
# Build image
cd backend/services-v2/patient-registry-service
docker build -t patient-registry-service:v2 .

# Deploy with Docker Compose
cd backend/services-v2
docker-compose -f docker-compose.v2.yml up -d patient-registry-service

# Check health
curl http://localhost:3023/health
```

#### **Phase 3: Integration Testing** (Day 3)

**Tasks**:
1. Run integration tests
2. Validate event publishing
3. Test upstream integration (Identity Service)
4. Test downstream integration (Clinical EMR)

**Commands**:
```bash
# Run integration tests
cd backend/services-v2/patient-registry-service
npm run test:integration

# Check event publishing
# Monitor RabbitMQ management UI
open http://localhost:15673
```

#### **Phase 4: Production Deployment** (Day 4-5)

**Tasks**:
1. Blue-green deployment
2. Database migration
3. Traffic routing
4. Monitoring setup
5. Rollback plan

**Rollback Plan**:
```bash
# If issues detected, rollback to previous version
docker-compose -f docker-compose.v2.yml down patient-registry-service
docker-compose -f docker-compose.v2.yml up -d patient-registry-service-v1
```

### 9.2 Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3023
SERVICE_NAME=patient-registry-service

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_SCHEMA=patient_schema

# Redis
REDIS_URL=redis://redis-v2:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# Identity Service
IDENTITY_SERVICE_URL=http://identity-service:3021

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=30000

# Logging
LOG_LEVEL=info
```

### 9.3 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3023

CMD ["node", "dist/main.js"]
```

### 9.4 Docker Compose Configuration

```yaml
# docker-compose.v2.yml
services:
  patient-registry-service:
    build:
      context: ./patient-registry-service
      dockerfile: Dockerfile
    container_name: patient-registry-service-v2
    ports:
      - "3023:3023"
    environment:
      - NODE_ENV=production
      - PORT=3023
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis-v2:6379
      - RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
    depends_on:
      - redis-v2
      - rabbitmq-v2
      - identity-service
    networks:
      - hospital-network-v2
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3023/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 📊 10. MONITORING & OBSERVABILITY

### 10.1 Health Checks

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "service": "patient-registry-service",
  "version": "2.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5
    },
    "rabbitmq": {
      "status": "healthy",
      "responseTime": 10
    },
    "identityService": {
      "status": "healthy",
      "responseTime": 20
    }
  }
}
```

### 10.2 Metrics

**Prometheus Metrics**:
```typescript
// Patient registration metrics
patient_registrations_total{status="success|failure"}
patient_registrations_duration_seconds

// Patient search metrics
patient_searches_total{type="exact|fuzzy"}
patient_searches_duration_seconds

// Patient matching metrics
patient_matches_total{grade="certain|probable|possible"}
patient_matches_duration_seconds

// Patient merge metrics
patient_merges_total{status="success|failure"}
patient_merges_duration_seconds

// Database metrics
database_queries_total{operation="select|insert|update|delete"}
database_queries_duration_seconds
database_connection_pool_size
database_connection_pool_active

// Cache metrics
cache_hits_total
cache_misses_total
cache_hit_rate

// Event metrics
events_published_total{event_type}
events_published_duration_seconds
```

### 10.3 Logging

**Log Levels**:
- `ERROR` - Errors that need immediate attention
- `WARN` - Warnings that should be investigated
- `INFO` - Important business events
- `DEBUG` - Detailed debugging information

**Log Format**:
```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "level": "INFO",
  "service": "patient-registry-service",
  "traceId": "abc123",
  "message": "Patient registered successfully",
  "context": {
    "patientId": "PAT-202501-001",
    "userId": "user-123",
    "performedBy": "admin"
  }
}
```

### 10.4 Grafana Dashboard

**Panels**:
1. Service Health Overview
2. Patient Registration Rate
3. Patient Search Performance
4. Patient Matching Accuracy
5. Database Performance
6. Cache Hit Rate
7. Event Publishing Rate
8. Error Rate

---

## ✅ 11. ACCEPTANCE CRITERIA

### 11.1 Functional Requirements

- ✅ Patient registration with Vietnamese standards (BHYT, CMND/CCCD)
- ✅ Patient search with fuzzy matching
- ✅ Patient matching (PMI $match) with match grades
- ✅ Patient merge with audit trail
- ✅ Patient linking (FHIR-style)
- ✅ Insurance validation (BHYT format)
- ✅ Emergency contact management
- ✅ Consent management (HIPAA)
- ✅ Patient status management (active, inactive, deceased, merged)

### 11.2 Non-Functional Requirements

- ✅ Response time < 200ms (95th percentile)
- ✅ Availability > 99.9%
- ✅ Test coverage > 90%
- ✅ Integration tests with real Supabase data (100%)
- ✅ HIPAA compliance (audit logging, PHI protection)
- ✅ Circuit breaker protection
- ✅ Graceful degradation
- ✅ Event-driven integration
- ✅ Production-ready monitoring

### 11.3 Quality Gates

- ✅ All unit tests passing (90%+ coverage)
- ✅ All integration tests passing (100% use case coverage)
- ✅ No critical security vulnerabilities
- ✅ No build errors
- ✅ Code review approved
- ✅ Documentation complete
- ✅ Deployment plan validated

---

## 📚 12. REFERENCES

1. **HL7 FHIR R5 Patient Resource**: https://www.hl7.org/fhir/patient.html
2. **Identity Service V2**: backend/services-v2/identity-service
3. **Clean Architecture**: Robert C. Martin
4. **Domain-Driven Design**: Eric Evans
5. **Vietnamese Healthcare Standards**: BHYT, CMND/CCCD

---

**Status**: ✅ **READY FOR IMPLEMENTATION**

**Next Steps**: Begin implementation following this technical design document.

