# Hospital Management System - User Registration & Login Research Report

**Date**: 2025-01-06
**Purpose**: Research các loại user và registration/login flows trong Hospital Management Systems
**Status**: ✅ COMPLETE

---

## Executive Summary

Báo cáo này tổng hợp research về các loại user và quy trình đăng ký/đăng nhập trong Hospital Management Systems (HMS) trên thế giới. Kết quả cho thấy có 2 nhóm user chính với quy trình registration khác nhau hoàn toàn:

1. **Patients**: Self-registration, online booking, kiosk check-in
2. **Staff**: HR onboarding, credential verification, admin-created accounts

---

## 1. User Types trong HMS

### 1.1. Core User Types

Theo research từ nhiều HMS systems, có 8 loại user chính:

| User Type | Vietnamese | Description | Registration Method |
|-----------|-----------|-------------|---------------------|
| **Administrator** | Quản trị viên | System admin, super admin | HR/IT Department |
| **Doctor** | Bác sĩ | Physicians, specialists | HR + Credential Verification |
| **Nurse** | Y tá | Registered nurses, nurse practitioners | HR + License Verification |
| **Patient** | Bệnh nhân | Hospital patients | Self-registration |
| **Receptionist** | Lễ tân | Front desk staff | HR Onboarding |
| **Pharmacist** | Dược sĩ | Pharmacy staff | HR + License Verification |
| **Lab Technician** | Kỹ thuật viên xét nghiệm | Laboratory staff | HR Onboarding |
| **Billing Staff** | Nhân viên kế toán | Billing and finance staff | HR Onboarding |

### 1.2. User Type Hierarchy

```
Hospital Users
├── Administrative Staff
│   ├── Administrator (Super Admin)
│   ├── Admin
│   └── Receptionist
├── Medical Staff
│   ├── Doctor (Physician, Specialist)
│   ├── Nurse (RN, NP)
│   ├── Pharmacist
│   └── Lab Technician
├── Support Staff
│   └── Billing Staff
└── Patients
    ├── Outpatient
    └── Inpatient
```

---

## 2. Patient Registration Flows

### 2.1. Self-Registration (Online)

**Quy trình:**
1. Patient truy cập website/mobile app
2. Điền form đăng ký:
   - Email
   - Password
   - Full Name
   - Phone Number
   - Date of Birth
   - Address
   - Emergency Contact
3. Xác thực email/SMS OTP
4. Tạo tài khoản thành công
5. Có thể đặt lịch hẹn ngay

**Ưu điểm:**
- ✅ Tiện lợi cho patients
- ✅ Giảm tải cho lễ tân
- ✅ Patients có thể đặt lịch 24/7
- ✅ Giảm thời gian chờ đợi

**Nhược điểm:**
- ⚠️ Cần xác thực thông tin sau
- ⚠️ Có thể có thông tin sai
- ⚠️ Cần hệ thống email/SMS

**Implementation:**
```typescript
// Patient Self-Registration API
POST /api/v1/auth/register
{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0912345678",
  "dateOfBirth": "1990-01-01",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "emergencyContact": {
    "name": "Nguyễn Thị B",
    "phone": "0987654321",
    "relationship": "Vợ"
  },
  "roleType": "patient"  // Auto-assigned
}
```

### 2.2. Self-Service Kiosk Check-In

**Quy trình:**
1. Patient đến bệnh viện
2. Sử dụng kiosk tại lobby
3. Scan ID card hoặc nhập thông tin
4. Xác nhận appointment
5. Check-in thành công
6. Nhận số thứ tự

**Ưu điểm:**
- ✅ Giảm hàng đợi tại quầy lễ tân
- ✅ Tự động hóa check-in process
- ✅ Cập nhật thông tin real-time
- ✅ Giảm chi phí nhân sự

**Nhược điểm:**
- ⚠️ Cần đầu tư thiết bị kiosk
- ⚠️ Cần hỗ trợ cho người già
- ⚠️ Bảo trì thiết bị

### 2.3. Online Appointment Booking

**Quy trình:**
1. Patient login vào hệ thống
2. Chọn chuyên khoa
3. Chọn bác sĩ
4. Chọn ngày giờ khám
5. Xác nhận appointment
6. Nhận confirmation email/SMS

**Ưu điểm:**
- ✅ Tiện lợi, đặt lịch 24/7
- ✅ Giảm gọi điện thoại
- ✅ Tự động reminder
- ✅ Quản lý lịch hẹn tốt hơn

### 2.4. Walk-in Registration (Tại quầy lễ tân)

**Quy trình:**
1. Patient đến quầy lễ tân
2. Receptionist tạo tài khoản
3. Nhập thông tin patient
4. Scan ID card/CCCD
5. Tạo medical record
6. Assign patient ID

**Ưu điểm:**
- ✅ Hỗ trợ người già, không biết công nghệ
- ✅ Xác thực thông tin chính xác
- ✅ Tạo medical record ngay

**Nhược điểm:**
- ⚠️ Tốn thời gian
- ⚠️ Cần nhiều nhân sự
- ⚠️ Hàng đợi dài

---

## 3. Staff Registration Flows

### 3.1. HR Onboarding Process

**Quy trình:**
1. **HR Department** tạo tài khoản
2. Nhập thông tin nhân viên:
   - Full Name
   - Employee ID
   - Email (corporate email)
   - Phone Number
   - Department
   - Position
   - Role Type (Doctor, Nurse, etc.)
3. **Credential Verification** (cho medical staff):
   - Medical License Number
   - License Expiry Date
   - Specialization
   - Board Certification
4. **Primary Source Verification**:
   - Verify từ Medical Board
   - Verify từ University
   - Verify từ Previous Employer
5. **Account Activation**:
   - Send welcome email
   - Temporary password
   - Force password change on first login
6. **Training & Orientation**:
   - System training
   - HIPAA compliance training
   - Security awareness training

**Ưu điểm:**
- ✅ Xác thực chính xác
- ✅ Compliance với regulations
- ✅ Bảo mật cao
- ✅ Audit trail đầy đủ

**Nhược điểm:**
- ⚠️ Quy trình phức tạp
- ⚠️ Tốn thời gian
- ⚠️ Cần nhiều bước xác thực

**Implementation:**
```typescript
// Staff Registration by HR
POST /api/v1/admin/staff/register
{
  "email": "doctor.nguyen@hospital.vn",
  "fullName": "BS. Nguyễn Văn C",
  "employeeId": "EMP-2025-001",
  "phoneNumber": "0901234567",
  "department": "Cardiology",
  "position": "Senior Physician",
  "roleType": "doctor",
  "credentials": {
    "medicalLicenseNumber": "BS-12345",
    "licenseExpiryDate": "2026-12-31",
    "specialization": "Cardiology",
    "boardCertification": "Board Certified Cardiologist"
  },
  "verificationDocuments": [
    {
      "type": "medical_license",
      "fileUrl": "s3://documents/license-12345.pdf"
    },
    {
      "type": "degree",
      "fileUrl": "s3://documents/degree-12345.pdf"
    }
  ]
}
```

### 3.2. Credential Verification Process

**Medical Staff Credentials:**
- Medical License (Giấy phép hành nghề)
- Medical Degree (Bằng cấp y khoa)
- Board Certification (Chứng chỉ chuyên khoa)
- Continuing Medical Education (CME) Credits
- Malpractice Insurance

**Verification Sources:**
- Medical Board (Hội đồng Y khoa)
- University/Medical School
- Previous Employers
- Professional Associations
- NPDB (National Practitioner Data Bank) - US

**Verification Timeline:**
- Initial verification: 2-4 weeks
- Re-verification: Every 2 years
- License renewal: Annual

### 3.3. Admin-Created Accounts

**Quy trình:**
1. Admin login vào system
2. Navigate to User Management
3. Click "Create New User"
4. Select Role Type
5. Fill in user information
6. Assign permissions
7. Send activation email
8. User activates account

**Use Cases:**
- Emergency staff addition
- Temporary staff (locum tenens)
- Contractors
- Consultants

---

## 4. RBAC Implementation

### 4.1. Role-Based Access Control

**Core Roles:**
```typescript
enum HealthcareRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PATIENT = 'patient',
  RECEPTIONIST = 'receptionist',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
  BILLING_STAFF = 'billing_staff'
}
```

### 4.2. Permission Matrix

| Permission | Admin | Doctor | Nurse | Patient | Receptionist |
|-----------|-------|--------|-------|---------|--------------|
| View Patient Records | ✅ | ✅ | ✅ | Own Only | ✅ |
| Edit Patient Records | ✅ | ✅ | ✅ | ❌ | ❌ |
| Prescribe Medication | ❌ | ✅ | ❌ | ❌ | ❌ |
| Schedule Appointments | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Lab Results | ✅ | ✅ | ✅ | Own Only | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Billing Operations | ✅ | ❌ | ❌ | View Only | ✅ |

### 4.3. Multiple Roles Support

**Scenario**: Một bác sĩ có thể có nhiều roles:
- Doctor (primary role)
- Department Head (administrative role)
- Researcher (research role)

**Implementation:**
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];  // ['doctor', 'department_head']
  permissions: string[];  // Aggregated from all roles
}
```

---

## 5. Recommendations cho Identity Service V2

### 5.1. Patient Registration

**Khuyến nghị:**
1. ✅ **Enable Self-Registration**: Cho phép patients tự đăng ký
2. ✅ **Email/SMS Verification**: Xác thực email và số điện thoại
3. ✅ **Simple Registration Form**: Form đơn giản, không quá nhiều fields
4. ✅ **Auto-Assign Patient Role**: Tự động assign role "patient"
5. ✅ **Optional Profile Completion**: Cho phép hoàn thiện profile sau

**Implementation Priority**: P0 (Must Have)

### 5.2. Staff Registration

**Khuyến nghị:**
1. ✅ **HR/Admin Only**: Chỉ HR hoặc Admin mới tạo được staff accounts
2. ✅ **Credential Verification**: Bắt buộc verify credentials cho medical staff
3. ✅ **Document Upload**: Upload giấy phép hành nghề, bằng cấp
4. ✅ **Approval Workflow**: Quy trình phê duyệt trước khi activate
5. ✅ **Audit Logging**: Log đầy đủ mọi thao tác

**Implementation Priority**: P0 (Must Have)

### 5.3. Security Requirements

**Khuyến nghị:**
1. ✅ **Strong Password Policy**: Mật khẩu mạnh (8+ chars, uppercase, lowercase, number, special char)
2. ✅ **2FA for Staff**: Bắt buộc 2FA cho staff accounts
3. ✅ **Session Management**: Timeout sau 30 phút không hoạt động
4. ✅ **IP Whitelisting**: Whitelist IP cho admin accounts
5. ✅ **HIPAA Compliance**: Tuân thủ HIPAA regulations

**Implementation Priority**: P0 (Must Have)

---

## 6. Comparison với Current Implementation

### 6.1. Current Identity Service V2

**Hiện tại:**
- ✅ RegisterUserUseCase supports all role types
- ✅ Email validation
- ✅ Password hashing
- ✅ Pure RBAC implementation
- ⚠️ No self-registration endpoint
- ⚠️ No credential verification
- ⚠️ No document upload
- ⚠️ No approval workflow

### 6.2. Gap Analysis

| Feature | Required | Current Status | Priority |
|---------|----------|----------------|----------|
| Patient Self-Registration | ✅ | ❌ | P0 |
| Staff HR Registration | ✅ | ✅ (via RegisterUserUseCase) | P0 |
| Email Verification | ✅ | ❌ | P0 |
| SMS Verification | ✅ | ❌ | P1 |
| Credential Verification | ✅ | ❌ | P0 |
| Document Upload | ✅ | ❌ | P1 |
| Approval Workflow | ✅ | ❌ | P1 |
| 2FA | ✅ | ❌ | P0 |
| Session Management | ✅ | ❌ | P0 |

---

## 7. Next Steps

### 7.1. Immediate Actions (P0)

1. **Create Patient Self-Registration Endpoint**
   - POST /api/v1/auth/register/patient
   - Simple form with email, password, fullName, phoneNumber
   - Auto-assign "patient" role
   - Send verification email

2. **Create Staff Registration Endpoint (Admin Only)**
   - POST /api/v1/admin/staff/register
   - Require admin authentication
   - Support credential fields
   - Send activation email

3. **Implement Email Verification**
   - Generate verification token
   - Send verification email
   - Verify token endpoint
   - Mark email as verified

4. **Implement 2FA**
   - TOTP-based 2FA
   - QR code generation
   - Backup codes
   - Enforce for staff accounts

### 7.2. Short-term Actions (P1)

1. **SMS Verification**
2. **Document Upload Service**
3. **Approval Workflow**
4. **Credential Verification Integration**

### 7.3. Long-term Actions (P2)

1. **Self-Service Kiosk API**
2. **Biometric Authentication**
3. **SSO Integration**
4. **Mobile App Support**

---

## 8. Conclusion

Research cho thấy HMS systems có 2 nhóm user chính với quy trình registration hoàn toàn khác nhau:

1. **Patients**: Self-registration, online booking, tiện lợi, nhanh chóng
2. **Staff**: HR onboarding, credential verification, bảo mật cao, compliance

**Current Identity Service V2** đã có foundation tốt với Pure RBAC, nhưng cần bổ sung:
- Patient self-registration endpoint
- Email/SMS verification
- Credential verification
- 2FA
- Session management

**Recommendation**: Implement P0 features trước (Patient self-registration, Email verification, 2FA) để có MVP hoàn chỉnh.

---

**Prepared by**: AI Agent
**Date**: 2025-01-06
**Version**: 1.0

