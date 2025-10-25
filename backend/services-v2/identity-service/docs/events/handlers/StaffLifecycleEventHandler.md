# StaffLifecycleEventHandler

## Overview

**Purpose**: Handle staff lifecycle events to activate user accounts when staff is registered.

**Events Consumed**: 1 event from `staff.*` domain
- `staff.registered`

**Business Logic**:
- Activate user account when staff is successfully registered
- Enable login access for new staff members

---

## Event Schema

### StaffRegisteredEvent
```typescript
interface StaffRegisteredEvent {
  eventId: string;
  staffId: string;
  userId: string;
  staffType: string; // 'DOCTOR', 'NURSE', etc.
  licenseNumber: string;
  employmentType: string;
  hireDate: Date;
  occurredAt: Date;
}
```

---

## Handler Method

### handleStaffRegistered()

**Business Rules**:
- Activate user account when staff is registered
- Allow immediate login access

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Call `ActivateUserUseCase` with userId
4. Mark event as processed
5. Log success

**Error Handling**:
- User not found: Log warning, skip
- Activation failure: Retry up to 3 times

---

## Example

```json
{
  "eventId": "evt-501",
  "staffId": "staff-123",
  "userId": "user-456",
  "staffType": "DOCTOR",
  "licenseNumber": "MD-12345",
  "employmentType": "FULL_TIME",
  "hireDate": "2025-01-01T00:00:00Z",
  "occurredAt": "2025-01-07T10:00:00Z"
}
```

**Expected Behavior**:
- User account activated
- Staff can login immediately
