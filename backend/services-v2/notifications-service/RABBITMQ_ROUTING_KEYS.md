# RABBITMQ ROUTING KEYS CONFIGURATION

**Updated**: 2025-11-16  
**Scope**: MVP (Appointment Booking + Payment Flow)

---

## ✅ ACTIVE ROUTING KEYS (MVP Scope)

### **Appointment Events**
```typescript
const APPOINTMENT_ROUTING_KEYS = [
  'appointments.appointment.scheduled',   // Initial booking (PENDING_PAYMENT)
  'appointments.appointment.confirmed',   // After payment completed
  'appointments.appointment.cancelled',   // Payment timeout or user cancellation
];
```

**Queue**: `notifications.appointments`  
**Exchange**: `hospital.events` (topic)  
**Purpose**: Core appointment booking + confirmation flow

### **Billing Events**
```typescript
const BILLING_ROUTING_KEYS = [
  'billing.invoice.generated',           // Invoice created
  'billing.payment.completed',           // Payment receipt (from PaymentProcessedEvent)
];
```

**Queue**: `notifications.billing`  
**Exchange**: `hospital.events` (topic)  
**Purpose**: Payment notifications + receipts

---

## ❌ REMOVED ROUTING KEYS (Out of MVP Scope)

### **Clinical EMR Events** (Removed)
```typescript
// ❌ REMOVED - Clinical notifications out of scope
// 'clinical.*.created'
// 'clinical.*.updated'
// 'clinical.test_results.ready'
// 'clinical.prescription.ready'
// 'clinical.emergency.alert'
```

### **Staff Events** (Removed)
```typescript
// ❌ REMOVED - Staff schedules handled via appointments
// 'staff.*.assigned'
// 'staff.*.changed'
// 'staff.schedule.updated'
// 'staff.shift.assigned'
```

### **Insurance/Billing Extended** (Removed)
```typescript
// ❌ REMOVED - Insurance out of MVP scope
// 'billing.insurance.*'
// 'billing.preauth.*'
// 'billing.rate.updated'
// 'billing.refund.*'
```

---

## 🔄 EVENT FLOW DIAGRAM

```
┌─────────────────────┐
│  Appointments Svc   │
└──────────┬──────────┘
           │ publishes
           ▼
  appointment.scheduled (PENDING_PAYMENT)
           │
           ▼
  ┌────────────────┐
  │ Notifications  │ → Email: "Yêu cầu đã nhận, vui lòng thanh toán"
  └────────────────┘
           
           ┌──────────┐
           │  User    │ → Pays invoice
           └─────┬────┘
                 │
                 ▼
       ┌─────────────────┐
       │  Billing Svc    │
       └────────┬────────┘
                │ publishes
                ▼
     billing.payment.completed
                │
                ▼
       ┌─────────────────┐
       │ Appointments Svc│ subscribes → Update status=CONFIRMED
       └────────┬────────┘
                │ publishes
                ▼
     appointment.confirmed
                │
                ▼
       ┌─────────────────┐
       │  Notifications  │ → Email: "Lịch hẹn đã xác nhận"
       │                 │ → Create reminders (24H, 2H, 30M)
       └─────────────────┘
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Configuration Updates Needed**

```typescript
// File: src/infrastructure/events/EventBusIntegration.ts

const ROUTING_KEYS = {
  // ✅ Appointments (MVP)
  APPOINTMENT_SCHEDULED: 'appointments.appointment.scheduled',
  APPOINTMENT_CONFIRMED: 'appointments.appointment.confirmed', // ⚠️ NEW
  APPOINTMENT_CANCELLED: 'appointments.appointment.cancelled',
  
  // ✅ Billing (MVP)
  BILLING_INVOICE_GENERATED: 'billing.invoice.generated',
  BILLING_PAYMENT_COMPLETED: 'billing.payment.completed',
  
  // ===== FUTURE WORK =====
  // APPOINTMENT_RESCHEDULED: 'appointments.appointment.rescheduled',
  // BILLING_PAYMENT_LINK_CREATED: 'billing.payment.link.created',
  // BILLING_PAYMENT_LINK_EXPIRED: 'billing.payment.link.expired',
};
```

### **Queue Configuration**

```typescript
// Appointments Queue
await channel.assertQueue('notifications.appointments', { durable: true });
await channel.bindQueue(
  'notifications.appointments',
  'hospital.events',
  'appointments.appointment.scheduled'
);
await channel.bindQueue(
  'notifications.appointments',
  'hospital.events',
  'appointments.appointment.confirmed' // ⚠️ NEW binding
);
await channel.bindQueue(
  'notifications.appointments',
  'hospital.events',
  'appointments.appointment.cancelled'
);

// Billing Queue
await channel.assertQueue('notifications.billing', { durable: true });
await channel.bindQueue(
  'notifications.billing',
  'hospital.events',
  'billing.invoice.generated'
);
await channel.bindQueue(
  'notifications.billing',
  'hospital.events',
  'billing.payment.completed' // Maps to PaymentProcessedEvent
);
```

---

## 🧪 TESTING COMMANDS

### **Verify Queue Bindings**
```bash
# RabbitMQ Management UI
http://localhost:15673

# Check queues
- notifications.appointments (bindings: 3)
- notifications.billing (bindings: 2)

# Check exchanges
- hospital.events (type: topic)
```

### **Simulate Events**
```bash
# Test appointment.scheduled
curl -X POST http://localhost:3009/api/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientId": "...","doctorId": "..."}'

# Test payment.completed
curl -X POST http://localhost:3009/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "...","amount": 500000}'
```

---

## 📊 ROUTING KEY SUMMARY

| Event | Producer | Consumer | Template | Priority |
|-------|----------|----------|----------|----------|
| `appointment.scheduled` | Appointments | Notifications | APPOINTMENT_SCHEDULED | NORMAL |
| `appointment.confirmed` | Appointments | Notifications | APPOINTMENT_CONFIRMED | HIGH |
| `appointment.cancelled` | Appointments | Notifications | APPOINTMENT_CANCELLED | HIGH |
| `billing.invoice.generated` | Billing | Notifications | INVOICE_GENERATED | NORMAL |
| `billing.payment.completed` | Billing | Notifications | PAYMENT_COMPLETED | NORMAL |

**Total Active**: 5 routing keys  
**Total Removed**: ~15 routing keys (clinical, staff, insurance)  
**Reduction**: 75% routing complexity

---

## 🚀 DEPLOYMENT NOTES

1. **Backward Compatible**: Old queues/bindings won't break system
2. **Gradual Cleanup**: Remove old bindings after verifying new flow works
3. **Monitoring**: Watch for unrouted messages in RabbitMQ logs
4. **Rollback**: Can re-add bindings if needed (configuration-only change)

---

**Status**: ✅ Documentation Complete  
**Next Step**: Update `EventBusIntegration.ts` if needed for explicit configuration
