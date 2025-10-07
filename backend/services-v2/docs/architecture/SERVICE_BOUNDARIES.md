# Service Boundaries - Hospital Management System V2

**Version**: 2.0.0  
**Date**: 2025-01-07  
**Status**: ✅ Complete  
**Purpose**: Định nghĩa rõ ràng boundaries, responsibilities, và dependencies cho 7 core services

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Service Boundaries Matrix](#2-service-boundaries-matrix)
3. [Detailed Service Boundaries](#3-detailed-service-boundaries)
4. [Cross-Service Communication](#4-cross-service-communication)
5. [Data Ownership](#5-data-ownership)
6. [Anti-Patterns to Avoid](#6-anti-patterns-to-avoid)

---

## 1. OVERVIEW

### 1.1. Bounded Context Principle

Mỗi service là một **Bounded Context** trong DDD, có:
- **Clear boundaries**: Ranh giới rõ ràng về responsibilities
- **Own data**: Sở hữu data riêng (schema-per-service)
- **Domain model**: Domain model riêng biệt
- **Events**: Publish domain events để communicate

### 1.2. Service Communication Rules

```
✅ ALLOWED:
- REST API calls (synchronous)
- Domain events via RabbitMQ (asynchronous)
- Shared domain primitives (via shared kernel)

❌ NOT ALLOWED:
- Direct database access across services
- Shared tables between services
- Tight coupling via shared business logic
```

---

## 2. SERVICE BOUNDARIES MATRIX

| Service | Bounded Context | Core Domain | Supporting Domains | Generic Domains |
|---------|----------------|-------------|-------------------|-----------------|
| **Identity** | User Identity, Auth, Authorization | Authentication, RBAC | Audit Logging | Session Management |
| **Patient Registry** | Patient Demographics | Patient Identity, PMI | Insurance, Consents | Contact Management |
| **Provider/Staff** | Healthcare Providers | Doctor/Staff Profiles | Schedules, Credentials | Department Management |
| **Scheduling** | Appointments | Appointment Booking | Availability, Slots | Queue Management |
| **Clinical/EMR** | Medical Records | EMR, Diagnoses | Prescriptions, Lab Orders | FHIR Compliance |
| **Billing** | Financial Transactions | Invoicing, Payments | Insurance Claims | Payment Gateway |
| **Notifications** | Communication | Email, SMS, Push | Templates | Delivery Tracking |

---

## 3. DETAILED SERVICE BOUNDARIES

### 3.1. Identity Service

**Bounded Context**: User Identity, Authentication, Authorization

#### ✅ **SHOULD DO** (Core Responsibilities)

**1. Authentication**
- User login/logout
- JWT token generation/validation
- Password management (reset, change)
- MFA (Multi-Factor Authentication)
- Session management
- Token refresh

**2. Authorization**
- RBAC (Role-Based Access Control)
- Permission management
- Role assignment
- Access control checks

**3. User Identity**
- User accounts (CRUD)
- User profiles (basic identity info only)
- User roles
- User status (active/inactive/locked)

**4. Security**
- Account lockout
- Login attempts tracking
- Authentication audit logs
- PHI access logs (HIPAA)
- Password policies

#### ❌ **SHOULD NOT DO** (Out of Scope)

- ❌ User preferences (application settings) → Patient/Provider Services
- ❌ Notification preferences → Notifications Service
- ❌ Patient demographics → Patient Registry Service
- ❌ Doctor schedules → Provider/Staff Service
- ❌ Appointment booking → Scheduling Service
- ❌ Medical records → Clinical/EMR Service
- ❌ Billing information → Billing Service

#### 📊 **Data Ownership**

**Tables** (auth_schema):
- `user_profiles` - User identity
- `healthcare_roles` - Roles
- `role_permissions` - Permissions
- `user_sessions` - Sessions
- `password_reset_tokens` - Password reset
- `two_factor_auth` - MFA
- `account_lockouts` - Security
- `login_attempts` - Security
- `audit_logs` - Authentication audit
- `phi_access_logs` - HIPAA compliance

#### 🔗 **Dependencies**

**Upstream**: None (foundational service)
**Downstream**: All services depend on Identity for authentication

---

### 3.2. Patient Registry Service

**Bounded Context**: Patient Demographics, Insurance, Consents

#### ✅ **SHOULD DO** (Core Responsibilities)

**1. Patient Demographics**
- Patient registration
- Personal information (name, DOB, gender, nationality)
- Contact information (address, phone, email)
- Emergency contacts

**2. Patient Master Index (PMI)**
- Patient identity management
- Patient search and lookup
- Patient matching (duplicate detection)
- Patient merging/linking

**3. Insurance Management**
- BHYT (Vietnamese health insurance)
- BHTN (Vietnamese social insurance)
- Private insurance
- Insurance validation

**4. Consent Management**
- HIPAA consents
- Data sharing permissions
- Treatment consents

#### ❌ **SHOULD NOT DO** (Out of Scope)

- ❌ User authentication → Identity Service
- ❌ Medical records → Clinical/EMR Service
- ❌ Appointments → Scheduling Service
- ❌ Billing/Payments → Billing Service
- ❌ Doctor information → Provider/Staff Service
- ❌ Notifications → Notifications Service

#### 📊 **Data Ownership**

**Tables** (patient_schema):
- `patient_profiles` - Patient demographics
- `insurance_info` - Insurance details
- `emergency_contacts` - Emergency contacts
- `patient_consents` - Consent records
- `patient_links` - Patient relationships

#### 🔗 **Dependencies**

**Upstream**: Identity Service (user authentication)
**Downstream**: Clinical/EMR, Scheduling, Billing

---

### 3.3. Provider/Staff Service

**Bounded Context**: Healthcare Providers, Staff Management

#### ✅ **SHOULD DO** (Core Responsibilities)

**1. Provider Profiles**
- Doctor profiles
- Nurse profiles
- Staff profiles
- Professional information (license, specializations)

**2. Credentials & Certifications**
- Medical licenses
- Certifications
- Continuing education

**3. Work Schedules**
- Doctor availability
- Shift management
- Department assignments

**4. Professional Details**
- Years of experience
- Consultation fees
- Patient ratings/reviews
- Specializations

#### ❌ **SHOULD NOT DO** (Out of Scope)

- ❌ User authentication → Identity Service
- ❌ Appointment booking → Scheduling Service
- ❌ Medical records → Clinical/EMR Service
- ❌ Patient information → Patient Registry Service
- ❌ Billing → Billing Service
- ❌ Notifications → Notifications Service

#### 📊 **Data Ownership**

**Tables** (provider_schema):
- `provider_profiles` - Doctor/Staff profiles
- `credentials` - Licenses, certifications
- `work_schedules` - Availability
- `specializations` - Medical specializations
- `department_assignments` - Department links

#### 🔗 **Dependencies**

**Upstream**: Identity Service (user authentication)
**Downstream**: Scheduling, Clinical/EMR

---

### 3.4. Scheduling Service

**Bounded Context**: Appointments, Availability, Queue Management

#### ✅ **SHOULD DO** (Core Responsibilities)

**1. Appointment Management**
- Appointment booking
- Appointment rescheduling
- Appointment cancellation
- Appointment status tracking

**2. Availability Management**
- Doctor availability slots
- Slot management
- Availability rules

**3. Queue Management**
- Waiting queue
- Queue prioritization
- Walk-in management

**4. Appointment Reminders**
- Reminder scheduling (trigger Notifications Service)
- Reminder preferences

#### ❌ **SHOULD NOT DO** (Out of Scope)

- ❌ User authentication → Identity Service
- ❌ Patient demographics → Patient Registry Service
- ❌ Doctor profiles → Provider/Staff Service
- ❌ Medical records → Clinical/EMR Service
- ❌ Billing → Billing Service
- ❌ Sending notifications → Notifications Service (only trigger)

#### 📊 **Data Ownership**

**Tables** (scheduling_schema):
- `appointments` - Appointment records
- `availability_slots` - Doctor availability
- `appointment_queue` - Waiting queue
- `appointment_reminders` - Reminder schedules
- `appointment_history` - Audit trail

#### 🔗 **Dependencies**

**Upstream**: Identity, Patient Registry, Provider/Staff
**Downstream**: Clinical/EMR, Billing, Notifications

---

### 3.5. Clinical/EMR Service

**Bounded Context**: Medical Records, Diagnoses, Prescriptions

#### ✅ **SHOULD DO** (Core Responsibilities)

**1. Medical Records (EMR)**
- Electronic Medical Records
- Medical history
- Vital signs
- Clinical notes

**2. Diagnoses**
- Diagnosis management
- ICD-10 codes
- Treatment plans

**3. Prescriptions**
- Medication prescriptions
- Dosage instructions
- Prescription history

**4. Lab Orders & Results**
- Lab test orders
- Lab results
- Imaging orders
- Imaging results

**5. FHIR Compliance**
- FHIR R4 export
- Interoperability

#### ❌ **SHOULD NOT DO** (Out of Scope)

- ❌ User authentication → Identity Service
- ❌ Patient demographics → Patient Registry Service
- ❌ Doctor profiles → Provider/Staff Service
- ❌ Appointments → Scheduling Service
- ❌ Billing → Billing Service
- ❌ Notifications → Notifications Service

#### 📊 **Data Ownership**

**Tables** (clinical_schema):
- `medical_records` - EMR
- `diagnoses` - Diagnoses
- `prescriptions` - Prescriptions
- `lab_orders` - Lab orders
- `lab_results` - Lab results
- `vital_signs` - Vital signs

#### 🔗 **Dependencies**

**Upstream**: Identity, Patient Registry, Provider/Staff, Scheduling
**Downstream**: Billing, Notifications

---

### 3.6. Billing Service

**Bounded Context**: Financial Transactions, Invoicing, Payments

#### ✅ **SHOULD DO** (Core Responsibilities)

**1. Invoicing**
- Invoice generation
- Invoice management
- Invoice history

**2. Payments**
- Payment processing
- Payment methods (cash, card, PayOS)
- Payment history
- Refunds

**3. Insurance Claims**
- BHYT claims
- BHTN claims
- Private insurance claims
- Claim status tracking

**4. Financial Reports**
- Revenue reports
- Payment analytics
- Outstanding balances

#### ❌ **SHOULD NOT DO** (Out of Scope)

- ❌ User authentication → Identity Service
- ❌ Patient demographics → Patient Registry Service
- ❌ Medical records → Clinical/EMR Service
- ❌ Appointments → Scheduling Service
- ❌ Notifications → Notifications Service

#### 📊 **Data Ownership**

**Tables** (billing_schema):
- `invoices` - Invoices
- `payments` - Payment records
- `insurance_claims` - Claims
- `payment_methods` - Payment methods

#### 🔗 **Dependencies**

**Upstream**: Identity, Patient Registry, Clinical/EMR, Scheduling
**Downstream**: Notifications

---

### 3.7. Notifications Service

**Bounded Context**: Communication, Notifications, Templates

#### ✅ **SHOULD DO** (Core Responsibilities)

**1. Notification Delivery**
- Email notifications
- SMS notifications
- Push notifications

**2. Template Management**
- Notification templates
- Template variables
- Multi-language support

**3. Notification Preferences**
- User notification preferences
- Channel preferences (email, SMS, push)
- Notification types preferences

**4. Delivery Tracking**
- Delivery status
- Read receipts
- Delivery history

#### ❌ **SHOULD NOT DO** (Out of Scope)

- ❌ User authentication → Identity Service
- ❌ Patient demographics → Patient Registry Service
- ❌ Medical records → Clinical/EMR Service
- ❌ Appointments → Scheduling Service
- ❌ Billing → Billing Service

#### 📊 **Data Ownership**

**Tables** (notification_schema):
- `notifications` - Notification records
- `notification_templates` - Templates
- `notification_preferences` - User preferences
- `delivery_logs` - Delivery tracking

#### 🔗 **Dependencies**

**Upstream**: All services (receive notification requests)
**Downstream**: None (leaf service)

---

## 4. CROSS-SERVICE COMMUNICATION

### 4.1. Synchronous Communication (REST API)

```
Identity Service
  ↓ (authenticate)
All Services

Patient Registry
  ↓ (get patient info)
Clinical/EMR, Scheduling, Billing

Provider/Staff
  ↓ (get doctor info)
Scheduling, Clinical/EMR

Scheduling
  ↓ (get appointment info)
Clinical/EMR, Billing
```

### 4.2. Asynchronous Communication (Events)

```
Identity Service
  → UserCreated, UserDeactivated
  
Patient Registry
  → PatientRegistered, PatientUpdated
  
Scheduling
  → AppointmentBooked, AppointmentCancelled
  → (triggers) Notifications Service
  
Clinical/EMR
  → MedicalRecordCreated, PrescriptionIssued
  → (triggers) Billing Service
  
Billing
  → InvoiceGenerated, PaymentReceived
  → (triggers) Notifications Service
```

---

## 5. DATA OWNERSHIP

### 5.1. Data Ownership Rules

```
✅ EACH SERVICE OWNS ITS DATA:
- Identity Service owns user_profiles
- Patient Registry owns patient_profiles
- Provider/Staff owns provider_profiles
- Scheduling owns appointments
- Clinical/EMR owns medical_records
- Billing owns invoices
- Notifications owns notifications

❌ NO SHARED TABLES:
- Each service has its own schema
- No direct database access across services
- Use events or API calls for data access
```

### 5.2. Reference Data

```
Services can store REFERENCES to other services' data:
- patient_id (reference to Patient Registry)
- doctor_id (reference to Provider/Staff)
- user_id (reference to Identity Service)

But CANNOT store full data from other services!
```

---

## 6. ANTI-PATTERNS TO AVOID

### ❌ **Anti-Pattern 1: Cross-Service Database Access**

```typescript
// ❌ BAD: Direct database access
const patient = await supabase
  .from('patient_schema.patient_profiles')
  .select('*')
  .eq('id', patientId);

// ✅ GOOD: API call
const patient = await patientRegistryService.getPatient(patientId);
```

### ❌ **Anti-Pattern 2: Shared Tables**

```sql
-- ❌ BAD: Shared table
CREATE TABLE shared_schema.user_preferences (
  user_id UUID,
  preferences JSONB
);

-- ✅ GOOD: Each service owns its preferences
CREATE TABLE patient_schema.patient_preferences (...);
CREATE TABLE provider_schema.provider_preferences (...);
```

### ❌ **Anti-Pattern 3: God Service**

```typescript
// ❌ BAD: Identity Service doing too much
class IdentityService {
  async getUserWithPatientAndAppointments(userId) {
    // Fetching data from multiple services
    const user = await this.getUser(userId);
    const patient = await this.getPatient(userId); // ❌ Wrong!
    const appointments = await this.getAppointments(userId); // ❌ Wrong!
    return { user, patient, appointments };
  }
}

// ✅ GOOD: Each service handles its own data
class IdentityService {
  async getUser(userId) {
    return await this.userRepository.findById(userId);
  }
}
```

---

## 📊 SUMMARY

### Service Responsibilities Summary

| Service | Primary Responsibility | Key Entities | Events Published |
|---------|----------------------|--------------|------------------|
| **Identity** | Authentication, Authorization | User, Role, Session | UserCreated, UserAuthenticated |
| **Patient Registry** | Patient Demographics | Patient, Insurance, Consent | PatientRegistered, PatientUpdated |
| **Provider/Staff** | Healthcare Providers | Doctor, Nurse, Staff | ProviderCreated, ProviderUpdated |
| **Scheduling** | Appointments | Appointment, Slot, Queue | AppointmentBooked, AppointmentCancelled |
| **Clinical/EMR** | Medical Records | MedicalRecord, Diagnosis, Prescription | RecordCreated, PrescriptionIssued |
| **Billing** | Financial Transactions | Invoice, Payment, Claim | InvoiceGenerated, PaymentReceived |
| **Notifications** | Communication | Notification, Template | NotificationSent, NotificationFailed |

---

**Author**: Hospital Management Team  
**Last Updated**: 2025-01-07  
**Version**: 2.0.0

