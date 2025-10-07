# Role Boundaries, Use Cases & Workflows - HMS V2

**Date**: 2025-01-06  
**Purpose**: Định nghĩa rõ ràng boundaries, responsibilities, use cases và workflows cho 5 core roles  
**Status**: 📋 DRAFT - Pending Review

---

## 📋 Table of Contents

1. [Role Overview](#1-role-overview)
2. [Role Boundaries & Responsibilities](#2-role-boundaries--responsibilities)
3. [Use Cases by Role](#3-use-cases-by-role)
4. [Workflows & Interactions](#4-workflows--interactions)
5. [Permission Matrix](#5-permission-matrix)
6. [Service Interactions](#6-service-interactions)
7. [UI/UX Requirements](#7-uiux-requirements)

---

## 1. ROLE OVERVIEW

### 1.1. Five Core Roles

```
┌─────────────────────────────────────────────────────────────┐
│                    HMS USER HIERARCHY                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ADMIN (Quản trị viên)                                  │
│     └─ System management, user management, reports         │
│                                                             │
│  2. DOCTOR (Bác sĩ)                                        │
│     └─ Diagnose, prescribe, medical records, lab orders    │
│                                                             │
│  3. NURSE (Y tá)                                           │
│     └─ Patient care, vital signs, medications, lab support │
│                                                             │
│  4. RECEPTIONIST (Lễ tân)                                  │
│     └─ Scheduling, check-in, billing, payments            │
│                                                             │
│  5. PATIENT (Bệnh nhân)                                    │
│     └─ Book appointments, view records, view bills         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2. Role Characteristics

| Role | Access Level | MFA Required | HIPAA Training | Primary Interface |
|------|-------------|--------------|----------------|-------------------|
| **ADMIN** | Full System | ✅ Yes | ✅ Yes | Admin Panel |
| **DOCTOR** | Medical Data | ✅ Yes | ✅ Yes | Doctor Dashboard |
| **NURSE** | Patient Care | ✅ Yes | ✅ Yes | Nurse Dashboard |
| **RECEPTIONIST** | Front Desk | ✅ Yes | ❌ No | Receptionist Dashboard |
| **PATIENT** | Own Data | ❌ Optional | ❌ No | Patient Portal |

---

## 2. ROLE BOUNDARIES & RESPONSIBILITIES

### 2.1. ADMIN (Quản trị viên)

#### **Primary Responsibility**
System administration, user management, configuration, and oversight.

#### **Core Boundaries**
```
✅ CAN DO:
- Manage all users (create, edit, deactivate)
- Configure system settings
- View all data (patients, appointments, billing)
- Generate reports and analytics
- Manage departments and resources
- Handle billing reports and financial oversight
- Audit logs and security monitoring

❌ CANNOT DO:
- Diagnose patients (medical decisions)
- Prescribe medications
- Perform medical procedures
- Direct patient care
```

#### **Key Responsibilities**
1. **User Management**
   - Create staff accounts (Doctor, Nurse, Receptionist)
   - Assign roles and permissions
   - Deactivate/reactivate accounts
   - Reset passwords

2. **System Configuration**
   - Manage departments
   - Configure appointment types
   - Set business hours
   - Manage system settings

3. **Oversight & Reporting**
   - View system-wide reports
   - Monitor system health
   - Audit user activities
   - Financial reports

4. **Data Management**
   - Backup and restore
   - Data export
   - Compliance monitoring

#### **Typical User**
- Hospital Administrator
- IT Manager
- System Administrator

---

### 2.2. DOCTOR (Bác sĩ)

#### **Primary Responsibility**
Medical diagnosis, treatment planning, prescriptions, and patient care coordination.

#### **Core Boundaries**
```
✅ CAN DO:
- View/edit patient medical records
- Diagnose and create treatment plans
- Prescribe medications
- Order lab tests and imaging
- View lab results
- Schedule follow-up appointments
- Write medical notes
- View patient history

❌ CANNOT DO:
- Create/delete user accounts
- Modify system settings
- Access billing details (except own patients)
- Manage other doctors' schedules
- Delete medical records (only edit/append)
```

#### **Key Responsibilities**
1. **Patient Care**
   - Conduct medical examinations
   - Diagnose conditions
   - Create treatment plans
   - Monitor patient progress

2. **Medical Documentation**
   - Write consultation notes
   - Update medical records
   - Document diagnoses
   - Record treatment plans

3. **Prescriptions & Orders**
   - Prescribe medications
   - Order lab tests
   - Order imaging studies
   - Refer to specialists

4. **Coordination**
   - Coordinate with nurses
   - Review lab results
   - Follow up with patients
   - Consult with colleagues

#### **Typical User**
- General Practitioner
- Specialist Doctor
- Consultant Physician

---

### 2.3. NURSE (Y tá)

#### **Primary Responsibility**
Patient care support, vital signs monitoring, medication administration, and assisting doctors.

#### **Core Boundaries**
```
✅ CAN DO:
- View/update patient information
- Record vital signs (BP, temp, pulse, etc.)
- Administer medications (prescribed by doctor)
- Update medical records (nursing notes)
- View lab results
- Update lab results (if trained)
- Assist in procedures
- Patient education

❌ CANNOT DO:
- Diagnose medical conditions
- Prescribe medications independently
- Order lab tests independently
- Perform major medical procedures
- Access billing information
- Create/delete user accounts
```

#### **Key Responsibilities**
1. **Patient Monitoring**
   - Record vital signs
   - Monitor patient condition
   - Report changes to doctor
   - Track patient progress

2. **Medication Management**
   - Administer prescribed medications
   - Record medication given
   - Monitor for side effects
   - Manage medication inventory

3. **Documentation**
   - Write nursing notes
   - Update patient charts
   - Record procedures performed
   - Document patient education

4. **Lab Support**
   - Collect specimens
   - Update lab results (if trained)
   - Prepare patients for tests
   - Coordinate with lab

#### **Typical User**
- Registered Nurse (RN)
- Licensed Practical Nurse (LPN)
- Nurse Practitioner (NP)

---

### 2.4. RECEPTIONIST (Lễ tân)

#### **Primary Responsibility**
Front desk operations, appointment scheduling, patient check-in, and billing support.

#### **Core Boundaries**
```
✅ CAN DO:
- Schedule/reschedule appointments
- Check-in patients
- Register new patients
- View patient demographics
- Process payments
- Create invoices
- Handle billing inquiries
- Manage appointment calendar

❌ CANNOT DO:
- View medical records
- Access clinical data
- Prescribe medications
- Diagnose conditions
- Create staff accounts
- Modify medical information
```

#### **Key Responsibilities**
1. **Appointment Management**
   - Schedule appointments
   - Confirm appointments
   - Reschedule/cancel appointments
   - Manage waiting list
   - Send appointment reminders

2. **Patient Registration**
   - Register new patients
   - Update patient demographics
   - Verify insurance information
   - Collect patient documents

3. **Billing & Payments**
   - Create invoices
   - Process payments
   - Handle billing inquiries
   - Generate receipts
   - Track outstanding payments

4. **Front Desk Operations**
   - Check-in patients
   - Manage queue
   - Answer phone calls
   - Provide information

#### **Typical User**
- Front Desk Receptionist
- Appointment Coordinator
- Billing Clerk

---

### 2.5. PATIENT (Bệnh nhân)

#### **Primary Responsibility**
Self-service access to own medical information and appointment management.

#### **Core Boundaries**
```
✅ CAN DO:
- Book appointments online
- View own medical records
- View own prescriptions
- View own lab results
- View own billing/invoices
- Update own profile
- Cancel own appointments
- View appointment history

❌ CANNOT DO:
- View other patients' data
- Modify medical records
- Prescribe medications
- Access staff information
- View system settings
- Create other user accounts
```

#### **Key Responsibilities**
1. **Self-Service**
   - Book appointments
   - View medical history
   - Download medical reports
   - Update contact information

2. **Health Management**
   - Track appointments
   - View prescriptions
   - View lab results
   - Monitor health records

3. **Billing**
   - View invoices
   - Make payments
   - Download receipts
   - Track payment history

4. **Communication**
   - Message doctor (if enabled)
   - Receive notifications
   - Provide feedback

#### **Typical User**
- Hospital Patient
- Outpatient
- Family Member (with authorization)

---

## 3. USE CASES BY ROLE

### 3.0. IDENTITY & AUTHENTICATION Use Cases (All Roles)

#### UC-I1: Patient Self-Registration
**Actor**: Patient (New User)
**Precondition**: User visits website
**Flow**:
1. User clicks "Đăng ký" on homepage
2. Fills registration form:
   - Email
   - Password (min 8 chars, uppercase, lowercase, number, special char)
   - Full name
   - Phone number (Vietnamese format)
   - Date of birth (must be 18+)
   - Gender
3. Accepts terms and conditions
4. Submits form
5. System validates input
6. System creates user account (status: PENDING_ACTIVATION)
7. System sends verification email with activation link
8. User clicks activation link in email
9. System activates account (status: ACTIVE)
10. User can now login

**Postcondition**: Patient account created and activated

**Events Published**:
- `UserRegistered` (to Patient Registry Service)
- `UserActivated` (to Patient Registry Service, Notification Service)

---

#### UC-I2: Staff Account Activation
**Actor**: Staff (Doctor/Nurse/Receptionist)
**Precondition**: Admin has created staff account
**Flow**:
1. Staff receives activation email
2. Clicks activation link
3. System verifies token
4. Staff sets password
5. Staff confirms password
6. System activates account
7. System redirects to login page

**Postcondition**: Staff account activated

**Events Published**:
- `UserActivated` (to Provider/Staff Service, Notification Service)

---

#### UC-I3: User Login
**Actor**: Any User
**Precondition**: User has active account
**Flow**:
1. User navigates to login page
2. Enters email and password
3. Submits form
4. System validates credentials
5. If MFA enabled:
   - System sends MFA code
   - User enters MFA code
   - System validates MFA code
6. System generates access token (15 min) and refresh token (7 days)
7. System updates last_login timestamp
8. System redirects to dashboard

**Postcondition**: User logged in

**Events Published**:
- `UserLoggedIn` (to Audit Service, Analytics Service)

---

#### UC-I4: Forgot Password
**Actor**: Any User
**Precondition**: User has account
**Flow**:
1. User clicks "Quên mật khẩu" on login page
2. Enters email
3. Submits form
4. System validates email exists
5. System generates password reset token
6. System sends password reset email
7. User clicks reset link in email
8. User enters new password
9. User confirms new password
10. System validates password strength
11. System updates password
12. System invalidates all existing tokens
13. User redirected to login page

**Postcondition**: Password reset

**Events Published**:
- `UserPasswordChanged` (to Notification Service, Security Service)

---

#### UC-I5: Change Password
**Actor**: Any User
**Precondition**: User is logged in
**Flow**:
1. User navigates to "Profile" → "Security"
2. Clicks "Change Password"
3. Enters current password
4. Enters new password
5. Confirms new password
6. Submits form
7. System validates current password
8. System validates new password strength
9. System updates password
10. System sends confirmation email

**Postcondition**: Password changed

**Events Published**:
- `UserPasswordChanged` (to Notification Service, Security Service)

---

#### UC-I6: Setup MFA (Staff Only)
**Actor**: Staff (Doctor/Nurse/Receptionist/Admin)
**Precondition**: User is logged in, MFA not enabled
**Flow**:
1. User navigates to "Profile" → "Security"
2. Clicks "Enable MFA"
3. Selects MFA method (TOTP/SMS/Email)
4. If TOTP:
   - System generates QR code
   - User scans QR code with authenticator app
   - User enters verification code
5. If SMS/Email:
   - System sends verification code
   - User enters verification code
6. System validates code
7. System enables MFA
8. System generates backup codes
9. User saves backup codes

**Postcondition**: MFA enabled

**Events Published**:
- `UserMFAEnabled` (to Security Service, Audit Service)

---

#### UC-I7: Refresh Access Token
**Actor**: Any User
**Precondition**: User has valid refresh token
**Flow**:
1. Client detects access token expired
2. Client sends refresh token to server
3. System validates refresh token
4. System generates new access token
5. System returns new access token
6. Client stores new access token

**Postcondition**: New access token issued

---

#### UC-I8: Logout
**Actor**: Any User
**Precondition**: User is logged in
**Flow**:
1. User clicks "Logout"
2. System invalidates access token
3. System invalidates refresh token
4. System redirects to login page

**Postcondition**: User logged out

**Events Published**:
- `UserLoggedOut` (to Audit Service)

---

### 3.1. ADMIN Use Cases

#### UC-A1: Create Staff Account
**Actor**: Admin  
**Precondition**: Admin is logged in  
**Flow**:
1. Admin navigates to "Staff Management"
2. Clicks "Add New Staff"
3. Selects role type (Doctor/Nurse/Receptionist)
4. Fills in staff information
5. (If Doctor/Nurse) Uploads credentials
6. Submits form
7. System creates account
8. System sends activation email to staff

**Postcondition**: Staff account created, activation email sent

#### UC-A2: Generate System Report
**Actor**: Admin  
**Precondition**: Admin is logged in  
**Flow**:
1. Admin navigates to "Reports"
2. Selects report type (Appointments/Billing/Users)
3. Sets date range
4. Clicks "Generate Report"
5. System generates report
6. Admin views/downloads report

**Postcondition**: Report generated and available

#### UC-A3: Manage Department
**Actor**: Admin
**Precondition**: Admin is logged in
**Flow**:
1. Admin navigates to "Departments"
2. Clicks "Add Department" or edits existing
3. Fills in department information
4. Assigns staff to department
5. Saves changes

**Postcondition**: Department created/updated

#### UC-A4: Lock/Unlock User Account
**Actor**: Admin
**Precondition**: Admin is logged in
**Flow**:
1. Admin navigates to "User Management"
2. Searches for user
3. Selects user account
4. Clicks "Lock Account" or "Unlock Account"
5. Adds reason (for lock)
6. Confirms action
7. System updates account status
8. System sends notification to user

**Postcondition**: User account locked/unlocked

#### UC-A5: Reset User Password
**Actor**: Admin
**Precondition**: Admin is logged in
**Flow**:
1. Admin navigates to "User Management"
2. Searches for user
3. Selects user account
4. Clicks "Reset Password"
5. System generates temporary password
6. System sends password reset email
7. User must change password on next login

**Postcondition**: Password reset, email sent

#### UC-A6: View Audit Logs
**Actor**: Admin
**Precondition**: Admin is logged in
**Flow**:
1. Admin navigates to "Audit Logs"
2. Sets filters (date range, user, action type)
3. Clicks "Search"
4. System displays audit logs
5. Admin can export logs if needed

**Postcondition**: Audit logs viewed/exported

---

### 3.2. DOCTOR Use Cases

#### UC-D1: View Patient Medical Record
**Actor**: Doctor  
**Precondition**: Doctor is logged in, has patient assigned  
**Flow**:
1. Doctor searches for patient
2. Selects patient from list
3. Views patient medical record
4. Reviews history, diagnoses, medications

**Postcondition**: Doctor has viewed patient record

#### UC-D2: Create Prescription
**Actor**: Doctor  
**Precondition**: Doctor is viewing patient record  
**Flow**:
1. Doctor clicks "New Prescription"
2. Searches for medication
3. Specifies dosage, frequency, duration
4. Adds instructions
5. Saves prescription
6. System notifies pharmacy (if integrated)

**Postcondition**: Prescription created and saved

#### UC-D3: Order Lab Test
**Actor**: Doctor
**Precondition**: Doctor is viewing patient record
**Flow**:
1. Doctor clicks "Order Lab Test"
2. Selects test type
3. Adds clinical notes
4. Marks as urgent (if needed)
5. Submits order
6. System notifies lab

**Postcondition**: Lab order created

#### UC-D4: Write Medical Notes
**Actor**: Doctor
**Precondition**: Doctor is viewing patient record
**Flow**:
1. Doctor clicks "Add Medical Note"
2. Selects note type (Consultation/Progress/Discharge)
3. Writes clinical findings
4. Documents diagnosis
5. Records treatment plan
6. Signs and saves note
7. System timestamps entry

**Postcondition**: Medical note saved

#### UC-D5: Review Lab Results
**Actor**: Doctor
**Precondition**: Lab results are available
**Flow**:
1. Doctor receives notification of new results
2. Opens patient record
3. Views lab results
4. Compares with previous results
5. Adds interpretation notes
6. Signs off on results
7. Updates treatment plan if needed

**Postcondition**: Lab results reviewed and signed

#### UC-D6: View Schedule
**Actor**: Doctor
**Precondition**: Doctor is logged in
**Flow**:
1. Doctor navigates to "My Schedule"
2. Views today's appointments
3. Sees patient list with appointment times
4. Can view patient details
5. Can mark appointments as completed

**Postcondition**: Doctor has viewed schedule

---

### 3.3. NURSE Use Cases

#### UC-N1: Record Vital Signs
**Actor**: Nurse  
**Precondition**: Nurse is logged in, patient is checked in  
**Flow**:
1. Nurse selects patient
2. Clicks "Record Vital Signs"
3. Enters BP, temperature, pulse, etc.
4. Adds notes (if any)
5. Saves vital signs
6. System timestamps entry

**Postcondition**: Vital signs recorded

#### UC-N2: Administer Medication
**Actor**: Nurse
**Precondition**: Medication is prescribed by doctor
**Flow**:
1. Nurse views patient's prescriptions
2. Selects medication to administer
3. Verifies patient identity
4. Administers medication
5. Records administration in system
6. Notes any reactions

**Postcondition**: Medication administration recorded

#### UC-N3: Collect Lab Specimen
**Actor**: Nurse
**Precondition**: Lab order exists
**Flow**:
1. Nurse views pending lab orders
2. Selects order to process
3. Prepares patient
4. Collects specimen (blood, urine, etc.)
5. Labels specimen correctly
6. Updates order status to "Specimen Collected"
7. Sends specimen to lab

**Postcondition**: Specimen collected and sent to lab

#### UC-N4: Update Nursing Notes
**Actor**: Nurse
**Precondition**: Nurse is caring for patient
**Flow**:
1. Nurse opens patient record
2. Clicks "Add Nursing Note"
3. Documents patient condition
4. Records care provided
5. Notes any concerns
6. Saves note with timestamp

**Postcondition**: Nursing note saved

#### UC-N5: Handover Shift
**Actor**: Nurse
**Precondition**: End of shift
**Flow**:
1. Nurse navigates to "Shift Handover"
2. Reviews assigned patients
3. Documents patient status for each
4. Notes pending tasks
5. Highlights critical issues
6. Submits handover report
7. Next shift nurse reviews report

**Postcondition**: Shift handover completed

---

### 3.4. RECEPTIONIST Use Cases

#### UC-R1: Schedule Appointment
**Actor**: Receptionist  
**Precondition**: Receptionist is logged in  
**Flow**:
1. Receptionist searches for patient (or creates new)
2. Clicks "Schedule Appointment"
3. Selects doctor and department
4. Chooses available time slot
5. Adds appointment notes
6. Confirms appointment
7. System sends confirmation to patient

**Postcondition**: Appointment scheduled

#### UC-R2: Process Payment
**Actor**: Receptionist
**Precondition**: Patient has outstanding invoice
**Flow**:
1. Receptionist views patient billing
2. Selects invoice to pay
3. Enters payment amount
4. Selects payment method
5. Processes payment
6. Prints receipt
7. System updates invoice status

**Postcondition**: Payment processed

#### UC-R3: Register New Patient (Walk-in)
**Actor**: Receptionist
**Precondition**: Patient arrives at hospital
**Flow**:
1. Receptionist clicks "Register New Patient"
2. Collects patient information
3. Enters demographics (name, DOB, gender, address)
4. Enters contact information
5. Scans ID card/CCCD
6. Verifies insurance (if applicable)
7. Creates patient account
8. Prints patient card
9. System assigns patient ID

**Postcondition**: Patient registered in system

#### UC-R4: Check-in Patient
**Actor**: Receptionist
**Precondition**: Patient has appointment
**Flow**:
1. Receptionist searches for patient
2. Verifies appointment
3. Confirms patient identity
4. Updates appointment status to "Checked In"
5. Adds patient to queue
6. Prints queue number
7. Notifies doctor/nurse

**Postcondition**: Patient checked in

#### UC-R5: Print Appointment Slip
**Actor**: Receptionist
**Precondition**: Appointment is scheduled
**Flow**:
1. Receptionist views appointment details
2. Clicks "Print Appointment Slip"
3. System generates slip with:
   - Patient name
   - Doctor name
   - Date and time
   - Department
   - Queue number (if applicable)
4. Prints slip
5. Hands to patient

**Postcondition**: Appointment slip printed

---

### 3.5. PATIENT Use Cases

#### UC-P1: Book Appointment Online
**Actor**: Patient  
**Precondition**: Patient is logged in  
**Flow**:
1. Patient clicks "Book Appointment"
2. Selects department/specialty
3. Selects doctor (or any available)
4. Chooses available time slot
5. Adds reason for visit
6. Confirms booking
7. System sends confirmation email

**Postcondition**: Appointment booked

#### UC-P2: View Medical Records
**Actor**: Patient
**Precondition**: Patient is logged in
**Flow**:
1. Patient navigates to "Medical Records"
2. Views list of encounters
3. Selects specific encounter
4. Views diagnoses, prescriptions, lab results
5. Downloads report (if needed)

**Postcondition**: Patient has viewed own medical records

#### UC-P3: Self-Register Account
**Actor**: Patient (New)
**Precondition**: Patient visits website
**Flow**:
1. Patient clicks "Đăng ký" on homepage
2. Fills registration form:
   - Email
   - Password
   - Full name
   - Phone number
   - Date of birth
   - Gender
3. Accepts terms and conditions
4. Submits form
5. System sends verification email
6. Patient clicks verification link
7. Account activated

**Postcondition**: Patient account created and verified

#### UC-P4: Update Profile
**Actor**: Patient
**Precondition**: Patient is logged in
**Flow**:
1. Patient navigates to "Profile"
2. Clicks "Edit Profile"
3. Updates information:
   - Contact details
   - Address
   - Emergency contact
   - Insurance information
4. Saves changes
5. System validates and updates

**Postcondition**: Profile updated

#### UC-P5: View and Pay Invoice
**Actor**: Patient
**Precondition**: Patient has outstanding invoice
**Flow**:
1. Patient navigates to "Billing"
2. Views list of invoices
3. Selects invoice to pay
4. Reviews invoice details
5. Clicks "Pay Now"
6. Selects payment method
7. Enters payment details
8. Confirms payment
9. System processes payment
10. Downloads receipt

**Postcondition**: Invoice paid

#### UC-P6: Cancel/Reschedule Appointment
**Actor**: Patient
**Precondition**: Patient has upcoming appointment
**Flow**:
1. Patient navigates to "My Appointments"
2. Selects appointment
3. Clicks "Cancel" or "Reschedule"
4. If reschedule:
   - Selects new date/time
   - Confirms new slot
5. If cancel:
   - Adds cancellation reason
   - Confirms cancellation
6. System updates appointment
7. System sends confirmation

**Postcondition**: Appointment cancelled/rescheduled

---

## 4. WORKFLOWS & INTERACTIONS

### 4.0. Identity & Authentication Workflows

#### 4.0.1. Patient Self-Registration Flow

```
┌─────────────┐
│   PATIENT   │ (Visits website)
└──────┬──────┘
       │
       ↓ Clicks "Đăng ký"
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Validates input)
│  - Check email unique
│  - Validate password strength
│  - Create user (PENDING_ACTIVATION)
└──────┬───────────────┘
       │
       ↓ Publishes UserRegistered event
       │
┌──────────────────────┐
│    EVENT BUS         │ (RabbitMQ)
└──────┬───────────────┘
       │
       ├─→ PATIENT REGISTRY SERVICE (Creates patient profile)
       ├─→ NOTIFICATION SERVICE (Sends activation email)
       └─→ AUDIT SERVICE (Logs registration)

       ↓ Patient clicks activation link
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Activates account)
│  - Verify token
│  - Update status to ACTIVE
└──────┬───────────────┘
       │
       ↓ Publishes UserActivated event
       │
┌──────────────────────┐
│    EVENT BUS         │
└──────┬───────────────┘
       │
       ├─→ PATIENT REGISTRY SERVICE (Updates status)
       └─→ NOTIFICATION SERVICE (Sends welcome email)
```

---

#### 4.0.2. Staff Provisioning Flow (HR → Identity → Supabase)

```
┌─────────────┐
│    ADMIN    │ (Creates staff account)
└──────┬──────┘
       │
       ↓ POST /admin/staff/register
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Creates staff account)
│  - Validate role
│  - Create user (PENDING_ACTIVATION)
│  - Generate activation token
└──────┬───────────────┘
       │
       ↓ Publishes UserRegistered event
       │
┌──────────────────────┐
│    EVENT BUS         │
└──────┬───────────────┘
       │
       ├─→ PROVIDER/STAFF SERVICE (Creates provider profile)
       ├─→ NOTIFICATION SERVICE (Sends activation email)
       └─→ AUDIT SERVICE (Logs staff creation)

       ↓ Staff clicks activation link
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Staff sets password)
│  - Verify token
│  - Set password
│  - Update status to ACTIVE
│  - Require MFA setup
└──────┬───────────────┘
       │
       ↓ Publishes UserActivated event
       │
┌──────────────────────┐
│    EVENT BUS         │
└──────┬───────────────┘
       │
       ├─→ PROVIDER/STAFF SERVICE (Updates status)
       └─→ NOTIFICATION SERVICE (Sends welcome email)
```

---

#### 4.0.3. Login + Token Refresh Flow

```
┌─────────────┐
│     USER    │ (Enters credentials)
└──────┬──────┘
       │
       ↓ POST /auth/login
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Validates credentials)
│  - Check email/password
│  - Check account status
│  - Check failed attempts
└──────┬───────────────┘
       │
       ↓ If MFA enabled
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Sends MFA code)
│  - Generate OTP
│  - Send via SMS/Email/TOTP
└──────┬───────────────┘
       │
       ↓ User enters MFA code
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Validates MFA)
│  - Verify OTP
│  - Generate tokens
│  - Access token (15 min)
│  - Refresh token (7 days)
└──────┬───────────────┘
       │
       ↓ Publishes UserLoggedIn event
       │
┌──────────────────────┐
│    EVENT BUS         │
└──────┬───────────────┘
       │
       ├─→ AUDIT SERVICE (Logs login)
       └─→ ANALYTICS SERVICE (Tracks activity)

       ↓ Access token expires (15 min)
       │
┌─────────────┐
│     USER    │ (Client auto-refreshes)
└──────┬──────┘
       │
       ↓ POST /auth/refresh
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Issues new access token)
│  - Validate refresh token
│  - Generate new access token
└──────────────────────┘
```

---

#### 4.0.4. Account Lockout/Unlock Flow

```
┌─────────────┐
│     USER    │ (Failed login attempts)
└──────┬──────┘
       │
       ↓ POST /auth/login (5 failed attempts)
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Locks account)
│  - Increment failed_attempts
│  - If attempts >= 5:
│    * Lock account
│    * Set unlock_at (1 hour)
└──────┬───────────────┘
       │
       ↓ Publishes UserAccountLocked event
       │
┌──────────────────────┐
│    EVENT BUS         │
└──────┬───────────────┘
       │
       ├─→ NOTIFICATION SERVICE (Sends lock notification)
       ├─→ SECURITY SERVICE (Logs security event)
       └─→ AUDIT SERVICE (Logs lock event)

       ↓ Option 1: Auto-unlock after 1 hour
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Scheduled job)
│  - Check unlock_at
│  - Unlock account
│  - Reset failed_attempts
└──────┬───────────────┘
       │
       ↓ Option 2: Admin manual unlock
       │
┌─────────────┐
│    ADMIN    │ (Unlocks account)
└──────┬──────┘
       │
       ↓ POST /admin/users/{id}/unlock
       │
┌──────────────────────┐
│  IDENTITY SERVICE    │ (Unlocks account)
│  - Unlock account
│  - Reset failed_attempts
└──────┬───────────────┘
       │
       ↓ Publishes UserAccountUnlocked event
       │
┌──────────────────────┐
│    EVENT BUS         │
└──────┬───────────────┘
       │
       ├─→ NOTIFICATION SERVICE (Sends unlock notification)
       └─→ AUDIT SERVICE (Logs unlock event)
```

---

### 4.1. Patient Registration & First Visit Workflow

```
┌─────────────┐
│   PATIENT   │ (Arrives at hospital)
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│  RECEPTIONIST   │ (Registers patient)
│  - Create patient profile
│  - Collect demographics
│  - Verify insurance
│  - Schedule appointment
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│     NURSE       │ (Initial assessment)
│  - Record vital signs
│  - Take medical history
│  - Prepare patient
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│     DOCTOR      │ (Consultation)
│  - Examine patient
│  - Diagnose condition
│  - Create treatment plan
│  - Prescribe medications
│  - Order lab tests
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│     NURSE       │ (Follow-up)
│  - Administer medications
│  - Collect specimens
│  - Patient education
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│  RECEPTIONIST   │ (Check-out)
│  - Generate invoice
│  - Process payment
│  - Schedule follow-up
└─────────────────┘
```

### 4.2. Appointment Booking Workflow (Online)

```
┌─────────────┐
│   PATIENT   │ (Logs into portal)
└──────┬──────┘
       │
       ↓ Selects "Book Appointment"
       │
┌──────────────────────┐
│  SCHEDULING SERVICE  │ (Shows available slots)
└──────┬───────────────┘
       │
       ↓ Patient selects slot
       │
┌──────────────────────┐
│  SCHEDULING SERVICE  │ (Creates appointment)
└──────┬───────────────┘
       │
       ↓ Sends notification
       │
┌──────────────────────┐
│ NOTIFICATION SERVICE │ (Email/SMS to patient & doctor)
└──────────────────────┘
```

### 4.3. Medical Record Update Workflow

```
┌─────────────┐
│   DOCTOR    │ (During consultation)
└──────┬──────┘
       │
       ↓ Updates medical record
       │
┌──────────────────────┐
│  CLINICAL SERVICE    │ (Saves medical record)
└──────┬───────────────┘
       │
       ↓ Publishes event
       │
┌──────────────────────┐
│    EVENT BUS         │ (MedicalRecordUpdated)
└──────┬───────────────┘
       │
       ├─→ NOTIFICATION SERVICE (Notify patient)
       ├─→ AUDIT SERVICE (Log change)
       └─→ ANALYTICS SERVICE (Update stats)
```

### 4.4. Lab Test Workflow

```
┌─────────────┐
│   DOCTOR    │ (Orders lab test)
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│  CLINICAL SERVICE    │ (Creates lab order)
└──────┬───────────────┘
       │
       ↓ Notifies nurse
       │
┌─────────────┐
│    NURSE    │ (Collects specimen)
└──────┬──────┘
       │
       ↓ Updates order status
       │
┌──────────────────────┐
│  CLINICAL SERVICE    │ (Status: Specimen Collected)
└──────┬───────────────┘
       │
       ↓ Lab processes
       │
┌─────────────┐
│    NURSE    │ (Enters lab results)
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│  CLINICAL SERVICE    │ (Saves results)
└──────┬───────────────┘
       │
       ↓ Notifies doctor
       │
┌─────────────┐
│   DOCTOR    │ (Reviews results)
└─────────────┘
```

---

## 5. PERMISSION MATRIX

### 5.1. Detailed Permission Matrix

| Resource | Action | Admin | Doctor | Nurse | Patient | Receptionist |
|----------|--------|-------|--------|-------|---------|--------------|
| **Patients** |
| patients:create | Create new patient | ✅ | ❌ | ❌ | Self-register | ✅ |
| patients:read | View patient info | ✅ | ✅ | ✅ | Own | ✅ |
| patients:update | Update patient info | ✅ | ✅ | ✅ | Own | ✅ |
| patients:delete | Delete patient | ✅ | ❌ | ❌ | ❌ | ❌ |
| patients:search | Search patients | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Medical Records** |
| medical-records:create | Create record | ✅ | ✅ | ✅ | ❌ | ❌ |
| medical-records:read | View record | ✅ | ✅ | ✅ | Own | ❌ |
| medical-records:update | Update record | ✅ | ✅ | ✅ | ❌ | ❌ |
| medical-records:delete | Delete record | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Appointments** |
| appointments:create | Book appointment | ✅ | ✅ | ✅ | ✅ | ✅ |
| appointments:read | View appointments | ✅ | ✅ | ✅ | Own | ✅ |
| appointments:update | Modify appointment | ✅ | ✅ | ✅ | Own | ✅ |
| appointments:cancel | Cancel appointment | ✅ | ✅ | ✅ | Own | ✅ |
| **Prescriptions** |
| prescriptions:create | Write prescription | ✅ | ✅ | ❌ | ❌ | ❌ |
| prescriptions:read | View prescription | ✅ | ✅ | ✅ | Own | ❌ |
| prescriptions:update | Modify prescription | ✅ | ✅ | ✅ | ❌ | ❌ |
| prescriptions:dispense | Dispense medication | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Lab Orders** |
| lab-orders:create | Order lab test | ✅ | ✅ | ❌ | ❌ | ❌ |
| lab-orders:read | View lab order | ✅ | ✅ | ✅ | Own | ❌ |
| lab-orders:update | Update order status | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Lab Results** |
| lab-results:create | Enter results | ✅ | ❌ | ✅ | ❌ | ❌ |
| lab-results:read | View results | ✅ | ✅ | ✅ | Own | ❌ |
| lab-results:update | Modify results | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Vital Signs** |
| vital-signs:create | Record vitals | ✅ | ✅ | ✅ | ❌ | ❌ |
| vital-signs:read | View vitals | ✅ | ✅ | ✅ | Own | ❌ |
| vital-signs:update | Update vitals | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Billing** |
| billing:create | Create invoice | ✅ | ❌ | ❌ | ❌ | ✅ |
| billing:read | View billing | ✅ | ❌ | ❌ | Own | ✅ |
| billing:update | Update invoice | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Payments** |
| payments:create | Process payment | ✅ | ❌ | ❌ | ✅ | ✅ |
| payments:read | View payments | ✅ | ❌ | ❌ | Own | ✅ |
| **Users** |
| users:create | Create user | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:read | View users | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:update | Update user | ✅ | ❌ | ❌ | Own | ❌ |
| users:delete | Delete user | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reports** |
| reports:view | View reports | ✅ | ✅ | ❌ | ❌ | ✅ |
| reports:export | Export reports | ✅ | ✅ | ❌ | ❌ | ✅ |

### 5.2. Permission Inheritance

```
write:patients → read:patients
update:medical-records → read:medical-records
delete:patients → update:patients → read:patients
```

---

### 5.3. Ownership Rules & Data Access Scope

#### 5.3.1. "Own" Data Definition

When permission matrix shows "Own", it means:

**For Patient**:
- Can only access their own data
- Enforced by: `WHERE patient_id = current_user.patient_id`
- Examples:
  * Own medical records
  * Own appointments
  * Own prescriptions
  * Own lab results
  * Own billing

**For Doctor**:
- Can access patients assigned to them via appointments
- Enforced by: `WHERE patient_id IN (SELECT patient_id FROM appointments WHERE doctor_id = current_user.provider_id)`
- Examples:
  * Medical records of assigned patients
  * Appointments where doctor is assigned
  * Lab results of assigned patients

**For Nurse**:
- Can access patients in their assigned department/ward
- Enforced by: `WHERE patient_id IN (SELECT patient_id FROM patient_assignments WHERE nurse_id = current_user.provider_id)`
- Examples:
  * Vital signs of assigned patients
  * Medications of assigned patients
  * Lab specimens of assigned patients

**For Receptionist**:
- Can access all patients for scheduling and billing
- No ownership restriction for operational needs
- Examples:
  * All patient demographics
  * All appointments
  * All billing records

**For Admin**:
- Full access to all data
- No ownership restrictions
- Used for system administration and reporting

---

#### 5.3.2. Event-Based Access Control

Access to patient data is also controlled via events:

**UserRegistered Event**:
- When patient self-registers → Patient Registry creates profile
- Patient automatically gets access to own data

**AppointmentScheduled Event**:
- When appointment is scheduled → Doctor gets access to patient data
- Access is temporary (until appointment is completed)

**PatientAssigned Event**:
- When patient is assigned to nurse → Nurse gets access to patient data
- Access is temporary (until patient is discharged)

**PatientDischarged Event**:
- When patient is discharged → Temporary access is revoked
- Only permanent staff (Admin) retains access

---

#### 5.3.3. Permission Enforcement in Identity Service

Identity Service enforces permissions using:

1. **Role-Based Access Control (RBAC)**:
   ```sql
   SELECT p.permission_name
   FROM user_roles ur
   JOIN role_permissions rp ON ur.role_id = rp.role_id
   JOIN permissions p ON rp.permission_id = p.id
   WHERE ur.user_id = $1
   ```

2. **Ownership Check**:
   ```sql
   -- For Patient
   SELECT * FROM medical_records
   WHERE patient_id = (
     SELECT patient_id FROM patients WHERE user_id = $1
   )

   -- For Doctor
   SELECT * FROM medical_records
   WHERE patient_id IN (
     SELECT patient_id FROM appointments
     WHERE doctor_id = (
       SELECT provider_id FROM providers WHERE user_id = $1
     )
   )
   ```

3. **Event-Based Access**:
   - Subscribe to `AppointmentScheduled` event
   - Grant temporary access to doctor
   - Subscribe to `AppointmentCompleted` event
   - Revoke temporary access

---

#### 5.3.4. Permission Matrix with Ownership Rules

| Permission | Admin | Doctor | Nurse | Patient | Receptionist | Ownership Rule |
|------------|-------|--------|-------|---------|--------------|----------------|
| patients:read | All | Assigned | Assigned | Own | All | Doctor: via appointments, Nurse: via assignments |
| medical-records:read | All | Assigned | Assigned | Own | None | Doctor: via appointments, Nurse: via assignments |
| appointments:read | All | Assigned | Assigned | Own | All | Doctor: where doctor_id = user, Patient: where patient_id = user |
| prescriptions:read | All | Created | Assigned | Own | None | Doctor: where doctor_id = user, Nurse: via patient assignment |
| lab-results:read | All | Ordered | Assigned | Own | None | Doctor: where doctor_id = user, Nurse: via patient assignment |

---

## 6. SERVICE INTERACTIONS

### 6.1. Service Access by Role

| Service | Admin | Doctor | Nurse | Patient | Receptionist |
|---------|-------|--------|-------|---------|--------------|
| **Identity Service** | ✅ Full | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| **Patient Registry** | ✅ Full | ✅ Read/Write | ✅ Read/Write | ✅ Own | ✅ Read/Write |
| **Provider/Staff** | ✅ Full | ✅ Read Own | ✅ Read Own | ❌ No | ✅ Read |
| **Scheduling** | ✅ Full | ✅ Read/Write | ✅ Read/Write | ✅ Own | ✅ Full |
| **Clinical/EMR** | ✅ Full | ✅ Read/Write | ✅ Read/Write | ✅ Own | ❌ No |
| **Billing** | ✅ Full | ❌ No | ❌ No | ✅ Own | ✅ Full |
| **Notifications** | ✅ Full | ✅ Receive | ✅ Receive | ✅ Receive | ✅ Receive |

### 6.2. Cross-Service Workflows

#### Workflow 1: Patient Registration
```
RECEPTIONIST → Patient Registry Service → Identity Service
                                        → Notification Service
```

#### Workflow 2: Doctor Consultation
```
DOCTOR → Clinical Service → Patient Registry Service
                         → Notification Service
                         → Audit Service
```

#### Workflow 3: Appointment Booking
```
PATIENT → Scheduling Service → Provider Service (check availability)
                            → Notification Service (confirm)
```

---

## 7. UI/UX REQUIREMENTS

### 7.1. Admin Dashboard

**Layout**: Full-width admin panel with sidebar navigation

**Key Sections**:
- Dashboard (Overview stats)
- User Management
  - Staff List
  - Create Staff
  - Roles & Permissions
- Departments
- Reports & Analytics
- System Settings
- Audit Logs

**Key Features**:
- Search users
- Filter by role
- Bulk actions
- Export data
- Real-time notifications

---

### 7.2. Doctor Dashboard

**Layout**: Medical-focused interface with patient list

**Key Sections**:
- Dashboard (Today's appointments)
- Patients
  - Patient List
  - Patient Search
  - Medical Records
- Appointments
  - Today's Schedule
  - Upcoming Appointments
- Lab Results
- Prescriptions
- Profile

**Key Features**:
- Quick patient search
- Recent patients
- Pending lab results
- Appointment reminders
- Medical notes editor

---

### 7.3. Nurse Dashboard

**Layout**: Task-oriented interface with patient queue

**Key Sections**:
- Dashboard (Patient queue)
- Patients
  - Assigned Patients
  - Vital Signs Entry
- Medications
  - Medication Schedule
  - Administration Log
- Lab Orders
  - Pending Collections
  - Result Entry
- Tasks

**Key Features**:
- Patient queue management
- Quick vital signs entry
- Medication checklist
- Lab specimen tracking
- Task notifications

---

### 7.4. Receptionist Dashboard

**Layout**: Front-desk focused with calendar view

**Key Sections**:
- Dashboard (Today's appointments)
- Appointments
  - Calendar View
  - Schedule Appointment
  - Check-in Queue
- Patients
  - Patient Registration
  - Patient Search
- Billing
  - Invoices
  - Payments
  - Outstanding Bills

**Key Features**:
- Drag-and-drop scheduling
- Quick check-in
- Payment processing
- Print receipts
- Appointment reminders

---

### 7.5. Patient Portal

**Layout**: Consumer-friendly, mobile-responsive

**Key Sections**:
- Dashboard (Upcoming appointments)
- Appointments
  - Book Appointment
  - My Appointments
- Medical Records
  - Visit History
  - Lab Results
  - Prescriptions
- Billing
  - Invoices
  - Payment History
- Profile

**Key Features**:
- Easy appointment booking
- Download medical reports
- View prescriptions
- Online payment
- Notifications

---

## 8. IMPLEMENTATION PRIORITIES

### Phase 1: Core Roles (P0 - 3 weeks)

**Week 1: Patient & Receptionist**
- [ ] Patient self-registration
- [ ] Receptionist appointment scheduling
- [ ] Basic patient management

**Week 2: Doctor & Nurse**
- [ ] Doctor medical records access
- [ ] Nurse vital signs entry
- [ ] Basic clinical workflows

**Week 3: Admin**
- [ ] Admin user management
- [ ] Role assignment
- [ ] Basic reports

### Phase 2: Advanced Features (P1 - 2 weeks)

- [ ] Lab orders & results
- [ ] Prescriptions
- [ ] Billing & payments
- [ ] Advanced permissions

### Phase 3: Optimization (P2 - 1 week)

- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Mobile responsiveness
- [ ] Analytics

---

## 9. VALIDATION CHECKLIST

Before implementation, verify:

- [ ] All role boundaries are clear and non-overlapping
- [ ] Use cases cover all core workflows
- [ ] Permission matrix is complete
- [ ] Service interactions are defined
- [ ] UI/UX requirements are specified
- [ ] Implementation priorities are agreed upon
- [ ] Stakeholders have reviewed and approved

---

## 10. NEXT STEPS

1. **Review this document** with stakeholders
2. **Approve role boundaries** and responsibilities
3. **Finalize permission matrix**
4. **Create detailed API specifications** for each role
5. **Design UI mockups** for each dashboard
6. **Begin implementation** following priorities

---

**Document Status**: 📋 DRAFT - Awaiting Review
**Last Updated**: 2025-01-06
**Next Review**: Pending stakeholder feedback

---

**Questions for Review**:
1. Are the role boundaries clear and appropriate?
2. Are there any missing use cases?
3. Is the permission matrix complete?
4. Are the workflows realistic?
5. Are the UI/UX requirements sufficient?

