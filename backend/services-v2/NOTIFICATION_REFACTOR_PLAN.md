# NOTIFICATION SERVICE REFACTOR PLAN v2.0

**Objective**: Thu hẹp scope Notifications Service cho đồ án - tập trung vào Appointment Booking + Payment Flow

**Timeline**: ~18h (2.5 ngày)

**Status**: 🔴 Not Started

---

## 📋 CHECKLIST TỔNG QUAN

### ✅ Core Changes
- [ ] Thêm `appointment.confirmed` event flow
- [ ] Reminders chỉ tạo sau khi payment completed
- [ ] Xóa Clinical EMR consumer
- [ ] Xóa Staff consumer  
- [ ] Cleanup Billing consumer (remove insurance handlers)
- [ ] Thêm 3 templates mới (APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, PAYMENT_COMPLETED)
- [ ] Deactivate 1 template clinical (TEST_RESULTS_READY)

### ⚠️ Critical Fixes (Từ góp ý)
- [ ] **Idempotency check** trong BillingEventHandler
- [ ] **Pure DDD**: Loại logger ra khỏi Aggregate
- [ ] **UX**: Template APPOINTMENT_SCHEDULED nội dung rõ "chưa thanh toán"

---

## 📊 EVENT FLOW (BEFORE vs AFTER)

### ❌ BEFORE (Problematic)
```
appointment.scheduled → Notifications tạo reminders ngay
                     → Nếu không thanh toán → appointment bị hủy
                     → Reminders vẫn gửi (BUG!)
```

### ✅ AFTER (Correct)
```
1. appointment.scheduled 
   → Billing tạo invoice/payment link
   → Notifications gửi "đã nhận yêu cầu, vui lòng thanh toán"

2. billing.payment.processed (status=COMPLETED)
   → Appointments update status=CONFIRMED
   → Appointments emit appointment.confirmed

3. appointment.confirmed
   → Notifications gửi "xác nhận lịch hẹn"
   → Notifications tạo reminders (24H, 2H, 30M)
```

---

## 🎯 PHASE 0: PRE-REFACTOR VERIFICATION

**Effort**: 2h | **Priority**: 🔴 CRITICAL

### Checklist
- [ ] Verify Billing Service có emit `billing.payment.processed` event
- [ ] Verify event payload có `appointmentId`, `paymentStatus`, `completedAt`
- [ ] Apply Migration 013 (create appointment_reminders table)
- [ ] Backup database trước khi refactor

### Actions
```bash
# 1. Check Billing events
cd backend/services-v2/billing-service
grep -r "payment.processed" src/

# 2. Apply migration 013
cd backend/services-v2/notifications-service
# Use Supabase MCP or manual apply
```

### Verification Queries
```sql
-- Check appointment_reminders table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'notifications_schema' 
    AND table_name = 'appointment_reminders'
);

-- Check current templates
SELECT template_type, name, is_active 
FROM notifications_schema.notification_templates
ORDER BY template_type;
```

---

## 🎯 PHASE 1: APPOINTMENTS SERVICE - Add BillingEventHandler

**Effort**: 4h | **Priority**: 🔴 HIGH

### 1.1. Create BillingEventHandler

**File**: `appointments-service/src/infrastructure/events/BillingEventHandler.ts`

```typescript
/**
 * Billing Event Handler - Infrastructure Layer
 * Handles billing events and updates appointment status accordingly
 * 
 * @compliance Clean Architecture, Event-Driven, Idempotent
 */

import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { createLogger } from '@/infrastructure/logging/Logger';
import { AppointmentStatus } from '@/domain/value-objects/AppointmentStatus';

const logger = createLogger('BillingEventHandler');

export interface PaymentProcessedEventData {
  paymentId: string;
  appointmentId: string;
  patientId: string;
  paymentStatus: 'COMPLETED' | 'FAILED' | 'PENDING' | 'REFUNDED';
  amount: number;
  paymentMethod: string;
  completedAt: Date;
  transactionId?: string;
}

/**
 * Billing Event Handler
 * Subscribes to billing.payment.processed and confirms appointments
 */
export class BillingEventHandler {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  /**
   * Handle payment processed event from Billing Service
   * Updates appointment status to CONFIRMED when payment succeeds
   * 
   * ⚠️ IDEMPOTENT: Safe to call multiple times for same payment
   */
  async handlePaymentProcessed(data: PaymentProcessedEventData): Promise<void> {
    const { appointmentId, paymentId, paymentStatus, completedAt } = data;

    logger.info('[BillingEventHandler] Payment processed event received', {
      appointmentId,
      paymentId,
      paymentStatus,
      completedAt
    });

    // ===== GUARD 1: Only process completed payments =====
    if (paymentStatus !== 'COMPLETED') {
      logger.info('[BillingEventHandler] Ignoring non-completed payment', {
        appointmentId,
        paymentStatus
      });
      return;
    }

    // ===== GUARD 2: Load appointment =====
    const appointment = await this.appointmentRepository.findById(appointmentId);

    if (!appointment) {
      logger.error('[BillingEventHandler] Appointment not found', {
        appointmentId,
        paymentId
      });
      throw new Error(`Appointment ${appointmentId} not found for payment ${paymentId}`);
    }

    // ===== GUARD 3: Idempotency check =====
    // Phòng trường hợp Billing publish lại event (at-least-once delivery)
    if (appointment.status === AppointmentStatus.CONFIRMED) {
      logger.warn('[BillingEventHandler] Appointment already confirmed - idempotent skip', {
        appointmentId,
        paymentId,
        currentStatus: appointment.status,
        confirmedAt: appointment.confirmedAt
      });
      return; // ✅ Safe exit - event đã xử lý rồi
    }

    // ===== GUARD 4: Status validation =====
    if (appointment.status !== AppointmentStatus.PENDING_PAYMENT) {
      logger.warn('[BillingEventHandler] Appointment not in PENDING_PAYMENT status', {
        appointmentId,
        currentStatus: appointment.status,
        expectedStatus: AppointmentStatus.PENDING_PAYMENT
      });
      // Không throw error - có thể do race condition hoặc manual update
      return;
    }

    // ===== DOMAIN LOGIC: Confirm appointment =====
    try {
      appointment.confirm('system', `Payment ${paymentId} completed successfully`);

      // Save aggregate (will collect & publish domain events)
      await this.appointmentRepository.save(appointment);
      // ↑ Repository sẽ emit AppointmentConfirmedEvent

      logger.info('[BillingEventHandler] Appointment confirmed successfully', {
        appointmentId,
        paymentId,
        previousStatus: AppointmentStatus.PENDING_PAYMENT,
        newStatus: AppointmentStatus.CONFIRMED,
        confirmedAt: appointment.confirmedAt
      });
    } catch (error) {
      logger.error('[BillingEventHandler] Failed to confirm appointment', error as Error, {
        appointmentId,
        paymentId
      });
      throw error; // Rethrow để retry mechanism xử lý
    }
  }
}
```

### 1.2. Update EventBusIntegration

**File**: `appointments-service/src/infrastructure/events/EventBusIntegration.ts`

```typescript
// Add billing event routing key
const ROUTING_KEYS = {
  // ... existing keys
  
  // ===== NEW: Billing events =====
  BILLING_PAYMENT_PROCESSED: 'billing.payment.processed',
};

// Register billing event handler
await channel.assertQueue('appointments.billing.payment', { durable: true });
await channel.bindQueue(
  'appointments.billing.payment',
  'hospital.events',
  ROUTING_KEYS.BILLING_PAYMENT_PROCESSED
);

await channel.consume('appointments.billing.payment', async (msg) => {
  if (!msg) return;
  
  try {
    const event = JSON.parse(msg.content.toString());
    
    if (event.type === 'billing.payment.processed') {
      await billingEventHandler.handlePaymentProcessed(event.payload);
    }
    
    channel.ack(msg);
  } catch (error) {
    logger.error('[EventBus] Error processing billing event', error);
    channel.nack(msg, false, true); // Requeue for retry
  }
});
```

---

## 🎯 PHASE 2: APPOINTMENTS SERVICE - Update Appointment Aggregate

**Effort**: 2h | **Priority**: 🔴 HIGH

### 2.1. Update Appointment.confirm() - Pure DDD

**File**: `appointments-service/src/domain/aggregates/Appointment.ts`

```typescript
/**
 * Confirm appointment (called after payment completed)
 * 
 * ✅ PURE DOMAIN LOGIC - No infrastructure dependencies
 * ✅ Logging moved to application/infrastructure layer
 * 
 * @throws DomainException if appointment cannot be confirmed
 */
confirm(confirmedBy: string, notes?: string): void {
  // ===== GUARD: Validate current status =====
  if (this.status !== AppointmentStatus.PENDING_PAYMENT) {
    throw new DomainException(
      'INVALID_STATUS_TRANSITION',
      `Cannot confirm appointment in ${this.status} status. Expected: PENDING_PAYMENT`,
      {
        appointmentId: this.appointmentId.value,
        currentStatus: this.status,
        requiredStatus: AppointmentStatus.PENDING_PAYMENT
      }
    );
  }

  // ===== GUARD: Validate confirmedBy =====
  if (!confirmedBy || confirmedBy.trim() === '') {
    throw new DomainException(
      'INVALID_CONFIRMED_BY',
      'confirmedBy is required',
      { appointmentId: this.appointmentId.value }
    );
  }

  // ===== GUARD: Check payment deadline not expired =====
  if (this.paymentDeadline && new Date() > this.paymentDeadline) {
    throw new DomainException(
      'PAYMENT_DEADLINE_EXPIRED',
      'Cannot confirm appointment - payment deadline has passed',
      {
        appointmentId: this.appointmentId.value,
        paymentDeadline: this.paymentDeadline,
        currentTime: new Date()
      }
    );
  }

  // ===== STATE MUTATION =====
  const previousStatus = this.status;
  
  this.status = AppointmentStatus.CONFIRMED;
  this.confirmedBy = confirmedBy;
  this.confirmedAt = new Date();
  this.updatedAt = new Date();
  this.notes = notes || this.notes;

  // ===== DOMAIN EVENT =====
  this.addDomainEvent(new AppointmentConfirmedEvent({
    appointmentId: this.appointmentId.value,
    patientId: this.patientId,
    patientName: this.patientName,
    doctorId: this.doctorId,
    doctorName: this.doctorName,
    departmentId: this.departmentId,
    departmentName: this.departmentName,
    appointmentDate: this.appointmentDate,
    appointmentTime: this.appointmentTime,
    durationMinutes: this.durationMinutes,
    consultationFee: this.consultationFee,
    confirmedBy,
    confirmedAt: this.confirmedAt,
    previousStatus,
    notes
  }));

  // ✅ NO LOGGING HERE - Pure domain logic only
  // Logging sẽ được thực hiện ở application/infrastructure layer
}
```

### 2.2. Create AppointmentConfirmedEvent

**File**: `appointments-service/src/domain/events/AppointmentConfirmedEvent.ts`

```typescript
import { DomainEvent } from '@shared/domain/DomainEvent';

export interface AppointmentConfirmedEventData {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  consultationFee: number;
  confirmedBy: string;
  confirmedAt: Date;
  previousStatus: string;
  notes?: string;
}

export class AppointmentConfirmedEvent extends DomainEvent<AppointmentConfirmedEventData> {
  constructor(data: AppointmentConfirmedEventData) {
    super('appointment.confirmed', data);
  }
}
```

### 2.3. Add Logging in Repository (Infrastructure Layer)

**File**: `appointments-service/src/infrastructure/persistence/SupabaseAppointmentRepository.ts`

```typescript
async save(appointment: Appointment): Promise<void> {
  // ... existing save logic
  
  // ===== LOGGING (Infrastructure concern) =====
  logger.info('[AppointmentRepository] Appointment saved', {
    appointmentId: appointment.appointmentId.value,
    status: appointment.status,
    confirmedAt: appointment.confirmedAt,
    domainEvents: appointment.domainEvents.length
  });
  
  // ===== Publish domain events =====
  for (const event of appointment.domainEvents) {
    await this.eventBus.publish(event);
    
    // Log each event
    logger.info('[AppointmentRepository] Domain event published', {
      eventType: event.eventType,
      appointmentId: appointment.appointmentId.value
    });
  }
  
  appointment.clearDomainEvents();
}
```

---

## 🎯 PHASE 3: NOTIFICATIONS SERVICE - Cleanup Consumers

**Effort**: 2h | **Priority**: 🟡 MEDIUM

### 3.1. Delete Clinical EMR Consumer

```bash
cd backend/services-v2/notifications-service

# Delete files
rm src/infrastructure/events/ClinicalEMREventConsumer.ts
rm tests/unit/infrastructure/events/ClinicalEMREventConsumer.test.ts

# Remove from DI container
# Edit: src/infrastructure/di/NotificationContainer.ts
# Remove ClinicalEMREventConsumer registration
```

### 3.2. Delete Staff Consumer

```bash
# Delete files
rm src/infrastructure/events/StaffEventConsumer.ts
rm tests/unit/infrastructure/events/StaffEventConsumer.test.ts

# Remove from DI container
```

### 3.3. Update main.ts - Remove Consumer Initialization

**File**: `notifications-service/src/main.ts`

```typescript
// ❌ DELETE these lines
// const clinicalConsumer = container.getClinicalEventConsumer();
// await clinicalConsumer.connect();

// const staffConsumer = container.getStaffEventConsumer();
// await staffConsumer.connect();

// ✅ KEEP only
const appointmentConsumer = container.getAppointmentEventConsumer();
await appointmentConsumer.connect();

const billingConsumer = container.getBillingEventConsumer();
await billingConsumer.connect();
```

---

## 🎯 PHASE 4: NOTIFICATIONS SERVICE - Update AppointmentEventConsumer

**Effort**: 3h | **Priority**: 🔴 HIGH

### 4.1. Update AppointmentEventConsumer

**File**: `notifications-service/src/infrastructure/events/AppointmentEventConsumer.ts`

```typescript
/**
 * Appointment Event Consumer - Refactored for MVP
 * Handles: scheduled, confirmed, cancelled
 * 
 * ✅ IMPORTANT: Reminders only created after appointment.confirmed
 */

private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
  if (!msg) return;

  try {
    const event = JSON.parse(msg.content.toString());
    
    // Idempotency check via Inbox
    const isDuplicate = await this.inboxRepo.isDuplicate(
      event.idempotencyKey || `${event.type}-${event.payload.appointmentId}-${Date.now()}`
    );
    
    if (isDuplicate) {
      logger.info('[AppointmentEventConsumer] Duplicate event - skipping', {
        eventType: event.type,
        appointmentId: event.payload.appointmentId
      });
      this.channel.ack(msg);
      return;
    }

    // Route to handlers
    switch (event.type) {
      case 'appointment.scheduled':
        await this.handleAppointmentScheduled(event.payload);
        break;

      case 'appointment.confirmed': // ✅ NEW
        await this.handleAppointmentConfirmed(event.payload);
        break;

      case 'appointment.cancelled':
        await this.handleAppointmentCancelled(event.payload);
        break;

      // ===== FUTURE WORK =====
      // case 'appointment.rescheduled':
      //   await this.handleAppointmentRescheduled(event.payload);
      //   break;
      // case 'appointment.completed':
      //   await this.handleAppointmentCompleted(event.payload);
      //   break;
      // case 'appointment.no_show':
      //   await this.handleAppointmentNoShow(event.payload);
      //   break;

      default:
        logger.warn('[AppointmentEventConsumer] Unknown event type', {
          eventType: event.type
        });
    }

    this.channel.ack(msg);
  } catch (error) {
    logger.error('[AppointmentEventConsumer] Error processing message', error as Error);
    this.channel.nack(msg, false, true); // Requeue
  }
}

/**
 * Handle appointment scheduled
 * 
 * ✅ UX CLARITY: Nội dung rõ "đã nhận yêu cầu, chưa xác nhận"
 * ❌ DO NOT create reminders yet (waiting for payment)
 */
private async handleAppointmentScheduled(data: AppointmentScheduledEventData): Promise<void> {
  logger.info('[AppointmentEventConsumer] Handling appointment scheduled', {
    appointmentId: data.appointmentId,
    status: data.status
  });

  // ===== Send initial booking notification to patient =====
  await this.sendNotificationUseCase.execute({
    recipientId: data.patientId,
    recipientType: 'PATIENT',
    recipientName: data.patientName,
    recipientEmail: data.patientEmail,
    recipientPhone: data.patientPhone,
    templateType: 'APPOINTMENT_SCHEDULED', // ⚠️ NEW template
    channels: ['EMAIL'],
    priority: 'NORMAL',
    data: {
      patientName: data.patientName,
      appointmentId: data.appointmentId,
      doctorName: data.doctorName,
      departmentName: data.departmentName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      consultationFee: data.consultationFee,
      // ⚠️ CRITICAL UX MESSAGE
      paymentRequired: true,
      paymentDeadline: data.paymentDeadline, // e.g., "30 phút"
      statusMessage: 'Yêu cầu đặt lịch đã được nhận. Vui lòng thanh toán để xác nhận lịch hẹn.'
    }
  });

  // ❌ DO NOT create reminders here!
  // Reminders only created after payment confirmed (appointment.confirmed event)

  logger.info('[AppointmentEventConsumer] Appointment scheduled notification sent (payment pending)', {
    appointmentId: data.appointmentId,
    status: data.status
  });
}

/**
 * Handle appointment confirmed (after payment completed)
 * 
 * ✅ Send confirmation notification
 * ✅ Create appointment reminders (24H, 2H, 30M)
 * ✅ Notify both patient AND doctor
 */
private async handleAppointmentConfirmed(data: AppointmentConfirmedEventData): Promise<void> {
  logger.info('[AppointmentEventConsumer] Handling appointment confirmed', {
    appointmentId: data.appointmentId,
    confirmedAt: data.confirmedAt
  });

  // ===== 1. Send confirmation to PATIENT =====
  await this.sendNotificationUseCase.execute({
    recipientId: data.patientId,
    recipientType: 'PATIENT',
    recipientName: data.patientName,
    templateType: 'APPOINTMENT_CONFIRMED', // ⚠️ NEW template
    channels: ['EMAIL', 'SMS'],
    priority: 'HIGH',
    data: {
      patientName: data.patientName,
      appointmentId: data.appointmentId,
      doctorName: data.doctorName,
      departmentName: data.departmentName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      durationMinutes: data.durationMinutes,
      consultationFee: data.consultationFee,
      confirmedAt: data.confirmedAt,
      statusMessage: 'Lịch hẹn của bạn đã được xác nhận. Vui lòng đến đúng giờ.'
    }
  });

  // ===== 2. Send notification to DOCTOR =====
  await this.sendNotificationUseCase.execute({
    recipientId: data.doctorId,
    recipientType: 'DOCTOR',
    recipientName: data.doctorName,
    templateType: 'APPOINTMENT_CONFIRMED',
    channels: ['EMAIL', 'IN_APP'],
    priority: 'NORMAL',
    data: {
      doctorName: data.doctorName,
      patientName: data.patientName,
      appointmentId: data.appointmentId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      durationMinutes: data.durationMinutes
    }
  });

  // ===== 3. Create appointment reminders =====
  try {
    await this.createAppointmentRemindersUseCase.execute({
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      patientName: data.patientName,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      departmentName: data.departmentName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      reminderTypes: ['24_HOURS', '2_HOURS', '30_MINUTES']
    });

    logger.info('[AppointmentEventConsumer] Reminders created successfully', {
      appointmentId: data.appointmentId,
      reminderTypes: ['24H', '2H', '30M']
    });
  } catch (error) {
    logger.error('[AppointmentEventConsumer] Failed to create reminders', error as Error, {
      appointmentId: data.appointmentId
    });
    // Don't throw - confirmation email already sent
  }

  logger.info('[AppointmentEventConsumer] Appointment confirmed flow completed', {
    appointmentId: data.appointmentId
  });
}

/**
 * Handle appointment cancelled
 * Send cancellation notification to patient & doctor
 */
private async handleAppointmentCancelled(data: AppointmentCancelledEventData): Promise<void> {
  logger.info('[AppointmentEventConsumer] Handling appointment cancelled', {
    appointmentId: data.appointmentId,
    cancellationReason: data.cancellationReason
  });

  // Send to patient
  await this.sendNotificationUseCase.execute({
    recipientId: data.patientId,
    recipientType: 'PATIENT',
    templateType: 'APPOINTMENT_CANCELLED', // ⚠️ NEW template
    channels: ['EMAIL', 'SMS'],
    priority: 'HIGH',
    data: {
      patientName: data.patientName,
      appointmentId: data.appointmentId,
      doctorName: data.doctorName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      cancellationReason: data.cancellationReason,
      cancelledBy: data.cancelledBy,
      cancelledAt: data.cancelledAt,
      refundAmount: data.refundAmount,
      statusMessage: data.cancellationReason.includes('Payment timeout')
        ? 'Lịch hẹn đã bị hủy do không thanh toán đúng hạn.'
        : 'Lịch hẹn của bạn đã bị hủy.'
    }
  });

  // Send to doctor
  await this.sendNotificationUseCase.execute({
    recipientId: data.doctorId,
    recipientType: 'DOCTOR',
    templateType: 'APPOINTMENT_CANCELLED',
    channels: ['EMAIL', 'IN_APP'],
    priority: 'NORMAL',
    data: {
      doctorName: data.doctorName,
      patientName: data.patientName,
      appointmentId: data.appointmentId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      cancellationReason: data.cancellationReason
    }
  });

  // Cancel existing reminders
  try {
    await this.appointmentReminderRepo.cancelRemindersByAppointmentId(data.appointmentId);
    logger.info('[AppointmentEventConsumer] Reminders cancelled', {
      appointmentId: data.appointmentId
    });
  } catch (error) {
    logger.error('[AppointmentEventConsumer] Failed to cancel reminders', error as Error);
  }

  logger.info('[AppointmentEventConsumer] Appointment cancelled notifications sent', {
    appointmentId: data.appointmentId
  });
}
```

---

## 🎯 PHASE 5: NOTIFICATIONS SERVICE - Cleanup BillingEventConsumer

**Effort**: 2h | **Priority**: 🟡 MEDIUM

### 5.1. Remove Insurance Handlers

**File**: `notifications-service/src/infrastructure/events/BillingEventConsumer.ts`

```typescript
// ❌ DELETE these handlers (out of scope)
// - handleInsuranceCoverageVerified
// - handlePreAuthorizationRequested
// - handlePreAuthorizationApproved
// - handlePreAuthorizationDenied
// - handleRateUpdated
// - handleRefundProcessed

// ✅ KEEP these handlers (in scope)
// - handleInvoiceGenerated
// - handlePaymentProcessed (map to PAYMENT_COMPLETED template)

private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
  // ...
  switch (event.type) {
    case 'billing.invoice.generated':
      await this.handleInvoiceGenerated(event.payload);
      break;

    case 'billing.payment.processed':
      await this.handlePaymentProcessed(event.payload);
      break;

    // ===== FUTURE WORK =====
    // case 'billing.payment.link.created':
    //   await this.handlePaymentLinkCreated(event.payload);
    //   break;
    // case 'billing.payment.link.expired':
    //   await this.handlePaymentExpired(event.payload);
    //   break;

    default:
      logger.warn('[BillingEventConsumer] Unknown event type', { eventType: event.type });
  }
}

/**
 * Handle payment processed
 * Send payment receipt when status = COMPLETED
 */
private async handlePaymentProcessed(data: PaymentProcessedEventData): Promise<void> {
  logger.info('[BillingEventConsumer] Handling payment processed', {
    paymentId: data.paymentId,
    paymentStatus: data.paymentStatus
  });

  // Only send receipt for completed payments
  if (data.paymentStatus !== 'COMPLETED') {
    logger.info('[BillingEventConsumer] Ignoring non-completed payment');
    return;
  }

  // Send payment receipt
  await this.sendNotificationUseCase.execute({
    recipientId: data.patientId,
    recipientType: 'PATIENT',
    templateType: 'PAYMENT_COMPLETED', // ⚠️ NEW template
    channels: ['EMAIL'],
    priority: 'NORMAL',
    data: {
      patientName: data.patientName,
      paymentId: data.paymentId,
      appointmentId: data.appointmentId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      completedAt: data.completedAt,
      receiptUrl: data.receiptUrl,
      statusMessage: 'Thanh toán thành công. Lịch hẹn của bạn đã được xác nhận.'
    }
  });

  logger.info('[BillingEventConsumer] Payment receipt sent', {
    paymentId: data.paymentId
  });
}
```

---

## 🎯 PHASE 6: DATABASE - Migration 014 (Templates)

**Effort**: 2h | **Priority**: 🔴 HIGH

### 6.1. Create Migration 014

**File**: `notifications-service/migrations/014_refactor_templates_for_mvp.sql`

```sql
/**
 * Migration: Refactor Templates for MVP Scope
 * Description: 
 *   1. Deactivate clinical template (TEST_RESULTS_READY)
 *   2. Add 3 new templates for payment flow
 * 
 * Author: Hospital Management Team
 * Date: 2025-11-16
 */

-- ============================================================
-- PART 1: Deactivate Out-of-Scope Templates (Soft Delete)
-- ============================================================

-- Deactivate clinical template
UPDATE notifications_schema.notification_templates
SET 
  is_active = false,
  deleted_at = NOW(),
  deleted_by = 'system-refactor',
  updated_at = NOW()
WHERE template_type = 'TEST_RESULTS_READY'
  AND is_deleted = false;

-- Log deactivation
DO $$
BEGIN
  RAISE NOTICE 'Deactivated template: TEST_RESULTS_READY';
END $$;

-- ============================================================
-- PART 2: Add New Templates for MVP
-- ============================================================

-- Template 1: APPOINTMENT_SCHEDULED (yêu cầu đã nhận, chờ thanh toán)
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
  sms_template,
  supported_channels,
  placeholders,
  required_placeholders,
  priority,
  category,
  is_active,
  is_approved,
  approved_by,
  approved_at,
  is_vietnamese_healthcare_compliant,
  hipaa_compliant,
  moh_compliant,
  version,
  tags,
  created_by
) VALUES (
  'appointment-scheduled-vi',
  'APPOINTMENT_SCHEDULED',
  'Yêu Cầu Đặt Lịch Hẹn Đã Nhận',
  'Template thông báo đã nhận yêu cầu đặt lịch, chờ thanh toán để xác nhận',
  'vi',
  'Yêu Cầu Đặt Lịch Hẹn #{{appointmentId}}',
  E'Kính gửi {{patientName}},\n\nChúng tôi đã nhận được yêu cầu đặt lịch hẹn của bạn:\n\n📋 THÔNG TIN LỊCH HẸN:\n- Mã lịch hẹn: {{appointmentId}}\n- Bác sĩ: {{doctorName}}\n- Khoa: {{departmentName}}\n- Ngày khám: {{appointmentDate}}\n- Giờ khám: {{appointmentTime}}\n- Phí khám: {{consultationFee}} VND\n\n⚠️ QUAN TRỌNG:\nLịch hẹn chỉ được XÁC NHẬN sau khi bạn thanh toán thành công.\nVui lòng hoàn tất thanh toán trong vòng {{paymentDeadline}} phút.\n\nNếu không thanh toán đúng hạn, lịch hẹn sẽ tự động bị hủy.\n\nTrân trọng,\nBệnh Viện',
  E'<html><!-- HTML template --></html>',
  E'Yeu cau dat lich #{{appointmentId}} da nhan. Vui long thanh toan trong {{paymentDeadline}} phut de xac nhan.',
  ARRAY['EMAIL', 'SMS'],
  jsonb_build_array(
    jsonb_build_object('key', 'patientName', 'description', 'Tên bệnh nhân', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'appointmentId', 'description', 'Mã lịch hẹn', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'doctorName', 'description', 'Tên bác sĩ', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'paymentDeadline', 'description', 'Hạn thanh toán (phút)', 'required', true, 'type', 'string')
  ),
  ARRAY['patientName', 'appointmentId', 'doctorName', 'paymentDeadline'],
  'NORMAL',
  'appointment',
  true,
  true,
  'system-refactor',
  NOW(),
  true,
  true,
  false,
  '1.0.0',
  ARRAY['appointment', 'payment', 'pending', 'vietnamese'],
  'system-refactor'
);

-- Template 2: APPOINTMENT_CONFIRMED (lịch đã xác nhận sau thanh toán)
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
  sms_template,
  supported_channels,
  placeholders,
  required_placeholders,
  priority,
  category,
  is_active,
  is_approved,
  approved_by,
  approved_at,
  is_vietnamese_healthcare_compliant,
  hipaa_compliant,
  moh_compliant,
  version,
  tags,
  created_by
) VALUES (
  'appointment-confirmed-vi',
  'APPOINTMENT_CONFIRMED',
  'Xác Nhận Lịch Hẹn Thành Công',
  'Template xác nhận lịch hẹn sau khi thanh toán thành công',
  'vi',
  '✅ Lịch Hẹn #{{appointmentId}} Đã Được Xác Nhận',
  E'Kính gửi {{patientName}},\n\n✅ Lịch hẹn của bạn đã được XÁC NHẬN thành công!\n\n📋 THÔNG TIN LỊCH HẸN:\n- Mã lịch hẹn: {{appointmentId}}\n- Bác sĩ: {{doctorName}}\n- Khoa: {{departmentName}}\n- Ngày khám: {{appointmentDate}}\n- Giờ khám: {{appointmentTime}}\n- Thời gian khám: {{durationMinutes}} phút\n- Phí khám: {{consultationFee}} VND (đã thanh toán)\n\n📌 LƯU Ý:\n- Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục\n- Mang theo CMND/CCCD và thẻ BHYT (nếu có)\n- Bạn sẽ nhận được email nhắc nhở trước giờ khám\n\nChúc bạn sức khỏe!\nBệnh Viện',
  E'<html><!-- HTML template --></html>',
  E'Lich hen #{{appointmentId}} da XAC NHAN. Ngay: {{appointmentDate}}, Gio: {{appointmentTime}}, BS: {{doctorName}}',
  ARRAY['EMAIL', 'SMS', 'IN_APP'],
  jsonb_build_array(
    jsonb_build_object('key', 'patientName', 'description', 'Tên bệnh nhân', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'appointmentId', 'description', 'Mã lịch hẹn', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'doctorName', 'description', 'Tên bác sĩ', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'appointmentDate', 'description', 'Ngày hẹn', 'required', true, 'type', 'date'),
    jsonb_build_object('key', 'appointmentTime', 'description', 'Giờ hẹn', 'required', true, 'type', 'string')
  ),
  ARRAY['patientName', 'appointmentId', 'doctorName', 'appointmentDate', 'appointmentTime'],
  'HIGH',
  'appointment',
  true,
  true,
  'system-refactor',
  NOW(),
  true,
  true,
  false,
  '1.0.0',
  ARRAY['appointment', 'confirmation', 'payment', 'vietnamese'],
  'system-refactor'
);

-- Template 3: APPOINTMENT_CANCELLED
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
  sms_template,
  supported_channels,
  placeholders,
  required_placeholders,
  priority,
  category,
  is_active,
  is_approved,
  approved_by,
  approved_at,
  is_vietnamese_healthcare_compliant,
  hipaa_compliant,
  moh_compliant,
  version,
  tags,
  created_by
) VALUES (
  'appointment-cancelled-vi',
  'APPOINTMENT_CANCELLED',
  'Thông Báo Hủy Lịch Hẹn',
  'Template thông báo lịch hẹn bị hủy (do payment timeout hoặc user cancel)',
  'vi',
  '❌ Lịch Hẹn #{{appointmentId}} Đã Bị Hủy',
  E'Kính gửi {{patientName}},\n\n❌ Lịch hẹn của bạn đã bị HỦY.\n\n📋 THÔNG TIN LỊCH HẸN:\n- Mã lịch hẹn: {{appointmentId}}\n- Bác sĩ: {{doctorName}}\n- Ngày khám: {{appointmentDate}}\n- Giờ khám: {{appointmentTime}}\n\n🔍 LÝ DO HỦY:\n{{cancellationReason}}\n\n💰 HOÀN TIỀN:\n{{#if refundAmount}}Số tiền hoàn lại: {{refundAmount}} VND{{/if}}\n{{^refundAmount}}Không có phí hoàn trả{{/if}}\n\nNếu bạn muốn đặt lịch mới, vui lòng truy cập hệ thống.\n\nTrân trọng,\nBệnh Viện',
  E'<html><!-- HTML template --></html>',
  E'Lich hen #{{appointmentId}} da bi HUY. Ly do: {{cancellationReason}}',
  ARRAY['EMAIL', 'SMS'],
  jsonb_build_array(
    jsonb_build_object('key', 'patientName', 'description', 'Tên bệnh nhân', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'appointmentId', 'description', 'Mã lịch hẹn', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'cancellationReason', 'description', 'Lý do hủy', 'required', true, 'type', 'string')
  ),
  ARRAY['patientName', 'appointmentId', 'cancellationReason'],
  'HIGH',
  'appointment',
  true,
  true,
  'system-refactor',
  NOW(),
  true,
  true,
  false,
  '1.0.0',
  ARRAY['appointment', 'cancellation', 'vietnamese'],
  'system-refactor'
);

-- Template 4: PAYMENT_COMPLETED
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
  sms_template,
  supported_channels,
  placeholders,
  required_placeholders,
  priority,
  category,
  is_active,
  is_approved,
  approved_by,
  approved_at,
  is_vietnamese_healthcare_compliant,
  hipaa_compliant,
  moh_compliant,
  version,
  tags,
  created_by
) VALUES (
  'payment-completed-vi',
  'PAYMENT_COMPLETED',
  'Xác Nhận Thanh Toán Thành Công',
  'Template biên lai thanh toán sau khi payment completed',
  'vi',
  '✅ Thanh Toán Thành Công - Mã Giao Dịch #{{paymentId}}',
  E'Kính gửi {{patientName}},\n\n✅ Thanh toán của bạn đã được xử lý THÀNH CÔNG!\n\n💰 THÔNG TIN THANH TOÁN:\n- Mã giao dịch: {{paymentId}}\n- Mã lịch hẹn: {{appointmentId}}\n- Số tiền: {{amount}} VND\n- Phương thức: {{paymentMethod}}\n- Thời gian: {{completedAt}}\n- Mã tham chiếu: {{transactionId}}\n\n📄 BIÊN LAI:\nTải biên lai tại: {{receiptUrl}}\n\n✅ LỊCH HẸN CỦA BẠN ĐÃ ĐƯỢC XÁC NHẬN!\nBạn sẽ nhận email xác nhận lịch hẹn riêng.\n\nCảm ơn bạn đã sử dụng dịch vụ!\nBệnh Viện',
  E'<html><!-- HTML template --></html>',
  E'Thanh toan {{amount}} VND thanh cong. Ma GD: {{paymentId}}',
  ARRAY['EMAIL'],
  jsonb_build_array(
    jsonb_build_object('key', 'patientName', 'description', 'Tên bệnh nhân', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'paymentId', 'description', 'Mã thanh toán', 'required', true, 'type', 'string'),
    jsonb_build_object('key', 'amount', 'description', 'Số tiền', 'required', true, 'type', 'number')
  ),
  ARRAY['patientName', 'paymentId', 'amount'],
  'NORMAL',
  'billing',
  true,
  true,
  'system-refactor',
  NOW(),
  true,
  true,
  false,
  '1.0.0',
  ARRAY['payment', 'receipt', 'billing', 'vietnamese'],
  'system-refactor'
);

-- ============================================================
-- PART 3: Verification
-- ============================================================

-- Count templates by status
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as active_templates,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_templates,
  COUNT(*) FILTER (WHERE is_deleted = true) as deleted_templates,
  COUNT(*) as total_templates
FROM notifications_schema.notification_templates;

-- Show refactored templates
SELECT 
  template_type,
  name,
  is_active,
  category,
  created_at
FROM notifications_schema.notification_templates
WHERE template_type IN (
  'APPOINTMENT_SCHEDULED',
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_CANCELLED',
  'PAYMENT_COMPLETED',
  'TEST_RESULTS_READY'
)
ORDER BY template_type;

-- ============================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================

-- To rollback this migration:
-- UPDATE notifications_schema.notification_templates
-- SET is_active = true, deleted_at = NULL, deleted_by = NULL
-- WHERE template_type = 'TEST_RESULTS_READY';
-- 
-- DELETE FROM notifications_schema.notification_templates
-- WHERE template_type IN ('APPOINTMENT_SCHEDULED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'PAYMENT_COMPLETED')
--   AND created_by = 'system-refactor';
```

---

## 🎯 PHASE 7: RABBITMQ ROUTING KEYS

**Effort**: 1h | **Priority**: 🟡 MEDIUM

### 7.1. Update Routing Keys

**File**: `notifications-service/src/infrastructure/events/EventBusIntegration.ts`

```typescript
// ===== REMOVE these routing keys =====
// ❌ 'clinical.*.created'
// ❌ 'clinical.*.updated'
// ❌ 'staff.*.assigned'
// ❌ 'staff.*.changed'
// ❌ 'billing.insurance.*'
// ❌ 'billing.preauth.*'
// ❌ 'billing.rate.updated'
// ❌ 'billing.refund.*'

// ===== KEEP these routing keys =====
const ROUTING_KEYS = {
  // Appointments
  APPOINTMENT_SCHEDULED: 'appointments.appointment.scheduled',
  APPOINTMENT_CONFIRMED: 'appointments.appointment.confirmed', // ✅ NEW
  APPOINTMENT_CANCELLED: 'appointments.appointment.cancelled',
  
  // Billing
  BILLING_INVOICE_GENERATED: 'billing.invoice.generated',
  BILLING_PAYMENT_PROCESSED: 'billing.payment.processed',
  
  // FUTURE WORK
  // BILLING_PAYMENT_LINK_CREATED: 'billing.payment.link.created',
  // BILLING_PAYMENT_LINK_EXPIRED: 'billing.payment.link.expired',
  // APPOINTMENT_RESCHEDULED: 'appointments.appointment.rescheduled',
};
```

---

## 🎯 PHASE 8: TESTS

**Effort**: 4h | **Priority**: 🟡 MEDIUM

### 8.1. Unit Tests

```bash
# Appointments Service
cd backend/services-v2/appointments-service
npm run test -- BillingEventHandler.test.ts
npm run test -- Appointment.confirm.test.ts

# Notifications Service
cd backend/services-v2/notifications-service
npm run test -- AppointmentEventConsumer.test.ts
```

### 8.2. Integration Tests

**Test Scenarios:**
1. ✅ **Happy Path**: Schedule → Pay → Confirm → Reminders created
2. ✅ **Payment Timeout**: Schedule → No payment → Auto cancel → Cancellation email
3. ✅ **Idempotency**: Duplicate `billing.payment.processed` → Only confirm once
4. ✅ **Doctor Notification**: Confirmed appointment → Doctor receives email

---

## 🎯 PHASE 9: DOCUMENTATION

**Effort**: 1h | **Priority**: 🟢 LOW

### 9.1. Update README

**File**: `notifications-service/README.md`

```markdown
## Event Subscriptions (MVP Scope)

### Appointment Events
- `appointments.appointment.scheduled` → Send "yêu cầu đã nhận, chờ thanh toán"
- `appointments.appointment.confirmed` → Send confirmation + create reminders
- `appointments.appointment.cancelled` → Send cancellation notice

### Billing Events
- `billing.invoice.generated` → Send invoice
- `billing.payment.processed` → Send payment receipt

### Templates
- `APPOINTMENT_SCHEDULED` - Yêu cầu đã nhận (payment pending)
- `APPOINTMENT_CONFIRMED` - Xác nhận lịch hẹn (after payment)
- `APPOINTMENT_CANCELLED` - Thông báo hủy lịch
- `PAYMENT_COMPLETED` - Biên lai thanh toán
```

---

## ✅ VERIFICATION CHECKLIST

### Pre-Deployment
- [ ] All tests passing (unit + integration)
- [ ] Migration 014 applied successfully
- [ ] Templates verified in database
- [ ] RabbitMQ queues created and bound correctly
- [ ] Billing Service emits `billing.payment.processed`
- [ ] Appointments Service has `BillingEventHandler` registered

### Post-Deployment
- [ ] Monitor logs for event processing
- [ ] Verify no errors in RabbitMQ dead letter queue
- [ ] Test end-to-end flow: Schedule → Pay → Confirm → Reminders
- [ ] Check email delivery (SendGrid logs)
- [ ] Verify database: appointment_reminders table has data

---

## 📊 EFFORT SUMMARY

| Phase | Description | Hours | Priority |
|-------|-------------|-------|----------|
| 0 | Pre-refactor verification | 2h | 🔴 HIGH |
| 1 | Appointments - BillingEventHandler | 4h | 🔴 HIGH |
| 2 | Appointments - Aggregate confirm() | 2h | 🔴 HIGH |
| 3 | Notifications - Delete consumers | 2h | 🟡 MEDIUM |
| 4 | Notifications - Update AppointmentConsumer | 3h | 🔴 HIGH |
| 5 | Notifications - Cleanup BillingConsumer | 2h | 🟡 MEDIUM |
| 6 | Database - Migration 014 | 2h | 🔴 HIGH |
| 7 | RabbitMQ routing keys | 1h | 🟡 MEDIUM |
| 8 | Tests | 4h | 🟡 MEDIUM |
| 9 | Documentation | 1h | 🟢 LOW |
| **TOTAL** | | **23h** | **~3 ngày** |

---

## 🎯 SUCCESS CRITERIA

✅ **Functional:**
- User books appointment → receives "yêu cầu đã nhận" email
- User pays → receives payment receipt + appointment confirmation
- System creates 3 reminders (24H, 2H, 30M) after payment
- Payment timeout → appointment auto-cancelled, user notified
- Doctor receives notification when appointment confirmed

✅ **Technical:**
- No direct service-to-service calls (event-driven only)
- Idempotent event handlers (safe to replay)
- Pure DDD aggregates (no infrastructure in domain)
- Clean architecture maintained
- 90%+ test coverage

✅ **UX:**
- Email nội dung rõ ràng: "chờ thanh toán" vs "đã xác nhận"
- User không bị confused về trạng thái lịch hẹn
- Doctor nhận thông tin đầy đủ về appointment

---

## 🚀 NEXT STEPS (FUTURE WORK)

**Phase 2 (After MVP):**
- [ ] Add `billing.payment.link.created` event + template
- [ ] Add `billing.payment.link.expired` event + template
- [ ] Add `appointment.rescheduled` flow
- [ ] Add `appointment.completed` notification
- [ ] Add `appointment.no_show` notification
- [ ] SMS reminders optimization (cost reduction)
- [ ] In-app notifications (WebSocket/FCM)

---

**Version**: 2.0  
**Last Updated**: 2025-11-16  
**Status**: 🔴 Ready for Implementation
