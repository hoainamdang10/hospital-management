# Integration & E2E Tests - Appointments Service

## Overview

Comprehensive test suite để verify CQRS read model sync, event-driven architecture, và appointment lifecycle.

## Test Suite Structure

```
tests/
├── integration/
│   ├── read-model-sync.test.ts           # Read model sync tests
│   ├── appointment-lifecycle.e2e.test.ts # E2E lifecycle tests
│   ├── event-flow.test.ts                # Event-driven architecture tests
│   └── queue-management.test.ts          # Queue management tests
├── helpers/
│   └── test-data-builder.ts              # Test data utilities
└── setup.ts                               # Global test setup
```

## Test Coverage

### 1. Read Model Sync (read-model-sync.test.ts)

**Tests:**
- ✅ Sync new appointment to read model
- ✅ Update read model on confirmation
- ✅ Handle concurrent appointments sync
- ✅ Query performance comparison (write vs read model)

**Coverage:** CQRS read model synchronization

### 2. Appointment Lifecycle E2E (appointment-lifecycle.e2e.test.ts)

**Tests:**
- ✅ Complete flow: Schedule → Confirm → CheckIn → Start → Complete
- ✅ Cancellation flow
- ✅ Reschedule flow
- ✅ Error handling (invalid dates, times, missing fields)
- ✅ Concurrent bookings conflict detection

**Coverage:** Full appointment lifecycle from creation to completion

### 3. Event Flow (event-flow.test.ts)

**Tests:**
- ✅ Outbox pattern: AppointmentScheduled event
- ✅ Outbox pattern: AppointmentCancelled event
- ✅ Event processing status tracking
- ✅ Event consumers: PatientRegistered
- ✅ Event consumers: ProviderRegistered
- ✅ Idempotency (duplicate events)
- ✅ Event ordering

**Coverage:** Event-driven architecture (outbox pattern, consumers, ordering)

### 4. Queue Management (queue-management.test.ts)

**Tests:**
- ✅ Join queue (single patient)
- ✅ Multiple patients positioning
- ✅ Priority handling (URGENT > NORMAL)
- ✅ Queue status retrieval
- ✅ Provider's queue listing
- ✅ Call next patient
- ✅ Update positions after calling
- ✅ Leave queue
- ✅ Update positions after leaving
- ✅ Queue metrics (average wait time)

**Coverage:** Queue management and patient flow

## Setup & Prerequisites

### 1. Environment Variables

Create `.env.test`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Service
NODE_ENV=test
PORT=3004

# Infrastructure
REDIS_URL=redis://localhost:6380
RABBITMQ_URL=amqp://admin:admin@localhost:5673
```

### 2. Infrastructure Running

Ensure infrastructure is running:

```bash
# Start Redis + RabbitMQ
npm run dev:infrastructure

# Or via docker-compose
docker-compose -f docker-compose.v2.yml up redis-v2 rabbitmq-v2 -d
```

### 3. Service Running

Start appointments service:

```bash
npm run dev
```

Verify health:

```bash
curl http://localhost:3004/health
```

## Running Tests

### All Tests

```bash
npm run test:all
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Specific Test File

```bash
npx jest tests/integration/read-model-sync.test.ts
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

## Test Execution Flow

### Read Model Sync Test

```
1. Create appointment via API
2. Wait 2 seconds for event processing
3. Verify read model has appointment
4. Confirm appointment
5. Wait 2 seconds
6. Verify read model updated
```

### Appointment Lifecycle E2E

```
1. Schedule appointment (POST /api/v1/appointments)
2. Confirm appointment (POST /api/v1/appointments/:id/confirm)
3. Check-in (POST /api/v1/appointments/:id/check-in)
4. Start (POST /api/v1/appointments/:id/start)
5. Complete (POST /api/v1/appointments/:id/complete)
6. Verify final status in DB
```

### Event Flow Test

```
1. Create appointment
2. Verify event in outbox_events table
3. Insert event to inbox_events (simulate external service)
4. Wait for consumer processing
5. Verify cache updated (patient_read_model/provider_read_model)
6. Test idempotency (insert duplicate event)
```

### Queue Management Test

```
1. Join queue (POST /api/v1/queue/join)
2. Verify position assigned
3. Call next patient (POST /api/v1/queue/call-next)
4. Verify positions updated
5. Leave queue (POST /api/v1/queue/:id/leave)
6. Verify remaining patients repositioned
```

## Expected Results

### Success Criteria

- ✅ All tests pass
- ✅ Read model sync < 3 seconds
- ✅ Event ordering preserved
- ✅ Concurrent operations handled correctly
- ✅ Queue priorities respected
- ✅ No data loss or corruption
- ✅ Idempotency guaranteed

### Performance Benchmarks

- Read model query time: < 200ms
- Write model query time: < 500ms
- Event processing time: < 3s
- Queue position update: < 1s
- API response time: < 500ms

## Debugging

### View Test Logs

```bash
# Run with verbose output
npm run test:integration -- --verbose
```

### Debug Specific Test

```bash
# Node debugging
node --inspect-brk node_modules/.bin/jest tests/integration/read-model-sync.test.ts
```

### Check Database State

```bash
# Read model count
ts-node scripts/verify-sync.ts
```

### Check Event Bus

```bash
# RabbitMQ Management UI
http://localhost:15673
# Username: admin / Password: admin
```

### Check Outbox Events

```sql
-- Via Supabase SQL Editor
SELECT * FROM appointments_schema.outbox_events
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Tests Timing Out

**Issue:** Tests timeout after 30 seconds

**Solution:**
```bash
# Increase timeout in setup.ts (already set to 30s)
# Or in specific test:
jest.setTimeout(60000); // 60 seconds
```

### Read Model Not Syncing

**Issue:** Read model empty after appointment creation

**Checklist:**
1. ✅ Service running? `curl http://localhost:3004/health`
2. ✅ RabbitMQ running? `docker ps | grep rabbitmq`
3. ✅ Event published? Check `outbox_events` table
4. ✅ Wait time sufficient? Increase wait to 5 seconds

**Solution:**
```bash
# Re-run backfill script
npm run fix:backfill
```

### Concurrent Tests Failing

**Issue:** Tests fail when run concurrently

**Solution:**
```bash
# Run in serial mode (--runInBand)
npm run test:integration
```

### Database Cleanup Issues

**Issue:** Test data not cleaned up

**Solution:**
```bash
# Manually clean test data
npm run clean-test-data

# Or via SQL
DELETE FROM appointments_schema.appointments WHERE patient_id LIKE 'test-%';
DELETE FROM appointments_schema.appointment_read_model WHERE patient_id LIKE 'test-%';
```

## Test Maintenance

### Adding New Tests

1. Create test file in `tests/integration/`
2. Use `AppointmentTestDataBuilder` for test data
3. Follow naming convention: `<feature>.test.ts`
4. Add cleanup in `afterEach`
5. Update this README

### Test Data Guidelines

- ✅ Use prefixes: `test-`, `e2e-`, `queue-test-`, `event-`
- ✅ Include timestamp: `test-patient-${Date.now()}`
- ✅ Clean up in `afterEach`
- ❌ Don't use production data
- ❌ Don't hardcode IDs

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Integration Tests
  run: |
    npm run dev:infrastructure &
    npm run dev &
    sleep 30
    npm run test:integration
```

## Test Coverage Goals

- **Target**: 80%+ overall, 90%+ domain layer
- **Current**: Run `npm run test:coverage` to see

**Coverage Report:**
```bash
npm run test:coverage
# Opens coverage/lcov-report/index.html
```

## Questions?

Contact: Backend Team

Last Updated: 2025-01-15

