# AppointmentAbuseEventHandler

## Overview

**Purpose**: Prevent appointment abuse by tracking no-shows, late cancellations, excessive rescheduling, and late arrivals.

**Events Consumed**: 5 events from `appointments.*` domain
- `appointments.no_show`
- `appointments.cancelled`
- `appointments.rescheduled`
- `appointments.late_arrival`
- `appointments.completed`

**Business Logic**:
- Flag accounts with >= 3 no-shows in 30 days
- Flag accounts with >= 5 late cancellations (<24h notice) in 30 days
- Restrict booking if >= 3 reschedules in 30 days
- Flag accounts with >= 3 late arrivals (>15min) in 30 days
- Reset restrictions after >= 3 good behavior appointments

---

## Event Schemas

### 1. AppointmentNoShowEvent
```typescript
interface AppointmentNoShowEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  scheduledDate: Date;
  noShowDetails?: any;
  occurredAt: Date;
}
```

### 2. AppointmentCancelledEvent
```typescript
interface AppointmentCancelledEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  cancelledBy: string;
  cancellationType: string;
  reason?: string;
  hoursNotice: number;
  occurredAt: Date;
}
```

### 3. AppointmentRescheduledEvent
```typescript
interface AppointmentRescheduledEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  oldScheduledDate: Date;
  newScheduledDate: Date;
  rescheduledBy: string;
  reason?: string;
  occurredAt: Date;
}
```

### 4. AppointmentLateArrivalEvent
```typescript
interface AppointmentLateArrivalEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  scheduledTime: Date;
  actualArrivalTime: Date;
  minutesLate: number;
  occurredAt: Date;
}
```

### 5. AppointmentCompletedEvent
```typescript
interface AppointmentCompletedEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  completedAt: Date;
  wasOnTime: boolean;
  hadNoIssues: boolean;
  occurredAt: Date;
}
```

---

## Handler Methods

### 1. handleAppointmentNoShow()

**Business Rules**:
- Flag account if >= 3 no-shows in 30 days
- Track no-show patterns

**Thresholds**:
- **>= 3 no-shows in 30 days** → Flag account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Insert no-show record into `user_flags` table
4. Query no-shows in last 30 days
5. If count >= 3: Log warning, flag account
6. Mark event as processed

---

### 2. handleAppointmentCancelled()

**Business Rules**:
- Flag account if >= 5 late cancellations (<24h notice) in 30 days
- Late cancellation = hoursNotice < 24

**Thresholds**:
- **>= 5 late cancellations in 30 days** → Flag account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. If hoursNotice < 24: Insert late cancellation record
4. Query late cancellations in last 30 days
5. If count >= 5: Flag account
6. Mark event as processed

---

### 3. handleAppointmentRescheduled()

**Business Rules**:
- Restrict booking if >= 3 reschedules in 30 days
- Add restriction: "EXCESSIVE_RESCHEDULING"

**Thresholds**:
- **>= 3 reschedules in 30 days** → Restrict booking

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Insert reschedule record
4. Query reschedules in last 30 days
5. If count >= 3: Add restriction to `user_restrictions` table
6. Mark event as processed

---

### 4. handleAppointmentLateArrival()

**Business Rules**:
- Flag account if >= 3 late arrivals (>15min) in 30 days

**Thresholds**:
- **>= 3 late arrivals in 30 days** → Flag account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. If minutesLate > 15: Insert late arrival record
4. Query late arrivals in last 30 days
5. If count >= 3: Flag account
6. Mark event as processed

---

### 5. handleAppointmentCompleted()

**Business Rules**:
- Reset restrictions if >= 3 good behavior appointments
- Good behavior = wasOnTime && hadNoIssues

**Thresholds**:
- **>= 3 good appointments** → Remove restrictions

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Check if user has active restrictions
4. If yes: Query good behavior appointments in last 30 days
5. If count >= 3: Remove restrictions from `user_restrictions`
6. Mark event as processed

---

## Error Handling

- Idempotency via Inbox Pattern
- Retry with exponential backoff
- DLQ for failed events
- Circuit breaker protection

---

## Examples

### Example: No-Show (3rd occurrence)
```json
{
  "eventId": "evt-301",
  "appointmentId": "appt-456",
  "patientId": "patient-123",
  "doctorId": "doctor-789",
  "scheduledDate": "2025-01-07T10:00:00Z",
  "occurredAt": "2025-01-07T11:00:00Z"
}
```

**Expected Behavior**:
- Account flagged
- Warning logged
- Ops team notified (future)

---

## Monitoring

**Metrics**:
- `identity_events_consumed_total{event_type="appointments.no_show"}`
- `identity_events_processed_duration_seconds{event_type="appointments.cancelled"}`

**Alerts**:
- High no-show rate across patients
- Excessive restrictions applied
