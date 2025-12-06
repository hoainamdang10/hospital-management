# 📊 PHÂN TÍCH CHI TIẾT CÁC LUỒNG NGHIỆP VỤ PATIENT

> **Tài liệu phân tích dựa trên codebase thực tế**  
> **Cập nhật**: 2025-12-06  
> **Dự án**: Hospital Management System V2 - Đặt lịch khám Online & Thanh toán Prepaid

---

## 📋 MỤC LỤC

1. [Tổng quan kiến trúc Event-Driven](#1-tổng-quan-kiến-trúc-event-driven)
2. [Cơ chế chống trùng lịch (Double Booking Prevention)](#2-cơ-chế-chống-trùng-lịch)
3. [Notification Service](#3-notification-service)
4. [Wallet Service](#4-wallet-service)
5. [Refund Flow](#5-refund-flow)
6. [Chi tiết 6 luồng Patient](#6-chi-tiết-6-luồng-patient)
7. [Event Flow Matrix](#7-event-flow-matrix)
8. [Gaps & Missing Pieces](#8-gaps--missing-pieces)

---

## 1. TỔNG QUAN KIẾN TRÚC EVENT-DRIVEN

### 1.1 Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOSPITAL MANAGEMENT SYSTEM - EVENT ARCHITECTURE          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐             │
│  │   Identity    │     │    Patient    │     │   Provider    │             │
│  │   Service     │     │   Registry    │     │    Staff      │             │
│  │    (3001)     │     │    (3003)     │     │   (3002)      │             │
│  └───────┬───────┘     └───────┬───────┘     └───────┬───────┘             │
│          │                     │                     │                      │
│          │ UserCreated         │ PatientRegistered   │ StaffScheduleUpdated│
│          │ UserActivated       │ PatientUpdated      │ StaffStatusChanged  │
│          ▼                     ▼                     ▼                      │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║                         RABBITMQ MESSAGE BROKER                       ║ │
│  ║              (hospital.events exchange - topic type)                  ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│          │                     │                     │                      │
│          ▼                     ▼                     ▼                      │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐             │
│  │ Appointments  │     │    Billing    │     │ Notifications │             │
│  │   Service     │◄───►│   Service     │◄───►│   Service     │             │
│  │    (3004)     │     │    (3009)     │     │    (3011)     │             │
│  └───────────────┘     └───────────────┘     └───────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Các Services và Ports

| Service | Port | Vai trò | Events Published | Events Consumed |
|---------|------|---------|------------------|-----------------|
| Identity Service | 3001 | Authentication, Authorization | 7 events | 0 |
| Provider Staff | 3002 | Doctor/Staff management | 6 events | 3 |
| Patient Registry | 3003 | Patient profile management | 3 events | 4 |
| Appointments | 3004 | Booking, scheduling | 6 events | 22 |
| Billing | 3009 | Invoice, Payment, Wallet | 2+ events | 2 |
| Notifications | 3011 | Email, SMS, In-app | 1 event | 7 |

---

## 2. CƠ CHẾ CHỐNG TRÙNG LỊCH

### 2.1 Two-Layer Protection

Hệ thống sử dụng **2 lớp bảo vệ** để đảm bảo không có double booking:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOUBLE BOOKING PREVENTION MECHANISM                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   REQUEST: Đặt lịch bác sĩ X, 9:00-9:30                                     │
│                                                                             │
│                    ┌────────────────────────────┐                           │
│                    │    LAYER 1: Application    │                           │
│                    │  ConflictResolutionService │                           │
│                    │     .checkConflicts()      │                           │
│                    └──────────────┬─────────────┘                           │
│                                   │                                         │
│                          ┌────────▼────────┐                                │
│                          │  Has Conflicts? │                                │
│                          └────────┬────────┘                                │
│                       YES │               │ NO                              │
│                           ▼               ▼                                 │
│               ┌───────────────────┐   ┌────────────────────────┐            │
│               │ Return FAIL with  │   │  Try to INSERT into    │            │
│               │ alternative slots │   │  appointments table    │            │
│               └───────────────────┘   └────────────┬───────────┘            │
│                                                    │                        │
│                                   ┌────────────────▼────────────────┐       │
│                                   │      LAYER 2: Database          │       │
│                                   │  PostgreSQL Exclusion Constraint │       │
│                                   │  (exclude_doctor_time_overlap)  │       │
│                                   └────────────────┬────────────────┘       │
│                                                    │                        │
│                                   ┌────────────────▼────────────────┐       │
│                                   │   Constraint Violated (23P01)?  │       │
│                                   └────────────────┬────────────────┘       │
│                                        YES │           │ NO                 │
│                                            ▼           ▼                    │
│                               ┌─────────────────┐  ┌───────────────┐        │
│                               │ Race Condition! │  │ SUCCESS!      │        │
│                               │ Retry conflict  │  │ Appointment   │        │
│                               │ check & return  │  │ created       │        │
│                               │ new suggestions │  └───────────────┘        │
│                               └─────────────────┘                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Code Reference

**Layer 1 - Application Level** (`ScheduleAppointment.use-case.ts`):
```typescript
// Line 194-215
const conflictCheck = await this.conflictResolutionService.checkConflicts({
  doctorId: request.doctorId,
  startTime,
  endTime,
});

if (conflictCheck.hasConflicts) {
  return {
    success: false,
    message: "Không thể đặt lịch: Bác sĩ đã có lịch hẹn vào thời gian này",
    errors: ["DOUBLE_BOOKING_DETECTED"],
    conflictInfo: {
      hasConflicts: true,
      suggestions: conflictCheck.suggestions, // Các slot còn trống
    },
  };
}
```

**Layer 2 - Database Level** (`ScheduleAppointment.use-case.ts`):
```typescript
// Line 220-250
try {
  await this.appointmentRepository.save(appointment);
} catch (saveError: any) {
  // Catch PostgreSQL exclusion constraint violation (23P01)
  if (saveError.code === "23P01" || 
      saveError.message?.includes("exclude_doctor_time_overlap")) {
    // Race condition: Another appointment was created between check and save
    // Retry conflict check to get fresh suggestions
    const retryConflictCheck = await this.conflictResolutionService.checkConflicts({
      doctorId: request.doctorId,
      startTime,
      endTime,
    });

    return {
      success: false,
      message: "Lịch hẹn bị trùng (đã có người khác đặt trước)",
      errors: ["DOUBLE_BOOKING_DETECTED", "CONSTRAINT_VIOLATION"],
      conflictInfo: {
        hasConflicts: true,
        suggestions: retryConflictCheck.suggestions,
      },
    };
  }
  throw saveError;
}
```

### 2.3 Available Slots Calculation

**Formula**: `Available Slots = Work Schedule Template - Booked Appointments`

```typescript
// FindAvailableTimeSlotsUseCase.ts

async execute(command: FindAvailableTimeSlotsCommand): Promise<AvailableTimeSlotDTO[]> {
  // 1. Get work schedule from Provider/Staff Service
  const providerSchedule = await this.httpProviderService.getWorkSchedule(providerId);

  // 2. Check if provider works on this day
  if (!providerSchedule.isWorkingDay(dayOfWeek)) {
    return []; // Provider doesn't work on this day
  }

  // 3. Get booked appointments for the date
  const bookedAppointments = await this.appointmentRepository.findByTimeSlot(
    providerId, startOfDay, endOfDay
  );

  // 4. Generate all possible time slots from work schedule
  const allPossibleSlots = this.generateTimeSlotsFromSchedule(date, schedule, duration);

  // 5. Filter out booked slots
  const availableSlots = this.filterAvailableSlots(allPossibleSlots, bookedAppointments);

  return availableSlots;
}
```

---

## 3. NOTIFICATION SERVICE

### 3.1 Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NOTIFICATION SERVICE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────── EVENT CONSUMERS (RabbitMQ) ───────────────┐               │
│  │                                                          │               │
│  │  ┌─────────────────────┐  ┌─────────────────────┐       │               │
│  │  │ AppointmentEvent    │  │ BillingEvent        │       │               │
│  │  │ Consumer            │  │ Consumer            │       │               │
│  │  │ - scheduled         │  │ - payment.completed │       │               │
│  │  │ - confirmed         │  │ - invoice.generated │       │               │
│  │  │ - cancelled         │  │ - payment.reminder  │       │               │
│  │  │ - rescheduled       │  └─────────────────────┘       │               │
│  │  │ - completed         │                                │               │
│  │  │ - reminder.*        │  ┌─────────────────────┐       │               │
│  │  └─────────────────────┘  │ StaffEvent          │       │               │
│  │                           │ Consumer            │       │               │
│  │                           │ - staff.created     │       │               │
│  │                           │ - staff.updated     │       │               │
│  │                           └─────────────────────┘       │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────── DELIVERY PROVIDERS ───────────────────────┐               │
│  │                                                          │               │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │               │
│  │  │ EmailProvider│  │ SMSProvider  │  │ InAppProvider│   │               │
│  │  │  (SendGrid)  │  │  (Twilio)    │  │  (Supabase)  │   │               │
│  │  │     ✅       │  │     ✅       │  │     ✅       │   │               │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │               │
│  │                                                          │               │
│  │  ┌──────────────┐  ┌──────────────┐                     │               │
│  │  │ PushProvider │  │ VoiceProvider│                     │               │
│  │  │    (FCM)     │  │  (Twilio)    │                     │               │
│  │  │   skeleton   │  │   skeleton   │                     │               │
│  │  └──────────────┘  └──────────────┘                     │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────── CRON JOBS ────────────────────────────────┐               │
│  │                                                          │               │
│  │  ┌─────────────────────────────────────────────────────┐ │               │
│  │  │ ReminderCronJob                                     │ │               │
│  │  │ - Runs every 5 minutes                              │ │               │
│  │  │ - Check due reminders (24h, 2h, 30min before)       │ │               │
│  │  │ - Send via configured channels (Email/SMS)          │ │               │
│  │  └─────────────────────────────────────────────────────┘ │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Events Consumed by Notification Service

| Event | Routing Key | Action |
|-------|-------------|--------|
| Appointment Scheduled | `appointment.scheduled` | Send "Vui lòng thanh toán trong 30 phút" |
| Appointment Confirmed | `appointment.confirmed` | Send "Lịch hẹn đã xác nhận" + Create reminders |
| Appointment Cancelled | `appointment.cancelled` | Send "Đã hủy lịch hẹn" + Cancel reminders |
| Appointment Rescheduled | `appointment.rescheduled` | Send "Lịch hẹn đã dời" + Update reminders |
| Appointment Completed | `appointment.completed` | Send "Cảm ơn đã khám" + Feedback request |
| Payment Completed | `billing.payment.completed` | Send "Thanh toán thành công" |
| Invoice Generated | `billing.invoice.generated` | Send invoice email |
| Payment Reminder | `billing.payment.reminder.due` | Send "Nhắc nhở thanh toán" |
| Staff Created | `provider.staff.created` | Send welcome email (staff) |
| Staff Updated | `provider.staff.updated` | Send profile update notification |

### 3.3 Reminder Types

| Type | Timing | Channels | Priority |
|------|--------|----------|----------|
| `24_hours` | 24 giờ trước | Email + SMS | Normal |
| `2_hours` | 2 giờ trước | SMS | High |
| `30_minutes` | 30 phút trước | SMS + Push | Urgent |

---

## 4. WALLET SERVICE

### 4.1 Wallet Operations

```typescript
// WalletService.ts

export class WalletService {
  // Nạp tiền vào ví
  async topUp(patientId, amount, description, referenceId, createdBy, metadata)
    → WalletTransaction { type: 'topup', amount: +X }

  // Trừ tiền từ ví (thanh toán)
  async charge(patientId, amount, description, referenceId, createdBy, metadata)
    → WalletTransaction { type: 'charge', amount: -X }

  // Hoàn tiền vào ví
  async refund(patientId, amount, description, referenceId, createdBy, metadata)
    → WalletTransaction { type: 'refund', amount: +X }
}
```

### 4.2 Wallet Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WALLET TRANSACTION TYPES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   TOP-UP    │     │   CHARGE    │     │   REFUND    │                   │
│  │   +100,000  │     │   -50,000   │     │   +25,000   │                   │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                   │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      wallet_accounts                                │   │
│  │  patient_id  │  balance   │  currency  │  last_updated              │   │
│  │  uuid        │  175,000   │  VND       │  2025-12-06 05:00:00       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      wallet_transactions                            │   │
│  │  id  │ patient_id │ type   │ amount   │ reference │ created_at      │   │
│  │  1   │ uuid       │ topup  │ +100,000 │ vnpay_123 │ 2025-12-05      │   │
│  │  2   │ uuid       │ charge │ -50,000  │ inv_456   │ 2025-12-06      │   │
│  │  3   │ uuid       │ refund │ +25,000  │ rfn_789   │ 2025-12-06      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Pay Invoice with Wallet Flow

```typescript
// PayInvoiceWithWalletUseCase.ts

async executeImpl(request): Promise<PayInvoiceWithWalletResponse> {
  // 1. Validate invoice exists and belongs to patient
  const invoice = await this.invoiceRepository.findById(request.invoiceId);

  // 2. Check if invoice expired
  if (invoice.dueDate <= Date.now()) {
    invoice.markAsExpired();
    return { success: false, message: "Hóa đơn đã hết hạn" };
  }

  // 3. Check if already paid
  if (invoice.status.isPaid()) {
    return { success: false, message: "Hóa đơn đã được thanh toán" };
  }

  // 4. Charge wallet (will throw if insufficient balance)
  const walletTransaction = await this.walletService.charge(
    patientId,
    invoice.outstandingAmount.amount,
    `Thanh toán hóa đơn ${invoice.invoiceNumber}`,
    invoice.id,
    request.initiatedBy
  );

  // 5. Process payment on invoice
  const payment = Payment.create(outstandingAmount, "wallet", walletTransaction.id);
  invoice.processPayment(payment);
  await this.invoiceRepository.save(invoice);

  // 6. Publish events (PaymentCompleted)
  await this.publishInvoiceEvents(invoice);

  return { success: true, message: "Thanh toán bằng ví thành công" };
}
```

---

## 5. REFUND FLOW

### 5.1 Three-Phase Refund Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        3-PHASE REFUND FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: REFUND REQUESTED                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  [Appointment Cancelled]                                                    │
│          │                                                                  │
│          ▼                                                                  │
│  [AppointmentEventConsumer] ──consume──► appointment.cancelled              │
│          │                                                                  │
│          ▼                                                                  │
│  [RefundPaymentUseCase.execute()]                                           │
│          │                                                                  │
│          ├──► Calculate refund amount based on policy                       │
│          │    (e.g., 100% if > 24h, 50% if > 12h, 0% if < 6h)              │
│          │                                                                  │
│          ├──► Create Refund Payment Record                                  │
│          │    { method: 'refund', status: 'refund_pending', amount: -X }   │
│          │                                                                  │
│          └──► Emit: billing.payment.refund_requested                        │
│                                                                             │
│  PHASE 2: GATEWAY PROCESSING                                                │
│  ───────────────────────────                                                │
│                                                                             │
│  [RefundGatewayWorker] ──consume──► billing.payment.refund_requested        │
│          │                                                                  │
│          ▼                                                                  │
│          ├──► If Wallet Payment:                                            │
│          │    └──► WalletService.refund() → Direct credit                   │
│          │                                                                  │
│          ├──► If VNPay Payment:                                             │
│          │    └──► MOCK (TODO: VNPay Refund API)                            │
│          │                                                                  │
│          └──► Call CompleteRefundUseCase                                    │
│                                                                             │
│  PHASE 3: REFUND COMPLETED                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  [CompleteRefundUseCase]                                                    │
│          │                                                                  │
│          ├──► Update Invoice: status = 'refunded', outstanding = 0         │
│          │                                                                  │
│          ├──► Update Payment: status = 'refund_completed'                   │
│          │                                                                  │
│          └──► Emit: billing.payment.refunded                                │
│                      │                                                      │
│                      ▼                                                      │
│          [NotificationService] → Send "Đã hoàn tiền thành công"             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Refund Events

| Event | Routing Key | Purpose |
|-------|-------------|---------|
| PaymentRefundRequestedEvent | `billing.payment.refund_requested` | Trigger gateway processing |
| PaymentRefundedEvent | `billing.payment.refunded` | Notify completion to other services |

### 5.3 Refund Policy (MVP)

| Thời điểm hủy | % Hoàn tiền | Ghi chú |
|---------------|-------------|---------|
| > 24h trước | 100% | Hoàn toàn bộ vào Wallet |
| 12h - 24h trước | 50% | Hoàn 50% vào Wallet |
| < 12h trước | 0% | Không hoàn tiền |

**Lưu ý**: Policy này có thể configurable, hiện hardcode trong `RefundPaymentUseCase`.

---

## 6. CHI TIẾT 6 LUỒNG PATIENT

### LUỒNG 1: Đăng ký & Kích hoạt tài khoản

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LUỒNG 1: ĐĂNG KÝ & KÍCH HOẠT TÀI KHOẢN                    │
│                         (Verify-First Approach)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Patient         Frontend          Identity             Patient Registry    │
│     │               │                 │                        │            │
│     │ 1. Nhập form  │                 │                        │            │
│     │    đăng ký    │                 │                        │            │
│     ├──────────────>│                 │                        │            │
│     │               │ POST /auth/register                      │            │
│     │               ├────────────────>│                        │            │
│     │               │                 │                        │            │
│     │               │   ┌─────────────────────────────────────────────────┐ │
│     │               │   │ RegisterUserUseCase (Verify-First)              │ │
│     │               │   │ 1. Validate input                               │ │
│     │               │   │ 2. Check user not exists                        │ │
│     │               │   │ 3. Check no pending registration                │ │
│     │               │   │ 4. Hash password                                │ │
│     │               │   │ 5. Generate verification token (24h)            │ │
│     │               │   │ 6. Store in pending_registrations table         │ │
│     │               │   │ 7. Send verification email (direct call)        │ │
│     │               │   │ 8. Publish PendingRegistrationCreatedEvent      │ │
│     │               │   └─────────────────────────────────────────────────┘ │
│     │               │                 │                        │            │
│     │               │                 │ Event: pending_registration.created │
│     │               │                 ├───────────────────────>│            │
│     │               │                 │         │ (consume - tracking only) │
│     │               │                 │         ▼                           │
│     │               │                 │   Log pending registration          │
│     │               │                 │                        │            │
│     │<──────────────│ "Kiểm tra email để xác thực"             │            │
│     │               │                 │                        │            │
│     │               │                 │                        │            │
│     │ 2. Click link │                 │                        │            │
│     │    trong email│                 │                        │            │
│     ├───────────────────────────────>│                        │            │
│     │               │                 │                        │            │
│     │               │ GET /auth/verify-email?token=xxx         │            │
│     │               │                 │                        │            │
│     │               │   ┌─────────────────────────────────────────────────┐ │
│     │               │   │ VerifyEmailUseCase                              │ │
│     │               │   │ 1. Verify JWT token                             │ │
│     │               │   │ 2. Find pending registration by token           │ │
│     │               │   │ 3. Check token not expired (24h)                │ │
│     │               │   │ 4. Create user in auth.users + user_profiles    │ │
│     │               │   │ 5. Delete pending registration                  │ │
│     │               │   │ 6. Send welcome email (direct call)             │ │
│     │               │   │ 7. Publish UserCreatedEvent + UserActivatedEvent│ │
│     │               │   └─────────────────────────────────────────────────┘ │
│     │               │                 │                        │            │
│     │               │                 │ Event: user.created.event          │
│     │               │                 ├───────────────────────>│            │
│     │               │                 │         │ (consume)    │            │
│     │               │                 │         ▼              │            │
│     │               │                 │   ┌────────────────────────────────┐│
│     │               │                 │   │ IdentityUserCreatedEventHandler││
│     │               │                 │   │ - Check role == PATIENT        ││
│     │               │                 │   │ - Log: waiting for activation  ││
│     │               │                 │   │ (Patient NOT created yet)      ││
│     │               │                 │   └────────────────────────────────┘│
│     │               │                 │                        │            │
│     │               │                 │ Event: user.activated.event        │
│     │               │                 ├───────────────────────>│            │
│     │               │                 │         │ (consume)    │            │
│     │               │                 │         ▼              │            │
│     │               │                 │   ┌────────────────────────────────┐│
│     │               │                 │   │ UserActivatedEventHandler      ││
│     │               │                 │   │ 1. Check patient not exists    ││
│     │               │                 │   │ 2. createFromUserEvent()       ││
│     │               │                 │   │    - Create patient record     ││
│     │               │                 │   │    - Default values for        ││
│     │               │                 │   │      missing fields            ││
│     │               │                 │   │ 3. Patient status = ACTIVE     ││
│     │               │                 │   └────────────────────────────────┘│
│     │               │                 │                        │            │
│     │<──────────────│ "Tài khoản đã kích hoạt! Đăng nhập ngay" │            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.1 Chi tiết Events và Handlers

| Step | Publisher | Event | Routing Key | Consumer | Handler | Action |
|------|-----------|-------|-------------|----------|---------|--------|
| 1 | Identity | `PendingRegistrationCreatedEvent` | `pending_registration.created` | Patient Registry | (tracking) | Log only |
| 2 | Identity | `UserCreatedEvent` | `user.created.event` | Patient Registry | `IdentityUserCreatedEventHandler` | Log, wait for activation |
| 3 | Identity | `UserActivatedEvent` | `user.activated.event` | Patient Registry | `UserActivatedEventHandler` | **CREATE patient record** |

#### 1.2 Outbox Pattern

Identity Service sử dụng **Outbox Pattern** để đảm bảo event được publish:

```typescript
// VerifyEmailUseCase.ts (line 270-334)
if (this.outboxService || this.eventPublisher) {
  const userCreatedEvent = new UserCreatedEvent(...);
  const activatedEvent = new UserActivatedEvent(...);
  const events = [userCreatedEvent, activatedEvent];

  // Store events in outbox (guaranteed persistence)
  if (this.outboxService) {
    for (const event of events) {
      await this.outboxService.storeEvent(event);
    }
  }

  // Also publish immediately if eventPublisher available (best effort)
  if (this.eventPublisher) {
    await this.eventPublisher.publishDomainEvents(events);
  }
}
```

#### 1.3 Patient Creation từ Event

```typescript
// UserActivatedEventHandler.ts (line 93-106)
const patient = await this.patientRepository.createFromUserEvent({
  userId: eventData.userId,
  email: eventData.email || '',
  fullName: eventData.fullName,
  phoneNumber: 'Chưa cập nhật',
  address: 'Chưa cập nhật',
  ward: 'Chưa cập nhật',
  district: 'Chưa cập nhật',
  city: 'Chưa cập nhật',
  province: 'Chưa cập nhật',
  dateOfBirth: new Date('2000-01-01'),
  gender: 'other',
  citizenId: 'Chưa cập nhật',
});
```

#### 1.4 Verify-First Approach

Hệ thống sử dụng **Verify-First Approach**:
- User data được lưu vào `pending_registrations` table trước
- User thực sự được tạo **SAU KHI** email verification thành công
- Ngăn chặn database pollution từ các registrations không verify

**Services tham gia**: Identity Service, Patient Registry Service  
**Events**: 
- `pending_registration.created` (tracking only)
- `user.created.event` (logging, wait for activation)
- `user.activated.event` → **Creates patient record**

**Email gửi qua**: Direct call trong Identity Service (SendGrid), KHÔNG qua event bus

---

### LUỒNG 2: Cập nhật hồ sơ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LUỒNG 2: CẬP NHẬT HỒ SƠ                                │
│                    (CQRS Pattern - Sync Read Model)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Patient         Frontend        Patient Registry           Appointments   │
│     │               │                   │                         │        │
│     │ 1. Cập nhật   │                   │                         │        │
│     │    thông tin  │                   │                         │        │
│     ├──────────────>│                   │                         │        │
│     │               │ PATCH /v1/patients/:id                      │        │
│     │               ├──────────────────>│                         │        │
│     │               │                   │                         │        │
│     │               │   ┌───────────────────────────────────────────────┐  │
│     │               │   │ UpdatePatientInfoUseCase                      │  │
│     │               │   │ 1. Find patient by ID                         │  │
│     │               │   │ 2. Check patient is active                    │  │
│     │               │   │ 3. Update personalInfo/contactInfo/etc        │  │
│     │               │   │ 4. patient.updatePersonalInfo() →             │  │
│     │               │   │    addDomainEvent(PatientUpdatedEvent)        │  │
│     │               │   │ 5. Save to repository                         │  │
│     │               │   │ 6. publishDomainEvents() via EventBus         │  │
│     │               │   │ 7. HIPAA Audit logging                        │  │
│     │               │   └───────────────────────────────────────────────┘  │
│     │               │                   │                         │        │
│     │               │                   │ Event: patient.patient.updated   │
│     │               │                   ├────────────────────────>│        │
│     │               │                   │         │ (consume)     │        │
│     │               │                   │         ▼               │        │
│     │               │                   │   ┌──────────────────────────────┐
│     │               │                   │   │ PatientEventConsumer         │
│     │               │                   │   │ (handlePatientUpdated)       │
│     │               │                   │   │                              │
│     │               │                   │   │ 1. Idempotency check (Inbox) │
│     │               │                   │   │ 2. patientReadRepo.upsert()  │
│     │               │                   │   │    - Update patient_read_    │
│     │               │                   │   │      models table            │
│     │               │                   │   │ 3. Save to inbox (processed) │
│     │               │                   │   └──────────────────────────────┘
│     │               │                   │                         │        │
│     │<──────────────│ "Cập nhật thành công"                       │        │
│     │               │                   │                         │        │
│     │               │                   │                         │        │
│     │ 2. Thêm bảo   │                   │                         │        │
│     │    hiểm       │                   │                         │        │
│     ├──────────────>│                   │                         │        │
│     │               │ POST /patients/:id/insurance                │        │
│     │               ├──────────────────>│                         │        │
│     │               │                   │                         │        │
│     │               │                   │ → Same event flow       │        │
│     │               │                   │   (PatientUpdatedEvent  │        │
│     │               │                   │    with type:           │        │
│     │               │                   │    "insurance_info")    │        │
│     │               │                   │                         │        │
│     │<──────────────│ "Thêm bảo hiểm OK"│                         │        │
│     │               │                   │                         │        │
│     │               │                   │                         │        │
│     │ 3. Thêm liên  │                   │                         │        │
│     │    hệ khẩn cấp│                   │                         │        │
│     ├──────────────>│                   │                         │        │
│     │               │ POST /patients/:id/emergency-contacts       │        │
│     │               ├──────────────────>│                         │        │
│     │               │                   │                         │        │
│     │               │                   │ → Same event flow       │        │
│     │               │                   │   (PatientUpdatedEvent  │        │
│     │               │                   │    with type:           │        │
│     │               │                   │    "emergency_contact") │        │
│     │               │                   │                         │        │
│     │<──────────────│ "Thêm liên hệ OK" │                         │        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1 Chi tiết Events và Handlers

| Step | Publisher | Event | Routing Key | Consumer | Handler | Action |
|------|-----------|-------|-------------|----------|---------|--------|
| 1 | Patient Registry | `PatientUpdatedEvent` | `patient.patient.updated` | Appointments | `PatientEventConsumer` | Sync read model |

#### 2.2 PatientUpdatedEvent - Các loại update

Aggregate `Patient` tạo `PatientUpdatedEvent` cho mỗi loại cập nhật:

```typescript
// Patient.ts - Domain Aggregate

// Update personal info
public updatePersonalInfo(personalInfo: PersonalInfo, updatedBy: string): void {
  this.addDomainEvent(new PatientUpdatedEvent(
    patientId,
    this.props.userId,
    "personal_info",  // updateType
    updatedBy,
    { fullName, dateOfBirth, gender, citizenId },  // personalInfo
  ));
}

// Update contact info
public updateContactInfo(contactInfo: ContactInfo, updatedBy: string): void {
  this.addDomainEvent(new PatientUpdatedEvent(
    patientId,
    this.props.userId,
    "contact_info",  // updateType
    updatedBy,
    undefined,
    { phoneNumber, email, address },  // contactInfo
  ));
}

// Update insurance info
public updateInsuranceInfo(insuranceInfo: InsuranceInfo, updatedBy: string): void {
  this.addDomainEvent(new PatientUpdatedEvent(
    patientId,
    this.props.userId,
    "insurance_info",  // updateType
    updatedBy,
  ));
}

// Add emergency contact
public addEmergencyContact(contact: EmergencyContact, updatedBy: string): void {
  this.addDomainEvent(new PatientUpdatedEvent(
    patientId,
    this.props.userId,
    "emergency_contact",  // updateType
    updatedBy,
  ));
}
```

#### 2.3 CQRS Pattern - Read Model Sync

Appointments Service duy trì **Patient Read Model** để query nhanh thông tin patient:

```typescript
// PatientEventConsumer.ts (Appointments Service)

private async handlePatientUpdated(event: any): Promise<void> {
  const payload = event.payload || event.data;

  if (!payload || !payload.patientId) {
    throw new Error('Invalid patient.updated event: missing patientId');
  }

  // Upsert to patient_read_models table
  await this.patientReadRepo.upsert({
    patientId: payload.patientId,
    tenantId: payload.tenantId || 'hospital-1',
    fullName: this.extractFullName(payload),
    phone: this.extractPhone(payload),
    email: this.extractEmail(payload),
    dateOfBirth: this.extractDateOfBirth(payload),
    gender: this.extractGender(payload),
    nationalId: this.extractNationalId(payload),
    insuranceNumber: this.extractInsuranceNumber(payload),
    insuranceType: this.extractInsuranceType(payload),
    address: this.extractAddress(payload)
  });

  console.log(`[PatientEventConsumer] ✓ Patient ${payload.patientId} updated in read model`);
}
```

#### 2.4 Inbox Pattern - Idempotency

Consumer sử dụng **Inbox Pattern** để đảm bảo xử lý idempotent:

```typescript
// PatientEventConsumer.ts

async handle(event: any): Promise<void> {
  const eventId = event.eventId || event.id || event.metadata?.eventId;

  // Idempotency check
  if (await this.inboxRepo.exists(eventId)) {
    console.debug(`[PatientEventConsumer] Duplicate event ${eventId}, skipping`);
    return;
  }

  // Process event...

  // Mark as processed
  await this.inboxRepo.save({
    eventId,
    eventType,
    sourceService: 'patient-registry',
    payloadJson: event
  });
}
```

#### 2.5 HIPAA Audit Logging

Mọi cập nhật patient đều được log vào `audit_logs` table:

```typescript
// UpdatePatientInfoUseCase.ts

private async auditPatientUpdate(patient, request, updatedFields): Promise<void> {
  await this.auditService.logAudit({
    eventId: randomUUID(),
    eventType: 'patient.updated',
    aggregateType: 'Patient',
    aggregateId: patient.getPatientId(),
    action: 'PATIENT_INFO_UPDATE',
    userId: request.updatedBy,
    patientId: patient.getPatientId(),
    containsPHI: true,  // Personal Health Information
    changedFields: {
      dataAccessed: updatedFields.join(','),
      requestedBy: request.updatedBy,
      updatedFields: updatedFields,
    },
    complianceLevel: 'hipaa',
  });
}
```

**Services tham gia**: Patient Registry Service, Appointments Service (consumer)  
**Events**: `patient.patient.updated`  
**Patterns**: CQRS (Read Model), Inbox (Idempotency), Outbox (Guaranteed Delivery)  
**Compliance**: HIPAA Audit Trail  
**Không có notification** cho luồng này - chỉ sync data giữa services.

---

### LUỒNG 3: Đặt lịch & Thanh toán (CORE FLOW)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              LUỒNG 3: ĐẶT LỊCH & THANH TOÁN (Prepaid Model)                  │
│                  2-Layer Defense Against Double Booking                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Patient    Frontend    Appointments    Billing    Notifications    VNPay   │
│    │          │            │              │            │             │      │
│    │ 1. Chọn  │            │              │            │             │      │
│    │    BS,   │            │              │            │             │      │
│    │    ngày  │            │              │            │             │      │
│    ├─────────>│            │              │            │             │      │
│    │          │ GET /providers/:id/available-slots    │             │      │
│    │          ├───────────>│              │            │             │      │
│    │          │            │              │            │             │      │
│    │          │   ┌─────────────────────────────────────────────────────┐   │
│    │          │   │ ConflictResolutionService.checkConflicts()         │   │
│    │          │   │ - Query DB for existing appointments               │   │
│    │          │   │ - Check time overlap with [startTime, endTime]     │   │
│    │          │   │ - Generate slot suggestions if conflicts found     │   │
│    │          │   └─────────────────────────────────────────────────────┘   │
│    │          │            │              │            │             │      │
│    │<─────────│ Available slots          │            │             │      │
│    │          │            │              │            │             │      │
│    │ 2. Xác   │            │              │            │             │      │
│    │    nhận  │            │              │            │             │      │
│    │    đặt   │            │              │            │             │      │
│    ├─────────>│            │              │            │             │      │
│    │          │ POST /v1/appointments/book           │             │      │
│    │          ├───────────>│              │            │             │      │
│    │          │            │              │            │             │      │
│    │          │   ┌─────────────────────────────────────────────────────┐   │
│    │          │   │ ScheduleAppointmentUseCase                          │   │
│    │          │   │────────────────────────────────────────────────────│   │
│    │          │   │ 1. Authorization check                              │   │
│    │          │   │ 2. Validate request                                 │   │
│    │          │   │ 3. Create Appointment aggregate                     │   │
│    │          │   │                                                     │   │
│    │          │   │ 4. ┌─── LAYER 1: Application-Level ───────────────┐ │   │
│    │          │   │    │ conflictResolutionService.checkConflicts()   │ │   │
│    │          │   │    │ - If conflicts → return error + suggestions   │ │   │
│    │          │   │    └──────────────────────────────────────────────┘ │   │
│    │          │   │                                                     │   │
│    │          │   │ 5. try { appointmentRepository.save() }             │   │
│    │          │   │    ┌─── LAYER 2: Database-Level ──────────────────┐ │   │
│    │          │   │    │ PostgreSQL Exclusion Constraint              │ │   │
│    │          │   │    │ exclude_doctor_time_overlap                  │ │   │
│    │          │   │    │                                              │ │   │
│    │          │   │    │ catch(23P01) { // Race condition!            │ │   │
│    │          │   │    │   - Retry conflict check                     │ │   │
│    │          │   │    │   - Return error + fresh suggestions         │ │   │
│    │          │   │    │ }                                            │ │   │
│    │          │   │    └──────────────────────────────────────────────┘ │   │
│    │          │   │                                                     │   │
│    │          │   │ 6. Schedule reminders (best effort)                 │   │
│    │          │   │ 7. Get payment link from Billing (best effort)      │   │
│    │          │   │ 8. Emit AppointmentScheduledEvent                   │   │
│    │          │   └─────────────────────────────────────────────────────┘   │
│    │          │            │              │            │             │      │
│    │          │            │ Event: appointment.scheduled            │      │
│    │          │            ├─────────────>│            │             │      │
│    │          │            │              │            │             │      │
│    │          │            │   ┌─────────────────────────────────────────┐  │
│    │          │            │   │ AppointmentEventConsumer                │  │
│    │          │            │   │ handleAppointmentScheduled()            │  │
│    │          │            │   │ 1. Resolve patient UUID                 │  │
│    │          │            │   │ 2. Resolve staff UUID                   │  │
│    │          │            │   │ 3. Enrich doctor info                   │  │
│    │          │            │   │ 4. billingService.generateInvoice()     │  │
│    │          │            │   │    - Status: PENDING                    │  │
│    │          │            │   │    - DueDate: now + 30 minutes          │  │
│    │          │            │   │ 5. createPayOSPaymentLink()             │  │
│    │          │            │   │ 6. Emit PaymentLinkCreatedEvent         │  │
│    │          │            │   └─────────────────────────────────────────┘  │
│    │          │            │              │            │             │      │
│    │          │            │              ├───────────>│             │      │
│    │          │            │              │  (consume) │             │      │
│    │          │            │              │  Send "Vui lòng          │      │
│    │          │            │              │  thanh toán trong 30p"   │      │
│    │          │            │              │            │             │      │
│    │<─────────│ { appointmentId, paymentLink, invoiceId }           │      │
│    │          │            │              │            │             │      │
│    │          │            │              │            │             │      │
│    │  ┌───────────────── CHỌN PHƯƠNG THỨC THANH TOÁN ──────────────────┐    │
│    │  │                                                                │    │
│    │  │    ┌──────────────┐         ┌──────────────┐                  │    │
│    │  │    │    WALLET    │         │ VNPay/PayOS  │                  │    │
│    │  │    │   (Direct)   │         │  (Redirect)  │                  │    │
│    │  │    └──────┬───────┘         └──────┬───────┘                  │    │
│    │  │           │                        │                          │    │
│    │  └───────────┼────────────────────────┼──────────────────────────┘    │
│    │              │                        │                               │
│    │ 3a. Pay      │                        │ 3b. Pay                       │
│    │    Wallet    │                        │     VNPay                     │
│    ├─────────────>│                        │                               │
│    │              │ POST /invoices/:id/pay-with-wallet                     │
│    │              ├───────────────────────>│                               │
│    │              │                        │                               │
│    │              │   ┌─────────────────────────────────────────┐          │
│    │              │   │ PayInvoiceWithWalletUseCase             │          │
│    │              │   │ 1. Check invoice not expired            │          │
│    │              │   │ 2. Check invoice not cancelled          │          │
│    │              │   │ 3. Check invoice not already paid       │          │
│    │              │   │ 4. walletService.charge() → -amount     │          │
│    │              │   │ 5. invoice.processPayment()             │          │
│    │              │   │ 6. Emit PaymentCompletedEvent           │          │
│    │              │   └─────────────────────────────────────────┘          │
│    │              │                        │                               │
│    │              │                        │                               │
│    │              │                        ├───────────────────────────────>│
│    │              │                        │ Redirect to VNPay checkout    │
│    │              │                        │<───────Webhook callback────────│
│    │              │                        │                               │
│    │              │                        │   ┌────────────────────────────┐
│    │              │                        │   │ HandlePayOSWebhookUseCase  │
│    │              │                        │   │ 1. Verify signature        │
│    │              │                        │   │ 2. Find invoice by orderCode│
│    │              │                        │   │ 3. invoice.processPayment()│
│    │              │                        │   │ 4. Emit PaymentCompletedEvent│
│    │              │                        │   └────────────────────────────┘
│    │              │                        │                               │
│    │              │     Event: billing.payment.completed                   │
│    │              │              ├─────────────────────────────────────────>│
│    │              │              │         │                               │
│    │              │              │  ┌──────────────────────────────────────┐│
│    │              │              │  │ BillingEventConsumer (Appointments) ││
│    │              │              │  │ PaymentCompletedHandler.handle()    ││
│    │              │              │  │ 1. Find appointment by ID           ││
│    │              │              │  │ 2. Check payment not after deadline ││
│    │              │              │  │ 3. appointment.confirm()            ││
│    │              │              │  │ 4. appointment.markAsPaid()         ││
│    │              │              │  │ 5. Save + Sync read model           ││
│    │              │              │  └──────────────────────────────────────┘│
│    │              │              │         │                               │
│    │              │              │  ┌──────────────────────────────────────┐│
│    │              │              │  │ AppointmentEventConsumer (Notifications)│
│    │              │              │  │ 1. Send "Thanh toán thành công"     ││
│    │              │              │  │ 2. Create reminders (24h, 2h, 30m)  ││
│    │              │              │  └──────────────────────────────────────┘│
│    │              │              │         │                               │
│    │<─────────────│ "Đặt lịch thành công!" │                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.1 Two-Layer Defense Against Double Booking

##### Layer 1: Application-Level Check (ConflictResolutionService)

```typescript
// ConflictResolutionService.ts

async checkConflicts(request: ConflictCheckRequest): Promise<ConflictCheckResponse> {
  const conflictCheck = await this.appointmentRepository.checkConflicts(
    request.doctorId,
    request.startTime,
    request.endTime,
    request.excludeAppointmentId  // For reschedule scenarios
  );

  const conflicts: ConflictInfo[] = conflictCheck.conflicts.map(conflict => ({
    appointmentId: conflict.appointmentId,
    startTime: conflict.startTime,
    endTime: conflict.endTime,
    patientName: 'Bệnh nhân khác',  // Privacy
    reason: conflict.reason,
  }));

  const hasConflicts = conflicts.length > 0;

  // If conflicts found, generate alternative slot suggestions
  let suggestions: TimeSlotSuggestion[] | undefined;
  if (hasConflicts) {
    suggestions = await this.generateAlternativeSlots(
      request.doctorId,
      request.startTime,
      request.endTime
    );
  }

  return { hasConflicts, conflicts, suggestions };
}
```

##### Layer 2: Database-Level Exclusion Constraint

```sql
-- PostgreSQL Exclusion Constraint (appointments table)
CREATE CONSTRAINT exclude_doctor_time_overlap 
  EXCLUDE USING gist (
    doctor_id WITH =,
    tsrange(start_time_utc, end_time_utc) WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'completed'));
```

##### Race Condition Handling

```typescript
// ScheduleAppointmentUseCase.ts (lines 218-250)

// 5. Save to repository (domain events will be emitted automatically)
try {
  await this.appointmentRepository.save(appointment);
} catch (saveError: any) {
  // Catch PostgreSQL exclusion constraint violation (23P01)
  if (
    saveError.code === "23P01" ||
    saveError.message?.includes("exclude_doctor_time_overlap")
  ) {
    // Race condition: Another appointment was created between our check and save
    // Retry conflict check to get fresh suggestions
    const retryConflictCheck = await this.conflictResolutionService.checkConflicts({
      doctorId: request.doctorId,
      startTime,
      endTime,
    });

    return {
      success: false,
      appointmentId: "",
      message: "Không thể đặt lịch: Bác sĩ đã có lịch hẹn vào thời gian này (race condition)",
      errors: ["DOUBLE_BOOKING_DETECTED", "CONSTRAINT_VIOLATION"],
      conflictInfo: {
        hasConflicts: true,
        message: "Lịch hẹn bị trùng (đã có người khác đặt trước)",
        suggestions: retryConflictCheck.suggestions,
      },
    };
  }
  // Re-throw other errors
  throw saveError;
}
```

#### 3.2 Payment Methods

##### Option A: Wallet Payment (Direct)

```typescript
// PayInvoiceWithWalletUseCase.ts

protected async executeImpl(request): Promise<PayInvoiceWithWalletResponse> {
  const invoice = await this.invoiceRepository.findById(request.invoiceId);
  
  // Validation checks
  if (invoice.status.isExpired() || invoice.dueDate <= Date.now()) {
    invoice.markAsExpired("Payment attempted after due date");
    return { success: false, message: "Hóa đơn đã hết hạn thanh toán" };
  }

  if (invoice.status.isPaid() || invoice.outstandingAmount.amount <= 0) {
    return { success: false, message: "Hóa đơn đã được thanh toán" };
  }

  // Charge wallet (throws if insufficient balance)
  const walletTransaction = await this.walletService.charge(
    patientId,
    outstandingAmount,
    `Thanh toán hóa đơn ${invoice.invoiceNumber}`,
    invoiceId,
    request.initiatedBy
  );

  // Process payment on invoice
  const payment = Payment.create(
    Money.create(outstandingAmount, currency),
    "wallet",
    walletTransaction.id
  );
  invoice.processPayment(payment);
  await this.invoiceRepository.save(invoice);

  // Publish PaymentCompletedEvent
  await this.publishInvoiceEvents(invoice);

  return { success: true, message: "Thanh toán bằng ví thành công" };
}
```

##### Option B: VNPay/PayOS Payment (Redirect)

```typescript
// CreateVnpayPaymentLinkUseCase.ts

protected async executeImpl(request): Promise<CreateVnpayPaymentLinkResponse> {
  const invoice = await this.invoiceRepository.findById(request.invoiceId);

  // Validation
  if (invoice.status.value === "cancelled") {
    throw new Error("Cannot create payment link for cancelled invoice");
  }
  if (invoice.status.value === "paid") {
    throw new Error("Invoice is already paid");
  }
  if (invoice.dueDate && invoice.dueDate.getTime() <= Date.now()) {
    throw new Error("Hóa đơn đã hết hạn thanh toán");
  }

  const orderCode = VnpayIntegrationService.generateOrderCode();

  const paymentLink = await this.payosService.createPaymentLink({
    orderCode,
    amount: invoice.outstandingAmount.amount,
    description: `Thanh toán hóa đơn ${invoice.invoiceNumber}`,
    returnUrl: request.returnUrl,
  });

  return {
    success: true,
    checkoutUrl: paymentLink.checkoutUrl,
    qrCode: paymentLink.qrCode,
    paymentLinkId: paymentLink.paymentLinkId,
    orderCode: paymentLink.orderCode,
    amount: paymentLink.amount,
  };
}
```

#### 3.3 Invoice Creation Flow (Event-Driven)

```typescript
// AppointmentEventConsumer.ts (Billing Service)

private async handleAppointmentScheduled(data: AppointmentScheduledEventData): Promise<void> {
  // 1. Resolve patient UUID
  const patient = await this.patientRepository.findById(data.patientId);
  
  // 2. Generate invoice (Status: PENDING, DueDate: +30 minutes)
  const invoice = await this.billingService.generateAppointmentInvoice({
    appointmentId: data.appointmentId,
    patientId: patient.id,
    staffId: data.staffId,
    departmentId: data.departmentId,
    doctorName: data.doctorName,
    serviceType: data.serviceType,
    scheduledAt: data.scheduledAt,
    consultationFee: data.consultationFee,
    insuranceInfo: patient.insuranceInfo,
    patientName: patient.fullName,
  });

  // 3. Automatically create PayOS payment link
  const paymentLinkResult = await this.createPayOSPaymentLinkUseCase.execute({
    invoiceId: invoice.id,
    buyerName: patient.fullName,
    buyerEmail: patient.email,
    buyerPhone: patient.phone,
  });

  // 4. Emit PaymentLinkCreatedEvent for Notifications Service
  if (paymentLinkResult.success) {
    const paymentLinkEvent = new PaymentLinkCreatedEvent(
      invoice.id,
      data.patientId,
      paymentLinkResult.orderCode,
      paymentLinkResult.checkoutUrl,
      paymentLinkResult.qrCode,
      invoice.totalAmount.amount,
      invoice.totalAmount.currency,
    );
    await this.eventBus.publish(paymentLinkEvent);
  }
}
```

#### 3.4 Auto-Confirm After Payment (Event-Driven)

```typescript
// PaymentCompletedHandler.ts (Appointments Service)

async handle(data: PaymentCompletedEventData): Promise<void> {
  const appointment = await this.appointmentRepository.findByIdString(data.appointmentId);

  // Check if already processed
  if (this.isAlreadyPaidOrConfirmed(appointment)) {
    await this.syncReadModelPaymentStatus(data.appointmentId, "paid");
    return;  // Skip duplicate event
  }

  // Check payment deadline
  const paymentTimestamp = this.resolvePaymentTimestamp(data.processedAt);
  const deadline = appointment.paymentDeadline;
  
  if (deadline && paymentTimestamp > deadline) {
    // Payment arrived AFTER deadline → Trigger refund flow
    await this.handleExpiredPayment(appointment, data, deadline, paymentTimestamp);
    return;
  }

  // Auto-confirm appointment
  appointment.confirm("system");
  appointment.markAsPaid();

  await this.appointmentRepository.save(appointment);
  await this.syncReadModelPaymentStatus(data.appointmentId, "paid");

  logger.info(`Appointment auto-confirmed. AppointmentId: ${data.appointmentId}`);
}
```

#### 3.5 Events Summary

| Step | Publisher | Event | Routing Key | Consumer | Action |
|------|-----------|-------|-------------|----------|--------|
| 1 | Appointments | `AppointmentScheduledEvent` | `appointment.scheduled` | Billing | Create invoice + PayOS link |
| 1 | Appointments | `AppointmentScheduledEvent` | `appointment.scheduled` | Notifications | Send "Vui lòng thanh toán" |
| 2 | Billing | `PaymentLinkCreatedEvent` | `billing.payment_link.created` | Notifications | Send payment link to patient |
| 3 | Billing | `PaymentCompletedEvent` | `billing.payment.completed` | Appointments | Confirm + markAsPaid |
| 3 | Billing | `PaymentCompletedEvent` | `billing.payment.completed` | Notifications | Send "Thanh toán thành công" + Create reminders |
| 4 | Billing | `InvoiceExpiredEvent` | `billing.invoice.expired` | Appointments | Cancel appointment (if unpaid) |

#### 3.6 Payment Timeout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  PAYMENT TIMEOUT FLOW (30 minutes)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Invoice Created]                                              │
│        │                                                        │
│        ▼                                                        │
│  dueDate = now + 30 minutes                                     │
│        │                                                        │
│        ├───────── Patient pays within 30m ─────────────────────>│
│        │                                                        │
│        │   [PaymentCompletedEvent]                              │
│        │         │                                              │
│        │         ▼                                              │
│        │   Appointments: confirm() + markAsPaid()               │
│        │                                                        │
│        │                                                        │
│        └───────── 30 minutes elapsed ────────────────────────────│
│                                                                 │
│  [InvoiceExpiredEvent]                                          │
│        │                                                        │
│        ├──> Billing: invoice.markAsExpired()                    │
│        │                                                        │
│        └──> Appointments: appointment.cancel("Invoice expired") │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Services tham gia**: Appointments, Billing, Notifications, VNPay/PayOS  
**Double Booking Prevention**: 2-Layer Defense (Application + Database Constraint)  
**Payment Methods**: Wallet (direct) + VNPay/PayOS (redirect with webhook)  
**Payment Timeout**: 30 minutes (configurable)

---

### LUỒNG 4: Dời lịch / Hủy lịch & Hoàn tiền

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  LUỒNG 4: HỦY LỊCH & HOÀN TIỀN                               │
│              Vietnamese Healthcare Cancellation Policy                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                     CHÍNH SÁCH HOÀN TIỀN (4 TIERS)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ • Hủy ≥ 24h trước:     Hoàn 100%, đặt lại miễn phí                  │    │
│  │ • Hủy 4h - 24h trước:  Hoàn 80%, đặt lại miễn phí                   │    │
│  │ • Hủy 2h - 4h trước:   Hoàn 50%, phí đặt lại 50,000 VNĐ            │    │
│  │ • Hủy < 2h trước:      Không hoàn tiền, phí hủy 100,000 VNĐ        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│ Patient    Frontend    Appointments    Billing    Notifications    Wallet  │
│    │          │            │              │            │             │      │
│    │ 1. Yêu   │            │              │            │             │      │
│    │    cầu   │            │              │            │             │      │
│    │    hủy   │            │              │            │             │      │
│    ├─────────>│            │              │            │             │      │
│    │          │ PATCH /appointments/:id/cancel                       │      │
│    │          │ { cancellationReason, cancelledBy }                  │      │
│    │          ├───────────>│              │            │             │      │
│    │          │            │              │            │             │      │
│    │          │   ┌─────────────────────────────────────────────────────┐   │
│    │          │   │ CancelAppointmentUseCase                            │   │
│    │          │   │─────────────────────────────────────────────────────│   │
│    │          │   │ 1. Validate cancellation reason (required)          │   │
│    │          │   │ 2. Find appointment by ID                           │   │
│    │          │   │ 3. Authorization check (owner or admin)             │   │
│    │          │   │ 4. appointment.cancel(reason, cancelledBy)          │   │
│    │          │   │    → Emit AppointmentCancelledEvent                 │   │
│    │          │   │ 5. appointmentRepository.save()                     │   │
│    │          │   │ 6. reminderService.cancelReminders() (best effort)  │   │
│    │          │   │ 7. Calculate & return cancellation policy           │   │
│    │          │   └─────────────────────────────────────────────────────┘   │
│    │          │            │              │            │             │      │
│    │          │            │ Event based on policy:                   │      │
│    │          │            │ ├── refund eligible → appointment.cancelled   │
│    │          │            │ └── penalty applies → appointment.cancelled_late│
│    │          │            ├─────────────>│            │             │      │
│    │          │            │              │            │             │      │
│    │          │            │   ┌─────────────────────────────────────────┐  │
│    │          │            │   │ AppointmentEventConsumer (Billing)      │  │
│    │          │            │   │ handleAppointmentCancelled()            │  │
│    │          │            │   │                                         │  │
│    │          │            │   │ IF refundEligible && refundPercentage > 0:│ │
│    │          │            │   │   RefundPaymentUseCase.execute({        │  │
│    │          │            │   │     appointmentId,                      │  │
│    │          │            │   │     patientId,                          │  │
│    │          │            │   │     refundPercentage,  // 100, 80, 50   │  │
│    │          │            │   │     reason,                             │  │
│    │          │            │   │     refundedBy                          │  │
│    │          │            │   │   })                                    │  │
│    │          │            │   └─────────────────────────────────────────┘  │
│    │          │            │              │            │             │      │
│    │          │            │   ┌─────────────────────────────────────────┐  │
│    │          │            │   │ RefundPaymentUseCase                    │  │
│    │          │            │   │─────────────────────────────────────────│  │
│    │          │            │   │ 1. Find invoice by appointmentId        │  │
│    │          │            │   │ 2. Validate: isPaid(), !isRefunded()    │  │
│    │          │            │   │ 3. Prevent duplicate refunds            │  │
│    │          │            │   │ 4. invoice.processRefund(...)           │  │
│    │          │            │   │    → status: refund_pending             │  │
│    │          │            │   │ 5. Emit PaymentRefundRequestedEvent     │  │
│    │          │            │   │                                         │  │
│    │          │            │   │ IF hadWalletPayment && walletService:   │  │
│    │          │            │   │   walletService.refund(patientId, amt)  │  │
│    │          │            │   │   invoice.completeRefund()              │  │
│    │          │            │   │ ELSE IF !useGatewayRefund:              │  │
│    │          │            │   │   invoice.completeRefund() // auto      │  │
│    │          │            │   │                                         │  │
│    │          │            │   │ 6. Emit PaymentRefundedEvent            │  │
│    │          │            │   └─────────────────────────────────────────┘  │
│    │          │            │              │            │             │      │
│    │          │            │              │ Event: billing.payment.refunded │
│    │          │            │              ├───────────────────────────>│    │
│    │          │            │              │            │   (consume)  │    │
│    │          │            │              │            │              │    │
│    │          │            │              │   ┌────────────────────────────┐│
│    │          │            │              │   │ NotificationEventConsumer ││
│    │          │            │              │   │ - Send "Đã hoàn {X}đ vào ví"│
│    │          │            │              │   │ - SMS/Email if < 2h       ││
│    │          │            │              │   │ - Cancel scheduled reminders│
│    │          │            │              │   └────────────────────────────┘│
│    │          │            │              │            │             │      │
│    │<─────────│ { success, cancellationPolicy, estimatedRefundAmount }     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.1 Cancellation Policy (Vietnamese Healthcare Standard)

```typescript
// AppointmentCancelledEvent.ts (lines 310-352)

public static calculateCancellationPolicy(hoursNotice: number): {
  penaltyApplied: boolean;
  refundEligible: boolean;
  rescheduleAllowed: boolean;
  penaltyAmount?: number;
  refundPercentage?: number;
} {
  // Vietnamese healthcare cancellation policy
  if (hoursNotice >= 24) {
    // 24+ hours notice: Full refund, free reschedule
    return {
      penaltyApplied: false,
      refundEligible: true,
      rescheduleAllowed: true,
      refundPercentage: 100,
    };
  } else if (hoursNotice >= 4) {
    // 4-24 hours notice: 80% refund, free reschedule
    return {
      penaltyApplied: false,
      refundEligible: true,
      rescheduleAllowed: true,
      refundPercentage: 80,
    };
  } else if (hoursNotice >= 2) {
    // 2-4 hours notice: 50% refund, reschedule with fee
    return {
      penaltyApplied: true,
      refundEligible: true,
      rescheduleAllowed: true,
      penaltyAmount: 50000, // 50,000 VNĐ
      refundPercentage: 50,
    };
  } else {
    // Less than 2 hours notice: No refund, penalty applies
    return {
      penaltyApplied: true,
      refundEligible: false,
      rescheduleAllowed: false,
      penaltyAmount: 100000, // 100,000 VNĐ
    };
  }
}
```

#### 4.2 Routing Key Logic

Event tự động chọn routing key dựa trên policy:

```typescript
// AppointmentCancelledEvent.ts (lines 567-588)

public override getRoutingKey(): string {
  const hoursNotice = ...;
  const cancellationPolicy = AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);

  // If refund eligible (early cancellation) → 'appointment.cancelled' for refund processing
  if (cancellationPolicy.refundEligible) {
    return "appointment.cancelled";
  }

  // If penalty applied (late cancellation) → 'appointment.cancelled_late' for fee processing
  if (cancellationPolicy.penaltyApplied) {
    return "appointment.cancelled_late";
  }

  // Default: no refund, no penalty (edge case)
  return "appointment.cancelled";
}
```

#### 4.3 Refund Process (RefundPaymentUseCase)

```typescript
// RefundPaymentUseCase.ts

protected async executeInternal(request): Promise<RefundPaymentResponse> {
  // 1. Validate refund percentage (0-100)
  if (request.refundPercentage < 0 || request.refundPercentage > 100) {
    return { success: false, message: "Invalid refund percentage" };
  }

  // 2. Find invoice(s) by appointmentId
  const invoices = await this.invoiceRepository.findAllByAppointmentId(request.appointmentId);
  const invoice = this.selectPrimaryInvoice(invoices);  // appointment_booking type

  // 3. Validate invoice status
  if (!invoice.status.isPaid()) {
    return { success: false, message: "Không thể hoàn tiền cho hóa đơn chưa thanh toán" };
  }
  if (invoice.status.isRefunded()) {
    return { success: false, message: "Hóa đơn đã được hoàn tiền" };
  }

  // 4. Prevent duplicate refunds
  const existingRefund = invoice.payments.find(
    p => p.method === "refund" && (p.status === "refund_pending" || p.status === "completed")
  );
  if (existingRefund) {
    return { success: false, message: "Hoàn tiền đã được yêu cầu trước đó" };
  }

  // 5. Process refund
  const refundAmount = invoice.processRefund(
    request.refundPercentage,
    request.reason,
    request.refundedBy
  );

  // 6. Save invoice (will emit PaymentRefundRequestedEvent)
  await this.invoiceRepository.save(invoice);

  // 7. Wallet refund (if originally paid by wallet)
  if (hadWalletPayment && this.walletService) {
    await this.refundWallet(invoice, refundAmount, refundPaymentId, request.refundedBy);
    invoice.completeRefund(refundPaymentId, `WALLET-REFUND-${Date.now()}`);
  } else if (!this.config.useGatewayRefund) {
    // Auto-complete if not using external gateway
    invoice.completeRefund(refundPaymentId, `REFUND-SYSTEM-${Date.now()}`);
  }

  // 8. Publish events
  const events = invoice.getUncommittedEvents();
  for (const event of events) {
    await this.eventBus.publish(event);
  }

  return { success: true, refundId: refundPaymentId, refundAmount };
}
```

#### 4.4 Late Cancellation Fee (appointment.cancelled_late)

Billing Service cũng xử lý late cancellation để tạo invoice phí:

```typescript
// AppointmentEventConsumer.ts (Billing Service)

private async handleAppointmentCancelledLate(data): Promise<void> {
  if (data.lateFeeApplied && data.lateFeeAmount > 0) {
    // Generate late cancellation fee invoice
    const feeInvoice = await this.billingService.generateLateCancellationFee({
      appointmentId: data.appointmentId,
      patientId: patientUuid,
      cancelledAt: data.cancelledAt,
      reason: data.reason,
      feeAmount: data.lateFeeAmount,  // 50,000 or 100,000 VNĐ
    });

    // Try auto-pay from wallet (if available)
    await this.attemptWalletAutoPay(feeInvoice.id, patientUuid, {
      context: "late_cancellation_fee",
      appointmentId: data.appointmentId,
    });
  }
}
```

#### 4.5 Events Summary

| Trigger | Publisher | Event | Routing Key | Consumer | Action |
|---------|-----------|-------|-------------|----------|--------|
| Patient cancels ≥ 2h | Appointments | `AppointmentCancelledEvent` | `appointment.cancelled` | Billing | Process refund (100%, 80%, 50%) |
| Patient cancels < 2h | Appointments | `AppointmentCancelledEvent` | `appointment.cancelled_late` | Billing | Generate late fee invoice |
| Refund initiated | Billing | `PaymentRefundRequestedEvent` | `billing.payment.refund_requested` | RefundGatewayWorker | Process refund (Wallet/VNPay) |
| Refund completed | Billing | `PaymentRefundedEvent` | `billing.payment.refunded` | Notifications | Send "Đã hoàn tiền" |
| Refund completed | Billing | `PaymentRefundedEvent` | `billing.payment.refunded` | Appointments | Update read model |

#### 4.6 Notification Channels by Hours Notice

```typescript
// AppointmentCancelledEvent.ts (lines 357-367)

private static getPatientNotificationChannels(hoursNotice: number): ("sms" | "email" | "push")[] {
  if (hoursNotice < 2) {
    // Last minute cancellation - use all channels (urgent)
    return ["sms", "push", "email"];
  } else {
    // Normal cancellation
    return ["email", "push"];
  }
}
```

#### 4.7 Integration Events (For Multi-Service Updates)

Event chứa đầy đủ dữ liệu cho tất cả services:

```typescript
integrationEvents: {
  // Provider Staff Service - release time slot
  providerScheduleUpdate: {
    doctorId, timeSlotId, status: "available", releasedAt
  },

  // Patient Registry Service - update history
  patientAppointmentHistory: {
    patientId, appointmentId, status: "cancelled", penaltyApplied
  },

  // Notification Service - send notifications
  notificationRequests: {
    patientNotification: { ... },
    providerNotification: { ... }
  },

  // Billing Service - handle refund/penalty
  billingUpdate: {
    action: "refund" | "penalty" | "no_action",
    amount, reason
  },

  // Clinical Service - update medical record
  clinicalUpdate: {
    updateMedicalRecord: true,
    cancellationNote: "Cuộc hẹn bị hủy: {reason}. Thời gian thông báo: {X} giờ."
  }
}
```

**Services tham gia**: Appointments, Billing, Notifications, Wallet  
**Cancellation Policy**: 4-tier Vietnamese healthcare standard  
**Refund Methods**: Wallet (direct) + VNPay (mock/pending)  
**Late Fee**: 50,000 VNĐ (2-4h) or 100,000 VNĐ (<2h)

---

### LUỒNG 5: Chi tiết lịch hẹn & Chat Realtime

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  LUỒNG 5: CHI TIẾT LỊCH & CHAT REALTIME                      │
│             ⚠️ KHÔNG SỬ DỤNG RABBITMQ - Dùng SUPABASE REALTIME               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Patient         Frontend          Backend          Supabase          Doctor│
│    │               │                 │                │                │   │
│    │ 1. Xem chi    │                 │                │                │   │
│    │    tiết lịch  │                 │                │                │   │
│    ├──────────────>│                 │                │                │   │
│    │               │ GET /appointments/:id           │                │   │
│    │               ├────────────────>│                │                │   │
│    │               │<────────────────│                │                │   │
│    │<──────────────│ Appointment data│                │                │   │
│    │               │                 │                │                │   │
│    │ 2. Init Chat  │                 │                │                │   │
│    │               │ GET /v1/chat/conversations?appointmentId=X       │   │
│    │               ├────────────────>│                │                │   │
│    │               │                 │ Query chat_conversations       │   │
│    │               │                 ├───────────────>│                │   │
│    │               │                 │<───────────────│                │   │
│    │               │                 │ (Create if not exists)         │   │
│    │               │<────────────────│                │                │   │
│    │               │ { conversationId, patientId, doctorId }          │   │
│    │               │                 │                │                │   │
│    │ 3. Subscribe  │                 │                │                │   │
│    │    Realtime   │                 │                │                │   │
│    │               │ supabase.channel('chat-{convoId}')               │   │
│    │               │ .on('postgres_changes', { table: 'chat_messages',│   │
│    │               │      filter: conversation_id=eq.{convoId} })     │   │
│    │               ├─────────────────────────────────>│                │   │
│    │               │                 │                │<───────────────│   │
│    │               │                 │                │ Doctor also    │   │
│    │               │                 │                │ subscribes     │   │
│    │               │                 │                │                │   │
│    │ 4. Send msg   │                 │                │                │   │
│    ├──────────────>│                 │                │                │   │
│    │               │ POST /v1/chat/messages          │                │   │
│    │               │ { conversationId, content }     │                │   │
│    │               ├────────────────>│                │                │   │
│    │               │                 │ INSERT chat_messages           │   │
│    │               │                 ├───────────────>│                │   │
│    │               │                 │                │                │   │
│    │               │                 │    ┌─────────────────────────┐  │   │
│    │               │                 │    │ SUPABASE REALTIME       │  │   │
│    │               │                 │    │ postgres_changes event  │  │   │
│    │               │                 │    │ BROADCAST to subscribers│  │   │
│    │               │                 │    └─────────────────────────┘  │   │
│    │               │                 │                │                │   │
│    │               │<────────────────────────────────│───────────────>│   │
│    │               │ New message     │                │ New message   │   │
│    │<──────────────│ (realtime)      │                │ (realtime)    │   │
│    │               │                 │                │               │   │
│    │               │                 │                │ 5. Doctor reply│  │
│    │               │                 │                │<───────────────│   │
│    │               │                 │ INSERT chat_messages           │   │
│    │               │                 │<───────────────│                │   │
│    │               │                 │                │                │   │
│    │               │<────────────────────────────────│                │   │
│    │<──────────────│ Doctor's reply  │                │                │   │
│    │ (realtime)    │                 │                │                │   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     SUPABASE REALTIME FEATURES                      │    │
│  │                                                                     │    │
│  │  • Channel: chat-{conversationId}                                   │    │
│  │  • Table: appointments_schema.chat_messages                         │    │
│  │  • Event: postgres_changes (INSERT)                                 │    │
│  │  • Filter: conversation_id=eq.{conversationId}                     │    │
│  │  • Fallback: Polling every 4s if Realtime not configured           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1 Database Schema

```sql
-- appointments_schema.chat_conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- appointments_schema.chat_messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,  -- 'patient' | 'doctor'
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5.2 Backend Chat Routes

```typescript
// chat.routes.ts (Appointments Service)

// GET /v1/chat/conversations?appointmentId={id}
// Returns: { conversationId, patientId, doctorId }
// Creates conversation if not exists

router.get("/chat/conversations", async (req, res) => {
  const appointmentId = req.query.appointmentId;
  
  // 1. Get participants from appointment_read_model
  const participants = await supabase
    .from("appointment_read_model")
    .select("patient_id, doctor_id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  // 2. Authorization check (patient or doctor only)
  if (!isParticipant(userId, patient_id, doctor_id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // 3. Find or create conversation
  const existing = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (existing) {
    return res.json({ conversationId: existing.id, ... });
  }

  // Create new conversation
  const created = await supabase
    .from("chat_conversations")
    .insert({ appointment_id, patient_id, doctor_id })
    .select()
    .single();

  return res.json({ conversationId: created.id, ... });
});

// POST /v1/chat/messages
// Body: { conversationId, content }
router.post("/chat/messages", async (req, res) => {
  const { conversationId, content } = req.body;

  // Determine sender role from headers/auth
  const senderRole = isPatientSender ? "patient" : "doctor";

  const { data } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: resolvedSenderId,
      sender_role: senderRole,
      content,
    })
    .select()
    .single();

  return res.json({ success: true, message: data });
});
```

#### 5.3 Frontend Supabase Realtime Integration

```typescript
// page.tsx (Patient/Doctor Appointment Detail)

function setupRealtime(convoId: string) {
  if (!isSupabaseConfigured() || !supabase) return;
  
  const channel = supabase
    .channel(`chat-${convoId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'appointments_schema',
        table: 'chat_messages',
        filter: `conversation_id=eq.${convoId}`,
      },
      (payload: any) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => {
          // Prevent duplicate
          if (prev.some(m => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        
        // Show notification if chat is closed
        if (!isChatOpen && newMsg.sender_role !== 'patient') {
          setUnreadCount((prev) => prev + 1);
          toast.info('Bạn có tin nhắn mới từ bác sĩ');
        }
      }
    )
    .subscribe();

  return () => {
    if (supabase) supabase.removeChannel(channel);
  };
}
```

#### 5.4 Fallback Polling (When Realtime Not Configured)

```typescript
// Fallback polling when Supabase Realtime is not configured
useEffect(() => {
  if (!conversationId) return;
  if (isSupabaseConfigured()) return;  // Skip if realtime is working

  const interval = setInterval(() => {
    loadMessages(conversationId);  // Poll every 4 seconds
  }, 4000);

  return () => clearInterval(interval);
}, [conversationId, appointment]);
```

#### 5.5 Chat UI Features

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLOATING CHAT WIDGET                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 💬 Chat với bác sĩ                            [Minimize]  │  │
│  │ Trực tuyến                                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐      │  │
│  │  │ Patient message (blue, right-aligned)          │      │  │
│  │  └─────────────────────────────────────────────────┘      │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐      │  │
│  │  │ Doctor message (white, left-aligned)           │      │  │
│  │  └─────────────────────────────────────────────────┘      │  │
│  │                                                          ↓│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [  Nhập tin nhắn...                              ] [Send] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

               ┌─────────────────┐
               │ 💬  [Unread: 2] │  <- Floating toggle button
               └─────────────────┘
```

#### 5.6 Features Summary

| Feature | Implementation |
|---------|----------------|
| **Realtime Messaging** | Supabase Realtime (postgres_changes) |
| **Fallback** | Polling every 4s if Realtime not configured |
| **Authorization** | Patient or Doctor only (via headers or JWT roles) |
| **Duplicate Prevention** | Check message ID before adding to state |
| **Unread Badge** | Count increments when chat is closed + new doctor message |
| **Toast Notification** | "Bạn có tin nhắn mới từ bác sĩ" |
| **Auto-scroll** | Scroll to bottom on new message |
| **Optimistic UI** | Add sent message to state immediately |

**Technology**: Supabase Realtime (NOT RabbitMQ)  
**Database Schema**: appointments_schema.chat_conversations, chat_messages  
**Features**: Channel subscription, postgres_changes, Unread badge, Toast notifications  
**Fallback**: Polling every 4 seconds if Supabase Realtime not configured

---

### LUỒNG 6: Nạp tiền Wallet (VNPay/PayOS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LUỒNG 6: NẠP TIỀN WALLET (VNPay/PayOS)                  │
│                  Invoice-based Wallet Top-Up with Webhook                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Patient         Frontend          Billing              PayOS      Wallet   │
│    │               │                 │                   │          │       │
│    │ 1. Chọn số    │                 │                   │          │       │
│    │    tiền nạp   │                 │                   │          │       │
│    │    (100k,200k)│                 │                   │          │       │
│    ├──────────────>│                 │                   │          │       │
│    │               │ POST /v1/wallet/topup-link         │          │       │
│    │               │ { patientId, amount }              │          │       │
│    │               ├────────────────>│                   │          │       │
│    │               │                 │                   │          │       │
│    │               │   ┌───────────────────────────────────────────────┐    │
│    │               │   │ CreateWalletTopUpLinkUseCase                  │    │
│    │               │   │──────────────────────────────────────────────│    │
│    │               │   │ 1. Validate patientId & amount > 0           │    │
│    │               │   │                                              │    │
│    │               │   │ 2. CreateInvoiceUseCase.execute({            │    │
│    │               │   │      patientId,                              │    │
│    │               │   │      items: [{ description: "Nạp ví...",     │    │
│    │               │   │               quantity: 1, unitPrice }],     │    │
│    │               │   │      metadata: {                             │    │
│    │               │   │        invoiceType: "wallet_topup",          │    │
│    │               │   │        walletTopUp: true,                    │    │
│    │               │   │        walletTopUpAmount: amount             │    │
│    │               │   │      }                                       │    │
│    │               │   │    })                                        │    │
│    │               │   │                                              │    │
│    │               │   │ 3. CreateVnpayPaymentLinkUseCase.execute({   │    │
│    │               │   │      invoiceId                               │    │
│    │               │   │    })                                        │    │
│    │               │   │ → Returns checkoutUrl, qrCode, orderCode     │    │
│    │               │   └───────────────────────────────────────────────┘    │
│    │               │                 │                   │          │       │
│    │<──────────────│ { checkoutUrl, qrCode, orderCode, invoiceId }  │       │
│    │               │                 │                   │          │       │
│    │ 2. Redirect   │                 │                   │          │       │
│    │    to PayOS   │                 │                   │          │       │
│    ├────────────────────────────────────────────────────>│          │       │
│    │               │                 │                   │          │       │
│    │ 3. Thanh toán │                 │                   │          │       │
│    │    trên PayOS │                 │                   │          │       │
│    ├────────────────────────────────────────────────────>│          │       │
│    │               │                 │                   │          │       │
│    │               │                 │  4. Webhook       │          │       │
│    │               │                 │     callback      │          │       │
│    │               │                 │<──────────────────│          │       │
│    │               │                 │                   │          │       │
│    │               │   ┌───────────────────────────────────────────────┐    │
│    │               │   │ HandlePayOSWebhookUseCase                     │    │
│    │               │   │──────────────────────────────────────────────│    │
│    │               │   │ 1. Verify signature (payosService)           │    │
│    │               │   │ 2. Check code === "00" (success)             │    │
│    │               │   │ 3. Find invoice by description pattern       │    │
│    │               │   │    - Try INV-XXXXXX-XXXX invoice number      │    │
│    │               │   │    - Fallback to UUID pattern                │    │
│    │               │   │ 4. invoice.processPayment(payment)           │    │
│    │               │   │ 5. Check metadata.walletTopUp === true       │    │
│    │               │   │    → handleWalletTopUp()                     │    │
│    │               │   │ 6. Publish PaymentCompletedEvent             │    │
│    │               │   └───────────────────────────────────────────────┘    │
│    │               │                 │                   │          │       │
│    │               │                 │   handleWalletTopUp()        │       │
│    │               │                 ├──────────────────────────────>│       │
│    │               │                 │                   │          │       │
│    │               │   ┌───────────────────────────────────────────────┐    │
│    │               │   │ WalletService.topUp()                         │    │
│    │               │   │ - Validate amount > 0                        │    │
│    │               │   │ - walletRepository.adjustBalance({           │    │
│    │               │   │     patientId,                               │    │
│    │               │   │     amount: +amount,                         │    │
│    │               │   │     type: "topup",                           │    │
│    │               │   │     metadata: { invoiceId, paymentId, ... }  │    │
│    │               │   │   })                                         │    │
│    │               │   │ - Returns WalletTransaction                  │    │
│    │               │   └───────────────────────────────────────────────┘    │
│    │               │                 │                   │          │       │
│    │               │                 │ Update invoice metadata:      │       │
│    │               │                 │ walletTopUpProcessed: true    │       │
│    │               │                 │ walletTopUpTransactionId: xxx │       │
│    │               │                 │                   │          │       │
│    │ 5. Redirect   │                 │                   │          │       │
│    │    back to app│                 │                   │          │       │
│    │<────────────────────────────────────────────────────│          │       │
│    │               │                 │                   │          │       │
│    │               │ GET /v1/wallet/balance             │          │       │
│    │               ├────────────────>│                   │          │       │
│    │               │<────────────────│                   │          │       │
│    │<──────────────│ "Nạp tiền thành công! Số dư: {X}đ" │          │       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.1 CreateWalletTopUpLinkUseCase

```typescript
// CreateWalletTopUpLinkUseCase.ts

export class CreateWalletTopUpLinkUseCase {
  protected async executeImpl(request): Promise<CreateWalletTopUpLinkResponse> {
    // Validation
    if (!request.patientId) throw new Error("patientId is required");
    if (!request.amount || request.amount <= 0) {
      throw new Error("amount must be greater than 0");
    }

    // 1. Create invoice with wallet_topup metadata
    const invoiceResponse = await this.createInvoiceUseCase.execute({
      patientId: request.patientId,
      items: [{
        description: "Nạp ví tài khoản bệnh nhân",
        quantity: 1,
        unitPrice: request.amount,
      }],
      metadata: {
        invoiceType: "wallet_topup",
        serviceName: "Nạp ví tài khoản",
        walletTopUp: true,  // Key flag for webhook to recognize
        walletTopUpAmount: request.amount,
        walletTopUpCreatedBy: request.createdBy || "patient",
      },
    });

    // 2. Create PayOS payment link
    const paymentLinkResponse = await this.createPaymentLinkUseCase.execute({
      invoiceId: invoiceResponse.invoiceId,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
    });

    return {
      invoiceId: invoiceResponse.invoiceId,
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode,
      paymentLinkId: paymentLinkResponse.paymentLinkId,
      orderCode: paymentLinkResponse.orderCode,
      amount: paymentLinkResponse.amount,
    };
  }
}
```

#### 6.2 Webhook Wallet Top-Up Handler

```typescript
// HandlePayOSWebhookUseCase.ts (lines 278-343)

private async handleWalletTopUp(
  invoice: Invoice,
  payment: Payment,
  request: HandlePayOSWebhookRequest
): Promise<void> {
  if (!this.walletService) {
    this.logger.warn("Wallet service not configured, skipping wallet top-up");
    return;
  }

  // Prevent duplicate processing
  const metadata = this.getInvoiceMetadata(invoice);
  if (this.isWalletTopUpProcessed(metadata)) {
    this.logger.info("Wallet top-up already processed for invoice");
    return;
  }

  const amount = Number(metadata.walletTopUpAmount ?? payment.amount.amount);
  if (amount <= 0) {
    throw new Error(`Invalid wallet top-up amount for invoice ${invoice.id}`);
  }

  // Credit wallet
  const walletTransaction = await this.walletService.topUp(
    invoice.getPatientId(),
    amount,
    metadata.walletTopUpDescription || "Wallet top-up via online payment",
    payment.id || invoice.id,
    metadata.walletTopUpCreatedBy || "system",
    {
      invoiceId: invoice.id,
      paymentId: payment.id,
      orderCode: request.webhookData.orderCode,
      reference: request.webhookData.reference,
      vnpTxnRef: request.rawPayload?.vnp_TxnRef,
    }
  );

  // Mark as processed (prevent duplicate)
  invoice.setMetadata({
    ...metadata,
    walletTopUpProcessed: true,
    walletTopUpPending: false,
    walletTopUpTransactionId: walletTransaction.id,
    walletTopUpProcessedAt: new Date().toISOString(),
  });

  this.logger.info("Wallet top-up credited from webhook", {
    invoiceId: invoice.id,
    patientId: invoice.getPatientId(),
    walletTransactionId: walletTransaction.id,
    amount,
  });
}
```

#### 6.3 WalletService

```typescript
// WalletService.ts

export class WalletService {
  async topUp(
    patientId: string,
    amount: number,
    description?: string,
    referenceId?: string,
    createdBy?: string,
    metadata?: Record<string, any>
  ): Promise<WalletTransaction> {
    this.validateAmount(amount);

    return this.walletRepository.adjustBalance({
      patientId,
      amount: Math.abs(amount),  // Always positive for topup
      type: "topup",
      description,
      referenceId,
      createdBy,
      metadata,
    });
  }

  async charge(patientId, amount, ...): Promise<WalletTransaction> {
    return this.walletRepository.adjustBalance({
      patientId,
      amount: -Math.abs(amount),  // Always negative for charge
      type: "charge",
      ...
    });
  }

  async refund(patientId, amount, ...): Promise<WalletTransaction> {
    return this.walletRepository.adjustBalance({
      patientId,
      amount: Math.abs(amount),  // Always positive for refund
      type: "refund",
      ...
    });
  }
}
```

#### 6.4 Flow Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                    WALLET TOP-UP FLOW                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Patient selects amount] → [Frontend]                           │
│        │                                                         │
│        ▼                                                         │
│  POST /v1/wallet/topup-link                                      │
│        │                                                         │
│        ▼                                                         │
│  CreateWalletTopUpLinkUseCase                                    │
│        │                                                         │
│        ├── CreateInvoiceUseCase (metadata: walletTopUp = true)   │
│        │                                                         │
│        └── CreateVnpayPaymentLinkUseCase                         │
│              │                                                   │
│              ▼                                                   │
│       Return { checkoutUrl, qrCode, orderCode }                  │
│              │                                                   │
│              ▼                                                   │
│  [Patient redirects to PayOS checkout]                           │
│              │                                                   │
│              ▼                                                   │
│  [Patient pays via VNPay/Bank]                                   │
│              │                                                   │
│              ▼                                                   │
│  [PayOS sends webhook to backend]                                │
│              │                                                   │
│              ▼                                                   │
│  HandlePayOSWebhookUseCase                                       │
│        │                                                         │
│        ├── Verify signature                                      │
│        ├── Find invoice by description                           │
│        ├── invoice.processPayment()                              │
│        ├── Check metadata.walletTopUp === true?                  │
│        │     └── YES: handleWalletTopUp()                        │
│        │               └── walletService.topUp()                 │
│        │                     └── walletRepository.adjustBalance  │
│        │                           └── +amount to balance        │
│        │                                                         │
│        └── Publish PaymentCompletedEvent                         │
│                                                                  │
│  [Patient redirected back to app, sees new balance]              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### 6.5 Wallet Transaction Types

| Type | Direction | Usage |
|------|-----------|-------|
| `topup` | +amount | Nạp tiền qua PayOS/VNPay |
| `charge` | -amount | Thanh toán hóa đơn (PayInvoiceWithWalletUseCase) |
| `refund` | +amount | Hoàn tiền khi hủy lịch (RefundPaymentUseCase) |

#### 6.6 Duplicate Prevention

Webhook có thể được gọi nhiều lần. Hệ thống prevent duplicate qua metadata:

```typescript
// Before processing
if (this.isWalletTopUpProcessed(metadata)) {
  return;  // Skip if already processed
}

// After processing
invoice.setMetadata({
  ...metadata,
  walletTopUpProcessed: true,  // Mark as processed
  walletTopUpTransactionId: walletTransaction.id,
});
```

**Services tham gia**: Billing (Invoice, Payment), WalletService, PayOS  
**Invoice Metadata**: `invoiceType: "wallet_topup"`, `walletTopUp: true`  
**Webhook Flow**: PayOS → HandlePayOSWebhookUseCase → WalletService.topUp()  
**Duplicate Prevention**: `walletTopUpProcessed` flag in invoice metadata

---

## 7. EVENT FLOW MATRIX

### 7.1 Publisher → Consumer Matrix

| Publisher Service | Event | Consumer Service | Action |
|-------------------|-------|------------------|--------|
| **Identity** | `UserCreatedEvent` | Patient Registry | Create patient profile |
| **Identity** | `UserCreatedEvent` | Provider Staff | Create staff profile (if role = DOCTOR) |
| **Identity** | `UserActivatedEvent` | Patient Registry | Activate patient |
| **Patient Registry** | `patient.patient.updated` | Appointments | Sync patient read model |
| **Provider Staff** | `provider.staff.schedule.updated` | Appointments | Update available slots cache |
| **Appointments** | `appointment.scheduled` | Billing | Create Invoice + Payment Link |
| **Appointments** | `appointment.scheduled` | Notifications | Send "Vui lòng thanh toán" |
| **Appointments** | `appointment.confirmed` | Notifications | Create reminders + Send confirmation |
| **Appointments** | `appointment.cancelled` | Billing | Process refund (RefundPaymentUseCase) |
| **Appointments** | `appointment.cancelled` | Notifications | Send "Đã hủy" + Cancel reminders |
| **Appointments** | `appointment.rescheduled` | Notifications | Send "Đã dời" + Update reminders |
| **Appointments** | `appointment.completed` | Notifications | Send "Cảm ơn" + Feedback request |
| **Billing** | `billing.payment.completed` | Appointments | Confirm appointment |
| **Billing** | `billing.payment.completed` | Notifications | Send "Thanh toán thành công" |
| **Billing** | `billing.payment.refund_requested` | RefundGatewayWorker | Process gateway refund |
| **Billing** | `billing.payment.refunded` | Notifications | Send "Hoàn tiền thành công" |
| **Billing** | `billing.invoice.generated` | Notifications | Send invoice email |

### 7.2 Event Routing Keys

| Event Type | Routing Key Pattern |
|------------|---------------------|
| User Events | `user.{action}.event` (created, activated, deactivated) |
| Patient Events | `patient.patient.{action}` (registered, updated, deactivated) |
| Staff Events | `provider.staff.{action}` (created, updated, schedule.updated) |
| Appointment Events | `appointment.{action}` (scheduled, confirmed, cancelled, completed) |
| Billing Events | `billing.{entity}.{action}` (payment.completed, invoice.generated) |
| Reminder Events | `appointment.reminder.{type}` (24h, 2h, 30min) |

---

## 8. GAPS & MISSING PIECES

### 8.1 Implementation Gaps

| Item | Status | Impact | Priority |
|------|--------|--------|----------|
| Email verification via event | ❌ Missing | Direct call instead of event-driven | Low |
| VNPay refund API integration | ⚠️ MOCK | Only wallet refund works | Medium |
| Wallet topup notification event | ❓ Unclear | May not notify user | Medium |
| Reschedule fee policy config | ❓ Unclear | Hardcoded or configurable? | Low |
| PayOS integration | ⚠️ Partial | Basic integration, no refund | Medium |

### 8.2 Recommendations for Thesis

**Điểm mạnh cần highlight:**
1. ✅ **Event-Driven Architecture** với RabbitMQ
2. ✅ **Outbox Pattern** (3 services) cho guaranteed delivery
3. ✅ **Two-layer Double Booking Prevention** (App + DB constraint)
4. ✅ **CQRS** với read models (Appointments Service)
5. ✅ **Multi-channel Notifications** (Email, SMS, In-app)
6. ✅ **Wallet System** với VNPay integration

**Giải thích cho "Out of Scope":**
- ⚠️ VNPay refund: "Hoàn tiền thực tế qua cổng thanh toán cần hợp đồng với VNPay"
- ⚠️ Push notifications: "FCM integration là post-MVP feature"

---

## 📚 TÀI LIỆU LIÊN QUAN

- [EVENTS_QUICK_REFERENCE.md](../backend/services-v2/EVENTS_QUICK_REFERENCE.md) - Quick lookup events
- [EVENT_ARCHITECTURE_DOCUMENTATION.md](../backend/services-v2/EVENT_ARCHITECTURE_DOCUMENTATION.md) - Full documentation
- [REFUND_FLOW.md](../backend/services-v2/billing-service/REFUND_FLOW.md) - Refund flow details
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoints summary

---

> **Tài liệu này được tạo dựa trên phân tích codebase thực tế**  
> **Last Updated**: 2025-12-06
