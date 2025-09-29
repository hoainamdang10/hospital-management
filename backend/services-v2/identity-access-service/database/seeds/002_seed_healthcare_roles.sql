-- Healthcare Roles and Permissions Seed Data
-- Predefined roles and permissions for Vietnamese healthcare system
-- 
-- @author Hospital Management Team
-- @version 2.0.0
-- @compliance Vietnamese Healthcare Standards, HIPAA, RBAC

-- Set search path
SET search_path TO auth_schema, public;

-- =====================================================
-- INSERT HEALTHCARE ROLES
-- =====================================================

INSERT INTO healthcare_roles (role_name, role_name_vietnamese, description, description_vietnamese, hierarchy, is_system_role, is_active) VALUES
-- System Administrator
('admin', 'Quản trị viên hệ thống', 
 'Full system access and management capabilities', 
 'Quyền truy cập và quản lý toàn bộ hệ thống', 
 1, true, true),

-- Medical Professionals
('doctor', 'Bác sĩ', 
 'Medical professional with patient care responsibilities', 
 'Chuyên gia y tế có trách nhiệm chăm sóc bệnh nhân', 
 2, true, true),

('nurse', 'Y tá', 
 'Healthcare professional supporting patient care', 
 'Chuyên viên y tế hỗ trợ chăm sóc bệnh nhân', 
 3, true, true),

('pharmacist', 'Dược sĩ', 
 'Medication management and dispensing professional', 
 'Chuyên viên quản lý và phát thuốc', 
 4, true, true),

-- Support Staff
('receptionist', 'Lễ tân', 
 'Front desk staff managing appointments and patient check-in', 
 'Nhân viên lễ tân quản lý lịch hẹn và đăng ký bệnh nhân', 
 5, true, true),

('lab_technician', 'Kỹ thuật viên xét nghiệm', 
 'Laboratory testing and analysis professional', 
 'Chuyên viên xét nghiệm và phân tích y khoa', 
 6, true, true),

('radiologist', 'Bác sĩ X-quang', 
 'Medical imaging and radiology specialist', 
 'Chuyên gia chẩn đoán hình ảnh và X-quang', 
 7, true, true),

-- Patients
('patient', 'Bệnh nhân', 
 'Healthcare service recipient', 
 'Người nhận dịch vụ chăm sóc sức khỏe', 
 8, true, true);

-- =====================================================
-- INSERT HEALTHCARE PERMISSIONS
-- =====================================================

-- System Management Permissions
INSERT INTO healthcare_permissions (permission_name, resource, action, scope, description, description_vietnamese, is_system_permission) VALUES
('system:manage', 'system', 'manage', NULL, 'Full system management access', 'Quyền quản lý toàn bộ hệ thống', true),
('system:read', 'system', 'read', NULL, 'System information read access', 'Quyền đọc thông tin hệ thống', true),

-- User Management Permissions
('user:create', 'user', 'create', NULL, 'Create new users', 'Tạo người dùng mới', true),
('user:read', 'user', 'read', NULL, 'Read user information', 'Đọc thông tin người dùng', true),
('user:read:own', 'user', 'read', 'own', 'Read own user information', 'Đọc thông tin cá nhân', true),
('user:update', 'user', 'update', NULL, 'Update user information', 'Cập nhật thông tin người dùng', true),
('user:update:own', 'user', 'update', 'own', 'Update own user information', 'Cập nhật thông tin cá nhân', true),
('user:delete', 'user', 'delete', NULL, 'Delete/deactivate users', 'Xóa/vô hiệu hóa người dùng', true),
('user:manage', 'user', 'manage', NULL, 'Full user management', 'Quản lý người dùng toàn quyền', true),

-- Role Management Permissions
('role:create', 'role', 'create', NULL, 'Create new roles', 'Tạo vai trò mới', true),
('role:read', 'role', 'read', NULL, 'Read role information', 'Đọc thông tin vai trò', true),
('role:update', 'role', 'update', NULL, 'Update role information', 'Cập nhật thông tin vai trò', true),
('role:delete', 'role', 'delete', NULL, 'Delete roles', 'Xóa vai trò', true),
('role:assign', 'role', 'assign', NULL, 'Assign roles to users', 'Phân quyền cho người dùng', true),

-- Patient Management Permissions
('patient:create', 'patient', 'create', NULL, 'Register new patients', 'Đăng ký bệnh nhân mới', true),
('patient:read', 'patient', 'read', NULL, 'Read patient information', 'Đọc thông tin bệnh nhân', true),
('patient:read:own', 'patient', 'read', 'own', 'Read own patient information', 'Đọc thông tin bệnh nhân cá nhân', true),
('patient:read:assigned', 'patient', 'read', 'assigned', 'Read assigned patient information', 'Đọc thông tin bệnh nhân được phân công', true),
('patient:update', 'patient', 'update', NULL, 'Update patient information', 'Cập nhật thông tin bệnh nhân', true),
('patient:update:own', 'patient', 'update', 'own', 'Update own patient information', 'Cập nhật thông tin bệnh nhân cá nhân', true),
('patient:update:assigned', 'patient', 'update', 'assigned', 'Update assigned patient information', 'Cập nhật thông tin bệnh nhân được phân công', true),
('patient:delete', 'patient', 'delete', NULL, 'Delete patient records', 'Xóa hồ sơ bệnh nhân', true),

-- Provider/Staff Management Permissions
('provider:create', 'provider', 'create', NULL, 'Register new healthcare providers', 'Đăng ký nhân viên y tế mới', true),
('provider:read', 'provider', 'read', NULL, 'Read provider information', 'Đọc thông tin nhân viên y tế', true),
('provider:read:own', 'provider', 'read', 'own', 'Read own provider information', 'Đọc thông tin nhân viên y tế cá nhân', true),
('provider:update', 'provider', 'update', NULL, 'Update provider information', 'Cập nhật thông tin nhân viên y tế', true),
('provider:update:own', 'provider', 'update', 'own', 'Update own provider information', 'Cập nhật thông tin nhân viên y tế cá nhân', true),
('provider:delete', 'provider', 'delete', NULL, 'Delete provider records', 'Xóa hồ sơ nhân viên y tế', true),
('provider:schedule', 'provider', 'schedule', NULL, 'Manage provider schedules', 'Quản lý lịch làm việc nhân viên y tế', true),

-- Appointment Management Permissions
('appointment:create', 'appointment', 'create', NULL, 'Create appointments', 'Tạo lịch hẹn', true),
('appointment:create:own', 'appointment', 'create', 'own', 'Create own appointments', 'Tạo lịch hẹn cá nhân', true),
('appointment:read', 'appointment', 'read', NULL, 'Read appointment information', 'Đọc thông tin lịch hẹn', true),
('appointment:read:own', 'appointment', 'read', 'own', 'Read own appointments', 'Đọc lịch hẹn cá nhân', true),
('appointment:read:assigned', 'appointment', 'read', 'assigned', 'Read assigned appointments', 'Đọc lịch hẹn được phân công', true),
('appointment:read:department', 'appointment', 'read', 'department', 'Read department appointments', 'Đọc lịch hẹn khoa phòng', true),
('appointment:update', 'appointment', 'update', NULL, 'Update appointment information', 'Cập nhật thông tin lịch hẹn', true),
('appointment:update:own', 'appointment', 'update', 'own', 'Update own appointments', 'Cập nhật lịch hẹn cá nhân', true),
('appointment:update:assigned', 'appointment', 'update', 'assigned', 'Update assigned appointments', 'Cập nhật lịch hẹn được phân công', true),
('appointment:cancel', 'appointment', 'cancel', NULL, 'Cancel appointments', 'Hủy lịch hẹn', true),
('appointment:cancel:own', 'appointment', 'cancel', 'own', 'Cancel own appointments', 'Hủy lịch hẹn cá nhân', true),

-- Medical Records Permissions
('medical_record:create', 'medical_record', 'create', NULL, 'Create medical records', 'Tạo hồ sơ bệnh án', true),
('medical_record:read', 'medical_record', 'read', NULL, 'Read medical records', 'Đọc hồ sơ bệnh án', true),
('medical_record:read:own', 'medical_record', 'read', 'own', 'Read own medical records', 'Đọc hồ sơ bệnh án cá nhân', true),
('medical_record:read:assigned', 'medical_record', 'read', 'assigned', 'Read assigned patient medical records', 'Đọc hồ sơ bệnh án bệnh nhân được phân công', true),
('medical_record:read:summary', 'medical_record', 'read', 'summary', 'Read medical record summaries', 'Đọc tóm tắt hồ sơ bệnh án', true),
('medical_record:update', 'medical_record', 'update', NULL, 'Update medical records', 'Cập nhật hồ sơ bệnh án', true),
('medical_record:update:assigned', 'medical_record', 'update', 'assigned', 'Update assigned patient medical records', 'Cập nhật hồ sơ bệnh án bệnh nhân được phân công', true),
('medical_record:delete', 'medical_record', 'delete', NULL, 'Delete medical records', 'Xóa hồ sơ bệnh án', true),

-- Prescription Permissions
('prescription:create', 'prescription', 'create', NULL, 'Create prescriptions', 'Tạo đơn thuốc', true),
('prescription:create:assigned', 'prescription', 'create', 'assigned', 'Create prescriptions for assigned patients', 'Tạo đơn thuốc cho bệnh nhân được phân công', true),
('prescription:read', 'prescription', 'read', NULL, 'Read prescription information', 'Đọc thông tin đơn thuốc', true),
('prescription:read:own', 'prescription', 'read', 'own', 'Read own prescriptions', 'Đọc đơn thuốc cá nhân', true),
('prescription:read:assigned', 'prescription', 'read', 'assigned', 'Read prescriptions for assigned patients', 'Đọc đơn thuốc bệnh nhân được phân công', true),
('prescription:update', 'prescription', 'update', NULL, 'Update prescription information', 'Cập nhật thông tin đơn thuốc', true),
('prescription:dispense', 'prescription', 'dispense', NULL, 'Dispense medications', 'Phát thuốc', true),

-- Laboratory Permissions
('lab_result:create', 'lab_result', 'create', NULL, 'Create lab results', 'Tạo kết quả xét nghiệm', true),
('lab_result:read', 'lab_result', 'read', NULL, 'Read lab results', 'Đọc kết quả xét nghiệm', true),
('lab_result:read:own', 'lab_result', 'read', 'own', 'Read own lab results', 'Đọc kết quả xét nghiệm cá nhân', true),
('lab_result:read:assigned', 'lab_result', 'read', 'assigned', 'Read lab results for assigned patients', 'Đọc kết quả xét nghiệm bệnh nhân được phân công', true),
('lab_result:read:department', 'lab_result', 'read', 'department', 'Read department lab results', 'Đọc kết quả xét nghiệm khoa phòng', true),
('lab_result:update', 'lab_result', 'update', NULL, 'Update lab results', 'Cập nhật kết quả xét nghiệm', true),

-- Billing Permissions
('billing:create', 'billing', 'create', NULL, 'Create billing records', 'Tạo hóa đơn', true),
('billing:read', 'billing', 'read', NULL, 'Read billing information', 'Đọc thông tin hóa đơn', true),
('billing:read:own', 'billing', 'read', 'own', 'Read own billing information', 'Đọc thông tin hóa đơn cá nhân', true),
('billing:read:assigned', 'billing', 'read', 'assigned', 'Read billing for assigned patients', 'Đọc thông tin hóa đơn bệnh nhân được phân công', true),
('billing:update', 'billing', 'update', NULL, 'Update billing information', 'Cập nhật thông tin hóa đơn', true),
('billing:pay', 'billing', 'pay', NULL, 'Process payments', 'Xử lý thanh toán', true),
('billing:pay:own', 'billing', 'pay', 'own', 'Pay own bills', 'Thanh toán hóa đơn cá nhân', true),

-- Notification Permissions
('notification:send', 'notification', 'send', NULL, 'Send notifications', 'Gửi thông báo', true),
('notification:send:patient', 'notification', 'send', 'patient', 'Send notifications to patients', 'Gửi thông báo cho bệnh nhân', true),
('notification:send:appointment', 'notification', 'send', 'appointment', 'Send appointment notifications', 'Gửi thông báo lịch hẹn', true),
('notification:read', 'notification', 'read', NULL, 'Read notifications', 'Đọc thông báo', true),
('notification:read:own', 'notification', 'read', 'own', 'Read own notifications', 'Đọc thông báo cá nhân', true),

-- Audit and Reporting Permissions
('audit:read', 'audit', 'read', NULL, 'Read audit logs', 'Đọc nhật ký kiểm toán', true),
('report:generate', 'report', 'generate', NULL, 'Generate reports', 'Tạo báo cáo', true),
('report:read', 'report', 'read', NULL, 'Read reports', 'Đọc báo cáo', true);

-- =====================================================
-- ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Admin Role - Full System Access
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr.id, hp.id
FROM healthcare_roles hr, healthcare_permissions hp
WHERE hr.role_name = 'admin';

-- Doctor Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr.id, hp.id
FROM healthcare_roles hr, healthcare_permissions hp
WHERE hr.role_name = 'doctor'
AND hp.permission_name IN (
    'patient:read', 'patient:read:assigned', 'patient:update:assigned',
    'appointment:read:assigned', 'appointment:update:assigned',
    'medical_record:create', 'medical_record:read:assigned', 'medical_record:update:assigned',
    'prescription:create:assigned', 'prescription:read:assigned', 'prescription:update',
    'lab_result:read:assigned',
    'billing:read:assigned',
    'notification:send:patient',
    'user:read:own', 'user:update:own',
    'provider:read:own', 'provider:update:own'
);

-- Nurse Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr.id, hp.id
FROM healthcare_roles hr, healthcare_permissions hp
WHERE hr.role_name = 'nurse'
AND hp.permission_name IN (
    'patient:read', 'patient:update:assigned',
    'appointment:read:department', 'appointment:update:assigned',
    'medical_record:read:assigned', 'medical_record:update:assigned',
    'prescription:read:assigned',
    'lab_result:read:department',
    'notification:send:patient',
    'user:read:own', 'user:update:own',
    'provider:read:own', 'provider:update:own'
);

-- Pharmacist Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr.id, hp.id
FROM healthcare_roles hr, healthcare_permissions hp
WHERE hr.role_name = 'pharmacist'
AND hp.permission_name IN (
    'patient:read',
    'prescription:read', 'prescription:dispense', 'prescription:update',
    'billing:create', 'billing:read',
    'user:read:own', 'user:update:own',
    'provider:read:own', 'provider:update:own'
);

-- Receptionist Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr.id, hp.id
FROM healthcare_roles hr, healthcare_permissions hp
WHERE hr.role_name = 'receptionist'
AND hp.permission_name IN (
    'patient:create', 'patient:read', 'patient:update',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:cancel',
    'provider:read',
    'billing:create', 'billing:read',
    'notification:send:appointment',
    'user:read:own', 'user:update:own'
);

-- Lab Technician Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr.id, hp.id
FROM healthcare_roles hr, healthcare_permissions hp
WHERE hr.role_name = 'lab_technician'
AND hp.permission_name IN (
    'patient:read',
    'lab_result:create', 'lab_result:read', 'lab_result:update',
    'user:read:own', 'user:update:own',
    'provider:read:own', 'provider:update:own'
);

-- Radiologist Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr.id, hp.id
FROM healthcare_roles hr, healthcare_permissions hp
WHERE hr.role_name = 'radiologist'
AND hp.permission_name IN (
    'patient:read', 'patient:read:assigned',
    'medical_record:read:assigned',
    'lab_result:create', 'lab_result:read:assigned', 'lab_result:update',
    'user:read:own', 'user:update:own',
    'provider:read:own', 'provider:update:own'
);

-- Patient Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr.id, hp.id
FROM healthcare_roles hr, healthcare_permissions hp
WHERE hr.role_name = 'patient'
AND hp.permission_name IN (
    'patient:read:own', 'patient:update:own',
    'appointment:create:own', 'appointment:read:own', 'appointment:cancel:own',
    'medical_record:read:own', 'medical_record:read:summary',
    'prescription:read:own',
    'lab_result:read:own',
    'billing:read:own', 'billing:pay:own',
    'notification:read:own',
    'user:read:own', 'user:update:own'
);

-- =====================================================
-- CREATE DEFAULT ADMIN USER PROFILE
-- Note: This assumes a Supabase user with this email exists
-- =====================================================

-- Insert admin user profile (update email as needed)
INSERT INTO user_profiles (
    user_id, 
    full_name, 
    phone_number, 
    department, 
    employee_id,
    is_active,
    created_at
) VALUES (
    -- Replace with actual admin user UUID from auth.users
    (SELECT id FROM auth.users WHERE email = 'admin@hospital.com' LIMIT 1),
    'System Administrator',
    '0123456789',
    'IT Department',
    'ADMIN-001',
    true,
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO user_role_assignments (
    user_id,
    role_id,
    assigned_by,
    reason
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@hospital.com' LIMIT 1),
    (SELECT id FROM healthcare_roles WHERE role_name = 'admin'),
    (SELECT id FROM auth.users WHERE email = 'admin@hospital.com' LIMIT 1),
    'Initial system setup - default admin user'
) ON CONFLICT (user_id, role_id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify roles were created
SELECT 
    role_name,
    role_name_vietnamese,
    hierarchy,
    is_system_role,
    is_active
FROM healthcare_roles
ORDER BY hierarchy;

-- Verify permissions were created
SELECT 
    COUNT(*) as total_permissions,
    COUNT(CASE WHEN is_system_permission THEN 1 END) as system_permissions
FROM healthcare_permissions;

-- Verify role-permission assignments
SELECT 
    hr.role_name,
    hr.role_name_vietnamese,
    COUNT(rp.permission_id) as permission_count
FROM healthcare_roles hr
LEFT JOIN role_permissions rp ON hr.id = rp.role_id
GROUP BY hr.id, hr.role_name, hr.role_name_vietnamese
ORDER BY hr.hierarchy;
