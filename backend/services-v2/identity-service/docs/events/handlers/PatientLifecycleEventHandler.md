# PatientLifecycleEventHandler

## Overview

**Purpose**: Handle patient lifecycle events to permanently deactivate accounts when patient is deceased.

**Events Consumed**: 1 event from `patient.*` domain
- `patient.deceased`

**Business Logic**:
- Permanently deactivate user account when patient is deceased
- Different from account lock (irreversible)
- HIPAA compliance for deceased patient records

---

## Event Schema

### PatientDeceasedEvent
```typescript
interface PatientDeceasedEvent {
  eventId: string;
  patientId: string;
  userId: string;
  dateOfDeath: Date;
  deathCertificateNumber?: string;
  reportedBy: string; // Staff ID who reported
  occurredAt: Date;
}
```

---

## Handler Method

### handlePatientDeceased()

**Business Rules**:
- Permanently deactivate user account
- Irreversible action (different from lock)
- Maintain audit trail for HIPAA compliance

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Call `DeactivateUserUseCase` with userId
4. Mark event as processed
5. Log critical event with death certificate info

**Error Handling**:
- User not found: Log warning, skip
- Deactivation failure: Retry up to 3 times
- Critical event logged for audit

---

## Example

```json
{
  "eventId": "evt-701",
  "patientId": "patient-123",
  "userId": "user-456",
  "dateOfDeath": "2024-12-31T23:59:59Z",
  "deathCertificateNumber": "DC-2024-12345",
  "reportedBy": "staff-789",
  "occurredAt": "2025-01-07T10:00:00Z"
}
```

**Expected Behavior**:
- User account permanently deactivated
- Account cannot be reactivated
- Audit log entry created
- Medical records preserved per HIPAA
