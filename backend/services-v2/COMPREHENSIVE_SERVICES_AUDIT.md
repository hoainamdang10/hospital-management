# Comprehensive Services Audit Report

**Date**: 2025-10-31  
**Services**: Appointments Service, Scheduler Service  
**Audit Scope**: Code Quality, Database Schema, Configuration, Integration

---

## Executive Summary

### ✅ FIXED ISSUES (Completed in this session)
1. ✅ **Protocol Synchronization**: RemoteSchedulerAdapter ↔ Scheduler API aligned
2. ✅ **Outbox Payload Structure**: All 3 handlers fixed (Scheduled, Cancelled, Rescheduled)
3. ✅ **Rate Limit Config**: Both services read from environment variables
4. ✅ **Migration Conflicts**: Scheduler migrations now sequential (001-007)

### ⚠️ CRITICAL ISSUES (Require immediate attention)

#### 1. **SCHEMA NAMING INCONSISTENCY** 🔴 CRITICAL

**Problem**: Conflicting schema names across migrations and code

**Details**:
- Migration `001_create_scheduling_schema.sql` creates `scheduling_schema`
- Migration `012_create_read_models.sql` uses `appointments_schema`
- Code repositories mix both:
  - `SupabaseAppointmentRepository`: Uses `appointments_schema`
  - `SupabaseAppointmentReadModelRepository`: Uses `scheduling_schema`
  - `OutboxRepository`: Uses `appointments_schema`
  - `InboxRepository`: Uses `appointments_schema`

**Impact**:
- 🔴 Service will fail to start if wrong schema is used
- 🔴 Database queries will fail (tables not found)
- 🔴 Read model sync will break

**Recommendation**:
```sql
-- OPTION A: Rename scheduling_schema to appointments_schema
ALTER SCHEMA scheduling_schema RENAME TO appointments_schema;

-- OPTION B: Update all code to use scheduling_schema
-- Change all repository schema config to 'scheduling_schema'
```

**Affected Files**:
- `migrations/001_create_scheduling_schema.sql` (creates scheduling_schema)
- `migrations/012_create_read_models.sql` (uses appointments_schema)
- `src/infrastructure/persistence/SupabaseAppointmentRepository.ts` (appointments_schema)
- `src/infrastructure/persistence/SupabaseAppointmentReadModelRepository.ts` (scheduling_schema)
- `src/infrastructure/outbox/OutboxRepository.ts` (appointments_schema)
- `src/infrastructure/inbox/InboxRepository.ts` (appointments_schema)

---

## 📋 Detailed Findings

### Appointments Service

#### A. Code Quality

**TODOs Found: 15+ items** (Medium Priority)

**Authorization Checks Missing**:
```typescript
// Files with missing authorization:
- TransferAppointment.use-case.ts:214
- StartAppointment.use-case.ts:148
- RescheduleAppointment.use-case.ts:264
- MarkAsNoShow.use-case.ts:163
- ManageAppointmentReminders.use-case.ts:216
- LeaveQueue.use-case.ts:94
- GetQueueStatus.use-case.ts:160
- GetAppointmentStatistics.use-case.ts:249
- GetAppointmentHistory.use-case.ts:209
- CreateEmergencyAppointment.use-case.ts:158
- CheckInAppointment.use-case.ts:157
- CallNextPatient.use-case.ts:108
- BulkRescheduleAppointments.use-case.ts:156
```

**Security Impact**: 
- Users may access/modify appointments without proper authorization
- No RBAC enforcement at use case level

**Recommendation**:
```typescript
// Example implementation:
async authorize(request: TransferAppointmentRequest, userId: string): Promise<boolean> {
  const user = await this.identityService.getUser(userId);
  const appointment = await this.repository.findById(request.appointmentId);
  
  // Only admin or original doctor can transfer
  return user.role === 'ADMIN' || 
         user.role === 'SUPER_ADMIN' ||
         appointment.doctorId === userId;
}
```

**Other TODOs**:
- `FindAvailableTimeSlotsUseCase.ts:15`: Add multi-tenancy filtering
- `ManageAppointmentReminders.use-case.ts:126-144`: Scheduler Service integration (currently stub)
- `GetAppointmentStatistics.use-case.ts:102`: Get all appointments in range (not just by doctor)

#### B. Database Schema

**Migration Status**:
```
✅ 001_create_scheduling_schema.sql
✅ 002_add_security_policies.sql
✅ 003_add_missing_indexes.sql
✅ 004_create_outbox_events.sql
✅ 005_add_timestamptz_and_exclusion_constraint.sql
⚠️ 012_create_read_models.sql (schema name mismatch)
```

**Schema Issues**:
1. **Inconsistent naming**: `scheduling_schema` vs `appointments_schema`
2. **Read models target wrong schema**: Migration 012 uses `appointments_schema` but base schema is `scheduling_schema`

#### C. Configuration

**Environment Variables** (from `.env.example`):

**Required**:
```env
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co ✅
SUPABASE_SERVICE_ROLE_KEY=*** ✅
SCHEDULER_SERVICE_URL=http://localhost:3030 ✅
SCHEDULER_API_KEY=*** ✅ (Present in .env)
```

**Optional (with defaults)**:
```env
PATIENT_SERVICE_URL=http://localhost:3023
PROVIDER_SERVICE_URL=http://localhost:3022
RABBITMQ_URL=amqp://admin:admin@localhost:5673
REDIS_URL=redis://localhost:6380
RATE_LIMIT_WINDOW_MS=900000 (15 min)
RATE_LIMIT_MAX_REQUESTS=100
```

**Status**: ✅ Configuration complete

#### D. Integration Contracts

**Appointments → Scheduler** ✅ FIXED

**Request Format** (now aligned):
```typescript
{
  tenantId: string,
  dedupKey: string,
  ownerService: 'appointments',
  ownerResourceType: 'APPOINTMENT',
  ownerResourceId: string,
  topicOrCommand: string,
  scheduleType: 'ONCE' | 'CRON' | 'RRULE',
  startAtUtc?: string,
  cronExpr?: string,
  rrule?: string,
  timezone?: string,
  payloadJson: object,
  maxRuns?: number,
  jitterMs?: number,
  retryPolicy?: {...}
}
```

**Fixed Files**:
- ✅ `RemoteSchedulerAdapter.ts`: Interface updated to flat structure
- ✅ `AppointmentSchedulerIntegrationHandler.ts`: All 3 handlers fixed
  - AppointmentScheduledSchedulerHandler: Flat payload
  - AppointmentCancelledSchedulerHandler: ownerResourceType/Id split
  - AppointmentRescheduledSchedulerHandler: Both cancel + create fixed

---

### Scheduler Service

#### A. Code Quality

**TODOs Found: 0** ✅ Clean

**Status**: No outstanding code TODOs

#### B. Database Schema

**Migration Status**:
```
✅ 001_create_scheduler_schema.sql
✅ 002_add_missing_constraints.sql
✅ 003_add_unique_constraint_schedule_runs.sql
✅ 004_add_dead_letters_unroutable_columns.sql
✅ 005_optimize_schema_indexes_and_fks.sql
✅ 006_add_execute_run_transactional_function.sql
✅ 007_add_acquire_due_runs_function.sql (renamed from 002)
```

**Status**: ✅ Migrations sequential and clean

**Schema**: `scheduler`

**Key Tables**:
- ✅ `schedules`: Schedule definitions (ONCE/CRON/RRULE)
- ✅ `schedule_runs`: Materialized fire times
- ✅ `outbox`: Transactional outbox pattern
- ✅ `dead_letters`: Failed runs
- ✅ `worker_leases`: Distributed locking
- ✅ `schedule_run_executions`: Audit trail

#### C. Configuration

**Environment Variables** (from `.env.example`):

**Required**:
```env
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co ✅
SUPABASE_SERVICE_ROLE_KEY=*** ✅
JWT_SECRET=*** ✅
```

**Worker Configuration**:
```env
COMPONENT=api|materializer|worker|publisher
WORKER_SEGMENT=0-9 (for horizontal scaling)
WORKER_CONCURRENCY=10
WORKER_POLL_INTERVAL=5000ms
WORKER_LEASE_TTL=60000ms
MATERIALIZATION_INTERVAL=60000ms
MATERIALIZATION_LOOKAHEAD_HOURS=48
PUBLISH_BATCH_SIZE=100
```

**Rate Limiting**: ✅ FIXED
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Status**: ✅ Configuration complete

#### D. Docker Compose

**Worker Setup** (from `docker-compose.v2.yml`):

```yaml
✅ scheduler-api: Control plane (port 3030)
✅ scheduler-materializer: Schedule → Run materialization
✅ scheduler-worker-0: Execution worker (segment 0)
✅ scheduler-worker-1: Execution worker (segment 1)
✅ scheduler-worker-2: Execution worker (segment 2)
✅ scheduler-publisher: Outbox → RabbitMQ
```

**Status**: ✅ Complete distributed setup

---

## 🔍 Integration Testing Recommendations

### Test Case 1: Appointment Reminder Scheduling

```bash
# 1. Create appointment
POST /api/appointments
{
  "patientId": "PAT-001",
  "doctorId": "DOC-001",
  "date": "2025-11-15",
  "time": "14:30:00",
  "durationMinutes": 30,
  "priority": "ROUTINE"
}

# 2. Check outbox events
SELECT * FROM appointments_schema.outbox_events 
WHERE event_type = 'SchedulerReminderCreate'
ORDER BY occurred_at DESC LIMIT 5;

# 3. Verify scheduler received schedule
SELECT * FROM scheduler.schedules 
WHERE owner_service = 'appointments'
AND owner_resource_type = 'APPOINTMENT'
ORDER BY created_at DESC LIMIT 5;

# 4. Check materialized runs
SELECT * FROM scheduler.schedule_runs
WHERE status = 'DUE'
AND due_at_utc > NOW()
ORDER BY due_at_utc LIMIT 10;
```

### Test Case 2: Appointment Cancellation

```bash
# 1. Cancel appointment
DELETE /api/appointments/{id}
{
  "reason": "Patient request",
  "cancelledBy": "patient-id"
}

# 2. Verify cancel event in outbox
SELECT * FROM appointments_schema.outbox_events 
WHERE event_type = 'SchedulerReminderCancelByOwner'
ORDER BY occurred_at DESC LIMIT 5;

# 3. Confirm schedules cancelled
SELECT * FROM scheduler.schedules 
WHERE owner_resource_id = '{appointment_id}'
AND status = 'CANCELLED';
```

---

## 📊 Health Check Status

### Appointments Service

**Endpoint**: `http://localhost:3024/health`

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "appointments-service",
  "version": "1.0.0",
  "timestamp": "2025-10-31T00:00:00Z",
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy",
    "scheduler": "healthy"
  }
}
```

### Scheduler Service

**Endpoint**: `http://localhost:3030/health`

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "scheduler-service",
  "timestamp": "2025-10-31T00:00:00Z"
}
```

---

## 🚨 Action Items

### Priority 1: CRITICAL (Do Immediately)

1. **Fix Schema Naming Inconsistency**
   - [ ] Decide: Rename schema or update code
   - [ ] Option A: `ALTER SCHEMA scheduling_schema RENAME TO appointments_schema;`
   - [ ] Option B: Update all repository configs to use `scheduling_schema`
   - [ ] Test all database queries after change
   - [ ] Update migration 012 to match chosen schema name

### Priority 2: HIGH (Do This Week)

2. **Implement Authorization Checks**
   - [ ] Create `IAuthorizationService` interface
   - [ ] Implement RBAC checks in all use cases (15+ files)
   - [ ] Add integration tests for authorization
   - [ ] Document authorization matrix (which roles can do what)

3. **Verify Database Schema on Supabase**
   - [ ] Connect to Supabase via psql or SQL editor
   - [ ] Check which schema actually exists: `\dn` (list schemas)
   - [ ] Verify tables in correct schema: `\dt scheduling_schema.*` or `\dt appointments_schema.*`
   - [ ] Apply missing migrations if needed

### Priority 3: MEDIUM (Do This Month)

4. **Complete ManageAppointmentReminders Integration**
   - [ ] Remove TODOs in `ManageAppointmentReminders.use-case.ts`
   - [ ] Test enable/disable reminders flow
   - [ ] Verify scheduler cancellation works

5. **Improve Test Coverage**
   - [ ] Add integration tests for appointments → scheduler flow
   - [ ] Test CRON/RRULE schedule creation
   - [ ] Test reminder cancellation on appointment cancel
   - [ ] Test rescheduling flow (cancel old + create new)

6. **Fix ESLint Configuration**
   - [ ] Update `.eslintrc.js` to handle TypeScript exports/imports
   - [ ] Run `npm run lint:fix` to auto-fix
   - [ ] Ensure build passes without warnings

---

## 📈 Code Metrics

### Appointments Service

```
Total Files: ~150
TODOs: 15+ (authorization checks)
Migrations: 6 files
Build Status: ✅ Success
Lint Status: ⚠️ Config issues (not blocking)
```

### Scheduler Service

```
Total Files: ~80
TODOs: 0
Migrations: 7 files
Build Status: ✅ Success
Lint Status: ✅ Clean
```

---

## 🎯 Deployment Readiness

### Appointments Service

| Category | Status | Notes |
|----------|--------|-------|
| Code Quality | ⚠️ Medium | Authorization TODOs |
| Database Schema | 🔴 Critical | Schema name mismatch |
| Configuration | ✅ Complete | All env vars present |
| Integration | ✅ Fixed | Protocol aligned with scheduler |
| Build | ✅ Success | TypeScript compiles |
| Tests | ⚠️ Partial | Need authorization tests |

**Recommendation**: ❌ **NOT READY** - Fix schema naming first

### Scheduler Service

| Category | Status | Notes |
|----------|--------|-------|
| Code Quality | ✅ Clean | No TODOs |
| Database Schema | ✅ Complete | Sequential migrations |
| Configuration | ✅ Complete | All env vars present |
| Integration | ✅ Ready | API contract defined |
| Build | ✅ Success | TypeScript compiles |
| Worker Setup | ✅ Complete | Docker compose ready |

**Recommendation**: ✅ **READY** - Can deploy after testing

---

## 📝 Migration Plan

### Immediate Steps (Today)

```sql
-- Step 1: Check current schema on Supabase
\c your_database
\dn  -- List all schemas

-- Step 2A: If scheduling_schema exists:
ALTER SCHEMA scheduling_schema RENAME TO appointments_schema;

-- Step 2B: If appointments_schema exists:
-- Update SupabaseAppointmentReadModelRepository.ts
private readonly schema = 'appointments_schema';

-- Step 3: Verify tables
\dt appointments_schema.*
-- Should see: appointments, appointment_read_models, queue_entries, 
--             patient_read_model, provider_read_model, inbox_events, outbox_events

-- Step 4: Test query
SELECT COUNT(*) FROM appointments_schema.appointments;
SELECT COUNT(*) FROM appointments_schema.outbox_events;
```

### Validation

```bash
# 1. Rebuild services
cd backend/services-v2/appointments-service
npm run build

# 2. Run health check
curl http://localhost:3024/health

# 3. Test database connection
# Service should start without "table not found" errors
```

---

## 🔗 Dependencies Graph

```
[Appointments Service]
    ↓ (calls)
[Scheduler Service API]
    ↓ (creates)
[scheduler.schedules]
    ↓ (materializes)
[scheduler.schedule_runs]
    ↓ (executes)
[scheduler.outbox]
    ↓ (publishes)
[RabbitMQ]
    ↓ (consumes)
[Notifications Service]
```

---

## ✅ Conclusion

### Critical Path to Production

1. **Fix schema naming** (Blocker)
2. **Test integration flow** (appointment → scheduler → notification)
3. **Implement authorization** (Security)
4. **Deploy scheduler workers** (Reliability)

### Estimated Effort

- Schema fix: 30 minutes
- Authorization implementation: 2-3 days
- Integration testing: 1 day
- Deployment: 1 day

**Total**: ~5 days to production-ready

---

**Report Generated**: 2025-10-31  
**Audited By**: AI Agent  
**Status**: Critical issues identified, immediate action required
