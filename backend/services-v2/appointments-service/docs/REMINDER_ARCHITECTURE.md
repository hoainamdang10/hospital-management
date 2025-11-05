# Reminder Architecture - Appointments Service

## 📋 Executive Summary

Appointments Service có **2 hệ thống reminder** hoạt động song song:

1. **Auto-Scheduling System** (Preferred - 99% use cases) ✅ Production Ready
2. **Manual CRUD API** (Alternative - Special cases only) ⚠️ Optional

---

## ✅ Auto-Scheduling System (EXISTING - Preferred)

### Overview

Hệ thống tự động tạo reminders khi appointment được schedule, sử dụng event-driven architecture và Scheduler Service integration.

### Architecture Components

**1. Event Handlers** (`src/infrastructure/events/handlers/`)
- `AppointmentScheduledSchedulerHandler` - Tạo reminders khi appointment được tạo
- `AppointmentCancelledSchedulerHandler` - Hủy reminders khi appointment bị hủy
- `AppointmentRescheduledSchedulerHandler` - Reschedule reminders khi appointment thay đổi

**2. Outbox Pattern** (`src/infrastructure/outbox/`)
- `OutboxPublisherWorker` - Xử lý outbox events và gọi Scheduler Service
- `OutboxRepository` - Lưu trữ events chờ xử lý
- Resilience: Retry logic, exponential backoff, circuit breaker

**3. Scheduler Service Integration** (`src/infrastructure/adapters/`)
- `RemoteSchedulerAdapter` - HTTP client với circuit breaker
- `ISchedulerAdapter` - Interface cho Scheduler Service
- Features: Timeout protection, automatic retry, graceful degradation

**4. Reminder Policy** (`src/config/reminder-policy.json`)
- Urgency levels: ROUTINE, URGENT, EMERGENCY
- Multi-channel: EMAIL, SMS, PUSH
- Time windows: 24h, 2h, 30min, etc.
- Quiet hours enforcement
- Tenant-specific policies

### Data Flow

```
Appointment Created
  ↓
AppointmentScheduledEvent published
  ↓
AppointmentScheduledSchedulerHandler handles event
  ↓
Apply reminder policy (urgency-based)
  ↓
Enqueue to Outbox (SchedulerReminderCreate events)
  ↓
OutboxPublisherWorker processes outbox
  ↓
RemoteSchedulerAdapter calls Scheduler Service API
  ↓
Scheduler Service stores in scheduler.schedules table
  ↓
Scheduler Service triggers reminders at scheduled time
  ↓
Notifications Service sends reminders
```

### Database Schema

**Scheduler Service** (`scheduler` schema):
- `schedules` - Stores all scheduled reminders
- `schedule_runs` - Execution history
- `schedule_run_executions` - Detailed execution logs
- `outbox` - Outbox pattern for reliability
- `dead_letters` - Failed events
- `worker_leases` - Distributed locking

**Appointments Service** (`appointments_schema`):
- `appointments` table has basic fields:
  - `reminder_sent` (boolean)
  - `reminder_sent_at` (timestamp)

### Configuration

**Environment Variables:**
```env
SCHEDULER_SERVICE_URL=http://scheduler-service:3030
SCHEDULER_API_KEY=<api-key>
```

**Reminder Policy** (`src/config/reminder-policy.json`):
```json
{
  "version": "1.0.0",
  "default": {
    "ROUTINE": [
      { "window": "24h", "channels": ["EMAIL", "PUSH"] },
      { "window": "2h", "channels": ["PUSH"] }
    ],
    "URGENT": [
      { "window": "2h", "channels": ["SMS", "PUSH"] },
      { "window": "30min", "channels": ["SMS", "PUSH"] }
    ],
    "EMERGENCY": []
  },
  "quietHours": {
    "enabled": true,
    "start": "21:00",
    "end": "06:00",
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

### Advantages

✅ Fully automated - no manual intervention needed
✅ Policy-based - consistent reminder behavior
✅ Event-driven - decoupled from appointment creation
✅ Resilient - outbox pattern, retry logic, circuit breaker
✅ Scalable - Scheduler Service handles all scheduling
✅ Production-ready - already implemented and tested

### When to Use

- ✅ Standard appointment reminders (99% of cases)
- ✅ Policy-based reminders
- ✅ Automatic scheduling
- ✅ Multi-channel notifications
- ✅ Bulk operations

---

## ⚠️ Manual CRUD API (ALTERNATIVE - Optional)

### Overview

Hệ thống CRUD API cho phép tạo và quản lý reminders thủ công, lưu trữ local trong database.

### Architecture Components

**1. Domain Layer** (`src/domain/`)
- `AppointmentReminder` entity
- `IAppointmentReminderRepository` interface
- Enums: ReminderType, ReminderChannel, ReminderStatus, etc.

**2. Infrastructure Layer** (`src/infrastructure/repositories/`)
- `SupabaseAppointmentReminderRepository` - Supabase implementation

**3. Application Layer** (`src/application/use-cases/`)
- `CreateAppointmentReminderUseCase`
- `GetAppointmentRemindersUseCase`
- `UpdateAppointmentReminderUseCase`
- `DeleteAppointmentReminderUseCase`

**4. Presentation Layer** (`src/presentation/`)
- `ReminderController` - HTTP request handlers
- `reminder.routes.ts` - Route definitions
- Validation middleware

### Database Schema

**Migration:** `migrations/017_create_appointment_reminders.sql` (OPTIONAL)

**Table:** `appointments_schema.appointment_reminders`
- Local storage for manual reminders
- NOT used by auto-scheduling system
- Separate from scheduler.schedules

### API Endpoints

```
POST   /api/v1/appointments/:appointmentId/reminders
GET    /api/v1/appointments/:appointmentId/reminders
PUT    /api/v1/appointments/reminders/:reminderId
DELETE /api/v1/appointments/reminders/:reminderId
```

### When to Use

- ⚠️ Custom reminders outside policy
- ⚠️ Override auto-generated reminders
- ⚠️ One-off reminders for special cases
- ⚠️ Testing/debugging
- ⚠️ Local storage required for querying

### When NOT to Use

- ❌ Standard appointment reminders → Use auto-scheduling
- ❌ Policy-based reminders → Already handled automatically
- ❌ Bulk operations → Use Scheduler Service API

---

## 🔄 Coexistence

Both systems can coexist without conflicts:

| Aspect | Auto-Scheduling | Manual CRUD API |
|--------|----------------|-----------------|
| Storage | scheduler.schedules | appointment_reminders |
| Trigger | Event-driven | API calls |
| Policy | reminder-policy.json | Manual configuration |
| Delivery | Scheduler Service | Not handled |
| Use Cases | Standard reminders | Special cases |
| Recommended | ✅ Yes (99%) | ⚠️ Only if needed |

---

## 📊 Decision Matrix

**Use Auto-Scheduling when:**
- ✅ Creating standard appointment reminders
- ✅ Following organizational policies
- ✅ Need automatic scheduling
- ✅ Want resilient, production-ready solution

**Use Manual CRUD API when:**
- ⚠️ Need custom reminder logic
- ⚠️ Override policy for specific cases
- ⚠️ Local storage required
- ⚠️ Testing/debugging

**Default Recommendation:** Use Auto-Scheduling for all standard use cases.

---

## 🚀 Getting Started

### For Standard Reminders (Recommended)

No action needed! Reminders are automatically created when appointments are scheduled.

### For Manual Reminders (Optional)

1. Run migration: `migrations/017_create_appointment_reminders.sql`
2. Wire up routes in `main.ts`
3. Register dependencies in DI container
4. Use CRUD API endpoints

---

## 📚 References

- **Auto-Scheduling Implementation:** `src/infrastructure/events/handlers/AppointmentSchedulerIntegrationHandler.ts`
- **Scheduler Service Integration:** `src/infrastructure/adapters/RemoteSchedulerAdapter.ts`
- **Outbox Pattern:** `src/infrastructure/outbox/OutboxPublisherWorker.ts`
- **Reminder Policy:** `src/config/reminder-policy.json`
- **Manual CRUD API:** `src/presentation/controllers/ReminderController.ts`

---

**Last Updated:** 2025-01-11
**Status:** Auto-Scheduling ✅ Production Ready | Manual CRUD API ⚠️ Optional

