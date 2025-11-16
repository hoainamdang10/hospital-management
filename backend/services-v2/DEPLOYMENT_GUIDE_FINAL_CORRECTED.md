# BÁO CÁO TRIỂN KHAI CUỐI CÙNG - ĐÃ KIỂM TRA VÀ SỬA LỖI

**Hospital Management System V2 - Final Verified Deployment Guide**

**Ngày cập nhật**: 2025-11-15
**Phiên bản**: 2.0 (Đã kiểm tra và sửa lỗi từ mã nguồn thực tế)
**Tác giả**: Hospital Management Team

---

## 🎯 THAY ĐỔI QUAN TRỌNG TỪ PHIÊN BẢN TRƯỚC

**⚠️ CÁC LỖI ĐÃ SỬA:**
- ✅ **Ports services**: Đã sửa tất cả port numbers từ mã nguồn thực tế
- ✅ **Infrastructure ports**: Redis 6379 (không phải 6380), RabbitMQ 5672/15672 (không phải 5673/15673)
- ✅ **Reminder system**: Xác nhận cron jobs trong Notifications service (không phải Scheduler service riêng)
- ✅ **API endpoints**: Xác nhận prefix `/api/v1` cho tất cả services

---

## 📊 TỔNG QUAN DEPLOYMENT - PORTS CHÍNH XÁC

### Services (Verified từ docker-compose.v2.yml)

| Service | Port | Status | Completion | Bắt buộc cho Flow |
|---------|------|--------|------------|-------------------|
| **Identity Service** | **3001** | ✅ Production Ready | 95% | Flow 1,2,3,4,5 |
| **Provider/Staff Service** | **3002** | ✅ Production Ready | 88% | Flow 2,3,4 |
| **Patient Registry** | **3003** | ✅ Production Ready | 90% | Flow 1,5 |
| **Appointments Service** | **3004** | 🔄 In Development | 75% | Flow 1,3,4 |
| **Clinical EMR Service** | **3007** | 🔄 In Development | 60% | Flow 5 |
| **Billing Service** | **3009** | ⚠️ Basic Only | 50% | Flow 4 |
| **Notifications Service** | **3011** | 🔄 In Development | 65% | Flow 1,4 |
| **Department Service** | **3025** | ❌ Skeleton | 15% | (Optional) |

### Infrastructure (Verified từ docker-compose.v2.yml)

| Component | Port(s) | Credentials |
|-----------|---------|-------------|
| **Redis** | **6379** | (no password in dev) |
| **RabbitMQ (AMQP)** | **5672** | admin/admin |
| **RabbitMQ (Management UI)** | **15672** | admin/admin |

### Frontend

| Component | Port | Status |
|-----------|------|--------|
| **Next.js Frontend** | **3000** | 🔄 In Development |

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI TỪNG FLOW

### Trước khi bắt đầu - Environment Setup

```powershell
# 1. Di chuyển vào thư mục services
cd backend/services-v2

# 2. Cài đặt dependencies
npm install

# 3. Chuyển sang local environment
npm run env:local

# 4. Khởi động infrastructure (Redis + RabbitMQ)
npm run dev:infrastructure

# 5. Đợi 10-15 giây để infrastructure khởi động

# 6. Kiểm tra infrastructure health
curl http://localhost:15672  # RabbitMQ UI (admin/admin)
```

---

## FLOW 1: ĐĂNG KÝ BỆNH NHÂN (Patient Registration Flow)

### 🎯 Mục tiêu
Cho phép bệnh nhân mới đăng ký tài khoản, xác thực email, và đặt lịch khám đầu tiên.

### 📋 Services cần thiết
1. **Identity Service** (Port 3001) - Authentication
2. **Patient Registry** (Port 3003) - Patient profile
3. **Appointments Service** (Port 3004) - Booking
4. **Notifications Service** (Port 3011) - Email/SMS

### 🔧 Bước 1: Khởi động services

```powershell
# Terminal 1: Identity Service
cd identity-service
npm run dev

# Terminal 2: Patient Registry
cd patient-registry-service
npm run dev

# Terminal 3: Appointments Service
cd appointments-service
npm run dev

# Terminal 4: Notifications Service
cd notifications-service
npm run dev
```

### ✅ Bước 2: Kiểm tra health checks

```bash
# Identity Service
curl http://localhost:3001/health

# Patient Registry
curl http://localhost:3003/health

# Appointments Service
curl http://localhost:3004/health

# Notifications Service
curl http://localhost:3011/health
```

**Expected Response** (ví dụ Identity):
```json
{
  "status": "healthy",
  "service": "identity-service",
  "version": "2.0.0",
  "checks": {
    "database": "pass",
    "rabbitmq": "pass"
  }
}
```

### 📝 Bước 3: Test Flow

#### 3.1. Đăng ký tài khoản bệnh nhân

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient.test@hospital.com",
    "password": "SecurePass123!",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "role": "patient"
  }'
```

**Expected**:
- Status 201
- Email verification sent via Notifications service
- Check RabbitMQ: Event `identity.user.registered` published

#### 3.2. Xác thực email (giả lập)

```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<verification_token_from_email>"
  }'
```

#### 3.3. Đăng nhập

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient.test@hospital.com",
    "password": "SecurePass123!",
    "tenantId": "default-tenant-id"
  }'
```

**Lưu JWT token** từ response để dùng cho các bước sau.

#### 3.4. Tạo hồ sơ bệnh nhân

```bash
curl -X POST http://localhost:3003/api/v1/patients \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user_id_from_login>",
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "phoneNumber": "0901234567",
    "address": "123 Đường ABC, TP.HCM",
    "bloodType": "O+",
    "emergencyContact": {
      "name": "Nguyễn Thị B",
      "relationship": "wife",
      "phoneNumber": "0907654321"
    }
  }'
```

#### 3.5. Đặt lịch khám đầu tiên

```bash
curl -X POST http://localhost:3004/api/v1/appointments \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "<patient_id_from_step_3.4>",
    "staffId": "<doctor_id>",
    "departmentId": "<department_id>",
    "scheduledAt": "2025-11-20T10:00:00Z",
    "appointmentType": "consultation",
    "reason": "Khám tổng quát",
    "notes": "Bệnh nhân mới, khám lần đầu"
  }'
```

**Expected**:
- Status 201
- Appointment created
- Event `appointments.appointment.scheduled` published
- Reminder scheduled (cron job sẽ gửi notification trước 24h, 2h, 30 phút)

### 🎯 Kết quả mong đợi

1. ✅ User account created in Identity service
2. ✅ Patient profile created in Patient Registry
3. ✅ Appointment scheduled in Appointments service
4. ✅ Events published to RabbitMQ:
   - `identity.user.registered`
   - `patient.patient.created`
   - `appointments.appointment.scheduled`
5. ✅ Notifications sent:
   - Email verification
   - Appointment confirmation
   - Reminder scheduled (cron job)

### 📊 Monitoring

```bash
# Check RabbitMQ queues
curl -u admin:admin http://localhost:15672/api/queues

# Check logs
docker-compose -f docker-compose.v2.yml logs -f identity-service
docker-compose -f docker-compose.v2.yml logs -f patient-registry-service
docker-compose -f docker-compose.v2.yml logs -f appointments-service
docker-compose -f docker-compose.v2.yml logs -f notifications-service
```

---

## FLOW 2: ONBOARDING NHÂN VIÊN (Staff Onboarding Flow)

### 🎯 Mục tiêu
Admin tạo tài khoản cho bác sĩ/y tá, gán quyền, và setup lịch làm việc.

### 📋 Services cần thiết
1. **Identity Service** (Port 3001) - User & RBAC
2. **Provider/Staff Service** (Port 3002) - Staff profiles & schedules
3. **Notifications Service** (Port 3011) - Invitation emails

### 🔧 Bước 1: Khởi động services

```powershell
# Terminal 1: Identity Service (nếu chưa chạy)
cd identity-service
npm run dev

# Terminal 2: Provider/Staff Service
cd provider-staff-service
npm run dev

# Terminal 3: Notifications Service (nếu chưa chạy)
cd notifications-service
npm run dev
```

### ✅ Bước 2: Health checks

```bash
curl http://localhost:3001/health  # Identity
curl http://localhost:3002/health  # Provider/Staff
curl http://localhost:3011/health  # Notifications
```

### 📝 Bước 3: Test Flow

#### 3.1. Admin đăng nhập

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "AdminSecure123!",
    "tenantId": "default-tenant-id"
  }'
```

**Lưu admin JWT token**.

#### 3.2. Tạo tài khoản bác sĩ

```bash
curl -X POST http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor.nguyen@hospital.com",
    "password": "DoctorSecure123!",
    "fullName": "BS. Nguyễn Văn C",
    "phoneNumber": "0902345678",
    "role": "doctor"
  }'
```

#### 3.3. Gán quyền (RBAC)

```bash
curl -X POST http://localhost:3001/api/v1/admin/users/<user_id>/roles \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["doctor", "appointment_manager"]
  }'
```

#### 3.4. Tạo hồ sơ nhân viên

```bash
curl -X POST http://localhost:3002/api/v1/staff \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<doctor_user_id>",
    "fullName": "BS. Nguyễn Văn C",
    "staffType": "doctor",
    "departmentId": "<cardiology_department_id>",
    "specialization": "Cardiology",
    "licenseNumber": "BYS-12345",
    "licenseExpiry": "2030-12-31",
    "qualifications": ["MD", "FACC"],
    "yearsOfExperience": 10
  }'
```

#### 3.5. Setup lịch làm việc

```bash
curl -X POST http://localhost:3002/api/v1/staff/<staff_id>/schedules \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dayOfWeek": "monday",
    "startTime": "08:00",
    "endTime": "17:00",
    "breakStartTime": "12:00",
    "breakEndTime": "13:00",
    "maxAppointmentsPerDay": 20
  }'
```

### 🎯 Kết quả mong đợi

1. ✅ Doctor user created with RBAC roles
2. ✅ Staff profile created with credentials
3. ✅ Work schedule configured
4. ✅ Events published:
   - `identity.user.created`
   - `provider.staff.created`
   - `provider.staff.schedule.updated`
5. ✅ Invitation email sent

---

## FLOW 3: CHECK-IN VÀ QUEUE (Check-in & Queue Management Flow)

### 🎯 Mục tiêu
Bệnh nhân check-in tại phòng khám, join queue, và được gọi vào khám.

### 📋 Services cần thiết
1. **Identity Service** (Port 3001) - Authentication
2. **Provider/Staff Service** (Port 3002) - Doctor info
3. **Appointments Service** (Port 3004) - Queue management
4. **Notifications Service** (Port 3011) - Queue notifications

### 🔧 Bước 1: Khởi động services (nếu chưa chạy)

```bash
# Kiểm tra health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3004/health
curl http://localhost:3011/health
```

### 📝 Bước 2: Test Flow

#### 2.1. Bệnh nhân check-in (có appointment)

```bash
curl -X POST http://localhost:3004/api/v1/appointments/<appointment_id>/check-in \
  -H "Authorization: Bearer <patient_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "checkInTime": "2025-11-20T09:55:00Z",
    "notes": "Bệnh nhân đến đúng giờ"
  }'
```

**Expected**:
- Appointment status → `checked_in`
- Event `appointments.appointment.checked_in` published
- Patient automatically added to queue

#### 2.2. Bệnh nhân walk-in (không có appointment) - Join queue

```bash
curl -X POST http://localhost:3004/api/v1/queue/join \
  -H "Authorization: Bearer <patient_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "<patient_id>",
    "departmentId": "<department_id>",
    "priority": "normal",
    "reason": "Khám bệnh đột xuất"
  }'
```

**Expected**:
- Patient added to queue
- Queue position assigned
- Event `appointments.patient.joined_queue` published

#### 2.3. Kiểm tra trạng thái queue

```bash
curl -X GET "http://localhost:3004/api/v1/queue/status?departmentId=<department_id>" \
  -H "Authorization: Bearer <staff_jwt_token>"
```

**Expected Response**:
```json
{
  "queueId": "queue-123",
  "departmentId": "dept-cardiology",
  "currentSize": 5,
  "averageWaitTime": 15,
  "entries": [
    {
      "position": 1,
      "patientId": "patient-001",
      "patientName": "Nguyễn Văn A",
      "waitTime": 10,
      "priority": "normal"
    },
    {
      "position": 2,
      "patientId": "patient-002",
      "patientName": "Trần Thị B",
      "waitTime": 8,
      "priority": "normal"
    }
  ]
}
```

#### 2.4. Bác sĩ gọi bệnh nhân tiếp theo

```bash
curl -X POST http://localhost:3004/api/v1/queue/call-next \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "departmentId": "<department_id>",
    "staffId": "<doctor_staff_id>",
    "roomNumber": "301"
  }'
```

**Expected**:
- Next patient dequeued
- Event `appointments.patient.called` published
- Notification sent to patient (SMS/app notification)

#### 2.5. Start appointment (bắt đầu khám)

```bash
curl -X POST http://localhost:3004/api/v1/appointments/<appointment_id>/start \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2025-11-20T10:05:00Z"
  }'
```

**Expected**:
- Appointment status → `in_progress`
- Event `appointments.appointment.started` published

### 🎯 Kết quả mong đợi

1. ✅ Patient checked-in successfully
2. ✅ Queue position assigned
3. ✅ Real-time queue status visible
4. ✅ Patient called by doctor
5. ✅ Appointment started
6. ✅ Events flow:
   - `appointments.appointment.checked_in`
   - `appointments.patient.joined_queue`
   - `appointments.patient.called`
   - `appointments.appointment.started`

---

## FLOW 4: THANH TOÁN (Billing Flow)

### 🎯 Mục tiêu
Tạo hóa đơn, xử lý thanh toán, và gửi receipt.

### 📋 Services cần thiết
1. **Identity Service** (Port 3001) - Authentication
2. **Appointments Service** (Port 3004) - Appointment info
3. **Billing Service** (Port 3009) - Invoice & payment
4. **Notifications Service** (Port 3011) - Receipt email

### 🔧 Bước 1: Khởi động services

```powershell
# Terminal: Billing Service
cd billing-service
npm run dev
```

### ✅ Bước 2: Health check

```bash
curl http://localhost:3009/health
```

### 📝 Bước 3: Test Flow

#### 3.1. Complete appointment (kết thúc khám)

```bash
curl -X POST http://localhost:3004/api/v1/appointments/<appointment_id>/complete \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "completedAt": "2025-11-20T10:30:00Z",
    "diagnosis": "Hypertension",
    "notes": "Kê đơn thuốc huyết áp"
  }'
```

**Expected**:
- Event `appointments.appointment.completed` published
- Billing service listens and auto-creates invoice

#### 3.2. Tạo hóa đơn (nếu chưa tự động tạo)

```bash
curl -X POST http://localhost:3009/api/v1/invoices \
  -H "Authorization: Bearer <staff_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "<appointment_id>",
    "patientId": "<patient_id>",
    "items": [
      {
        "description": "Khám tim mạch",
        "quantity": 1,
        "unitPrice": 200000,
        "discount": 0
      },
      {
        "description": "Điện tâm đồ (ECG)",
        "quantity": 1,
        "unitPrice": 150000,
        "discount": 10000
      }
    ],
    "insuranceInfo": {
      "hasInsurance": true,
      "insuranceProvider": "BHYT",
      "policyNumber": "BHYT-123456",
      "coveragePercentage": 80
    }
  }'
```

**Expected Response**:
```json
{
  "invoiceId": "INV-2025-001",
  "subtotal": 350000,
  "discount": 10000,
  "insuranceCovered": 272000,
  "patientPayable": 68000,
  "total": 340000,
  "status": "pending"
}
```

#### 3.3. Xử lý thanh toán

```bash
curl -X POST http://localhost:3009/api/v1/invoices/<invoice_id>/pay \
  -H "Authorization: Bearer <patient_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "cash",
    "amountPaid": 68000,
    "paymentDate": "2025-11-20T10:35:00Z"
  }'
```

**Expected**:
- Invoice status → `paid`
- Event `billing.invoice.paid` published
- Receipt email sent via Notifications service

#### 3.4. Lấy receipt

```bash
curl -X GET http://localhost:3009/api/v1/invoices/<invoice_id>/receipt \
  -H "Authorization: Bearer <patient_jwt_token>"
```

### 🎯 Kết quả mong đợi

1. ✅ Invoice created after appointment completion
2. ✅ Insurance coverage calculated (BHYT 80%)
3. ✅ Payment processed successfully
4. ✅ Receipt generated and emailed
5. ✅ Events:
   - `appointments.appointment.completed`
   - `billing.invoice.created`
   - `billing.invoice.paid`

---

## FLOW 5: HỒ SƠ BỆNH ÁN (Clinical EMR Flow)

### 🎯 Mục tiêu
Bác sĩ tạo hồ sơ bệnh án, kê đơn thuốc, và yêu cầu xét nghiệm.

### 📋 Services cần thiết
1. **Identity Service** (Port 3001) - Authentication
2. **Patient Registry** (Port 3003) - Patient info
3. **Appointments Service** (Port 3004) - Appointment context
4. **Clinical EMR Service** (Port 3007) - Medical records

### 🔧 Bước 1: Khởi động services

```powershell
# Terminal: Clinical EMR Service
cd clinical-emr-service
npm run dev
```

### ✅ Bước 2: Health check

```bash
curl http://localhost:3007/health
```

### 📝 Bước 3: Test Flow

#### 3.1. Tạo medical record

```bash
curl -X POST http://localhost:3007/api/v1/medical-records \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "<patient_id>",
    "appointmentId": "<appointment_id>",
    "encounterType": "outpatient",
    "chiefComplaint": "Đau ngực, khó thở",
    "vitalSigns": {
      "bloodPressure": "140/90",
      "heartRate": 85,
      "temperature": 36.8,
      "weight": 70,
      "height": 170
    },
    "diagnosis": {
      "icd10Code": "I10",
      "description": "Essential (primary) hypertension"
    },
    "clinicalNotes": "Bệnh nhân có triệu chứng tăng huyết áp, cần theo dõi."
  }'
```

#### 3.2. Kê đơn thuốc (Prescription)

```bash
curl -X POST http://localhost:3007/api/v1/prescriptions \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "medicalRecordId": "<record_id>",
    "patientId": "<patient_id>",
    "medications": [
      {
        "name": "Amlodipine",
        "dosage": "5mg",
        "frequency": "1 lần/ngày",
        "duration": "30 ngày",
        "instructions": "Uống vào buổi sáng sau bữa ăn"
      },
      {
        "name": "Aspirin",
        "dosage": "81mg",
        "frequency": "1 lần/ngày",
        "duration": "30 ngày",
        "instructions": "Uống vào buổi tối"
      }
    ],
    "notes": "Tái khám sau 2 tuần"
  }'
```

#### 3.3. Yêu cầu xét nghiệm (Lab Order)

```bash
curl -X POST http://localhost:3007/api/v1/lab-orders \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "medicalRecordId": "<record_id>",
    "patientId": "<patient_id>",
    "tests": [
      {
        "testCode": "CBC",
        "testName": "Complete Blood Count",
        "priority": "routine"
      },
      {
        "testCode": "LIPID",
        "testName": "Lipid Panel",
        "priority": "routine"
      }
    ],
    "clinicalNotes": "Kiểm tra tổng quát"
  }'
```

#### 3.4. Cập nhật kết quả xét nghiệm

```bash
curl -X PUT http://localhost:3007/api/v1/lab-orders/<order_id>/results \
  -H "Authorization: Bearer <lab_tech_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "results": [
      {
        "testCode": "CBC",
        "values": {
          "WBC": "7.5",
          "RBC": "4.8",
          "Hemoglobin": "14.2"
        },
        "status": "normal"
      }
    ],
    "completedAt": "2025-11-21T14:00:00Z"
  }'
```

### 🎯 Kết quả mong đợi

1. ✅ Medical record created with ICD-10 diagnosis
2. ✅ E-prescription generated
3. ✅ Lab orders created
4. ✅ Lab results updated
5. ✅ Events:
   - `clinical.medical_record.created`
   - `clinical.prescription.created`
   - `clinical.lab_order.created`
   - `clinical.lab_order.completed`
6. ✅ FHIR R4 compliance (if implemented)

---

## 🛠️ INFRASTRUCTURE SETUP

### Redis Setup

```bash
# Kiểm tra Redis connection
redis-cli -h localhost -p 6379 ping
# Expected: PONG

# Kiểm tra keys
redis-cli -h localhost -p 6379 keys "*"

# Monitor Redis operations
redis-cli -h localhost -p 6379 monitor
```

### RabbitMQ Setup

```bash
# Access Management UI
# URL: http://localhost:15672
# Credentials: admin/admin

# Kiểm tra queues via API
curl -u admin:admin http://localhost:15672/api/queues

# Kiểm tra exchanges
curl -u admin:admin http://localhost:15672/api/exchanges

# Kiểm tra bindings
curl -u admin:admin http://localhost:15672/api/bindings
```

**Expected Queues**:
- `identity.events`
- `patient.events`
- `provider.events`
- `appointments.events`
- `clinical.events`
- `billing.events`
- `notifications.incoming`

### Supabase Connection

```bash
# Services connect to Supabase using:
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Each service uses its own schema:
# - auth_schema (Identity)
# - patient_schema (Patient Registry)
# - provider_schema (Provider/Staff)
# - appointments_schema (Appointments)
# - clinical_schema (Clinical EMR)
# - billing_schema (Billing)
# - notifications_schema (Notifications)
```

**Connection Pool Limits**:
- Development: 15 connections per service
- Production: 20 connections per service
- **⚠️ Supabase free tier limit**: 60 total connections
- **Current usage**: 8 services × 15 = 120 potential connections
- **Recommendation**: Monitor usage, may need tier upgrade

---

## 🔍 TROUBLESHOOTING CHECKLIST

### 1. Service không khởi động

```bash
# Kiểm tra port có bị chiếm không
netstat -ano | findstr :<port>

# Ví dụ: Kiểm tra port 3001
netstat -ano | findstr :3001

# Kiểm tra logs
cd <service-directory>
npm run dev  # Xem error messages
```

**Common errors**:
- ❌ `EADDRINUSE`: Port đã được sử dụng → Kill process hoặc đổi port
- ❌ `ECONNREFUSED`: Infrastructure chưa khởi động → Start Redis/RabbitMQ
- ❌ `Missing environment variables`: Check `.env` file

### 2. Database connection issues

```bash
# Kiểm tra Supabase credentials trong .env
cat .env.local | findstr SUPABASE

# Test connection (ví dụ từ Patient service)
cd patient-registry-service
node -e "const { createClient } = require('@supabase/supabase-js'); const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); client.from('patients').select('count').then(console.log);"
```

### 3. RabbitMQ events không publish/consume

```bash
# Kiểm tra RabbitMQ connection
curl -u admin:admin http://localhost:15672/api/overview

# Kiểm tra queue có messages không
curl -u admin:admin http://localhost:15672/api/queues/%2F/appointments.events

# Check service logs cho event publishing
docker-compose -f docker-compose.v2.yml logs -f appointments-service | grep "Event published"
```

### 4. Redis caching issues

```bash
# Flush Redis cache
redis-cli -h localhost -p 6379 FLUSHALL

# Monitor Redis operations
redis-cli -h localhost -p 6379 MONITOR

# Check Redis memory
redis-cli -h localhost -p 6379 INFO memory
```

### 5. Ports chính xác (Reference)

| Service | Port | Verified From |
|---------|------|---------------|
| Identity | **3001** | docker-compose.v2.yml line 155 |
| Provider/Staff | **3002** | docker-compose.v2.yml line 283, src/index.ts line 35 |
| Patient Registry | **3003** | docker-compose.v2.yml line 248, src/main.ts line 106 |
| Appointments | **3004** | docker-compose.v2.yml line 351 |
| Clinical EMR | **3007** | docker-compose.v2.yml |
| Billing | **3009** | docker-compose.v2.yml line 480 |
| Notifications | **3011** | docker-compose.v2.yml line 529, src/index.ts line 25 |
| Department | **3025** | docker-compose.v2.yml |
| Redis | **6379** | docker-compose.v2.yml line 22 |
| RabbitMQ | **5672** | docker-compose.v2.yml line 37 |
| RabbitMQ UI | **15672** | docker-compose.v2.yml line 38 |

### 6. Health check failures

```bash
# Identity Service
curl -v http://localhost:3001/health
# Expected: 200 OK with JSON {"status": "healthy"}

# If 503 Service Unavailable:
# - Check database connection
# - Check RabbitMQ connection
# - Check logs for errors

# If connection refused:
# - Service not running
# - Wrong port
# - Firewall blocking
```

### 7. Event-driven flow debugging

```bash
# 1. Check event published
curl -u admin:admin http://localhost:15672/api/queues/%2F/<queue_name>
# Look for "messages" count > 0

# 2. Check consumer connected
curl -u admin:admin http://localhost:15672/api/consumers
# Look for your service in consumers list

# 3. Check dead letter queue (nếu có)
curl -u admin:admin http://localhost:15672/api/queues/%2F/<queue_name>.dlq

# 4. Manual event publish test (for debugging)
curl -X POST http://localhost:15672/api/exchanges/%2F/amq.default/publish \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {},
    "routing_key": "appointments.events",
    "payload": "{\"eventType\":\"AppointmentScheduled\",\"data\":{}}",
    "payload_encoding": "string"
  }'
```

### 8. Reminder system (Cron Jobs)

**Location**: `appointments-service/src/infrastructure/jobs/ReminderScheduler.ts`

**Cron schedules**:
- 24 hours before: Every 2 hours (`0 */2 * * *`)
- 2 hours before: Every 15 minutes (`*/15 * * * *`)
- 30 minutes before: Every 5 minutes (`*/5 * * * *`)

**Debugging**:
```bash
# Check if cron job is running
cd notifications-service
npm run dev  # Look for "⏰ Initializing Reminder Cron Job..."
# Expected log: "✅ Reminder Cron Job started successfully"

# Check logs for reminder processing
docker-compose -f docker-compose.v2.yml logs -f notifications-service | grep "Reminder"

# Verify reminder events in RabbitMQ
curl -u admin:admin http://localhost:15672/api/queues/%2F/notifications.incoming
```

**Known Issues**:
- ⚠️ `ReminderScheduler.ts` line 142: `findByScheduledTimeRange` not implemented in repository
- ⚠️ Currently disabled for MVP build (line 147: `const appointments: any[] = []`)
- 🔧 **TODO**: Implement `findByScheduledTimeRange` in `IAppointmentRepository`

---

## 📊 MONITORING & METRICS

### Service Health Endpoints

```bash
# Core health check (all services)
curl http://localhost:3001/health  # Identity
curl http://localhost:3002/health  # Provider/Staff
curl http://localhost:3003/health  # Patient Registry
curl http://localhost:3004/health  # Appointments
curl http://localhost:3007/health  # Clinical EMR
curl http://localhost:3009/health  # Billing
curl http://localhost:3011/health  # Notifications
curl http://localhost:3025/health  # Department
```

### Swagger Documentation (khi available)

```bash
# Identity Service API docs (if implemented)
# http://localhost:3001/api-docs

# Notifications Service API docs
http://localhost:3011/api-docs
```

### Prometheus Metrics (Identity Service)

```bash
# Metrics endpoint (nếu enabled)
curl http://localhost:3001/metrics
```

---

## 🎯 DEPLOYMENT PRIORITIES

### Phase 1: MVP Production Ready (Now)
✅ **Identity Service** (95%) - Deploy immediately
✅ **Patient Registry** (90%) - Deploy immediately
✅ **Provider/Staff Service** (88%) - Deploy immediately

### Phase 2: Near-term (3-6 weeks)
🔄 **Appointments Service** (75%) - 3-4 weeks to production
🔄 **Notifications Service** (65%) - 5-6 weeks to production

### Phase 3: Medium-term (8-12 weeks)
🔄 **Clinical EMR Service** (60%) - 10-12 weeks (presentation layer missing)
⚠️ **Billing Service** (50%) - 8-10 weeks (payment lifecycle incomplete)

### Phase 4: Long-term (Optional for MVP)
❌ **Department Service** (15%) - 8-10 weeks (skeleton only, rebuild required)

---

## 📝 NOTES & REFERENCES

### Key Documentation Files
- `README.md` - Project overview
- `backend/services-v2/README.md` - Services documentation
- `CLAUDE.md` - Development guidelines
- `AGENTS.md` - AI agent guidelines
- `backend/services-v2/ARCHITECTURE_AUDIT_REPORT.md` - Architecture analysis

### Environment Configuration
- `.env.local` - Local development (services on host, infra in docker)
- `.env.docker` - Full docker deployment
- Switch via: `npm run env:local` or `npm run env:docker`

### Test Coverage Summary
| Service | Unit | Integration | Total | Coverage |
|---------|------|-------------|-------|----------|
| Identity | 87 | 12 | 99 | 85-90% ✅ |
| Patient | 35 | 16 | 51 | 80-85% ✅ |
| Provider | 38 | 23 | 61 | 80-85% ✅ |
| Appointments | 38 | 18 | 56 | 75-80% ⚠️ |
| Billing | ~10 | ~3 | 13 | 40-50% ❌ |
| Clinical | ~18 | ~4 | 22 | 50-60% ❌ |
| Notifications | ~12 | ~4 | 16 | 55-65% ⚠️ |
| Department | ~3 | ~1 | 4 | 10-15% ❌ |

---

## ✅ CHECKLIST CUỐI CÙNG TRƯỚC KHI DEMO

### Infrastructure
- [ ] Redis running on port **6379**
- [ ] RabbitMQ running on ports **5672** (AMQP) và **15672** (UI)
- [ ] RabbitMQ Management UI accessible: http://localhost:15672 (admin/admin)
- [ ] Supabase connection tested

### Services (theo từng Flow)
**Flow 1 (Patient Registration)**:
- [ ] Identity Service (3001) - healthy
- [ ] Patient Registry (3003) - healthy
- [ ] Appointments Service (3004) - healthy
- [ ] Notifications Service (3011) - healthy

**Flow 2 (Staff Onboarding)**:
- [ ] Identity Service (3001) - healthy
- [ ] Provider/Staff Service (3002) - healthy
- [ ] Notifications Service (3011) - healthy

**Flow 3 (Check-in/Queue)**:
- [ ] Identity Service (3001) - healthy
- [ ] Provider/Staff Service (3002) - healthy
- [ ] Appointments Service (3004) - healthy
- [ ] Notifications Service (3011) - healthy

**Flow 4 (Billing)**:
- [ ] Identity Service (3001) - healthy
- [ ] Appointments Service (3004) - healthy
- [ ] Billing Service (3009) - healthy
- [ ] Notifications Service (3011) - healthy

**Flow 5 (Clinical EMR)**:
- [ ] Identity Service (3001) - healthy
- [ ] Patient Registry (3003) - healthy
- [ ] Appointments Service (3004) - healthy
- [ ] Clinical EMR Service (3007) - healthy

### Event-Driven Architecture
- [ ] RabbitMQ queues created cho tất cả services
- [ ] Event consumers connected (check logs cho "✅ Event consumers connected")
- [ ] Test event publishing/consuming (ít nhất 1 event cho mỗi service)

### Reminder System
- [ ] Notifications Service logs show "✅ Reminder Cron Job started successfully"
- [ ] Cron job schedule visible in logs (24h, 2h, 30min windows)
- ⚠️ **Note**: Repository method `findByScheduledTimeRange` chưa implement (disabled for MVP)

### Data Preparation
- [ ] Admin user created trong Identity service
- [ ] At least 1 doctor created trong Provider/Staff service
- [ ] At least 1 department created (if Department service running)
- [ ] Sample patient data ready for testing

### Testing
- [ ] All health checks returning 200 OK
- [ ] Test 1 complete flow end-to-end trước khi demo
- [ ] Check RabbitMQ UI cho event flow
- [ ] Verify notifications sent (email/SMS)

---

## 🎬 KỊCH BẢN DEMO (Suggested Order)

### Demo Order 1: Infrastructure First
1. Show Redis + RabbitMQ running (Management UI)
2. Show all services health checks (green status)
3. Demo Flow 1 (Patient Registration) - Full user journey
4. Demo Flow 3 (Check-in/Queue) - Real-time queue
5. Demo Flow 4 (Billing) - Payment processing
6. Show event flow in RabbitMQ (messages published/consumed)

### Demo Order 2: User Journey Focus
1. Flow 2 (Staff Onboarding) - Admin creates doctor
2. Flow 1 (Patient Registration) - Patient registers và books appointment
3. Flow 3 (Check-in/Queue) - Patient check-in và queue management
4. Flow 5 (Clinical EMR) - Doctor creates medical record
5. Flow 4 (Billing) - Patient pays invoice
6. Show notifications sent throughout journey

---

## 📞 SUPPORT & CONTACT

**Development Team**: Hospital Management Team
**Documentation Version**: 2.0 (Final Corrected)
**Last Verified**: 2025-11-15

**Verified From**:
- docker-compose.v2.yml (authoritative port source)
- .env.local configuration
- Service source code (main.ts/index.ts files)
- ReminderScheduler.ts implementation

**Critical Fixes Applied**:
- ✅ All service ports corrected from codebase
- ✅ Infrastructure ports verified (Redis 6379, RabbitMQ 5672/15672)
- ✅ Reminder system documented (cron jobs, not separate service)
- ✅ Known issues documented (findByScheduledTimeRange TODO)

---

**🎉 GOOD LUCK WITH YOUR DEMO! 🎉**
