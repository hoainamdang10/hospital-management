# Migration Scripts & Documentation - Hospital Management System

**Dự án:** Luận văn tốt nghiệp - Hospital Management System  
**Migration:** Complete SQL Scripts + Docker Configuration  
**Timeline:** Ready for Week 1 Implementation  
**Ngày tạo:** 2024-12-19

---

## 🎯 **MIGRATION OVERVIEW**

Complete collection of SQL migration scripts, Docker configuration updates, service configurations, và comprehensive documentation để implement schema-per-service architecture với zero downtime.

---

## 📁 **FILE STRUCTURE**

```
migration/
├── sql/
│   ├── 01-create-schemas.sql           # Create all new schemas
│   ├── 02-create-auth-schema.sql       # Auth schema tables & policies
│   ├── 03-create-patient-schema.sql    # Patient schema tables & policies
│   ├── 04-create-doctor-schema.sql     # Doctor schema tables & policies
│   ├── 05-create-appointment-schema.sql # Appointment schema tables & policies
│   ├── 06-create-medical-records-schema.sql # Medical records schema
│   ├── 07-migrate-data.sql             # Data migration scripts
│   ├── 08-create-functions.sql         # Utility functions
│   ├── 09-create-triggers.sql          # Sync triggers
│   └── 10-cleanup-public-schema.sql    # Remove old tables
├── docker/
│   ├── docker-compose.new.yml          # Updated Docker configuration
│   └── .env.example                    # Environment variables template
├── services/
│   ├── auth-service/
│   │   └── database.config.ts          # Updated database config
│   ├── patient-service/
│   │   └── database.config.ts
│   ├── doctor-service/
│   │   └── database.config.ts
│   ├── appointment-service/
│   │   └── database.config.ts
│   └── medical-records-service/
│       └── database.config.ts
├── scripts/
│   ├── migrate.sh                      # Main migration script
│   ├── rollback.sh                     # Rollback script
│   ├── validate.sh                     # Data validation script
│   └── backup.sh                       # Backup script
└── docs/
    ├── MIGRATION_GUIDE.md              # Step-by-step guide
    ├── TROUBLESHOOTING.md              # Common issues & solutions
    └── ROLLBACK_PROCEDURES.md          # Emergency rollback
```

---

## 🗄️ **SQL MIGRATION SCRIPTS**

### **01-create-schemas.sql**
```sql
-- Create all new schemas for microservices
-- Execute first to establish schema structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS patient_schema;
CREATE SCHEMA IF NOT EXISTS doctor_schema;
CREATE SCHEMA IF NOT EXISTS appointment_schema;
CREATE SCHEMA IF NOT EXISTS medical_records_schema;
CREATE SCHEMA IF NOT EXISTS payment_schema;
CREATE SCHEMA IF NOT EXISTS file_schema;

-- Grant permissions
GRANT USAGE ON SCHEMA auth_schema TO authenticated;
GRANT USAGE ON SCHEMA patient_schema TO authenticated;
GRANT USAGE ON SCHEMA doctor_schema TO authenticated;
GRANT USAGE ON SCHEMA appointment_schema TO authenticated;
GRANT USAGE ON SCHEMA medical_records_schema TO authenticated;
GRANT USAGE ON SCHEMA payment_schema TO authenticated;
GRANT USAGE ON SCHEMA file_schema TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA auth_schema TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA patient_schema TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA doctor_schema TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA appointment_schema TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA medical_records_schema TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA payment_schema TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA file_schema TO service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA auth_schema GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA patient_schema GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA doctor_schema GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA appointment_schema GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA medical_records_schema GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA payment_schema GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA file_schema GRANT ALL ON TABLES TO service_role;

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS public.migration_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    rollback_sql TEXT
);

-- Log this migration
INSERT INTO public.migration_log (migration_name, rollback_sql) VALUES 
('01-create-schemas', 'DROP SCHEMA IF EXISTS auth_schema, patient_schema, doctor_schema, appointment_schema, medical_records_schema, payment_schema, file_schema CASCADE;');
```

### **02-create-auth-schema.sql**
```sql
-- Auth Schema - User identity, permissions, departments
-- Consolidates Auth Service + Department Service functionality

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

-- Specialties table (moved from public.specialties)
CREATE TABLE auth_schema.specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specialty_code TEXT NOT NULL UNIQUE,
    specialty_name TEXT NOT NULL,
    description TEXT,
    department_id UUID, -- References auth_schema.departments(id)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff invitations (moved from public.staff_invitations)
CREATE TABLE auth_schema.staff_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'admin')),
    department_id UUID, -- References auth_schema.departments(id)
    specialty_id UUID, -- References auth_schema.specialties(id)
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL, -- References auth_schema.profiles(id)
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    consumed_by UUID, -- References auth_schema.profiles(id)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table (new)
CREATE TABLE auth_schema.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    resource TEXT NOT NULL,
    actions TEXT[] NOT NULL,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions (new)
CREATE TABLE auth_schema.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References auth_schema.profiles(id)
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs (moved from public.audit_logs)
CREATE TABLE auth_schema.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID, -- References auth_schema.profiles(id)
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_auth_profiles_email ON auth_schema.profiles(email);
CREATE INDEX idx_auth_profiles_role ON auth_schema.profiles(role);
CREATE INDEX idx_auth_profiles_active ON auth_schema.profiles(is_active);
CREATE INDEX idx_auth_departments_code ON auth_schema.departments(department_code);
CREATE INDEX idx_auth_departments_active ON auth_schema.departments(is_active);
CREATE INDEX idx_auth_specialties_code ON auth_schema.specialties(specialty_code);
CREATE INDEX idx_auth_specialties_department ON auth_schema.specialties(department_id);
CREATE INDEX idx_auth_invitations_token ON auth_schema.staff_invitations(token);
CREATE INDEX idx_auth_invitations_email ON auth_schema.staff_invitations(email);
CREATE INDEX idx_auth_permissions_role ON auth_schema.permissions(role);
CREATE INDEX idx_auth_sessions_token ON auth_schema.user_sessions(session_token);
CREATE INDEX idx_auth_sessions_user_id ON auth_schema.user_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires ON auth_schema.user_sessions(expires_at);
CREATE INDEX idx_auth_audit_actor ON auth_schema.audit_logs(actor_id);
CREATE INDEX idx_auth_audit_created ON auth_schema.audit_logs(created_at);
CREATE INDEX idx_auth_audit_resource ON auth_schema.audit_logs(resource_type, resource_id);

-- RLS Policies
ALTER TABLE auth_schema.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON auth_schema.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON auth_schema.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can update own profile" ON auth_schema.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON auth_schema.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Departments policies
CREATE POLICY "All users can read departments" ON auth_schema.departments
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage departments" ON auth_schema.departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Specialties policies
CREATE POLICY "All users can read specialties" ON auth_schema.specialties
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage specialties" ON auth_schema.specialties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Sessions policies
CREATE POLICY "Users can read own sessions" ON auth_schema.user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON auth_schema.user_sessions
    FOR DELETE USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Admins can read audit logs" ON auth_schema.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_schema.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auth_profiles_updated_at 
    BEFORE UPDATE ON auth_schema.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_departments_updated_at 
    BEFORE UPDATE ON auth_schema.departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_specialties_updated_at 
    BEFORE UPDATE ON auth_schema.specialties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_invitations_updated_at 
    BEFORE UPDATE ON auth_schema.staff_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log migration
INSERT INTO public.migration_log (migration_name, rollback_sql) VALUES 
('02-create-auth-schema', 'DROP TABLE IF EXISTS auth_schema.profiles, auth_schema.departments, auth_schema.specialties, auth_schema.staff_invitations, auth_schema.permissions, auth_schema.user_sessions, auth_schema.audit_logs CASCADE;');
```

---

## 🐳 **DOCKER CONFIGURATION**

### **Updated docker-compose.yml**
```yaml
# docker-compose.new.yml - Updated for schema-per-service architecture
version: '3.8'

services:
  # API Gateway - Updated routing for consolidated services
  api-gateway:
    build:
      context: .
      dockerfile: ./services/api-gateway/Dockerfile
    ports:
      - "3100:3100"
    environment:
      - NODE_ENV=development
      - PORT=3100
      # Updated service URLs for consolidated architecture
      - AUTH_SERVICE_URL=http://auth-service:3001
      - PATIENT_SERVICE_URL=http://patient-service:3003
      - DOCTOR_SERVICE_URL=http://doctor-service:3002
      - APPOINTMENT_SERVICE_URL=http://appointment-service:3004
      - MEDICAL_RECORDS_SERVICE_URL=http://medical-records-service:3007
      - PAYMENT_SERVICE_URL=http://payment-service:3009
      - FILE_SERVICE_URL=http://file-service:3107
      # Database configuration
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - JWT_SECRET=${JWT_SECRET}
      # Schema-per-service configuration
      - USE_SCHEMA_PER_SERVICE=true
      - DEFAULT_SCHEMA=public
    depends_on:
      - redis
      - rabbitmq
    networks:
      - hospital-network
    profiles:
      - core
      - full

  # Auth Service - Enhanced with department management
  auth-service:
    build:
      context: .
      dockerfile: ./services/auth-service/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      # Schema configuration
      - DATABASE_SCHEMA=auth_schema
      - USE_SCHEMA_PER_SERVICE=true
      # Enhanced functionality
      - ENABLE_DEPARTMENT_MANAGEMENT=true
      - ENABLE_STAFF_INVITATIONS=true
      - ENABLE_AUDIT_LOGGING=true
    depends_on:
      - redis
      - rabbitmq
    networks:
      - hospital-network
    profiles:
      - core
      - full

  # Patient Service - Enhanced with insurance & consent management
  patient-service:
    build:
      context: .
      dockerfile: ./services/patient-service/Dockerfile
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - PORT=3003
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # Schema configuration
      - DATABASE_SCHEMA=patient_schema
      - USE_SCHEMA_PER_SERVICE=true
      # Enhanced functionality
      - ENABLE_INSURANCE_MANAGEMENT=true
      - ENABLE_CONSENT_MANAGEMENT=true
      - ENABLE_ADDRESS_MANAGEMENT=true
      # API Gateway communication
      - API_GATEWAY_URL=http://api-gateway:3100
    depends_on:
      - redis
      - rabbitmq
    networks:
      - hospital-network
    profiles:
      - core
      - full

  # Doctor Service - Enhanced with room assignment & reviews
  doctor-service:
    build:
      context: .
      dockerfile: ./services/doctor-service/Dockerfile
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - PORT=3002
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # Schema configuration
      - DATABASE_SCHEMA=doctor_schema
      - USE_SCHEMA_PER_SERVICE=true
      # Enhanced functionality
      - ENABLE_ROOM_MANAGEMENT=true
      - ENABLE_DOCTOR_REVIEWS=true
      - ENABLE_AVAILABILITY_MANAGEMENT=true
      # API Gateway communication
      - API_GATEWAY_URL=http://api-gateway:3100
    depends_on:
      - redis
      - rabbitmq
    networks:
      - hospital-network
    profiles:
      - core
      - full

  # Appointment Service - Enhanced with receptionist functionality
  appointment-service:
    build:
      context: .
      dockerfile: ./services/appointment-service/Dockerfile
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=development
      - PORT=3004
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # Schema configuration
      - DATABASE_SCHEMA=appointment_schema
      - USE_SCHEMA_PER_SERVICE=true
      # Enhanced functionality (merged from Receptionist Service)
      - ENABLE_QUEUE_MANAGEMENT=true
      - ENABLE_WALK_IN_PATIENTS=true
      - ENABLE_APPOINTMENT_REMINDERS=true
      # API Gateway communication
      - API_GATEWAY_URL=http://api-gateway:3100
    depends_on:
      - redis
      - rabbitmq
    networks:
      - hospital-network
    profiles:
      - core
      - full

  # Medical Records Service - Enhanced with FHIR integration
  medical-records-service:
    build:
      context: .
      dockerfile: ./services/medical-records-service/Dockerfile
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=development
      - PORT=3007
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # Schema configuration
      - DATABASE_SCHEMA=medical_records_schema
      - USE_SCHEMA_PER_SERVICE=true
      # FHIR integration
      - ENABLE_FHIR_INTEGRATION=true
      - MEDPLUM_BASE_URL=${MEDPLUM_BASE_URL}
      - MEDPLUM_CLIENT_ID=${MEDPLUM_CLIENT_ID}
      - MEDPLUM_CLIENT_SECRET=${MEDPLUM_CLIENT_SECRET}
      # API Gateway communication
      - API_GATEWAY_URL=http://api-gateway:3100
    depends_on:
      - redis
      - rabbitmq
    networks:
      - hospital-network
    profiles:
      - core
      - full

  # Payment Service - Standalone (unchanged)
  payment-service:
    build:
      context: .
      dockerfile: ./services/payment-service/Dockerfile
    ports:
      - "3009:3009"
    environment:
      - NODE_ENV=development
      - PORT=3009
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # Schema configuration
      - DATABASE_SCHEMA=payment_schema
      - USE_SCHEMA_PER_SERVICE=true
      # PayOS integration
      - PAYOS_CLIENT_ID=${PAYOS_CLIENT_ID}
      - PAYOS_API_KEY=${PAYOS_API_KEY}
      - PAYOS_CHECKSUM_KEY=${PAYOS_CHECKSUM_KEY}
    networks:
      - hospital-network
    profiles:
      - core
      - full

  # File Service - Standalone (unchanged)
  file-service:
    build:
      context: .
      dockerfile: ./services/file-service/Dockerfile
    ports:
      - "3107:3107"
    environment:
      - NODE_ENV=development
      - PORT=3107
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      # Schema configuration
      - DATABASE_SCHEMA=file_schema
      - USE_SCHEMA_PER_SERVICE=true
      # Storage configuration
      - SUPABASE_STORAGE_BUCKET=documents
    networks:
      - hospital-network
    profiles:
      - core
      - full

  # Infrastructure services (unchanged)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - hospital-network
    profiles:
      - core
      - full

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - hospital-network
    profiles:
      - core
      - full

volumes:
  redis_data:
  rabbitmq_data:

networks:
  hospital-network:
    driver: bridge
```

---

**Status:** 🚧 Migration Scripts & Documentation In Progress  
**Next:** Complete service configurations and migration scripts
