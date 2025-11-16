# Notifications Service - Docker Setup Guide

## Architecture After Refactor

**MVP Focus**: Appointment Booking + Payment Flow (PENDING_PAYMENT → PAID/EXPIRED in 30 minutes)

### What Changed:

1. ✅ **Removed Scheduler Service** - Functionality moved to internal ReminderCronJob
2. ✅ **Removed Notifications Consumer** - Cron job runs inside notifications-service container
3. ✅ **Simplified Scope** - Only handle appointment reminders & payment notifications
4. ✅ **Fixed Database Schema** - Changed from `notification_schema` to `notifications_schema`

---

## Docker Configuration

### Services:

**1. notifications-service** (Port 3011)
- **Purpose**: API server + RabbitMQ event consumer + Cron job scheduler
- **Components**:
  - REST API for notification management
  - AppointmentEventConsumer (subscribes to appointment events)
  - BillingEventConsumer (subscribes to payment events)
  - ReminderCronJob (runs every 5 minutes to send due reminders)

**2. ~~notifications-consumer~~** (REMOVED)
- Previously: Separate container for RabbitMQ consumer
- Now: Integrated into main service

---

## Environment Variables

### Required:

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_SCHEMA=notifications_schema

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@hospital.vn
SENDGRID_FROM_NAME=Bệnh viện Đa khoa

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+84xxx

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# Cron Job
REMINDER_CRON_ENABLED=true
REMINDER_CRON_EXPRESSION=*/5 * * * *
REMINDER_BATCH_SIZE=100
```

---

## Docker Commands

### Start Notifications Service:

```bash
# With supporting services (Redis, RabbitMQ, Notifications)
docker-compose -f docker-compose.v2.yml --profile supporting up -d

# Or with all services
docker-compose -f docker-compose.v2.yml --profile full up -d
```

### View Logs:

```bash
# Notifications service logs
docker-compose -f docker-compose.v2.yml logs -f notifications-service

# Check cron job execution
docker logs hospital-notifications-v2 -f | grep "ReminderCronJob"
```

### Health Check:

```bash
curl http://localhost:3011/health
```

---

## RabbitMQ Event Subscriptions

Notifications Service subscribes to:

### 1. Appointment Events (appointments.*)
- `appointments.appointment.scheduled` → Send booking request notification + Create 3 reminders
- `appointments.appointment.confirmed` → Send confirmation + Create reminders if not exist
- `appointments.appointment.cancelled` → Cancel all pending reminders

### 2. Billing Events (billing.*)
- `billing.payment.completed` → Send payment success notification

---

## Cron Job Details

**ReminderCronJob Configuration:**

- **Schedule**: Every 5 minutes (*/5 * * * *)
- **Batch Size**: 100 reminders per run
- **Query**: `SELECT * FROM notifications_schema.appointment_reminders WHERE status='PENDING' AND scheduled_send_time <= NOW() LIMIT 100`
- **Process**:
  1. Mark reminder as PROCESSING
  2. Send notification via SendNotificationUseCase
  3. Mark as SENT or FAILED
  4. Retry failed reminders with exponential backoff

**Retry Logic:**
- Max retries: 3
- Backoff: 5 minutes, 10 minutes, 20 minutes

---

## Migration Guide (Old → New)

### Before (Scheduler Service Architecture):
```
[Appointments Service] → [Scheduler Service] → [Notifications Consumer] → [Notifications Service]
```

### After (Cron Job Architecture):
```
[Appointments Service] → [RabbitMQ] → [Notifications Service (Consumer + Cron Job)]
```

### Benefits:
1. ✅ Simpler architecture (one less service)
2. ✅ Lower resource usage
3. ✅ Easier to debug (all logs in one place)
4. ✅ No inter-service HTTP calls for scheduling

---

## Troubleshooting

### Cron job not running:

```bash
# Check environment variable
docker exec hospital-notifications-v2 env | grep REMINDER_CRON

# Check service logs
docker logs hospital-notifications-v2 | grep "ReminderCronJob"
```

### Reminders not being sent:

```bash
# Check database
docker exec hospital-notifications-v2 node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('appointment_reminders').select('*').eq('status', 'PENDING').then(console.log);
"

# Check RabbitMQ
# Visit http://localhost:15673 (admin/admin)
# Check queue: appointments.notifications
```

---

## Production Checklist

- [ ] Set `REMINDER_CRON_ENABLED=true`
- [ ] Configure SendGrid API key
- [ ] Configure Twilio credentials
- [ ] Set `DATABASE_SCHEMA=notifications_schema`
- [ ] Monitor cron job execution in logs
- [ ] Set up alerts for failed reminders
- [ ] Configure log aggregation (ELK, CloudWatch)

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-11  
**Author**: Hospital Management Team
