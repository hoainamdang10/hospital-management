# Message Bus Contract - Scheduler Service

## Overview

This document defines the contract for events published by the Scheduler Service to RabbitMQ.

**Exchange**: `hospital.events` (topic exchange)
**Routing Key Format**: `{ownerService}.{resourceType}.{action}`
**Content Type**: `application/json`
**Schema Version**: `v1`

---

## Event Schema

### Headers (RabbitMQ Message Properties)

All events published by Scheduler Service include the following headers:

```typescript
interface EventHeaders {
  // Correlation & Tracing
  correlation_id: string;      // UUID v4 - Request correlation ID
  causation_id: string;         // UUID v4 - Schedule ID (what caused this event)
  
  // Event Metadata
  schedule_id: string;          // UUID v4 - Schedule identifier
  run_id: string;               // UUID v4 - Run identifier
  tenant_id: string;            // Tenant identifier for isolation
  
  // Idempotency
  idempotency_key: string;      // Format: "sched:{schedule_id}:{run_id}"
  
  // Timestamps
  emitted_at: string;           // ISO 8601 - When event was emitted
  timestamp: string;            // ISO 8601 - When run was due (due_at_utc)
  
  // Schema
  schema_version: string;       // "v1"
  content_type: string;         // "application/json"
  event_type: string;           // Event type identifier
}
```

**Example**:
```json
{
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "causation_id": "660e8400-e29b-41d4-a716-446655440001",
  "schedule_id": "660e8400-e29b-41d4-a716-446655440001",
  "run_id": "770e8400-e29b-41d4-a716-446655440002",
  "tenant_id": "hospital-1",
  "idempotency_key": "sched:660e8400-e29b-41d4-a716-446655440001:770e8400-e29b-41d4-a716-446655440002",
  "emitted_at": "2025-10-21T10:00:05.123Z",
  "timestamp": "2025-10-21T10:00:00.000Z",
  "schema_version": "v1",
  "content_type": "application/json",
  "event_type": "schedule.run.due"
}
```

---

### Payload (RabbitMQ Message Body)

The message body contains the event payload:

```typescript
interface ScheduleRunEvent {
  // Run Metadata
  scheduleId: string;           // UUID v4
  runId: string;                // UUID v4
  tenantId: string;             // Tenant identifier
  
  // Timing
  dueAtUtc: string;             // ISO 8601 - When run was scheduled
  
  // Routing
  topicOrCommand: string;       // Original topic from schedule
  
  // Payload
  payloadJson: object;          // Original payload from schedule
  
  // Retry
  attempt: number;              // Current attempt (0-based)
}
```

**Example**:
```json
{
  "scheduleId": "660e8400-e29b-41d4-a716-446655440001",
  "runId": "770e8400-e29b-41d4-a716-446655440002",
  "tenantId": "hospital-1",
  "dueAtUtc": "2025-10-21T10:00:00.000Z",
  "topicOrCommand": "appointments.appointment.reminder.24h",
  "payloadJson": {
    "appointmentId": "appt-123",
    "patientId": "patient-456",
    "reminderType": "24h"
  },
  "attempt": 0
}
```

---

## Topic Naming Convention

### Format

```
{ownerService}.{resourceType}.{action}
```

**Components**:
- `ownerService`: Service that owns the schedule (e.g., `appointments`, `billing`)
- `resourceType`: Type of resource (e.g., `appointment`, `invoice`)
- `action`: Action to perform (e.g., `reminder.24h`, `generate.monthly`)

### Examples

| Topic | Description | Use Case |
|-------|-------------|----------|
| `appointments.appointment.reminder.24h` | Appointment reminder 24h before | Send reminder email/SMS |
| `appointments.appointment.reminder.2h` | Appointment reminder 2h before | Send urgent reminder |
| `appointments.appointment.cancelled` | Appointment cancelled | Cleanup/notification |
| `appointments.queue.check` | Check waiting queue | Process queue |
| `billing.invoice.generate.monthly` | Generate monthly invoice | Billing cycle |
| `billing.payment.reminder` | Payment reminder | Overdue payment |
| `billing.payment.overdue` | Payment overdue alert | Escalation |
| `notifications.alert.send` | Send alert notification | Generic alert |
| `notifications.email.send` | Send email | Email delivery |
| `notifications.sms.send` | Send SMS | SMS delivery |

**Note**: See [Topic Allowlist](../config/topic-allowlist.json) for complete list and wildcard patterns.

---

## Idempotency Key Format

**Format**: `sched:{schedule_id}:{run_id}`

**Purpose**: 
- Enables consumers to deduplicate events using Inbox pattern
- Guarantees exactly-once processing semantics
- Survives network retries and RabbitMQ redeliveries

**Example**: `sched:660e8400-e29b-41d4-a716-446655440001:770e8400-e29b-41d4-a716-446655440002`

**Consumer Usage**:
```typescript
async function handleEvent(event: ScheduleRunEvent, headers: EventHeaders) {
  const { idempotency_key } = headers;
  
  // Check inbox for duplicate
  const existing = await db.query(
    'SELECT * FROM inbox WHERE idempotency_key = $1',
    [idempotency_key]
  );
  
  if (existing.rows.length > 0) {
    console.log('Duplicate event, skipping');
    return; // Idempotent
  }
  
  // Process event...
}
```

---

## Event Types

### 1. `schedule.run.due`

**Description**: A scheduled run is due for execution

**Routing Key**: Value from `topicOrCommand` field in schedule

**Headers**:
```json
{
  "event_type": "schedule.run.due",
  "correlation_id": "...",
  "causation_id": "{schedule_id}",
  "schedule_id": "{schedule_id}",
  "run_id": "{run_id}",
  "tenant_id": "{tenant_id}",
  "idempotency_key": "sched:{schedule_id}:{run_id}",
  "emitted_at": "{ISO 8601}",
  "timestamp": "{due_at_utc}",
  "schema_version": "v1",
  "content_type": "application/json"
}
```

**Payload**:
```json
{
  "scheduleId": "{schedule_id}",
  "runId": "{run_id}",
  "tenantId": "{tenant_id}",
  "dueAtUtc": "{ISO 8601}",
  "topicOrCommand": "{routing_key}",
  "payloadJson": {
    // Original payload from schedule
  },
  "attempt": 0
}
```

---

## Consumer Guidelines

### 1. Inbox Pattern (Recommended)

**Purpose**: Guarantee exactly-once processing

**Implementation**:

```sql
-- Create inbox table in consumer service schema
CREATE TABLE {service}_schema.inbox (
  inbox_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL,
  processed_at_utc timestamptz,
  created_at_utc timestamptz DEFAULT now()
);

CREATE INDEX idx_inbox_unprocessed 
ON {service}_schema.inbox(created_at_utc)
WHERE processed_at_utc IS NULL;
```

**Handler Pattern**:

```typescript
async function handleScheduleRunEvent(
  event: ScheduleRunEvent,
  headers: EventHeaders
) {
  const { idempotency_key } = headers;
  
  // 1. Check inbox for duplicate
  const existing = await db.query(
    'SELECT * FROM inbox WHERE idempotency_key = $1',
    [idempotency_key]
  );
  
  if (existing.rows.length > 0) {
    console.log('Duplicate event, skipping');
    return; // Idempotent
  }
  
  // 2. Insert into inbox + process in transaction
  await db.transaction(async (tx) => {
    // Insert inbox record
    await tx.query(
      `INSERT INTO inbox (idempotency_key, event_type, payload_json) 
       VALUES ($1, $2, $3)`,
      [idempotency_key, headers.event_type, event]
    );
    
    // Process event
    await processEvent(tx, event);
    
    // Mark as processed
    await tx.query(
      `UPDATE inbox 
       SET processed_at_utc = now() 
       WHERE idempotency_key = $1`,
      [idempotency_key]
    );
  });
}
```

### 2. Error Handling

**Retry Strategy**:
- **Transient Errors** (network, timeout): Retry with exponential backoff
- **Permanent Errors** (validation, business logic): Log and move to dead letter queue
- **Timeout**: Set reasonable timeout (e.g., 30s) to avoid blocking inbox

**Example**:
```typescript
async function processEvent(tx: Transaction, event: ScheduleRunEvent) {
  try {
    // Business logic
    await sendReminder(event.payloadJson);
  } catch (error) {
    if (isTransientError(error)) {
      // Retry (RabbitMQ will redeliver)
      throw error;
    } else {
      // Permanent error - log and skip
      console.error('Permanent error:', error);
      await logError(tx, event, error);
      // Don't throw - mark as processed
    }
  }
}
```

### 3. Monitoring

**Metrics to Track**:
- `inbox_processing_latency_seconds` - Time from `emitted_at` to `processed_at_utc`
- `inbox_duplicate_events_total` - Count of duplicate events (idempotency working)
- `inbox_processing_errors_total` - Count of processing errors
- `inbox_unprocessed_count` - Gauge of unprocessed inbox entries

**Alerts**:
- Inbox processing latency > 5 minutes
- Unprocessed inbox count > 1000
- Processing error rate > 5%

---

## Validation Rules

### Topic Allowlist

Topics must be in the allowlist for the `ownerService`. See [Topic Allowlist](../config/topic-allowlist.json).

**Validation**:
```typescript
function validateTopic(ownerService: string, topic: string): boolean {
  const allowlist = TOPIC_ALLOWLIST[ownerService];
  if (!allowlist) return false;
  
  // Support wildcards
  return allowlist.some(pattern => {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return topic.startsWith(prefix);
    }
    return topic === pattern;
  });
}
```

### Tenant Isolation

**Rule**: `tenant_id` in headers must match `tenantId` in payload

**Validation**:
```typescript
function validateTenant(headers: EventHeaders, payload: ScheduleRunEvent): boolean {
  return headers.tenant_id === payload.tenantId;
}
```

---

## Versioning

**Current Version**: `v1`

**Schema Evolution**:
- **Backward Compatible Changes**: Add optional fields, deprecate fields
- **Breaking Changes**: Increment schema version (v2, v3, etc.)
- **Migration**: Support multiple versions during transition period

**Example** (future v2):
```json
{
  "schema_version": "v2",
  "event_type": "schedule.run.due.v2",
  // New fields...
}
```

---

## Examples

### Example 1: Appointment Reminder 24h Before

**Schedule Creation**:
```json
POST /api/v1/schedules:createOrUpdateByDedup
{
  "tenantId": "hospital-1",
  "ownerService": "appointments",
  "ownerResourceType": "appointment",
  "ownerResourceId": "appt-123",
  "scheduleType": "ONCE",
  "startAtUtc": "2025-10-22T09:00:00Z",
  "topicOrCommand": "appointments.appointment.reminder.24h",
  "payloadJson": {
    "appointmentId": "appt-123",
    "patientId": "patient-456",
    "doctorId": "doctor-789",
    "appointmentTime": "2025-10-23T09:00:00Z"
  },
  "dedupKey": "appt-123:reminder-24h"
}
```

**Published Event** (at 2025-10-22T09:00:00Z):

**Routing Key**: `appointments.appointment.reminder.24h`

**Headers**:
```json
{
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "causation_id": "660e8400-e29b-41d4-a716-446655440001",
  "schedule_id": "660e8400-e29b-41d4-a716-446655440001",
  "run_id": "770e8400-e29b-41d4-a716-446655440002",
  "tenant_id": "hospital-1",
  "idempotency_key": "sched:660e8400-e29b-41d4-a716-446655440001:770e8400-e29b-41d4-a716-446655440002",
  "emitted_at": "2025-10-22T09:00:05.123Z",
  "timestamp": "2025-10-22T09:00:00.000Z",
  "schema_version": "v1",
  "content_type": "application/json",
  "event_type": "schedule.run.due"
}
```

**Payload**:
```json
{
  "scheduleId": "660e8400-e29b-41d4-a716-446655440001",
  "runId": "770e8400-e29b-41d4-a716-446655440002",
  "tenantId": "hospital-1",
  "dueAtUtc": "2025-10-22T09:00:00.000Z",
  "topicOrCommand": "appointments.appointment.reminder.24h",
  "payloadJson": {
    "appointmentId": "appt-123",
    "patientId": "patient-456",
    "doctorId": "doctor-789",
    "appointmentTime": "2025-10-23T09:00:00Z"
  },
  "attempt": 0
}
```

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2025-10-21 | Initial version |

---

## Contact

For questions or clarifications, contact:
- **Team**: Hospital Management System V2
- **Email**: support@hospital-v2.com
- **Slack**: #scheduler-service

