# 📋 TÀI LIỆU API & LUỒNG NGHIỆP VỤ
## Hệ Thống Đặt Lịch Khám Online & Thanh Toán Trước (Prepaid)

> **Tác giả:** [Tên sinh viên]  
> **Ngày cập nhật:** 06/12/2024  
> **Phiên bản:** 1.0

---

## MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc API](#2-kiến-trúc-api)
3. [Tổng Hợp API Theo Role](#3-tổng-hợp-api-theo-role)
4. [Các Luồng Nghiệp Vụ Chính](#4-các-luồng-nghiệp-vụ-chính)
5. [Chi Tiết API Theo Module](#5-chi-tiết-api-theo-module)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mô Tả Hệ Thống

Hệ thống quản lý bệnh viện với mô hình **đặt lịch khám online** và **thanh toán trước (prepaid)**, bao gồm 3 role chính:

| Role | Mô tả | Chức năng chính |
|------|-------|-----------------|
| **Patient** | Bệnh nhân | Đặt lịch khám, thanh toán, chat với bác sĩ |
| **Doctor** | Bác sĩ | Xem lịch khám, khám bệnh, tư vấn bệnh nhân |
| **Admin** | Quản trị viên | Quản lý nhân viên, khoa, lịch hẹn, báo cáo |

### 1.2 Công Nghệ Sử Dụng

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Framer Motion |
| Backend | NestJS, Microservices Architecture |
| Database | Supabase (PostgreSQL), Row Level Security |
| Payment | VNPay (Cổng thanh toán Việt Nam) |
| Realtime | Supabase Realtime (WebSocket) |
| Authentication | JWT, Session-based, HTTP-only Cookies |

### 1.3 Kiến Trúc Microservices

```
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                             │
│                     (Port 4000 - NestJS)                        │
├─────────────────────────────────────────────────────────────────┤
│                              │                                  │
│    ┌─────────────────────────┼─────────────────────────┐        │
│    │                         │                         │        │
│    ▼                         ▼                         ▼        │
│ ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│ │  Identity    │    │ Appointment  │    │   Billing    │       │
│ │  Service     │    │   Service    │    │   Service    │       │
│ │  (Port 3001) │    │  (Port 3002) │    │  (Port 3004) │       │
│ └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                 │
│ ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│ │   Patient    │    │    Staff     │    │    Chat      │       │
│ │   Service    │    │   Service    │    │   Service    │       │
│ │  (Port 3006) │    │  (Port 3003) │    │  (Port 3005) │       │
│ └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. KIẾN TRÚC API

### 2.1 Base URL

```
Production:  https://api.example.com/api
Development: http://localhost:4000/api
```

### 2.2 Authentication

Hệ thống sử dụng **Session-based Authentication** với HTTP-only Cookies:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "********"
}

Response:
Set-Cookie: session=<jwt_token>; HttpOnly; Secure; SameSite=Strict
```

### 2.3 Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Thành công"
}
```

### 2.4 Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [ ... ]
  }
}
```

---

## 3. TỔNG HỢP API THEO ROLE

### 3.1 Tổng Quan

| Role | Số Module | Số API Endpoint | Chức năng chính |
|------|-----------|-----------------|-----------------|
| **Patient** | 7 | ~37 | Đặt lịch, thanh toán, quản lý hồ sơ |
| **Doctor** | 4 | ~16 | Khám bệnh, xem lịch, chat |
| **Admin** | 6 | ~44 | Quản lý toàn bộ hệ thống |
| **Shared** | 1 | ~11 | Xác thực, phân quyền |
| **Tổng** | | **~97** | |

---

### 3.2 API Endpoints - PATIENT Role

#### Bảng 3.2.1: Tổng hợp API cho Patient

| Module | Số API | Chức năng chính |
|--------|--------|-----------------|
| Appointment | 7 | Đặt lịch, xem lịch, hủy/đổi lịch |
| Billing | 7 | Xem hóa đơn, thanh toán VNPay |
| Wallet | 3 | Ví điện tử, nạp tiền, xem số dư |
| Profile | 5 | Xem/cập nhật hồ sơ cá nhân |
| Insurance | 4 | Quản lý thông tin bảo hiểm |
| Emergency Contact | 5 | Quản lý liên hệ khẩn cấp |
| Consent | 4 | Quản lý chấp thuận |
| Chat | 3 | Nhắn tin realtime với bác sĩ |
| **Tổng** | **~38** | |

#### Bảng 3.2.2: Chi tiết API Appointment (Patient)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/v1/appointments/book` | Đặt lịch khám mới |
| GET | `/v1/appointments` | Danh sách lịch hẹn của tôi |
| GET | `/v1/appointments/:id` | Chi tiết lịch hẹn |
| POST | `/v1/appointments/:id/cancel` | Hủy lịch hẹn |
| POST | `/v1/appointments/:id/reschedule` | Đổi lịch hẹn |
| GET | `/v1/appointments/providers/:id/available-slots` | Lấy slot trống của bác sĩ |
| GET | `/v1/appointments/providers/:id/schedule` | Lịch làm việc bác sĩ |

#### Bảng 3.2.3: Chi tiết API Billing (Patient)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/billing/invoices/patient/:patientId` | Danh sách hóa đơn |
| GET | `/v1/billing/invoices/patient/:patientId/summary` | Tổng quan thanh toán |
| GET | `/v1/billing/invoices/:id` | Chi tiết hóa đơn |
| POST | `/v1/billing/invoices/:id/vnpay/payment-link` | Tạo link thanh toán VNPay |
| POST | `/v1/billing/invoices/:id/payments` | Xử lý thanh toán |
| POST | `/v1/billing/invoices/:id/payments/wallet` | Thanh toán bằng ví |
| GET | `/v1/billing/invoices/:id/download` | Tải hóa đơn PDF |

#### Bảng 3.2.4: Chi tiết API Wallet (Patient)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/billing/wallet/:patientId` | Xem số dư ví |
| POST | `/v1/billing/wallet/:patientId/top-up/link` | Tạo link nạp tiền VNPay |
| POST | `/v1/billing/wallet/:patientId/top-up` | Nạp tiền trực tiếp (Admin) |

---


### 3.3 API Endpoints - DOCTOR Role

#### Bảng 3.3.1: Tổng hợp API cho Doctor

| Module | Số API | Chức năng chính |
|--------|--------|-----------------|
| Appointment | 6 | Xem lịch, check-in, bắt đầu/hoàn thành khám |
| Profile | 3 | Cập nhật hồ sơ, lịch làm việc |
| Patient | 1 | Xem thông tin bệnh nhân |
| Chat | 3 | Nhắn tin với bệnh nhân |
| **Tổng** | **~13** | |

#### Bảng 3.3.2: Chi tiết API Appointment (Doctor)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/doctors/:doctorId/appointments` | Lịch hẹn của bác sĩ |
| GET | `/v1/appointments/:id` | Chi tiết lịch hẹn |
| POST | `/v1/appointments/:id/complete` | Hoàn thành khám |
| POST | `/v1/appointments/:id/cancel` | Hủy lịch hẹn |

#### Bảng 3.3.3: Chi tiết API Profile (Doctor)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/staff/user/:userId` | Lấy thông tin bác sĩ |
| PUT | `/v1/staff/me` | Cập nhật hồ sơ cá nhân |
| PUT | `/v1/staff/me/schedule` | Cập nhật lịch làm việc |

---

### 3.4 API Endpoints - ADMIN Role

#### Bảng 3.4.1: Tổng hợp API cho Admin

| Module | Số API | Chức năng chính |
|--------|--------|-----------------|
| Staff Management | 7 | CRUD nhân viên, bác sĩ, đình chỉ/kích hoạt |
| Department | 10 | CRUD khoa, phân công nhân viên, đặt trưởng khoa |
| Patient | 2 | Xem, tìm kiếm bệnh nhân |
| Appointment | 6 | Quản lý lịch hẹn, xác nhận, hủy |
| Billing | 3 | Hóa đơn, báo cáo doanh thu |
| Account | 8 | Mời nhân viên, khóa/mở tài khoản |
| **Tổng** | **~36** | |

#### Bảng 3.4.2: Chi tiết API Staff Management (Admin)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/staff/search` | Tìm kiếm nhân viên |
| GET | `/v1/staff/:staffId` | Chi tiết nhân viên |
| POST | `/v1/staff` | Tạo hồ sơ nhân viên |
| PUT | `/v1/staff/:staffId` | Cập nhật nhân viên |
| POST | `/v1/staff/:staffId/suspend` | Đình chỉ nhân viên |
| POST | `/v1/staff/:staffId/reactivate` | Kích hoạt lại nhân viên |
| POST | `/v1/staff/:staffId/departments` | Gán khoa cho nhân viên |

#### Bảng 3.4.3: Chi tiết API Department (Admin)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/departments` | Danh sách khoa |
| GET | `/v1/departments/:id` | Chi tiết khoa |
| GET | `/v1/departments/code/:code` | Lấy khoa theo mã |
| POST | `/v1/departments` | Tạo khoa mới |
| PUT | `/v1/departments/:id` | Cập nhật khoa |
| DELETE | `/v1/departments/:id` | Xóa khoa |
| GET | `/v1/departments/:id/staff` | Nhân viên trong khoa |
| POST | `/v1/departments/:id/staff` | Thêm nhân viên vào khoa |
| DELETE | `/v1/departments/:id/staff/:staffId` | Xóa nhân viên khỏi khoa |
| PUT | `/v1/departments/:id/head` | Đặt trưởng khoa |

#### Bảng 3.4.4: Chi tiết API Appointment (Admin)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/appointments` | Danh sách tất cả lịch hẹn |
| GET | `/v1/appointments/:id` | Chi tiết lịch hẹn |
| POST | `/v1/appointments/:id/confirm` | Xác nhận lịch hẹn |
| POST | `/v1/appointments/:id/cancel` | Hủy lịch hẹn |
| POST | `/v1/appointments/:id/reschedule` | Đổi lịch hẹn |
| POST | `/v1/appointments/:id/complete` | Hoàn thành lịch hẹn |

#### Bảng 3.4.5: Chi tiết API Billing (Admin)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/billing/invoices/search` | Tìm kiếm hóa đơn |
| GET | `/v1/billing/invoices/:id` | Chi tiết hóa đơn |
| GET | `/v1/billing/invoices/reports/revenue` | Báo cáo doanh thu |

#### Bảng 3.4.6: Chi tiết API Account Management (Admin)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/admin/staff/register` | Mời nhân viên/bác sĩ mới |
| GET | `/admin/staff/invitations` | Danh sách lời mời |
| GET | `/admin/staff/invitations/:id` | Chi tiết lời mời |
| DELETE | `/admin/staff/invitations/:id` | Hủy lời mời |
| POST | `/admin/staff/invitations/:id/resend` | Gửi lại lời mời |
| POST | `/admin/accounts/deactivate` | Vô hiệu hóa tài khoản |
| POST | `/admin/accounts/reactivate` | Kích hoạt lại tài khoản |
| POST | `/admin/accounts/unlock` | Mở khóa tài khoản |

---



### 3.5 API Endpoints - SHARED (Authentication)

#### Bảng 3.5.1: Chi tiết API Authentication

| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| POST | `/auth/login` | Đăng nhập | All |
| POST | `/auth/register` | Đăng ký (Patient) | Guest |
| GET | `/auth/me` | Lấy user hiện tại | All |
| POST | `/auth/refresh` | Làm mới token | All |
| POST | `/auth/logout` | Đăng xuất | All |
| GET | `/auth/verify-email` | Xác thực email | Guest |
| POST | `/auth/forgot-password` | Quên mật khẩu | Guest |
| POST | `/auth/reset-password` | Đặt lại mật khẩu | Guest |
| POST | `/v1/users/:userId/change-password` | Đổi mật khẩu | All |
| GET | `/auth/validate-invitation` | Xác thực lời mời | Guest |
| POST | `/auth/activate-staff` | Kích hoạt tài khoản nhân viên | Guest |

---

## 4. CÁC LUỒNG NGHIỆP VỤ CHÍNH

### 4.1 Tổng Quan Các Luồng

| # | Tên Luồng | Actor | Độ Quan Trọng | Mô tả |
|---|-----------|-------|---------------|-------|
| 1 | Đặt lịch khám Online | Patient | ⭐⭐⭐ | Luồng core của hệ thống |
| 2 | Thanh toán Prepaid | Patient | ⭐⭐⭐ | Tích hợp VNPay |
| 3 | Xác thực & Phân quyền | All | ⭐⭐⭐ | Nền tảng bảo mật |
| 4 | Quy trình khám bệnh | Doctor | ⭐⭐⭐ | Workflow khám bệnh |
| 5 | Chat Realtime | Doctor, Patient | ⭐⭐ | Tư vấn trực tuyến |
| 6 | Quản lý nhân viên | Admin | ⭐⭐ | Mời và quản lý staff |

---

### 4.2 LUỒNG 1: ĐẶT LỊCH KHÁM ONLINE

#### 4.2.1 Mô tả
Bệnh nhân đặt lịch khám trực tuyến, chọn khoa, bác sĩ, ngày giờ khám.

#### 4.2.2 Actor
- **Primary:** Patient (Bệnh nhân)
- **Supporting:** System

#### 4.2.3 Preconditions
- Bệnh nhân đã đăng ký và đăng nhập
- Có bác sĩ trong hệ thống với lịch làm việc

#### 4.2.4 Main Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ĐẶT LỊCH KHÁM ONLINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PATIENT                    SYSTEM                      DATABASE        │
│     │                          │                            │           │
│     │ 1. Chọn Khoa             │                            │           │
│     ├─────────────────────────>│ GET /v1/departments        │           │
│     │                          ├───────────────────────────>│           │
│     │<─────────────────────────│ Danh sách khoa             │           │
│     │                          │                            │           │
│     │ 2. Chọn Bác sĩ           │                            │           │
│     ├─────────────────────────>│ GET /v1/staff/search       │           │
│     │                          │ ?departmentId=xxx          │           │
│     │                          │ &staffType=doctor          │           │
│     │                          ├───────────────────────────>│           │
│     │<─────────────────────────│ Danh sách bác sĩ           │           │
│     │                          │                            │           │
│     │ 3. Chọn Ngày & Slot      │                            │           │
│     ├─────────────────────────>│ GET /v1/appointments/      │           │
│     │                          │ providers/:id/available-slots          │
│     │                          ├───────────────────────────>│           │
│     │<─────────────────────────│ Các khung giờ trống        │           │
│     │                          │                            │           │
│     │ 4. Nhập lý do khám       │                            │           │
│     │    & Xác nhận            │                            │           │
│     ├─────────────────────────>│ POST /v1/appointments/book │           │
│     │                          ├───────────────────────────>│           │
│     │                          │    INSERT Appointment      │           │
│     │                          │    (status: PENDING)       │           │
│     │                          │    INSERT Invoice          │           │
│     │                          │    (status: PENDING)       │           │
│     │<─────────────────────────│ Appointment + Invoice ID   │           │
│     │                          │                            │           │
│     │     ══════════> CHUYỂN SANG LUỒNG THANH TOÁN ══════════>          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.5 API Sequence

| Step | Method | Endpoint | Request | Response |
|------|--------|----------|---------|----------|
| 1 | GET | `/v1/departments` | - | `{ departments: [...] }` |
| 2 | GET | `/v1/staff/search` | `?departmentId=xxx&staffType=doctor` | `{ items: [...] }` |
| 3 | GET | `/v1/appointments/providers/:id/available-slots` | `?date=2024-12-07` | `{ availableSlots: [...] }` |
| 4 | POST | `/v1/appointments/book` | `{ doctorId, date, time, reason }` | `{ appointmentId, invoiceId }` |

#### 4.2.6 Postconditions
- Lịch hẹn được tạo với status `PENDING`
- Hóa đơn được tạo với status `PENDING`
- Chuyển đến trang thanh toán

---

### 4.3 LUỒNG 2: THANH TOÁN PREPAID (VNPay)

#### 4.3.1 Mô tả
Bệnh nhân thanh toán trước (prepaid) qua cổng VNPay để xác nhận lịch hẹn.

#### 4.3.2 Actor
- **Primary:** Patient
- **External:** VNPay Gateway

#### 4.3.3 Preconditions
- Lịch hẹn đã được tạo (status: PENDING)
- Hóa đơn đã được tạo (status: PENDING)

#### 4.3.4 Main Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THANH TOÁN PREPAID (VNPay)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PATIENT           SYSTEM              VNPay            DATABASE        │
│     │                 │                   │                 │           │
│     │ 1. Xem hóa đơn  │                   │                 │           │
│     ├────────────────>│ GET /invoices/:id │                 │           │
│     │<────────────────│ Chi tiết hóa đơn  │                 │           │
│     │                 │                   │                 │           │
│     │ 2. Chọn VNPay   │                   │                 │           │
│     ├────────────────>│ POST /invoices/:id│                 │           │
│     │                 │ /VNPay/payment-link                 │           │
│     │                 ├──────────────────>│                 │           │
│     │                 │<──────────────────│ checkoutUrl,    │           │
│     │                 │                   │ qrCode          │           │
│     │<────────────────│ QR Code / Link    │                 │           │
│     │                 │                   │                 │           │
│     │ 3. Quét QR /    │                   │                 │           │
│     │    Click Link   │                   │                 │           │
│     ├─────────────────────────────────────>│                │           │
│     │                 │                   │                 │           │
│     │ 4. Thanh toán   │                   │                 │           │
│     │    trên VNPay   │                   │                 │           │
│     │                 │                   │                 │           │
│     │                 │ 5. Webhook        │                 │           │
│     │                 │<──────────────────│ Payment success │           │
│     │                 │                   │                 │           │
│     │                 │ 6. Cập nhật       │                 │           │
│     │                 ├────────────────────────────────────>│           │
│     │                 │       Invoice.status = 'PAID'       │           │
│     │                 │       Appointment.status = 'CONFIRMED'          │
│     │                 │                   │                 │           │
│     │<────────────────│ 7. Redirect       │                 │           │
│     │                 │    Success Page   │                 │           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.3.5 Webhook Handling

```json
// VNPay Webhook Payload
{
  "code": "00",
  "desc": "success",
  "data": {
    "orderCode": 123456,
    "amount": 300000,
    "accountNumber": "...",
    "transactionDateTime": "2024-12-06T10:30:00"
  },
  "signature": "..."
}
```

#### 4.3.6 Postconditions
- Hóa đơn chuyển sang status `PAID`
- Lịch hẹn chuyển sang status `CONFIRMED`
- Email xác nhận được gửi đến bệnh nhân

---

### 4.4 LUỒNG 3: XÁC THỰC & PHÂN QUYỀN

#### 4.4.1 Mô tả
Người dùng đăng nhập và được phân quyền theo role (PATIENT, DOCTOR, ADMIN).

#### 4.4.2 Main Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     XÁC THỰC & PHÂN QUYỀN (RBAC)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  USER                 API GATEWAY           IDENTITY SERVICE            │
│    │                       │                        │                   │
│    │ 1. POST /auth/login   │                        │                   │
│    │    {email, password}  │                        │                   │
│    ├──────────────────────>│                        │                   │
│    │                       ├───────────────────────>│                   │
│    │                       │         Verify creds   │                   │
│    │                       │<───────────────────────│                   │
│    │                       │   {user, tokens}       │                   │
│    │                       │                        │                   │
│    │<──────────────────────│                        │                   │
│    │  Set-Cookie: session  │                        │                   │
│    │  {user: {...}}        │                        │                   │
│    │                       │                        │                   │
│    │ 2. Redirect by Role   │                        │                   │
│    │                       │                        │                   │
│    │  ┌────────────────────────────────────────┐    │                   │
│    │  │ if role == 'PATIENT' → /patient/dashboard   │                   │
│    │  │ if role == 'DOCTOR'  → /doctor/dashboard    │                   │
│    │  │ if role == 'ADMIN'   → /admin/dashboard     │                   │
│    │  └────────────────────────────────────────┘    │                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.3 Role-based Access Control (RBAC)

| Route Pattern | PATIENT | DOCTOR | ADMIN |
|---------------|---------|--------|-------|
| `/patient/*` | ✅ | ❌ | ❌ |
| `/doctor/*` | ❌ | ✅ | ❌ |
| `/admin/*` | ❌ | ❌ | ✅ |
| `/auth/*` | ✅ | ✅ | ✅ |

---

### 4.5 LUỒNG 4: QUY TRÌNH KHÁM BỆNH (SIMPLIFIED PREPAID MODEL)

#### 4.5.1 Mô tả
Với mô hình **Prepaid (thanh toán trước)**, quy trình khám bệnh được **tự động hóa tối đa**:
- Bệnh nhân thanh toán → Lịch hẹn tự động **CONFIRMED**
- Bác sĩ **KHÔNG CẦN** check-in hoặc start thủ công
- Sau 30 phút từ giờ hẹn → Cronjob tự động đánh dấu **COMPLETED**

#### 4.5.2 Status Flow (Simplified)

```
┌──────────┐         ┌───────────┐                    ┌───────────┐
│ PENDING  │────────>│ CONFIRMED │───────────────────>│ COMPLETED │
└──────────┘         └───────────┘                    └───────────┘
     │                     │                               │
     │                     │                               │
  (Chờ thanh          (Đã thanh toán             (Cronjob tự động
   toán)               = Auto-confirm)            sau 30 phút)

     │                     │
     ▼                     ▼
┌───────────┐        ┌───────────┐
│ CANCELLED │        │ CANCELLED │
└───────────┘        └───────────┘
 (Hết hạn             (Bệnh nhân/Admin
  thanh toán)          hủy lịch)
```

#### 4.5.3 Điểm Khác Biệt So Với Mô Hình Truyền Thống

| Mô hình truyền thống | Mô hình Prepaid (Hiện tại) |
|---------------------|---------------------------|
| Đặt lịch → Check-in tại quầy → Thanh toán → Khám | Đặt lịch → Thanh toán online → Khám |
| Bác sĩ click "Bắt đầu khám" | Không cần thao tác |
| Bác sĩ click "Hoàn thành" | Cronjob tự động sau 30p |
| 5 bước thủ công | 2 bước tự động |

#### 4.5.4 Main Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│              QUY TRÌNH KHÁM BỆNH (PREPAID - AUTOMATED)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PATIENT          SYSTEM           DOCTOR           CRONJOB             │
│     │                │                │                │                │
│     │ 1. Đặt lịch    │                │                │                │
│     ├───────────────>│                │                │                │
│     │                │ status=PENDING │                │                │
│     │                │                │                │                │
│     │ 2. Thanh toán  │                │                │                │
│     ├───────────────>│                │                │                │
│     │                │ status=CONFIRMED (Auto)         │                │
│     │<───────────────│                │                │                │
│     │  "Đặt lịch     │                │                │                │
│     │   thành công!" │                │                │                │
│     │                │                │                │                │
│     │                │ 3. Xem lịch    │                │                │
│     │                │<───────────────┤                │                │
│     │                │  Lịch hẹn hôm nay               │                │
│     │                ├───────────────>│                │                │
│     │                │                │                │                │
│     │    ┌─────────────────────────────────────────┐   │                │
│     │    │    4. BUỔI KHÁM (Chat Realtime)         │   │                │
│     │    │    - Bác sĩ tư vấn qua chat             │   │                │
│     │    │    - Bệnh nhân hỏi đáp                  │   │                │
│     │    │    - Thời lượng: ~30 phút               │   │                │
│     │    └─────────────────────────────────────────┘   │                │
│     │                │                │                │                │
│     │                │                │    5. Sau 30p  │                │
│     │                │                │<───────────────┤                │
│     │                │                │  Auto-complete │                │
│     │                │   status=COMPLETED              │                │
│     │                │                │                │                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.5.5 Cronjob Auto-Complete

```javascript
// Chạy mỗi 5 phút
@Cron('*/5 * * * *')
async autoCompleteAppointments() {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  
  // Tìm các appointment CONFIRMED có giờ bắt đầu >= 30 phút trước
  const appointments = await this.appointmentRepo.find({
    where: {
      status: 'CONFIRMED',
      appointmentDateTime: LessThanOrEqual(thirtyMinutesAgo)
    }
  });
  
  // Tự động chuyển sang COMPLETED
  for (const apt of appointments) {
    apt.status = 'COMPLETED';
    apt.completedAt = now;
    await this.appointmentRepo.save(apt);
  }
}
```

#### 4.5.6 API Thực Tế Sử Dụng (Simplified)

| Actor | Method | Endpoint | Mục đích |
|-------|--------|----------|----------|
| Doctor | GET | `/v1/doctors/:id/appointments` | Xem lịch hẹn CONFIRMED |
| Doctor | GET | `/v1/appointments/:id` | Xem chi tiết bệnh nhân |
| Doctor/Patient | GET | `/v1/chat/conversations` | Chat realtime |
| System | - | Cronjob | Tự động COMPLETED sau 30p |

> **Lưu ý:** Các API `check-in`, `start`, `complete` vẫn tồn tại trong backend nhưng **không cần thiết** trong mô hình Prepaid hiện tại.

---

### 4.6 LUỒNG 5: CHAT REALTIME

#### 4.6.1 Mô tả
Bác sĩ và bệnh nhân trao đổi thông tin qua chat realtime trong buổi khám.

#### 4.6.2 Technology
- **Supabase Realtime** (WebSocket)
- **Row Level Security** (RLS) để đảm bảo chỉ 2 bên liên quan mới xem được tin nhắn

#### 4.6.3 Main Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CHAT REALTIME BÁC SĨ - BỆNH NHÂN                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PATIENT                SUPABASE REALTIME              DOCTOR           │
│     │                          │                          │             │
│     │  1. Subscribe            │                          │             │
│     ├─────────────────────────>│<─────────────────────────┤             │
│     │     to channel           │       Subscribe          │             │
│     │                          │       to channel         │             │
│     │                          │                          │             │
│     │  2. Gửi tin nhắn         │                          │             │
│     ├─────────────────────────>│                          │             │
│     │     POST /chat/messages  │                          │             │
│     │                          │  INSERT INTO messages    │             │
│     │                          │                          │             │
│     │                          │  3. Broadcast            │             │
│     │                          ├─────────────────────────>│             │
│     │                          │     Realtime update      │             │
│     │                          │                          │             │
│     │                          │  4. Bác sĩ trả lời       │             │
│     │                          │<─────────────────────────┤             │
│     │                          │  POST /chat/messages     │             │
│     │                          │                          │             │
│     │  5. Nhận tin             │                          │             │
│     │<─────────────────────────┤                          │             │
│     │     Realtime update      │                          │             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  SECURITY: Row Level Security (RLS)                                     │
│  - Chỉ patient và doctor của appointment mới truy cập được messages    │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.6.4 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/v1/chat/conversations?appointmentId=xxx` | Lấy/Tạo conversation |
| GET | `/v1/chat/conversations/:id/messages` | Lấy tin nhắn |
| POST | `/v1/chat/messages` | Gửi tin nhắn |

---

### 4.7 LUỒNG 6: QUẢN LÝ NHÂN VIÊN (Admin)

#### 4.7.1 Mô tả
Admin mời và quản lý nhân viên (bác sĩ, admin khác) vào hệ thống.

#### 4.7.2 Main Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MỜI NHÂN VIÊN MỚI                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ADMIN               SYSTEM                STAFF (New)                  │
│     │                   │                       │                       │
│     │ 1. Nhập thông tin │                       │                       │
│     │    nhân viên      │                       │                       │
│     ├──────────────────>│                       │                       │
│     │ POST /admin/staff/register                │                       │
│     │                   │                       │                       │
│     │                   │ 2. Tạo invitation     │                       │
│     │                   │    token              │                       │
│     │                   │                       │                       │
│     │<──────────────────│                       │                       │
│     │  invitationUrl    │                       │                       │
│     │                   │                       │                       │
│     │                   │ 3. Gửi email mời      │                       │
│     │                   ├──────────────────────>│                       │
│     │                   │                       │                       │
│     │                   │                       │ 4. Click link         │
│     │                   │<──────────────────────┤                       │
│     │                   │ GET /auth/validate-invitation                 │
│     │                   │                       │                       │
│     │                   │                       │ 5. Đặt mật khẩu       │
│     │                   │<──────────────────────┤                       │
│     │                   │ POST /auth/activate-staff                     │
│     │                   │                       │                       │
│     │                   │ 6. Tạo tài khoản      │                       │
│     │                   │                       │                       │
│     │                   ├──────────────────────>│                       │
│     │                   │   Welcome! Login now  │                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. CHI TIẾT API THEO MODULE

### 5.1 Mẫu Request/Response Chi Tiết

#### 5.1.1 Đặt Lịch Khám (POST /v1/appointments/book)

**Request:**
```http
POST /api/v1/appointments/book
Content-Type: application/json
Cookie: session=<jwt_token>

{
  "doctorId": "DOC-2024-001",
  "appointmentDate": "2024-12-07",
  "appointmentTime": "09:00:00",
  "durationMinutes": 30,
  "type": "CONSULTATION",
  "reason": "Khám tổng quát",
  "priority": "NORMAL"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "appointmentId": "APT-202412-00001",
    "invoiceId": "INV-202412-00001",
    "status": "PENDING",
    "appointmentDate": "2024-12-07",
    "appointmentTime": "09:00:00",
    "doctor": {
      "doctorId": "DOC-2024-001",
      "fullName": "BS. Nguyễn Văn A",
      "department": "Nội khoa"
    },
    "consultationFee": 300000
  },
  "message": "Đặt lịch thành công. Vui lòng thanh toán để xác nhận."
}
```

#### 5.1.2 Tạo Payment Link (POST /v1/billing/invoices/:id/VNPay/payment-link)

**Request:**
```http
POST /api/v1/billing/invoices/INV-202412-00001/VNPay/payment-link
Content-Type: application/json
Cookie: session=<jwt_token>

{
  "buyerName": "Nguyễn Văn B",
  "buyerEmail": "patient@example.com",
  "buyerPhone": "0901234567"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://pay.VNPay.vn/web/abc123",
    "qrCode": "data:image/png;base64,...",
    "paymentLinkId": "abc123",
    "orderCode": 123456,
    "amount": 300000
  }
}
```

---

## PHỤ LỤC A: DANH SÁCH ĐẦY ĐỦ API ENDPOINTS

### A.1 Identity Service (11 endpoints)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | POST | `/auth/login` | Đăng nhập |
| 2 | POST | `/auth/register` | Đăng ký bệnh nhân |
| 3 | GET | `/auth/me` | Lấy user hiện tại |
| 4 | POST | `/auth/refresh` | Làm mới token |
| 5 | POST | `/auth/logout` | Đăng xuất |
| 6 | GET | `/auth/verify-email` | Xác thực email |
| 7 | POST | `/auth/forgot-password` | Quên mật khẩu |
| 8 | POST | `/auth/reset-password` | Đặt lại mật khẩu |
| 9 | POST | `/v1/users/:userId/change-password` | Đổi mật khẩu |
| 10 | GET | `/auth/validate-invitation` | Xác thực lời mời staff |
| 11 | POST | `/auth/activate-staff` | Kích hoạt tài khoản staff |

### A.2 Appointment Service (11 endpoints - Frontend Connected)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | POST | `/v1/appointments/book` | Đặt lịch khám (Patient) |
| 2 | GET | `/v1/appointments` | Danh sách lịch hẹn |
| 3 | GET | `/v1/appointments/:id` | Chi tiết lịch hẹn |
| 4 | POST | `/v1/appointments/:id/confirm` | Xác nhận lịch hẹn |
| 5 | POST | `/v1/appointments/:id/cancel` | Hủy lịch hẹn |
| 6 | POST | `/v1/appointments/:id/reschedule` | Đổi lịch |
| 7 | POST | `/v1/appointments/:id/check-in` | Check-in |
| 8 | POST | `/v1/appointments/:id/start` | Bắt đầu khám |
| 9 | POST | `/v1/appointments/:id/complete` | Hoàn thành khám |
| 10 | GET | `/v1/appointments/providers/:id/available-slots` | Slot trống |
| 11 | GET | `/v1/appointments/providers/:id/schedule` | Lịch làm việc |

### A.3 Billing Service (8 endpoints - Frontend Connected)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/v1/billing/invoices/:id` | Chi tiết hóa đơn |
| 2 | GET | `/v1/billing/invoices/search` | Tìm kiếm hóa đơn |
| 3 | GET | `/v1/billing/invoices/patient/:patientId` | DS hóa đơn patient |
| 4 | GET | `/v1/billing/invoices/patient/:patientId/summary` | Tổng quan billing |
| 5 | POST | `/v1/billing/invoices/:id/vnpay/payment-link` | Tạo link VNPay |
| 6 | POST | `/v1/billing/invoices/:id/payments` | Xử lý thanh toán |
| 7 | POST | `/v1/billing/invoices/:id/payments/wallet` | Thanh toán ví |
| 8 | GET | `/v1/billing/invoices/reports/revenue` | Báo cáo doanh thu |

### A.4 Patient Service (18 endpoints)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/v1/patients` | Danh sách bệnh nhân |
| 2 | GET | `/v1/patients/search` | Tìm kiếm bệnh nhân |
| 3 | GET | `/v1/patients/:id` | Chi tiết bệnh nhân |
| 4 | PUT | `/v1/patients/:id` | Cập nhật hồ sơ |
| 5 | GET | `/v1/patients/user/:userId` | Lấy patient từ userId |
| 6 | GET | `/v1/patients/statistics` | Thống kê bệnh nhân |
| 7 | GET | `/v1/patients/:id/emergency-contacts` | DS liên hệ khẩn cấp |
| 8 | POST | `/v1/patients/:id/emergency-contacts` | Thêm liên hệ |
| 9 | PUT | `/v1/patients/:id/emergency-contacts/:contactId` | Cập nhật liên hệ |
| 10 | DELETE | `/v1/patients/:id/emergency-contacts/:contactId` | Xóa liên hệ |
| 11 | GET | `/v1/patients/:id/insurance` | Thông tin bảo hiểm |
| 12 | POST | `/v1/patients/:id/insurance` | Thêm bảo hiểm |
| 13 | PUT | `/v1/patients/:id/insurance` | Cập nhật bảo hiểm |
| 14 | POST | `/v1/patients/:id/insurance/verify` | Xác minh bảo hiểm |
| 15 | GET | `/v1/patients/:id/consents` | DS chấp thuận |
| 16 | POST | `/v1/patients/:id/consents` | Cấp chấp thuận |
| 17 | GET | `/v1/patients/:id/communication` | Tùy chọn liên lạc |
| 18 | PUT | `/v1/patients/:id/communication` | Cập nhật tùy chọn |

### A.5 Staff Service (10 endpoints)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/v1/staff/search` | Tìm kiếm nhân viên |
| 2 | GET | `/v1/staff/:staffId` | Chi tiết nhân viên |
| 3 | GET | `/v1/staff/user/:userId` | Lấy staff từ userId |
| 4 | POST | `/v1/staff` | Tạo hồ sơ nhân viên |
| 5 | PUT | `/v1/staff/:staffId` | Cập nhật nhân viên |
| 6 | PUT | `/v1/staff/me` | Cập nhật hồ sơ cá nhân |
| 7 | PUT | `/v1/staff/me/schedule` | Cập nhật lịch làm việc |
| 8 | POST | `/v1/staff/:staffId/suspend` | Đình chỉ nhân viên |
| 9 | POST | `/v1/staff/:staffId/reactivate` | Kích hoạt nhân viên |
| 10 | POST | `/v1/staff/:staffId/departments` | Gán khoa |

### A.6 Department Service (10 endpoints)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/v1/departments` | Danh sách khoa |
| 2 | GET | `/v1/departments/:id` | Chi tiết khoa |
| 3 | GET | `/v1/departments/code/:code` | Lấy khoa theo mã |
| 4 | POST | `/v1/departments` | Tạo khoa mới |
| 5 | PUT | `/v1/departments/:id` | Cập nhật khoa |
| 6 | DELETE | `/v1/departments/:id` | Xóa khoa |
| 7 | GET | `/v1/departments/:id/staff` | Nhân viên trong khoa |
| 8 | POST | `/v1/departments/:id/staff` | Thêm NV vào khoa |
| 9 | DELETE | `/v1/departments/:id/staff/:staffId` | Xóa NV khỏi khoa |
| 10 | PUT | `/v1/departments/:id/head` | Đặt trưởng khoa |

### A.7 Chat Service (3 endpoints)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/v1/chat/conversations` | Lấy/Tạo conversation |
| 2 | GET | `/v1/chat/conversations/:id/messages` | Lấy tin nhắn |
| 3 | POST | `/v1/chat/messages` | Gửi tin nhắn |

### A.8 Admin Account Management (8 endpoints)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | POST | `/admin/staff/register` | Mời nhân viên |
| 2 | GET | `/admin/staff/invitations` | DS lời mời |
| 3 | GET | `/admin/staff/invitations/:id` | Chi tiết lời mời |
| 4 | DELETE | `/admin/staff/invitations/:id` | Hủy lời mời |
| 5 | POST | `/admin/staff/invitations/:id/resend` | Gửi lại lời mời |
| 6 | POST | `/admin/accounts/deactivate` | Vô hiệu hóa TK |
| 7 | POST | `/admin/accounts/reactivate` | Kích hoạt lại TK |
| 8 | POST | `/admin/accounts/unlock` | Mở khóa TK |

### A.9 Wallet Service (5 endpoints)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/v1/billing/wallet/:patientId` | Xem số dư ví |
| 2 | POST | `/v1/billing/wallet/:patientId/top-up/link` | Tạo link nạp tiền VNPay |
| 3 | POST | `/v1/billing/wallet/:patientId/top-up` | Nạp tiền trực tiếp |
| 4 | POST | `/v1/billing/wallet/:patientId/charge` | Trừ tiền từ ví |
| 5 | POST | `/v1/billing/wallet/:patientId/refund` | Hoàn tiền vào ví |

---

## TỔNG KẾT

| Service | Số Endpoints |
|---------|-------------|
| Identity Service | 11 |
| Appointment Service | 11 |
| Billing Service | 8 |
| Patient Service | 18 |
| Staff Service | 10 |
| Department Service | 10 |
| Chat Service | 3 |
| Admin Account | 8 |
| Wallet Service | 5 |
| **TỔNG CỘNG** | **~84** |

---

> **Ghi chú:** Tài liệu này liệt kê các API endpoints. Cập nhật lần cuối: 06/12/2024


