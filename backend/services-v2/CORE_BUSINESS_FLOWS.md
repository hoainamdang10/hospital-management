# Hospital Management System - Core Business Flows Analysis

**Analysis Date**: 2025-01-14  
**Version**: 2.0.0  
**Status**: Comprehensive Flow Mapping  
**Thoroughness**: Very Thorough - All services, event flows, and integration points examined

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Flow 1: Patient Journey](#flow-1-patient-journey)
3. [Flow 2: Doctor/Staff Workflow](#flow-2-doctorstaff-workflow)
4. [Flow 3: Admin Operations](#flow-3-admin-operations)
5. [Cross-Service Integration Analysis](#cross-service-integration-analysis)
6. [Missing Flows & Gaps](#missing-flows--gaps)
7. [Event Architecture Overview](#event-architecture-overview)
8. [Recommendations](#recommendations)

---

## Executive Summary

### Overall Assessment

**MVP Scope**: Focus on core appointment booking functionality. Clinical EMR and Scheduler services **removed from MVP**.

**Completion Status by Flow**:
- **Patient Journey Flow**: 85% Complete (reminder cron jobs implemented, Clinical EMR deferred)
- **Doctor/Staff Flow**: 85% Complete (clinical documentation deferred to post-MVP)
- **Admin Flow**: 40% Complete (reporting & analytics largely missing)
- **Cross-Service Integration**: 80% Complete (MVP scope services well-integrated)

**Key Findings**:
1. ✅ **Identity → Patient → Appointments → Notifications** flow is **well-implemented**
2. ✅ **Appointment reminders** via cron jobs in Notifications Service (replaces Scheduler Service)
3. 🔄 **Clinical EMR Service** - **REMOVED FROM MVP** (focus on appointments, defer clinical documentation)
4. 🔄 **Scheduler Service** - **REMOVED** (functionality moved to cron jobs in Notifications Service)
5. ⚠️ **Appointments → Billing** flow is **partially implemented** (payment integration pending)
6. ❌ **Admin reporting & analytics** flow is **largely missing** (15% complete)
7. ✅ Event-driven architecture is **properly implemented** with RabbitMQ

---

## Flow 1: Patient Journey

### Patient Registration → Appointment Booking → Check-in → Clinical Visit → Billing → Payment

#### Step 1: Patient Registration

**Services Involved**: Identity Service → Patient Registry Service

**Flow**:
```
1. User registers (Identity Service)
   ├─ Use Case: RegisterUserUseCase (identity-service)
   ├─ Publishes: identity.user.created
   └─ Publishes: identity.user.activated (after email verification)

2. Patient profile created (Patient Registry Service)
   ├─ Consumer: IdentityUserCreatedEventHandler (patient-registry-service)
   │   └─ NOTE: Only logs event, doesn't create patient record yet (by design)
   │
   ├─ Consumer: UserActivatedEventHandler (patient-registry-service)
   │   └─ Creates patient record when user activates email
   │
   ├─ Use Case: RegisterPatientUseCase (patient-registry-service)
   │   ├─ Creates Patient aggregate
   │   ├─ Stores personal info, contact info, medical info
   │   ├─ Stores insurance info (BHYT/BHTN)
   │   ├─ Stores emergency contacts
   │   └─ Publishes: patient.patient.registered
   │
   └─ HIPAA audit logging via AuditService
```

**Events Published**:
- `identity.user.created` (Identity Service)
- `identity.user.activated` (Identity Service)
- `patient.patient.registered` (Patient Registry Service)

**Events Consumed**:
- Patient Registry consumes `identity.user.created` (tracking only)
- Patient Registry consumes `identity.user.activated` (triggers patient creation)
- Appointments Service consumes `patient.patient.registered` (updates read model)

**Status**: ✅ **COMPLETE** - Well-implemented with proper event choreography

---

#### Step 2: Appointment Booking

**Services Involved**: Appointments Service → Notifications Service → Provider Service

**Flow**:
```
1. Patient schedules appointment (Appointments Service)
   ├─ Use Case: ScheduleAppointmentUseCase (appointments-service)
   │   ├─ Authorization check (AuthorizationService)
   │   ├─ Conflict detection (ConflictResolutionService)
   │   ├─ Creates Appointment aggregate
   │   ├─ Saves to database (with exclusion constraint for double-booking prevention)
   │   ├─ Schedules reminders (ReminderService)
   │   └─ Publishes: appointment.scheduled
   │
   ├─ Conflict Resolution
   │   ├─ Checks doctor availability
   │   ├─ Detects time overlaps
   │   └─ Provides alternative time slots if conflict detected
   │
   └─ Database Constraint
       └─ exclude_doctor_time_overlap prevents race conditions

2. Notifications sent (Notifications Service)
   ├─ Consumer: AppointmentEventConsumer (notifications-service)
   │   ├─ Handles: appointment.scheduled
   │   ├─ Sends confirmation to patient (email, SMS, in-app)
   │   ├─ Sends notification to doctor (in-app, email)
   │   ├─ Sends urgent notification to department (if priority = emergency/urgent)
   │   └─ Schedules appointment reminders (3 reminders: 24h, 2h, 30min)
   │
   └─ Use Cases:
       ├─ SendNotificationUseCase
       ├─ GetNotificationPreferencesUseCase
       └─ CreateAppointmentRemindersUseCase

3. Provider schedule updated (Provider Service)
   ├─ Consumer: AppointmentScheduledEventHandler (provider-staff-service)
   │   └─ Updates provider's schedule/availability
   │
   └─ Publishes: staff.schedule.updated
```

**Events Published**:
- `appointment.scheduled` (Appointments Service)
- `staff.schedule.updated` (Provider Service)

**Events Consumed**:
- Notifications Service consumes `appointment.scheduled`
- Provider Service consumes `appointment.scheduled`
- Billing Service consumes `appointment.scheduled` (for pre-authorization - NOT IMPLEMENTED)

**Status**: ✅ **COMPLETE** - Well-implemented with conflict detection, multi-channel notifications, and reminder cron jobs

**Reminder Implementation**:
- ✅ **ReminderCronJob** implemented in Notifications Service (runs every 5 minutes)
- ✅ **CreateAppointmentRemindersUseCase** creates 3 reminders (24h, 2h, 30min before)
- ✅ **AppointmentEventConsumer** triggers reminder creation on `appointment.scheduled`
- ✅ Cron job processes due reminders, retries failed reminders, expires old reminders

**Missing**:
- ⚠️ Billing service doesn't pre-authorize appointments or reserve consultation fees

---

#### Step 3: Appointment Check-in

**Services Involved**: Appointments Service → Queue Management

**MVP Scope**: Clinical EMR integration **deferred to post-MVP**. Check-in flow focuses on queue management only.

**Flow**:
```
1. Patient checks in (Appointments Service)
   ├─ Use Case: CheckInAppointmentUseCase (appointments-service)
   │   ├─ Updates appointment status to "checked_in"
   │   ├─ Adds patient to queue
   │   ├─ Publishes: appointment.checked_in
   │   └─ Publishes: queue.patient_joined
   │
   └─ Use Case: JoinQueueUseCase (appointments-service)
       ├─ Creates QueueEntry aggregate
       ├─ Assigns queue position
       └─ Estimates wait time

2. Queue status updated
   ├─ Use Case: GetQueueStatusUseCase (appointments-service)
   ├─ Real-time queue position tracking
   └─ Wait time estimation

--- POST-MVP: Clinical EMR Integration (Deferred) ---
3. Medical record prepared (Clinical EMR Service) - **DEFERRED**
   ├─ Consumer: AppointmentEventConsumer (clinical-emr-service)
   │   ├─ Handles: appointment.checked_in
   │   ├─ Creates preliminary medical record
   │   ├─ Use Case: CreateMedicalRecordUseCase
   │   ├─ Stores vitals (BP, HR, temp, weight, height)
   │   ├─ Sets status = "in_progress"
   │   └─ Publishes: clinical.record.created
   │
   └─ Patient & Provider snapshots cached
       ├─ SupabasePatientSnapshotRepository
       └─ SupabaseProviderSnapshotRepository
```

**Events Published** (MVP):
- `appointment.checked_in` (Appointments Service)
- `queue.patient_joined` (Appointments Service)

**Events Published** (Post-MVP):
- `clinical.record.created` (Clinical EMR Service) - **DEFERRED**

**Events Consumed**:
- Clinical EMR Service consumes `appointment.checked_in`
- Notifications Service consumes `queue.patient_joined` (could send queue position updates - NOT IMPLEMENTED)

**Status**: ✅ **MVP COMPLETE** - Queue management and check-in working for appointments

**MVP Scope**:
- ✅ Check-in flow implemented
- ✅ Queue management functional
- 🔄 Clinical EMR integration **deferred to post-MVP**

**Missing** (Post-MVP):
- 🔄 Medical record creation on check-in (Clinical EMR Service)
- ⚠️ Queue position notifications (patients don't get notified when it's almost their turn)
- ⚠️ Digital queue display system (for waiting room screens)

---

#### Step 4: Clinical Visit (Appointment Completion)

**Services Involved**: Appointments Service → Billing Service → Notifications Service

**MVP Scope**: Clinical EMR integration **deferred to post-MVP**. Focus on appointment completion and billing.

**Flow**:
```
1. Doctor calls next patient (Appointments Service)
   ├─ Use Case: CallNextPatientUseCase (appointments-service)
   │   ├─ Updates queue entry status to "called"
   │   ├─ Updates appointment status to "in_progress"
   │   └─ Publishes: queue.patient_called
   │
   └─ Use Case: StartAppointmentUseCase (appointments-service)
       ├─ Records actual start time
       └─ Updates appointment status

--- POST-MVP: Clinical Documentation (Deferred) ---
2. Doctor conducts visit (Clinical EMR Service) - **DEFERRED**
   ├─ Use Cases (clinical-emr-service):
   │   ├─ UpdateMedicalRecordUseCase - Updates chief complaint, diagnosis
   │   ├─ UpdateVitalSignsUseCase - Records vitals during visit
   │   ├─ AddDiagnosisUseCase - Adds ICD-10 diagnosis codes
   │   ├─ CreatePrescriptionUseCase - Creates prescriptions
   │   ├─ CreateDiagnosticReportUseCase - Orders lab tests/imaging
   │   └─ CreateClinicalNoteUseCase - Documents clinical findings
   │
   └─ NOTE: Presentation layer incomplete (60% complete)

3. Appointment completed (Appointments Service)
   ├─ Use Case: CompleteAppointmentUseCase (appointments-service)
   │   ├─ Updates appointment status to "completed"
   │   ├─ Records completion time, outcome
   │   ├─ Marks follow-up required (if needed)
   │   ├─ Removes from queue
   │   └─ Publishes: appointment.completed
   │
   └─ Data includes:
       ├─ appointmentId, patientId, doctorId
       ├─ completedAt, outcome
       ├─ followUpRequired, followUpDate
       ├─ prescriptionProvided, labTestsOrdered
       └─ notes

--- POST-MVP: Medical Record Finalization (Deferred) ---
4. Medical record finalized (Clinical EMR Service) - **DEFERRED**
   ├─ Consumer: AppointmentEventConsumer (clinical-emr-service)
   │   ├─ Handles: appointment.completed
   │   ├─ Finalizes medical record
   │   ├─ Updates status to "completed"
   │   ├─ Creates final clinical note
   │   └─ Archives record
   │
   └─ Publishes: clinical.record.completed

5. Invoice generated (Billing Service)
   ├─ Consumer: AppointmentEventConsumer (billing-service)
   │   ├─ Handles: appointment.completed
   │   ├─ Use Case: (via BillingService.generateAppointmentInvoice)
   │   ├─ Calculates consultation fee
   │   ├─ Applies insurance coverage (BHYT/BHTN)
   │   ├─ Generates line items
   │   └─ Publishes: invoice.generated
   │
   └─ NOTE: BillingService methods exist but may not be fully wired

6. Notifications sent (Notifications Service)
   ├─ Consumer: AppointmentEventConsumer (notifications-service)
   │   ├─ Handles: appointment.completed
   │   ├─ Sends completion notification to patient
   │   ├─ Sends follow-up reminder (if followUpRequired)
   │   ├─ Sends prescription notification (if prescriptionProvided)
   │   └─ Sends lab test notification (if labTestsOrdered)
   │
   └─ Multi-channel delivery (email, SMS, in-app)
```

**Events Published** (MVP):
- `queue.patient_called` (Appointments Service)
- `appointment.completed` (Appointments Service)
- `invoice.generated` (Billing Service)

**Events Published** (Post-MVP):
- `clinical.record.completed` (Clinical EMR Service) - **DEFERRED**

**Events Consumed** (MVP):
- Billing Service consumes `appointment.completed`
- Notifications Service consumes `appointment.completed`

**Events Consumed** (Post-MVP):
- Clinical EMR Service consumes `appointment.completed` - **DEFERRED**

**Status**: ✅ **MVP COMPLETE (80%)** - Appointment completion and billing flow functional

**MVP Scope**:
- ✅ Appointment completion use case implemented
- ✅ Queue management working
- ✅ Billing event consumer implemented
- ✅ Notifications working
- 🔄 Clinical EMR **deferred to post-MVP**

**Complete (MVP)**:
- ✅ Appointment flow (schedule → check-in → start → complete)
- ✅ Queue management (join → call → remove)
- ✅ Billing integration (invoice generation on completion)
- ✅ Notifications (completion, follow-up reminders)

**Deferred to Post-MVP**:
- 🔄 Clinical EMR **presentation layer** (domain logic exists but no controllers/routes)
- 🔄 Medical record creation and finalization
- 🔄 Prescription management
- 🔄 Lab test ordering integration
- 🔄 Diagnostic reports and imaging

---

#### Step 5: Billing & Payment

**Services Involved**: Billing Service → Notifications Service

**Flow**:
```
1. Invoice generated (Billing Service)
   ├─ Triggered by: appointment.completed event
   ├─ Use Case: CreateInvoiceUseCase (billing-service)
   │   ├─ Creates Invoice aggregate
   │   ├─ Calculates total amount
   │   ├─ Applies insurance coverage (BHYT/BHTN)
   │   ├─ Calculates patient payable amount
   │   ├─ Sets due date
   │   └─ Publishes: invoice.generated
   │
   └─ Line items include:
       ├─ Consultation fee
       ├─ Procedures (if any)
       ├─ Medications (if any)
       └─ Lab tests/imaging (if any)

2. Invoice sent to patient (Notifications Service)
   ├─ Consumer: BillingEventConsumer (notifications-service)
   │   ├─ Handles: invoice.generated
   │   ├─ Sends invoice email (PDF attachment)
   │   ├─ Sends SMS with payment link
   │   └─ Sends in-app notification
   │
   └─ Use Case: SendNotificationUseCase

3. Patient makes payment (Billing Service)
   ├─ Use Case: ProcessPaymentUseCase (billing-service)
   │   ├─ Validates payment method
   │   ├─ Processes payment (Cash, Card, Bank Transfer, PayOS)
   │   ├─ Updates invoice status
   │   ├─ Records transaction
   │   └─ Publishes: payment.completed
   │
   ├─ Use Case: CreatePayOSPaymentLinkUseCase (billing-service)
   │   ├─ Integrates with PayOS payment gateway
   │   ├─ Generates payment QR code
   │   └─ Returns payment link
   │
   └─ Use Case: HandlePayOSWebhookUseCase (billing-service)
       ├─ Handles webhook from PayOS
       ├─ Verifies payment signature
       └─ Updates payment status

4. Payment confirmation (Notifications Service)
   ├─ Consumer: BillingEventConsumer (notifications-service)
   │   ├─ Handles: payment.completed
   │   ├─ Sends payment receipt (email, SMS, in-app)
   │   └─ Updates patient's billing history
   │
   └─ Receipt includes:
       ├─ Invoice number, payment ID
       ├─ Amount paid, payment method
       ├─ Transaction date/time
       └─ Remaining balance (if partial payment)

5. Insurance claim (if applicable)
   ├─ Use Case: ProcessInsuranceClaimUseCase (billing-service)
   │   ├─ Submits claim to BHYT/BHTN
   │   ├─ Tracks claim status
   │   └─ Publishes: insurance.claim.submitted
   │
   └─ NOTE: Insurance integration incomplete (external API not implemented)
```

**Events Published**:
- `invoice.generated` (Billing Service)
- `payment.completed` (Billing Service)
- `insurance.claim.submitted` (Billing Service)

**Events Consumed**:
- Notifications Service consumes `invoice.generated`
- Notifications Service consumes `payment.completed`
- Patient Registry Service consumes `payment.completed` (for billing history - NOT IMPLEMENTED)

**Status**: ⚠️ **BASIC IMPLEMENTATION (50%)**

**Complete**:
- ✅ Invoice creation basic logic exists
- ✅ Payment processing use case exists
- ✅ PayOS integration implemented
- ✅ Notifications working

**Missing**:
- ❌ **Payment plans** (installments, discounts) - NOT IMPLEMENTED
- ❌ **Vietnamese VAT** calculation - NOT IMPLEMENTED
- ❌ **Insurance claim** external API integration - NOT IMPLEMENTED
- ❌ **Refund processing** - Partially implemented (RefundPaymentUseCase exists but not tested)
- ❌ **Overdue payment** reminders - Use case exists but not scheduled
- ⚠️ Only **13 test files** for billing service (needs 80+ for production)
- ⚠️ BillingController.old.ts suggests incomplete refactoring

---

### Patient Journey Flow Summary

| Step | Status | Completion | Notes |
|------|--------|------------|-------|
| **1. Registration** | ✅ Complete | 95% | Well-implemented, event-driven |
| **2. Appointment Booking** | ✅ Complete | 90% | Conflict detection, notifications working; reminder cron jobs missing |
| **3. Check-in** | ✅ Complete | 85% | Queue management working; queue notifications missing |
| **4. Clinical Visit** | ⚠️ Partial | 70% | Domain logic complete; Clinical EMR presentation layer incomplete |
| **5. Billing & Payment** | ⚠️ Basic | 50% | Basic invoice/payment working; payment plans, VAT, insurance incomplete |

**Overall Patient Journey**: ⚠️ **75% Complete**

---

## Flow 2: Doctor/Staff Workflow

### Staff Onboarding → Schedule Management → Appointment Handling → Clinical Documentation

#### Step 1: Staff Onboarding

**Services Involved**: Identity Service → Provider/Staff Service

**Flow**:
```
1. Staff invitation (Identity Service)
   ├─ Use Case: CreateStaffInvitationUseCase (identity-service)
   │   ├─ Creates StaffInvitation entity
   │   ├─ Generates invitation token
   │   ├─ Sets expiration date
   │   ├─ Assigns role (DOCTOR, NURSE, ADMIN, etc.)
   │   └─ Publishes: identity.staff_invitation.created
   │
   └─ Notification sent via email/SMS

2. Staff accepts invitation (Identity Service)
   ├─ Use Case: AcceptStaffInvitationUseCase (identity-service)
   │   ├─ Validates invitation token
   │   ├─ Creates user account
   │   ├─ Assigns healthcare role
   │   ├─ Publishes: identity.user.created (role = DOCTOR/NURSE)
   │   └─ Publishes: identity.staff_invitation.accepted
   │
   └─ Email verification required

3. Staff profile created (Provider Service)
   ├─ Consumer: UserCreatedEventHandler (provider-staff-service)
   │   ├─ Handles: identity.user.created (for staff roles)
   │   ├─ Creates ProviderStaff aggregate
   │   ├─ Stores personal info, contact info
   │   ├─ Initializes employment status
   │   └─ Publishes: staff.registered
   │
   └─ Use Case: RegisterStaffUseCase (provider-staff-service)
       ├─ Creates staff profile
       ├─ Assigns department
       ├─ Sets default schedule
       └─ HIPAA audit logging

4. Credentials & specializations added (Provider Service)
   ├─ Use Case: AddStaffCertificationUseCase (provider-staff-service)
   │   ├─ Stores medical licenses, certifications
   │   ├─ Tracks expiration dates
   │   └─ Publishes: staff.certification.added
   │
   └─ Use Case: AddStaffSpecializationUseCase (provider-staff-service)
       ├─ Stores specializations
       └─ Publishes: staff.specialization.added
```

**Events Published**:
- `identity.staff_invitation.created` (Identity Service)
- `identity.user.created` (Identity Service)
- `staff.registered` (Provider Service)
- `staff.certification.added` (Provider Service)

**Events Consumed**:
- Provider Service consumes `identity.user.created` (for staff roles)
- Notifications Service consumes `identity.staff_invitation.created` (sends invitation email)

**Status**: ✅ **COMPLETE (88%)** - Well-implemented with credential management

---

#### Step 2: Schedule Management

**Services Involved**: Provider/Staff Service → Appointments Service

**Flow**:
```
1. Staff schedule updated (Provider Service)
   ├─ Use Case: UpdateStaffScheduleUseCase (provider-staff-service)
   │   ├─ Defines working hours, days
   │   ├─ Sets break times, lunch breaks
   │   ├─ Defines appointment slot duration
   │   ├─ Sets max appointments per day
   │   └─ Publishes: staff.schedule.updated
   │
   └─ Schedule includes:
       ├─ Working days (Mon-Fri, Sat, Sun)
       ├─ Working hours (start time, end time)
       ├─ Break times
       └─ Availability rules

2. Availability updated (Appointments Service)
   ├─ Consumer: StaffScheduleUpdatedHandler (appointments-service)
   │   ├─ Handles: staff.schedule.updated
   │   ├─ Updates provider schedule in appointments system
   │   ├─ Recalculates available time slots
   │   └─ Updates appointment capacity
   │
   └─ Use Case: (via SupabaseProviderScheduleRepository)
       ├─ Stores schedule in appointments_schema.provider_schedules
       └─ Enables real-time availability checking

3. Available slots queried
   ├─ Use Case: FindAvailableSlots.use-case (appointments-service)
   │   ├─ Queries provider schedule
   │   ├─ Checks existing appointments
   │   ├─ Filters out booked slots
   │   └─ Returns available time slots
   │
   └─ Controller: AvailabilityController (appointments-service)
       └─ GET /api/appointments/availability
```

**Events Published**:
- `staff.schedule.updated` (Provider Service)

**Events Consumed**:
- Appointments Service consumes `staff.schedule.updated`

**Status**: ✅ **COMPLETE (85%)** - Schedule management working

**Missing**:
- ⚠️ Recurring schedule patterns (every 2nd Thursday, etc.)
- ⚠️ Time-off requests and approvals

---

#### Step 3: Appointment Handling

**Services Involved**: Appointments Service → Notifications Service

**Flow**:
```
1. Doctor views appointments (Appointments Service)
   ├─ Use Case: ListAppointmentsUseCase (appointments-service)
   │   ├─ Filters by doctorId, date range, status
   │   ├─ Returns scheduled appointments
   │   └─ Sorts by appointment time
   │
   └─ Controller: AppointmentQueryController (appointments-service)
       └─ GET /api/appointments?doctorId=xxx&date=yyyy-mm-dd

2. Doctor calls next patient (Appointments Service)
   ├─ Use Case: CallNextPatientUseCase (appointments-service)
   │   ├─ Gets next patient from queue
   │   ├─ Updates queue status
   │   ├─ Updates appointment status
   │   └─ Publishes: queue.patient_called
   │
   └─ Notifications sent to patient (Notifications Service)

3. Doctor completes appointment (see Flow 1, Step 4)

4. Doctor reschedules/cancels (Appointments Service)
   ├─ Use Case: RescheduleAppointmentUseCase (appointments-service)
   │   ├─ Validates new time slot
   │   ├─ Updates appointment date/time
   │   ├─ Cancels old reminders, creates new ones
   │   └─ Publishes: appointment.rescheduled
   │
   ├─ Use Case: CancelAppointmentUseCase (appointments-service)
   │   ├─ Validates cancellation policy
   │   ├─ Calculates cancellation fee (if applicable)
   │   ├─ Updates appointment status
   │   └─ Publishes: appointment.cancelled
   │
   └─ Notifications sent to patient & department
```

**Events Published**:
- `queue.patient_called` (Appointments Service)
- `appointment.rescheduled` (Appointments Service)
- `appointment.cancelled` (Appointments Service)

**Events Consumed**:
- Notifications Service consumes all appointment events
- Provider Service consumes `appointment.completed` (updates provider statistics)

**Status**: ✅ **COMPLETE (90%)** - Appointment handling well-implemented

---

#### Step 4: Clinical Documentation

**Services Involved**: Clinical EMR Service → Provider Service

**MVP Scope**: Clinical EMR Service **deferred to post-MVP**. Documentation features will be implemented after core appointment flow is stable.

**Flow** (Post-MVP):
```
--- POST-MVP: Clinical Documentation (Deferred) ---
1. Doctor creates medical record (Clinical EMR Service) - **DEFERRED**
   ├─ Use Case: CreateMedicalRecordUseCase (clinical-emr-service)
   │   ├─ Creates MedicalRecord aggregate
   │   ├─ Records chief complaint, HPI
   │   ├─ Records vitals
   │   └─ Publishes: clinical.record.created
   │
   └─ NOTE: Presentation layer incomplete (60% - domain logic exists, no controllers/routes)

2. Doctor adds diagnosis (Clinical EMR Service) - **DEFERRED**
   ├─ Use Case: AddDiagnosisUseCase (clinical-emr-service)
   │   ├─ Adds ICD-10 diagnosis codes
   │   ├─ Records diagnosis description
   │   └─ Updates medical record
   │
   └─ NOTE: ICD-10 coding not fully implemented

3. Doctor creates prescription (Clinical EMR Service) - **DEFERRED**
   ├─ Use Case: CreatePrescriptionUseCase (clinical-emr-service)
   │   ├─ Creates Prescription entity
   │   ├─ Records medications, dosage, frequency
   │   └─ Publishes: clinical.prescription.created
   │
   └─ NOTE: E-prescription Vietnamese standards unclear

4. Doctor orders tests (Clinical EMR Service) - **DEFERRED**
   ├─ Use Case: CreateDiagnosticReportUseCase (clinical-emr-service)
   │   ├─ Creates DiagnosticReport entity
   │   ├─ Specifies test types (lab, imaging)
   │   └─ Publishes: clinical.test.ordered
   │
   └─ NOTE: Integration with external labs not implemented

5. Doctor adds clinical notes (Clinical EMR Service) - **DEFERRED**
   ├─ Use Case: CreateClinicalNoteUseCase (clinical-emr-service)
   │   ├─ Creates ClinicalNote entity
   │   ├─ Documents findings, assessment, plan
   │   └─ Supports multiple note types (progress, SOAP, discharge)
   │
   └─ NOTE: SOAP note structure not enforced

6. Provider statistics updated (Provider Service)
   ├─ Consumer: AppointmentCompletedEventHandler (provider-staff-service)
   │   ├─ Handles: appointment.completed
   │   ├─ Updates provider performance metrics
   │   └─ Tracks appointments completed, patient satisfaction
   │
   └─ Use Case: UpdateStaffPerformanceUseCase (provider-staff-service)
```

**Events Published** (Post-MVP):
- `clinical.record.created` (Clinical EMR Service) - **DEFERRED**
- `clinical.prescription.created` (Clinical EMR Service) - **DEFERRED**
- `clinical.test.ordered` (Clinical EMR Service) - **DEFERRED**

**Events Consumed** (MVP):
- Provider Service consumes `appointment.completed` ✅

**Events Consumed** (Post-MVP):
- Billing Service consumes `clinical.prescription.created` (for medication billing) - **DEFERRED**

**Status**: 🔄 **DEFERRED TO POST-MVP** - Clinical EMR removed from MVP scope

**MVP Decision**:
- 🔄 Clinical EMR Service **removed from MVP** to focus on core appointment functionality
- Domain logic implemented (27 use cases) but presentation layer incomplete
- Will be implemented in post-MVP phase after appointment flow is production-ready

**Post-MVP Implementation Plan**:
- ❌ **Presentation layer** (controllers/routes) - Needs implementation
- ❌ **ICD-10 coding** standards - Needs enforcement
- ❌ **FHIR R4** compliance not verified
- ❌ **E-prescription** Vietnamese standards unclear
- ❌ **External lab** integration not implemented

---

### Doctor/Staff Flow Summary

| Step | Status | Completion | Notes |
|------|--------|------------|-------|
| **1. Onboarding** | ✅ Complete | 88% | Well-implemented |
| **2. Schedule Management** | ✅ Complete | 85% | Working; recurring patterns missing |
| **3. Appointment Handling** | ✅ Complete | 90% | Well-implemented |
| **4. Clinical Documentation** | ⚠️ Partial | 60% | Domain logic complete; presentation layer missing |

**Overall Doctor/Staff Workflow**: ✅ **85% Complete**

---

## Flow 3: Admin Operations

### System Configuration → User Management → Report Generation

#### Step 1: System Configuration

**Services Involved**: Identity Service → Department Service (Skeleton) → All Services

**Flow**:
```
1. Department management (Department Service)
   ├─ Status: ❌ SKELETON ONLY (15% complete)
   │   ├─ Only 16 TypeScript files
   │   ├─ 0 use cases implemented
   │   ├─ 4 test files only
   │   └─ No functional logic
   │
   └─ Expected Events:
       ├─ department.created
       ├─ department.updated
       ├─ department.activated
       └─ department.deactivated

2. Role & permission management (Identity Service)
   ├─ Use Case: AssignRoleUseCase (identity-service)
   │   ├─ Assigns healthcare roles (ADMIN, DOCTOR, NURSE, etc.)
   │   └─ Publishes: identity.user.role_changed
   │
   ├─ Use Case: CheckPermissionUseCase (identity-service)
   │   ├─ Validates permissions
   │   └─ RBAC enforcement
   │
   └─ Consumer: UserRoleChangedEventHandler (provider-staff-service)
       └─ Updates staff role in provider system

3. Password policy management (Identity Service)
   ├─ Use Case: UpdatePasswordPolicyUseCase (identity-service)
   │   ├─ Sets password complexity rules
   │   ├─ Sets expiration policies
   │   └─ Sets lockout policies
   │
   └─ Use Case: GetPasswordPolicyUseCase (identity-service)
```

**Events Published**:
- `identity.user.role_changed` (Identity Service)
- `department.created` (Department Service - NOT IMPLEMENTED)

**Events Consumed**:
- Provider Service consumes `identity.user.role_changed`
- Appointments Service consumes `department.created` (NOT IMPLEMENTED)

**Status**: ⚠️ **PARTIALLY COMPLETE (40%)**

**Complete**:
- ✅ Role & permission management working
- ✅ Password policy management working

**Missing**:
- ❌ **Department Service** is skeleton only (15% complete)
- ❌ **System configuration** UI not implemented
- ❌ **Audit log** search/filtering limited

---

#### Step 2: User Management

**Services Involved**: Identity Service → Patient Registry → Provider Service

**Flow**:
```
1. Admin views users (Identity Service)
   ├─ Use Case: ListUsersUseCase (identity-service)
   │   ├─ Filters by role, status
   │   ├─ Paginates results
   │   └─ Returns user list
   │
   └─ Use Case: GetUserUseCase (identity-service)
       └─ Returns user details

2. Admin activates/deactivates users (Identity Service)
   ├─ Use Case: ActivateUserUseCase (identity-service)
   │   ├─ Activates user account
   │   └─ Publishes: identity.user.activated
   │
   └─ Use Case: DeactivateUserUseCase (identity-service)
       ├─ Deactivates user account
       └─ Publishes: identity.user.deactivated

3. Admin locks/unlocks accounts (Identity Service)
   ├─ Use Case: LockAccountUseCase (identity-service)
   │   ├─ Locks account (security)
   │   └─ Publishes: identity.account.locked
   │
   └─ Use Case: UnlockAccountUseCase (identity-service)
       ├─ Unlocks account
       └─ Publishes: identity.account.unlocked

4. Admin manages staff (Provider Service)
   ├─ Use Case: UpdateStaffProfileUseCase (provider-staff-service)
   │   ├─ Updates staff information
   │   └─ Publishes: staff.updated
   │
   ├─ Use Case: DeactivateStaffUseCase (provider-staff-service)
   │   ├─ Deactivates staff profile
   │   └─ Publishes: staff.status.changed
   │
   └─ Use Case: TerminateStaffUseCase (provider-staff-service)
       ├─ Terminates employment
       └─ Publishes: staff.terminated
```

**Events Published**:
- `identity.user.activated` (Identity Service)
- `identity.user.deactivated` (Identity Service)
- `identity.account.locked` (Identity Service)
- `staff.updated` (Provider Service)
- `staff.terminated` (Provider Service)

**Events Consumed**:
- Patient Registry consumes `identity.user.deactivated`
- Provider Service consumes `identity.user.deactivated`

**Status**: ✅ **COMPLETE (85%)** - User management working

---

#### Step 3: Report Generation

**Services Involved**: All Services (Analytics)

**Flow**:
```
1. Appointment statistics (Appointments Service)
   ├─ Use Case: GetAppointmentStatisticsUseCase (appointments-service)
   │   ├─ Returns appointment counts by status
   │   ├─ Returns appointment counts by type
   │   └─ Returns appointment counts by date range
   │
   └─ NOTE: Basic statistics only

2. Patient statistics (Patient Registry Service)
   ├─ Use Case: GetPatientHistoryUseCase (patient-registry-service)
   │   ├─ Returns patient visit history
   │   └─ Returns patient appointment history
   │
   └─ NOTE: No aggregated reports

3. Provider statistics (Provider Service)
   ├─ Use Case: GetProviderStatisticsUseCase (provider-staff-service)
   │   ├─ Returns provider performance metrics
   │   └─ NOTE: Implementation incomplete
   │
   └─ Use Case: GetExpiringCredentialsUseCase (provider-staff-service)
       └─ Returns credentials expiring soon

4. Billing reports (Billing Service)
   ├─ Use Case: GetRevenueReportUseCase (billing-service)
   │   ├─ Returns revenue by date range
   │   └─ NOTE: Implementation incomplete
   │
   ├─ Use Case: GetPatientBillingSummaryUseCase (billing-service)
   │   └─ Returns patient billing summary
   │
   └─ Use Case: GetOverdueInvoicesUseCase (billing-service)
       └─ Returns overdue invoices

5. Notification analytics (Notifications Service)
   ├─ Use Case: GetNotificationAnalyticsUseCase (notifications-service)
   │   ├─ Returns notification delivery rates
   │   ├─ Returns notification status breakdown
   │   └─ Returns channel performance
   │
   └─ Use Case: GetDashboardSummaryUseCase (notifications-service)
       └─ Returns high-level metrics
```

**Status**: ❌ **LARGELY MISSING (15%)**

**Complete**:
- ✅ Basic appointment statistics
- ✅ Notification analytics
- ✅ Expiring credentials tracking

**Missing**:
- ❌ **Comprehensive analytics** dashboard
- ❌ **Revenue reports** (by department, doctor, service type)
- ❌ **Patient outcome** tracking
- ❌ **Quality metrics** (wait time, patient satisfaction)
- ❌ **Vietnamese MOH** reporting (monthly statistics, disease surveillance)
- ❌ **Export to Excel/PDF** functionality
- ❌ **Scheduled reports** (daily/weekly/monthly)

---

### Admin Flow Summary

| Step | Status | Completion | Notes |
|------|--------|------------|-------|
| **1. System Configuration** | ⚠️ Partial | 40% | Department Service skeleton only |
| **2. User Management** | ✅ Complete | 85% | Well-implemented |
| **3. Report Generation** | ❌ Missing | 15% | Basic stats only; comprehensive analytics missing |

**Overall Admin Operations**: ⚠️ **40% Complete**

---

## Cross-Service Integration Analysis

### Service Communication Matrix (MVP Scope)

**MVP Scope**: Clinical EMR Service **removed from MVP**. Focus on core appointment booking and notifications.

| Publisher → Consumer | Event | Status | MVP Scope |
|---------------------|-------|--------|-----------|
| **Identity → Patient Registry** | `identity.user.created` | ✅ Complete | ✅ MVP |
| **Identity → Patient Registry** | `identity.user.activated` | ✅ Complete | ✅ MVP |
| **Identity → Provider Service** | `identity.user.created` (staff) | ✅ Complete | ✅ MVP |
| **Identity → Provider Service** | `identity.user.role_changed` | ✅ Complete | ✅ MVP |
| **Patient Registry → Appointments** | `patient.patient.registered` | ✅ Complete | ✅ MVP |
| **Patient Registry → Appointments** | `patient.patient.updated` | ✅ Complete | ✅ MVP |
| **Provider Service → Appointments** | `staff.schedule.updated` | ✅ Complete | ✅ MVP |
| **Appointments → Notifications** | `appointment.scheduled` | ✅ Complete | ✅ MVP |
| **Appointments → Notifications** | `appointment.completed` | ✅ Complete | ✅ MVP |
| **Appointments → Notifications** | `appointment.cancelled` | ✅ Complete | ✅ MVP |
| **Appointments → Billing** | `appointment.completed` | ⚠️ Partial | ✅ MVP |
| **Billing → Notifications** | `invoice.generated` | ⚠️ Partial | ✅ MVP |
| **Billing → Notifications** | `payment.completed` | ⚠️ Partial | ✅ MVP |

**Post-MVP Integrations (Deferred)**:
| Publisher → Consumer | Event | Status | Post-MVP |
|---------------------|-------|--------|----------|
| **Appointments → Clinical EMR** | `appointment.checked_in` | 🔄 Deferred | Post-MVP |
| **Appointments → Clinical EMR** | `appointment.completed` | 🔄 Deferred | Post-MVP |
| **Clinical EMR → Billing** | `clinical.prescription.created` | 🔄 Deferred | Post-MVP |
| **Clinical EMR → Billing** | `clinical.test.ordered` | 🔄 Deferred | Post-MVP |
| **Department → Appointments** | `department.created` | 🔄 Deferred | Post-MVP |
| **Department → Provider Service** | `department.updated` | 🔄 Deferred | Post-MVP |

### Integration Completeness (MVP Scope)

**Well-Integrated Flows (MVP)**:
1. ✅ **Identity → Patient Registry → Appointments** (95% complete)
2. ✅ **Identity → Provider Service → Appointments** (90% complete)
3. ✅ **Appointments → Notifications** (95% complete with reminder cron jobs)

**Partially Integrated Flows (MVP)**:
4. ⚠️ **Appointments → Billing → Notifications** (50% complete - basic flow working, payment integration pending)

**Deferred to Post-MVP**:
5. 🔄 **Appointments → Clinical EMR** (Domain logic 60% complete, presentation layer missing)
6. 🔄 **Clinical EMR → Billing** (Event definitions exist, consumers not implemented)
7. 🔄 **Department Service** integration (Service is skeleton only)
8. 🔄 **Clinical EMR → External Labs** (Not implemented)
9. 🔄 **Billing → Insurance Providers** (External API not implemented)

---

## Missing Flows & Gaps

**MVP Scope Update**: Clinical EMR and Scheduler services **removed from MVP** to focus on core appointment functionality.

### Critical Gaps (MVP Scope)

#### 1. Billing Service Integration (50% complete)
**Impact**: HIGH - Can't collect payments or manage invoices properly

**Missing**:
- ❌ Payment plans (installments, discounts)
- ❌ Vietnamese VAT calculation
- ❌ Insurance claim external API integration
- ❌ Refund processing (partially implemented)
- ❌ Overdue payment reminders (use case exists but not scheduled)
- ⚠️ Only 13 test files (needs 80+ for production)

**Estimate**: 8-10 weeks to complete

---

#### 2. Appointment Reminders - ✅ **IMPLEMENTED**
**Status**: ✅ **COMPLETE** - Cron jobs implemented in Notifications Service

**Implementation**:
- ✅ **ReminderCronJob** implemented (runs every 5 minutes)
- ✅ **CreateAppointmentRemindersUseCase** creates 3 reminders per appointment
- ✅ **AppointmentEventConsumer** triggers reminder creation
- ✅ Retry logic for failed deliveries implemented
- ✅ Expiration logic for old reminders implemented

**Note**: Scheduler Service removed - functionality moved to cron jobs in Notifications Service

---

### Deferred to Post-MVP

#### 3. Clinical EMR Presentation Layer (60% complete) - 🔄 **DEFERRED**
**Impact**: DEFERRED TO POST-MVP - Focus on appointment booking first

**Missing**:
- ❌ Controllers for medical records, prescriptions, lab results
- ❌ Routes for CRUD operations
- ❌ API documentation (Swagger/OpenAPI)
- ❌ Frontend integration endpoints
- ❌ FHIR R4 compliance verification
- ❌ ICD-10 coding standards
- ❌ Vietnamese e-prescription standards

**Estimate**: 10-12 weeks to complete (Post-MVP)

---

#### 4. Department Service Skeleton (15% complete) - 🔄 **DEFERRED**
**Impact**: DEFERRED TO POST-MVP - Optional for initial launch

**Missing**:
- ❌ All use cases (0 implemented)
- ❌ Event publishers/consumers
- ❌ Controllers and routes
- ❌ Domain logic

**Recommendation**: Implement post-launch

**Estimate**: 8-10 weeks to complete (Post-MVP)

---

### Non-Critical Gaps (Can Launch Without)

#### 5. Admin Reporting & Analytics (15% complete)
**Impact**: LOW - Basic operations work without comprehensive reports

**Missing**:
- ❌ Comprehensive analytics dashboard
- ❌ Revenue reports (by department, doctor, service type)
- ❌ Patient outcome tracking
- ❌ Quality metrics (wait time, patient satisfaction)
- ❌ Vietnamese MOH reporting
- ❌ Export to Excel/PDF
- ❌ Scheduled reports

**Estimate**: 6-8 weeks to implement

---

#### 6. Clinical EMR Advanced Features
**Impact**: LOW - Basic EMR working, advanced features can be added later

**Missing**:
- ❌ ICD-10 coding standards enforcement
- ❌ FHIR R4 compliance verification
- ❌ E-prescription Vietnamese standards
- ❌ SNOMED CT terminology
- ❌ External lab integration
- ❌ Medical imaging PACS integration

**Estimate**: 12-16 weeks to implement

---

#### 7. Billing Advanced Features
**Impact**: LOW - Basic billing working, advanced features can be added later

**Missing**:
- ❌ Payment plans (installments)
- ❌ Discounts & promotions
- ❌ Insurance claim reconciliation
- ❌ Revenue cycle management
- ❌ Vietnamese VAT compliance

**Estimate**: 6-8 weeks to implement

---

#### 8. Queue Management Enhancements
**Impact**: LOW - Basic queue working

**Missing**:
- ❌ Queue position notifications (SMS/push when almost patient's turn)
- ❌ Digital queue display for waiting rooms
- ❌ Queue analytics (average wait time, peak hours)

**Estimate**: 4-6 weeks to implement

---

## Event Architecture Overview

### Event Naming Convention

**Pattern**: `<service>.<entity>.<action>`

**Examples**:
- `identity.user.created`
- `patient.patient.registered`
- `appointment.scheduled`
- `clinical.record.created`
- `invoice.generated`

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Patient Journey                             │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────┐
│ Identity       │─[1]→ identity.user.created ─────────────┐
│ Service        │                                           │
│                │─[2]→ identity.user.activated ────┐       │
└────────────────┘                                   │       │
                                                      ↓       ↓
                                              ┌──────────────────┐
                                              │ Patient Registry │
                                              │ Service          │
                                              └──────────────────┘
                                                      │
                                                      │─[3]→ patient.patient.registered
                                                      ↓
                                              ┌──────────────────┐
                                              │ Appointments     │
                                              │ Service          │
                                              └──────────────────┘
                                                      │
                                                      │─[4]→ appointment.scheduled
                                                      ↓
                        ┌──────────────────────────────────────────────┐
                        │                                              │
                        ↓                                              ↓
                ┌──────────────────┐                          ┌──────────────────┐
                │ Notifications    │                          │ Provider         │
                │ Service          │                          │ Service          │
                └──────────────────┘                          └──────────────────┘
                        │                                              │
                        │─ Sends confirmation                          │─ Updates schedule
                        │─ Schedules reminders                         │
                        │                                              │
                        │─[5]→ appointment.checked_in ←────────────────┘
                        ↓
                ┌──────────────────┐
                │ Clinical EMR     │
                │ Service          │
                └──────────────────┘
                        │
                        │─[6]→ appointment.completed
                        ↓
        ┌───────────────────────────────────────┐
        │                                       │
        ↓                                       ↓
┌──────────────────┐                    ┌──────────────────┐
│ Billing          │                    │ Notifications    │
│ Service          │                    │ Service          │
└──────────────────┘                    └──────────────────┘
        │                                       │
        │─[7]→ invoice.generated                │─ Sends completion notification
        ↓                                       │─ Sends follow-up reminder
┌──────────────────┐                           │─ Sends prescription notification
│ Notifications    │                           │
│ Service          │←───────[8]─ payment.completed
└──────────────────┘
```

### Event Bus Configuration

**Message Broker**: RabbitMQ  
**Exchange Type**: Topic  
**Exchange Name**: `hospital.events`  
**Durable**: Yes  
**Pattern**: Publish-Subscribe with routing keys

**Routing Keys**:
- `identity.*` - Identity Service events
- `patient.*` - Patient Registry events
- `staff.*` - Provider/Staff Service events
- `appointment.*` - Appointments Service events
- `clinical.*` - Clinical EMR Service events
- `billing.*` - Billing Service events
- `notification.*` - Notifications Service events

**Idempotency**: Inbox pattern implemented in all consumers

---

## Recommendations

**MVP Scope Update**: Phased approach with Clinical EMR deferred to post-MVP.

### Phase 1: MVP Launch (2-3 months) - **CURRENT FOCUS**

#### Priority 1: Complete Appointment Reminders - ✅ **DONE**
- ✅ Cron jobs implemented in Notifications Service
- ✅ Background worker processes reminder queue every 5 minutes
- ✅ Retry logic for failed deliveries
- ✅ Expiration logic for old reminders
- **Impact**: Patient journey flow 85% complete

#### Priority 2: Complete Billing Service Core Features (8-10 weeks)
- Implement payment plans (installments)
- Add Vietnamese VAT calculation
- Add comprehensive testing (80+ test files)
- Fix incomplete refactoring (BillingController.old.ts)
- **Impact**: Enables proper invoicing and payment collection

#### Priority 3: API Gateway & Frontend Integration (4-6 weeks)
- Complete API Gateway (~40% currently)
- Integrate frontend with V2 services
- End-to-end testing
- **Impact**: Enables complete user flow

**Total Phase 1 (MVP)**: 12-16 weeks (3-4 months)

**MVP Services**: Identity, Patient Registry, Provider/Staff, Appointments, Billing, Notifications

---

### Phase 2: Clinical EMR & Medical Documentation (3-4 months) - **POST-MVP**

#### Priority 4: Complete Clinical EMR Presentation Layer (10-12 weeks)
- Implement controllers for medical records, prescriptions, lab results
- Add routes and API documentation
- Integrate with frontend
- Implement FHIR R4 compliance
- Add ICD-10 coding standards
- **Impact**: Enables complete medical documentation

#### Priority 5: Clinical EMR Integration (2-3 weeks)
- Re-enable event consumers in Appointments and Notifications services
- Integration testing with Appointments → Clinical EMR → Billing flow
- **Impact**: Completes clinical workflow

**Total Phase 2**: 12-15 weeks (3-4 months)

---

### Phase 3: Production Hardening & Advanced Features (2-3 months)

#### Priority 6: Insurance Claim Integration (6-8 weeks)
- Integrate with BHYT/BHTN external APIs
- Implement claim submission workflow
- Add claim status tracking
- **Impact**: Enables insurance billing

#### Priority 7: Admin Reporting & Analytics (6-8 weeks)
- Build comprehensive analytics dashboard
- Implement revenue reports
- Add quality metrics tracking
- Add Vietnamese MOH reporting
- **Impact**: Enables business intelligence

#### Priority 8: Department Service (8-10 weeks) - **OPTIONAL**
- Implement department management use cases
- Add event publishers/consumers
- Integrate with other services
- **Impact**: Completes organizational structure

**Total Phase 3**: 20-26 weeks (5-6.5 months)

---

### Estimated Timeline Summary

**MVP Timeline** (Phase 1):
- **Optimistic**: 12 weeks (3 months)
- **Conservative**: 16 weeks (4 months)
- **Services**: 6 core services (Identity, Patient, Provider, Appointments, Billing, Notifications)

**Post-MVP Timeline** (Phase 2):
- **Optimistic**: 12 weeks (3 months)
- **Conservative**: 15 weeks (4 months)
- **Services**: Add Clinical EMR (+1 service)

**Full Production** (Phase 1 + 2 + 3):
- **Optimistic**: 44 weeks (11 months)
- **Conservative**: 57 weeks (14 months)
- **Services**: All 8 services + advanced features

**Recommended Approach**:
- ✅ **Launch MVP** (Phase 1) first - 3-4 months
- 🔄 **Add Clinical EMR** (Phase 2) - 3-4 months after MVP
- 🔄 **Production Hardening** (Phase 3) - 5-6 months after Phase 2

**Total Phase 3**: 20-26 weeks (5-6.5 months)

---

## Conclusion

**MVP Scope Update**: Focus on core appointment booking. Clinical EMR deferred to post-MVP.

### What Works Well (MVP Scope)

1. ✅ **Event-Driven Architecture** - Properly implemented with RabbitMQ
2. ✅ **Identity → Patient Registry → Appointments** flow (95% complete)
3. ✅ **Appointment Reminders** - Cron jobs implemented, running every 5 minutes
4. ✅ **Notifications Service** - Multi-channel delivery working (email, SMS, in-app)
5. ✅ **Queue Management** - Basic functionality working
6. ✅ **Conflict Detection** - Prevents double-booking
7. ✅ **HIPAA Audit Logging** - Implemented in core services
8. ✅ **Scheduler Service Removed** - Functionality migrated to cron jobs

### Critical Gaps (MVP Scope)

1. ⚠️ **Billing Service** - Payment integration pending (50% complete)
2. ⚠️ **API Gateway** - Frontend integration incomplete (~40% complete)

### Deferred to Post-MVP

3. 🔄 **Clinical EMR Service** - Presentation layer incomplete (60% domain logic, 0% API endpoints)
4. 🔄 **Department Service** - Skeleton only (15% complete)
5. 🔄 **Admin Analytics** - Comprehensive reports missing (15% complete)

### Recommendation

**MVP Launch Strategy**:
- ✅ **Phase 1** (3-4 months): Launch core appointment booking with 6 services
  - Identity, Patient Registry, Provider/Staff
  - Appointments (with reminders ✅), Billing, Notifications
- 🔄 **Phase 2** (3-4 months): Add Clinical EMR for medical documentation
- 🔄 **Phase 3** (5-6 months): Production hardening (Insurance, Analytics, Department)

**Timeline to MVP**: 3-4 months (optimistic)

**Timeline to Full Production**: 11-14 months (with all services)

**Post-Launch**: Add clinical documentation, insurance integration, analytics, and advanced features in subsequent phases

---

**End of Analysis**
