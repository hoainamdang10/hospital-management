# Patient Registry Service - DDD Bounded Context Analysis

## 📋 Executive Summary

**Date**: 2025-01-XX  
**Status**: 🔴 **NEEDS REDESIGN**  
**Current Score**: 4.5/10  
**Target Score**: 10/10 (Production Ready like Identity Service)

---

## 🎯 1. BOUNDED CONTEXT DEFINITION

### 1.1 What is Patient Registry Service?

**Patient Registry Service** là một **Bounded Context** trong Hospital Management System chịu trách nhiệm quản lý **Patient Master Data** - thông tin cơ bản và nhận dạng của bệnh nhân.

### 1.2 Core Responsibilities (What it SHOULD do)

✅ **Patient Identity Management**:
- Đăng ký bệnh nhân mới (Patient Registration)
- Quản lý thông tin nhận dạng (CMND/CCCD, BHYT)
- Tạo và quản lý Patient ID (PAT-YYYYMM-XXX)
- Merge duplicate patient records

✅ **Demographics Management**:
- Thông tin cá nhân (họ tên, ngày sinh, giới tính, quốc tịch)
- Thông tin liên hệ (địa chỉ, số điện thoại, email)
- Thông tin bảo hiểm (BHYT, BHTN, private insurance)

✅ **Patient Master Index (PMI)**:
- Duy trì single source of truth cho patient identity
- Cross-reference với các services khác
- Patient search và lookup

✅ **Consent Management**:
- HIPAA consent tracking
- Data sharing permissions
- Treatment consent records

### 1.3 What it SHOULD NOT do (Out of Scope)

❌ **Clinical Data Management** → Clinical EMR Service
- Medical records, diagnoses, treatments
- Lab results, imaging reports
- Clinical notes, prescriptions

❌ **Appointment Scheduling** → Scheduling Service
- Appointment booking, cancellation
- Provider availability
- Waitlist management

❌ **Billing & Payments** → Billing Service
- Invoices, payments, insurance claims
- Financial transactions

❌ **Authentication & Authorization** → Identity Service
- User login, password management
- Role-based access control
- Session management

---

## 🏗️ 2. DOMAIN MODEL ANALYSIS

### 2.1 Aggregate Roots

#### **Patient Aggregate** (Primary Aggregate Root)

**Responsibilities**:
- Enforce patient identity invariants
- Manage patient lifecycle (active, inactive, deceased, merged)
- Coordinate patient information updates
- Publish domain events

**Entities within Aggregate**:
- `Patient` (Root)
- `EmergencyContact` (Entity)
- `InsuranceInfo` (Entity)
- `PatientConsent` (Entity)

**Value Objects**:
- `PatientId` (PAT-YYYYMM-XXX format)
- `PersonalInfo` (name, DOB, gender, nationality, CMND/CCCD)
- `ContactInfo` (address, phone, email)
- `MedicalInfo` (blood type, allergies, chronic conditions) ⚠️ **QUESTIONABLE**

**Domain Events**:
- `PatientRegisteredEvent`
- `PatientUpdatedEvent`
- `PatientConsentGrantedEvent`
- `PatientConsentRevokedEvent`
- `PatientMergedEvent`
- `PatientDeactivatedEvent`

### 2.2 Current Issues with Domain Model

#### ❌ **Issue 1: MedicalInfo in Patient Aggregate**

**Problem**: `MedicalInfo` value object chứa quá nhiều clinical data:
```typescript
interface MedicalInfoProps {
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: Medication[];  // ❌ Clinical data
  emergencyMedicalInfo?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  smokingStatus: string;  // ❌ Clinical data
  alcoholConsumption: string;  // ❌ Clinical data
  exerciseFrequency: string;  // ❌ Clinical data
  dietaryRestrictions: string[];
  familyMedicalHistory: string[];  // ❌ Clinical data
}
```

**Why it's wrong**:
- Violates Single Responsibility Principle
- Patient Registry không nên quản lý clinical data
- Clinical data thuộc về Clinical EMR Service
- Tạo tight coupling giữa services

**Solution**:
```typescript
// Patient Registry Service - ONLY basic medical info
interface BasicMedicalInfoProps {
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  knownAllergies: string[];  // High-level allergies for emergency
  emergencyMedicalInfo?: string;  // Critical info for emergency
}

// Clinical EMR Service - Detailed clinical data
interface ClinicalMedicalHistoryProps {
  chronicConditions: Condition[];
  currentMedications: Medication[];
  smokingStatus: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  dietaryRestrictions: string[];
  familyMedicalHistory: FamilyHistory[];
  vitalSigns: VitalSigns[];
}
```

#### ❌ **Issue 2: MedicalHistory Entity**

**Problem**: `MedicalHistory` entity trong Patient aggregate:
```typescript
export class MedicalHistory extends Entity<MedicalHistoryProps> {
  // Condition tracking, severity, status, duration
}
```

**Why it's wrong**:
- Medical history là clinical data
- Thuộc về Clinical EMR Service, không phải Patient Registry
- Tạo confusion về bounded context boundaries

**Solution**: Remove `MedicalHistory` entity từ Patient Registry Service

---

## 🔄 3. UBIQUITOUS LANGUAGE

### 3.1 Core Terms (Patient Registry Context)

| Term | Definition | Vietnamese |
|------|------------|------------|
| **Patient** | A person registered in the hospital system | Bệnh nhân |
| **Patient ID** | Unique identifier (PAT-YYYYMM-XXX) | Mã bệnh nhân |
| **Patient Master Index (PMI)** | Central registry of all patients | Danh bạ bệnh nhân |
| **Demographics** | Basic personal information | Thông tin nhân khẩu |
| **BHYT** | Vietnamese social health insurance | Bảo hiểm y tế |
| **BHTN** | Vietnamese voluntary health insurance | Bảo hiểm tự nguyện |
| **CMND/CCCD** | Vietnamese national ID | Chứng minh nhân dân/Căn cước công dân |
| **Emergency Contact** | Person to contact in emergency | Người liên hệ khẩn cấp |
| **Consent** | Patient permission for data usage | Đồng ý sử dụng dữ liệu |
| **Patient Merge** | Combining duplicate patient records | Gộp hồ sơ trùng lặp |

### 3.2 Terms to AVOID (Belong to other contexts)

| Term | Belongs To | Reason |
|------|------------|--------|
| **Medical Record** | Clinical EMR Service | Clinical data |
| **Diagnosis** | Clinical EMR Service | Clinical data |
| **Prescription** | Clinical EMR Service | Clinical data |
| **Appointment** | Scheduling Service | Scheduling data |
| **Invoice** | Billing Service | Financial data |
| **User** | Identity Service | Authentication data |

---

## 🔗 4. CONTEXT MAPPING

### 4.1 Upstream Dependencies

**Identity Service** (Upstream - Conformist):
- Patient Registry depends on Identity Service for user authentication
- Relationship: **Customer-Supplier** (Identity Service is supplier)
- Integration: REST API calls to verify user identity
- Data: `userId` reference to `auth_schema.user_profiles`

### 4.2 Downstream Dependencies

**Clinical EMR Service** (Downstream - Conformist):
- Clinical EMR depends on Patient Registry for patient identity
- Relationship: **Customer-Supplier** (Patient Registry is supplier)
- Integration: REST API calls to get patient demographics
- Data: `patientId` reference to `patient_schema.patient_profiles`

**Scheduling Service** (Downstream - Conformist):
- Scheduling depends on Patient Registry for patient info
- Relationship: **Customer-Supplier** (Patient Registry is supplier)
- Integration: REST API calls to validate patient existence
- Data: `patientId` reference

**Billing Service** (Downstream - Conformist):
- Billing depends on Patient Registry for insurance info
- Relationship: **Customer-Supplier** (Patient Registry is supplier)
- Integration: REST API calls to get insurance details
- Data: `patientId` reference, insurance info

### 4.3 Shared Kernel

**Shared Domain Primitives**:
- `PatientId` value object (shared across all services)
- `HealthcareAggregateRoot` base class
- `DomainEvent` base class
- Common value objects (Email, PhoneNumber, Address)

---

## 📊 5. COMPARISON WITH IDENTITY SERVICE

### 5.1 Identity Service (10/10 - Production Ready)

**Bounded Context**: Authentication & Authorization
**Core Aggregate**: User
**Responsibilities**:
- User registration, login, logout
- Password management
- Role-based access control (RBAC)
- Session management
- Audit logging

**Why it's excellent**:
✅ Clear bounded context boundaries
✅ Single responsibility (authentication only)
✅ No overlap with other services
✅ Clean domain model
✅ Comprehensive testing (29/29 tests passing)
✅ Real Supabase integration
✅ Production-ready infrastructure

### 5.2 Patient Registry Service (4.5/10 - Needs Redesign)

**Bounded Context**: Patient Master Data (UNCLEAR)
**Core Aggregate**: Patient (BLOATED)
**Responsibilities**: MIXED (demographics + clinical data)

**Why it needs redesign**:
❌ Unclear bounded context boundaries
❌ Mixed responsibilities (demographics + clinical)
❌ Bloated domain model (MedicalInfo, MedicalHistory)
❌ Missing core features (patient merge, search)
❌ No tests
❌ Build errors (~48 errors)
❌ Not production-ready

---

## 🎯 6. RECOMMENDED REDESIGN

### 6.1 Refined Bounded Context

**Name**: Patient Registry Service  
**Purpose**: Patient Master Data Management  
**Scope**: Patient identity, demographics, insurance, consent

### 6.2 Refined Domain Model

#### **Patient Aggregate** (Simplified)

```typescript
export interface PatientProps {
  id: PatientId;
  userId: string;  // Reference to Identity Service
  personalInfo: PersonalInfo;  // Name, DOB, gender, nationality, CMND/CCCD
  contactInfo: ContactInfo;  // Address, phone, email
  basicMedicalInfo: BasicMedicalInfo;  // Blood type, critical allergies only
  insuranceInfo?: InsuranceInfo;  // BHYT, BHTN, private insurance
  emergencyContacts: EmergencyContact[];
  consents: PatientConsent[];
  status: PatientStatus;  // active, inactive, deceased, merged
  mergedInto?: PatientId;  // If merged, reference to master patient
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Removed Entities**:
- ❌ `MedicalHistory` → Move to Clinical EMR Service

#### **Simplified Value Objects**:
```typescript
// KEEP (Patient Registry responsibility)
- PatientId
- PersonalInfo
- ContactInfo
- BasicMedicalInfo (simplified)

// REMOVE (Clinical EMR responsibility)
- MedicalInfo (detailed clinical data)
```

### 6.3 New Use Cases

**Core Use Cases** (Must Have):
1. ✅ RegisterPatientUseCase
2. ✅ UpdatePatientInfoUseCase
3. ✅ GetPatientProfileUseCase
4. ❌ SearchPatientsUseCase (MISSING)
5. ❌ MergePatientsUseCase (MISSING)
6. ❌ DeactivatePatientUseCase (MISSING)
7. ❌ ValidatePatientInsuranceUseCase (MISSING)

---

## 📝 7. ACTION PLAN

### Phase 1: Domain Model Cleanup (Priority: CRITICAL)
1. Remove `MedicalHistory` entity
2. Simplify `MedicalInfo` to `BasicMedicalInfo`
3. Remove clinical data fields (medications, smoking, alcohol, etc.)
4. Add `PatientStatus` enum
5. Add `mergedInto` field for patient merge support

### Phase 2: Missing Use Cases (Priority: HIGH)
1. Implement `SearchPatientsUseCase`
2. Implement `MergePatientsUseCase`
3. Implement `DeactivatePatientUseCase`
4. Implement `ValidatePatientInsuranceUseCase`

### Phase 3: Infrastructure (Priority: HIGH)
1. Fix @shared module resolution
2. Create database schema (patient_schema)
3. Implement SupabasePatientRepository
4. Add circuit breaker protection

### Phase 4: Testing (Priority: HIGH)
1. Write integration tests with real Supabase data
2. Target: 100% test coverage like Identity Service
3. Test patient merge scenarios
4. Test insurance validation

### Phase 5: Documentation (Priority: MEDIUM)
1. Update README.md with clear bounded context definition
2. Document ubiquitous language
3. Create API documentation
4. Add deployment guides

---

## 🎓 8. KEY LEARNINGS FROM IDENTITY SERVICE

1. **Clear Bounded Context**: Identity Service chỉ làm authentication, không làm gì khác
2. **Single Responsibility**: Mỗi aggregate chỉ có một trách nhiệm rõ ràng
3. **Real Integration**: Sử dụng real Supabase data, không mock
4. **Comprehensive Testing**: 29/29 tests passing với real data
5. **Production-Ready Infrastructure**: Circuit breakers, health checks, monitoring

---

## 📚 9. REFERENCES

- **Domain-Driven Design** by Eric Evans
- **Implementing Domain-Driven Design** by Vaughn Vernon
- **Clean Architecture** by Robert C. Martin
- **Identity Service V2** (backend/services-v2/identity-service) - Reference implementation

---

**Next Steps**: Bạn có muốn tôi:
1. Bắt đầu redesign Patient aggregate với simplified domain model?
2. Tạo detailed technical design document?
3. Implement missing use cases?
4. Hoặc bạn muốn discuss thêm về bounded context?

