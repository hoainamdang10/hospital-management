# 🏗️ DATABASE DESIGN GUIDE - HOSPITAL MANAGEMENT SYSTEM V2

## 📋 MỤC LỤC

1. [Tổng Quan](#tổng-quan)
2. [Nguyên Tắc Thiết Kế](#nguyên-tắc-thiết-kế)
3. [Schema-per-Service Pattern](#schema-per-service-pattern)
4. [7 Core Services](#7-core-services)
5. [Event-Driven Architecture](#event-driven-architecture)
6. [Migration Strategy](#migration-strategy)
7. [Best Practices](#best-practices)

---

## 🎯 TỔNG QUAN

Hospital Management System V2 được thiết kế theo **Clean Architecture + DDD + CQRS + Event-Driven Microservices** với database trên **Supabase (PostgreSQL)**.

### **Kiến Trúc Database:**

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ auth_schema  │  │patient_schema│  │doctor_schema │      │
│  │ (Identity)   │  │  (Patient)   │  │ (Provider)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │appointment_  │  │medical_      │  │payment_      │      │
│  │schema        │  │records_schema│  │schema        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │notifications_│  │analytics_    │  │shared_       │      │
│  │schema        │  │schema        │  │schema        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         ↕                    ↕                    ↕
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ RabbitMQ     │    │ Redis Cache  │    │ Event Store  │
│ (Events)     │    │ (Performance)│    │ (Audit)      │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🔧 NGUYÊN TẮC THIẾT KẾ

### **1. Schema-per-Service (CRITICAL)**

✅ **ĐÚNG:**
```sql
-- Mỗi service có schema riêng
auth_schema.user_profiles
patient_schema.patient_profiles
doctor_schema.doctor_profiles

-- Reference by ID only (NO FK!)
patient_schema.patient_profiles.user_id UUID -- Reference to auth_schema
```

❌ **SAI:**
```sql
-- KHÔNG BAO GIỜ tạo cross-schema foreign keys
ALTER TABLE patient_schema.patient_profiles 
ADD CONSTRAINT fk_user_id 
FOREIGN KEY (user_id) REFERENCES auth_schema.user_profiles(id); -- ❌ VI PHẠM!
```

### **2. Event-Driven Communication**

Thay vì foreign keys, sử dụng domain events:

```typescript
// Identity Service publishes
await eventBus.publish(new UserCreatedEvent(userId, email, roleType));

// Patient Service subscribes
eventBus.subscribe('UserCreated', async (event: UserCreatedEvent) => {
  if (event.roleType === 'patient') {
    await patientService.createProfile(event.userId, event.email);
  }
});
```

### **3. Data Denormalization**

Chấp nhận duplicate data để tăng performance và independence:

```sql
-- appointment_schema.appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    
    -- Denormalized data (duplicated from other services)
    patient_name TEXT NOT NULL,      -- From patient_schema
    patient_phone TEXT NOT NULL,     -- From patient_schema
    doctor_name TEXT NOT NULL,       -- From doctor_schema
    doctor_specialty TEXT NOT NULL,  -- From doctor_schema
    ...
);
```

### **4. Eventual Consistency**

Chấp nhận eventual consistency thay vì strong consistency:

```typescript
// User created in Identity Service
const user = await identityService.createUser(data);

// Event published
await eventBus.publish(new UserCreatedEvent(user.id, user.email));

// Patient profile created asynchronously (eventual consistency)
// May take a few milliseconds to propagate
```

---

## 📊 SCHEMA-PER-SERVICE PATTERN

### **Compliance Checklist:**

- ✅ Mỗi service có schema riêng biệt
- ✅ Không có foreign keys cross-schema
- ✅ Reference by ID only (UUID/String)
- ✅ Validate references qua API calls
- ✅ Sử dụng domain events cho sync data
- ✅ Denormalize data khi cần thiết
- ✅ Eventual consistency được chấp nhận

### **Validation Pattern:**

```typescript
// Patient Service - Validate user exists before creating patient
async function createPatient(userId: string, data: PatientData) {
  // ✅ Validate via Identity Service API
  const userExists = await identityServiceClient.checkUserExists(userId);
  
  if (!userExists) {
    throw new Error('User not found in Identity Service');
  }
  
  // Create patient profile
  return await patientRepository.create({ userId, ...data });
}
```

---

## 🏥 7 CORE SERVICES

### **1. IDENTITY SERVICE** (auth_schema)

**Bounded Context:** User Identity, Authentication, Authorization

**Core Tables:**
- `user_profiles` - User accounts
- `healthcare_roles` - Role definitions
- `user_sessions` - Session management
- `role_permissions` - Granular permissions
- `audit_logs` - HIPAA audit trail
- `security_audit_events` - Security monitoring
- `phi_access_log` - PHI access tracking

**Key Events Published:**
- `UserCreatedEvent`
- `UserAuthenticatedEvent`
- `UserRoleChangedEvent`
- `UserDeactivatedEvent`

---

### **2. PATIENT REGISTRY SERVICE** (patient_schema)

**Bounded Context:** Patient Demographics, Registration, Insurance

**Core Tables:**
- `patient_profiles` - Patient information
- `patient_insurance` - Insurance policies
- `patient_emergency_contacts` - Emergency contacts
- `patient_consents` - HIPAA consents
- `patient_medical_history` - Chronic conditions

**Key Events Published:**
- `PatientRegisteredEvent`
- `PatientUpdatedEvent`
- `PatientInsuranceUpdatedEvent`

**Key Events Subscribed:**
- `UserCreatedEvent` → Auto-create patient profile

---

### **3. PROVIDER/STAFF SERVICE** (doctor_schema)

**Bounded Context:** Doctors, Nurses, Staff, Schedules

**Core Tables:**
- `doctor_profiles` - Doctor information
- `staff_profiles` - Nurses, technicians, receptionists
- `doctor_schedules` - Weekly schedules
- `doctor_availability` - Daily availability
- `doctor_credentials` - Licenses & certifications

**Key Events Published:**
- `DoctorRegisteredEvent`
- `DoctorScheduleUpdatedEvent`
- `DoctorAvailabilityChangedEvent`

**Key Events Subscribed:**
- `UserCreatedEvent` → Auto-create doctor/staff profile

---

### **4. SCHEDULING SERVICE** (appointment_schema)

**Bounded Context:** Appointments, Time Slots, Waitlist

**Core Tables:**
- `appointments` - Appointment bookings
- `appointment_types` - Appointment type definitions
- `time_slots` - Available time slots
- `appointment_waitlist` - Waitlist management
- `appointment_reminders` - Reminder tracking

**Key Events Published:**
- `AppointmentScheduledEvent`
- `AppointmentConfirmedEvent`
- `AppointmentCancelledEvent`
- `AppointmentCompletedEvent`

**Key Events Subscribed:**
- `PatientRegisteredEvent` → Enable appointment booking
- `DoctorScheduleUpdatedEvent` → Update available slots
- `DoctorAvailabilityChangedEvent` → Block/unblock slots

---

### **5. CLINICAL EMR SERVICE** (medical_records_schema)

**Bounded Context:** Medical Records, Diagnoses, Prescriptions, FHIR

**Core Tables:**
- `medical_records` - Medical records
- `diagnoses` - Detailed diagnoses
- `prescriptions` - Medication prescriptions
- `lab_orders` - Laboratory test orders
- `lab_results` - Detailed lab results
- `medical_documents` - Attachments & scans

**Key Events Published:**
- `MedicalRecordCreatedEvent`
- `PrescriptionCreatedEvent`
- `LabResultsReadyEvent`

**Key Events Subscribed:**
- `AppointmentCompletedEvent` → Create medical record

---

### **6. BILLING SERVICE** (payment_schema)

**Bounded Context:** Invoices, Payments, Insurance Claims

**Core Tables:**
- `invoices` - Patient invoices
- `invoice_items` - Line items
- `payments` - Payment transactions
- `insurance_claims` - Insurance claims

**Key Events Published:**
- `InvoiceGeneratedEvent`
- `PaymentReceivedEvent`
- `InvoiceOverdueEvent`
- `InsuranceClaimSubmittedEvent`
- `InsuranceClaimProcessedEvent`

**Key Events Subscribed:**
- `AppointmentCompletedEvent` → Generate invoice
- `MedicalRecordCreatedEvent` → Add charges
- `PrescriptionCreatedEvent` → Add medication charges

---

### **7. NOTIFICATIONS SERVICE** (notifications_schema)

**Bounded Context:** Notifications, Alerts, Reminders

**Core Tables:**
- `notifications` - All notifications
- `notification_templates` - Reusable templates
- `notification_preferences` - User preferences
- `notification_delivery_log` - Delivery tracking

**Key Events Published:**
- `NotificationSentEvent`
- `NotificationFailedEvent`

**Key Events Subscribed:**
- `AppointmentScheduledEvent` → Send confirmation
- `AppointmentCancelledEvent` → Send cancellation notice
- `LabResultsReadyEvent` → Notify patient
- `InvoiceGeneratedEvent` → Send invoice notification
- `PaymentReceivedEvent` → Send receipt

---

## 🔄 EVENT-DRIVEN ARCHITECTURE

### **Event Flow Example: Patient Registration**

```
1. User creates account
   ┌─────────────────┐
   │ Identity Service│
   └────────┬────────┘
            │ UserCreatedEvent
            ↓
   ┌─────────────────┐
   │   Event Bus     │
   │   (RabbitMQ)    │
   └────────┬────────┘
            │
            ├──→ Patient Service → Create patient profile
            ├──→ Notification Service → Send welcome email
            └──→ Audit Service → Log event

2. Patient profile created
   ┌─────────────────┐
   │ Patient Service │
   └────────┬────────┘
            │ PatientRegisteredEvent
            ↓
   ┌─────────────────┐
   │   Event Bus     │
   └────────┬────────┘
            │
            ├──→ Appointment Service → Enable booking
            ├──→ Billing Service → Create billing account
            └──→ Notification Service → Send registration confirmation
```

### **Event Bus Configuration:**

```typescript
// services-v2/shared/infrastructure/event-bus/EventBus.ts
const eventBus = EventBusFactory.create({
  rabbitmqUrl: process.env.RABBITMQ_URL,
  exchangeName: 'hospital.events',
  serviceName: 'identity-service'
});

await eventBus.connect();
```

---

## 📝 MIGRATION STRATEGY

### **Migration Order:**

```bash
# 1. Fix violations
psql -f migration/01-fix-cross-schema-violations.sql

# 2. Move misplaced tables
psql -f migration/02-move-misplaced-tables.sql

# 3. Setup base schemas
psql -f migration/03-complete-schema-setup.sql

# 4. Create service-specific tables
psql -f migration/04-auth-schema-tables.sql
psql -f migration/05-patient-schema-tables.sql
psql -f migration/06-doctor-schema-tables.sql
psql -f migration/07-appointment-schema-tables.sql
psql -f migration/08-medical-records-schema-tables.sql
psql -f migration/09-payment-schema-tables.sql
psql -f migration/10-notifications-schema-tables.sql
```

### **Verification:**

```sql
-- Check for cross-schema foreign keys
SELECT 
    tc.table_schema || '.' || tc.table_name as source,
    ccu.table_schema || '.' || ccu.table_name as target
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema != ccu.table_schema;

-- Should return 0 rows!
```

---

## ✅ BEST PRACTICES

### **1. Always Use Indexes for References**

```sql
-- Replace FK indexes with regular indexes
CREATE INDEX idx_patient_profiles_user_id 
ON patient_schema.patient_profiles(user_id);
```

### **2. Add Comments for Documentation**

```sql
COMMENT ON COLUMN patient_schema.patient_profiles.user_id IS 
'Reference to auth_schema.user_profiles.id - Validated via Identity Service API';
```

### **3. Implement Data Integrity Checks**

```sql
-- Periodic integrity check function
CREATE FUNCTION patient_schema.check_orphaned_patients()
RETURNS TABLE(patient_id UUID, user_id UUID, issue TEXT);
```

### **4. Use RLS for Security**

```sql
ALTER TABLE patient_schema.patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own profile" 
ON patient_schema.patient_profiles FOR SELECT 
USING (user_id = auth.uid());
```

### **5. Denormalize for Performance**

```sql
-- Store frequently accessed data locally
patient_name TEXT NOT NULL,  -- Denormalized from patient_schema
doctor_name TEXT NOT NULL,   -- Denormalized from doctor_schema
```

---

## 📚 ADDITIONAL RESOURCES

- **Architecture Audit Report:** `ARCHITECTURE_AUDIT_REPORT.md`
- **Strategic Development Plan:** `STRATEGIC_DEVELOPMENT_PLAN.md`
- **Event Definitions:** `shared/domain/events/domain-events.ts`
- **Event Bus Implementation:** `shared/infrastructure/event-bus/EventBus.ts`

---

**Last Updated:** 2025-01-XX  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

