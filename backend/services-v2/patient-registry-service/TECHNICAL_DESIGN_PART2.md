# Patient Registry Service V2 - Technical Design (Part 2)

## 📊 4. DATABASE SCHEMA DESIGN (Continued)

### 4.2 Additional Tables

#### **Table: patient_consents**

```sql
CREATE TABLE patient_schema.patient_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('treatment', 'data_sharing', 'research', 'marketing')),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  granted_by VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawn_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patient_profiles(patient_id) ON DELETE CASCADE
);

CREATE INDEX idx_patient_consents_patient_id ON patient_schema.patient_consents(patient_id);
CREATE INDEX idx_patient_consents_type ON patient_schema.patient_consents(consent_type);
```

#### **Table: patient_links**

```sql
CREATE TABLE patient_schema.patient_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  other_patient_id VARCHAR(20) NOT NULL,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('replaced-by', 'replaces', 'refer', 'seealso')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patient_profiles(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_other_patient FOREIGN KEY (other_patient_id) REFERENCES patient_schema.patient_profiles(patient_id) ON DELETE CASCADE,
  CONSTRAINT unique_link UNIQUE (patient_id, other_patient_id, link_type)
);

CREATE INDEX idx_patient_links_patient_id ON patient_schema.patient_links(patient_id);
CREATE INDEX idx_patient_links_other_patient_id ON patient_schema.patient_links(other_patient_id);
```

#### **Table: patient_audit_logs**

```sql
CREATE TABLE patient_schema.patient_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  performed_by VARCHAR(255) NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patient_profiles(patient_id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_logs_patient_id ON patient_schema.patient_audit_logs(patient_id);
CREATE INDEX idx_audit_logs_performed_at ON patient_schema.patient_audit_logs(performed_at);
CREATE INDEX idx_audit_logs_action ON patient_schema.patient_audit_logs(action);
```

### 4.3 Database Functions

#### **Function: generate_patient_id()**

```sql
CREATE OR REPLACE FUNCTION patient_schema.generate_patient_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  year_month VARCHAR(6);
  sequence_num INTEGER;
  patient_id VARCHAR(20);
BEGIN
  -- Get current year-month (YYYYMM)
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 12 FOR 3) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM patient_schema.patient_profiles
  WHERE patient_id LIKE 'PAT-' || year_month || '-%';
  
  -- Generate patient ID: PAT-YYYYMM-XXX
  patient_id := 'PAT-' || year_month || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN patient_id;
END;
$$ LANGUAGE plpgsql;
```

#### **Function: update_patient_updated_at()**

```sql
CREATE OR REPLACE FUNCTION patient_schema.update_patient_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_patient_updated_at
BEFORE UPDATE ON patient_schema.patient_profiles
FOR EACH ROW
EXECUTE FUNCTION patient_schema.update_patient_updated_at();
```

---

## 🔌 5. API DESIGN

### 5.1 REST API Endpoints

#### **Base URL**: `http://localhost:3023/api/v1`

#### **Patient Registration**

```http
POST /patients
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "uuid",
  "personalInfo": {
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "nationalId": "123456789",
    "nationality": "Vietnamese"
  },
  "contactInfo": {
    "primaryPhone": "0901234567",
    "email": "nguyenvana@example.com",
    "preferredContactMethod": "phone",
    "address": {
      "street": "123 Đường ABC",
      "ward": "Phường 1",
      "district": "Quận 1",
      "city": "TP. Hồ Chí Minh",
      "country": "Vietnam"
    }
  },
  "basicMedicalInfo": {
    "bloodType": "A+",
    "knownAllergies": ["Penicillin"]
  },
  "insuranceInfo": {
    "provider": "BHYT",
    "policyNumber": "HN-1-01-2024-12345-67890",
    "validFrom": "2024-01-01",
    "validTo": "2024-12-31",
    "coverageType": "BHYT",
    "isVietnameseInsurance": true,
    "bhytNumber": "HN-1-01-2024-12345-67890",
    "isPrimary": true
  },
  "emergencyContacts": [{
    "name": "Nguyễn Thị B",
    "relationship": "Vợ",
    "primaryPhone": "0907654321",
    "isPrimary": true
  }]
}

Response 201 Created:
{
  "success": true,
  "data": {
    "patientId": "PAT-202501-001",
    "userId": "uuid",
    "personalInfo": { ... },
    "contactInfo": { ... },
    "status": "active",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### **Get Patient Profile**

```http
GET /patients/:patientId
Authorization: Bearer <token>

Response 200 OK:
{
  "success": true,
  "data": {
    "patientId": "PAT-202501-001",
    "userId": "uuid",
    "personalInfo": { ... },
    "contactInfo": { ... },
    "basicMedicalInfo": { ... },
    "insuranceInfo": { ... },
    "emergencyContacts": [ ... ],
    "status": "active",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

#### **Search Patients**

```http
GET /patients/search?query=Nguyễn&limit=10&offset=0
Authorization: Bearer <token>

Response 200 OK:
{
  "success": true,
  "data": {
    "patients": [
      {
        "patientId": "PAT-202501-001",
        "fullName": "Nguyễn Văn A",
        "dateOfBirth": "1990-01-01",
        "gender": "male",
        "nationalId": "123456789",
        "status": "active"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

#### **Match Patients (PMI $match)**

```http
POST /patients/$match
Content-Type: application/json
Authorization: Bearer <token>

{
  "resource": {
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "1990-01-01",
    "nationalId": "123456789"
  },
  "onlyCertainMatches": false,
  "count": 10
}

Response 200 OK:
{
  "success": true,
  "data": {
    "matches": [
      {
        "patient": {
          "patientId": "PAT-202501-001",
          "fullName": "Nguyễn Văn A",
          "dateOfBirth": "1990-01-01",
          "nationalId": "123456789"
        },
        "matchGrade": "certain",
        "score": 0.95
      }
    ],
    "total": 1
  }
}
```

#### **Merge Patients**

```http
POST /patients/:duplicatePatientId/merge
Content-Type: application/json
Authorization: Bearer <token>

{
  "masterPatientId": "PAT-202501-001",
  "reason": "Duplicate record detected"
}

Response 200 OK:
{
  "success": true,
  "data": {
    "duplicatePatientId": "PAT-202501-002",
    "masterPatientId": "PAT-202501-001",
    "mergedAt": "2025-01-01T00:00:00Z"
  }
}
```

#### **Link Patients**

```http
POST /patients/:patientId/link
Content-Type: application/json
Authorization: Bearer <token>

{
  "otherPatientId": "PAT-202501-002",
  "linkType": "seealso"
}

Response 200 OK:
{
  "success": true,
  "data": {
    "patientId": "PAT-202501-001",
    "otherPatientId": "PAT-202501-002",
    "linkType": "seealso",
    "linkedAt": "2025-01-01T00:00:00Z"
  }
}
```

### 5.2 Error Responses

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Không tìm thấy bệnh nhân với ID: PAT-202501-999",
    "details": {
      "patientId": "PAT-202501-999"
    }
  }
}
```

**Error Codes**:
- `PATIENT_NOT_FOUND` - Patient not found
- `PATIENT_ALREADY_EXISTS` - Patient already exists
- `INVALID_PATIENT_DATA` - Invalid patient data
- `PATIENT_ALREADY_MERGED` - Patient already merged
- `PATIENT_INACTIVE` - Patient is inactive
- `INSURANCE_EXPIRED` - Insurance expired
- `UNAUTHORIZED` - Unauthorized access

---

## 🎯 6. USE CASE SPECIFICATIONS

### 6.1 RegisterPatientUseCase

**Purpose**: Register a new patient in the system

**Input**:
```typescript
interface RegisterPatientRequest {
  userId: string;
  personalInfo: PersonalInfoProps;
  contactInfo: ContactInfoProps;
  basicMedicalInfo: BasicMedicalInfoProps;
  insuranceInfo?: InsuranceInfoProps;
  emergencyContacts: EmergencyContactProps[];
  requestedBy: string;
}
```

**Output**:
```typescript
interface RegisterPatientResponse {
  success: boolean;
  patientId: string;
  patient: Patient;
}
```

**Business Rules**:
1. User ID must exist in Identity Service
2. National ID must be unique
3. BHYT number must be valid format if provided
4. At least one emergency contact required
5. Patient ID generated automatically (PAT-YYYYMM-XXX)

**Steps**:
1. Validate user exists in Identity Service
2. Validate national ID is unique
3. Create PersonalInfo value object
4. Create ContactInfo value object
5. Create BasicMedicalInfo value object
6. Create InsuranceInfo entity if provided
7. Create EmergencyContact entities
8. Create Patient aggregate
9. Save to repository
10. Publish PatientRegisteredEvent
11. Return response

---

### 6.2 MatchPatientsUseCase (PMI $match)

**Purpose**: Find matching patients based on demographic data (Patient Master Index)

**Input**:
```typescript
interface MatchPatientsRequest {
  resource: {
    fullName?: string;
    dateOfBirth?: Date;
    nationalId?: string;
    primaryPhone?: string;
    email?: string;
  };
  onlyCertainMatches: boolean;
  count: number;
}
```

**Output**:
```typescript
interface MatchPatientsResponse {
  success: boolean;
  matches: Array<{
    patient: Patient;
    matchGrade: 'certain' | 'probable' | 'possible' | 'certainly-not';
    score: number;
  }>;
  total: number;
}
```

**Matching Algorithm**:
1. **Exact Match** (score = 1.0, grade = certain):
   - National ID exact match
   - BHYT number exact match

2. **High Confidence** (score = 0.7-0.9, grade = probable):
   - Full name + DOB match
   - Full name + phone match
   - National ID fuzzy match (1-2 digit difference)

3. **Medium Confidence** (score = 0.5-0.7, grade = possible):
   - Partial name + DOB match
   - Partial name + phone match

4. **No Match** (score < 0.5, grade = certainly-not):
   - No significant matches

**Steps**:
1. Validate input parameters
2. Build search criteria
3. Query database with fuzzy matching
4. Calculate match scores
5. Assign match grades
6. Sort by score (descending)
7. Filter by onlyCertainMatches if requested
8. Limit results to count
9. Return matches

---

### 6.3 MergePatientsUseCase

**Purpose**: Merge duplicate patient records

**Input**:
```typescript
interface MergePatientsRequest {
  duplicatePatientId: string;
  masterPatientId: string;
  reason: string;
  performedBy: string;
}
```

**Output**:
```typescript
interface MergePatientsResponse {
  success: boolean;
  duplicatePatientId: string;
  masterPatientId: string;
  mergedAt: Date;
}
```

**Business Rules**:
1. Both patients must exist
2. Duplicate patient must be active
3. Master patient must be active
4. Cannot merge already merged patient
5. Cannot merge patient into itself

**Steps**:
1. Load duplicate patient
2. Load master patient
3. Validate business rules
4. Mark duplicate as merged
5. Update duplicate.mergedInto = masterPatientId
6. Create patient link (replaced-by)
7. Save duplicate patient
8. Publish PatientMergedEvent
9. Audit log the merge
10. Return response

---

## 🔗 7. INTEGRATION PATTERNS

### 7.1 Upstream Integration (Identity Service)

**Pattern**: Customer-Supplier (Patient Registry is Customer)

**Integration Points**:
1. **User Validation**: Verify user exists before patient registration
2. **User Lookup**: Get user details for audit logging

**Implementation**:
```typescript
// infrastructure/services/IdentityServiceClient.ts
export class IdentityServiceClient {
  async validateUser(userId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${IDENTITY_SERVICE_URL}/api/v1/users/${userId}`,
        { headers: { Authorization: `Bearer ${serviceToken}` } }
      );
      return response.status === 200;
    } catch (error) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
```

### 7.2 Downstream Integration (Event-Driven)

**Pattern**: Publisher-Subscriber (Patient Registry is Publisher)

**Published Events**:
- `PatientRegisteredEvent` → Clinical EMR, Scheduling, Billing
- `PatientUpdatedEvent` → Clinical EMR, Scheduling, Billing
- `PatientMergedEvent` → Clinical EMR, Scheduling, Billing
- `PatientDeactivatedEvent` → Clinical EMR, Scheduling

**Implementation**:
```typescript
// infrastructure/events/PatientDomainEventHandler.ts
export class PatientDomainEventHandler {
  constructor(
    private readonly eventBus: IEventBus
  ) {}

  async handlePatientRegistered(event: PatientRegisteredEvent): Promise<void> {
    await this.eventBus.publish('patient.registered', event.getPayload());
  }

  async handlePatientMerged(event: PatientMergedEvent): Promise<void> {
    await this.eventBus.publish('patient.merged', event.getPayload());
  }
}
```

---

**[CONTINUED IN NEXT FILE]**

Next sections:
- Section 8: Testing Strategy
- Section 9: Deployment Plan
- Section 10: Monitoring & Observability

