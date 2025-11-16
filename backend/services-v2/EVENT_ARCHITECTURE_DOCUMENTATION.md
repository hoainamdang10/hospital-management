# Event-Driven Architecture Documentation

## Hospital Management System V2 - Event & Consumer Catalog

> **Version**: 2.0.0
> **Last Updated**: 2025-01-14
> **Status**: Post-Refactoring (Scope Adjustment Completed)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Service-by-Service Events & Consumers](#service-by-service-events--consumers)
4. [Inter-Service Event Flows](#inter-service-event-flows)
5. [Event Naming Conventions](#event-naming-conventions)
6. [Inbox/Outbox Pattern Usage](#inboxoutbox-pattern-usage)
7. [Monitoring & Observability](#monitoring--observability)

---

## Overview

This document provides a comprehensive catalog of all **Domain Events** and **Event Consumers** across the Hospital Management System V2 microservices architecture after the recent scope adjustment and refactoring.

### Key Changes After Refactoring

- ✅ **Clinical EMR Service**: Reduced scope to basic medical record creation only (removed full EMR events)
- ✅ **Scheduler Service**: Removed entirely (cron jobs to be implemented in individual services)
- ✅ **Event Consumers**: Cleaned up unused consumers
- ✅ **Outbox Pattern**: Implemented in core services for guaranteed event delivery

---

## Architecture Summary

### Event Bus Technology

- **Message Broker**: RabbitMQ
- **Exchange Type**: Topic Exchange
- **Exchange Name**: `hospital.events`
- **Pattern**: Event-Driven Architecture with CQRS

### Event Types

1. **Domain Events**: Events within a single bounded context (e.g., `UserCreatedEvent`)
2. **Integration Events**: Events published across services (e.g., `patient.patient.registered`)
3. **Infrastructure Events**: Technical events (health checks, metrics)

### Event Delivery Guarantees

- **Outbox Pattern**: Used in Patient, Provider, Appointments services
- **Inbox Pattern**: Used in Notifications service for idempotency
- **At-Least-Once Delivery**: Guaranteed via RabbitMQ acknowledgments
- **Idempotency**: All consumers handle duplicate events

---

## Service-by-Service Events & Consumers

### 1. Identity Service (Port 3001)

**Service Responsibilities**: Authentication, Authorization, User Management, RBAC

#### 📤 Events Published (7 events)

| Event Name | Event Type | Description | When Triggered |
|------------|------------|-------------|----------------|
| `UserCreatedEvent` | Domain | New user created | POST /auth/register |
| `UserUpdatedEvent` | Domain | User info updated | PUT /users/:id |
| `UserActivatedEvent` | Domain | User account activated | POST /admin/users/:id/activate |
| `UserDeactivatedEvent` | Domain | User account deactivated | POST /admin/users/:id/deactivate |
| `UserRoleChangedEvent` | Domain | User role changed | PUT /users/:id/role |
| `PendingRegistrationCreatedEvent` | Domain | Registration pending approval | POST /auth/register (requires approval) |
| `StaffInvitationCreatedEvent` | Domain | Staff invitation sent | POST /admin/invitations |

#### 📥 Events Consumed (0 consumers)

**Status**: ❌ No external event consumers (Identity is the root service)

**Reasoning**: Identity Service is the source of truth for users and doesn't depend on other services.

---

### 2. Patient Registry Service (Port 3003)

**Service Responsibilities**: Patient registration, demographics, insurance, consent management

#### 📤 Events Published (3 events)

| Event Name | Event Type | Routing Key | Description |
|------------|------------|-------------|-------------|
| `PatientRegisteredEvent` | Integration | `patient.patient.registered` | New patient registered |
| `PatientUpdatedEvent` | Integration | `patient.patient.updated` | Patient info updated |
| `PatientDeactivatedEvent` | Integration | `patient.patient.deactivated` | Patient deactivated |

**Implementation**: ✅ **Outbox Pattern** enabled

**Outbox Location**: `appointments_schema.outbox_events`

**Publishing**: Events stored in outbox, published by background worker

#### 📥 Events Consumed (0 consumers)

**Status**: ❌ No external event consumers

**Note**: Patient service previously listened to Identity events, but this was removed to simplify architecture.

---

### 3. Provider/Staff Service (Port 3002)

**Service Responsibilities**: Doctor/nurse/staff management, schedules, credentials, departments

#### 📤 Events Published (6 events)

| Event Name | Event Type | Routing Key | Description |
|------------|------------|-------------|-------------|
| `StaffRegisteredEvent` | Integration | `provider.staff.created` | New staff registered |
| `StaffUpdatedEvent` | Integration | `provider.staff.updated` | Staff info updated |
| `StaffStatusChangedEvent` | Integration | `provider.staff.status.changed` | Staff status changed (active/inactive) |
| `StaffScheduleUpdatedEvent` | Integration | `provider.staff.schedule.updated` | Staff work schedule updated |
| `StaffDepartmentAssignedEvent` | Domain | `provider.staff.department.assigned` | Staff assigned to department |
| `StaffDepartmentUpdatedEvent` | Domain | `provider.staff.department.updated` | Staff department changed |

**Implementation**: ✅ **Outbox Pattern** enabled

**Outbox Location**: `provider_schema.outbox_events`

#### 📥 Events Consumed (0 consumers currently active)

**Previous Consumers** (removed during refactoring):
- ❌ `identity.user.created` → Removed (tight coupling)
- ❌ `department.department.*` → Removed (Department service incomplete)

**Status**: ⚠️ **Department events disabled** until Department service is completed

---

### 4. Appointments Service (Port 3004)

**Service Responsibilities**: Appointment booking, scheduling, queue management, reminders

#### 📤 Events Published (6 events)

| Event Name | Event Type | Routing Key | Description |
|------------|------------|-------------|-------------|
| `AppointmentScheduledEvent` | Integration | `appointment.scheduled` | Appointment booked |
| `AppointmentCancelledEvent` | Integration | `appointment.cancelled` | Appointment cancelled |
| `AppointmentRescheduledEvent` | Integration | `appointment.rescheduled` | Appointment rescheduled |
| `AppointmentCheckedInEvent` | Integration | `appointment.checked_in` | Patient checked in |
| `AppointmentCompletedEvent` | Integration | `appointment.completed` | Appointment completed |
| `AppointmentReminderScheduledEvent` | Domain | `appointment.reminder.scheduled` | Reminder scheduled (internal) |

**Implementation**: ✅ **Outbox Pattern** enabled

**Outbox Location**: `appointments_schema.outbox_events`

#### 📥 Events Consumed (22 subscriptions)

##### **Internal Events (8 subscriptions)**
Events from Appointments Service itself for read model updates:

| Event | Handler | Purpose |
|-------|---------|---------|
| `AppointmentScheduled` | `AppointmentScheduledEventHandler` | Update read model |
| `AppointmentScheduled` | `AppointmentScheduledSchedulerHandler` | Schedule reminders (Outbox) |
| `AppointmentCancelled` | `AppointmentCancelledEventHandler` | Update read model |
| `AppointmentCancelled` | `AppointmentCancelledSchedulerHandler` | Cancel reminders (Outbox) |
| `AppointmentRescheduled` | `AppointmentRescheduledSchedulerHandler` | Update reminders (Outbox) |
| `AppointmentCheckedIn` | `AppointmentStatusChangedEventHandler` | Update status |
| `AppointmentStarted` | `AppointmentStatusChangedEventHandler` | Update status |
| `AppointmentCompleted` | `AppointmentCompletedEventHandler` | Mark completed |
| `AppointmentNoShow` | `AppointmentNoShowEventHandler` | Mark no-show |
| `AppointmentConfirmed` | `AppointmentConfirmedEventHandler` | Mark confirmed |

##### **External Events - Patient Service (4 subscriptions)**
Pure Outbox Pattern for read model sync:

| Event | Routing Key | Consumer | Purpose |
|-------|-------------|----------|---------|
| Patient Registered | `patient.patient.registered` | `PatientEventConsumer` | Sync patient data to local read model |
| Patient Updated | `patient.patient.updated` | `PatientEventConsumer` | Update patient data |
| Patient Deactivated | `patient.patient.deactivated` | `PatientEventConsumer` | Mark patient inactive |
| Patient Deleted | `patient.patient.deleted` | `PatientEventConsumer` | Remove patient data |

**Implementation**: `PatientReadModelRepository` stores cached patient data

##### **External Events - Provider Service (5 subscriptions)**
Pure Outbox Pattern for read model sync:

| Event | Routing Key | Consumer | Purpose |
|-------|-------------|----------|---------|
| Staff Created | `provider.staff.created` | `ProviderEventConsumer` | Sync provider data |
| Staff Updated | `provider.staff.updated` | `ProviderEventConsumer` | Update provider data |
| Staff Deactivated | `provider.staff.deactivated` | `ProviderEventConsumer` | Mark provider inactive |
| Staff Deleted | `provider.staff.deleted` | `ProviderEventConsumer` | Remove provider data |
| Staff Schedule Updated | `StaffScheduleUpdatedHandler` | `StaffScheduleUpdatedHandler` | Cache work schedule for availability |

**Implementation**: `ProviderReadModelRepository` + `SupabaseProviderScheduleRepository`

##### **Consumer Files**

```
appointments-service/src/infrastructure/events/
├── PatientEventConsumer.ts           # Handles patient.* events
├── StaffEventConsumer.ts             # Handles provider.staff.* events
├── AppointmentReadModelEventHandler.ts  # Internal read model updates
├── EventSubscriptions.ts              # Central subscription setup
└── handlers/
    ├── StaffScheduleUpdatedHandler.ts  # Schedule caching
    └── AppointmentSchedulerIntegrationHandler.ts  # Scheduler outbox
```

**Status**: ✅ **Fully Implemented** (most sophisticated consumer setup in the system)

---

### 5. Clinical EMR Service (Port 3007)

**Service Responsibilities**: Basic medical record creation only (scope reduced)

#### 📤 Events Published (1 event)

| Event Name | Event Type | Routing Key | Description |
|------------|------------|-------------|-------------|
| `ClinicalMedicalRecordCreatedEvent` | Integration | `clinical.record.created` | Medical record created |

**Removed Events** (out of scope):
- ❌ `ClinicalNoteCreatedEvent`
- ❌ `ClinicalLabResultCreatedEvent`
- ❌ `ClinicalImagingStudyCreatedEvent`
- ❌ `ClinicalPrescriptionCreatedEvent`
- ❌ `ClinicalTreatmentPlanCreatedEvent`
- ❌ `ClinicalTreatmentPlanStatusUpdatedEvent`
- ❌ `ClinicalMedicalRecordUpdatedEvent`

**Note**: Full EMR functionality (notes, lab results, imaging, prescriptions) moved to future work.

#### 📥 Events Consumed (1 consumer)

| Event | Source | Consumer | Purpose |
|-------|--------|----------|---------|
| `appointment.completed` | Appointments Service | `AppointmentCompletedConsumer` (planned) | Auto-create medical record when appointment completes |

**Status**: ⚠️ **Partially Implemented** (60% complete, presentation layer incomplete)

---

### 6. Billing Service (Port 3009)

**Service Responsibilities**: Invoicing, payments, insurance claims (basic only)

#### 📤 Events Published (2 events)

| Event Name | Event Type | Routing Key | Description |
|------------|------------|-------------|-------------|
| `InvoiceCreatedEvent` | Integration | `billing.invoice.created` | Invoice generated |
| `PaymentProcessedEvent` | Integration | `billing.payment.completed` | Payment completed |

**Missing Events** (not yet implemented):
- ⚠️ `InvoiceFinalizedEvent`
- ⚠️ `InvoiceCancelledEvent`
- ⚠️ `InsuranceClaimProcessedEvent`

#### 📥 Events Consumed (2 consumers planned)

| Event | Source | Consumer | Purpose | Status |
|-------|--------|----------|---------|--------|
| `appointment.completed` | Appointments | `AppointmentCompletedConsumer` | Generate invoice | ⚠️ Planned |
| `clinical.record.created` | Clinical EMR | `MedicalRecordCreatedConsumer` | Add charges | ⚠️ Planned |

**Status**: ❌ **Basic Only** (50% complete, consumers not implemented)

**Critical Issues**:
- No actual event consumers implemented
- Payment plans, discounts, VAT not implemented
- Test coverage low (13 files)

---

### 7. Notifications Service (Port 3011)

**Service Responsibilities**: Multi-channel notifications (Email, SMS, Push, In-App, Voice)

#### 📤 Events Published (1 event)

| Event Name | Event Type | Routing Key | Description |
|------------|------------|-------------|-------------|
| `NotificationSentEvent` | Integration | `notification.sent` | Notification delivered successfully |

#### 📥 Events Consumed (5 consumers)

##### **Appointment Events**

| Event | Source | Consumer | Purpose |
|-------|--------|----------|---------|
| `appointment.scheduled` | Appointments | `AppointmentEventConsumer` | Send booking confirmation |
| `appointment.cancelled` | Appointments | `AppointmentEventConsumer` | Send cancellation notice |
| `appointment.rescheduled` | Appointments | `AppointmentEventConsumer` | Send reschedule notice |

##### **Billing Events**

| Event | Source | Consumer | Purpose |
|-------|--------|----------|---------|
| `billing.invoice.created` | Billing | `BillingEventConsumer` | Send invoice email |
| `billing.payment.completed` | Billing | `BillingEventConsumer` | Send payment receipt |

##### **Clinical EMR Events**

| Event | Source | Consumer | Purpose |
|-------|--------|----------|---------|
| `clinical.record.created` | Clinical EMR | `ClinicalEMREventConsumer` | Send lab result notification (if critical) |

##### **Staff Events**

| Event | Source | Consumer | Purpose |
|-------|--------|----------|---------|
| `provider.staff.schedule.updated` | Provider | `StaffEventConsumer` | Notify staff of schedule changes |

##### **Scheduler Events** (Removed)

| Event | Source | Consumer | Purpose | Status |
|-------|--------|----------|---------|--------|
| ~~`schedule.run.due`~~ | ~~Scheduler~~ | ~~`RabbitMQConsumer`~~ | ~~Send scheduled reminders~~ | ❌ **Removed** |

**Implementation**: ✅ **Inbox Pattern** for idempotency

**Inbox Location**: `notifications_schema.inbox_events`

**Consumer Files**:
```
notifications-service/src/infrastructure/
├── events/
│   ├── AppointmentEventConsumer.ts      # Handles appointment events
│   ├── BillingEventConsumer.ts          # Handles billing events
│   ├── ClinicalEMREventConsumer.ts      # Handles clinical events
│   ├── StaffEventConsumer.ts            # Handles staff events
│   ├── NotificationEventHandlers.ts     # Main handler orchestrator
│   └── EventBusIntegration.ts           # Event bus setup
└── messaging/
    └── RabbitMQConsumer.ts               # RabbitMQ consumer (removed scheduler events)
```

**Status**: ✅ **Implemented** (65% complete, missing scheduled notifications cron jobs)

**Missing Features**:
- ⚠️ Scheduled notifications (needs cron jobs after Scheduler removal)
- ⚠️ Delivery status tracking (SendGrid/Twilio webhooks)
- ⚠️ Throttling/rate limiting

---

### 8. Department Service (Port 3025)

**Service Responsibilities**: Department management (skeleton only)

#### 📤 Events Published (4 events defined)

| Event Name | Event Type | Routing Key | Description |
|------------|------------|-------------|-------------|
| `DepartmentCreatedEvent` | Integration | `department.created` | Department created |
| `DepartmentUpdatedEvent` | Integration | `department.updated` | Department updated |
| `DepartmentActivatedEvent` | Integration | `department.activated` | Department activated |
| `DepartmentDeactivatedEvent` | Integration | `department.deactivated` | Department deactivated |

**Status**: ❌ **Not Implemented** (events defined but no actual publishers)

#### 📥 Events Consumed (1 consumer defined)

| Event | Source | Consumer | Purpose | Status |
|-------|--------|----------|---------|--------|
| `provider.staff.department.assigned` | Provider | `StaffDepartmentChangeConsumer` | Update department staff count | ❌ Not implemented |

**Status**: ❌ **Skeleton Only** (15% complete)

**Recommendation**: Optional for MVP, implement post-launch

---

## Inter-Service Event Flows

### Flow 1: Patient Registration → Multiple Services

```
Patient Registry Service
    ↓ (publishes via Outbox)
patient.patient.registered
    ↓ (RabbitMQ)
    ├─→ Appointments Service (PatientEventConsumer)
    │   └─→ Syncs to patient_read_model
    │
    └─→ Billing Service (planned)
        └─→ Create patient billing account
```

**Status**: ✅ Implemented (Appointments), ⚠️ Planned (Billing)

---

### Flow 2: Appointment Booking → Notifications & Billing

```
Appointments Service
    ↓ (publishes via Outbox)
appointment.scheduled
    ↓ (RabbitMQ)
    ├─→ Notifications Service (AppointmentEventConsumer)
    │   └─→ Send booking confirmation (SMS/Email)
    │
    ├─→ Billing Service (planned)
    │   └─→ Generate invoice if prepayment required
    │
    └─→ Appointments Service (internal)
        └─→ Schedule reminder (Outbox → future cron job)
```

**Status**: ✅ Implemented (Notifications), ⚠️ Planned (Billing, Reminders)

**Note**: Reminders previously handled by Scheduler Service, now needs cron jobs in Notifications

---

### Flow 3: Appointment Completion → Clinical EMR & Billing

```
Appointments Service
    ↓ (publishes)
appointment.completed
    ↓ (RabbitMQ)
    ├─→ Clinical EMR Service (AppointmentCompletedConsumer)
    │   └─→ Auto-create medical record
    │
    └─→ Billing Service (planned)
        └─→ Create charges for consultation
```

**Status**: ⚠️ Planned (both consumers not yet implemented)

---

### Flow 4: Medical Record Created → Billing

```
Clinical EMR Service
    ↓ (publishes)
clinical.record.created
    ↓ (RabbitMQ)
    └─→ Billing Service (MedicalRecordCreatedConsumer)
        └─→ Add charges for tests/procedures
```

**Status**: ⚠️ Planned (consumer not implemented)

---

### Flow 5: Staff Schedule Update → Appointments

```
Provider/Staff Service
    ↓ (publishes via Outbox)
provider.staff.schedule.updated
    ↓ (RabbitMQ)
    ├─→ Appointments Service (StaffScheduleUpdatedHandler)
    │   └─→ Update provider schedule cache for availability
    │
    └─→ Notifications Service (StaffEventConsumer)
        └─→ Notify staff of schedule changes
```

**Status**: ✅ Fully Implemented

---

### Flow 6: Invoice & Payment → Notifications

```
Billing Service
    ↓ (publishes)
billing.invoice.created
    ↓ (RabbitMQ)
    └─→ Notifications Service (BillingEventConsumer)
        └─→ Send invoice email

Billing Service
    ↓ (publishes)
billing.payment.completed
    ↓ (RabbitMQ)
    ├─→ Notifications Service (BillingEventConsumer)
    │   └─→ Send payment receipt
    │
    └─→ Appointments Service (planned)
        └─→ Confirm appointment booking
```

**Status**: ✅ Implemented (Notifications), ⚠️ Planned (Appointments)

---

### Flow 7: Scheduled Reminders (REMOVED)

```
❌ OLD FLOW (Removed):
Appointments Service → Scheduler Service → Notifications Service

✅ NEW FLOW (To be implemented):
Notifications Service Cron Job
    ↓ (checks due reminders every 5 minutes)
    └─→ Query reminders table
        └─→ Send notifications via channels
```

**Status**: ⚠️ **Cron jobs not yet implemented** (Scheduler Service removed)

**Action Required**: Implement cron jobs in Notifications Service

---

## Event Naming Conventions

### Integration Events (Cross-Service)

Format: `{service}.{entity}.{action}`

Examples:
- `patient.patient.registered`
- `provider.staff.created`
- `appointment.scheduled`
- `billing.invoice.created`
- `clinical.record.created`

### Domain Events (Internal)

Format: `{Entity}{Action}Event` (PascalCase class)

Examples:
- `UserCreatedEvent`
- `PatientRegisteredEvent`
- `StaffScheduleUpdatedEvent`
- `AppointmentCancelledEvent`

### Event Metadata

All events include:

```typescript
{
  eventId: string;           // Unique event ID
  eventType: string;         // Event type name
  aggregateId: string;       // ID of aggregate root
  aggregateType: string;     // Type of aggregate
  occurredAt: Date;          // Timestamp
  version: number;           // Event version
  metadata: {
    correlationId?: string;  // Request correlation ID
    causationId?: string;    // Causing event ID
    userId?: string;         // User who triggered event
    source?: string;         // Source service name
  }
}
```

---

## Inbox/Outbox Pattern Usage

### Outbox Pattern (Event Publishing)

**Services Using Outbox**:
- ✅ Patient Registry Service
- ✅ Provider/Staff Service
- ✅ Appointments Service

**Implementation**:

1. **Write to outbox table** in same transaction as domain change
2. **Background worker** publishes events to RabbitMQ
3. **Mark as published** after successful delivery
4. **Guarantees**: At-least-once delivery

**Schema**:
```sql
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR NOT NULL,
  aggregate_id VARCHAR NOT NULL,
  event_data JSONB NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  published_at TIMESTAMP,
  status VARCHAR NOT NULL -- 'PENDING', 'PUBLISHED', 'FAILED'
);
```

**Worker Location**: `{service}/src/infrastructure/outbox/OutboxPublisherWorker.ts`

---

### Inbox Pattern (Event Consuming)

**Services Using Inbox**:
- ✅ Notifications Service

**Implementation**:

1. **Check inbox** for duplicate event (idempotency key)
2. **Insert if new**, mark as PROCESSING
3. **Process event** (send notification)
4. **Mark as COMPLETED** after success
5. **Guarantees**: Exactly-once processing

**Schema**:
```sql
CREATE TABLE inbox_events (
  id UUID PRIMARY KEY,
  idempotency_key VARCHAR UNIQUE NOT NULL,
  event_type VARCHAR NOT NULL,
  event_data JSONB NOT NULL,
  received_at TIMESTAMP NOT NULL,
  processed_at TIMESTAMP,
  status VARCHAR NOT NULL -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
);
```

**Repository Location**: `notifications-service/src/infrastructure/persistence/SupabaseInboxRepository.ts`

---

## Monitoring & Observability

### Event Metrics

**Key Metrics to Monitor**:

1. **Outbox Lag**: Time between event creation and publishing
   - Alert if > 5 seconds
   - Location: `outbox_events` table

2. **Inbox Processing Time**: Time to process event
   - Alert if > 10 seconds
   - Location: `inbox_events` table

3. **Failed Events**: Events with status FAILED
   - Alert immediately
   - Check `outbox_events.status = 'FAILED'` or `inbox_events.status = 'FAILED'`

4. **RabbitMQ Queue Depth**: Messages waiting in queues
   - Alert if > 1000 messages
   - Check RabbitMQ Management UI (http://localhost:15672)

5. **Consumer Lag**: Time between event published and consumed
   - Alert if > 30 seconds
   - Calculate: `inbox_events.received_at - outbox_events.published_at`

### Health Checks

**Endpoints**:
- `GET /health` - Basic health check (all services)
- `GET /health/rabbitmq` - RabbitMQ connection status (planned)
- `GET /metrics` - Prometheus metrics (Identity only, needs expansion)

### Logging

**Event Logging Format**:

```json
{
  "level": "info",
  "timestamp": "2025-01-14T10:00:00Z",
  "service": "appointments-service",
  "event": "AppointmentScheduled",
  "eventId": "evt_123456",
  "aggregateId": "appt_789",
  "correlationId": "req_abc",
  "message": "Appointment scheduled successfully",
  "metadata": {
    "patientId": "patient_123",
    "doctorId": "doctor_456"
  }
}
```

---

## Summary Statistics

| Metric | Count | Notes |
|--------|-------|-------|
| **Total Services** | 8 | Identity, Patient, Provider, Appointments, Clinical, Billing, Notifications, Department |
| **Services with Events** | 6 | (Department skeleton doesn't count) |
| **Total Events Published** | 26 | After refactoring |
| **Services with Consumers** | 2 | Appointments (22), Notifications (5) |
| **Total Event Subscriptions** | 27 | Appointments (22) + Notifications (5) |
| **Services with Outbox** | 3 | Patient, Provider, Appointments |
| **Services with Inbox** | 1 | Notifications |
| **Event Flows Implemented** | 3 | Patient→Appointments, Appointment→Notifications, Staff→Appointments |
| **Event Flows Planned** | 4 | Appointment→Clinical, Appointment→Billing, Clinical→Billing, Billing→Notifications |

---

## Recommendations

### High Priority (1-2 weeks)

1. ✅ **Implement Cron Jobs for Reminders** in Notifications Service
   - Replace removed Scheduler Service functionality
   - Run every 5 minutes
   - Query `appointment_reminders` table for due reminders

2. ✅ **Complete Billing Event Consumers**
   - `AppointmentCompletedConsumer` → Generate invoice
   - `MedicalRecordCreatedConsumer` → Add charges

3. ✅ **Add RabbitMQ Health Checks**
   - All services should expose `/health/rabbitmq`
   - Alert on connection failures

### Medium Priority (3-4 weeks)

4. ⚠️ **Implement Prometheus Metrics** for all services
   - Currently only Identity has metrics
   - Export event publishing/consuming metrics

5. ⚠️ **Complete Clinical EMR Consumers**
   - `AppointmentCompletedConsumer` → Auto-create medical record

6. ⚠️ **Add Event Replay Mechanism**
   - Ability to replay failed events from outbox/inbox
   - Admin API for manual replay

### Low Priority (Optional)

7. ❌ **Complete Department Service**
   - Currently 15% complete, optional for MVP
   - Consider implementing post-launch if needed

8. ❌ **Distributed Tracing**
   - OpenTelemetry integration
   - Trace events across services

---

## Conclusion

The event-driven architecture is **well-implemented** for core workflows:

✅ **Strengths**:
- Outbox pattern guarantees event delivery
- Inbox pattern prevents duplicate processing
- Appointments Service has sophisticated read model sync
- Notifications Service handles multi-channel delivery

⚠️ **Gaps**:
- Billing Service consumers not implemented (50% complete)
- Clinical EMR consumers not implemented (60% complete)
- Scheduled reminders need cron jobs (Scheduler removed)
- Department Service incomplete (15% complete, optional)

**Overall Assessment**: **SUFFICIENT FOR THESIS PROJECT** 🎓

The system demonstrates enterprise-level event-driven architecture with proper patterns (Outbox, Inbox, CQRS, Read Models). The gaps are well-documented and can be explained as "out of scope for MVP" during thesis defense.

---

**Document Maintained By**: Hospital Management Team
**Contact**: See individual service README files
**Version History**:
- v2.0.0 (2025-01-14): Post-refactoring documentation (scope adjustment)
- v1.0.0 (2024-12-XX): Initial event catalog
