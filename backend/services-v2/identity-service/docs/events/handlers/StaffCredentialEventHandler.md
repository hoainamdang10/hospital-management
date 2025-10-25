# StaffCredentialEventHandler

## Overview

**Purpose**: Handle staff credential and status events from Provider/Staff Service to maintain user account integrity and enforce credential-based access control.

**Events Consumed**: 7 events from `staff.*` domain
- `staff.credential_verified`
- `staff.status_changed`
- `staff.credential_expired`
- `staff.license_revoked`
- `staff.performance_flagged`
- `staff.department_changed`
- `staff.schedule_updated`

**Business Logic**:
- Activate user accounts when credentials are verified
- Lock/unlock accounts based on staff status changes
- Enforce credential expiration policies
- Immediate account lockout for license revocation
- Performance-based account restrictions
- Update user metadata with department and schedule information

---

## Event Schemas

### 1. StaffCredentialVerifiedEvent
```typescript
interface StaffCredentialVerifiedEvent {
  eventId: string;
  staffId: string;
  credentialNumber: string;
  credentialType: string; // 'MEDICAL_LICENSE', 'NURSING_LICENSE', etc.
  issuingAuthority: string;
  verifiedAt: Date;
}
```

### 2. StaffStatusChangedEvent
```typescript
interface StaffStatusChangedEvent {
  eventId: string;
  staffId: string;
  oldStatus: string;
  newStatus: string; // 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED'
  reason?: string;
  changedBy: string;
  occurredAt: Date;
}
```

### 3. StaffCredentialExpiredEvent
```typescript
interface StaffCredentialExpiredEvent {
  eventId: string;
  staffId: string;
  credentialNumber: string;
  credentialType: string;
  expiryDate: Date;
  occurredAt: Date;
}
```

### 4. StaffLicenseRevokedEvent
```typescript
interface StaffLicenseRevokedEvent {
  eventId: string;
  staffId: string;
  licenseNumber: string;
  licenseType: string;
  revocationReason: string;
  revokedBy: string; // Authority
  revokedAt: Date;
  occurredAt: Date;
}
```

### 5. StaffPerformanceFlaggedEvent
```typescript
interface StaffPerformanceFlaggedEvent {
  eventId: string;
  staffId: string;
  flagType: string; // 'COMPLAINT', 'MALPRACTICE', 'VIOLATION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  flaggedBy: string;
  occurredAt: Date;
}
```

### 6. StaffDepartmentChangedEvent
```typescript
interface StaffDepartmentChangedEvent {
  eventId: string;
  staffId: string;
  oldDepartmentId?: string;
  newDepartmentId: string;
  departmentName: string;
  effectiveDate: Date;
  occurredAt: Date;
}
```

### 7. StaffScheduleUpdatedEvent
```typescript
interface StaffScheduleUpdatedEvent {
  eventId: string;
  staffId: string;
  scheduleType: string; // 'SHIFT', 'ON_CALL', 'LEAVE'
  startDate: Date;
  endDate: Date;
  availability: string; // 'AVAILABLE', 'BUSY', 'OFF_DUTY'
  occurredAt: Date;
}
```

---

## Handler Methods

### 1. handleStaffCredentialVerified()

**Signature**:
```typescript
async handleStaffCredentialVerified(event: StaffCredentialVerifiedEvent): Promise<void>
```

**Business Rules**:
- Activate user account when staff credentials are verified
- Update user metadata with credential information
- Log credential verification in audit trail

**Flow**:
1. Check idempotency (event already processed?)
2. Store event in inbox
3. Look up user by staffId
4. Activate user account (set status = 'ACTIVE')
5. Update user metadata with credential details
6. Mark event as processed
7. Log success

**Error Handling**:
- If user not found: Log warning, mark as processed (skip)
- If database error: Mark as failed, retry with exponential backoff
- Idempotent: Duplicate events are ignored

---

### 2. handleStaffStatusChanged()

**Signature**:
```typescript
async handleStaffStatusChanged(event: StaffStatusChangedEvent): Promise<void>
```

**Business Rules**:
- **ACTIVE** → Unlock user account
- **INACTIVE/SUSPENDED** → Lock user account (temporary)
- **TERMINATED** → Lock user account (permanent)

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Look up user by staffId
4. Determine action based on newStatus:
   - ACTIVE: Call `ActivateUserUseCase`
   - INACTIVE/SUSPENDED/TERMINATED: Call `LockAccountUseCase`
5. Mark event as processed

**Thresholds**: None

**Error Handling**:
- User not found: Skip (log warning)
- Lock/Activate failure: Retry up to 3 times

---

### 3. handleStaffCredentialExpired()

**Signature**:
```typescript
async handleStaffCredentialExpired(event: StaffCredentialExpiredEvent): Promise<void>
```

**Business Rules**:
- Lock user account immediately when credential expires
- Prevent access until credential is renewed
- Notify staff via email (future enhancement)

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Look up user by staffId
4. Lock account with reason: "Credential expired: {credentialType}"
5. Terminate all active sessions
6. Mark event as processed

**Thresholds**: None (immediate action)

---

### 4. handleStaffLicenseRevoked()

**Signature**:
```typescript
async handleStaffLicenseRevoked(event: StaffLicenseRevokedEvent): Promise<void>
```

**Business Rules**:
- **CRITICAL**: Immediate account lockout
- Terminate all sessions
- Permanent lock (requires manual admin intervention to unlock)

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Look up user by staffId
4. Lock account with reason: "License revoked: {revocationReason}"
5. Terminate all sessions (`terminateSessions: true`)
6. Mark event as processed
7. Log critical security event

**Thresholds**: None (zero tolerance)

---

### 5. handleStaffPerformanceFlagged()

**Signature**:
```typescript
async handleStaffPerformanceFlagged(event: StaffPerformanceFlaggedEvent): Promise<void>
```

**Business Rules**:
- **CRITICAL severity**: Immediate account lock
- **HIGH severity**: Lock account
- **MEDIUM/LOW severity**: Log warning only (no action)

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Look up user by staffId
4. If severity === 'CRITICAL' or 'HIGH':
   - Lock account with reason: "Performance flagged: {flagType}"
   - Terminate sessions if CRITICAL
5. Mark event as processed

**Thresholds**:
- CRITICAL → Lock + terminate sessions
- HIGH → Lock account
- MEDIUM/LOW → No action

---

### 6. handleStaffDepartmentChanged()

**Signature**:
```typescript
async handleStaffDepartmentChanged(event: StaffDepartmentChangedEvent): Promise<void>
```

**Business Rules**:
- Update user metadata with new department information
- No account status changes
- Used for audit trail and reporting

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Update Supabase `auth.users` metadata:
   ```json
   {
     "departmentId": "dept-123",
     "departmentName": "Cardiology",
     "departmentChangedAt": "2025-01-07T10:00:00Z"
   }
   ```
4. Mark event as processed

**Thresholds**: None

---

### 7. handleStaffScheduleUpdated()

**Signature**:
```typescript
async handleStaffScheduleUpdated(event: StaffScheduleUpdatedEvent): Promise<void>
```

**Business Rules**:
- Update user metadata with schedule and availability
- No account status changes
- Used for real-time availability checks

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Update Supabase `auth.users` metadata:
   ```json
   {
     "scheduleType": "SHIFT",
     "availability": "AVAILABLE",
     "scheduleStart": "2025-01-07T08:00:00Z",
     "scheduleEnd": "2025-01-07T16:00:00Z"
   }
   ```
4. Mark event as processed

**Thresholds**: None

---

## Error Handling

### Idempotency
- Uses **Inbox Pattern** with `event_inbox` table
- UNIQUE constraint on `event_id` prevents duplicate processing
- `checkProcessed()` called before any business logic

### Retry Logic
- Failed events marked with `markFailed(eventId, errorMessage)`
- Retry with exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 5 attempts
- After max retries → Dead Letter Queue (DLQ)

### Dead Letter Queue
- Failed events after max retries stored in DLQ
- Manual intervention required
- Alerts sent to ops team

### Circuit Breaker
- Protects against cascading failures
- Opens after 5 consecutive failures
- Half-open state after 30 seconds
- Fully closes after 3 successful requests

---

## Examples

### Example 1: Credential Verified
```json
{
  "eventId": "evt-001",
  "staffId": "staff-123",
  "credentialNumber": "MD-12345",
  "credentialType": "MEDICAL_LICENSE",
  "issuingAuthority": "Vietnam Medical Board",
  "verifiedAt": "2025-01-07T10:00:00Z"
}
```

**Expected Behavior**:
- User account activated
- User can now login
- Metadata updated with credential info

---

### Example 2: License Revoked (CRITICAL)
```json
{
  "eventId": "evt-002",
  "staffId": "staff-456",
  "licenseNumber": "MD-67890",
  "licenseType": "MEDICAL_LICENSE",
  "revocationReason": "Malpractice violation",
  "revokedBy": "Vietnam Medical Board",
  "revokedAt": "2025-01-07T09:00:00Z",
  "occurredAt": "2025-01-07T09:05:00Z"
}
```

**Expected Behavior**:
- User account locked immediately
- All sessions terminated
- User cannot login
- Critical security event logged
- Ops team alerted

---

### Example 3: Performance Flagged (MEDIUM - No Action)
```json
{
  "eventId": "evt-003",
  "staffId": "staff-789",
  "flagType": "COMPLAINT",
  "severity": "MEDIUM",
  "description": "Patient complaint about wait time",
  "flaggedBy": "admin-001",
  "occurredAt": "2025-01-07T11:00:00Z"
}
```

**Expected Behavior**:
- Warning logged
- No account status change
- Event stored for audit trail
- No user impact

---

## Monitoring

**Metrics**:
- `identity_events_consumed_total{event_type="staff.credential_verified"}`
- `identity_events_processed_duration_seconds{event_type="staff.license_revoked"}`
- `identity_events_failed_total{event_type="staff.status_changed", error_type="user_not_found"}`

**Alerts**:
- High failure rate (>5% in 5min)
- Slow processing (p95 >2s)
- DLQ growing (>50 failed events)

**Logs**:
- All events logged with correlation ID
- CRITICAL events logged with `logger.error()`
- User not found logged with `logger.warn()`
