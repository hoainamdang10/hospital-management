# Schema Migration Design - Hospital Management System

**Dự án:** Luận văn tốt nghiệp - Hospital Management System  
**Migration:** Public Schema → Schema-per-Service  
**Timeline:** Week 1-4 (Database Migration Foundation)  
**Ngày tạo:** 2024-12-19

---

## 🎯 **MIGRATION OVERVIEW**

Migrate từ monolithic public schema sang schema-per-service architecture với soft references, denormalization strategies, và free tier optimization. Zero-downtime migration với complete rollback capability.

---

## 📋 **MIGRATION PHASES**

### **Phase 1: Schema Creation (Week 1)**

- Create new schemas (auth_schema, patient_schema, doctor_schema, appointment_schema, medical_records_schema)
- Create new tables with optimized structure
- Setup indexes and constraints
- Create migration functions

### **Phase 2: Data Migration (Week 2)**

- Migrate data from public schema to new schemas
- Implement denormalization logic
- Setup soft reference mappings
- Validate data integrity

### **Phase 3: Service Updates (Week 3)**

- Update service configurations to use new schemas
- Implement soft reference logic in services
- Update API endpoints
- Test service communication

### **Phase 4: Cleanup & Optimization (Week 4)**

- Remove old public schema tables (after validation)
- Optimize queries and indexes
- Performance testing
- Documentation updates

---

## 🗄️ **DETAILED SCHEMA MIGRATION**

### **1. Auth Schema Migration**

#### **Create Auth Schema**

```sql
-- 01-create-auth-schema.sql
CREATE SCHEMA IF NOT EXISTS auth_schema;

-- Grant permissions
GRANT USAGE ON SCHEMA auth_schema TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth_schema TO service_role;

-- Profiles table (enhanced from public.profiles)
CREATE TABLE auth_schema.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 80),
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient',
    phone TEXT CHECK (phone ~ '^(\+84|0)[0-9]{9,10}$'),
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments table (moved from public.departments)
CREATE TABLE auth_schema.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_code TEXT NOT NULL UNIQUE,
    department_name TEXT NOT NULL,
    description TEXT,
    head_doctor_id UUID, -- Soft reference to doctor_schema.doctor_profiles
    location TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff invitations (moved from public.staff_invitations)
CREATE TABLE auth_schema.staff_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'admin')),
    department_id UUID, -- Soft reference to auth_schema.departments
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL, -- Soft reference to auth_schema.profiles
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    consumed_by UUID, -- Soft reference to auth_schema.profiles
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table (new)
CREATE TABLE auth_schema.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    resource TEXT NOT NULL,
    actions TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions (new)
CREATE TABLE auth_schema.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Soft reference to auth_schema.profiles
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_auth_profiles_email ON auth_schema.profiles(email);
CREATE INDEX idx_auth_profiles_role ON auth_schema.profiles(role);
CREATE INDEX idx_auth_departments_code ON auth_schema.departments(department_code);
CREATE INDEX idx_auth_invitations_token ON auth_schema.staff_invitations(token);
CREATE INDEX idx_auth_sessions_token ON auth_schema.user_sessions(session_token);
CREATE INDEX idx_auth_sessions_user_id ON auth_schema.user_sessions(user_id);

-- RLS Policies
ALTER TABLE auth_schema.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.user_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can read own profile" ON auth_schema.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON auth_schema.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Departments: All authenticated users can read, admins can modify
CREATE POLICY "All users can read departments" ON auth_schema.departments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify departments" ON auth_schema.departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

#### **Migrate Auth Data**

```sql
-- 02-migrate-auth-data.sql
-- Migrate profiles data
INSERT INTO auth_schema.profiles (
    id, email, full_name, role, phone, date_of_birth, gender,
    is_active, email_verified, phone_verified, last_login_at,
    login_count, created_at, updated_at
)
SELECT
    id, email, full_name, role, phone, date_of_birth, gender,
    is_active, email_verified, phone_verified, last_login_at,
    login_count, created_at, updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Migrate departments data (if exists)
INSERT INTO auth_schema.departments (
    id, department_code, department_name, description,
    head_doctor_id, location, phone, email, is_active, created_at, updated_at
)
SELECT
    id, department_code, department_name, description,
    head_doctor_id, location, phone, email, is_active, created_at, updated_at
FROM public.departments
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments')
ON CONFLICT (id) DO NOTHING;

-- Migrate staff invitations
INSERT INTO auth_schema.staff_invitations (
    id, email, role, department_id, token, invited_by,
    expires_at, consumed_at, consumed_by, created_at, updated_at
)
SELECT
    id, email, role, department_id, token, invited_by,
    expires_at, consumed_at, consumed_by, created_at, updated_at
FROM public.staff_invitations
ON CONFLICT (id) DO NOTHING;

-- Insert default permissions
INSERT INTO auth_schema.permissions (role, resource, actions) VALUES
('admin', 'users', ARRAY['create', 'read', 'update', 'delete']),
('admin', 'departments', ARRAY['create', 'read', 'update', 'delete']),
('admin', 'doctors', ARRAY['create', 'read', 'update', 'delete']),
('admin', 'patients', ARRAY['create', 'read', 'update', 'delete']),
('admin', 'appointments', ARRAY['create', 'read', 'update', 'delete']),
('admin', 'medical_records', ARRAY['create', 'read', 'update', 'delete']),
('doctor', 'patients', ARRAY['read', 'update']),
('doctor', 'appointments', ARRAY['read', 'update']),
('doctor', 'medical_records', ARRAY['create', 'read', 'update']),
('patient', 'appointments', ARRAY['create', 'read']),
('patient', 'medical_records', ARRAY['read'])
ON CONFLICT DO NOTHING;
```

### **2. Patient Schema Migration**

#### **Create Patient Schema**

```sql
-- 03-create-patient-schema.sql
CREATE SCHEMA IF NOT EXISTS patient_schema;

-- Grant permissions
GRANT USAGE ON SCHEMA patient_schema TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA patient_schema TO service_role;

-- Patient profiles with denormalized user data
CREATE TABLE patient_schema.patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Soft reference to auth_schema.profiles
    patient_id TEXT UNIQUE, -- PAT-YYYYMM-XXX

    -- Denormalized user data for performance
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,

    -- Patient-specific data
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT[],
    chronic_conditions TEXT[],
    medications TEXT[],
    medical_notes TEXT,

    -- Emergency contact (denormalized)
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,

    -- Insurance info (denormalized primary insurance)
    primary_insurance_provider TEXT,
    primary_insurance_number TEXT,

    onboarding_completed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient addresses (moved from public.addresses)
CREATE TABLE patient_schema.patient_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL, -- References patient_schema.patient_profiles(id)
    type TEXT NOT NULL DEFAULT 'home' CHECK (type IN ('home', 'work', 'billing')),
    line1 TEXT NOT NULL,
    line2 TEXT,
    ward TEXT,
    district TEXT,
    city TEXT NOT NULL,
    postal_code TEXT,
    country TEXT DEFAULT 'VN',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient insurances (moved from public.insurances)
CREATE TABLE patient_schema.patient_insurances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL, -- References patient_schema.patient_profiles(id)
    provider TEXT NOT NULL,
    insurance_number TEXT NOT NULL,
    valid_from DATE,
    valid_to DATE,
    is_primary BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient consents (moved from public.consents)
CREATE TABLE patient_schema.patient_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL, -- References patient_schema.patient_profiles(id)
    consent_type TEXT NOT NULL CHECK (consent_type IN ('tos', 'privacy', 'marketing', 'data_processing')),
    version TEXT NOT NULL DEFAULT '1.0',
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency contacts (moved from public.emergency_contacts)
CREATE TABLE patient_schema.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL, -- References patient_schema.patient_profiles(id)
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    phone TEXT NOT NULL CHECK (phone ~ '^(\+84|0)[0-9]{9,10}$'),
    email TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patient_profiles_user_id ON patient_schema.patient_profiles(user_id);
CREATE INDEX idx_patient_profiles_patient_id ON patient_schema.patient_profiles(patient_id);
CREATE INDEX idx_patient_profiles_email ON patient_schema.patient_profiles(email);
CREATE INDEX idx_patient_addresses_patient_id ON patient_schema.patient_addresses(patient_id);
CREATE INDEX idx_patient_insurances_patient_id ON patient_schema.patient_insurances(patient_id);
CREATE INDEX idx_patient_consents_patient_id ON patient_schema.patient_consents(patient_id);
CREATE INDEX idx_emergency_contacts_patient_id ON patient_schema.emergency_contacts(patient_id);

-- RLS Policies
ALTER TABLE patient_schema.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_schema.patient_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_schema.patient_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_schema.patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_schema.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Patients can read their own data
CREATE POLICY "Patients can read own data" ON patient_schema.patient_profiles
    FOR SELECT USING (user_id = auth.uid());

-- Doctors can read patient data for their appointments
CREATE POLICY "Doctors can read patient data" ON patient_schema.patient_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles
            WHERE id = auth.uid() AND role = 'doctor'
        )
    );

-- Admins can read all patient data
CREATE POLICY "Admins can read all patient data" ON patient_schema.patient_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

## 🔄 **SOFT REFERENCE IMPLEMENTATION**

### **Soft Reference Strategy**

```typescript
// Instead of hard FK constraints, use soft references with validation
interface SoftReference {
  sourceTable: string;
  sourceColumn: string;
  targetSchema: string;
  targetTable: string;
  targetColumn: string;
  validationFunction: string;
}

const softReferences: SoftReference[] = [
  {
    sourceTable: "patient_schema.patient_profiles",
    sourceColumn: "user_id",
    targetSchema: "auth_schema",
    targetTable: "profiles",
    targetColumn: "id",
    validationFunction: "validate_user_reference",
  },
  {
    sourceTable: "appointment_schema.appointments",
    sourceColumn: "patient_id",
    targetSchema: "patient_schema",
    targetTable: "patient_profiles",
    targetColumn: "id",
    validationFunction: "validate_patient_reference",
  },
];
```

### **Validation Functions**

```sql
-- Create validation functions for soft references
CREATE OR REPLACE FUNCTION validate_user_reference(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth_schema.profiles
        WHERE id = user_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_patient_reference(patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM patient_schema.patient_profiles
        WHERE id = patient_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_doctor_reference(doctor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM doctor_schema.doctor_profiles
        WHERE id = doctor_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 **DENORMALIZATION STRATEGIES**

### **Patient Profile Denormalization**

```sql
-- Denormalize frequently accessed user data into patient profiles
-- This reduces JOINs and improves performance for free tier
CREATE OR REPLACE FUNCTION sync_patient_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Update patient profile when user profile changes
    UPDATE patient_schema.patient_profiles
    SET
        email = NEW.email,
        full_name = NEW.full_name,
        phone = NEW.phone,
        date_of_birth = NEW.date_of_birth,
        gender = NEW.gender,
        updated_at = NOW()
    WHERE user_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync user data changes
CREATE TRIGGER sync_patient_user_data_trigger
    AFTER UPDATE ON auth_schema.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_patient_user_data();
```

### **Appointment Denormalization**

```sql
-- Denormalize patient and doctor names into appointments
-- This eliminates JOINs for appointment listings
CREATE OR REPLACE FUNCTION sync_appointment_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Update appointment when patient data changes
    UPDATE appointment_schema.appointments
    SET
        patient_name = NEW.full_name,
        patient_phone = NEW.phone,
        updated_at = NOW()
    WHERE patient_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for patient data sync
CREATE TRIGGER sync_appointment_patient_data_trigger
    AFTER UPDATE ON patient_schema.patient_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_data();
```

---

## 🏥 **DOCTOR SCHEMA MIGRATION**

### **Create Doctor Schema**

```sql
-- 04-create-doctor-schema.sql
CREATE SCHEMA IF NOT EXISTS doctor_schema;

-- Grant permissions
GRANT USAGE ON SCHEMA doctor_schema TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA doctor_schema TO service_role;

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
    license_number TEXT UNIQUE CHECK (license_number ~ '^VN-[A-Z]{2}-[0-9]{4}$'),
    specialization TEXT NOT NULL,
    department_id UUID, -- Soft reference to auth_schema.departments
    department_name TEXT, -- Denormalized for performance
    years_of_experience INTEGER CHECK (years_of_experience >= 0),
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    bio TEXT,

    -- Ratings & Reviews
    average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor schedules
CREATE TABLE doctor_schema.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL, -- References doctor_schema.doctor_profiles(id)
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start_time TIME,
    break_end_time TIME,
    max_patients INTEGER DEFAULT 20,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_schedule_times CHECK (start_time < end_time),
    CONSTRAINT valid_break_times CHECK (
        break_start_time IS NULL OR break_end_time IS NULL OR
        (break_start_time < break_end_time AND break_start_time >= start_time AND break_end_time <= end_time)
    )
);

-- Doctor availability (for specific dates)
CREATE TABLE doctor_schema.doctor_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL, -- References doctor_schema.doctor_profiles(id)
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'off')),
    reason TEXT, -- For 'busy' or 'off' status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(doctor_id, date, start_time),
    CONSTRAINT valid_availability_times CHECK (start_time < end_time)
);

-- Doctor rooms (moved from public.rooms)
CREATE TABLE doctor_schema.doctor_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number TEXT NOT NULL,
    room_name TEXT,
    department_id UUID, -- Soft reference to auth_schema.departments
    floor INTEGER,
    capacity INTEGER DEFAULT 1,
    equipment TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor room assignments
CREATE TABLE doctor_schema.doctor_room_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL, -- References doctor_schema.doctor_profiles(id)
    room_id UUID NOT NULL, -- References doctor_schema.doctor_rooms(id)
    assigned_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor reviews
CREATE TABLE doctor_schema.doctor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL, -- References doctor_schema.doctor_profiles(id)
    patient_id UUID NOT NULL, -- Soft reference to patient_schema.patient_profiles
    appointment_id UUID, -- Soft reference to appointment_schema.appointments
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false, -- Verified if linked to actual appointment
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_doctor_profiles_user_id ON doctor_schema.doctor_profiles(user_id);
CREATE INDEX idx_doctor_profiles_doctor_id ON doctor_schema.doctor_profiles(doctor_id);
CREATE INDEX idx_doctor_profiles_license ON doctor_schema.doctor_profiles(license_number);
CREATE INDEX idx_doctor_profiles_specialization ON doctor_schema.doctor_profiles(specialization);
CREATE INDEX idx_doctor_profiles_department ON doctor_schema.doctor_profiles(department_id);
CREATE INDEX idx_doctor_schedules_doctor_id ON doctor_schema.doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_day ON doctor_schema.doctor_schedules(day_of_week);
CREATE INDEX idx_doctor_availability_doctor_date ON doctor_schema.doctor_availability(doctor_id, date);
CREATE INDEX idx_doctor_rooms_department ON doctor_schema.doctor_rooms(department_id);
CREATE INDEX idx_doctor_room_assignments_doctor ON doctor_schema.doctor_room_assignments(doctor_id);
CREATE INDEX idx_doctor_reviews_doctor_id ON doctor_schema.doctor_reviews(doctor_id);

-- RLS Policies
ALTER TABLE doctor_schema.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.doctor_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Doctors can read/update their own data
CREATE POLICY "Doctors can manage own data" ON doctor_schema.doctor_profiles
    FOR ALL USING (user_id = auth.uid());

-- All authenticated users can read doctor profiles (for appointment booking)
CREATE POLICY "All users can read doctor profiles" ON doctor_schema.doctor_profiles
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Doctors can manage their own schedules
CREATE POLICY "Doctors can manage own schedules" ON doctor_schema.doctor_schedules
    FOR ALL USING (
        doctor_id IN (
            SELECT id FROM doctor_schema.doctor_profiles WHERE user_id = auth.uid()
        )
    );

-- All users can read doctor schedules (for appointment booking)
CREATE POLICY "All users can read doctor schedules" ON doctor_schema.doctor_schedules
    FOR SELECT USING (auth.role() = 'authenticated');
```

## 📅 **APPOINTMENT SCHEMA MIGRATION**

### **Create Appointment Schema**

```sql
-- 05-create-appointment-schema.sql
CREATE SCHEMA IF NOT EXISTS appointment_schema;

-- Grant permissions
GRANT USAGE ON SCHEMA appointment_schema TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA appointment_schema TO service_role;

-- Appointments with denormalized data
CREATE TABLE appointment_schema.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id TEXT UNIQUE, -- APT-YYYYMM-XXX

    -- Soft references
    patient_id UUID NOT NULL, -- References patient_schema.patient_profiles.id
    doctor_id UUID NOT NULL,  -- References doctor_schema.doctor_profiles.id

    -- Denormalized patient data (for performance)
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    patient_email TEXT,

    -- Denormalized doctor data
    doctor_name TEXT NOT NULL,
    doctor_specialization TEXT,
    doctor_department TEXT,

    -- Appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0),
    appointment_type TEXT DEFAULT 'consultation' CHECK (
        appointment_type IN ('consultation', 'follow_up', 'emergency', 'surgery')
    ),
    status TEXT DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
    ),

    -- Additional info
    chief_complaint TEXT,
    notes TEXT,
    room_number TEXT,

    -- Timestamps
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_appointment_datetime CHECK (
        appointment_date >= CURRENT_DATE OR
        (appointment_date = CURRENT_DATE AND appointment_time >= CURRENT_TIME)
    )
);

-- Appointment queue (for walk-in patients)
CREATE TABLE appointment_schema.appointment_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID, -- References patient_schema.patient_profiles.id (nullable for walk-ins)
    doctor_id UUID NOT NULL, -- References doctor_schema.doctor_profiles.id

    -- Walk-in patient data (if patient_id is null)
    walk_in_name TEXT,
    walk_in_phone TEXT,
    walk_in_id_number TEXT,

    -- Denormalized doctor data
    doctor_name TEXT NOT NULL,

    queue_number INTEGER NOT NULL,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    estimated_time TIME,
    status TEXT DEFAULT 'waiting' CHECK (
        status IN ('waiting', 'called', 'in_progress', 'completed', 'cancelled')
    ),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),

    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(doctor_id, queue_date, queue_number)
);

-- Walk-in patients (temporary registration)
CREATE TABLE appointment_schema.walk_in_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT CHECK (phone ~ '^(\+84|0)[0-9]{9,10}$'),
    id_number TEXT, -- National ID or passport
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    chief_complaint TEXT,

    -- Link to queue entry
    queue_id UUID, -- References appointment_schema.appointment_queue.id

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment reminders
CREATE TABLE appointment_schema.appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL, -- References appointment_schema.appointments.id
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push')),
    scheduled_time TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_patient_id ON appointment_schema.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointment_schema.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointment_schema.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointment_schema.appointments(status);
CREATE INDEX idx_appointments_datetime ON appointment_schema.appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointment_queue_doctor_date ON appointment_schema.appointment_queue(doctor_id, queue_date);
CREATE INDEX idx_appointment_queue_status ON appointment_schema.appointment_queue(status);
CREATE INDEX idx_walk_in_patients_queue ON appointment_schema.walk_in_patients(queue_id);
CREATE INDEX idx_appointment_reminders_appointment ON appointment_schema.appointment_reminders(appointment_id);
CREATE INDEX idx_appointment_reminders_scheduled ON appointment_schema.appointment_reminders(scheduled_time);

-- RLS Policies
ALTER TABLE appointment_schema.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_schema.appointment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_schema.walk_in_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_schema.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Patients can read their own appointments
CREATE POLICY "Patients can read own appointments" ON appointment_schema.appointments
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patient_schema.patient_profiles WHERE user_id = auth.uid()
        )
    );

-- Doctors can read their own appointments
CREATE POLICY "Doctors can read own appointments" ON appointment_schema.appointments
    FOR SELECT USING (
        doctor_id IN (
            SELECT id FROM doctor_schema.doctor_profiles WHERE user_id = auth.uid()
        )
    );

-- Patients can create appointments for themselves
CREATE POLICY "Patients can create own appointments" ON appointment_schema.appointments
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM patient_schema.patient_profiles WHERE user_id = auth.uid()
        )
    );
```

---

**Status:** ✅ Schema Migration Design Complete
**Next:** FHIR Integration Architecture
