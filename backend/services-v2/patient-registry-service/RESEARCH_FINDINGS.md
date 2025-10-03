# Patient Registry Service - Research Findings

## 📋 Executive Summary

**Date**: 2025-01-XX  
**Research Focus**: HL7 FHIR Patient Resource, Healthcare Standards, DDD Best Practices  
**Purpose**: Design production-ready Patient Registry Service for Vietnamese Healthcare

---

## 🏥 1. HL7 FHIR PATIENT RESOURCE ANALYSIS

### 1.1 FHIR Patient Resource Overview

**Source**: HL7 FHIR R5 Specification (https://www.hl7.org/fhir/patient.html)

**Definition**: 
> "Demographics and other administrative information about an individual or animal receiving care or other health-related services."

**Scope**: 
- Curative activities
- Psychiatric care
- Social services
- Pregnancy care
- Nursing and assisted living
- Dietary services
- Tracking of personal health and exercise data
- Tracking financial services (insurance subscriber/policy holder)

**Key Principle**:
> "The data in the Resource covers the 'who' information about the patient: its attributes are focused on the demographic information necessary to support the administrative, financial and logistic procedures."

### 1.2 FHIR Patient Resource Structure

#### **Core Properties** (What Patient Registry SHOULD have):

```typescript
// Based on HL7 FHIR R5 Patient Resource
interface FHIRPatient {
  // Identifiers
  identifier: Identifier[];  // MRN, National ID, Insurance Number
  active: boolean;  // Whether record is in active use
  
  // Demographics
  name: HumanName[];
  telecom: ContactPoint[];  // Phone, email
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: date;
  deceased: boolean | dateTime;
  address: Address[];
  maritalStatus: CodeableConcept;
  multipleBirth: boolean | integer;
  photo: Attachment[];
  
  // Contacts
  contact: PatientContact[];  // Emergency contacts, guardians
  
  // Communication
  communication: Communication[];  // Languages
  
  // Care Management
  generalPractitioner: Reference[];  // Primary care provider
  managingOrganization: Reference;  // Custodian organization
  
  // Linking
  link: PatientLink[];  // Link to other Patient/RelatedPerson
}
```

#### **What FHIR Patient Does NOT Include**:

❌ **Clinical Data** (belongs to other resources):
- Medical records → `Condition`, `Procedure`, `Observation`
- Medications → `MedicationStatement`, `MedicationRequest`
- Allergies → `AllergyIntolerance`
- Lab results → `DiagnosticReport`, `Observation`
- Vital signs → `Observation`

❌ **Scheduling Data** (belongs to other resources):
- Appointments → `Appointment`
- Encounters → `Encounter`

❌ **Financial Data** (belongs to other resources):
- Billing → `Claim`, `Invoice`
- Payments → `PaymentReconciliation`

### 1.3 Key FHIR Concepts

#### **1.3.1 Patient Linking**

FHIR defines 4 link types:

| Link Type | Description | Use Case |
|-----------|-------------|----------|
| `replaced-by` | This record is duplicate, use linked record instead | Duplicate resolution |
| `replaces` | This record replaces the linked record | Duplicate resolution |
| `refer` | This record refers to another authoritative record | Patient Index |
| `seealso` | This record is related to another record | Distributed records |

**Example**:
```json
{
  "link": [{
    "other": { "reference": "Patient/123" },
    "type": "replaced-by"
  }]
}
```

#### **1.3.2 Patient Status**

- `active: true` - Record is in use
- `active: false` - Record is duplicate or in error
- `deceased: true/dateTime` - Patient is deceased

#### **1.3.3 Gender vs Sex**

FHIR R5 distinguishes:
- **Administrative Gender** (`Patient.gender`) - For admin/record keeping
- **Gender Identity** - Extension for patient's self-identified gender
- **Sex Parameter for Clinical Use (SPCU)** - Extension for clinical decision making
- **Recorded Sex or Gender (RSG)** - Legal sex, sex assigned at birth

---

## 🇻🇳 2. VIETNAMESE HEALTHCARE STANDARDS

### 2.1 Patient Identification

**Source**: Vietnamese healthcare research papers

#### **National ID (CMND/CCCD)**:
- **CMND** (Chứng minh nhân dân) - Old format: 9 digits
- **CCCD** (Căn cước công dân) - New format: 12 digits
- **Validation**: Required for patient registration

#### **Patient ID Format**:
- **Common Format**: `PAT-YYYYMM-XXX`
  - `PAT` - Patient prefix
  - `YYYYMM` - Year and month of registration
  - `XXX` - Sequential number
- **Example**: `PAT-202501-001`

### 2.2 Vietnamese Health Insurance

#### **BHYT (Bảo hiểm y tế)** - Social Health Insurance:
- **Coverage**: ~90% of Vietnamese population
- **Number Format**: 15 characters
- **Structure**: `XX-Y-ZZ-AAAA-BBBBB-CCCCC`
  - `XX` - Province code
  - `Y` - Insurance type
  - `ZZ` - Organization code
  - `AAAA` - Year of issuance
  - `BBBBB` - Sequential number
  - `CCCCC` - Check digits

#### **BHTN (Bảo hiểm tự nguyện)** - Voluntary Health Insurance:
- **Coverage**: Additional coverage beyond BHYT
- **Format**: Varies by provider

#### **Private Insurance**:
- **Providers**: Prudential, Manulife, AIA, etc.
- **Format**: Provider-specific

### 2.3 Vietnamese Healthcare System

**Key Characteristics**:
- **Unique Patient Identifier**: Vietnam needs to assign unique patient ID to every citizen
- **Web-based Health Insurance System**: Claims data submitted online
- **Patient-Centered Care**: Transforming healthcare system
- **Digital Health Policy**: Hospital care digitalization

---

## 🏗️ 3. PATIENT MASTER INDEX (PMI) BEST PRACTICES

### 3.1 What is PMI?

**Definition**: 
> "A service used to manage patient identification in a context where multiple patient databases exist."

**Purpose**:
- Match patients between databases
- Manage patient identification
- Prevent duplicate records
- Support patient linking

### 3.2 PMI Core Functions

#### **3.2.1 Patient Matching**

**FHIR $match Operation**:
```http
POST [base]/Patient/$match
Content-Type: application/fhir+json

{
  "resourceType": "Parameters",
  "parameter": [{
    "name": "resource",
    "resource": {
      "resourceType": "Patient",
      "name": [{ "family": "Nguyen", "given": ["Van", "A"] }],
      "birthDate": "1990-01-01",
      "identifier": [{
        "system": "http://hospital.vn/cmnd",
        "value": "123456789"
      }]
    }
  }]
}
```

**Response**:
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "entry": [{
    "resource": { "resourceType": "Patient", "id": "123" },
    "search": {
      "extension": [{
        "url": "http://hl7.org/fhir/StructureDefinition/match-grade",
        "valueCode": "certain"
      }],
      "score": 0.95
    }
  }]
}
```

**Match Grades**:
- `certain` - Automatic match
- `probable` - Close match, needs review
- `possible` - May be match, needs review
- `certainly-not` - Known not to match

#### **3.2.2 Duplicate Management**

**Two Approaches**:
1. **Merging** - Combine duplicate records (FHIR $merge operation)
2. **Linking** - Link duplicate records (Patient.link property)

**Best Practice**: Use linking for flexibility, merging for finality

### 3.3 PMI Data Quality

**Key Challenges**:
- ~2% of registrations are errors (mostly duplicates)
- Duplicate detection is difficult
- Data quality maintenance is critical

**Solutions**:
- Automated matching algorithms
- Manual review workflows
- Data validation rules
- Regular data quality audits

---

## 🎯 4. DDD BOUNDED CONTEXT BEST PRACTICES

### 4.1 Patient Registry Bounded Context

**Source**: Domain-Driven Design healthcare examples

**Core Responsibilities**:
1. **Patient Identity Management**
2. **Demographics Management**
3. **Patient Master Index**
4. **Consent Management**

**NOT Responsibilities**:
- Clinical data → Clinical EMR Context
- Appointments → Scheduling Context
- Billing → Billing Context
- Authentication → Identity Context

### 4.2 Context Mapping

**Upstream Dependencies**:
- **Identity Service** (Customer-Supplier)
  - Patient Registry depends on Identity for user authentication
  - Integration: REST API calls

**Downstream Dependencies**:
- **Clinical EMR Service** (Customer-Supplier)
  - Clinical EMR depends on Patient Registry for patient identity
  - Integration: REST API calls, domain events

- **Scheduling Service** (Customer-Supplier)
  - Scheduling depends on Patient Registry for patient info
  - Integration: REST API calls

- **Billing Service** (Customer-Supplier)
  - Billing depends on Patient Registry for insurance info
  - Integration: REST API calls, domain events

### 4.3 Domain Events

**Key Events**:
- `PatientRegisteredEvent` - New patient registered
- `PatientUpdatedEvent` - Patient info updated
- `PatientMergedEvent` - Duplicate patients merged
- `PatientDeactivatedEvent` - Patient record deactivated
- `PatientConsentGrantedEvent` - Consent granted
- `PatientConsentRevokedEvent` - Consent revoked

**Event-Driven Integration**:
- Publish events to message bus (RabbitMQ)
- Downstream services subscribe to events
- Eventual consistency model

---

## 📊 5. MICROSERVICES BEST PRACTICES

### 5.1 Service Design Principles

**Single Responsibility**:
- Each service has one clear purpose
- Patient Registry = Patient Master Data only

**Bounded Context**:
- Clear boundaries between services
- No overlap in responsibilities

**Database per Service**:
- Each service has its own database schema
- Patient Registry → `patient_schema`
- Identity Service → `auth_schema`

**API Gateway Pattern**:
- Single entry point for clients
- Route requests to appropriate services

### 5.2 Data Management

**Event Sourcing**:
- Store domain events as source of truth
- Rebuild state from events

**CQRS**:
- Separate read and write models
- Optimize for different use cases

**Eventual Consistency**:
- Accept temporary inconsistency
- Use domain events for synchronization

### 5.3 Resilience Patterns

**Circuit Breaker**:
- Prevent cascading failures
- Graceful degradation

**Retry with Backoff**:
- Handle transient failures
- Exponential backoff

**Timeout**:
- Prevent hanging requests
- Fast failure

---

## 🎓 6. KEY LEARNINGS

### 6.1 From HL7 FHIR

1. **Patient Resource is ONLY for demographics** - No clinical data
2. **Patient Linking is critical** - Support duplicate management
3. **Gender vs Sex distinction** - Multiple attributes for different use cases
4. **Patient Matching is specialized** - Use $match operation, not regular search
5. **Active status management** - Mark duplicates as inactive

### 6.2 From Vietnamese Healthcare

1. **BHYT is critical** - 90% coverage, must support
2. **CMND/CCCD validation** - Required for patient registration
3. **Unique Patient ID** - PAT-YYYYMM-XXX format
4. **Web-based insurance system** - Digital integration required
5. **Patient-centered care** - Focus on patient experience

### 6.3 From PMI Best Practices

1. **~2% error rate** - Duplicate management is critical
2. **Match grades** - certain, probable, possible, certainly-not
3. **Linking vs Merging** - Linking for flexibility
4. **Data quality** - Regular audits and validation
5. **Automated matching** - Reduce manual review burden

### 6.4 From DDD

1. **Clear bounded context** - Patient Registry = Master Data only
2. **Ubiquitous language** - Consistent terminology
3. **Domain events** - Event-driven integration
4. **Context mapping** - Explicit relationships
5. **Aggregate design** - Patient as aggregate root

---

## 🚀 7. DESIGN RECOMMENDATIONS

### 7.1 Simplified Patient Aggregate

```typescript
export interface PatientProps {
  // Identity
  id: PatientId;  // PAT-YYYYMM-XXX
  userId: string;  // Reference to Identity Service
  
  // Demographics
  personalInfo: PersonalInfo;  // Name, DOB, gender, nationality, CMND/CCCD
  contactInfo: ContactInfo;  // Address, phone, email
  
  // Basic Medical (Emergency only)
  basicMedicalInfo: BasicMedicalInfo;  // Blood type, critical allergies
  
  // Insurance
  insuranceInfo?: InsuranceInfo;  // BHYT, BHTN, private
  
  // Contacts
  emergencyContacts: EmergencyContact[];
  
  // Consent
  consents: PatientConsent[];
  
  // Status
  status: PatientStatus;  // active, inactive, deceased, merged
  mergedInto?: PatientId;  // If merged
  
  // Linking
  links: PatientLink[];  // FHIR-style linking
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.2 Core Use Cases

**Must Have**:
1. ✅ RegisterPatientUseCase
2. ✅ UpdatePatientInfoUseCase
3. ✅ GetPatientProfileUseCase
4. ❌ SearchPatientsUseCase (MISSING)
5. ❌ MatchPatientsUseCase (MISSING - PMI $match)
6. ❌ MergePatientsUseCase (MISSING)
7. ❌ LinkPatientsUseCase (MISSING)
8. ❌ DeactivatePatientUseCase (MISSING)
9. ❌ ValidateInsuranceUseCase (MISSING)

### 7.3 Database Schema

**Tables**:
- `patient_profiles` - Main patient data
- `patient_identifiers` - Multiple identifiers (MRN, CMND, BHYT)
- `patient_contacts` - Emergency contacts
- `patient_consents` - HIPAA consents
- `patient_insurance` - Insurance information
- `patient_links` - Patient linking (duplicates)
- `patient_audit_logs` - Audit trail

---

## 📚 8. REFERENCES

1. **HL7 FHIR R5 Patient Resource**: https://www.hl7.org/fhir/patient.html
2. **Domain-Driven Design**: Eric Evans
3. **Vietnamese Healthcare Digital Policy**: PMC8867296
4. **Patient Master Index Best Practices**: ResearchGate
5. **Microservices Architecture**: Azure Architecture Center

---

**Next Steps**: Use these findings to redesign Patient Registry Service with correct bounded context and FHIR-aligned domain model.

