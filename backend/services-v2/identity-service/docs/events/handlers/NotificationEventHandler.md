# NotificationEventHandler

## Overview

**Purpose**: Handle notification delivery failures to track communication issues.

**Events Consumed**: 1 event from `notifications.*` domain
- `notifications.delivery_failed`

**Business Logic**:
- Track notification delivery failures
- Update user contact preferences if persistent failures
- Log for audit trail

---

## Event Schema

### NotificationDeliveryFailedEvent
```typescript
interface NotificationDeliveryFailedEvent {
  eventId: string;
  notificationId: string;
  userId: string;
  channel: string; // 'EMAIL', 'SMS', 'PUSH'
  failureReason: string;
  attemptCount: number;
  occurredAt: Date;
}
```

---

## Handler Method

### handleNotificationDeliveryFailed()

**Business Rules**:
- Track delivery failures
- If >= 5 failures on same channel: Flag for review
- Update user metadata with failure info

**Thresholds**:
- **>= 5 failures on same channel** → Flag for review

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Look up user by userId
4. Update user metadata with failure info
5. Query failures in last 30 days
6. If count >= 5: Log warning, flag for review
7. Mark event as processed

---

## Example

```json
{
  "eventId": "evt-601",
  "notificationId": "notif-123",
  "userId": "user-456",
  "channel": "EMAIL",
  "failureReason": "Invalid email address",
  "attemptCount": 3,
  "occurredAt": "2025-01-07T10:00:00Z"
}
```

**Expected Behavior**:
- Failure logged
- User metadata updated
- If 5th failure: Flag for manual review
