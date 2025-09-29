-- Identity & Access Service Database Schema
-- Production-ready Supabase schema with healthcare compliance
-- 
-- @author Hospital Management Team
-- @version 2.0.0
-- @compliance Healthcare RBAC, Vietnamese Standards, HIPAA

-- Create dedicated schema for Identity & Access Service
CREATE SCHEMA IF NOT EXISTS auth_schema;

-- Set search path
SET search_path TO auth_schema, public;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USER PROFILES TABLE
-- Extends Supabase auth.users with healthcare-specific data
-- =====================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    department VARCHAR(100),
    license_number VARCHAR(50), -- For healthcare professionals
    employee_id VARCHAR(50),
    emergency_contact JSONB,
    
    -- Security and compliance fields
    is_active BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(user_id),
    UNIQUE(employee_id),
    UNIQUE(license_number)
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX idx_user_profiles_license_number ON user_profiles(license_number);
CREATE INDEX idx_user_profiles_department ON user_profiles(department);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);

-- =====================================================
-- HEALTHCARE ROLES TABLE
-- Predefined and custom healthcare roles
-- =====================================================

CREATE TABLE healthcare_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_name_vietnamese VARCHAR(100) NOT NULL,
    description TEXT,
    description_vietnamese TEXT,
    hierarchy INTEGER NOT NULL DEFAULT 10, -- 1 = highest authority
    is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CHECK (hierarchy >= 1 AND hierarchy <= 10),
    CHECK (role_name ~ '^[a-z_]+$') -- Only lowercase and underscores
);

-- Create indexes
CREATE INDEX idx_healthcare_roles_name ON healthcare_roles(role_name);
CREATE INDEX idx_healthcare_roles_hierarchy ON healthcare_roles(hierarchy);
CREATE INDEX idx_healthcare_roles_active ON healthcare_roles(is_active);

-- =====================================================
-- HEALTHCARE PERMISSIONS TABLE
-- Granular permissions for healthcare operations
-- =====================================================

CREATE TABLE healthcare_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL, -- patient, appointment, medical_record, etc.
    action VARCHAR(50) NOT NULL,   -- create, read, update, delete, manage
    scope VARCHAR(50),             -- own, assigned, department, all
    description TEXT,
    description_vietnamese TEXT,
    is_system_permission BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (permission_name ~ '^[a-z_]+:[a-z_\*]+(:([a-z_]+|\*))?$'), -- Format: resource:action or resource:action:scope
    CHECK (resource ~ '^[a-z_]+$'),
    CHECK (action ~ '^[a-z_\*]+$')
);

-- Create indexes
CREATE INDEX idx_healthcare_permissions_resource ON healthcare_permissions(resource);
CREATE INDEX idx_healthcare_permissions_action ON healthcare_permissions(action);
CREATE INDEX idx_healthcare_permissions_scope ON healthcare_permissions(scope);

-- =====================================================
-- ROLE PERMISSIONS MAPPING TABLE
-- Many-to-many relationship between roles and permissions
-- =====================================================

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES healthcare_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES healthcare_permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id),
    
    PRIMARY KEY (role_id, permission_id)
);

-- Create indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- =====================================================
-- USER ROLE ASSIGNMENTS TABLE
-- Assigns roles to users with expiration and audit trail
-- =====================================================

CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES healthcare_roles(id) ON DELETE CASCADE,
    
    -- Assignment details
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    reason TEXT,
    
    -- Revocation details
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES auth.users(id),
    revocation_reason TEXT,
    
    -- Constraints
    UNIQUE(user_id, role_id), -- One assignment per user-role pair
    CHECK (expires_at IS NULL OR expires_at > assigned_at),
    CHECK (revoked_at IS NULL OR revoked_at >= assigned_at)
);

-- Create indexes
CREATE INDEX idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX idx_user_role_assignments_active ON user_role_assignments(is_active);
CREATE INDEX idx_user_role_assignments_expires ON user_role_assignments(expires_at);

-- =====================================================
-- FAILED LOGIN ATTEMPTS TABLE
-- Rate limiting and security monitoring
-- =====================================================

CREATE TABLE failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failure_reason VARCHAR(100),
    
    -- Cleanup old records automatically
    CONSTRAINT check_recent_attempt CHECK (attempted_at > NOW() - INTERVAL '7 days')
);

-- Create indexes
CREATE INDEX idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_login_attempts_time ON failed_login_attempts(attempted_at);

-- =====================================================
-- AUDIT LOG TABLE
-- Security and compliance audit trail
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    action VARCHAR(50),
    details JSONB,
    correlation_id VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Partitioning key for performance
    created_date DATE GENERATED ALWAYS AS (created_at::date) STORED
);

-- Create indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Healthcare data protection and access control
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own basic profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN healthcare_roles hr ON ura.role_id = hr.id
            WHERE ura.user_id = auth.uid() 
            AND hr.role_name = 'admin'
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
        )
    );

CREATE POLICY "Admins and receptionists can manage profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN healthcare_roles hr ON ura.role_id = hr.id
            WHERE ura.user_id = auth.uid() 
            AND hr.role_name IN ('admin', 'receptionist')
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
        )
    );

-- Healthcare Roles Policies
CREATE POLICY "All authenticated users can read active roles" ON healthcare_roles
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Only admins can manage roles" ON healthcare_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN healthcare_roles hr ON ura.role_id = hr.id
            WHERE ura.user_id = auth.uid() 
            AND hr.role_name = 'admin'
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
        )
    );

-- Healthcare Permissions Policies
CREATE POLICY "All authenticated users can read permissions" ON healthcare_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage permissions" ON healthcare_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN healthcare_roles hr ON ura.role_id = hr.id
            WHERE ura.user_id = auth.uid() 
            AND hr.role_name = 'admin'
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
        )
    );

-- Role Permissions Policies
CREATE POLICY "All authenticated users can read role permissions" ON role_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage role permissions" ON role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN healthcare_roles hr ON ura.role_id = hr.id
            WHERE ura.user_id = auth.uid() 
            AND hr.role_name = 'admin'
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
        )
    );

-- User Role Assignments Policies
CREATE POLICY "Users can read own role assignments" ON user_role_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all role assignments" ON user_role_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN healthcare_roles hr ON ura.role_id = hr.id
            WHERE ura.user_id = auth.uid() 
            AND hr.role_name = 'admin'
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
        )
    );

CREATE POLICY "Only admins can manage role assignments" ON user_role_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN healthcare_roles hr ON ura.role_id = hr.id
            WHERE ura.user_id = auth.uid() 
            AND hr.role_name = 'admin'
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
        )
    );

-- Failed Login Attempts Policies (System access only)
CREATE POLICY "System can manage failed login attempts" ON failed_login_attempts
    FOR ALL USING (auth.role() = 'service_role');

-- Audit Logs Policies
CREATE POLICY "Admins can read audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN healthcare_roles hr ON ura.role_id = hr.id
            WHERE ura.user_id = auth.uid() 
            AND hr.role_name = 'admin'
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- Automated data management and validation
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_healthcare_roles_updated_at 
    BEFORE UPDATE ON healthcare_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire role assignments
CREATE OR REPLACE FUNCTION expire_role_assignments()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark expired assignments as inactive
    UPDATE user_role_assignments 
    SET is_active = false 
    WHERE expires_at IS NOT NULL 
    AND expires_at <= NOW() 
    AND is_active = true;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to run expiration check
CREATE TRIGGER check_role_assignment_expiration
    AFTER INSERT OR UPDATE ON user_role_assignments
    FOR EACH STATEMENT EXECUTE FUNCTION expire_role_assignments();

-- Function to clean up old failed login attempts
CREATE OR REPLACE FUNCTION cleanup_failed_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete attempts older than 7 days
    DELETE FROM failed_login_attempts 
    WHERE attempted_at < NOW() - INTERVAL '7 days';
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for cleanup
CREATE TRIGGER cleanup_old_failed_attempts
    AFTER INSERT ON failed_login_attempts
    FOR EACH STATEMENT EXECUTE FUNCTION cleanup_failed_login_attempts();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA auth_schema IS 'Identity & Access Service schema for healthcare RBAC';
COMMENT ON TABLE user_profiles IS 'Extended user profiles with healthcare-specific data';
COMMENT ON TABLE healthcare_roles IS 'Healthcare-specific roles (admin, doctor, nurse, patient, etc.)';
COMMENT ON TABLE healthcare_permissions IS 'Granular permissions for healthcare operations';
COMMENT ON TABLE role_permissions IS 'Many-to-many mapping between roles and permissions';
COMMENT ON TABLE user_role_assignments IS 'User role assignments with expiration and audit trail';
COMMENT ON TABLE failed_login_attempts IS 'Failed login attempts for rate limiting and security';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA auth_schema TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth_schema TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth_schema TO authenticated;
