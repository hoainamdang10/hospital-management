# Healthcare Roles Overview - Identity Service V2

**Version**: 2.0.0  
**Last Updated**: 2025-01-08  
**Status**: ✅ Complete

---

## 📊 Overview

Identity Service V2 hỗ trợ **5 core healthcare roles** được tối ưu cho graduation project scope.

---

## 🎯 5 Core Roles

### 1. ADMIN - System Administrator
**Description**: Quản trị viên hệ thống với full permissions

**Responsibilities**:
- Quản lý users và roles
- Quản lý system configuration
- Quản lý billing system
- Access to all system features
- Emergency access management

**Key Permissions**:
- `*:*` - Wildcard permission (full access)
- `users:*` - All user management
- `roles:*` - All role management
- `billing:*` - All billing operations
- `system:*` - All system operations

**Staff Invitation**: ✅ Yes (via `/admin/staff/register`)

---

### 2. DOCTOR - Medical Doctor
**Description**: Bác sĩ với quyền clinical decision making

**Responsibilities**:
- Khám bệnh và chẩn đoán
- Kê đơn thuốc (prescribing)
- Yêu cầu xét nghiệm (lab orders)
- Xem và cập nhật medical records
- Tạo treatment plans

**Key Permissions**:
- `patients:read` - Xem thông tin bệnh nhân
- `patients:write` - Cập nhật thông tin bệnh nhân
- `medical-records:*` - Full medical records access
- `prescriptions:create` - Kê đơn thuốc
- `prescriptions:read` - Xem đơn thuốc
- `prescriptions:update` - Sửa đơn thuốc
- `lab-orders:create` - Yêu cầu xét nghiệm
- `lab-orders:read` - Xem kết quả xét nghiệm
- `lab-results:read` - Xem kết quả xét nghiệm
- `appointments:read` - Xem lịch hẹn
- `appointments:update` - Cập nhật lịch hẹn

**Staff Invitation**: ✅ Yes (via `/admin/staff/register`)

**Note**: Doctor role bao gồm pharmacy ordering permissions (merged từ PHARMACIST role)

---

### 3. NURSE - Registered Nurse
**Description**: Y tá với quyền operational tasks

**Responsibilities**:
- Chăm sóc bệnh nhân
- Phát thuốc (dispensing)
- Lấy mẫu xét nghiệm (specimen collection)
- Cập nhật vital signs
- Hỗ trợ bác sĩ

**Key Permissions**:
- `patients:read` - Xem thông tin bệnh nhân
- `patients:update` - Cập nhật vital signs
- `medical-records:read` - Xem medical records
- `medical-records:update` - Cập nhật nursing notes
- `prescriptions:read` - Xem đơn thuốc
- `prescriptions:dispense` - Phát thuốc
- `medications:read` - Xem kho thuốc
- `medications:update` - Cập nhật kho thuốc
- `lab-orders:read` - Xem yêu cầu xét nghiệm
- `lab-orders:update` - Cập nhật trạng thái
- `lab-specimens:create` - Lấy mẫu xét nghiệm
- `lab-specimens:read` - Xem mẫu xét nghiệm
- `appointments:read` - Xem lịch hẹn

**Staff Invitation**: ✅ Yes (via `/admin/staff/register`)

**Note**: Nurse role bao gồm pharmacy dispensing và lab specimen collection (merged từ PHARMACIST và LAB_TECHNICIAN roles)

---

### 4. RECEPTIONIST - Front Desk Staff
**Description**: Lễ tân với quyền administrative tasks

**Responsibilities**:
- Đăng ký bệnh nhân mới
- Quản lý appointments
- Xử lý billing và payments
- Check-in/check-out bệnh nhân
- Hỗ trợ khách hàng

**Key Permissions**:
- `patients:create` - Đăng ký bệnh nhân mới
- `patients:read` - Xem thông tin bệnh nhân
- `patients:update` - Cập nhật thông tin cơ bản
- `appointments:create` - Tạo lịch hẹn
- `appointments:read` - Xem lịch hẹn
- `appointments:update` - Cập nhật lịch hẹn
- `appointments:cancel` - Hủy lịch hẹn
- `billing:create` - Tạo hóa đơn
- `billing:read` - Xem hóa đơn
- `billing:update` - Cập nhật hóa đơn
- `payments:create` - Xử lý thanh toán
- `payments:read` - Xem thanh toán

**Staff Invitation**: ✅ Yes (via `/admin/staff/register`)

**Note**: Receptionist role bao gồm billing operations (merged từ BILLING_STAFF role)

---

### 5. PATIENT - Patient User
**Description**: Bệnh nhân với quyền self-service

**Responsibilities**:
- Xem medical records của mình
- Đặt lịch hẹn
- Xem prescriptions của mình
- Cập nhật thông tin cá nhân
- Xem billing và payments

**Key Permissions**:
- `patients:read:own` - Xem thông tin của mình
- `patients:update:own` - Cập nhật thông tin của mình
- `medical-records:read:own` - Xem medical records của mình
- `prescriptions:read:own` - Xem đơn thuốc của mình
- `appointments:create:own` - Đặt lịch hẹn
- `appointments:read:own` - Xem lịch hẹn của mình
- `appointments:cancel:own` - Hủy lịch hẹn của mình
- `billing:read:own` - Xem hóa đơn của mình
- `payments:read:own` - Xem thanh toán của mình

**Staff Invitation**: ❌ No (self-registration only via `/auth/register`)

**Note**: Patient role chỉ có quyền truy cập dữ liệu của chính mình (ownership-based permissions)

---

## 📋 Role Comparison Matrix

| Feature | ADMIN | DOCTOR | NURSE | RECEPTIONIST | PATIENT |
|---------|-------|--------|-------|--------------|---------|
| **Staff Invitation** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Self Registration** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Full System Access** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Medical Records** | ✅ | ✅ Read/Write | ✅ Read/Update | ❌ | ✅ Own Only |
| **Prescriptions** | ✅ | ✅ Create/Update | ✅ Dispense | ❌ | ✅ Own Only |
| **Lab Orders** | ✅ | ✅ Create/Read | ✅ Collect | ❌ | ✅ Own Only |
| **Appointments** | ✅ | ✅ Read/Update | ✅ Read | ✅ Full | ✅ Own Only |
| **Billing** | ✅ | ❌ | ❌ | ✅ Full | ✅ Own Only |
| **User Management** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🔄 Migration from 8 Roles

### Deprecated Roles (Merged)

1. **PHARMACIST** → Merged into DOCTOR + NURSE
   - Prescribing → DOCTOR
   - Dispensing → NURSE

2. **LAB_TECHNICIAN** → Merged into DOCTOR + NURSE
   - Ordering → DOCTOR
   - Specimen Collection → NURSE

3. **BILLING_STAFF** → Merged into RECEPTIONIST + ADMIN
   - Operational Billing → RECEPTIONIST
   - Billing Management → ADMIN

### Migration Details
See [ROLE_SIMPLIFICATION_SUMMARY.md](../ROLE_SIMPLIFICATION_SUMMARY.md) for complete migration details.

---

## 🚀 Usage

### Staff Registration (Admin Only)
```bash
POST /admin/staff/register
{
  "email": "doctor@hospital.com",
  "fullName": "Dr. Nguyễn Văn A",
  "roleType": "DOCTOR",  # ADMIN, DOCTOR, NURSE, or RECEPTIONIST
  "phoneNumber": "0912345678"
}
```

### Patient Self-Registration (Public)
```bash
POST /auth/register
{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "fullName": "Nguyễn Văn B",
  "roleType": "PATIENT",  # Always PATIENT
  "phoneNumber": "0912345678"
}
```

---

## 📝 Notes

1. **Staff Roles** (4): ADMIN, DOCTOR, NURSE, RECEPTIONIST
   - Chỉ admin mới có thể tạo staff accounts
   - Staff nhận email invitation để kích hoạt

2. **Patient Role** (1): PATIENT
   - Tự đăng ký qua public endpoint
   - Không cần admin approval

3. **Permission Model**: Resource-based với ownership checks
   - Format: `resource:action` hoặc `resource:action:scope`
   - Example: `patients:read:own` (chỉ đọc của mình)

4. **Wildcard Permissions**: Chỉ ADMIN có `*:*`

---

## 🔗 Related Documentation

- [Staff Activation Flow](./STAFF_ACTIVATION_FLOW.md)
- [Role Simplification Summary](../ROLE_SIMPLIFICATION_SUMMARY.md)
- [API Contract](./api/IDENTITY_API_CONTRACT.md)
- [RBAC Implementation](../RBAC_IMPLEMENTATION.md)

---

**Maintained By**: Identity Service Team  
**Last Review**: 2025-01-08  
**Next Review**: After production deployment

