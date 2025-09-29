# Database Architecture Redesign - Hospital Management System

**Dự án:** Luận văn tốt nghiệp - Hospital Management System  
**Timeline:** 8 tuần  
**Mục tiêu:** Schema-per-service + Supabase/Medplum Integration  
**Ngày tạo:** 2024-12-19

---

## 🎯 **EXECUTIVE SUMMARY**

Redesign database architecture từ monolithic public schema sang proper schema-per-service microservices architecture, tích hợp Supabase (operational data) + Medplum (FHIR clinical data), consolidate từ 11 services xuống 5-7 core services, và optimize cho free tier constraints trong 8 tuần.

---

## 📊 **CURRENT STATE ANALYSIS**

### **Database Current State**

```sql
-- Tất cả tables hiện tại trong public schema
Schema: public
├── profiles (Core user data)
├── staff_invitations
├── consents (GDPR compliance)
├── addresses
├── emergency_contacts
├── insurances
├── patient_profiles (Extended patient data)
├── documents (File uploads)
├── audit_logs (Security & compliance)
├── mfa_settings (Two-factor auth)
├── doctor_profiles (Extended doctor data)
├── doctor_schedules
├── doctor_availability
├── appointments
├── medical_records
├── departments
├── specialties
├── rooms
├── payments
└── notifications
```

### **Current Services (11 Total)**

```
✅ CORE SERVICES (Keep & Enhance):
1. Auth Service (3001) - Authentication & Authorization
2. Patient Service (3003) - Patient Management
3. Doctor Service (3002) - Doctor Management
4. Appointment Service (3004) - Scheduling & Booking
5. Medical Records Service (3007) - Clinical Data

🔄 CONSOLIDATE/MERGE:
6. Department Service (3005) → Merge into Admin/Auth Service
7. Receptionist Service (3006) → Merge into Appointment Service
8. Payment Service (3009) → Keep as separate service
9. File Service (3107) → Keep as separate service

❌ REMOVE/SIMPLIFY:
10. Notification Service (3011) → Simplify to basic email/SMS
11. GraphQL Gateway (3200) → Optional for thesis demo
```

### **Cross-Service Dependencies (Current Issues)**

```typescript
// VIOLATION: Hard FK constraints across services
patient_profiles.user_id → profiles.id (Auth Service)
doctor_profiles.user_id → profiles.id (Auth Service)
appointments.patient_id → patient_profiles.id (Patient Service)
appointments.doctor_id → doctor_profiles.id (Doctor Service)
medical_records.patient_id → patient_profiles.id (Patient Service)
medical_records.doctor_id → doctor_profiles.id (Doctor Service)
```

---

## 🏗️ **TARGET ARCHITECTURE**

### **Schema-per-Service Design**

#### **1. Auth Schema (`auth_schema`)**

```sql
-- Auth Service owns user identity & permissions
CREATE SCHEMA IF NOT EXISTS auth_schema;

-- Core user profiles (moved from public)
CREATE TABLE auth_schema.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-based permissions
CREATE TABLE auth_schema.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    resource TEXT NOT NULL,
    actions TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session management
CREATE TABLE auth_schema.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Soft reference to profiles
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **2. Patient Schema (`patient_schema`)**

```sql
CREATE SCHEMA IF NOT EXISTS patient_schema;

-- Patient profiles with denormalized user data
CREATE TABLE patient_schema.patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Soft reference to auth_schema.profiles
    patient_id TEXT UNIQUE, -- PAT-YYYYMM-XXX

    -- Denormalized user data (for performance)
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,

    -- Patient-specific data
    blood_type TEXT,
    allergies TEXT[],
    chronic_conditions TEXT[],
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient addresses
CREATE TABLE patient_schema.patient_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patient_schema.patient_profiles(id),
    type TEXT DEFAULT 'home',
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **3. Doctor Schema (`doctor_schema`)**

```sql
CREATE SCHEMA IF NOT EXISTS doctor_schema;

-- Doctor profiles with denormalized user data
CREATE TABLE doctor_schema.doctor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Soft reference to auth_schema.profiles
    doctor_id TEXT UNIQUE, -- CARD-DOC-YYYYMM-XXX

    -- Denormalized user data
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,

    -- Doctor-specific data
    license_number TEXT UNIQUE,
    specialization TEXT NOT NULL,
    department TEXT NOT NULL,
    years_of_experience INTEGER,
    consultation_fee DECIMAL(10,2),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor schedules
CREATE TABLE doctor_schema.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctor_schema.doctor_profiles(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **4. Appointment Schema (`appointment_schema`)**

```sql
CREATE SCHEMA IF NOT EXISTS appointment_schema;

-- Appointments with soft references
CREATE TABLE appointment_schema.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id TEXT UNIQUE, -- APT-YYYYMM-XXX

    -- Soft references (no FK constraints)
    patient_id UUID NOT NULL, -- References patient_schema.patient_profiles.id
    doctor_id UUID NOT NULL,  -- References doctor_schema.doctor_profiles.id

    -- Denormalized data for performance
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    doctor_name TEXT NOT NULL,
    doctor_specialization TEXT,

    -- Appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **5. Medical Records Schema (`medical_records_schema`)**

```sql
CREATE SCHEMA IF NOT EXISTS medical_records_schema;

-- Medical records with FHIR compliance
CREATE TABLE medical_records_schema.medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id TEXT UNIQUE, -- MED-YYYYMM-XXX

    -- Soft references
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_id UUID, -- Optional reference to appointment

    -- Denormalized patient/doctor data
    patient_name TEXT NOT NULL,
    doctor_name TEXT NOT NULL,

    -- Medical data
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    medications TEXT[],
    follow_up_date DATE,

    -- FHIR integration
    fhir_resource_id TEXT, -- Medplum resource ID
    fhir_resource_type TEXT DEFAULT 'Observation',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Consolidated Services (7 Total)**

#### **Core Services (5)**

1. **Auth Service** (3001) - User identity, permissions, sessions
2. **Patient Service** (3003) - Patient management, profiles, addresses
3. **Doctor Service** (3002) - Doctor management, schedules, availability
4. **Appointment Service** (3004) - Scheduling, booking, receptionist functions
5. **Medical Records Service** (3007) - Clinical data, FHIR integration

#### **Supporting Services (2)**

6. **Payment Service** (3009) - PayOS integration, billing
7. **File Service** (3107) - Document management, Supabase Storage

---

## 🔄 **SUPABASE + MEDPLUM INTEGRATION**

### **Data Classification Strategy**

```typescript
// Operational Data → Supabase
const supabaseData = {
  userProfiles: "auth_schema.profiles",
  patientProfiles: "patient_schema.patient_profiles",
  doctorProfiles: "doctor_schema.doctor_profiles",
  appointments: "appointment_schema.appointments",
  payments: "payment_schema.payments",
  documents: "file_schema.documents",
};

// Clinical Data → Medplum FHIR
const medplumData = {
  patients: "Patient", // FHIR Resource
  practitioners: "Practitioner", // FHIR Resource
  observations: "Observation", // Medical records
  encounters: "Encounter", // Appointments
  diagnosticReports: "DiagnosticReport", // Lab results
};
```

### **Bidirectional Sync Strategy**

```typescript
// Sync Rules
const syncRules = {
  // Supabase → Medplum
  patientCreated: {
    trigger: "patient_schema.patient_profiles INSERT",
    action: "Create FHIR Patient resource",
    mapping: "supabasePatientToFHIR()",
    frequency: "real-time",
  },

  // Medplum → Supabase
  observationCreated: {
    trigger: "FHIR Observation created",
    action: "Create medical_records entry",
    mapping: "fhirObservationToSupabase()",
    frequency: "real-time",
  },
};
```

---

## 📈 **FREE TIER OPTIMIZATION**

### **Supabase Free Tier Limits**

- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **API Requests**: 50,000/month
- **Storage**: 1GB files

### **Medplum Free Tier Limits**

- **API Requests**: 6,000/minute
- **FHIR Storage**: 1GB
- **Users**: 100 active users

### **Optimization Strategies**

```typescript
// 1. Data Denormalization (reduce JOINs)
const denormalizationStrategy = {
  patientProfiles: "Include user data to avoid auth service calls",
  appointments: "Include patient/doctor names for display",
  medicalRecords: "Include patient/doctor data for reporting",
};

// 2. Caching Strategy
const cachingStrategy = {
  redis: "Cache frequently accessed data (doctor schedules, departments)",
  supabaseCache: "Use Supabase built-in caching",
  medplumCache: "Cache FHIR resources for 5 minutes",
};

// 3. Batch Operations
const batchStrategy = {
  fhirSync: "Batch sync every 5 minutes instead of real-time",
  dataExport: "Weekly batch export to stay under limits",
  reporting: "Pre-computed reports to reduce query load",
};
```

---

## ⚠️ **MIGRATION RISKS & MITIGATION**

### **High-Risk Areas**

1. **Data Loss**: Foreign key constraint removal
2. **Service Downtime**: Schema migration process
3. **Performance Degradation**: Denormalized data sync
4. **Free Tier Limits**: Exceeding Supabase/Medplum quotas

### **Mitigation Strategies**

```typescript
const riskMitigation = {
  dataLoss: {
    strategy: "Complete backup before migration",
    rollback: "Point-in-time restore capability",
    validation: "Data integrity checks at each step",
  },

  downtime: {
    strategy: "Blue-green deployment pattern",
    rollback: "Instant rollback to previous version",
    monitoring: "Real-time health checks",
  },

  performance: {
    strategy: "Gradual migration with performance monitoring",
    rollback: "Revert to previous schema if performance degrades",
    optimization: "Query optimization and indexing",
  },

  quotaLimits: {
    strategy: "Usage monitoring dashboard",
    rollback: "Disable non-essential features if approaching limits",
    optimization: "Implement request throttling and caching",
  },
};
```

---

## 📅 **NEXT STEPS**

1. **Service Consolidation Strategy** - Detailed merge plan for 11→7 services
2. **Schema Migration Design** - Complete SQL migration scripts
3. **FHIR Integration Architecture** - Medplum integration details
4. **8-Week Implementation Roadmap** - Weekly milestones and daily tasks
5. **Migration Scripts & Documentation** - Complete implementation artifacts

---

## 🔄 **SERVICE CONSOLIDATION STRATEGY**

### **Current Services Analysis (11 → 7)**

#### **KEEP AS CORE SERVICES (5)**

##### **1. Auth Service (3001) - Enhanced**

```typescript
// BEFORE: Basic authentication only
// AFTER: Complete identity & access management
const authServiceScope = {
  core: [
    "User authentication (login/logout/register)",
    "JWT token management",
    "Role-based access control",
    "Session management",
  ],

  enhanced: [
    "Department management (merged from Department Service)",
    "Staff invitation system",
    "User profile management",
    "Permission management",
    "Audit logging for security events",
  ],

  newTables: [
    "auth_schema.profiles",
    "auth_schema.departments", // Moved from public.departments
    "auth_schema.staff_invitations", // Moved from public.staff_invitations
    "auth_schema.permissions",
    "auth_schema.user_sessions",
  ],
};
```

##### **2. Patient Service (3003) - Enhanced**

```typescript
const patientServiceScope = {
  core: [
    "Patient profile management",
    "Patient registration",
    "Medical history tracking",
    "Emergency contacts",
  ],

  enhanced: [
    "Insurance management",
    "Address management",
    "Consent management (GDPR)",
    "Patient document management",
    "Patient search & filtering",
  ],

  newTables: [
    "patient_schema.patient_profiles",
    "patient_schema.patient_addresses", // Moved from public.addresses
    "patient_schema.patient_insurances", // Moved from public.insurances
    "patient_schema.patient_consents", // Moved from public.consents
    "patient_schema.emergency_contacts", // Moved from public.emergency_contacts
  ],
};
```

##### **3. Doctor Service (3002) - Enhanced**

```typescript
const doctorServiceScope = {
  core: [
    "Doctor profile management",
    "Schedule management",
    "Availability tracking",
    "Specialization management",
  ],

  enhanced: [
    "Room assignment (merged from Department Service)",
    "Doctor ratings & reviews",
    "Consultation fee management",
    "Doctor search & filtering",
    "Shift management",
  ],

  newTables: [
    "doctor_schema.doctor_profiles",
    "doctor_schema.doctor_schedules",
    "doctor_schema.doctor_availability",
    "doctor_schema.doctor_rooms", // Moved from public.rooms
    "doctor_schema.doctor_reviews",
  ],
};
```

##### **4. Appointment Service (3004) - Enhanced**

```typescript
const appointmentServiceScope = {
  core: [
    "Appointment booking",
    "Schedule management",
    "Appointment status tracking",
    "Calendar integration",
  ],

  enhanced: [
    "Receptionist functions (merged from Receptionist Service)",
    "Walk-in patient management",
    "Appointment reminders",
    "Queue management",
    "Waiting room status",
  ],

  newTables: [
    "appointment_schema.appointments",
    "appointment_schema.appointment_queue",
    "appointment_schema.walk_in_patients",
    "appointment_schema.appointment_reminders",
  ],
};
```

##### **5. Medical Records Service (3007) - Enhanced**

```typescript
const medicalRecordsScope = {
  core: [
    "Medical record management",
    "Diagnosis tracking",
    "Treatment plans",
    "Prescription management",
  ],

  enhanced: [
    "FHIR integration with Medplum",
    "Lab results management",
    "Medical imaging references",
    "Clinical notes",
    "Medical history reports",
  ],

  newTables: [
    "medical_records_schema.medical_records",
    "medical_records_schema.prescriptions",
    "medical_records_schema.lab_results",
    "medical_records_schema.clinical_notes",
    "medical_records_schema.fhir_sync_log",
  ],
};
```

#### **KEEP AS SUPPORTING SERVICES (2)**

##### **6. Payment Service (3009) - Standalone**

```typescript
const paymentServiceScope = {
  justification: "PayOS integration requires separate service for security",
  scope: [
    "Payment processing with PayOS",
    "Invoice generation",
    "Payment history",
    "Refund management",
  ],

  tables: [
    "payment_schema.payments",
    "payment_schema.invoices",
    "payment_schema.payment_methods",
  ],
};
```

##### **7. File Service (3107) - Standalone**

```typescript
const fileServiceScope = {
  justification: "Supabase Storage integration & security isolation",
  scope: [
    "Document upload/download",
    "Medical image management",
    "File security & access control",
    "Storage quota management",
  ],

  tables: ["file_schema.documents", "file_schema.file_access_logs"],
};
```

#### **SERVICES TO MERGE/REMOVE (4)**

##### **Department Service (3005) → Merge into Auth Service**

```typescript
const departmentMergeStrategy = {
  reason: "Department management is administrative function",
  mergeTo: "Auth Service",
  tables: [
    "public.departments → auth_schema.departments",
    "public.specialties → auth_schema.specialties",
    "public.rooms → doctor_schema.doctor_rooms",
  ],

  apiEndpoints: [
    "/api/v1/departments → /api/v1/auth/departments",
    "/api/v1/specialties → /api/v1/auth/specialties",
  ],
};
```

##### **Receptionist Service (3006) → Merge into Appointment Service**

```typescript
const receptionistMergeStrategy = {
  reason: "Receptionist functions are appointment-related",
  mergeTo: "Appointment Service",
  functionality: [
    "Walk-in patient registration",
    "Appointment queue management",
    "Patient check-in/check-out",
    "Waiting room management",
  ],

  newEndpoints: [
    "/api/v1/appointments/walk-in",
    "/api/v1/appointments/queue",
    "/api/v1/appointments/check-in",
  ],
};
```

##### **Notification Service (3011) → Simplify to Basic Functions**

```typescript
const notificationSimplification = {
  reason: "Complex notification system not essential for thesis",
  approach: "Basic email/SMS via external service",
  implementation: [
    "Simple email service (Nodemailer + Gmail)",
    "SMS service (optional - Twilio free tier)",
    "In-app notifications (basic)",
  ],

  integration: "Embed into relevant services rather than separate service",
};
```

##### **GraphQL Gateway (3200) → Optional for Demo**

```typescript
const graphqlStrategy = {
  reason: "Not essential for core functionality",
  approach: "Keep for demo purposes but not core requirement",
  scope: "Read-only queries for frontend optimization",
  priority: "Low - implement only if time permits",
};
```

### **Migration Complexity Assessment**

#### **Low Complexity (Week 1-2)**

- Department Service → Auth Service merge
- Basic schema creation
- Data migration scripts

#### **Medium Complexity (Week 3-4)**

- Receptionist Service → Appointment Service merge
- Service communication refactoring
- API endpoint consolidation

#### **High Complexity (Week 5-6)**

- FHIR integration with Medplum
- Cross-service data synchronization
- Performance optimization

#### **Testing & Documentation (Week 7-8)**

- End-to-end testing
- Documentation completion
- Deployment preparation

---

**Status:** ✅ Service Consolidation Strategy Complete
**Next:** Schema Migration Design
