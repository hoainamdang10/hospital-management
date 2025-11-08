# Tóm tắt Phân quyền Người dùng - Hệ thống Quản lý Bệnh viện

## 📊 Các loại người dùng trong hệ thống

### 1. **Patient (Bệnh nhân)** 👤
**Đăng ký:** Công khai qua trang web

**Quyền hạn:**
- ✅ Đặt lịch khám bệnh
- ✅ Xem hồ sơ bệnh án cá nhân
- ✅ Xem lịch sử khám bệnh
- ✅ Xem đơn thuốc
- ✅ Thanh toán viện phí
- ✅ Cập nhật thông tin cá nhân
- ✅ Quản lý liên hệ khẩn cấp
- ✅ Xem kết quả xét nghiệm

**Không được phép:**
- ❌ Truy cập hồ sơ bệnh nhân khác
- ❌ Tạo/sửa đơn thuốc
- ❌ Truy cập dashboard admin

---

### 2. **Doctor (Bác sĩ)** 👨‍⚕️
**Đăng ký:** Admin tạo tài khoản → Gửi email kích hoạt

**Quyền hạn:**
- ✅ Xem danh sách bệnh nhân được phân công
- ✅ Xem hồ sơ bệnh án chi tiết
- ✅ Viết/cập nhật hồ sơ khám bệnh
- ✅ Kê đơn thuốc
- ✅ Yêu cầu xét nghiệm
- ✅ Xem lịch hẹn của mình
- ✅ Quản lý hàng đợi khám bệnh
- ✅ Xem thống kê cá nhân
- ✅ Cập nhật lịch làm việc

**Không được phép:**
- ❌ Tạo tài khoản người dùng khác
- ❌ Xem dữ liệu tài chính
- ❌ Quản lý hệ thống
- ❌ Xóa hồ sơ bệnh án

---

### 3. **Admin (Quản trị viên)** 👔
**Đăng ký:** Super Admin tạo tài khoản

**Quyền hạn:**
- ✅ **Quản lý người dùng:**
  - Tạo tài khoản staff (Doctor, Admin, Receptionist)
  - Gửi email mời kích hoạt
  - Kích hoạt/vô hiệu hóa tài khoản
  - Phân quyền
  
- ✅ **Quản lý hệ thống:**
  - Xem tất cả báo cáo
  - Quản lý phòng ban
  - Cấu hình hệ thống
  - Xem logs
  
- ✅ **Quản lý dữ liệu:**
  - Xem tất cả hồ sơ bệnh án (với audit log)
  - Backup/restore dữ liệu
  - Export báo cáo
  
- ✅ **Quản lý tài chính:**
  - Xem doanh thu
  - Quản lý giá dịch vụ
  - Xem báo cáo tài chính

**Không được phép:**
- ❌ Khám bệnh
- ❌ Kê đơn thuốc (không phải bác sĩ)

---

### 4. **Receptionist (Lễ tân)** 📋
**Đăng ký:** Admin tạo tài khoản → Gửi email kích hoạt

**Quyền hạn:**
- ✅ Check-in bệnh nhân
- ✅ Xác nhận lịch hẹn
- ✅ Tạo lịch hẹn cho bệnh nhân
- ✅ Quản lý hàng đợi
- ✅ Xem thông tin cơ bản bệnh nhân
- ✅ In phiếu khám
- ✅ Thu tiền (nếu được cấu hình)
- ✅ Hỗ trợ bệnh nhân

**Không được phép:**
- ❌ Xem hồ sơ bệnh án chi tiết
- ❌ Kê đơn thuốc
- ❌ Tạo tài khoản người dùng
- ❌ Xem báo cáo tài chính
- ❌ Cấu hình hệ thống

---

## 🔐 Ma trận phân quyền

| Chức năng | Patient | Doctor | Admin | Receptionist |
|-----------|---------|--------|-------|--------------|
| **Quản lý tài khoản cá nhân** |
| Đăng ký tài khoản | ✅ | ❌ | ❌ | ❌ |
| Cập nhật thông tin | ✅ | ✅ | ✅ | ✅ |
| Đổi mật khẩu | ✅ | ✅ | ✅ | ✅ |
| **Lịch hẹn** |
| Đặt lịch hẹn | ✅ | ❌ | ✅ | ✅ |
| Xem lịch hẹn của mình | ✅ | ✅ | ✅ | ✅ |
| Xem tất cả lịch hẹn | ❌ | ❌ | ✅ | ✅ |
| Hủy lịch hẹn | ✅ | ❌ | ✅ | ✅ |
| **Hồ sơ bệnh án** |
| Xem hồ sơ của mình | ✅ | ❌ | ✅ | ❌ |
| Xem hồ sơ bệnh nhân | ❌ | ✅ | ✅ | ❌ |
| Viết hồ sơ khám bệnh | ❌ | ✅ | ❌ | ❌ |
| Kê đơn thuốc | ❌ | ✅ | ❌ | ❌ |
| **Quản lý người dùng** |
| Tạo tài khoản staff | ❌ | ❌ | ✅ | ❌ |
| Kích hoạt/vô hiệu hóa | ❌ | ❌ | ✅ | ❌ |
| Phân quyền | ❌ | ❌ | ✅ | ❌ |
| **Báo cáo & Thống kê** |
| Xem thống kê cá nhân | ✅ | ✅ | ✅ | ✅ |
| Xem báo cáo hệ thống | ❌ | ❌ | ✅ | ❌ |
| Xem báo cáo tài chính | ❌ | ❌ | ✅ | ❌ |
| **Thanh toán** |
| Thanh toán viện phí | ✅ | ❌ | ✅ | ✅ |
| Xem lịch sử thanh toán | ✅ | ❌ | ✅ | ❌ |
| **Check-in** |
| Check-in | ❌ | ❌ | ✅ | ✅ |
| Quản lý hàng đợi | ❌ | ✅ | ✅ | ✅ |

---

## 📁 Cấu trúc Routes

### Public Routes (Không cần đăng nhập)
```
/                    - Trang chủ
/login               - Đăng nhập
/register            - Đăng ký (chỉ cho Patient)
/staff/activate      - Kích hoạt tài khoản staff
/doctors             - Danh sách bác sĩ công khai
/services            - Dịch vụ
/about               - Giới thiệu
/contact             - Liên hệ
```

### Patient Routes
```
/patient/dashboard           - Dashboard bệnh nhân
/patient/appointments        - Quản lý lịch hẹn
/patient/appointments/book   - Đặt lịch mới
/patient/medical-history     - Hồ sơ bệnh án
/patient/prescriptions       - Đơn thuốc
/patient/billing             - Thanh toán
/patient/profile             - Thông tin cá nhân
```

### Doctor Routes
```
/doctor/dashboard            - Dashboard bác sĩ
/doctor/appointments         - Lịch hẹn
/doctor/queue                - Hàng đợi khám
/doctor/examination/:id      - Khám bệnh
/doctor/medical-records      - Hồ sơ bệnh án
/doctor/prescriptions        - Đơn thuốc
/doctor/schedule             - Lịch làm việc
/doctor/statistics           - Thống kê
/doctor/profile              - Thông tin cá nhân
```

### Admin Routes
```
/admin/dashboard             - Dashboard admin
/admin/staff                 - Quản lý nhân viên
/admin/staff/add             - Thêm nhân viên
/admin/patients              - Quản lý bệnh nhân
/admin/appointments          - Quản lý lịch hẹn
/admin/departments           - Quản lý phòng ban
/admin/reports               - Báo cáo
/admin/settings              - Cấu hình hệ thống
/admin/users                 - Quản lý người dùng
```

### Receptionist Routes
```
/receptionist/dashboard      - Dashboard lễ tân
/receptionist/check-in       - Check-in bệnh nhân
/receptionist/appointments   - Quản lý lịch hẹn
/receptionist/queue          - Hàng đợi
/receptionist/patients       - Danh sách bệnh nhân
```

---

## 🔄 Luồng đăng ký & kích hoạt

### Patient (Tự đăng ký)
```
1. Truy cập /register
2. Điền form đăng ký
3. Xác thực email
4. Đăng nhập
```

### Staff (Admin tạo)
```
1. Admin vào /admin/staff/add
2. Chọn loại staff (Doctor/Admin/Receptionist)
3. Điền thông tin
4. Chọn "Gửi email mời kích hoạt"
5. Hệ thống tạo account (status: pending_activation)
6. Gửi email với link kích hoạt
7. Staff click link → /staff/activate?token=xxx
8. Đặt mật khẩu
9. Account active → Đăng nhập
```

---

## 🛡️ Middleware & Guards

### Authentication Middleware
```typescript
// Kiểm tra user đã đăng nhập chưa
requireAuth()

// Kiểm tra role cụ thể
requireRole(['admin'])
requireRole(['doctor', 'admin'])

// Kiểm tra quyền cụ thể
requirePermission('view_medical_records')
```

### Route Guards
```typescript
// Patient routes
if (!isAuthenticated || role !== 'patient') redirect('/login')

// Doctor routes
if (!isAuthenticated || role !== 'doctor') redirect('/login')

// Admin routes
if (!isAuthenticated || role !== 'admin') redirect('/login')

// Receptionist routes
if (!isAuthenticated || role !== 'receptionist') redirect('/login')
```

---

## 📊 Database Schema

### Bảng: auth_schema.user_profiles
```sql
CREATE TABLE auth_schema.user_profiles (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('patient', 'doctor', 'admin', 'receptionist')),
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Bảng: provider_schema.staff_profiles
```sql
CREATE TABLE provider_schema.staff_profiles (
  id UUID PRIMARY KEY,
  staff_id VARCHAR UNIQUE,
  user_id UUID REFERENCES auth_schema.user_profiles(id),
  staff_type VARCHAR CHECK (staff_type IN ('doctor', 'admin', 'receptionist')),
  activation_status VARCHAR DEFAULT 'pending_activation',
  activated_at TIMESTAMP,
  -- ... other fields
);
```

---

## ✅ Checklist Implementation

### Phase 1: Core Features (MVP)
- [x] Patient registration
- [x] Staff invitation flow
- [x] Email activation
- [x] Role-based routing
- [ ] Basic authentication
- [ ] Permission middleware

### Phase 2: Staff Management
- [x] Create staff accounts (Doctor, Admin, Receptionist)
- [x] Send invitation emails
- [x] Activation page
- [ ] Staff list page with filters
- [ ] Edit staff info
- [ ] Deactivate staff

### Phase 3: Advanced Features
- [ ] Audit logging
- [ ] Session management
- [ ] 2FA (optional)
- [ ] Password reset
- [ ] Account lockout
- [ ] IP whitelisting (admin only)

---

## 🎯 Best Practices

1. **Principle of Least Privilege:** Chỉ cấp quyền tối thiểu cần thiết
2. **Audit Logging:** Log tất cả actions quan trọng (xem hồ sơ, sửa dữ liệu)
3. **Session Management:** Timeout sau 30 phút không hoạt động
4. **Password Policy:** Tối thiểu 8 ký tự, có chữ hoa, số, ký tự đặc biệt
5. **Email Verification:** Bắt buộc xác thực email trước khi sử dụng
6. **Rate Limiting:** Giới hạn số lần đăng nhập sai
7. **HTTPS Only:** Bắt buộc HTTPS cho production
8. **CORS Policy:** Chỉ cho phép frontend domain

---

## 📝 Notes

- **Patient** là loại user duy nhất có thể tự đăng ký
- **Staff** (Doctor, Admin, Receptionist) chỉ được Admin tạo
- Mỗi staff phải kích hoạt tài khoản qua email trước khi sử dụng
- Admin có quyền cao nhất nhưng không thể khám bệnh
- Doctor chỉ xem được hồ sơ bệnh nhân được phân công
- Receptionist chỉ xem thông tin cơ bản, không xem hồ sơ chi tiết
