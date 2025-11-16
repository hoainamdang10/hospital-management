# Verify Cron Job - Local Development Guide

## ✅ CÓ - Cron Job chạy khi dùng `npm run dev`

Khi chạy Notifications Service với `npm run dev`, ReminderCronJob **TỰ ĐỘNG KHỞI ĐỘNG** và chạy mỗi 5 phút một lần.

---

## Architecture

```
┌──────────────────────────────────────────┐
│  npm run dev (nodemon src/index.ts)     │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Express HTTP Server (Port 3011)   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  RabbitMQ Event Consumers          │ │
│  │  - AppointmentEventConsumer        │ │
│  │  - BillingEventConsumer            │ │
│  │  - StaffEventConsumer              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  ReminderCronJob ⏰                 │ │
│  │  - Runs every 5 minutes            │ │
│  │  - Checks for due reminders        │ │
│  │  - Sends notifications             │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Tất cả chạy trong 1 process Node.js!**

---

## Startup Flow (index.ts)

```typescript
// Line 209-211 in src/index.ts
await initializeReminderCronJob(container);
console.log('✅ Reminder Cron Job initialized');
```

**Khi service start:**

1. ✅ Load environment variables
2. ✅ Initialize DI container
3. ✅ Connect to EventBus (RabbitMQ)
4. ✅ Initialize Event Consumers
5. ✅ **Initialize Reminder Cron Job** ← Tự động start
6. ✅ Start Express HTTP server

---

## Environment Variables (Cron Job)

**Location**: `backend/services-v2/notifications-service/.env`

```env
# Cron Job Configuration
REMINDER_CRON_ENABLED=true                    # Default: true
REMINDER_CRON_EXPRESSION=*/5 * * * *          # Default: Every 5 minutes
REMINDER_BATCH_SIZE=100                       # Default: 50
```

**Giá trị mặc định** (setup.ts Line 621-623):
- `REMINDER_CRON_EXPRESSION`: `*/5 * * * *` (mỗi 5 phút)
- `REMINDER_BATCH_SIZE`: `50` reminders per run
- `REMINDER_CRON_ENABLED`: `true` (enabled by default)

---

## How to Verify Cron Job

### 1. Start Notifications Service

```bash
# In backend/services-v2/notifications-service
npm run dev
```

### 2. Check Startup Logs

Bạn sẽ thấy logs này:

```
⏰ Initializing Reminder Cron Job...
[ReminderCronJob] Starting with schedule: */5 * * * *
[ReminderCronJob] Started successfully
✅ Reminder Cron Job started successfully
📋 Cron job will check for due reminders every 5 minutes
```

### 3. Wait 5 Minutes

Sau 5 phút, bạn sẽ thấy logs:

```
[ReminderCronJob] Starting reminder processing run
[ReminderCronJob] Found 0 due reminder(s)
[ReminderCronJob] Completed run in 123ms: 0 sent, 0 failed
```

Hoặc nếu có reminders:

```
[ReminderCronJob] Starting reminder processing run
[ReminderCronJob] Found 3 due reminder(s)
[ReminderCronJob] Successfully sent reminder xxx for appointment yyy
[ReminderCronJob] Completed run in 456ms: 3 sent, 0 failed
```

### 4. Check Health Endpoint

```bash
curl http://localhost:3011/health
```

Response:
```json
{
  "status": "healthy",
  "service": "notifications-service",
  "version": "2.0.0-simplified",
  "uptime": 300.123
}
```

---

## Manual Trigger (For Testing)

Cron job **KHÔNG có REST API endpoint** để trigger manually. Nhưng bạn có thể:

### Option 1: Restart Service

```bash
# Ctrl+C to stop
npm run dev  # Start again, cron will run immediately if there are due reminders
```

### Option 2: Change Cron Expression

**File**: `.env`

```env
# Run every 1 minute (for testing)
REMINDER_CRON_EXPRESSION=*/1 * * * *
```

Restart service:
```bash
npm run dev
```

### Option 3: Create Test Reminder in Database

```sql
-- Insert test reminder due NOW
INSERT INTO notifications_schema.appointment_reminders (
  id,
  appointment_id,
  tenant_id,
  patient_id,
  patient_name,
  patient_phone,
  patient_email,
  appointment_date,
  appointment_time,
  reminder_type,
  scheduled_send_time,  -- Set to NOW
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test-appointment-001',
  'hospital-1',
  'test-patient-001',
  'Nguyễn Văn Test',
  '+84912345678',
  'test@example.com',
  CURRENT_DATE + INTERVAL '1 day',
  '09:00:00',
  '24H_BEFORE',
  NOW(),  -- Due NOW!
  'PENDING',
  NOW(),
  NOW()
);
```

Trong vòng 5 phút, cron job sẽ pick up và send reminder này.

---

## Disable Cron Job (If Needed)

**File**: `.env`

```env
REMINDER_CRON_ENABLED=false
```

Restart service:
```bash
npm run dev
```

Logs sẽ hiện:
```
⏰ Initializing Reminder Cron Job...
[ReminderCronJob] Disabled via config, not starting
✅ Reminder Cron Job initialized
```

---

## Troubleshooting

### Cron job không chạy?

**Check logs:**
```
[ReminderCronJob] Disabled via config, not starting
```
→ Set `REMINDER_CRON_ENABLED=true` trong `.env`

**Check environment:**
```bash
# In notifications-service directory
cat .env | grep REMINDER_CRON
```

### Cron job chạy nhưng không send reminders?

**Check database:**
```sql
-- Check pending reminders
SELECT * FROM notifications_schema.appointment_reminders
WHERE status = 'PENDING'
AND scheduled_send_time <= NOW()
ORDER BY scheduled_send_time ASC
LIMIT 10;
```

**Check SendGrid/Twilio config:**
```bash
# In .env
cat .env | grep SENDGRID
cat .env | grep TWILIO
```

### Logs không hiện?

**Check console output:**
```bash
npm run dev 2>&1 | grep -i "reminder\|cron"
```

---

## Differences: npm run dev vs Docker

| Feature | npm run dev | Docker |
|---------|-------------|--------|
| **Cron Job** | ✅ Auto-starts | ✅ Auto-starts |
| **Environment** | Local `.env` | Docker `.env.docker` |
| **Logs** | Console output | `docker logs hospital-notifications-v2` |
| **Hot Reload** | ✅ Yes (nodemon) | ❌ No (restart container) |
| **Database** | Local Supabase URL | Same Supabase URL |
| **Dependencies** | Must install Redis/RabbitMQ locally | ✅ Included in docker-compose |

---

## Production Deployment

Khi deploy production:

1. ✅ Set `NODE_ENV=production`
2. ✅ Set `REMINDER_CRON_ENABLED=true`
3. ✅ Monitor logs for cron execution
4. ✅ Set up alerts for failed reminders
5. ✅ Configure log aggregation (CloudWatch, ELK)

**Container logs:**
```bash
docker logs hospital-notifications-v2 -f | grep "ReminderCronJob"
```

---

## Summary

**✅ CÓ - Cron job chạy khi dùng `npm run dev`**

- Tự động start khi service khởi động
- Chạy mỗi 5 phút (configurable)
- Logs hiển thị trong console
- Có thể disable bằng env var
- Graceful shutdown khi Ctrl+C

**Không cần:**
- ❌ Separate consumer process
- ❌ Manual trigger via API
- ❌ External scheduler service

**Tất cả tích hợp trong 1 service!**

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-11  
**Author**: Hospital Management Team
