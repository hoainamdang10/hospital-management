# 🔧 Appointments Service - Fix Scripts

## Overview

Các scripts này giải quyết 3 critical issues:
1. ❌ **CQRS Read Model NOT Syncing** - 0 records in read model
2. ❌ **Event Consumers NOT Running** - inbox_events empty
3. ❌ **Read Models Empty** - patient/provider read models empty

---

## Prerequisites

1. **Docker Desktop** running
2. **Infrastructure services** running (Redis + RabbitMQ):
   ```bash
   cd D:/hospital-management-V2/backend/services-v2
   npm run dev:infrastructure
   ```
3. **Environment variables** configured in `.env`:
   ```env
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
   RABBITMQ_MANAGEMENT_URL=http://localhost:15673
   RABBITMQ_USER=admin
   RABBITMQ_PASS=admin
   ```

---

## Fix Roadmap (Step-by-Step)

### ✅ Step 1: Start Infrastructure

```bash
# Start Docker Desktop (if not running)

# Start Redis + RabbitMQ
cd D:/hospital-management-V2/backend/services-v2
npm run dev:infrastructure

# Wait 10 seconds for services to start

# Verify
docker ps | findstr "redis\|rabbitmq"
```

**Expected Output:**
```
hospital-redis-v2      Up 10 seconds   0.0.0.0:6380->6379/tcp
hospital-rabbitmq-v2   Up 10 seconds   0.0.0.0:5673->5672/tcp, 0.0.0.0:15673->15672/tcp
```

---

### ✅ Step 2: Verify RabbitMQ

```bash
cd D:/hospital-management-V2/backend/services-v2/appointments-service

# Install dependencies (if needed)
npm install

# Run verification script
npx ts-node scripts/verify-event-bus.ts
```

**Expected Output:**
```
📡 Step 1: Checking RabbitMQ connection...
   ✅ RabbitMQ is running
   Version: 3.x.x

📤 Step 2: Checking exchanges...
   ✅ Exchange 'hospital.events' exists

📥 Step 3: Checking queues...
   ✅ Queue 'appointments.appointments' exists
   ✅ Queue 'appointments.patient-events' exists
   ✅ Queue 'appointments.provider-events' exists
```

**If queues are missing:**
```bash
# Start appointments service to create queues
npm run dev
```

---

### ✅ Step 3: Backfill Read Model

This syncs 1,792 appointments from write model → read model.

```bash
cd D:/hospital-management-V2/backend/services-v2/appointments-service

# Run backfill script
npx ts-node scripts/backfill-read-model.ts
```

**Expected Output:**
```
📊 Step 1: Checking current state...
   Write Model (appointments): 1792 records
   Read Model (appointment_read_model): 0 records
   Gap: 1792 records need sync

📥 Step 2: Fetching 1792 appointments...
   Processing batch 1: 100 records
   Progress: 100/1792 (5%)
   ...
   Progress: 1792/1792 (100%)

✅ BACKFILL COMPLETED
   Total Processed: 1792
   Success: 1792
   Failed: 0
```

**Verification:**
```sql
-- Check in Supabase SQL Editor
SELECT COUNT(*) FROM appointments_schema.appointments;
-- Should show: 1792

SELECT COUNT(*) FROM appointments_schema.appointment_read_model;
-- Should show: 1792
```

---

### ✅ Step 4: Start Appointments Service

```bash
cd D:/hospital-management-V2/backend/services-v2/appointments-service

# Start service
npm run dev
```

**Expected Logs:**
```
[EventSubscriptions] ✅ All subscriptions ready
[PatientEventConsumer] ✅ Started listening for patient events
[ProviderEventConsumer] ✅ Started listening for provider events
[AppointmentReadModelEventHandler] ✅ Ready to sync read model
🚀 Appointments Service started on port 3024
```

---

### ✅ Step 5: Test Read Model Sync

Test if new appointments automatically sync to read model.

```bash
cd D:/hospital-management-V2/backend/services-v2/appointments-service

# Run test script
npx ts-node scripts/test-read-model-sync.ts
```

**Expected Output:**
```
📊 Step 1: Getting baseline counts...
   Write Model: 1792 records
   Read Model: 1792 records

📝 Step 2: Creating test appointment via API...
   ✅ Appointment created: abc-123-def

⏳ Step 3: Waiting for event processing (5 seconds)...

🔍 Step 4: Checking read model sync...
   ✅ Read model synced successfully!

📊 Step 5: Getting final counts...
   Write Model: 1792 → 1793 (+1)
   Read Model: 1792 → 1793 (+1)

✅ TEST PASSED - Read model sync is working!
```

---

### ✅ Step 6: Verify Event Consumers (Patient/Provider)

Check if Patient and Provider events are flowing.

```bash
# Check inbox_events table
```

**SQL Query:**
```sql
-- Should have incoming events from Patient/Provider services
SELECT event_type, COUNT(*) 
FROM appointments_schema.inbox_events 
GROUP BY event_type;

-- Expected results:
-- patient.patient.registered: 1592
-- provider.staff.registered: 1032
```

**If inbox_events is still empty:**
1. Check if Patient Registry Service is running
2. Check if Provider Staff Service is running
3. Verify they are publishing to RabbitMQ:
   ```bash
   # Check their logs for "Event published to RabbitMQ"
   ```

---

### ✅ Step 7: Verify Patient/Provider Read Models

```sql
-- Check patient read model
SELECT COUNT(*) FROM appointments_schema.patient_read_model;
-- Expected: ~1592

-- Check provider read model
SELECT COUNT(*) FROM appointments_schema.provider_read_model;
-- Expected: ~1032
```

**If read models are still empty:**

This means Patient/Provider services are not publishing events. Fix:

```bash
# 1. Start Patient Registry Service
cd D:/hospital-management-V2/backend/services-v2/patient-registry-service
npm run dev

# 2. Start Provider Staff Service
cd D:/hospital-management-V2/backend/services-v2/provider-staff-service
npm run dev

# 3. Wait for them to publish existing records to RabbitMQ
# 4. Check inbox_events again
```

---

## Troubleshooting

### Issue: "Cannot connect to RabbitMQ"

**Fix:**
```bash
# Check if RabbitMQ is running
docker ps | findstr rabbitmq

# If not running
cd D:/hospital-management-V2/backend/services-v2
docker compose -f docker-compose.v2.yml up -d rabbitmq-v2

# Check RabbitMQ UI
start http://localhost:15673
# Login: admin / admin
```

### Issue: "Queues not found"

**Fix:**
```bash
# Start appointments service to create queues
cd D:/hospital-management-V2/backend/services-v2/appointments-service
npm run dev

# Queues are created automatically on startup
```

### Issue: "Backfill failed - Cannot find patient/provider data"

This is expected if patient/provider read models are empty.

**Fix:**
```bash
# Run backfill again after Patient/Provider services publish events
npx ts-node scripts/backfill-read-model.ts
```

### Issue: "Test appointment creation failed - 401 Unauthorized"

**Fix:**
```typescript
// In test-read-model-sync.ts, replace Authorization header with valid JWT
headers: {
  'Authorization': 'Bearer YOUR_VALID_JWT_TOKEN'
}
```

Or test manually via Supabase:
```sql
-- Insert test appointment
INSERT INTO appointments_schema.appointments (...)
VALUES (...);

-- Wait 5 seconds

-- Check read model
SELECT * FROM appointments_schema.appointment_read_model
WHERE appointment_id = 'YOUR_TEST_ID';
```

---

## Success Criteria

After running all scripts, you should have:

- ✅ RabbitMQ running with all queues and bindings
- ✅ **1,792 records** in `appointment_read_model` (synced from write model)
- ✅ **~1,592 records** in `patient_read_model` (synced from Patient Service)
- ✅ **~1,032 records** in `provider_read_model` (synced from Provider Service)
- ✅ **Events flowing** in `inbox_events` table
- ✅ **New appointments automatically sync** to read model
- ✅ **Service logs show** event subscriptions active

---

## Final Verification

```bash
# Run all health checks
curl http://localhost:3024/health

# Check service logs
npm run logs:appointments

# Check database
# Run these SQL queries in Supabase:
SELECT 
  (SELECT COUNT(*) FROM appointments_schema.appointments) as write_model,
  (SELECT COUNT(*) FROM appointments_schema.appointment_read_model) as read_model,
  (SELECT COUNT(*) FROM appointments_schema.patient_read_model) as patient_cache,
  (SELECT COUNT(*) FROM appointments_schema.provider_read_model) as provider_cache,
  (SELECT COUNT(*) FROM appointments_schema.inbox_events) as inbox_events,
  (SELECT COUNT(*) FROM appointments_schema.outbox_events) as outbox_events;

-- Expected results:
-- write_model: 1792
-- read_model: 1792
-- patient_cache: ~1592
-- provider_cache: ~1032
-- inbox_events: >0
-- outbox_events: 325
```

---

## Production Deployment Checklist

Once all fixes are complete:

- [ ] All 3 critical issues resolved
- [ ] Read model sync working (write → read)
- [ ] Event consumers working (patient/provider → inbox → read models)
- [ ] Integration tests added (80%+ coverage)
- [ ] Load testing completed (100+ concurrent appointments)
- [ ] Observability verified (logs, metrics, health checks)
- [ ] Documentation updated
- [ ] Security audit completed
- [ ] Deployment plan created

**Estimated Time**: 3-5 days

---

## Support

If you encounter issues:

1. Check service logs: `npm run logs:appointments`
2. Check RabbitMQ UI: http://localhost:15673
3. Check Supabase logs
4. Review this README troubleshooting section

**Created**: 2025-11-01  
**Version**: 1.0.0
