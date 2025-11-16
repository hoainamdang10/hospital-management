# Appointment Reminders Implementation - Progress Report

**Date**: 2025-01-14
**Status**: 50% Complete
**Service**: Notifications Service

---

## ✅ Completed Components

### 1. Database Schema Migration (✅ DONE)
**File**: `migrations/013_create_appointment_reminders_table.sql`

- ✅ Created `notifications_schema.appointment_reminders` table
- ✅ 30+ columns including appointment info, patient info, doctor info
- ✅ Comprehensive indexes for performance (pending_scheduled, appointment_id, patient_id, etc.)
- ✅ Helper functions:
  - `calculate_reminder_send_time()` - Calculate when to send reminder
  - `auto_expire_old_reminders()` - Auto-expire past appointments
- ✅ Row Level Security (RLS) policies
- ✅ Audit triggers for `updated_at`

**Key Fields**:
- `reminder_type`: '24H_BEFORE', '2H_BEFORE', '30M_BEFORE', 'CUSTOM'
- `status`: 'PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED', 'EXPIRED'
- `scheduled_send_time`: When to send (calculated as appointment_datetime - offset)
- `notification_id`: Reference to sent notification

### 2. Domain Layer (✅ DONE)

#### Value Objects
**Files**:
- `domain/value-objects/ReminderType.ts` (✅)
- `domain/value-objects/ReminderStatus.ts` (✅)

**Features**:
- Type-safe reminder types with factory methods
- Status transitions with business rules
- Helper methods: `calculateSendTime()`, `getDescriptionVi()`, `getAllStandardTypes()`

#### Aggregate Root
**File**: `domain/aggregates/AppointmentReminder.ts` (✅)

**Key Methods**:
- `create()` - Factory with validation
- `isDue()` - Check if reminder should be sent now
- `canRetry()` - Check if failed reminder can be retried
- `markAsProcessing()`, `markAsSent()`, `markAsFailed()` - State transitions
- `cancel()` - Cancel reminder (e.g., when appointment cancelled)
- `markAsExpired()` - Expire past appointment reminders
- `getTemplateVariables()` - Get data for notification templates
- `getAppointmentDateTime()` - Combine date + time

### 3. Repository Layer (✅ DONE)

#### Interface
**File**: `domain/repositories/IAppointmentReminderRepository.ts` (✅)

**Methods**:
- `save()` - Create or update reminder
- `findById()` - Get by reminder ID
- `findByAppointmentId()` - Get all reminders for appointment
- **`findDueReminders()`** - **Most important** - Get pending reminders due now
- `findRetryableReminders()` - Get failed reminders ready to retry
- `findByPatientId()` - Get patient's reminders
- `cancelByAppointmentId()` - Cancel all reminders when appointment cancelled
- `expireOldReminders()` - Bulk expire past reminders
- `countPending()`, `countByStatus()` - Statistics

#### Implementation
**File**: `infrastructure/persistence/SupabaseAppointmentReminderRepository.ts` (✅)

**Features**:
- Full implementation of all interface methods
- Proper error handling with `Result<T>` pattern
- Domain ↔ Database mapping functions
- Logging for debugging
- Support for retry logic with exponential backoff

---

## 🔄 Pending Components (Next Steps)

### 4. Event Consumer Update (⚠️ TODO)
**File**: `infrastructure/events/AppointmentEventConsumer.ts`

**Current Issue**: File has `scheduleAppointmentReminders()` method that sends notifications directly (lines 743-808). Need to **replace** with database insertion logic.

**Required Changes**:
```typescript
// OLD (current):
await this.sendNotificationUseCase.execute(notificationData);

// NEW (needed):
import { AppointmentReminder } from '../../domain/aggregates/AppointmentReminder';
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';

private async scheduleAppointmentReminders(
  data: AppointmentScheduledEventData,
  preferences: any
): Promise<void> {
  // Create 3 reminders in database (24H, 2H, 30M)
  const reminderTypes = ReminderType.getAllStandardTypes();

  for (const reminderType of reminderTypes) {
    const appointmentDateTime = this.combineDateTime(data.appointmentDate, data.appointmentTime);
    const scheduledSendTime = reminderType.calculateSendTime(appointmentDateTime);

    // Only create if in future
    if (scheduledSendTime > new Date()) {
      const reminderResult = AppointmentReminder.create({
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        patientPhone: preferences?.phoneNumber,
        patientEmail: preferences?.email,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        reminderType: reminderType,
        scheduledSendTime: scheduledSendTime,
        status: ReminderStatus.PENDING,
      });

      if (reminderResult.isSuccess) {
        await this.appointmentReminderRepo.save(reminderResult.getValue()!);
      }
    }
  }
}
```

**Also Update**:
- `handleAppointmentCancelled()` (line 396): Call `appointmentReminderRepo.cancelByAppointmentId()`
- `handleAppointmentRescheduled()` (line 483): Cancel old reminders + create new ones
- Add `IAppointmentReminderRepository` to constructor

### 5. Cron Job Implementation (❌ TODO)
**File**: `infrastructure/jobs/AppointmentReminderCronJob.ts` (create new)

**Purpose**: Run every 5 minutes to send due reminders

**Implementation**:
```typescript
import { CronJob } from 'cron';
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';

export class AppointmentReminderCronJob {
  private job: CronJob;

  constructor(
    private reminderRepo: IAppointmentReminderRepository,
    private sendNotificationUseCase: SendNotificationUseCase
  ) {
    // Run every 5 minutes: */5 * * * *
    this.job = new CronJob('*/5 * * * *', async () => {
      await this.processDueReminders();
    });
  }

  async start(): Promise<void> {
    this.job.start();
    console.log('✅ Appointment Reminder Cron Job started (every 5 minutes)');
  }

  async stop(): Promise<void> {
    this.job.stop();
  }

  private async processDueReminders(): Promise<void> {
    try {
      // Step 1: Expire old reminders first
      await this.reminderRepo.expireOldReminders();

      // Step 2: Get due reminders
      const remindersResult = await this.reminderRepo.findDueReminders(50);
      if (remindersResult.isFailure) {
        console.error('[ReminderCronJob] Failed to fetch due reminders');
        return;
      }

      const reminders = remindersResult.getValue() || [];
      console.log(`[ReminderCronJob] Processing ${reminders.length} due reminders`);

      // Step 3: Process each reminder
      for (const reminder of reminders) {
        await this.processReminder(reminder);
      }

      // Step 4: Process retryable failed reminders
      const retryableResult = await this.reminderRepo.findRetryableReminders(20);
      if (retryableResult.isSuccess) {
        const retryableReminders = retryableResult.getValue() || [];
        for (const reminder of retryableReminders) {
          await this.processReminder(reminder);
        }
      }
    } catch (error) {
      console.error('[ReminderCronJob] Error processing reminders:', error);
    }
  }

  private async processReminder(reminder: AppointmentReminder): Promise<void> {
    try {
      // Mark as processing
      const markResult = reminder.markAsProcessing();
      if (markResult.isFailure) {
        return;
      }
      await this.reminderRepo.save(reminder);

      // Build notification data
      const notificationData = {
        recipientId: reminder.patientId,
        recipientType: 'patient',
        type: 'appointment_reminder',
        title: 'Nhắc nhở lịch hẹn',
        content: this.buildReminderMessage(reminder),
        channels: reminder['props'].channels || ['SMS', 'EMAIL'],
        priority: 'normal',
        scheduledAt: new Date(),
        metadata: {
          appointmentId: reminder.appointmentId,
          reminderType: reminder.reminderType.toString(),
        },
        templateData: reminder.getTemplateVariables(),
      };

      // Send notification
      const notificationResult = await this.sendNotificationUseCase.execute(notificationData);

      if (notificationResult.isSuccess) {
        // Mark as sent
        reminder.markAsSent(notificationResult.getValue()?.notificationId || '');
        await this.reminderRepo.save(reminder);
        console.log(`✅ Sent reminder ${reminder.reminderId} for appointment ${reminder.appointmentId}`);
      } else {
        // Mark as failed
        reminder.markAsFailed(notificationResult.getError());
        await this.reminderRepo.save(reminder);
        console.error(`❌ Failed to send reminder ${reminder.reminderId}:`, notificationResult.getError());
      }
    } catch (error: any) {
      console.error(`❌ Exception processing reminder ${reminder.reminderId}:`, error);
      reminder.markAsFailed(error.message);
      await this.reminderRepo.save(reminder);
    }
  }

  private buildReminderMessage(reminder: AppointmentReminder): string {
    const timeText = {
      '24H_BEFORE': 'ngày mai',
      '2H_BEFORE': 'sau 2 giờ',
      '30M_BEFORE': 'sau 30 phút',
    }[reminder.reminderType.toString()] || 'sắp tới';

    return `
Nhắc nhở: Bạn có lịch hẹn ${timeText}

- Bác sĩ: ${reminder.doctorName}
- Thời gian: ${reminder.appointmentDate.toLocaleDateString('vi-VN')} lúc ${reminder.appointmentTime}

Vui lòng đến đúng giờ.
    `.trim();
  }
}
```

### 6. Use Cases (❌ TODO - Optional)
**Files to create**:
- `application/use-cases/CreateAppointmentReminderUseCase.ts`
- `application/use-cases/CancelAppointmentReminderUseCase.ts`
- `application/use-cases/GetAppointmentRemindersUseCase.ts`

**Note**: These might not be needed if we only use cron job + event consumer. Consider creating only if API endpoints are required.

### 7. Integration & Startup (❌ TODO)
**File**: `index.ts` or `main.ts`

**Required Changes**:
```typescript
// Add to DI container
import { SupabaseAppointmentReminderRepository } from './infrastructure/persistence/SupabaseAppointmentReminderRepository';
import { AppointmentReminderCronJob } from './infrastructure/jobs/AppointmentReminderCronJob';

// Initialize repository
const appointmentReminderRepo = new SupabaseAppointmentReminderRepository(supabase);

// Initialize cron job
const reminderCronJob = new AppointmentReminderCronJob(
  appointmentReminderRepo,
  sendNotificationUseCase
);

// Start cron job
await reminderCronJob.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await reminderCronJob.stop();
  // ... other cleanup
});
```

---

## 📋 Implementation Checklist

### Phase 1: Database & Domain (✅ DONE)
- [x] Create migration file
- [x] Create ReminderType value object
- [x] Create ReminderStatus value object
- [x] Create AppointmentReminder aggregate
- [x] Create IAppointmentReminderRepository interface
- [x] Create SupabaseAppointmentReminderRepository implementation

### Phase 2: Event Consumer Integration (🔄 IN PROGRESS)
- [ ] Update AppointmentEventConsumer constructor to inject `IAppointmentReminderRepository`
- [ ] Rewrite `scheduleAppointmentReminders()` to create database records instead of sending immediately
- [ ] Update `handleAppointmentCancelled()` to cancel reminders via repository
- [ ] Update `handleAppointmentRescheduled()` to cancel old + create new reminders
- [ ] Test event consumer with sample events

### Phase 3: Cron Job (⏳ TODO)
- [ ] Create AppointmentReminderCronJob class
- [ ] Implement `processDueReminders()` logic
- [ ] Implement `processReminder()` with retry logic
- [ ] Test cron job with sample reminders in database
- [ ] Integrate cron job into main.ts startup

### Phase 4: Testing & Verification (⏳ TODO)
- [ ] Run migration on Supabase
- [ ] Insert test reminder records manually
- [ ] Verify cron job picks up due reminders
- [ ] Verify notifications are sent successfully
- [ ] Verify reminders are marked as SENT
- [ ] Test failure scenarios (retry logic)
- [ ] Test appointment cancellation (cancel reminders)
- [ ] Test appointment rescheduling (update reminders)

### Phase 5: Documentation (⏳ TODO)
- [ ] Update EVENTS_QUICK_REFERENCE.md with reminder implementation
- [ ] Update CORE_BUSINESS_FLOWS.md with completed flow
- [ ] Add API documentation (if use cases are created)

---

## 🔑 Key Design Decisions

### 1. **Why Store Reminders in Database?**
- ✅ Bounded Context Separation (no cross-schema queries)
- ✅ Eventual Consistency via Events
- ✅ High Availability (Notifications Service independent of Appointments Service)
- ✅ Scalability (can add more reminder workers)
- ✅ Audit Trail (can see all reminder history)
- ✅ Retry Logic (automatic retries for failed reminders)

### 2. **Why Cron Job Every 5 Minutes?**
- ✅ Balance between timeliness and database load
- ✅ Acceptable delay for non-critical reminders
- ✅ Can process batches of 50-100 reminders per run
- ✅ Simple to implement and maintain

### 3. **Why 3 Standard Reminder Types?**
- **24H Before**: Give patient advance notice
- **2H Before**: Final reminder to leave home
- **30M Before**: Urgent "don't forget" reminder
- ✅ Aligns with healthcare best practices

### 4. **Why Exponential Backoff for Retries?**
- Retry 1: 5 minutes later
- Retry 2: 10 minutes later
- Retry 3: 20 minutes later
- ✅ Prevents overwhelming SMS/Email providers
- ✅ Gives time for transient errors to resolve

---

## 🚀 Deployment Steps

### 1. Run Migration
```bash
# Copy migration to Supabase dashboard or use Supabase CLI
supabase migration new create_appointment_reminders_table
# Paste content from 013_create_appointment_reminders_table.sql
supabase db push
```

### 2. Update Environment Variables
```env
# No new env vars needed - uses existing Supabase & RabbitMQ config
```

### 3. Install Dependencies (if needed)
```bash
cd backend/services-v2/notifications-service
npm install cron
npm install --save-dev @types/cron
```

### 4. Build & Deploy
```bash
npm run build
npm run start:prod
```

### 5. Monitor Logs
```bash
# Look for these log messages:
[ReminderCronJob] Processing N due reminders
✅ Sent reminder XXX for appointment YYY
❌ Failed to send reminder XXX: <error>
```

---

## ⚠️ Important Notes

1. **Migration Must Run First**: Database table must exist before code deployment
2. **Event Consumer Must Be Updated**: Old `scheduleAppointmentReminders()` will conflict with new approach
3. **Cron Job Must Start**: Add to main.ts startup sequence
4. **Test in Staging First**: Verify with test appointments before production
5. **Monitor RabbitMQ**: Ensure `appointment.scheduled` events are being consumed
6. **Monitor SMS/Email Costs**: Track reminder delivery counts
7. **Cleanup Old Reminders**: Run `expireOldReminders()` regularly (cron job handles this)

---

## 📊 Expected Performance

- **Database**: ~1000 reminders/day (assuming 300 appointments/day × 3 reminders + 1 buffer)
- **Cron Job**: ~50 reminders/run (every 5 minutes = 288 runs/day)
- **Query Time**: <100ms for `findDueReminders()` (indexed on `status` + `scheduled_send_time`)
- **Send Time**: ~2-5 seconds per reminder (SMS + Email)

---

## 🎯 Success Criteria

- [ ] Reminders created automatically when appointment is scheduled
- [ ] Reminders sent at correct times (24H, 2H, 30M before)
- [ ] Failed reminders retry automatically
- [ ] Cancelled appointments cancel all reminders
- [ ] Rescheduled appointments update reminder times
- [ ] No duplicate reminders sent (idempotency)
- [ ] Performance acceptable (<5 minute delay)
- [ ] Error rate <1% for reminder delivery

---

## 📞 Contact & Support

**Implementation Team**: Hospital Management Team
**Version**: 1.0.0
**Last Updated**: 2025-01-14

For questions or issues, reference:
- [EVENTS_QUICK_REFERENCE.md](./EVENTS_QUICK_REFERENCE.md)
- [EVENT_ARCHITECTURE_DOCUMENTATION.md](./EVENT_ARCHITECTURE_DOCUMENTATION.md)
- [CORE_BUSINESS_FLOWS.md](./CORE_BUSINESS_FLOWS.md)
