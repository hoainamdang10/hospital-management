# Reminder Implementation Guide

## ⚠️ IMPORTANT: Read This First

**Before implementing reminder functionality, understand that Appointments Service ALREADY has a complete reminder system.**

### Quick Decision Guide

**Q: I need to send reminders for appointments**
→ ✅ Use existing auto-scheduling (no code needed)

**Q: I need custom reminder logic**
→ ⚠️ Consider if it can be added to reminder-policy.json first
→ ⚠️ Only use manual CRUD API if policy cannot handle it

**Q: I need to query reminder history**
→ ✅ Use Scheduler Service API (for auto-generated reminders)
→ ⚠️ Use manual CRUD API only for manual reminders

---

## 🏗️ Architecture Overview

### Existing System (Production Ready)

```
┌─────────────────────────────────────────────────────────────┐
│                    Appointments Service                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Appointment Created                                          │
│         ↓                                                     │
│  AppointmentScheduledEvent                                    │
│         ↓                                                     │
│  AppointmentScheduledSchedulerHandler                         │
│         ↓                                                     │
│  Apply Reminder Policy (reminder-policy.json)                 │
│         ↓                                                     │
│  Enqueue to Outbox (SchedulerReminderCreate)                  │
│         ↓                                                     │
│  OutboxPublisherWorker                                        │
│         ↓                                                     │
│  RemoteSchedulerAdapter (HTTP Client)                         │
│         ↓                                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    Scheduler Service                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Store in scheduler.schedules                                 │
│         ↓                                                     │
│  Trigger at scheduled time                                    │
│         ↓                                                     │
│  Publish reminder event to RabbitMQ                           │
│         ↓                                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  Notifications Service                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Consume reminder event                                       │
│         ↓                                                     │
│  Send via channels (EMAIL, SMS, PUSH)                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Manual CRUD API (Optional)

```
┌─────────────────────────────────────────────────────────────┐
│                    Appointments Service                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /api/v1/appointments/:id/reminders                      │
│         ↓                                                     │
│  ReminderController                                           │
│         ↓                                                     │
│  CreateAppointmentReminderUseCase                             │
│         ↓                                                     │
│  SupabaseAppointmentReminderRepository                        │
│         ↓                                                     │
│  Store in appointment_reminders table                         │
│                                                               │
│  NOTE: Does NOT trigger actual reminder delivery              │
│  This is just local storage for metadata                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Before You Start: Checklist

Before implementing any reminder functionality, check:

- [ ] Have you checked `src/infrastructure/events/handlers/AppointmentSchedulerIntegrationHandler.ts`?
- [ ] Have you reviewed `src/config/reminder-policy.json`?
- [ ] Have you checked if Scheduler Service is running?
- [ ] Have you verified `scheduler.schedules` table in Supabase?
- [ ] Can your use case be handled by modifying the reminder policy?
- [ ] Do you really need manual reminder management?

---

## 📖 Common Scenarios

### Scenario 1: Add New Reminder Window

**Example:** Add 7-day advance reminder for ROUTINE appointments

**Solution:** Modify `reminder-policy.json` ✅

```json
{
  "default": {
    "ROUTINE": [
      { "window": "7d", "channels": ["EMAIL"] },  // ← Add this
      { "window": "24h", "channels": ["EMAIL", "PUSH"] },
      { "window": "2h", "channels": ["PUSH"] }
    ]
  }
}
```

**No code changes needed!** Auto-scheduling will pick up the new policy.

### Scenario 2: Add Tenant-Specific Policy

**Example:** Hospital A wants different reminder windows

**Solution:** Add tenant override in `reminder-policy.json` ✅

```json
{
  "default": { ... },
  "tenants": {
    "hospital-a": {
      "ROUTINE": [
        { "window": "48h", "channels": ["EMAIL", "SMS"] },
        { "window": "4h", "channels": ["SMS"] }
      ]
    }
  }
}
```

### Scenario 3: Custom Reminder for Specific Patient

**Example:** VIP patient wants SMS reminder 1 hour before

**Solution:** Use Manual CRUD API ⚠️

```bash
POST /api/v1/appointments/:appointmentId/reminders
{
  "reminderType": "CUSTOM",
  "reminderChannel": "SMS",
  "sendBeforeMinutes": 60,
  "recipientType": "PATIENT",
  "recipientContact": "+84901234567",
  "subject": "VIP Appointment Reminder",
  "message": "Your appointment is in 1 hour",
  "priority": "HIGH"
}
```

**Note:** This only stores metadata. You need to implement delivery logic separately.

### Scenario 4: Query Reminder History

**For auto-generated reminders:**
```bash
# Use Scheduler Service API
GET http://scheduler-service:3030/api/v1/schedules?ownerService=appointments&ownerResourceId=appt-123
```

**For manual reminders:**
```bash
# Use Manual CRUD API
GET /api/v1/appointments/appt-123/reminders
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Mistake 1: Creating Duplicate Reminder System

**Wrong:**
```typescript
// DON'T: Implement custom reminder scheduling
async function scheduleReminder(appointment: Appointment) {
  // Custom scheduling logic...
  await sendReminderAt(appointment.startTime - 24h);
}
```

**Right:**
```typescript
// DO: Let auto-scheduling handle it
// Just create the appointment, reminders are automatic
await createAppointmentUseCase.execute(command);
// That's it! Reminders will be created automatically
```

### ❌ Mistake 2: Ignoring Reminder Policy

**Wrong:**
```typescript
// DON'T: Hardcode reminder windows
const reminders = [
  { window: '24h', channel: 'EMAIL' },
  { window: '2h', channel: 'SMS' }
];
```

**Right:**
```json
// DO: Use reminder-policy.json
{
  "default": {
    "ROUTINE": [
      { "window": "24h", "channels": ["EMAIL"] },
      { "window": "2h", "channels": ["SMS"] }
    ]
  }
}
```

### ❌ Mistake 3: Not Checking Existing Integration

**Wrong:**
```typescript
// DON'T: Implement Scheduler Service client from scratch
class MySchedulerClient {
  async createSchedule() { ... }
}
```

**Right:**
```typescript
// DO: Use existing RemoteSchedulerAdapter
import { RemoteSchedulerAdapter } from '../infrastructure/adapters/RemoteSchedulerAdapter';

const scheduler = new RemoteSchedulerAdapter({
  baseUrl: process.env.SCHEDULER_SERVICE_URL,
  timeout: 5000
});
```

---

## 🛠️ Implementation Steps

### For Standard Reminders (Recommended)

**Step 1:** Verify auto-scheduling is working
```bash
# Check Scheduler Service is running
curl http://localhost:3030/health

# Check database
SELECT * FROM scheduler.schedules 
WHERE owner_service = 'appointments' 
LIMIT 5;
```

**Step 2:** Modify reminder policy if needed
```bash
# Edit policy file
vim src/config/reminder-policy.json

# Restart service to pick up changes
npm run dev
```

**Step 3:** Test
```bash
# Create appointment
POST /api/v1/appointments
{
  "patientId": "patient-123",
  "doctorId": "doctor-456",
  "appointmentDate": "2025-01-15",
  "appointmentTime": "14:30:00",
  "priority": "ROUTINE"
}

# Check reminders were created
SELECT * FROM scheduler.schedules 
WHERE owner_resource_id = '<appointmentId>';
```

### For Manual Reminders (Optional)

**Step 1:** Run migration (if not already done)
```bash
# Apply migration
psql -h <supabase-host> -U postgres -d postgres -f migrations/017_create_appointment_reminders.sql
```

**Step 2:** Wire up routes in main.ts
```typescript
import { createReminderRoutes } from './presentation/routes/reminder.routes';

// In main.ts
app.use('/api/v1/appointments', createReminderRoutes(reminderController));
```

**Step 3:** Register dependencies
```typescript
// In DI container
container.register('ReminderRepository', SupabaseAppointmentReminderRepository);
container.register('CreateReminderUseCase', CreateAppointmentReminderUseCase);
// ... etc
```

**Step 4:** Test
```bash
# Create manual reminder
POST /api/v1/appointments/appt-123/reminders
{
  "reminderType": "CUSTOM",
  "reminderChannel": "EMAIL",
  "sendBeforeMinutes": 60
}

# Query manual reminders
GET /api/v1/appointments/appt-123/reminders
```

---

## 📚 Further Reading

- [REMINDER_ARCHITECTURE.md](./REMINDER_ARCHITECTURE.md) - Detailed architecture documentation
- [AppointmentSchedulerIntegrationHandler.ts](../src/infrastructure/events/handlers/AppointmentSchedulerIntegrationHandler.ts) - Auto-scheduling implementation
- [RemoteSchedulerAdapter.ts](../src/infrastructure/adapters/RemoteSchedulerAdapter.ts) - Scheduler Service client
- [reminder-policy.json](../src/config/reminder-policy.json) - Reminder policy configuration

---

**Last Updated:** 2025-01-11
**Recommendation:** Use auto-scheduling for 99% of use cases. Only use manual CRUD API for special cases.

