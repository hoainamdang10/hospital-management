# ClinicalComplianceEventHandler

## Overview

**Purpose**: Enforce clinical compliance by monitoring medical record violations and prescription abuse.

**Events Consumed**: 2 events from `clinical.*` domain
- `clinical.medical_record_flagged`
- `clinical.prescription_abuse_detected`

**Business Logic**:
- Lock accounts for CRITICAL medical record violations
- Lock accounts for prescription abuse detection
- HIPAA compliance enforcement

---

## Event Schemas

### 1. MedicalRecordFlaggedEvent
```typescript
interface MedicalRecordFlaggedEvent {
  eventId: string;
  recordId: string;
  patientId: string;
  flagReason: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  flaggedBy: string;
  occurredAt: Date;
}
```

### 2. PrescriptionAbuseDetectedEvent
```typescript
interface PrescriptionAbuseDetectedEvent {
  eventId: string;
  patientId: string;
  prescriptionId: string;
  abuseType: string; // 'DOCTOR_SHOPPING', 'EARLY_REFILL', 'DUPLICATE_REQUEST'
  detectedAt: Date;
  occurredAt: Date;
}
```

---

## Handler Methods

### 1. handleMedicalRecordFlagged()

**Business Rules**:
- CRITICAL severity → Lock account immediately
- HIGH severity → Lock account
- MEDIUM/LOW → Log warning only

**Thresholds**:
- **CRITICAL** → Immediate lock + terminate sessions
- **HIGH** → Lock account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Look up user by patientId
4. If severity === 'CRITICAL' or 'HIGH': Lock account
5. If CRITICAL: Terminate all sessions
6. Mark event as processed

---

### 2. handlePrescriptionAbuseDetected()

**Business Rules**:
- Lock account immediately
- Prevent further prescription requests
- Alert medical staff

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Lock account with reason: "Prescription abuse: {abuseType}"
4. Terminate all sessions
5. Mark event as processed
6. Log critical security event

---

## Error Handling

- Idempotency via Inbox Pattern
- Retry with exponential backoff
- DLQ for failed events

---

## Examples

### Example: Medical Record Flagged (CRITICAL)
```json
{
  "eventId": "evt-401",
  "recordId": "record-123",
  "patientId": "patient-456",
  "flagReason": "Unauthorized access attempt",
  "severity": "CRITICAL",
  "flaggedBy": "security-system",
  "occurredAt": "2025-01-07T10:00:00Z"
}
```

**Expected Behavior**:
- Account locked immediately
- All sessions terminated
- Security team alerted

---

## Monitoring

**Metrics**:
- `identity_events_consumed_total{event_type="clinical.medical_record_flagged"}`
- `identity_events_processed_duration_seconds{event_type="clinical.prescription_abuse_detected"}`
