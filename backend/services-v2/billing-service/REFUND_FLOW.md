# Refund Flow Documentation

## Overview

Hệ thống refund được thiết kế theo mô hình event-driven với 3 phases:
1. **Refund Requested** - User yêu cầu refund, tạo refund payment với status `refund_pending`
2. **Gateway Processing** - Worker gọi PayOS/VNPAY API để hoàn tiền thực sự
3. **Refund Completed** - Gateway confirm, update status và emit PaymentRefundedEvent

## Flow Diagram

```
[Appointment Cancelled]
        ↓
[AppointmentEventConsumer]
        ↓
[RefundPaymentUseCase.execute()]
        ↓
[Invoice.processRefund()]
        ↓
    ┌───────────────────────────────┐
    │  Create Refund Payment        │
    │  - method: 'refund'           │
    │  - status: 'refund_pending'   │
    │  - amount: negative           │
    └───────────────────────────────┘
        ↓
    ┌───────────────────────────────┐
    │  Update Invoice               │
    │  - outstandingAmount          │
    │  - status (refunded/partial)  │
    └───────────────────────────────┘
        ↓
    ┌───────────────────────────────┐
    │  Emit Events                  │
    │  1. PaymentRefundRequested    │
    │  2. PaymentRefunded           │
    └───────────────────────────────┘
        ↓
    ┌───────────────────────────────┐
    │  Save to Database             │
    │  - Invoice updated            │
    │  - Refund payment saved       │
    └───────────────────────────────┘
        ↓
    ┌───────────────────────────────┐
    │  [Worker] Process Gateway     │
    │  - Listen: refund_requested   │
    │  - Call PayOS/VNPAY API       │
    │  - Get gatewayRefundId        │
    └───────────────────────────────┘
        ↓
    ┌───────────────────────────────┐
    │  [Webhook] Gateway Callback   │
    │  - Update payment status      │
    │  - Set gatewayRefundId        │
    │  - Emit RefundCompleted       │
    └───────────────────────────────┘
```

## Events

### 1. PaymentRefundRequestedEvent
**Routing Key**: `billing.payment.refund_requested`

**Purpose**: Trigger gateway refund processing

**Payload**:
```typescript
{
  refundId: string;              // ID của refund payment record
  originalPaymentId: string;     // ID của payment gốc
  invoiceId: string;
  staffId: string;
  patientId: string;
  appointmentId?: string;
  refundAmount: number;
  currency: string;              // VND, USD, etc.
  reason: string;
  refundedBy: string;
  originalPaymentMethod: string; // payos, vnpay, etc.
  originalTransactionId?: string;
}
```

**Consumer**: RefundGatewayWorker (TODO: implement)

### 2. PaymentRefundedEvent
**Routing Key**: `billing.payment.refunded`

**Purpose**: Notify other services about refund

**Payload**:
```typescript
{
  refundId: string;
  originalPaymentId: string;
  invoiceId: string;
  staffId: string;
  patientId: string;
  appointmentId?: string;
  refundAmount: number;
  currency: string;
  reason: string;
  refundedBy: string;
  gatewayRefundId?: string;      // Set when gateway confirms
  refundedAt: Date;
}
```

**Consumers**: 
- NotificationsService (send refund confirmation email/SMS)
- Read models (update billing history)

## Database Schema

### payment_records Table

```sql
CREATE TABLE billing_schema.payment_records (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL,  -- Negative for refunds
  currency VARCHAR(3) DEFAULT 'VND',
  method payment_method NOT NULL,  -- Includes 'refund'
  status payment_status NOT NULL,  -- Includes 'refund_pending'
  transaction_id VARCHAR(255),
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_reason TEXT,              -- NEW
  refunded_by VARCHAR(255),        -- NEW
  gateway_refund_id VARCHAR(255),  -- NEW
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Status

### ✅ Completed (Phase 1 - Proper Refund Flow)
- [x] RefundPaymentUseCase - Request refund
- [x] Invoice.processRefund() - Create refund payment, emit RefundRequested
- [x] Invoice.completeRefund() - Complete refund after gateway confirms
- [x] CompleteRefundUseCase - Update invoice when gateway confirms
- [x] Payment.createRefund() - Create refund payment record
- [x] Payment.completeRefund() - Mark refund as completed
- [x] PaymentRefundRequestedEvent - Trigger gateway processing
- [x] PaymentRefundedEvent - Notify after gateway confirms
- [x] RefundGatewayWorker - Consume refund_requested, call gateway (MOCK)
- [x] Repository methods (findByAppointmentId)
- [x] Proper outstanding amount calculation
- [x] 3-phase refund flow (requested → gateway → completed)

### 🔄 TODO (Future Enhancement)
- [ ] VnpayIntegrationService.processRefund() - Real API integration
- [ ] PayOSIntegrationService.processRefund() - Real API integration
- [ ] HandleRefundWebhookUseCase - Handle gateway callbacks
- [ ] Database migration for new payment fields
- [ ] Integration tests
- [ ] Retry logic for failed gateway calls
- [ ] Dead letter queue for failed refunds

## Current MVP Implementation

### Refund Flow (Automated with Mock Gateway)

1. **User requests refund** → RefundPaymentUseCase
2. **System creates refund payment** → status = `refund_pending`
3. **System emits** → `billing.payment.refund_requested`
4. **RefundGatewayWorker consumes event**
5. **Worker calls gateway API** (MOCK - returns fake gatewayRefundId)
6. **Worker calls CompleteRefundUseCase**
7. **System updates invoice** → status = `refunded`, outstanding = 0
8. **System emits** → `billing.payment.refunded`
9. **Notifications service sends email/SMS**

### For Production

Replace mock gateway call in RefundGatewayWorker with real API:

```typescript
// In RefundGatewayWorker.callGatewayRefundAPI()
if (originalPaymentMethod === 'payos') {
  const payosService = new PayOSIntegrationService();
  const response = await payosService.processRefund({
    transactionId: originalTransactionId,
    amount: refundAmount,
    reason: event.data.reason
  });
  return response.refundId;
}
```

