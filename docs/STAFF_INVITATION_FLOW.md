# Luồng Mời và Kích hoạt Tài khoản Nhân viên Y tế

## Tổng quan

Hệ thống được thiết kế để Admin tạo tài khoản cho nhân viên y tế (bác sĩ, y tá, v.v.) và gửi email mời kích hoạt. Nhân viên sẽ nhận email, click vào link, đặt mật khẩu và kích hoạt tài khoản.

## Luồng hoạt động

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   Admin     │      │   Backend    │      │    Email    │      │    Staff     │
│  Dashboard  │      │   Service    │      │   Service   │      │   Member     │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘      └──────┬───────┘
       │                    │                     │                     │
       │ 1. Điền form       │                     │                     │
       │    thêm staff      │                     │                     │
       ├───────────────────>│                     │                     │
       │                    │                     │                     │
       │ 2. Tạo account     │                     │                     │
       │    (inactive)      │                     │                     │
       │<───────────────────┤                     │                     │
       │                    │                     │                     │
       │                    │ 3. Gửi email        │                     │
       │                    │    với token        │                     │
       │                    ├────────────────────>│                     │
       │                    │                     │                     │
       │                    │                     │ 4. Nhận email       │
       │                    │                     ├────────────────────>│
       │                    │                     │                     │
       │                    │                     │ 5. Click link       │
       │                    │                     │    kích hoạt        │
       │                    │<────────────────────┴─────────────────────┤
       │                    │                                           │
       │                    │ 6. Validate token                         │
       │                    ├──────────────────────────────────────────>│
       │                    │                                           │
       │                    │ 7. Hiển thị form                          │
       │                    │    đặt mật khẩu                           │
       │                    │<──────────────────────────────────────────┤
       │                    │                                           │
       │                    │ 8. Submit mật khẩu                        │
       │                    │<──────────────────────────────────────────┤
       │                    │                                           │
       │                    │ 9. Kích hoạt account                      │
       │                    │    (active)                               │
       │                    ├──────────────────────────────────────────>│
       │                    │                                           │
       │                    │ 10. Redirect to login                     │
       │                    │<──────────────────────────────────────────┤
       │                    │                                           │
```

## Các trang đã tạo

### 1. Trang thêm nhân viên (Admin)
**Path:** `/admin/doctors/add`
**File:** `frontend/app/admin/doctors/add/page.tsx`

**Tính năng:**
- ✅ Form nhập thông tin nhân viên đầy đủ
- ✅ Checkbox "Gửi email mời kích hoạt"
- ✅ Hiển thị hướng dẫn về cách thức hoạt động
- ✅ Loading state khi đang xử lý
- ✅ Success modal với các bước tiếp theo
- ✅ Error handling

**Các trường thông tin:**
- Thông tin cá nhân: Họ tên, Email, Số điện thoại, Ngày sinh, Giới tính, Quốc tịch, Địa chỉ
- Thông tin nghề nghiệp: Chuyên khoa, Khoa, Chức vụ, Số chứng chỉ, Kinh nghiệm, Học vấn, Ngôn ngữ, Giới thiệu

### 2. Trang kích hoạt tài khoản (Staff)
**Path:** `/staff/activate?token=xxx&email=xxx`
**File:** `frontend/app/staff/activate/page.tsx`

**Tính năng:**
- ✅ Validate token từ URL
- ✅ Hiển thị thông tin email
- ✅ Form đặt mật khẩu với show/hide
- ✅ Password strength indicator (5 levels)
- ✅ Confirm password validation
- ✅ Loading states
- ✅ Success screen với auto-redirect
- ✅ Error handling cho token invalid/expired

**Password Requirements:**
- Tối thiểu 8 ký tự
- Nên có chữ hoa, chữ thường, số và ký tự đặc biệt
- Strength score từ 0-5

### 3. Email Template
**Path:** `backend/shared/templates/staff-invitation-email.html`

**Nội dung:**
- ✅ Header với logo/branding
- ✅ Thông tin tài khoản (email, vai trò, khoa)
- ✅ Nút kích hoạt tài khoản (CTA button)
- ✅ Hướng dẫn các bước kích hoạt
- ✅ Cảnh báo về thời hạn link (24h)
- ✅ Footer với thông tin liên hệ

**Variables cần thay thế:**
- `{{fullName}}` - Tên đầy đủ
- `{{email}}` - Email
- `{{role}}` - Vai trò (Bác sĩ, Y tá, v.v.)
- `{{department}}` - Khoa
- `{{activationLink}}` - Link kích hoạt
- `{{hospitalName}}` - Tên bệnh viện
- `{{supportEmail}}` - Email hỗ trợ

## Backend API cần implement

### 1. Create Staff Account
```typescript
POST /api/v1/staff/invite
Headers: Authorization: Bearer <admin_token>

Request Body:
{
  "personalInfo": {
    "fullName": "Nguyễn Văn A",
    "email": "doctor@example.com",
    "phoneNumber": "0901234567",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "nationality": "Vietnamese",
    "address": "..."
  },
  "professionalInfo": {
    "title": "Bác sĩ",
    "department": "Tim mạch",
    "position": "doctor",
    "education": ["Đại học Y Hà Nội"],
    "languages": ["Vietnamese", "English"],
    "bio": "..."
  },
  "staffType": "doctor",
  "licenseNumber": "BS-12345",
  "yearsOfExperience": 5,
  "sendInvitationEmail": true
}

Response:
{
  "success": true,
  "message": "Tài khoản đã được tạo và email kích hoạt đã được gửi",
  "data": {
    "staffId": "STAFF-202411-001",
    "userId": "uuid",
    "email": "doctor@example.com",
    "status": "pending_activation",
    "invitationSent": true,
    "invitationExpiresAt": "2024-11-09T12:00:00Z"
  }
}
```

### 2. Validate Activation Token
```typescript
GET /api/v1/staff/activate/validate?token=xxx&email=xxx

Response:
{
  "success": true,
  "message": "Token hợp lệ",
  "data": {
    "email": "doctor@example.com",
    "fullName": "Nguyễn Văn A",
    "expiresAt": "2024-11-09T12:00:00Z"
  }
}
```

### 3. Activate Account
```typescript
POST /api/v1/staff/activate

Request Body:
{
  "token": "activation_token_here",
  "email": "doctor@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "success": true,
  "message": "Tài khoản đã được kích hoạt thành công",
  "data": {
    "staffId": "STAFF-202411-001",
    "email": "doctor@example.com",
    "status": "active"
  }
}
```

## Database Schema

### Bảng: staff_activation_tokens
```sql
CREATE TABLE staff_activation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR NOT NULL REFERENCES provider_schema.staff_profiles(staff_id),
  email VARCHAR NOT NULL,
  token VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_token (token),
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
);
```

### Cập nhật bảng staff_profiles
Thêm trường:
```sql
ALTER TABLE provider_schema.staff_profiles 
ADD COLUMN activation_status VARCHAR DEFAULT 'pending_activation'
  CHECK (activation_status IN ('pending_activation', 'active', 'expired'));

ALTER TABLE provider_schema.staff_profiles 
ADD COLUMN activated_at TIMESTAMP;
```

## Email Service Integration

### Sử dụng Supabase Edge Functions hoặc External Service

**Option 1: Supabase Edge Function**
```typescript
// supabase/functions/send-staff-invitation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { email, fullName, role, department, activationLink } = await req.json()
  
  // Load HTML template
  const template = await Deno.readTextFile("./templates/staff-invitation-email.html")
  
  // Replace variables
  const html = template
    .replace(/{{fullName}}/g, fullName)
    .replace(/{{email}}/g, email)
    .replace(/{{role}}/g, role)
    .replace(/{{department}}/g, department)
    .replace(/{{activationLink}}/g, activationLink)
    .replace(/{{hospitalName}}/g, "Bệnh viện ABC")
    .replace(/{{supportEmail}}/g, "support@hospital.com")
  
  // Send email using Resend, SendGrid, or other service
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "noreply@hospital.com",
      to: email,
      subject: "Mời kích hoạt tài khoản - Hệ thống Quản lý Bệnh viện",
      html: html
    })
  })
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  })
})
```

**Option 2: NodeMailer trong Backend Service**
```typescript
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export class EmailService {
  private transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  async sendStaffInvitation(data: {
    email: string;
    fullName: string;
    role: string;
    department: string;
    activationToken: string;
  }) {
    // Load template
    const templatePath = path.join(__dirname, '../templates/staff-invitation-email.html');
    let html = fs.readFileSync(templatePath, 'utf-8');
    
    // Generate activation link
    const activationLink = `${process.env.FRONTEND_URL}/staff/activate?token=${data.activationToken}&email=${data.email}`;
    
    // Replace variables
    html = html
      .replace(/{{fullName}}/g, data.fullName)
      .replace(/{{email}}/g, data.email)
      .replace(/{{role}}/g, data.role)
      .replace(/{{department}}/g, data.department)
      .replace(/{{activationLink}}/g, activationLink)
      .replace(/{{hospitalName}}/g, process.env.HOSPITAL_NAME || 'Bệnh viện')
      .replace(/{{supportEmail}}/g, process.env.SUPPORT_EMAIL || 'support@hospital.com');
    
    // Send email
    await this.transporter.sendMail({
      from: `"${process.env.HOSPITAL_NAME}" <${process.env.SMTP_FROM}>`,
      to: data.email,
      subject: 'Mời kích hoạt tài khoản - Hệ thống Quản lý Bệnh viện',
      html: html
    });
  }
}
```

## Security Considerations

1. **Token Security:**
   - Token phải được generate bằng crypto-secure random
   - Token nên có độ dài tối thiểu 32 characters
   - Token chỉ sử dụng 1 lần (mark as used sau khi activate)
   - Token có thời hạn (24 giờ)

2. **Password Security:**
   - Enforce minimum password strength
   - Hash password với bcrypt (cost factor >= 10)
   - Không log password trong bất kỳ trường hợp nào

3. **Rate Limiting:**
   - Giới hạn số lần gửi email mời (prevent spam)
   - Giới hạn số lần validate token (prevent brute force)
   - Giới hạn số lần submit password

4. **Email Verification:**
   - Verify email format trước khi gửi
   - Check email không nằm trong blacklist
   - Log tất cả email được gửi

## Testing Checklist

### Frontend Testing
- [ ] Form validation hoạt động đúng
- [ ] Checkbox gửi email toggle đúng
- [ ] Loading states hiển thị
- [ ] Success modal hiển thị và redirect
- [ ] Error messages hiển thị đúng
- [ ] Password strength indicator hoạt động
- [ ] Show/hide password hoạt động
- [ ] Responsive trên mobile

### Backend Testing
- [ ] Tạo staff account thành công
- [ ] Generate token unique
- [ ] Gửi email thành công
- [ ] Validate token đúng/sai
- [ ] Token expired được handle
- [ ] Password được hash đúng
- [ ] Account status update đúng
- [ ] Rate limiting hoạt động

### Integration Testing
- [ ] End-to-end flow hoạt động
- [ ] Email được gửi và nhận
- [ ] Link trong email hoạt động
- [ ] Activation thành công
- [ ] Login sau activation thành công

## Environment Variables

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001

# Backend
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@hospital.com
HOSPITAL_NAME=Bệnh viện ABC
SUPPORT_EMAIL=support@hospital.com
FRONTEND_URL=http://localhost:3001

# Token Settings
ACTIVATION_TOKEN_EXPIRY_HOURS=24
```

## Next Steps

1. **Backend Implementation:**
   - [ ] Implement API endpoints
   - [ ] Setup email service
   - [ ] Create database migrations
   - [ ] Add token generation logic

2. **Frontend Integration:**
   - [ ] Connect form to API
   - [ ] Handle API responses
   - [ ] Add proper error handling
   - [ ] Test all flows

3. **Testing:**
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] E2E tests
   - [ ] Manual testing

4. **Documentation:**
   - [ ] API documentation
   - [ ] User guide cho Admin
   - [ ] User guide cho Staff
   - [ ] Troubleshooting guide
