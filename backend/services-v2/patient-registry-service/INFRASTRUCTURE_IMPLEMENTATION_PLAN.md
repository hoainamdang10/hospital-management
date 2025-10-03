# INFRASTRUCTURE LAYER IMPLEMENTATION PLAN

## 🎯 GOAL

Implement Infrastructure Layer to make Application Layer functional with real Supabase database.

---

## 📊 TASKS

### 1. Database Schema (Supabase SQL)

**File**: `database/schema.sql`

**Tables**:
```sql
-- patient_schema.patients
CREATE TABLE patient_schema.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) UNIQUE NOT NULL,  -- PAT-YYYYMM-XXX
  user_id UUID NOT NULL REFERENCES auth_schema.users(id),
  
  -- Personal Info (JSONB)
  personal_info JSONB NOT NULL,
  
  -- Contact Info (JSONB)
  contact_info JSONB NOT NULL,
  
  -- Basic Medical Info (JSONB)
  basic_medical_info JSONB NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, inactive, deceased, merged
  merged_into VARCHAR(20),  -- Reference to master patient_id
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  
  -- Indexes
  CONSTRAINT fk_merged_into FOREIGN KEY (merged_into) REFERENCES patient_schema.patients(patient_id)
);

CREATE INDEX idx_patients_user_id ON patient_schema.patients(user_id);
CREATE INDEX idx_patients_patient_id ON patient_schema.patients(patient_id);
CREATE INDEX idx_patients_status ON patient_schema.patients(status);
CREATE INDEX idx_patients_personal_info_national_id ON patient_schema.patients((personal_info->>'nationalId'));

-- patient_schema.insurance_info
CREATE TABLE patient_schema.insurance_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL REFERENCES patient_schema.patients(patient_id),
  provider VARCHAR(255) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  group_number VARCHAR(100),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  coverage_type VARCHAR(50) NOT NULL,  -- BHYT, BHTN, private, self_pay
  is_vietnamese_insurance BOOLEAN NOT NULL DEFAULT false,
  bhyt_number VARCHAR(50),
  is_primary BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insurance_info_patient_id ON patient_schema.insurance_info(patient_id);
CREATE INDEX idx_insurance_info_bhyt_number ON patient_schema.insurance_info(bhyt_number);

-- patient_schema.emergency_contacts
CREATE TABLE patient_schema.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL REFERENCES patient_schema.patients(patient_id),
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  primary_phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_contacts_patient_id ON patient_schema.emergency_contacts(patient_id);

-- patient_schema.patient_consents
CREATE TABLE patient_schema.patient_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL REFERENCES patient_schema.patients(patient_id),
  consent_type VARCHAR(100) NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_consents_patient_id ON patient_schema.patient_consents(patient_id);

-- patient_schema.patient_links
CREATE TABLE patient_schema.patient_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL REFERENCES patient_schema.patients(patient_id),
  other_patient_id VARCHAR(20) NOT NULL REFERENCES patient_schema.patients(patient_id),
  link_type VARCHAR(20) NOT NULL,  -- replaced-by, replaces, refer, seealso
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_patient_links_patient_id ON patient_schema.patient_links(patient_id);
CREATE INDEX idx_patient_links_other_patient_id ON patient_schema.patient_links(other_patient_id);
```

---

### 2. SupabasePatientRepository

**File**: `src/infrastructure/repositories/SupabasePatientRepository.ts`

**Methods to Implement**:
- `findById(patientId: PatientId): Promise<Patient | null>`
- `findByUserId(userId: string): Promise<Patient | null>`
- `findByNationalId(nationalId: string): Promise<Patient | null>`
- `findByBHYTNumber(bhytNumber: string): Promise<Patient | null>`
- `save(patient: Patient): Promise<void>`
- `delete(patientId: PatientId): Promise<void>`
- `findWithFilters(...): Promise<{patients: Patient[], total: number}>`
- `searchPatients(...): Promise<{patients: Patient[], total: number}>`
- `matchPatients(...): Promise<Array<{patient: Patient, matchGrade, score}>>`

**Key Challenges**:
- Map between domain model (Patient aggregate) and database model (JSONB + relational)
- Implement PMI matching algorithm
- Handle transactions for save operations

---

### 3. PatientMatchingService

**File**: `src/infrastructure/services/PatientMatchingService.ts`

**Methods**:
- `matchPatients(criteria, onlyCertainMatches, limit): Promise<Array<{patient, matchGrade, score}>>`
- `calculateMatchScore(patient, criteria): number`
- `determineMatchGrade(score): 'certain' | 'probable' | 'possible' | 'certainly-not'`

**Matching Algorithm**:
```typescript
// Scoring weights
const weights = {
  nationalId: 40,  // Exact match = 40 points
  fullName: 20,    // Exact match = 20 points
  dateOfBirth: 20, // Exact match = 20 points
  primaryPhone: 15, // Exact match = 15 points
  email: 5         // Exact match = 5 points
};

// Match grades
// 90-100: certain
// 70-89: probable
// 50-69: possible
// 0-49: certainly-not
```

---

### 4. InsuranceValidationService

**File**: `src/infrastructure/services/InsuranceValidationService.ts`

**Methods**:
- `validateBHYTNumber(bhytNumber: string): boolean`
- `validateBHTNNumber(bhtnNumber: string): boolean`
- `checkExpiration(validFrom: Date, validTo: Date): boolean`

**BHYT Format**: `HN-1-01-2024-12345-67890`
- Province code (2 letters)
- Priority level (1 digit)
- Group code (2 digits)
- Year (4 digits)
- ID (5 digits)
- Check digit (5 digits)

---

### 5. PatientDomainEventHandler

**File**: `src/infrastructure/events/PatientDomainEventHandler.ts`

**Events to Handle**:
- `PatientRegisteredEvent` → Log, publish to message queue
- `PatientUpdatedEvent` → Log, publish to message queue
- `PatientMergedEvent` → Log, publish to message queue, notify Clinical EMR
- `PatientLinkedEvent` → Log, publish to message queue
- `PatientDeactivatedEvent` → Log, publish to message queue
- `PatientConsentGrantedEvent` → Log, publish to message queue

---

## ⏱️ ESTIMATED TIME

- Database Schema: 30 minutes
- SupabasePatientRepository: 1-1.5 hours
- PatientMatchingService: 30 minutes
- InsuranceValidationService: 15 minutes
- PatientDomainEventHandler: 30 minutes

**Total**: 2.5-3 hours

---

## 🚀 NEXT STEPS

1. Create database schema SQL file
2. Implement SupabasePatientRepository
3. Implement PatientMatchingService
4. Implement InsuranceValidationService
5. Implement PatientDomainEventHandler
6. Test with real Supabase data

---

## 📝 NOTES

- Use Supabase client from shared infrastructure
- Use circuit breaker for resilience
- Use graceful degradation for non-critical operations
- Follow Identity Service patterns for consistency

