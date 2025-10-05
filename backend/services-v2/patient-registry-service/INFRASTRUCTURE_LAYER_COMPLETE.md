# INFRASTRUCTURE LAYER - COMPLETE ✅

**Patient Registry Service V2 - Infrastructure Layer Implementation**

**Status**: 100% Complete  
**Date**: 2025-01-XX  
**Author**: Hospital Management Team

---

## 📋 OVERVIEW

Infrastructure Layer đã được implement đầy đủ với tất cả components cần thiết để kết nối Domain và Application layers với Supabase PostgreSQL database.

---

## ✅ COMPLETED COMPONENTS

### 1. PatientMapper ✅
**File**: `src/infrastructure/mappers/PatientMapper.ts`

**Chức năng**:
- Map giữa Patient aggregate (domain) và database records (JSONB + relational tables)
- Hỗ trợ bidirectional mapping: `toDomain()` và `toPersistence()`
- Xử lý complex JSONB fields (personal_info, contact_info, basic_medical_info)
- Map related entities (insurance, emergency contacts, consents, links)

**Key Methods**:
- `toDomain()`: Database records → Patient aggregate
- `toPersistence()`: Patient aggregate → Database records

---

### 2. SupabasePatientRepository ✅
**File**: `src/infrastructure/repositories/SupabasePatientRepository.ts`

**Chức năng**:
- Implements `IPatientRepository` interface
- Supabase PostgreSQL integration với `patient_schema`
- Circuit breaker pattern cho resilience
- Comprehensive error handling
- Transaction support cho complex operations

**Implemented Methods**:
- ✅ `findById(patientId)` - Find patient by ID
- ✅ `findByUserId(userId)` - Find patient by user ID
- ✅ `findByNationalId(nationalId)` - Find by national ID (CMND/CCCD)
- ✅ `findByBHYTNumber(bhytNumber)` - Find by BHYT insurance number
- ✅ `save(patient)` - Create or update patient (upsert)
- ✅ `delete(patientId)` - Soft delete patient
- ✅ `findWithFilters(filters, pagination)` - Advanced filtering and pagination
- ✅ `searchPatients(searchTerm, filters, pagination)` - Full-text search
- ✅ `matchPatients(criteria, onlyCertainMatches, limit)` - PMI matching for duplicates
- ✅ `getHealthStatus()` - Repository health check

**Features**:
- Circuit breaker protection
- Parallel fetching of related data
- JSONB query optimization
- Comprehensive error logging
- Graceful degradation

---

### 3. PatientMatchingService ✅
**File**: `src/infrastructure/services/PatientMatchingService.ts`

**Chức năng**:
- Implements PMI (Patient Master Index) matching algorithm
- Based on HL7 FHIR Patient $match operation
- Scoring-based duplicate detection

**Scoring Weights** (Total = 100):
- National ID: 40 points (highest priority)
- Full Name: 20 points
- Date of Birth: 20 points
- Primary Phone: 15 points
- Email: 5 points

**Match Grades**:
- **Certain** (90-100): Definite match
- **Probable** (70-89): Likely match
- **Possible** (50-69): Potential match
- **Certainly Not** (0-49): Not a match

**Features**:
- String similarity using Levenshtein distance
- Vietnamese diacritics normalization
- Phone number normalization
- Date comparison
- Detailed match information

---

### 4. InsuranceValidationService ✅
**File**: `src/infrastructure/services/InsuranceValidationService.ts`

**Chức năng**:
- Validates Vietnamese health insurance numbers
- Supports BHYT (Bảo hiểm Y tế) and BHTN (Bảo hiểm Tự nguyện)

**BHYT Validation**:
- Format: `XX-Y-ZZ-YYYY-NNNNN-CCCCC`
- Example: `HN-1-01-2024-12345-67890`
- Validates province codes, priority levels, group codes
- Checks year validity
- Expiration warnings

**BHTN Validation**:
- Format: `BHTN-YYYY-NNNNNNNN`
- Example: `BHTN-2024-12345678`
- Validates year and policy number
- Expiration warnings

**Additional Features**:
- Insurance date validation
- Expiration checking
- Days until expiration calculation

---

### 5. PatientDomainEventHandler ✅
**File**: `src/infrastructure/events/PatientDomainEventHandler.ts`

**Chức năng**:
- Handles all domain events from Patient aggregate
- HIPAA-compliant audit logging
- Integration event publishing
- Cross-service notifications

**Supported Events**:
- ✅ `PatientRegistered` - New patient registration
- ✅ `PatientUpdated` - Patient information updates
- ✅ `PatientConsentGranted` - Consent management
- ✅ `PatientMerged` - Duplicate patient merge
- ✅ `PatientLinked` - Patient linking (FHIR-style)
- ✅ `PatientDeactivated` - Patient deactivation

**Event Handling**:
- Audit logging for HIPAA compliance
- Integration events for other services
- Notifications to Identity, Clinical EMR, Notifications services
- Critical update detection
- Error handling and logging

---

## 🏗️ ARCHITECTURE PATTERNS

### Clean Architecture
- Infrastructure layer depends on Domain layer
- No domain logic in infrastructure
- Interfaces defined in domain/application layers

### Repository Pattern
- Single source of truth for data access
- Abstracts database implementation
- Supports testing with mock repositories

### Circuit Breaker Pattern
- Protects against cascading failures
- Graceful degradation
- Automatic recovery

### Mapper Pattern
- Separates domain models from database models
- Bidirectional mapping
- Type-safe conversions

---

## 📊 DATABASE SCHEMA

**Schema**: `patient_schema`

**Tables**:
1. `patients` - Main patient records (JSONB + relational)
2. `insurance_info` - Insurance information
3. `emergency_contacts` - Emergency contacts
4. `patient_consents` - HIPAA consents
5. `patient_links` - FHIR-style patient links

**JSONB Fields**:
- `personal_info` - Personal demographics
- `contact_info` - Contact information
- `basic_medical_info` - Emergency medical info

---

## 🔧 CONFIGURATION

### Environment Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Supabase Client Configuration
```typescript
{
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'patient_schema',
  },
  global: {
    headers: {
      'X-Client-Info': 'patient-registry-service',
    },
  },
}
```

---

## 🧪 TESTING

### Unit Tests Required
- [ ] PatientMapper tests
- [ ] SupabasePatientRepository tests (with mocks)
- [ ] PatientMatchingService tests
- [ ] InsuranceValidationService tests
- [ ] PatientDomainEventHandler tests

### Integration Tests Required
- [ ] Repository with real Supabase
- [ ] Event handler with event bus
- [ ] End-to-end patient registration flow

---

## 📝 NEXT STEPS

1. **Presentation Layer** (Controllers, Routes, DTOs)
2. **Dependency Injection Setup** (DI container configuration)
3. **Unit Tests** (90%+ coverage target)
4. **Integration Tests** (Real Supabase testing)
5. **API Documentation** (OpenAPI/Swagger)
6. **Performance Testing** (Load testing)

---

## 🎯 COMPLIANCE

- ✅ Clean Architecture
- ✅ Domain-Driven Design (DDD)
- ✅ CQRS Pattern (Application Layer)
- ✅ Event-Driven Architecture
- ✅ HL7 FHIR Alignment
- ✅ Vietnamese Healthcare Standards
- ✅ HIPAA Compliance (Audit logging)

---

## 📚 REFERENCES

- [HL7 FHIR Patient Resource](https://www.hl7.org/fhir/patient.html)
- [HL7 FHIR Patient $match Operation](https://www.hl7.org/fhir/patient-operation-match.html)
- [Vietnamese BHYT Standards](https://baohiemxahoi.gov.vn/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Infrastructure Layer Implementation: COMPLETE ✅**

