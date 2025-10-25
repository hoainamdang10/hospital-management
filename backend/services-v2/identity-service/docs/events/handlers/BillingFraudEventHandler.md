# BillingFraudEventHandler

## Overview

**Purpose**: Detect and prevent billing fraud by monitoring payment failures, overdue invoices, disputes, and insurance claim patterns.

**Events Consumed**: 6 events from `billing.*` domain
- `billing.payment_failed`
- `billing.invoice_overdue`
- `billing.payment_processed`
- `billing.dispute_filed`
- `billing.payment_refunded`
- `billing.insurance_claim_rejected`

**Business Logic**:
- Lock accounts with excessive payment failures (>= 5 in 30 days)
- Lock accounts with severely overdue invoices (> 90 days)
- Track payment history for fraud detection
- Flag accounts with excessive disputes (>= 3 in 60 days)
- Flag accounts with excessive refunds (>= 5 in 90 days)
- Flag accounts with excessive insurance claim rejections (>= 3 in 60 days)

---

## Event Schemas

### 1. PaymentFailedEvent
```typescript
interface PaymentFailedEvent {
  eventId: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  failureReason: string;
  attemptCount: number;
  occurredAt: Date;
}
```

### 2. InvoiceOverdueEvent
```typescript
interface InvoiceOverdueEvent {
  eventId: string;
  invoiceId: string;
  patientId: string;
  totalAmount: number;
  dueDate: Date;
  daysOverdue: number;
  occurredAt: Date;
}
```

### 3. PaymentProcessedEvent
```typescript
interface PaymentProcessedEvent {
  eventId: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  occurredAt: Date;
}
```

### 4. BillingDisputeFiledEvent
```typescript
interface BillingDisputeFiledEvent {
  eventId: string;
  disputeId: string;
  invoiceId: string;
  patientId: string;
  disputeReason: string;
  disputeAmount: number;
  filedAt: Date;
  occurredAt: Date;
}
```

### 5. PaymentRefundedEvent
```typescript
interface PaymentRefundedEvent {
  eventId: string;
  refundId: string;
  invoiceId: string;
  patientId: string;
  refundAmount: number;
  refundReason: string;
  originalPaymentId: string;
  occurredAt: Date;
}
```

### 6. InsuranceClaimRejectedEvent
```typescript
interface InsuranceClaimRejectedEvent {
  eventId: string;
  claimId: string;
  patientId: string;
  insuranceProvider: string;
  rejectionReason: string;
  claimAmount: number;
  occurredAt: Date;
}
```

---

## Handler Methods

### 1. handlePaymentFailed()

**Business Rules**:
- Lock account if >= 5 payment failures in 30 days
- Track failure patterns for fraud detection

**Thresholds**:
- **5 failures in 30 days** → Lock account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Query payment failures in last 30 days
4. If count >= 5: Lock account with reason "Excessive payment failures"
5. Mark event as processed

---

### 2. handleInvoiceOverdue()

**Business Rules**:
- Lock account if invoice > 90 days overdue
- Prevent new appointments until payment

**Thresholds**:
- **> 90 days overdue** → Lock account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. If daysOverdue > 90: Lock account
4. Mark event as processed

---

### 3. handlePaymentProcessed()

**Business Rules**:
- Log successful payment
- No account actions (informational only)

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Log payment success
4. Mark event as processed

---

### 4. handleBillingDisputeFiled()

**Business Rules**:
- Flag account if >= 3 disputes in 60 days
- Investigate potential fraud

**Thresholds**:
- **>= 3 disputes in 60 days** → Flag account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Query disputes in last 60 days
4. If count >= 3: Flag account (log warning)
5. Mark event as processed

---

### 5. handlePaymentRefunded()

**Business Rules**:
- Flag account if >= 5 refunds in 90 days
- Potential service abuse pattern

**Thresholds**:
- **>= 5 refunds in 90 days** → Flag account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Query refunds in last 90 days
4. If count >= 5: Flag account
5. Mark event as processed

---

### 6. handleInsuranceClaimRejected()

**Business Rules**:
- Flag account if >= 3 rejections in 60 days
- Potential insurance fraud

**Thresholds**:
- **>= 3 rejections in 60 days** → Flag account

**Flow**:
1. Check idempotency
2. Store event in inbox
3. Query rejections in last 60 days
4. If count >= 3: Flag account
5. Mark event as processed

---

## Error Handling

- Idempotency via Inbox Pattern
- Retry with exponential backoff
- DLQ for failed events after 5 retries
- Circuit breaker protection

---

## Examples

### Example: Payment Failed (5th failure)
```json
{
  "eventId": "evt-201",
  "invoiceId": "inv-456",
  "patientId": "patient-123",
  "amount": 500000,
  "failureReason": "Insufficient funds",
  "attemptCount": 5,
  "occurredAt": "2025-01-07T10:00:00Z"
}
```

**Expected Behavior**:
- Account locked
- User cannot book new appointments
- Email notification sent (future)

---

## Monitoring

**Metrics**:
- `identity_events_consumed_total{event_type="billing.payment_failed"}`
- `identity_events_processed_duration_seconds{event_type="billing.invoice_overdue"}`

**Alerts**:
- High billing fraud detection rate
- Excessive account locks
