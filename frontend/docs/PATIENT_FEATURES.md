# 📋 Tính Năng Bệnh Nhân - Patient Features

> Tài liệu chi tiết các chức năng có sẵn cho bệnh nhân trong hệ thống

---

## 🎯 Tổng Quan

Hệ thống cung cấp **10 chức năng chính** cho bệnh nhân, được tích hợp đầy đủ từ Backend (Patient Registry Service) đến Frontend (Next.js).

---

## 🗂️ Menu Sidebar Bệnh Nhân

Sidebar navigation bên trái hiển thị các menu sau:

| # | Menu Item | Icon | Route | Backend API | Mô Tả |
|---|-----------|------|-------|-------------|-------|
| 1 | **Tổng quan** | 📊 Dashboard | `/patient/dashboard` | Multiple | Dashboard tổng hợp |
| 2 | **Đặt lịch khám** | 📅 Calendar | `/patient/appointments/book` | Appointments Service | Đặt lịch hẹn mới |
| 3 | **Lịch hẹn của tôi** | 📋 List | `/patient/appointments` | Appointments Service | Xem lịch hẹn |
| 4 | **Hồ sơ bệnh án** | 📄 File | `/patient/medical-history` | Clinical EMR Service | Lịch sử khám bệnh |
| 5 | **Hồ sơ cá nhân** | 👤 User | `/patient/profile` | `GET/PUT /api/v1/patients/:id` | Thông tin cá nhân |
| 6 | **Liên hệ khẩn cấp** | 📞 Phone | `/patient/emergency-contacts` | `GET/POST/PUT/DELETE /emergency-contacts` | Quản lý người liên hệ khẩn cấp |
| 7 | **Bảo hiểm y tế** | 🛡️ Shield | `/patient/insurance` | `GET/PUT /insurance` | Quản lý BHYT/BHTN |
| 8 | **Đồng ý chia sẻ** | ✅ Check | `/patient/consents` | `GET/POST /consents` | Quản lý consent |
| 9 | **Thanh toán** | 💳 Card | `/patient/billing` | Billing Service | Hóa đơn & thanh toán |
| 10 | **Tùy chọn** | 🔔 Bell | `/patient/preferences` | `GET/PUT /communication` | Cài đặt preferences |

---

## 🔌 Backend APIs (Patient Registry Service)

### Base URL
```
http://localhost:3021/api/v1/patients
```

### 1️⃣ Quản Lý Hồ Sơ Cá Nhân

#### GET Patient Profile
```http
GET /api/v1/patients/:patientId
GET /api/v1/patients/user/:userId
GET /api/v1/patients/national-id/:nationalId
GET /api/v1/patients/bhyt/:bhytNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patientId": "PAT-202411-001",
    "personalInfo": {
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "1990-01-01",
      "gender": "MALE",
      "nationalId": "001234567890",
      "bloodType": "A+"
    },
    "contactInfo": {
      "primaryPhone": "0912345678",
      "email": "patient@example.com",
      "address": {...}
    }
  }
}
```

#### PUT Update Patient
```http
PUT /api/v1/patients/:patientId
```

**Request Body:**
```json
{
  "personalInfo": {
    "fullName": "Nguyễn Văn A",
    "occupation": "Software Engineer"
  },
  "contactInfo": {
    "primaryPhone": "0912345678",
    "email": "newemail@example.com"
  }
}
```

---

### 2️⃣ Quản Lý Liên Hệ Khẩn Cấp

#### GET Emergency Contacts
```http
GET /api/v1/patients/:patientId/emergency-contacts
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "contactId": "uuid",
        "name": "Nguyễn Thị B",
        "relationship": "Vợ",
        "phoneNumber": "0987654321",
        "isPrimary": true
      }
    ]
  }
}
```

#### POST Add Emergency Contact
```http
POST /api/v1/patients/:patientId/emergency-contacts
```

**Request Body:**
```json
{
  "name": "Nguyễn Thị B",
  "relationship": "Vợ",
  "phoneNumber": "0987654321",
  "isPrimary": true
}
```

#### PUT Update Emergency Contact
```http
PUT /api/v1/patients/:patientId/emergency-contacts/:contactId
```

#### DELETE Remove Emergency Contact
```http
DELETE /api/v1/patients/:patientId/emergency-contacts/:contactId
```

#### PUT Set Primary Contact
```http
PUT /api/v1/patients/:patientId/emergency-contacts/:contactId/set-primary
```

---

### 3️⃣ Quản Lý Bảo Hiểm

#### GET Insurance Info
```http
GET /api/v1/patients/:patientId/insurance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insuranceInfo": {
      "provider": "Bảo hiểm xã hội Việt Nam",
      "policyNumber": "DN-1-01-2024-12345-12345",
      "coverageType": "BHYT",
      "validFrom": "2024-01-01",
      "validTo": "2024-12-31",
      "isActive": true
    }
  }
}
```

#### PUT Update Insurance
```http
PUT /api/v1/patients/:patientId/insurance
```

**Request Body:**
```json
{
  "provider": "Bảo hiểm xã hội Việt Nam",
  "policyNumber": "DN-1-01-2024-12345-12345",
  "coverageType": "BHYT",
  "validFrom": "2024-01-01",
  "validTo": "2024-12-31"
}
```

#### POST Verify Insurance
```http
POST /api/v1/patients/:patientId/insurance/verify
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "message": "Bảo hiểm hợp lệ",
    "expiresAt": "2024-12-31"
  }
}
```

---

### 4️⃣ Quản Lý Đồng Ý (Consent Management)

#### GET All Consents
```http
GET /api/v1/patients/:patientId/consents
GET /api/v1/patients/:patientId/consents/active  # Active only
```

**Response:**
```json
{
  "success": true,
  "data": {
    "consents": [
      {
        "consentId": "uuid",
        "consentType": "DATA_SHARING",
        "status": "ACTIVE",
        "grantedAt": "2024-01-01T00:00:00Z",
        "expiresAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST Grant Consent
```http
POST /api/v1/patients/:patientId/consents
```

**Request Body:**
```json
{
  "consentType": "DATA_SHARING",
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

**Consent Types:**
- `DATA_SHARING` - Chia sẻ dữ liệu y tế
- `TREATMENT` - Đồng ý điều trị
- `RESEARCH` - Tham gia nghiên cứu
- `MARKETING` - Nhận thông tin marketing

#### POST Revoke Consent
```http
POST /api/v1/patients/:patientId/consents/:consentId/revoke
```

**Request Body:**
```json
{
  "reason": "Không muốn chia sẻ dữ liệu nữa"
}
```

---

### 5️⃣ Quản Lý Ảnh Đại Diện

#### POST Upload Photo
```http
POST /api/v1/patients/:patientId/photo
Content-Type: multipart/form-data
```

**Form Data:**
```
photo: <file>
```

#### GET Photo
```http
GET /api/v1/patients/:patientId/photo
```

#### DELETE Photo
```http
DELETE /api/v1/patients/:patientId/photo
```

---

### 6️⃣ Quản Lý Tùy Chọn Liên Lạc

#### GET Communication Preferences
```http
GET /api/v1/patients/:patientId/communication
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "preferredMethod": "EMAIL",
      "allowSMS": true,
      "allowEmail": true,
      "allowPush": false,
      "language": "vi"
    }
  }
}
```

#### PUT Update Communication Preferences
```http
PUT /api/v1/patients/:patientId/communication
```

**Request Body:**
```json
{
  "preferredMethod": "EMAIL",
  "allowSMS": true,
  "allowEmail": true,
  "allowPush": false,
  "language": "vi"
}
```

---

### 7️⃣ Lịch Sử Hoạt Động

#### GET Patient History
```http
GET /api/v1/patients/:patientId/history
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auditLogs": [
      {
        "action": "UPDATE_PROFILE",
        "performedBy": "user-id",
        "timestamp": "2024-01-01T00:00:00Z",
        "details": "Updated contact info"
      }
    ],
    "accessLogs": [
      {
        "accessedBy": "doctor-id",
        "timestamp": "2024-01-01T00:00:00Z",
        "purpose": "Medical consultation"
      }
    ]
  }
}
```

---

## 🎨 Frontend Components

### Sidebar Component
```tsx
// File: /frontend/components/layout/Sidebar.tsx
import { Phone, Shield, FileCheck, Bell } from 'lucide-react';

// Patient menu items với icons
const patientMenuItems = [
  { label: 'Tổng quan', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Đặt lịch khám', href: '/patient/appointments/book', icon: Calendar },
  { label: 'Lịch hẹn của tôi', href: '/patient/appointments', icon: ClipboardList },
  { label: 'Hồ sơ bệnh án', href: '/patient/medical-history', icon: FileText },
  { label: 'Hồ sơ cá nhân', href: '/patient/profile', icon: Users },
  { label: 'Liên hệ khẩn cấp', href: '/patient/emergency-contacts', icon: Phone },
  { label: 'Bảo hiểm y tế', href: '/patient/insurance', icon: Shield },
  { label: 'Đồng ý chia sẻ', href: '/patient/consents', icon: FileCheck },
  { label: 'Thanh toán', href: '/patient/billing', icon: CreditCard },
  { label: 'Tùy chọn', href: '/patient/preferences', icon: Bell },
];
```

### Cách Sử Dụng Sidebar
```tsx
// File: /frontend/app/patient/dashboard/page.tsx
import { DashboardLayout } from '@/components/layout';

export default function PatientDashboardPage() {
  return (
    <DashboardLayout>
      {/* Sidebar tự động hiển thị bên trái */}
      <div>Your dashboard content</div>
    </DashboardLayout>
  );
}
```

---

## 🚀 Cách Sử Dụng

### 1. Start Backend Services
```bash
cd backend/services-v2
npm run dev:core  # Starts Patient Registry Service on port 3021
```

### 2. Start Frontend
```bash
cd frontend
npm run dev  # Starts Next.js on port 3000
```

### 3. Truy Cập
- Frontend: http://localhost:3000
- Patient Dashboard: http://localhost:3000/patient/dashboard
- Backend API: http://localhost:3021/api/v1/patients

---

## 📝 Roadmap Các Tính Năng

### ✅ Đã Hoàn Thành (Backend Ready)
- [x] Quản lý hồ sơ cá nhân
- [x] Quản lý liên hệ khẩn cấp
- [x] Quản lý bảo hiểm
- [x] Quản lý đồng ý (Consent)
- [x] Upload ảnh đại diện
- [x] Tùy chọn liên lạc
- [x] Lịch sử hoạt động

### 🔄 Cần Tích Hợp Frontend
- [ ] Patient Profile Page (`/patient/profile`)
- [ ] Emergency Contacts Page (`/patient/emergency-contacts`)
- [ ] Insurance Page (`/patient/insurance`)
- [ ] Consents Page (`/patient/consents`)
- [ ] Preferences Page (`/patient/preferences`)

### 🔮 Tương Lai (Tích Hợp Services Khác)
- [ ] Appointments (từ Appointments Service)
- [ ] Medical History (từ Clinical EMR Service)
- [ ] Billing (từ Billing Service)

---

## 🔐 Authentication & Authorization

Tất cả endpoints đều yêu cầu authentication:

```http
Authorization: Bearer <access_token>
```

**Roles cho Patient:**
- `PATIENT` - Chỉ được truy cập dữ liệu của chính mình

**Validation:**
- Backend tự động check `userId` trong token
- Frontend middleware check role trước khi render pages

---

## 💡 Best Practices

### 1. Error Handling
```typescript
try {
  const response = await fetch(`/api/v1/patients/${patientId}`);
  if (!response.ok) throw new Error('Failed to fetch patient');
  const data = await response.json();
} catch (error) {
  // Show error toast
  toast.error('Không thể tải thông tin bệnh nhân');
}
```

### 2. Loading States
```tsx
const [loading, setLoading] = useState(false);

async function fetchData() {
  setLoading(true);
  try {
    // ... fetch data
  } finally {
    setLoading(false);
  }
}
```

### 3. Optimistic Updates
```typescript
// Update UI immediately
setContacts([...contacts, newContact]);

// Then sync with backend
try {
  await api.addEmergencyContact(newContact);
} catch (error) {
  // Rollback if failed
  setContacts(contacts);
}
```

---

## 📚 Tham Khảo

- [Patient Registry Service Documentation](../../backend/services-v2/patient-registry-service/README.md)
- [FHIR Patient Resource](https://www.hl7.org/fhir/patient.html)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Lucide Icons](https://lucide.dev)

---

**Cập nhật lần cuối:** 2024-11-07
**Tác giả:** Hospital Management Team
