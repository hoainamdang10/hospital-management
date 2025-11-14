# 🏥 Hospital Management System - Authentication Flow Documentation

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Authentication Architecture](#-authentication-architecture)
3. [User Roles & Permissions](#-user-roles--permissions)
4. [Data Validation Rules](#-data-validation-rules)
5. [Event-Driven Architecture](#-event-driven-architecture)
6. [Registration Flows](#-registration-flows)
7. [Authentication Flows](#-authentication-flows)
8. [Token Management](#-token-management)
9. [Service Integration](#-service-integration)
10. [Testing Procedures](#-testing-procedures)
11. [Troubleshooting Guide](#-troubleshooting-guide)

---

## 🏗️ System Overview

### **Microservices Architecture**

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │ Identity Service│
│  (localhost:3000)│───▶│ (localhost:3101)│───▶│ (localhost:3001)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐           │
                       │ Supabase Auth   │◀──────────┘
                       │    Database     │
                       └─────────────────┘
```

### **Core Services**
- **Identity Service** (port 3001): Authentication, authorization, user management
- **Patient Service** (port 3003): Patient profile management
- **Provider Service** (port 3002): Doctor/staff management  
- **Appointment Service** (port 3004): Appointment scheduling
- **API Gateway** (port 3101): Request routing and session management

---

## 🔐 Authentication Architecture

### **Technology Stack**
- **Primary Auth**: Supabase Authentication (JWT-based)
- **Session Management**: HTTP-only cookies + API Gateway
- **Authorization**: Role-Based Access Control (RBAC)
- **Token Storage**: Redis (for session caching)
- **Password Hashing**: Bcrypt (10 rounds)

### **Authentication Flow**
```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Identity
    participant Supabase
    
    Client->>Gateway: Login Request
    Gateway->>Identity: Forward with headers
    Identity->>Supabase: Validate credentials
    Supabase-->>Identity: JWT tokens
    Identity-->>Gateway: User profile + tokens
    Gateway-->>Client: Set HTTP-only cookie
```

---

## 👥 User Roles & Permissions

### **Healthcare Role Hierarchy**

| Role | Vietnamese | Description | Key Permissions |
|------|------------|-------------|-----------------|
| **ADMIN** | Quản trị viên | System administrator | Full system access |
| **DOCTOR** | Bác sĩ | Medical practitioner | Patient records, prescriptions, appointments |
| **NURSE** | Y tá | Nursing staff | Patient care, medication dispensing |
| **RECEPTIONIST** | Lễ tân | Front desk staff | Appointments, billing, registration |
| **PATIENT** | Bệnh nhân | Patient users | Own records, appointments |

### **Role-Based Access Control (RBAC)**

```typescript
// Role metadata stored in database
interface HealthcareRole {
  type: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT';
  name: string;
  nameVietnamese: string;
  description: string;
  isActive: boolean;
  hasHIPAATraining: boolean;
}

// Permissions loaded dynamically from database
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}
```

---

## 🔄 Event-Driven Architecture

### **Overview**

The authentication system uses **Event-Driven Architecture** with **Outbox Pattern** to ensure reliable cross-service communication:

```mermaid
sequenceDiagram
    participant Client
    participant Identity
    participant Outbox
    participant RabbitMQ
    participant Services

    Client->>Identity: Registration/Login
    Identity->>Outbox: Store Event (PENDING)
    Identity-->>Client: Response
    
    Note over Outbox: Background Process (5s intervals)
    Outbox->>RabbitMQ: Publish Event
    Outbox->>Database: Status PUBLISHED
    
    Note over Services: Event Consumers
    RabbitMQ->>Services: Process Events
    Services->>Database: Update Records
```

### **Outbox Pattern Implementation**

#### **Event Lifecycle States**

| Status | Description | Next State |
|--------|-------------|------------|
| **PENDING** | Event stored, waiting to publish | PUBLISHING |
| **PUBLISHING** | Being processed by background job | PUBLISHED/FAILED |
| **PUBLISHED** | Successfully sent to RabbitMQ | Complete |
| **FAILED** | Max retries exceeded | DLQ |

#### **Database Tables**

```sql
-- Event Outbox (Identity Service)
CREATE TABLE auth_schema.event_outbox (
  outbox_id UUID PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  aggregate_id VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  routing_key VARCHAR(255),
  status VARCHAR(50) DEFAULT 'PENDING',
  publish_attempts INTEGER DEFAULT 0,
  publishing_error TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event Inbox (Consumer Services)
CREATE TABLE auth_schema.event_inbox (
  inbox_id UUID PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Registration Event Flow**

#### **Patient Registration Flow**

```mermaid
sequenceDiagram
    participant Client
    participant Identity
    participant Database
    participant Outbox
    participant RabbitMQ
    participant PatientService

    Note over Client,Database: 1. Registration Request
    Client->>Identity: POST /api/auth/register
    Identity->>Database: Store in pending_registrations
    Identity->>Outbox: Store PendingRegistrationCreatedEvent (PENDING)
    Identity-->>Client: 201 - Registration pending

    Note over Outbox,RabbitMQ: 2. Event Publishing
    Outbox->>RabbitMQ: Publish PendingRegistrationCreatedEvent
    Outbox->>Database: Update status to PUBLISHED

    Note over Client,Database: 3. Email Verification
    Client->>Identity: GET /api/auth/verify-email?token=jwt
    Identity->>Database: Find pending registration
    Identity->>Database: Create user in auth.users
    Identity->>Outbox: Store UserCreatedEvent (PENDING)
    Identity->>Outbox: Store UserActivatedEvent (PENDING)
    Identity->>Database: Delete pending registration
    Identity-->>Client: 200 - Email verified

    Note over Outbox,PatientService: 4. User Creation Events
    Outbox->>RabbitMQ: Publish UserCreatedEvent
    Outbox->>RabbitMQ: Publish UserActivatedEvent
    RabbitMQ->>PatientService: user.created event (log only)
    RabbitMQ->>PatientService: user.activated event
    PatientService->>Database: Create patient record
```

#### **Doctor/Staff Registration Flow**

```mermaid
sequenceDiagram
    participant Admin
    participant Identity
    participant Database
    participant Outbox
    participant RabbitMQ
    participant ProviderService

    Note over Admin,Database: 1. Admin Creates Staff
    Admin->>Identity: POST /api/admin/users (ADMIN auth)
    Identity->>Database: Create user in auth.users
    Identity->>Outbox: Store UserCreatedEvent (PENDING)
    Identity-->>Admin: 201 - Staff user created

    Note over Outbox,ProviderService: 2. Staff Profile Creation
    Outbox->>RabbitMQ: Publish UserCreatedEvent
    RabbitMQ->>ProviderService: user.created event
    ProviderService->>Database: Create staff profile
```

### **Event Types & Routing**

#### **Domain Events**

| Event | Trigger | Consumers | Purpose |
|-------|---------|-----------|---------|
| **PendingRegistrationCreatedEvent** | User registration | Notification Service | Send verification email |
| **UserCreatedEvent** | User creation (admin or verification) | Patient, Provider, Notification | Create service profiles |
| **UserActivatedEvent** | Email verification (patients only) | Patient Service | Create patient record |
| **UserUpdatedEvent** | Profile updates | Patient, Provider | Sync service records |
| **UserDeletedEvent** | Account deletion | Patient, Provider | Cleanup service records |

#### **RabbitMQ Configuration**

```typescript
// Exchange: hospital.events (topic exchange)
const routingKeys = {
  'pending.registration.created': 'identity.pending.registration.created',
  'user.created': 'identity.user.created',
  'user.activated': 'identity.user.activated',
  'user.updated': 'identity.user.updated',
  'user.deleted': 'identity.user.deleted'
};

// Queue Bindings:
const queueBindings = {
  'patient-service-queue': [
    'identity.user.created',
    'identity.user.activated',
    'identity.user.updated',
    'identity.user.deleted'
  ],
  'provider-service-queue': [
    'identity.user.created',
    'identity.user.updated',
    'identity.user.deleted'
  ],
  'notification-service-queue': [
    'identity.pending.registration.created',
    'identity.user.created',
    'identity.user.activated'
  ]
};
```

### **Consumer Logic**

#### **Patient Service Consumer**

```typescript
class IdentityEventConsumer {
  async handleEvent(event) {
    switch(event.type) {
      case 'user.created':
        if (event.role === 'PATIENT') {
          // Log only - wait for activation
          this.logger.info('Patient created, waiting for email verification');
        }
        break;
        
      case 'user.activated':
        if (event.role === 'PATIENT') {
          // Create patient record
          await this.createPatientRecord(event);
        }
        break;
        
      case 'user.updated':
        // Sync patient profile updates
        await this.updatePatientRecord(event);
        break;
        
      case 'user.deleted':
        // Deactivate patient record
        await this.deactivatePatientRecord(event.userId);
        break;
    }
  }
}
```

#### **Provider Service Consumer**

```typescript
class IdentityEventConsumer {
  async handleEvent(event) {
    switch(event.type) {
      case 'user.created':
        if (['DOCTOR', 'NURSE'].includes(event.role)) {
          // Create staff profile immediately
          await this.createStaffProfile(event);
        }
        break;
        
      case 'user.updated':
        // Sync staff profile updates
        await this.updateStaffProfile(event);
        break;
        
      case 'user.deleted':
        // Terminate staff employment
        await this.terminateStaffEmployment(event.userId);
        break;
    }
  }
}
```

### **Reliability Guarantees**

#### **Idempotency**

```typescript
// Consumers check for existing records before creation
const existingPatient = await this.patientRepository.findByUserId(event.userId);
if (existingPatient) {
  this.logger.warn('Patient already exists - skipping duplicate event');
  return;
}
```

#### **Error Handling & Recovery**

```typescript
// Background Publishing Process
async processOutboxEvents() {
  const events = await this.outboxService.findPendingEvents();
  
  for (const event of events) {
    try {
      await this.outboxService.updateStatus(event.id, 'PUBLISHING');
      await this.rabbitMQ.publish(event.routingKey, event.payload);
      await this.outboxService.updateStatus(event.id, 'PUBLISHED');
    } catch (error) {
      if (event.publishAttempts >= 3) {
        await this.outboxService.updateStatus(event.id, 'FAILED');
        await this.deadLetterQueue.add(event);
      } else {
        await this.outboxService.incrementAttempts(event.id);
        // Retry in next cycle
      }
    }
  }
}
```

#### **Monitoring Metrics**

```typescript
// Key Metrics to Monitor
const metrics = {
  'outbox_events_total': {
    labels: ['status'], // pending, publishing, published, failed
    type: 'counter'
  },
  'event_publish_duration_seconds': {
    type: 'histogram'
  },
  'events_consumed_total': {
    labels: ['service', 'event_type'],
    type: 'counter'
  },
  'event_processing_duration_seconds': {
    type: 'histogram'
  }
};
```

---

## 📝 Registration Flows

### **Progressive Profiling Architecture**

#### **🏗️ Two-Phase Registration Design**

**Phase 1: Quick Registration (Email Verification Only)**
```sql
Registration → PendingRegistrationCreatedEvent → Email Verification 
→ UserCreatedEvent (tracking) → UserActivatedEvent → Minimal Patient Creation
```

**Phase 2: Profile Completion (Post-Login)**
```sql
Login → Profile Update → PatientUpdatedEvent → Cross-Service Synchronization
```

#### **🎯 Intentional Data Flow**

| Step | Event | Patient Data | Purpose |
|------|-------|--------------|---------|
| **Registration** | UserActivatedEvent | Minimal (temp name, empty fields) | Fast onboarding |
| **Profile Update** | PatientUpdatedEvent | Complete (full info) | Data completion |
| **Cross-Services** | Event Consumers | Synchronized | Consistency |

**✅ This is INTENTIONAL DESIGN - Not a bug!**

### **Patient Self-Registration**

**Endpoint**: `POST /api/auth/register`

#### **🔍 CRITICAL DATA REQUIREMENTS**

**Required Fields for Registration:**
```json
{
  "email": "patient@hospital.vn",           // ✅ REQUIRED - Must be valid email format
  "password": "Patient@123456",             // ✅ REQUIRED - Min 8 chars, 1 uppercase, 1 number, 1 special
  "fullName": "Nguyễn Văn An",               // ✅ REQUIRED - Vietnamese name with proper encoding
  "phoneNumber": "0912345678",               // ✅ REQUIRED - Vietnamese mobile format
  "citizenId": "123456789012",               // ✅ REQUIRED - 12-digit Vietnamese ID
  "dateOfBirth": "1990-01-01",               // ✅ REQUIRED - ISO date format
  "gender": "MALE",                          // ✅ REQUIRED - MALE|FEMALE|OTHER
  "address": "123 Nguyễn Huệ, Q1, TP.HCM"    // ✅ REQUIRED - Vietnamese address format
}
```

**🎯 IMPORTANT NOTES:**
- **fullName**: Vietnamese characters supported (UTF-8 encoding)
- **phoneNumber**: Must start with 09, 03, 07, or 08 (Vietnamese mobile)
- **citizenId**: Exactly 12 digits, no spaces or dashes
- **dateOfBirth**: Patient must be 18+ years old
- **address**: Full Vietnamese address format

**📊 Event Data Flow:**
```
Registration Data → UserActivatedEvent.eventData → Patient Registry
fullName: "Nguyễn Văn An" → fullName: "Nguyễn Văn An" → personalInfo.fullName: "Nguyễn Văn An"
```

**Security Features**:
```json
{
  "success": true,
  "pendingRegistrationId": "uuid-here",
  "email": "patient@hospital.vn",
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Link xác thực có hiệu lực trong 24 giờ.",
  "requiresEmailVerification": true
}
```

### **Profile Update Flow (Phase 2)**

**Endpoint**: `PUT /api/v1/patients/:patientId`

**Purpose**: Complete patient profile after login with full information

**Request Body**:
```json
{
  "personalInfo": {
    "fullName": "Nguyễn Văn An",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "nationalId": "123456789012",
    "nationality": "Việt Nam",
    "ethnicity": "Kinh",
    "occupation": "Nhân viên văn phòng",
    "maritalStatus": "married"
  },
  "contactInfo": {
    "primaryPhone": "0912345678",
    "secondaryPhone": "0909876543",
    "email": "patient.test@example.com",
    "preferredContactMethod": "phone",
    "address": {
      "street": "123 Nguyễn Huệ",
      "ward": "Phường Bến Nghé",
      "district": "Quận 1",
      "city": "TP. Hồ Chí Minh",
      "province": "TP. Hồ Chí Minh",
      "postalCode": "700000",
      "country": "Việt Nam"
    }
  },
  "basicMedicalInfo": {
    "bloodType": "O+",
    "knownAllergies": ["Penicillin", "Đạm sữa"],
    "emergencyMedicalInfo": "Không có bệnh nền nghiêm trọng"
  },
  "insuranceInfo": {
    "provider": "Bảo hiểm Xã hội Việt Nam",
    "policyNumber": "BHYT123456789",
    "groupNumber": "VN001",
    "validFrom": "2024-01-01",
    "validTo": "2025-12-31"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cập nhật thông tin bệnh nhân thành công"
}
```

**Events Triggered**:
- ✅ `PatientUpdatedEvent` → Published to all services
- ✅ Cross-service synchronization (Provider Staff, Appointments, etc.)

---

## 🧪 Complete Testing Guide

### **📋 Test Commands for Patient Registration & Profile Flow**

#### **1. Patient Registration (Phase 1)**
```powershell
# Step 1: Register Patient Account
$body = @{
    email = "patient.test@example.com"
    password = "Patient@123456"
    fullName = "Nguyễn Văn An"
    phoneNumber = "0912345678"
    citizenId = "123456789012"
    dateOfBirth = "1990-01-01"
    gender = "MALE"
    address = "123 Nguyễn Huệ, Q1, TP.HCM"
} | ConvertTo-Json -Depth 10

$registrationResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -Body $body -ContentType "application/json"
$registrationResponse
```

**Expected Response**:
```json
{
  "success": true,
  "pendingRegistrationId": "91318809-fd53-4f36-8e7e-a4c8138b8c59",
  "email": "patient.test@example.com",
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  "requiresEmailVerification": true
}
```

#### **2. Email Verification**
```powershell
# Step 2: Get Verification Token from Database
# (Manual step for testing - check auth_schema.pending_registrations)

# Step 3: Verify Email
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdGllbnQudGVzdEBleGFtcGxlLmNvbSIsInVzZXJJZCI6InBlbmRpbmciLCJ0eXBlIjoiZW1haWxfdmVyaWZpY2F0aW9uIiwiZXhwIjoxNzYzMTgyNTA2LCJpYXQiOjE3NjMwOTYxMDZ9.GHZqdAM1c9Fl766oh2x5CNyx2_RuCHFzY_yKJsioh_k"

$verificationResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/verify-email?token=$token" -Method Get
$verificationResponse
```

**Expected Response**:
```json
{
  "success": true,
  "userId": "5243ee89-dbab-4843-a14b-c00fc99f2c37",
  "email": "patient.test@example.com",
  "message": "Email đã được xác thực thành công!"
}
```

#### **🔍 VERIFICATION TESTING CHECKLIST**

**Step 2A - Verify Token in Database:**
```sql
-- Check pending registration exists
SELECT id, email, verification_token, expires_at, status 
FROM auth_schema.pending_registrations 
WHERE email = 'patient.test@example.com';

-- Expected: status = 'PENDING', expires_at > NOW()
```

**Step 2B - Verify User Creation:**
```sql
-- Check user created in auth.users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'patient.test@example.com';

-- Expected: email_confirmed_at NOT NULL
```

**Step 2C - Verify Profile Creation:**
```sql
-- Check user profile created with fullName
SELECT user_id, full_name, phone_number, created_at 
FROM auth_schema.user_profiles 
WHERE user_id = '5243ee89-dbab-4843-a14b-c00fc99f2c37';

-- Expected: full_name = 'Nguyễn Văn An' (from registration)
```

**Step 2D - Verify Event Publishing:**
```sql
-- Check events published to outbox
SELECT event_type, status, payload->'eventData'->>'fullName' as fullName
FROM auth_schema.event_outbox 
WHERE aggregate_id = '5243ee89-dbab-4843-a14b-c00fc99f2c37'
ORDER BY created_at;

-- Expected: 
-- 1. UserCreatedEvent (status = PUBLISHED)
-- 2. UserActivatedEvent (status = PUBLISHED, fullName = 'Nguyễn Văn An')
```

**Step 2E - Verify Patient Record Creation:**
```sql
-- Check patient record created with correct fullName
SELECT patient_id, user_id, personal_info->>'fullName' as fullName, email, status
FROM patient_schema.patients 
WHERE user_id = '5243ee89-dbab-4843-a14b-c00fc99f2c37';

-- Expected: fullName = 'Nguyễn Văn An', status = 'active'
```

**Step 2F - Verify Service Logs:**
```bash
# Check Identity Service logs
tail -f backend/services-v2/identity-service/logs/app.log | grep "Email verified"

# Check Patient Registry logs  
tail -f backend/services-v2/patient-registry-service/logs/app.log | grep "Creating patient from user event"

# Expected: 
# Identity: "Email verified successfully for user: 5243ee89..."
# Patient: "Creating patient from user event { fullName: 'Nguyễn Văn An', userId: '5243ee89...' }"
```

**🚨 VERIFICATION FAILURE DIAGNOSTICS:**

| Test Step | Failure Symptom | Root Cause | Fix |
|-----------|-----------------|------------|-----|
| **Token Invalid** | 400/403 HTTP error | Token expired or malformed | Register again |
| **User Not Created** | No auth.users row | Database error or constraint violation | Check identity service logs |
| **Profile Missing** | No user_profiles row | Profile creation failed | Check database permissions |
| **Events Not Published** | outbox status = PENDING | RabbitMQ connection down | Restart RabbitMQ service |
| **Wrong fullName** | Patient has email prefix | Event data mapping error | Check event consumer code |
| **Patient Not Created** | No patient_schema.patients row | Event consumer error | Check patient service logs |

**✅ COMPLETE VERIFICATION SUCCESS:**
- ✅ HTTP 200 from verification endpoint
- ✅ User in auth.users with email_confirmed_at
- ✅ Profile in auth_schema.user_profiles with correct fullName
- ✅ Both events in outbox with status = PUBLISHED
- ✅ Patient record with correct personalInfo.fullName
- ✅ No errors in either service log

---

#### **3. Patient Login**
```powershell
# Step 4: Login to Get JWT Token
$loginBody = @{
    email = "patient.test@example.com"
    password = "Patient@123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$loginResponse

# Extract JWT Token for subsequent requests
$jwtToken = $loginResponse.token
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...}",
  "user": {
    "id": "5243ee89-dbab-4843-a14b-c00fc99f2c37",
    "email": "patient.test@example.com",
    "role": "PATIENT"
  }
}
```

#### **4. Get Current Patient Profile (Minimal Data)**
```powershell
# Step 5: Check Initial Patient Profile
$headers = @{
    "Authorization" = "Bearer $jwtToken"
}

$patientProfile = Invoke-RestMethod -Uri "http://localhost:3003/api/v1/patients/me" -Method Get -Headers $headers
$patientProfile
```

**Expected Response (Minimal Data)**:
```json
{
  "success": true,
  "data": {
    "patientId": "PAT-202511-921",
    "userId": "5243ee89-dbab-4843-a14b-c00fc99f2c37",
    "personalInfo": {
      "fullName": "patient.test",
      "dateOfBirth": "2000-01-01",
      "gender": "other",
      "nationalId": ""
    },
    "contactInfo": {
      "primaryPhone": "",
      "email": "patient.test@example.com"
    }
  }
}
```

#### **5. Update Patient Profile (Phase 2 - Complete Data)**
```powershell
# Step 6: Update Complete Patient Profile
$updateBody = @{
    personalInfo = @{
        fullName = "Nguyễn Văn An"
        dateOfBirth = "1990-01-01"
        gender = "male"
        nationalId = "123456789012"
        nationality = "Việt Nam"
        ethnicity = "Kinh"
        occupation = "Nhân viên văn phòng"
        maritalStatus = "married"
    }
    contactInfo = @{
        primaryPhone = "0912345678"
        secondaryPhone = "0909876543"
        email = "patient.test@example.com"
        preferredContactMethod = "phone"
        address = @{
            street = "123 Nguyễn Huệ"
            ward = "Phường Bến Nghé"
            district = "Quận 1"
            city = "TP. Hồ Chí Minh"
            province = "TP. Hồ Chí Minh"
            postalCode = "700000"
            country = "Việt Nam"
        }
    }
    basicMedicalInfo = @{
        bloodType = "O+"
        knownAllergies = @("Penicillin", "Đạm sữa")
        emergencyMedicalInfo = "Không có bệnh nền nghiêm trọng"
    }
    insuranceInfo = @{
        provider = "Bảo hiểm Xã hội Việt Nam"
        policyNumber = "BHYT123456789"
        groupNumber = "VN001"
        validFrom = "2024-01-01"
        validTo = "2025-12-31"
    }
} | ConvertTo-Json -Depth 10

$updateResponse = Invoke-RestMethod -Uri "http://localhost:3003/api/v1/patients/PAT-202511-921" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers
$updateResponse
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Cập nhật thông tin bệnh nhân thành công"
}
```

#### **6. Verify Updated Profile & Event Publishing**
```powershell
# Step 7: Check Updated Patient Profile
$updatedProfile = Invoke-RestMethod -Uri "http://localhost:3003/api/v1/patients/me" -Method Get -Headers $headers
$updatedProfile

# Step 8: Check Event Publishing in Database
# (Use MCP Supabase to check event_outbox table)
SELECT * FROM auth_schema.event_outbox 
WHERE event_type = 'PatientUpdatedEvent' 
ORDER BY created_at DESC LIMIT 3;
```

**Expected Updated Profile**:
```json
{
  "success": true,
  "data": {
    "patientId": "PAT-202511-921",
    "personalInfo": {
      "fullName": "Nguyễn Văn An",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "nationalId": "123456789012",
      "nationality": "Việt Nam"
    },
    "contactInfo": {
      "primaryPhone": "0912345678",
      "email": "patient.test@example.com",
      "address": {
        "street": "123 Nguyễn Huệ",
        "city": "TP. Hồ Chí Minh",
        "district": "Quận 1"
      }
    },
    "basicMedicalInfo": {
      "bloodType": "O+",
      "knownAllergies": ["Penicillin", "Đạm sữa"]
    }
  }
}
```

### **🔍 Database Verification Commands**

#### **Check Registration Flow Events**
```sql
-- Check Pending Registration
SELECT * FROM auth_schema.pending_registrations 
WHERE email = 'patient.test@example.com';

-- Check User Creation
SELECT id, email, created_at FROM auth.users 
WHERE email = 'patient.test@example.com';

-- Check Patient Creation
SELECT * FROM patient_schema.patients 
WHERE user_id = '5243ee89-dbab-4843-a14b-c00fc99f2c37';

-- Check Event Publishing
SELECT event_type, status, published_at, payload->'eventData' 
FROM auth_schema.event_outbox 
WHERE aggregate_id = '5243ee89-dbab-4843-a14b-c00fc99f2c37'
ORDER BY created_at;
```

#### **Check Profile Update Events**
```sql
-- Check PatientUpdatedEvent after profile update
SELECT event_type, status, published_at, 
       payload->'eventData'->>'patientId' as patient_id,
       payload->'eventData'->>'updatedFields' as updated_fields
FROM auth_schema.event_outbox 
WHERE event_type = 'PatientUpdatedEvent'
ORDER BY created_at DESC LIMIT 5;
```

### **✅ Expected Test Results**

| Step | Expected Outcome | Verification |
|------|------------------|--------------|
| **1. Registration** | Success with pending ID | Response + Database |
| **2. Email Verification** | User created in auth.users | auth.users table |
| **3. Patient Creation** | Minimal patient record | patient_schema.patients |
| **4. Login** | JWT token returned | Token validation |
| **5. Initial Profile** | Minimal data (temp name) | API response |
| **6. Profile Update** | Full data updated | API response |
| **7. Event Publishing** | PatientUpdatedEvent published | event_outbox table |
| **8. Cross-Services** | All services synced | Service health checks |

**🎯 This testing flow validates the complete Progressive Profiling architecture!**

### **Doctor/Staff Registration (Admin Only)**

**Endpoint**: `POST /api/admin/users` (requires ADMIN role)

**Request Body**:
```json
{
  "email": "doctor@hospital.vn",
  "password": "Doctor@123456",
  "fullName": "Dr. Tran Van B",
  "roleType": "DOCTOR",
  "department": "GENERAL",
  "licenseNumber": "MD123456",
  "specializations": ["INTERNAL_MEDICINE"]
}
```

### **Email Verification**

**Endpoint**: `GET /api/auth/verify-email?token=jwt-token`

#### **🔍 VERIFICATION PROCESS FLOW**

**Step-by-Step Process:**
```mermaid
sequenceDiagram
    participant Client
    participant Identity
    participant Database
    participant Outbox
    participant RabbitMQ
    participant PatientService

    Client->>Identity: GET /api/auth/verify-email?token=jwt
    Identity->>Database: Find pending registration by token
    Identity->>Database: Validate token (24-hour expiry)
    Identity->>Database: Create user in auth.users
    Identity->>Database: Create user profile in auth_schema.user_profiles
    Identity->>Outbox: Store UserCreatedEvent (PENDING)
    Identity->>Outbox: Store UserActivatedEvent (PENDING)
    Identity->>Database: Delete from pending_registrations
    Identity-->>Client: 200 - Email verified successfully
    
    Note over Outbox: Background Process (5s intervals)
    Outbox->>RabbitMQ: Publish UserCreatedEvent
    Outbox->>RabbitMQ: Publish UserActivatedEvent
    Outbox->>Database: Update status to PUBLISHED
    
    Note over PatientService: Event Consumer Processing
    RabbitMQ->>PatientService: user.created event (log only)
    RabbitMQ->>PatientService: user.activated event
    PatientService->>Database: Create patient record with fullName
```

**🎯 CRITICAL VERIFICATION REQUIREMENTS:**

**Token Structure:**
```json
{
  "email": "patient@hospital.vn",
  "userId": "pending",           // Special value for pending registrations
  "type": "email_verification",  // Token type identifier
  "exp": 1763188504,             // 24-hour expiry timestamp
  "iat": 1763102104              // Issued at timestamp
}
```

**Event Data Validation:**
```json
// UserActivatedEvent.payload.eventData
{
  "userId": "cf84955d-49ba-462d-807a-685ca82a8837",    // Real UUID after verification
  "email": "patient@hospital.vn",
  "fullName": "Nguyễn Văn An",                         // ✅ From registration data
  "activatedAt": "2025-11-14T06:35:24.039Z"
}
```

**🔧 VERIFICATION CHECKLIST:**

| Check | Expected | How to Verify |
|-------|----------|---------------|
| **Token Valid** | Not expired, valid signature | Try verification endpoint |
| **User Created** | auth.users row exists | `SELECT id, email FROM auth.users WHERE email = 'test@example.com'` |
| **Profile Created** | auth_schema.user_profiles row exists | `SELECT full_name FROM auth_schema.user_profiles WHERE user_id = 'uuid'` |
| **Events Published** | UserCreatedEvent + UserActivatedEvent in outbox | `SELECT event_type FROM auth_schema.event_outbox WHERE aggregate_id = 'uuid'` |
| **Patient Record** | patient_schema.patients row with correct fullName | `SELECT personal_info->>'fullName' FROM patient_schema.patients WHERE user_id = 'uuid'` |
| **Event Consumer** | Patient Service logs show event processing | Check service logs for "Creating patient from user event" |

**🚨 COMMON VERIFICATION ISSUES:**

| Issue | Symptoms | Fix |
|-------|----------|-----|
| **Token Expired** | 400/403 error on verification | Register again with new email |
| **Event Not Published** | User created but no patient record | Check RabbitMQ connection and outbox status |
| **Wrong Event Data** | Patient record has wrong fullName | Verify `event.payload.eventData` structure in consumer |
| **Consumer Error** | Events in DLQ (Dead Letter Queue) | Check service logs for parsing errors |

**✅ SUCCESS INDICATORS:**
- ✅ HTTP 200 response from verification endpoint
- ✅ User exists in `auth.users` with `email_confirmed_at` not null
- ✅ Profile exists in `auth_schema.user_profiles` with correct `full_name`
- ✅ Events published to RabbitMQ (status = PUBLISHED)
- ✅ Patient record created with correct `personalInfo.fullName`
- ✅ No errors in service logs

**Process**:
1. User clicks verification link in email
2. Token validated (24-hour expiry)
3. User moved from `pending_registrations` to `auth.users`
4. Profile created in `auth_schema.user_profiles` with fullName
5. `UserCreatedEvent` and `UserActivatedEvent` published
6. Patient profile created in Patient Service using event data
7. Welcome email sent (if configured)

---

## 🔑 Authentication Flows

### **Standard Login**

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@hospital.vn",
  "password": "User@123456",
  "mfaCode": "123456", // Optional - if MFA enabled
  "deviceInfo": {
    "platform": "web",
    "browser": "chrome",
    "version": "91.0"
  }
}
```

**Response**:
```json
{
  "success": true,
  "userId": "user-uuid",
  "accessToken": "supabase-jwt-token",
  "refreshToken": "supabase-refresh-token",
  "roles": ["DOCTOR"],
  "permissions": ["patient.read", "appointment.create"],
  "expiresAt": "2024-12-15T10:00:00Z",
  "mode": "FULL_SERVICE"
}
```

### **Session Management**

**Cookie Settings**:
```typescript
// HTTP-only session cookie (set by API Gateway)
res.cookie('session_token', accessToken, {
  httpOnly: true,           // Prevents XSS attacks
  secure: false,            // false for localhost (no HTTPS)
  sameSite: 'lax',          // CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/'
});
```

### **Token Refresh**

**Automatic Process**:
1. Client includes refresh token in request
2. Identity Service validates with Supabase
3. New access token issued
4. Session cookie updated

---

## 🔄 Token Management

### **JWT Token Structure**

```json
{
  "aud": "authenticated",
  "exp": 1763093187,
  "sub": "user-uuid",
  "email": "user@hospital.vn",
  "role": "authenticated", // Supabase default
  "app_metadata": {
    "role": "DOCTOR",       // Custom business role
    "department": "GENERAL",
    "provider": "email"
  },
  "user_metadata": {
    "full_name": "Dr. Tran Van B",
    "phone_number": "0901234567"
  },
  "session_id": "session-uuid"
}
```

### **Authorization Header Format**

```typescript
// For service-to-service communication
headers: {
  "Authorization": "Bearer supabase-jwt-token"
}

// For browser requests (handled by API Gateway)
// Cookie: session_token=supabase-jwt-token; HttpOnly
```

---

## 🔗 Service Integration

### **Cross-Service Authentication**

Each service validates tokens via Identity Service:

```typescript
// Appointment Service Example
class AppointmentController {
  async listAppointments(req: AuthenticatedRequest) {
    // 1. Extract token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // 2. Validate with Identity Service
    const user = await this.identityService.validateToken(token);
    
    // 3. Check role-based permissions
    if (!this.authorizationService.canViewAppointments(user.roles)) {
      throw new AuthorizationError('Insufficient permissions');
    }
    
    // 4. Execute business logic
    return await this.listAppointmentsUseCase.execute(request, user);
  }
}
```

### **Service Dependencies**

| Service | Auth Required | Role Check | Dependencies |
|---------|---------------|------------|--------------|
| **Appointment** | ✅ Required | DOCTOR/NURSE/RECEPTIONIST | Identity, Patient, Provider |
| **Patient** | ✅ Required | DOCTOR/NURSE/PATIENT | Identity |
| **Provider** | ✅ Required | ADMIN/DOCTOR/NURSE | Identity |
| **Identity** | ❌ None | N/A | Supabase |

### **Service Endpoints**

| Service | Base Path | Example Endpoints |
|---------|-----------|-------------------|
| **Identity Service** | `/api/auth` | `/api/auth/login`, `/api/auth/register` |
| **Patient Service** | `/api/v1/patients` | `/api/v1/patients/me`, `/api/v1/patients/search` |
| **Provider Service** | `/api/v1/staff` | `/api/v1/staff/me`, `/api/v1/staff/search` |
| **Appointment Service** | `/api/v1` | `/api/v1/appointments`, `/api/v1/appointments/me` |

---

## 🧪 Testing Procedures

### **1. Test Event-Driven Registration Flow**

#### **Patient Registration with Events**

```bash
# Step 1: Register Patient (creates pending registration)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.vn",
    "password": "Patient@123456",
    "fullName": "Test Patient",
    "phoneNumber": "0901234567"
  }'

# Step 2: Check pending registration in database
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT id, email, status, expires_at 
FROM auth_schema.pending_registrations 
WHERE email = 'patient@test.vn';
"

# Step 3: Check outbox events
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT event_type, status, routing_key 
FROM auth_schema.event_outbox 
WHERE event_type = 'PendingRegistrationCreatedEvent';
"

# Step 4: Verify email (creates user + events)
curl -X GET "http://localhost:3001/api/auth/verify-email?token=JWT_TOKEN"

# Step 5: Check user creation
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'patient@test.vn';
"

# Step 6: Check user creation events
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT event_type, status, payload 
FROM auth_schema.event_outbox 
WHERE aggregate_id = (SELECT id FROM auth.users WHERE email = 'patient@test.vn');
"

# Step 7: Check patient record creation
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT id, user_id, email, created_at 
FROM patient_schema.patients 
WHERE email = 'patient@test.vn';
"
```

#### **Doctor Registration with Events**

```bash
# Step 1: Create Doctor User (admin creates directly)
curl -X POST http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.vn",
    "password": "Doctor@123456",
    "fullName": "Dr. Test Doctor",
    "roleType": "DOCTOR",
    "department": "GENERAL"
  }'

# Step 2: Check user creation
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT id, email, app_metadata 
FROM auth.users 
WHERE email = 'doctor@test.vn';
"

# Step 3: Check staff profile creation
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT id, user_id, staff_id, full_name, staff_type 
FROM provider_schema.staff 
WHERE email = 'doctor@test.vn';
"
```

### **2. Test Event Publishing & Consumption**

#### **Monitor RabbitMQ Events**

```bash
# Install RabbitMQ Management
docker exec -it rabbitmq rabbitmq-plugins enable rabbitmq_management

# Access Management UI
# URL: http://localhost:15672
# Username: admin, Password: admin

# Check queues
curl -u admin:admin http://localhost:15672/api/queues

# Check messages in patient-service-queue
curl -u admin:admin http://localhost:15672/api/queues/%2f/patient-service-queue/get \
  -H "Content-Type: application/json" \
  -d '{"count":10,"requeue":false,"encoding":"auto"}'
```

#### **Test Event Consumer Idempotency**

```bash
# Publish duplicate events to test idempotency
docker exec -it rabbitmq rabbitmqadmin publish routing_key="identity.user.created" \
  payload='{"userId":"test-user-123","email":"test@duplicate.vn","role":"PATIENT"}'

# Check consumer logs for duplicate detection
docker logs patient-registry-service | grep "duplicate event"

# Verify only one patient record created
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT COUNT(*) as patient_count 
FROM patient_schema.patients 
WHERE user_id = 'test-user-123';
"
```

### **3. Test Outbox Pattern Recovery**

#### **Simulate RabbitMQ Failure**

```bash
# Stop RabbitMQ
docker stop rabbitmq

# Create user (events will be stuck in PENDING)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recovery@test.vn",
    "password": "Recovery@123456",
    "fullName": "Recovery Test"
  }'

# Check events stuck in PENDING status
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT event_type, status, publish_attempts 
FROM auth_schema.event_outbox 
WHERE status = 'PENDING';
"

# Restart RabbitMQ
docker start rabbitmq

# Wait for background process (5-10 seconds)
sleep 10

# Check events published successfully
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT event_type, status, published_at 
FROM auth_schema.event_outbox 
WHERE status = 'PUBLISHED';
"
```

### **4. Test Event Monitoring**

#### **Check Event Metrics**

```bash
# Access Identity Service metrics
curl http://localhost:3001/metrics | grep outbox

# Check Patient Service metrics
curl http://localhost:3003/metrics | grep event_consumed

# Check Provider Service metrics
curl http://localhost:3002/metrics | grep event_consumed
```

### **5. Create Test Users**

```bash
# Create Patient User
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.vn",
    "password": "Patient@123456",
    "fullName": "Test Patient",
    "phoneNumber": "0901234567"
  }'

# Create Doctor User (via Supabase Admin API)
curl -X POST https://your-project.supabase.co/auth/v1/admin/users \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.vn",
    "password": "Doctor@123456",
    "email_confirm": true,
    "app_metadata": {
      "role": "DOCTOR",
      "department": "GENERAL"
    },
    "user_metadata": {
      "full_name": "Dr. Test Doctor"
    }
  }'
```

### **2. Verify Email**

```bash
# Get verification token from pending registrations
# (Via database query or email link)

# Verify email
curl -X GET "http://localhost:3001/api/auth/verify-email?token=JWT_TOKEN"
```

### **3. Login Test**

```bash
# Patient Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.vn",
    "password": "Patient@123456"
  }'

# Doctor Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.vn",
    "password": "Doctor@123456"
  }'
```

### **4. Service Integration Test**

```bash
# Test Appointment Service with doctor token
curl -X GET "http://localhost:3004/api/v1/appointments?doctorId=test-doctor" \
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN"

# Test Patient Service with patient token  
curl -X GET "http://localhost:3003/api/v1/patients/me" \
  -H "Authorization: Bearer PATIENT_JWT_TOKEN"

# Test Provider Service with doctor token
curl -X GET "http://localhost:3002/api/v1/staff/me" \
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN"

# Test Appointment Service with user token
curl -X GET "http://localhost:3004/api/v1/appointments/me" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

---

## 🔧 Troubleshooting Guide

### **Event-Driven Architecture Issues**

#### **1. Events Stuck in PENDING Status**

**Symptoms:**
- User registration succeeds but no profiles created
- Events not being published to RabbitMQ
- Outbox table shows `status = 'PENDING'`

**Root Causes:**
- RabbitMQ connection lost
- Background publishing process not running
- Database transaction issues

**Solutions:**
```bash
# Check RabbitMQ connection
docker exec -it rabbitmq rabbitmqctl status

# Check outbox events
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT event_type, status, publish_attempts, publishing_error 
FROM auth_schema.event_outbox 
WHERE status = 'PENDING' 
ORDER BY created_at DESC;
"

# Restart Identity Service (reloads background process)
docker restart identity-service

# Manual retry (if needed)
docker exec -it postgres psql -U postgres -d hospital -c "
UPDATE auth_schema.event_outbox 
SET status = 'PENDING', publish_attempts = 0 
WHERE status = 'FAILED' AND publish_attempts < 3;
"
```

#### **2. Duplicate Patient/Staff Records**

**Symptoms:**
- Multiple patient records for same user
- Duplicate staff profiles
- Consumer logs showing "duplicate event" warnings

**Root Causes:**
- Event consumer not idempotent
- RabbitMQ message redelivery
- Network issues causing retries

**Solutions:**
```bash
# Check for duplicates
docker exec -it postgres psql -U postgres -d hospital -c "
SELECT user_id, COUNT(*) as count 
FROM patient_schema.patients 
GROUP BY user_id 
HAVING COUNT(*) > 1;
"

# Clean up duplicates (keep latest)
docker exec -it postgres psql -U postgres -d hospital -c "
DELETE FROM patient_schema.patients 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM patient_schema.patients 
  ORDER BY user_id, created_at DESC
);
"

# Check consumer idempotency logic
docker logs patient-registry-service | grep -A 5 -B 5 "duplicate"
```

#### **3. Events Not Consumed by Services**

**Symptoms:**
- Events published but not processed
- RabbitMQ queue backing up
- Service profiles not created

**Root Causes:**
- Service not running
- Event consumer not connected to RabbitMQ
- Queue binding issues

**Solutions:**
```bash
# Check service status
docker ps | grep -E "(patient|provider)-service"

# Check RabbitMQ queues
curl -u admin:admin http://localhost:15672/api/queues | jq '.[] | {name: .name, messages: .messages}'

# Check service logs for consumer errors
docker logs patient-registry-service | tail -50
docker logs provider-staff-service | tail -50

# Restart services
docker restart patient-registry-service provider-staff-service
```

#### **4. Event Processing Failures**

**Symptoms:**
- Events moved to Dead Letter Queue
- Consumer logs showing processing errors
- Incomplete data synchronization

**Root Causes:**
- Data validation errors
- Database constraint violations
- Service dependency issues

**Solutions:**
```bash
# Check Dead Letter Queue
curl -u admin:admin http://localhost:15672/api/queues/%2f/patient-service-queue.dlq/get \
  -H "Content-Type: application/json" \
  -d '{"count":10,"requeue":false,"encoding":"auto"}'

# Re-process failed events
docker exec -it postgres psql -U postgres -d hospital -c "
UPDATE auth_schema.event_outbox 
SET status = 'PENDING', publish_attempts = 0 
WHERE status = 'FAILED';
"

# Check consumer error logs
docker logs patient-registry-service | grep -i error | tail -10
```

### **Common Issues & Solutions**

#### **1. 401 Unauthorized Errors**

**Symptoms**:
- All API calls return 401
- Token validation fails

**Root Causes**:
- Token expired
- User role not set in `app_metadata`
- Identity Service not running

**Solutions**:
```bash
# Check token expiration
echo "JWT_TOKEN" | cut -d'.' -f2 | base64 -d | jq '.exp'

# Update user role via Supabase Admin API
curl -X PUT https://your-project.supabase.co/auth/v1/admin/users/USER_ID \
  -H "Authorization: Bearer SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "app_metadata": {
      "role": "DOCTOR",
      "department": "GENERAL"
    }
  }'

# Check Identity Service status
curl http://localhost:3001/health
```

#### **2. 403 Forbidden Errors**

**Symptoms**:
- Authenticated but access denied
- Authorization check fails

**Root Causes**:
- User role insufficient for operation
- Permission not configured in database
- Authorization service logic error

**Solutions**:
```typescript
// Check user roles in response
const loginResponse = await login();
console.log('User roles:', loginResponse.roles);

// Verify permissions in database
SELECT * FROM auth_schema.permissions WHERE role = 'DOCTOR';

// Temporarily disable strict auth (for testing)
async authorize(request: any, userId: string): Promise<boolean> {
  return true; // Allow all authenticated users
}
```

#### **3. Registration Issues**

**Symptoms**:
- Registration returns 400
- Email verification not received
- User not created after verification

**Solutions**:
```bash
# Check pending registrations
SELECT * FROM auth_schema.pending_registrations WHERE email = 'user@test.vn';

# Check email service configuration
# Verify SMTP settings in .env file

# Manual email verification (bypass email service)
curl -X POST http://localhost:3001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.vn",
    "token": "VERIFICATION_TOKEN"
  }'
```

#### **4. Service Communication Issues**

**Symptoms**:
- Services can't communicate
- Cross-service calls fail
- Authentication loop

**Solutions**:
```bash
# Check all services are running
netstat -an | grep ":300[1-4]"

# Verify service URLs in .env files
IDENTITY_SERVICE_URL=http://localhost:3001
PATIENT_SERVICE_URL=http://localhost:3003
PROVIDER_SERVICE_URL=http://localhost:3002

# Test direct service communication
curl http://localhost:3001/health
curl http://localhost:3003/health
curl http://localhost:3002/health
```

### **Debug Tools**

#### **Token Decoder**
```bash
# Decode JWT token
echo "YOUR_JWT_TOKEN" | cut -d'.' -f2 | base64 -d | jq '.'
```

#### **Session Inspector**
```bash
# Check Redis session cache
redis-cli
> KEYS appointment:*
> GET appointment:session:USER_ID
```

#### **Database Queries**
```sql
-- Check user roles
SELECT id, email, app_metadata->>'role' as role 
FROM auth.users 
WHERE email = 'user@test.vn';

-- Check pending registrations
SELECT * FROM auth_schema.pending_registrations 
WHERE email = 'user@test.vn';

-- Check permissions
SELECT * FROM auth_schema.permissions 
WHERE role = 'DOCTOR';
```

---

## 📚 Quick Reference

### **Essential Endpoints**

| Service | Method | Endpoint | Purpose | Auth Required |
|---------|--------|----------|---------|---------------|
| **Identity** | POST | `/api/auth/login` | User login | ❌ Public |
| **Identity** | POST | `/api/auth/register` | Patient registration | ❌ Public |
| **Identity** | GET | `/api/auth/verify-email` | Email verification | ❌ Public |
| **Identity** | POST | `/api/auth/forgot-password` | Password reset | ❌ Public |
| **Identity** | GET | `/api/v1/users/me` | Get current user | ✅ Required |
| **Identity** | POST | `/api/admin/users` | Create staff user | ✅ ADMIN only |
| **Patient** | GET | `/api/v1/patients/me` | Get patient profile | ✅ Required |
| **Patient** | GET | `/api/v1/patients/search` | Search patients | ✅ Required |
| **Provider** | GET | `/api/v1/staff/me` | Get staff profile | ✅ Required |
| **Provider** | GET | `/api/v1/staff/search` | Search staff | ✅ Required |
| **Appointment** | GET | `/api/v1/appointments/me` | Get my appointments | ✅ Required |
| **Appointment** | GET | `/api/v1/appointments` | List appointments | ✅ Required |

### **Default Test Credentials**

```bash
# Patient Account
Email: patient@test.vn
Password: Patient@123456
Role: PATIENT

# Doctor Account  
Email: doctor@test.vn
Password: Doctor@123456
Role: DOCTOR

# Admin Account
Email: admin@test.vn
Password: Admin@123456
Role: ADMIN
```

### **Service Ports**

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| Frontend | 3000 | N/A |
| API Gateway | 3101 | `/health` |
| Identity Service | 3001 | `/health` |
| Provider Service | 3002 | `/health` |
| Patient Service | 3003 | `/health` |
| Appointment Service | 3004 | `/health` |

---

## 🎯 Best Practices

### **Security**
- ✅ Always use HTTPS in production
- ✅ Set `secure: true` for cookies in production
- ✅ Implement rate limiting on auth endpoints
- ✅ Use strong password policies
- ✅ Enable MFA for sensitive roles

### **Performance**
- ✅ Cache user sessions in Redis
- ✅ Use circuit breakers for external calls
- ✅ Implement token refresh logic
- ✅ Monitor authentication response times

### **Monitoring**
- ✅ Log authentication attempts
- ✅ Track failed login rates
- ✅ Monitor service health
- ✅ Set up alerts for auth failures

---

## ⚠️ Minimal Data Registration Issues (DISCOVERED 2025-11-14)

### **🚨 Critical Issues Identified**

#### **Issue #1: Date Validation Failure**
**Error**: `"Ngày sinh không hợp lệ"`

**Root Cause**: 
```typescript
// User registers with minimal data
{
  "dateOfBirth": "",  // Empty string
  "gender": "",       // Empty string
  "citizenId": ""     // Empty string
}

// Patient creation fails because PersonalInfo.create() expects:
// - dateOfBirth: Date object (not empty string)
// - gender: 'male' | 'female' | 'other' (not empty string)
```

**Impact**: 
- ❌ Patient record NOT created
- ❌ UserActivatedEvent sent to DLQ
- ❌ Smart defaults not applied

#### **Issue #2: Circuit Breaker Fallback Error**
**Error**: `"Cannot read properties of undefined (reading 'substring')"`

**Root Cause**: Circuit breaker tries to process empty dateOfBirth without null checks

### **� Registration Requirements Analysis**

#### **🔍 CURRENT REGISTRATION FIELDS**

**Endpoint**: `POST /api/auth/register`

**Required Fields** (working):
```json
{
  "email": "patient@example.com",      // ✅ Required - Login credentials
  "password": "Password@123456",       // ✅ Required - Login credentials  
  "fullName": "Nguyễn Văn An"          // ✅ Required - Display name
}
```

**Optional Fields** (causing issues when empty):
```json
{
  "phoneNumber": "0912345678",         // ⚠️ Optional - But "" breaks patient creation
  "citizenId": "123456789012",         // ⚠️ Optional - But "" breaks patient creation
  "dateOfBirth": "1990-01-01",         // ⚠️ Optional - But "" breaks patient creation
  "gender": "MALE",                    // ⚠️ Optional - But "" breaks patient creation
  "address": "123 Nguyễn Huệ, Q1"      // ⚠️ Optional - But "" breaks patient creation
}
```

#### **🎯 IDEAL REGISTRATION EXPERIENCE**

**Minimal Registration** (what users want):
```json
{
  "email": "patient@example.com",      // ✅ Required
  "password": "Password@123456",       // ✅ Required
  "fullName": "Nguyễn Văn An"          // ✅ Required
}
```

**Expected Result**: Patient record created with smart defaults

#### **🚨 CURRENT PROBLEMATIC BEHAVIOR**

**What happens with minimal data**:
1. ✅ User account created in `auth_schema.user_profiles`
2. ✅ Email verification works
3. ✅ Login successful
4. ❌ **Patient creation fails** - Empty optional fields break validation
5. ❌ **Smart defaults not applied** - Due to creation failure

#### **🔧 TECHNICAL ROOT CAUSE**

```typescript
// Current Implementation (BROKEN)
createFromUserEvent(userData: UserEventData) {
  const patient = Patient.register(
    userData.userId,
    PersonalInfo.create({
      fullName: userData.fullName,
      dateOfBirth: userData.dateOfBirth?.toISOString().split('T')[0], // ❌ "" -> Error
      gender: userData.gender, // ❌ "" -> Type error
      nationalId: userData.citizenId, // ❌ "" -> Validation error
      // ...
    }),
    // ...
  );
}

// Should Be (SMART DEFAULTS)
createFromUserEvent(userData: UserEventData) {
  const patient = Patient.register(
    userData.userId,
    PersonalInfo.create({
      fullName: userData.fullName,
      dateOfBirth: userData.dateOfBirth 
        ? new Date(userData.dateOfBirth) 
        : new Date('2000-01-01'), // ✅ Smart default
      gender: userData.gender || 'other', // ✅ Smart default
      nationalId: userData.citizenId || 'Chưa cập nhật', // ✅ Smart default
      // ...
    }),
    // ...
  );
}
```

#### **📊 FIELD REQUIREMENTS SUMMARY**

| Field | Status | Current Behavior | Expected Behavior |
|-------|--------|------------------|-------------------|
| **email** | ✅ Required | Works correctly | Works correctly |
| **password** | ✅ Required | Works correctly | Works correctly |
| **fullName** | ✅ Required | Works correctly | Works correctly |
| **dateOfBirth** | ⚠️ Optional | Empty breaks patient creation | Smart default: 2000-01-01 |
| **gender** | ⚠️ Optional | Empty breaks patient creation | Smart default: 'other' |
| **citizenId** | ⚠️ Optional | Empty breaks patient creation | Smart default: 'Chưa cập nhật' |
| **phoneNumber** | ⚠️ Optional | Empty breaks patient creation | Smart default: 'Chưa cập nhật' |
| **address** | ⚠️ Optional | Empty breaks patient creation | Smart default: 'Chưa cập nhật' |

### **� Required Fixes**

```typescript
// Fix #1: Smart defaults for empty date
PersonalInfo.create({
  dateOfBirth: userData.dateOfBirth 
    ? new Date(userData.dateOfBirth)
    : new Date('2000-01-01'), // Smart default
  gender: userData.gender || 'other' // Smart default
})

// Fix #2: Null checks in circuit breaker
const formattedDate = dateOfBirth 
  ? dateOfBirth.substring(0, 10)
  : '2000-01-01'; // Smart default
```

### **📊 Test Results**

**✅ Working**: Registration, Email Verification, Login, Event Publishing
**❌ Broken**: Patient Creation, Smart Defaults Application, Circuit Breaker

**Test User**: `patient.minimal.4650@example.com`
**Status**: User created, but patient record missing due to validation errors

### **📋 Expected Behavior After Fix**

Minimal data registration should create patient with smart defaults:
```json
{
  "personalInfo": {
    "fullName": "Test Minimal",
    "dateOfBirth": "2000-01-01",     // Smart default
    "gender": "other",                // Smart default  
    "nationalId": "Chưa cập nhật",    // Smart default
    "nationality": "Chưa cập nhật",   // Smart default
    "ethnicity": "Chưa cập nhật",     // Smart default
    "occupation": "Chưa cập nhật",    // Smart default
    "maritalStatus": "Chưa cập nhật"  // Smart default
  }
}
```

**📖 Detailed Test Report**: [Smart Defaults Minimal Data Testing](./smart-defaults-minimal-data-testing.md)

---

## 🎯 **REGISTRATION REQUIREMENTS SUMMARY**

### **✅ CURRENT WORKING FIELDS**
- `email` (required) - Login credentials
- `password` (required) - Login credentials  
- `fullName` (required) - Display name

### **⚠️ BROKEN OPTIONAL FIELDS**
- `dateOfBirth` - Empty string breaks patient creation
- `gender` - Empty string breaks patient creation
- `citizenId` - Empty string breaks patient creation
- `phoneNumber` - Empty string breaks patient creation
- `address` - Empty string breaks patient creation

### **🎯 DESIRED BEHAVIOR**
Users should be able to register with **only email, password, fullName** and get:
- ✅ User account created
- ✅ Patient record created with smart defaults
- ✅ Progressive profiling capability

### **🔧 IMMEDIATE FIX NEEDED**
Update `createFromUserEvent` in `SupabasePatientRepository.ts` to handle empty values with smart defaults instead of failing validation.

---

**📝 Last Updated**: November 2025  
**🏥 Version**: 2.0.0  
**👥 Maintainers**: Hospital Management Team

*This documentation supports the Hospital Management System graduation project and provides comprehensive guidance for authentication flows across all microservices.*
