# Frontend Architecture - Hospital Management System V2

> **Comprehensive guide for frontend development based on backend API analysis**

**Version**: 2.0.0  
**Last Updated**: 2025-01-11  
**Status**: Planning & Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Pages Inventory](#pages-inventory)
4. [User Journeys](#user-journeys)
5. [Design System](#design-system)
6. [Technical Stack](#technical-stack)
7. [Development Roadmap](#development-roadmap)
8. [API Integration](#api-integration)

---

## Executive Summary

### Project Scope

**Total Backend Services**: 8 microservices  
**Total API Endpoints**: 150+ endpoints  
**Total Frontend Pages**: 80 pages  
**User Roles**: 5 roles (SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PATIENT)

### Pages Breakdown

| Priority | Count | Percentage | Timeline |
|----------|-------|------------|----------|
| **P0 - Critical** | 31 pages | 39% | Week 1-2 |
| **P1 - Important** | 29 pages | 36% | Week 3-4 |
| **P2 - Nice-to-Have** | 20 pages | 25% | Week 5-6 |
| **TOTAL** | **80 pages** | 100% | 6 weeks |

### Pages by Category

| Category | P0 | P1 | P2 | Total |
|----------|----|----|-------|-------|
| Public/Marketing | 3 | 4 | 5 | 12 |
| Authentication | 3 | 3 | 1 | 7 |
| Patient Portal | 3 | 5 | 2 | 10 |
| Doctor Portal | 4 | 4 | 3 | 11 |
| Nurse Portal | 3 | 2 | 0 | 5 |
| Admin Portal | 3 | 6 | 5 | 14 |
| Shared Components | 3 | 3 | 2 | 8 |
| Multi-Role | 9 | 2 | 2 | 13 |
| **TOTAL** | **31** | **29** | **20** | **80** |

---

## System Overview

### Backend Services

| Service | Port | Endpoints | Status | Swagger URL |
|---------|------|-----------|--------|-------------|
| Identity Service | 3021 | 13+ | ✅ Ready | http://localhost:3021/api-docs |
| Patient Registry | 3023 | 35+ | ✅ Ready | http://localhost:3023/api-docs |
| Provider/Staff | 3022 | 21+ | ✅ Ready | http://localhost:3022/api-docs |
| Appointments | 3024 | 17+ | ✅ Ready | http://localhost:3024/api-docs |
| Clinical EMR | 3027 | 24+ | ✅ Ready | http://localhost:3027/api-docs |
| Billing | 3029 | 45+ | ✅ Ready | http://localhost:3029/api-docs |
| Notifications | 3031 | 8+ | ✅ Ready | http://localhost:3031/api-docs |
| Scheduler | 3030 | 6+ | ✅ Ready | http://localhost:3030/api-docs |
| **API Gateway** | 3101 | All | ✅ Ready | Proxy to services |

### User Roles & Permissions

| Role | Access Level | Primary Functions |
|------|--------------|-------------------|
| **SUPER_ADMIN** | Full system access | System configuration, user management, all reports |
| **ADMIN** | Administrative access | User management, billing, reports, patient registry |
| **DOCTOR** | Medical staff access | Patient examination, EMR, prescriptions, schedules |
| **NURSE** | Nursing staff access | Patient check-in, vitals recording, queue management |
| **PATIENT** | Patient portal access | Book appointments, view records, payments |

---

## Pages Inventory

### 0. Public & Marketing Pages

#### P0 - Critical (Must Have for Demo)

**1. Homepage / Landing Page**
- **Route**: `/`
- **APIs**:
  - `GET /api/v1/providers/search?specialization=*` - Featured doctors
  - `GET /health` - System status
- **Sections**:
  - Hero section với CTA "Đặt lịch khám ngay"
  - Features section (4 key features)
  - Departments section (6-8 departments)
  - Featured doctors carousel
  - Statistics counters
  - Testimonials
  - Footer với contact info
- **Navigation**: Login/Register buttons, main menu
- **Business Flow**: Entry point cho potential patients

**2. About Us Page**
- **Route**: `/about`
- **Content**:
  - Hospital history
  - Leadership team
  - Facilities & equipment
  - Certifications & awards
  - Vision & mission
- **Business Flow**: Build trust với potential patients

**3. Services / Departments Page**
- **Route**: `/services` hoặc `/departments`
- **APIs**:
  - `GET /api/v1/departments` - List departments
- **Content**:
  - Grid layout các chuyên khoa
  - Mô tả dịch vụ từng khoa
  - Bác sĩ theo từng khoa
  - Giá dịch vụ (nếu public)
- **Business Flow**: Help patients find right department

#### P1 - Important

**4. Doctors Directory Page**
- **Route**: `/doctors`
- **APIs**:
  - `GET /api/v1/providers/search` - Search doctors
  - `GET /api/v1/providers/:staffId` - Doctor profile (public info)
- **Features**:
  - Danh sách bác sĩ với ảnh, chuyên khoa, kinh nghiệm
  - Filter by specialization, availability
  - Search by name
  - View doctor profile
  - "Đặt lịch với bác sĩ này" button → redirect to login/register
- **Business Flow**: Help patients choose doctor

**5. Doctor Public Profile Page**
- **Route**: `/doctors/:doctorId`
- **APIs**:
  - `GET /api/v1/providers/:staffId` - Doctor info
  - `GET /api/v1/providers/:staffId/schedule` - Available slots
- **Features**:
  - Doctor photo, name, specialization
  - Education & credentials
  - Experience & expertise
  - Patient reviews (nếu có)
  - Available time slots
  - "Đặt lịch" button → redirect to login/register
- **Business Flow**: Doctor discovery

**6. Contact Us Page**
- **Route**: `/contact`
- **APIs**:
  - `POST /api/v1/contact-form` - Submit contact form
- **Features**:
  - Contact form (name, email, phone, message)
  - Địa chỉ bệnh viện
  - Google Maps embed
  - Hotline numbers
  - Email addresses
  - Social media links
- **Business Flow**: Patient inquiries

**7. FAQ Page**
- **Route**: `/faq`
- **Content**:
  - Câu hỏi thường gặp về đặt lịch, thanh toán, bảo hiểm
  - Accordion UI
- **Business Flow**: Self-service support

#### P2 - Nice-to-Have

**8. News & Articles Page**
- **Route**: `/news`
- **APIs**: `GET /api/v1/articles` - List articles
- **Business Flow**: Content marketing, SEO

**9. Health Tips / Blog Page**
- **Route**: `/blog`
- **Business Flow**: Patient education, SEO

**10. Pricing / Service Fees Page**
- **Route**: `/pricing`
- **APIs**: `GET /api/v1/service-catalog` - Service prices
- **Business Flow**: Transparency

**11. Careers Page**
- **Route**: `/careers`
- **Business Flow**: Recruitment

**12. Privacy Policy Page**
- **Route**: `/privacy`
- **Business Flow**: Legal compliance

**13. Terms of Service Page**
- **Route**: `/terms`
- **Business Flow**: Legal compliance

---

### 1. Authentication & Authorization Pages

#### P0 - Critical

**14. Login Page**
- **Route**: `/login`
- **APIs**: `POST /api/v1/auth/login`
- **Features**:
  - Email/password login
  - MFA code input (nếu enabled)
  - Remember me checkbox
  - Forgot password link
  - Register link
- **Roles**: All (public)
- **Business Flow**: Entry point cho tất cả user journeys

**15. Register Page**
- **Route**: `/register`
- **APIs**: `POST /api/v1/auth/register`
- **Features**:
  - Patient self-registration form
  - Email verification notice
  - Terms acceptance checkbox
- **Roles**: Public (patient only)
- **Business Flow**: Patient onboarding

**16. Email Verification Page**
- **Route**: `/verify-email`
- **APIs**:
  - `GET /api/v1/auth/verify-email` - Verify from link
  - `POST /api/v1/auth/resend-verification` - Resend email
- **Features**:
  - Verify email from link
  - Resend verification email button
  - Success/error messages
- **Roles**: Public
- **Business Flow**: Complete registration

#### P1 - Important

**17. Forgot Password Page**
- **Route**: `/forgot-password`
- **APIs**: `POST /api/v1/auth/forgot-password`
- **Features**: Request password reset email
- **Roles**: Public
- **Business Flow**: Account recovery

**18. Reset Password Page**
- **Route**: `/reset-password`
- **APIs**: `POST /api/v1/auth/reset-password`
- **Features**: Set new password with token from email
- **Roles**: Public
- **Business Flow**: Account recovery

**19. Staff Activation Page**
- **Route**: `/activate-staff`
- **APIs**: `POST /api/v1/auth/activate-staff`
- **Features**: Staff sets password from invitation email
- **Roles**: Public (staff only)
- **Business Flow**: Staff onboarding

#### P2 - Nice-to-Have

**20. MFA Setup Page**
- **Route**: `/settings/mfa`
- **APIs**:
  - `POST /api/v1/auth/mfa/enable`
  - `POST /api/v1/auth/mfa/disable`
- **Features**: Enable/disable 2FA, QR code display
- **Roles**: Authenticated users
- **Business Flow**: Security enhancement

---

### 2. Patient Portal Pages

#### P0 - Critical

**21. Patient Dashboard**
- **Route**: `/patient/dashboard`
- **APIs**:
  - `GET /api/v1/patients/:patientId` - Profile info
  - `GET /api/v1/appointments` - Upcoming appointments
  - `GET /api/v1/patients/:patientId/insurance` - Insurance status
- **Features**:
  - Welcome message
  - Upcoming appointments widget
  - Insurance status widget
  - Quick actions (book appointment, view records)
- **Roles**: PATIENT
- **Business Flow**: Patient home page

**22. Book Appointment Page**
- **Route**: `/patient/appointments/book`
- **APIs**:
  - `GET /api/v1/availability/doctors` - Available doctors
  - `GET /api/v1/availability/slots` - Available time slots
  - `POST /api/v1/appointments` - Create appointment
- **Features**:
  - Select doctor (search, filter by specialization)
  - Select date/time (calendar view)
  - Select service type
  - Confirm booking
- **Roles**: PATIENT
- **Business Flow**: Core patient journey - booking

**23. My Appointments Page**
- **Route**: `/patient/appointments`
- **APIs**:
  - `GET /api/v1/appointments` - List appointments
  - `POST /api/v1/appointments/:id/cancel` - Cancel
  - `POST /api/v1/appointments/:id/reschedule` - Reschedule
- **Features**:
  - List view (upcoming/past tabs)
  - Cancel appointment
  - Reschedule appointment
  - View appointment details
- **Roles**: PATIENT
- **Business Flow**: Appointment management

#### P1 - Important

**24. Patient Profile Page**
- **Route**: `/patient/profile`
- **APIs**:
  - `GET /api/v1/patients/:patientId` - Get profile
  - `PUT /api/v1/patients/:patientId` - Update profile
  - `POST /api/v1/patients/:patientId/photo` - Upload photo
- **Features**:
  - Personal info (name, DOB, gender, CCCD)
  - Contact info (phone, email, address)
  - Photo upload
  - Edit profile form
- **Roles**: PATIENT
- **Business Flow**: Profile management

**25. Medical History Page**
- **Route**: `/patient/medical-history`
- **APIs**:
  - `GET /api/v1/patients/:patientId/history` - Medical history
  - `GET /api/v1/patients/:patientId/medical-records` - EMR records
- **Features**:
  - View past diagnoses
  - View medications
  - View allergies
  - View lab results
  - Timeline view
- **Roles**: PATIENT
- **Business Flow**: Patient health tracking

**26. Insurance Management Page**
- **Route**: `/patient/insurance`
- **APIs**:
  - `GET /api/v1/patients/:patientId/insurance` - Get insurance
  - `PUT /api/v1/patients/:patientId/insurance` - Update insurance
  - `POST /api/v1/patients/:patientId/insurance/verify` - Verify BHYT
- **Features**:
  - BHYT/BHTN info display
  - Verification status
  - Update insurance info
  - Upload insurance card photo
- **Roles**: PATIENT
- **Business Flow**: Insurance management

**27. Emergency Contacts Page**
- **Route**: `/patient/emergency-contacts`
- **APIs**:
  - `GET /api/v1/patients/:patientId/emergency-contacts` - List
  - `POST /api/v1/patients/:patientId/emergency-contacts` - Add
  - `PUT /api/v1/patients/:patientId/emergency-contacts/:contactId` - Update
  - `DELETE /api/v1/patients/:patientId/emergency-contacts/:contactId` - Remove
- **Features**:
  - List emergency contacts
  - Add/edit/delete contacts
  - Set primary contact
- **Roles**: PATIENT
- **Business Flow**: Safety management

**28. Billing & Payments Page**
- **Route**: `/patient/billing`
- **APIs**:
  - `GET /api/v1/patients/:patientId/invoices` - List invoices
  - `GET /api/v1/patients/:patientId/payment-history` - Payment history
  - `GET /api/v1/patients/:patientId/outstanding-balance` - Outstanding
  - `POST /api/v1/payos/create-payment-link` - Create payment
- **Features**:
  - View invoices (paid/unpaid)
  - Payment history
  - Outstanding balance
  - Pay online (PayOS integration)
  - Download invoice PDF
- **Roles**: PATIENT
- **Business Flow**: Payment management

#### P2 - Nice-to-Have

**29. Consent Management Page**
- **Route**: `/patient/consents`
- **APIs**:
  - `GET /api/v1/patients/:patientId/consents` - List consents
  - `POST /api/v1/patients/:patientId/consents` - Grant consent
  - `POST /api/v1/patients/:patientId/consents/:consentId/revoke` - Revoke
- **Features**:
  - View consents (active/revoked)
  - Grant consent (HIPAA compliance)
  - Revoke consent
- **Roles**: PATIENT
- **Business Flow**: Privacy management

**30. Communication Preferences Page**
- **Route**: `/patient/preferences`
- **APIs**:
  - `GET /api/v1/patients/:patientId/communication` - Get preferences
  - `PUT /api/v1/patients/:patientId/communication` - Update
- **Features**:
  - Email/SMS/phone preferences
  - Notification settings
  - Language preference
- **Roles**: PATIENT
- **Business Flow**: Notification management

---

### 3. Doctor Portal Pages

#### P0 - Critical

**31. Doctor Dashboard**
- **Route**: `/doctor/dashboard`
- **APIs**:
  - `GET /api/v1/appointments` - Today's appointments
  - `GET /api/v1/queue/status` - Queue status
  - `GET /api/v1/doctors/:doctorId/statistics` - Statistics
- **Features**:
  - Today's schedule widget
  - Queue status widget
  - Patient count widget
  - Quick stats (completed, pending, cancelled)
- **Roles**: DOCTOR
- **Business Flow**: Doctor home page

**32. Appointment Schedule Page**
- **Route**: `/doctor/schedule`
- **APIs**:
  - `GET /api/v1/appointments` - List appointments (calendar view)
  - `POST /api/v1/appointments/:id/confirm` - Confirm
  - `POST /api/v1/appointments/:id/start` - Start consultation
- **Features**:
  - Calendar view (day/week/month)
  - Confirm appointments
  - Start consultation
  - View patient info
- **Roles**: DOCTOR
- **Business Flow**: Schedule management

**33. Queue Management Page**
- **Route**: `/doctor/queue`
- **APIs**:
  - `GET /api/v1/queue/status` - Queue status
  - `POST /api/v1/queue/call-next` - Call next patient
- **Features**:
  - Current queue display
  - Call next patient button
  - Patient waiting time
  - Queue statistics
- **Roles**: DOCTOR
- **Business Flow**: Patient flow management

**34. Patient Examination Page**
- **Route**: `/doctor/examination/:appointmentId`
- **APIs**:
  - `GET /api/v1/patients/:patientId` - Patient info
  - `GET /api/v1/patients/:patientId/medical-records` - Medical history
  - `POST /api/v1/medical-records` - Create EMR
  - `POST /api/v1/medical-records/:recordId/diagnoses` - Add diagnosis
  - `POST /api/v1/medical-records/:recordId/medications` - Add medication
  - `PUT /api/v1/medical-records/:recordId/vital-signs` - Record vitals
- **Features**:
  - Patient info panel
  - Medical history panel
  - Record vitals form
  - Add diagnosis form
  - Prescribe medication form
  - Clinical notes textarea
  - Complete examination button
- **Roles**: DOCTOR
- **Business Flow**: Core doctor workflow - examination

#### P1 - Important

**35. Medical Records Management Page**
- **Route**: `/doctor/medical-records`
- **APIs**:
  - `GET /api/v1/doctors/:doctorId/medical-records` - Doctor's records
  - `GET /api/v1/medical-records/:recordId` - View record
  - `PUT /api/v1/medical-records/:recordId` - Update record
- **Features**:
  - Search records (by patient name, date)
  - View/edit records
  - Archive records
  - Filter by date range
- **Roles**: DOCTOR
- **Business Flow**: EMR management

**36. Prescription Management Page**
- **Route**: `/doctor/prescriptions`
- **APIs**:
  - `POST /api/v1/prescriptions` - Create prescription
  - `GET /api/v1/prescriptions/:id` - View prescription
  - `PUT /api/v1/prescriptions/:id` - Update prescription
- **Features**:
  - Create prescription
  - Medication search
  - Dosage instructions
  - Print prescription
- **Roles**: DOCTOR
- **Business Flow**: Medication management

**37. Lab Results Review Page**
- **Route**: `/doctor/lab-results`
- **APIs**:
  - `GET /api/v1/lab-results` - List lab results
  - `POST /api/v1/lab-results` - Add lab result
  - `PUT /api/v1/lab-results/:id` - Update result
- **Features**:
  - View lab results
  - Add interpretations
  - Flag abnormal values
  - Compare with previous results
- **Roles**: DOCTOR
- **Business Flow**: Diagnostic workflow

**38. Doctor Profile & Schedule Page**
- **Route**: `/doctor/profile`
- **APIs**:
  - `GET /api/v1/providers/:staffId` - Get profile
  - `PUT /api/v1/providers/:staffId` - Update profile
  - `GET /api/v1/providers/:staffId/schedule` - Get schedule
  - `PUT /api/v1/providers/:staffId/schedule` - Update schedule
- **Features**:
  - Personal info
  - Credentials & certifications
  - Specializations
  - Working hours configuration
- **Roles**: DOCTOR
- **Business Flow**: Profile management

#### P2 - Nice-to-Have

**39. Clinical Notes Page**
- **Route**: `/doctor/clinical-notes`
- **APIs**:
  - `POST /api/v1/clinical-notes` - Create note
  - `GET /api/v1/clinical-notes` - List notes
- **Features**:
  - SOAP notes
  - Voice-to-text
  - Templates
- **Roles**: DOCTOR
- **Business Flow**: Documentation

**40. Treatment Plans Page**
- **Route**: `/doctor/treatment-plans`
- **APIs**:
  - `POST /api/v1/treatment-plans` - Create plan
  - `GET /api/v1/treatment-plans/:id` - View plan
- **Features**:
  - Create treatment plan
  - Track progress
  - Update plan
- **Roles**: DOCTOR
- **Business Flow**: Long-term care management

**41. Doctor Statistics Page**
- **Route**: `/doctor/statistics`
- **APIs**:
  - `GET /api/v1/doctors/:doctorId/statistics` - Doctor stats
  - `GET /api/v1/statistics/doctor/:doctorId` - Billing stats
- **Features**:
  - Patient count
  - Revenue
  - Appointment completion rate
  - Charts & graphs
- **Roles**: DOCTOR
- **Business Flow**: Performance tracking

---

### 4. Nurse Portal Pages

#### P0 - Critical

**42. Nurse Dashboard**
- **Route**: `/nurse/dashboard`
- **APIs**:
  - `GET /api/v1/appointments` - Today's appointments
  - `GET /api/v1/queue/status` - Queue status
- **Features**:
  - Today's patients widget
  - Queue status widget
  - Quick actions
- **Roles**: NURSE
- **Business Flow**: Nurse home page

**43. Patient Check-in Page**
- **Route**: `/nurse/check-in`
- **APIs**:
  - `POST /api/v1/appointments/:id/check-in` - Check-in patient
  - `POST /api/v1/queue/join` - Add to queue
- **Features**:
  - Search patient (by name, ID, appointment)
  - Verify appointment
  - Check-in button
  - Add to queue
- **Roles**: NURSE
- **Business Flow**: Patient arrival workflow

**44. Vital Signs Recording Page**
- **Route**: `/nurse/vitals/:patientId`
- **APIs**:
  - `PUT /api/v1/medical-records/:recordId/vital-signs` - Record vitals
- **Features**:
  - Record BP (systolic/diastolic)
  - Record temperature
  - Record pulse
  - Record weight
  - Record height
  - Calculate BMI
- **Roles**: NURSE
- **Business Flow**: Pre-examination workflow

#### P1 - Important

**45. Patient List Page**
- **Route**: `/nurse/patients`
- **APIs**:
  - `GET /api/v1/patients/search` - Search patients
  - `GET /api/v1/patients/:patientId` - View patient
- **Features**:
  - Search patients
  - View patient info
  - Quick actions (check-in, view history)
- **Roles**: NURSE
- **Business Flow**: Patient lookup

**46. Appointment Management Page**
- **Route**: `/nurse/appointments`
- **APIs**:
  - `GET /api/v1/appointments` - List appointments
  - `POST /api/v1/appointments/:id/reschedule` - Reschedule
- **Features**:
  - View appointments
  - Reschedule appointments
  - Cancel appointments
- **Roles**: NURSE
- **Business Flow**: Schedule coordination

---

### 5. Admin Portal Pages

#### P0 - Critical

**47. Admin Dashboard**
- **Route**: `/admin/dashboard`
- **APIs**:
  - `GET /api/v1/patients/statistics` - Patient stats
  - `GET /api/v1/statistics/dashboard` - Billing dashboard
  - `GET /api/v1/appointments/statistics` - Appointment stats
- **Features**:
  - System overview
  - Key metrics (patients, appointments, revenue)
  - Recent activities
  - Charts & graphs
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Admin home page

**48. User Management Page**
- **Route**: `/admin/users`
- **APIs**:
  - `GET /api/v1/users` - List users
  - `POST /api/v1/users` - Create user
  - `PUT /api/v1/users/:id` - Update user
  - `DELETE /api/v1/users/:id` - Delete user
- **Features**:
  - List users (table view)
  - Create/edit/delete users
  - Assign roles
  - Activate/deactivate users
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: User administration

**49. Staff Management Page**
- **Route**: `/admin/staff`
- **APIs**:
  - `GET /api/v1/providers/search` - Search staff
  - `POST /api/v1/providers` - Create staff
  - `PUT /api/v1/providers/:staffId` - Update staff
  - `POST /api/v1/providers/:staffId/activate` - Activate
  - `POST /api/v1/providers/:staffId/suspend` - Suspend
- **Features**:
  - List staff (doctors, nurses)
  - Add/edit staff
  - Manage credentials
  - Activate/suspend staff
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Staff administration

#### P1 - Important

**50. Patient Registry Management Page**
- **Route**: `/admin/patients`
- **APIs**:
  - `GET /api/v1/patients/search` - Search patients
  - `POST /api/v1/patients` - Register patient
  - `PUT /api/v1/patients/:patientId` - Update patient
  - `POST /api/v1/patients/merge` - Merge duplicates
- **Features**:
  - Search patients
  - Register new patient
  - Edit patient info
  - Merge duplicate records
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Patient data management

**51. Billing Reports Page**
- **Route**: `/admin/billing/reports`
- **APIs**:
  - `GET /api/v1/reports/revenue` - Revenue report
  - `GET /api/v1/reports/outstanding` - Outstanding report
  - `GET /api/v1/reports/insurance-claims` - Claims report
  - `GET /api/v1/reports/payment-trends` - Payment trends
- **Features**:
  - Revenue reports (daily/monthly/yearly)
  - Outstanding invoices report
  - Insurance claims report
  - Payment trends charts
  - Export to Excel/PDF
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Financial reporting

**52. Invoice Management Page**
- **Route**: `/admin/invoices`
- **APIs**:
  - `GET /api/v1/invoices` - List invoices
  - `POST /api/v1/invoices` - Create invoice
  - `PUT /api/v1/invoices/:id/finalize` - Finalize invoice
  - `PUT /api/v1/invoices/:id/cancel` - Cancel invoice
- **Features**:
  - Create/edit invoices
  - Finalize invoices
  - Cancel invoices
  - Send reminders
  - Download PDF
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Billing administration

**53. Insurance Claims Management Page**
- **Route**: `/admin/insurance-claims`
- **APIs**:
  - `GET /api/v1/insurance-claims` - List claims
  - `POST /api/v1/invoices/:id/insurance-claim` - Submit claim
  - `PUT /api/v1/insurance-claims/:claimId/approve` - Approve
  - `PUT /api/v1/insurance-claims/:claimId/reject` - Reject
- **Features**:
  - Submit claims to BHYT/BHTN
  - Approve/reject claims
  - Track claim status
  - Export claims data
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Insurance processing

**54. Appointment Analytics Page**
- **Route**: `/admin/analytics/appointments`
- **APIs**:
  - `GET /api/v1/appointments/statistics` - Appointment stats
  - `GET /api/v1/appointments/history` - Appointment history
- **Features**:
  - Appointment trends
  - No-show rates
  - Completion rates
  - Doctor performance
  - Charts & graphs
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Operational analytics

**55. Audit Logs Page**
- **Route**: `/admin/audit-logs`
- **APIs**:
  - `GET /api/v1/audit-logs` - Get audit logs
  - `GET /api/v1/medical-records/:recordId/access/audit` - Access audit
- **Features**:
  - View audit logs
  - Filter by user/action/date
  - Export logs
  - HIPAA compliance tracking
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Compliance & security

#### P2 - Nice-to-Have

**56. Role & Permission Management Page**
- **Route**: `/admin/roles`
- **APIs**:
  - `GET /api/v1/permissions` - List permissions
  - `POST /api/v1/permissions` - Create permission
  - `PUT /api/v1/permissions/:id` - Update permission
- **Features**:
  - Manage roles
  - Assign permissions
  - RBAC configuration
- **Roles**: SUPER_ADMIN
- **Business Flow**: Access control

**57. Password Policy Configuration Page**
- **Route**: `/admin/settings/password-policy`
- **APIs**:
  - `GET /api/v1/password-policies` - Get policies
  - `PUT /api/v1/password-policies` - Update policies
- **Features**:
  - Configure password rules
  - Password expiration
  - Complexity requirements
- **Roles**: SUPER_ADMIN
- **Business Flow**: Security configuration

**58. Notification Templates Page**
- **Route**: `/admin/notifications/templates`
- **APIs**:
  - `GET /api/v1/notifications/templates` - List templates
  - `POST /api/v1/notifications/templates` - Create template
  - `PUT /api/v1/notifications/templates/:id` - Update template
  - `DELETE /api/v1/notifications/templates/:id` - Delete template
- **Features**:
  - Manage email/SMS templates
  - Preview templates
  - Variable placeholders
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Communication management

**59. System Settings Page**
- **Route**: `/admin/settings`
- **Features**:
  - General settings
  - Business hours
  - Holidays configuration
  - System preferences
- **Roles**: SUPER_ADMIN
- **Business Flow**: System configuration

**60. FHIR Export Page**
- **Route**: `/admin/fhir/export`
- **APIs**:
  - `POST /api/v1/fhir/bulk-export` - Bulk export FHIR
  - `GET /api/v1/medical-records/:recordId/fhir` - Get FHIR record
- **Features**:
  - Export FHIR data
  - Validate FHIR compliance
  - Download FHIR bundles
- **Roles**: ADMIN, SUPER_ADMIN
- **Business Flow**: Data interoperability

---

### 6. Shared Components & Utilities

#### P0 - Critical

**61. Navigation Bar Component**
- **Location**: `components/layout/Navbar.tsx`
- **Features**:
  - Logo
  - User menu (profile, settings, logout)
  - Notifications badge
  - Role-based menu items
- **Roles**: All authenticated users

**62. Sidebar Menu Component**
- **Location**: `components/layout/Sidebar.tsx`
- **Features**:
  - Role-based navigation
  - Collapsible menu
  - Active state highlighting
  - Icons for menu items
- **Roles**: All authenticated users

**63. Patient Search Component**
- **Location**: `components/shared/PatientSearch.tsx`
- **APIs**: `GET /api/v1/patients/search`
- **Features**:
  - Search by name/ID/CCCD/BHYT
  - Autocomplete
  - Quick view patient info
- **Roles**: DOCTOR, NURSE, ADMIN

#### P1 - Important

**64. Notification Center Component**
- **Location**: `components/shared/NotificationCenter.tsx`
- **APIs**:
  - `GET /api/v1/notifications/:userId` - Get notifications
  - `PUT /api/v1/notifications/:id/read` - Mark as read
- **Features**:
  - Notification list
  - Mark as read
  - Notification preferences
  - Real-time updates
- **Roles**: All authenticated users

**65. Calendar Component**
- **Location**: `components/shared/Calendar.tsx`
- **Features**:
  - Month/week/day view
  - Appointment display
  - Drag-to-reschedule
  - Color-coded events
- **Roles**: DOCTOR, NURSE, ADMIN

**66. Data Table Component**
- **Location**: `components/shared/DataTable.tsx`
- **Features**:
  - Sorting
  - Filtering
  - Pagination
  - Export to CSV/Excel
  - Column customization
- **Roles**: All authenticated users

#### P2 - Nice-to-Have

**67. File Upload Component**
- **Location**: `components/shared/FileUpload.tsx`
- **Features**:
  - Drag-and-drop
  - Progress bar
  - File type validation
  - Multiple file upload
- **Roles**: All authenticated users

**68. Chart Components**
- **Location**: `components/shared/Charts/`
- **Features**:
  - Line charts
  - Bar charts
  - Pie charts
  - Area charts
- **Roles**: DOCTOR, ADMIN

---

## User Journeys

### Journey 1: New Patient Registration & Booking

**Steps**:
1. **Homepage** (`/`) → View hospital info, featured doctors
2. **Services Page** (`/services`) → Find suitable department
3. **Doctors Directory** (`/doctors`) → Choose doctor
4. **Doctor Profile** (`/doctors/:doctorId`) → View doctor info, available slots
5. **Register Page** (`/register`) → Create account
6. **Email Verification** (`/verify-email`) → Verify email
7. **Login Page** (`/login`) → Login
8. **Patient Dashboard** (`/patient/dashboard`) → View overview
9. **Book Appointment** (`/patient/appointments/book`) → Book appointment
10. **My Appointments** (`/patient/appointments`) → Confirm booking

**Duration**: ~10-15 minutes
**Success Criteria**: Appointment successfully booked

---

### Journey 2: Returning Patient - Book & Pay

**Steps**:
1. **Homepage** (`/`) → Click "Login"
2. **Login Page** (`/login`) → Login
3. **Patient Dashboard** (`/patient/dashboard`) → View upcoming appointments
4. **Book Appointment** (`/patient/appointments/book`) → Book new appointment
5. **Billing & Payments** (`/patient/billing`) → Pay outstanding invoice
6. **Medical History** (`/patient/medical-history`) → View past results

**Duration**: ~5-10 minutes
**Success Criteria**: New appointment booked, invoice paid

---

### Journey 3: Doctor Daily Workflow

**Steps**:
1. **Login Page** (`/login`) → Login
2. **Doctor Dashboard** (`/doctor/dashboard`) → View today's schedule
3. **Queue Management** (`/doctor/queue`) → Call next patient
4. **Patient Examination** (`/doctor/examination/:appointmentId`) → Examine patient, record EMR
5. **Prescription Management** (`/doctor/prescriptions`) → Create prescription
6. **Appointment Schedule** (`/doctor/schedule`) → View next week's schedule

**Duration**: Continuous throughout workday
**Success Criteria**: All patients examined, EMRs completed

---

### Journey 4: Nurse Check-in Workflow

**Steps**:
1. **Login Page** (`/login`) → Login
2. **Nurse Dashboard** (`/nurse/dashboard`) → View today's patients
3. **Patient Check-in** (`/nurse/check-in`) → Check-in arriving patient
4. **Vital Signs Recording** (`/nurse/vitals/:patientId`) → Record vitals
5. **Queue Management** (Doctor's page) → Patient added to queue

**Duration**: ~5 minutes per patient
**Success Criteria**: Patient checked in, vitals recorded

---

### Journey 5: Admin Operations

**Steps**:
1. **Login Page** (`/login`) → Login
2. **Admin Dashboard** (`/admin/dashboard`) → View system overview
3. **Staff Management** (`/admin/staff`) → Add new doctor
4. **Patient Registry** (`/admin/patients`) → Register walk-in patient
5. **Billing Reports** (`/admin/billing/reports`) → Generate revenue report
6. **Audit Logs** (`/admin/audit-logs`) → Review access logs

**Duration**: Varies by task
**Success Criteria**: Administrative tasks completed

---

## Design System

### Color Palette

#### Primary Colors
- **Primary Blue**: `#0066CC` - Trust, professionalism
- **Primary Green**: `#00A86B` - Health, wellness

#### Secondary Colors
- **Light Blue**: `#E6F2FF` - Backgrounds, hover states
- **Light Green**: `#E6F9F0` - Success states
- **Orange**: `#FF9500` - Warnings, CTAs
- **Red**: `#DC3545` - Errors, urgent actions

#### Neutral Colors
- **Dark Gray**: `#2C3E50` - Primary text
- **Medium Gray**: `#6C757D` - Secondary text
- **Light Gray**: `#F8F9FA` - Backgrounds, borders
- **White**: `#FFFFFF` - Card backgrounds

### Typography

#### Font Family (Vietnamese-friendly)
- **Headings**: `Inter` or `Roboto` (700, 600, 500)
- **Body**: `Inter` or `Roboto` (400, 500)
- **Monospace**: `Roboto Mono` (for IDs, codes)

#### Font Sizes
- **H1**: 48px (Homepage hero)
- **H2**: 36px (Section titles)
- **H3**: 24px (Card titles)
- **H4**: 20px (Subsection titles)
- **Body**: 16px (Default text)
- **Small**: 14px (Captions, labels)
- **Tiny**: 12px (Footnotes)

#### Line Heights
- **Headings**: 1.2
- **Body**: 1.5
- **Small**: 1.4

### Component Styles

#### Buttons
- **Primary**: Blue background, white text, rounded 8px
- **Secondary**: White background, blue border, blue text
- **Danger**: Red background, white text
- **Ghost**: Transparent background, colored text
- **Height**: 44px (mobile-friendly)
- **Padding**: 16px 24px

#### Cards
- **Background**: White
- **Shadow**: `0 2px 8px rgba(0,0,0,0.1)`
- **Border Radius**: 8px
- **Padding**: 24px
- **Hover**: Lift effect with shadow increase

#### Forms
- **Input Height**: 44px (mobile-friendly)
- **Border**: 1px solid `#E0E0E0`
- **Border Radius**: 6px
- **Focus**: Blue border `#0066CC`
- **Error**: Red border `#DC3545` + error message below
- **Label**: 14px, medium gray, margin-bottom 8px

#### Tables
- **Header**: Light gray background, bold text
- **Row**: White background, border-bottom
- **Hover**: Light blue background
- **Striped**: Alternate row colors (optional)

### Spacing System

**Base Unit**: 8px

- **xs**: 4px (0.5 units)
- **sm**: 8px (1 unit)
- **md**: 16px (2 units)
- **lg**: 24px (3 units)
- **xl**: 32px (4 units)
- **2xl**: 48px (6 units)
- **3xl**: 64px (8 units)

### Breakpoints (Responsive)

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1440px

---

## Technical Stack

### Frontend Framework
- **Framework**: Next.js 15.3.2 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.8.3

### UI & Styling
- **CSS Framework**: Tailwind CSS 4.1.7
- **Component Library**: shadcn/ui or Ant Design (Vietnamese-friendly)
- **Icons**: Lucide React or Heroicons
- **Fonts**: Inter or Roboto (Google Fonts)

### State Management
- **Global State**: Zustand or React Context
- **Server State**: TanStack Query (React Query)
- **Form State**: React Hook Form

### API Integration
- **HTTP Client**: Axios
- **API Types**: Generated from Swagger/OpenAPI specs
- **Base URL**: API Gateway at `http://localhost:3101`

### Form Handling
- **Forms**: React Hook Form
- **Validation**: Zod schema validation
- **Error Handling**: Custom error messages

### Data Visualization
- **Charts**: Recharts or Chart.js
- **Calendar**: FullCalendar or React Big Calendar
- **Date Picker**: date-fns + custom picker

### Utilities
- **Date Handling**: date-fns (Vietnamese locale support)
- **Formatting**: numeral.js (numbers), date-fns (dates)
- **Notifications**: react-hot-toast or sonner
- **Modals**: Radix UI Dialog or Headless UI

### Testing
- **Unit Tests**: Jest 29.7.0
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright (already configured)

### Development Tools
- **Linting**: ESLint 9.0.0
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Husky + lint-staged

---

## Development Roadmap

### Phase 1: MVP - P0 Pages (Week 1-2)

**Goal**: Demonstrate core functionality

**Pages to Build** (18 pages):
1. Homepage
2. About Us
3. Services
4. Login
5. Register
6. Email Verification
7. Patient Dashboard
8. Book Appointment
9. My Appointments
10. Doctor Dashboard
11. Appointment Schedule
12. Queue Management
13. Patient Examination
14. Admin Dashboard
15. User Management
16. Staff Management
17. Navigation Bar
18. Patient Search Component

**Deliverables**:
- ✅ Core user journeys working
- ✅ Authentication flow complete
- ✅ Patient booking flow complete
- ✅ Doctor examination flow complete
- ✅ Admin management flow complete

---

### Phase 2: Complete Demo - P1 Pages (Week 3-4)

**Goal**: Production-ready demo

**Additional Pages** (22 pages):
19. Doctors Directory
20. Doctor Public Profile
21. Contact Us
22. FAQ
23. Patient Profile
24. Medical History
25. Insurance Management
26. Emergency Contacts
27. Billing & Payments
28. Medical Records Management
29. Prescription Management
30. Lab Results Review
31. Doctor Profile & Schedule
32. Patient List (Nurse)
33. Appointment Management (Nurse)
34. Patient Registry Management
35. Billing Reports
36. Invoice Management
37. Insurance Claims Management
38. Appointment Analytics
39. Audit Logs
40. Notification Center
41. Calendar Component
42. Data Table Component

**Deliverables**:
- ✅ All user roles fully functional
- ✅ Complete patient journey
- ✅ Complete doctor workflow
- ✅ Complete admin operations
- ✅ Reporting & analytics

---

### Phase 3: Full Features - P2 Pages (Week 5-6)

**Goal**: Comprehensive system showcase

**Additional Pages** (20 pages):
43. News & Articles
44. Health Tips / Blog
45. Pricing
46. Careers
47. Privacy Policy
48. Terms of Service
49. MFA Setup
50. Consent Management
51. Communication Preferences
52. Clinical Notes
53. Treatment Plans
54. Doctor Statistics
55. Role & Permission Management
56. Password Policy Configuration
57. Notification Templates
58. System Settings
59. FHIR Export
60. File Upload Component
61. Chart Components

**Deliverables**:
- ✅ Enhanced UX features
- ✅ Advanced admin features
- ✅ Content management
- ✅ System configuration
- ✅ Data interoperability

---

## API Integration

### API Gateway Configuration

**Base URL**: `http://localhost:3101`

**Service Routes**:
- Identity: `/api/v1/auth/*`
- Patient Registry: `/api/v1/patients/*`
- Provider/Staff: `/api/v1/providers/*`
- Appointments: `/api/v1/appointments/*`
- Clinical EMR: `/api/v2/clinical-emr/*`
- Billing: `/api/v1/billing/*`
- Notifications: `/api/v1/notifications/*`

### Authentication

**JWT Token Storage**:
- Access Token: `localStorage` or `sessionStorage`
- Refresh Token: `httpOnly` cookie (recommended)

**Token Refresh**:
- Automatic refresh before expiration
- Retry failed requests after refresh

**Protected Routes**:
- Middleware to check authentication
- Redirect to login if unauthenticated

### API Client Setup

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      // Redirect to login if refresh fails
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### TypeScript Types Generation

**From Swagger/OpenAPI**:
```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types from Swagger JSON
npx openapi-typescript http://localhost:3021/api-docs/json -o types/identity-service.ts
npx openapi-typescript http://localhost:3023/api-docs/json -o types/patient-service.ts
# ... repeat for all services
```

---

## Conclusion

This document provides a comprehensive blueprint for building the Hospital Management System V2 frontend. With 80 pages across 6 categories, the system covers all essential healthcare workflows for Vietnamese hospitals.

**Next Steps**:
1. Review and approve this architecture
2. Set up development environment
3. Generate TypeScript types from Swagger
4. Start Phase 1 implementation (MVP)
5. Conduct user testing after each phase

**Questions or Feedback**: Contact the development team.

---

**Document Version**: 2.0.0
**Last Updated**: 2025-01-11
**Status**: ✅ Complete & Ready for Implementation
