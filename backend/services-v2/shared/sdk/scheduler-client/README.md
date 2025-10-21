# @hospital/scheduler-client

TypeScript client for Hospital Management System V2 Scheduler Service.

## Features

- ✅ **Type-safe** - Full TypeScript support with strict types
- ✅ **Idempotent** - Built-in support for idempotency keys
- ✅ **Retry logic** - Automatic retry for 5xx errors with exponential backoff
- ✅ **Correlation ID** - Automatic correlation ID propagation for distributed tracing
- ✅ **Mock adapter** - FakeSchedulerAdapter for development and testing
- ✅ **Validation** - Client-side validation for schedule types
- ✅ **Error handling** - Standardized error responses

## Installation

```bash
npm install @hospital/scheduler-client
```

## Quick Start

### Production (RemoteSchedulerAdapter)

```typescript
import { RemoteSchedulerAdapter } from '@hospital/scheduler-client';

const scheduler = new RemoteSchedulerAdapter({
  baseURL: 'http://localhost:3030',
  apiKey: process.env.SCHEDULER_API_KEY,
  timeout: 5000,
  retries: 3
});

// Create a ONCE schedule
const schedule = await scheduler.createOrUpdateByDedup({
  tenantId: 'hospital-1',
  ownerService: 'appointments',
  ownerResourceType: 'appointment',
  ownerResourceId: 'appt-123',
  scheduleType: 'ONCE',
  startAtUtc: new Date('2025-10-23T09:00:00Z'),
  topicOrCommand: 'appointments.appointment.reminder.24h',
  payloadJson: {
    appointmentId: 'appt-123',
    patientId: 'patient-456',
    reminderType: '24h'
  },
  dedupKey: 'appt-123:reminder-24h',
  retryPolicy: {
    strategy: 'exp',
    maxAttempts: 3,
    baseMs: 1000,
    maxDelayMs: 60000
  }
});

console.log('Schedule created:', schedule.scheduleId);
```

### Development/Testing (FakeSchedulerAdapter)

```typescript
import { FakeSchedulerAdapter } from '@hospital/scheduler-client';

const scheduler = new FakeSchedulerAdapter({
  delay: 100 // Simulate 100ms network delay
});

// Same API as RemoteSchedulerAdapter
const schedule = await scheduler.createOrUpdateByDedup({
  tenantId: 'hospital-1',
  ownerService: 'appointments',
  scheduleType: 'ONCE',
  startAtUtc: new Date('2025-10-23T09:00:00Z'),
  topicOrCommand: 'appointments.appointment.reminder.24h',
  payloadJson: { appointmentId: 'appt-123' },
  dedupKey: 'appt-123:reminder-24h'
});

console.log('Schedule created:', schedule.scheduleId);
```

## Usage Examples

### 1. Create ONCE Schedule

```typescript
const schedule = await scheduler.createOrUpdateByDedup({
  tenantId: 'hospital-1',
  ownerService: 'appointments',
  scheduleType: 'ONCE',
  startAtUtc: new Date('2025-10-23T09:00:00Z'),
  topicOrCommand: 'appointments.appointment.reminder.24h',
  payloadJson: {
    appointmentId: 'appt-123',
    patientId: 'patient-456'
  },
  dedupKey: 'appt-123:reminder-24h'
});
```

### 2. Create CRON Schedule

```typescript
const schedule = await scheduler.createOrUpdateByDedup({
  tenantId: 'hospital-1',
  ownerService: 'billing',
  scheduleType: 'CRON',
  cronExpr: '0 9 * * *', // Daily at 9 AM
  timezone: 'Asia/Ho_Chi_Minh',
  topicOrCommand: 'billing.report.daily',
  payloadJson: {
    reportType: 'daily'
  },
  dedupKey: 'billing:daily-report',
  misfirePolicy: 'fire_now',
  graceWindowMs: 60000
});
```

### 3. Create RRULE Schedule

```typescript
const schedule = await scheduler.createOrUpdateByDedup({
  tenantId: 'hospital-1',
  ownerService: 'notifications',
  scheduleType: 'RRULE',
  rrule: 'FREQ=DAILY;INTERVAL=1;BYHOUR=9;BYMINUTE=0',
  startAtUtc: new Date('2025-10-22T09:00:00Z'), // Optional anchor point
  topicOrCommand: 'notifications.alert.send',
  payloadJson: {
    alertType: 'daily-summary'
  },
  dedupKey: 'notifications:daily-summary'
});
```

### 4. Cancel Schedules by Owner

```typescript
const result = await scheduler.cancelByOwner({
  tenantId: 'hospital-1',
  ownerService: 'appointments',
  ownerResourceType: 'appointment',
  ownerResourceId: 'appt-123'
});

console.log(`Cancelled ${result.cancelledCount} schedules`);
console.log('Cancelled IDs:', result.cancelledScheduleIds);
```

### 5. Get Schedule Details

```typescript
const schedule = await scheduler.getSchedule('550e8400-e29b-41d4-a716-446655440000');

console.log('Schedule status:', schedule.status);
console.log('Next run:', schedule.nextRunAtUtc);
```

### 6. Trigger Schedule Immediately

```typescript
const run = await scheduler.runNow('550e8400-e29b-41d4-a716-446655440000');

console.log('Run triggered:', run.runId);
console.log('Status:', run.status); // 'DUE'
```

### 7. Query Schedule Runs

```typescript
const result = await scheduler.getScheduleRuns({
  scheduleId: '550e8400-e29b-41d4-a716-446655440000',
  status: 'DUE',
  limit: 20
});

console.log(`Found ${result.runs.length} DUE runs`);

// Pagination
if (result.pagination.hasMore) {
  const nextPage = await scheduler.getScheduleRuns({
    scheduleId: '550e8400-e29b-41d4-a716-446655440000',
    status: 'DUE',
    limit: 20,
    cursor: result.pagination.nextCursor
  });
}
```

### 8. Health Check

```typescript
const health = await scheduler.health();

console.log('Service status:', health.status);
console.log('Database:', health.components?.database?.status);
console.log('RabbitMQ:', health.components?.rabbitmq?.status);
```

## Advanced Features

### Idempotency Key

```typescript
import { v4 as uuidv4 } from 'uuid';

const idempotencyKey = uuidv4();

const schedule = await scheduler
  .withIdempotencyKey(idempotencyKey)
  .createOrUpdateByDedup(request);

// Retry with same key - will return same result
const sameSchedule = await scheduler
  .withIdempotencyKey(idempotencyKey)
  .createOrUpdateByDedup(request);

console.log(schedule.scheduleId === sameSchedule.scheduleId); // true
```

### Correlation ID

```typescript
import { v4 as uuidv4 } from 'uuid';

const correlationId = uuidv4();

const schedule = await scheduler
  .withCorrelationId(correlationId)
  .createOrUpdateByDedup(request);

// All logs will include this correlation ID for tracing
```

### Error Handling

```typescript
import { SchedulerError } from '@hospital/scheduler-client';

try {
  const schedule = await scheduler.createOrUpdateByDedup(request);
} catch (error) {
  if (error instanceof SchedulerError) {
    console.error('Error code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Trace ID:', error.traceId);
    
    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Handle validation error
        break;
      case 'FORBIDDEN':
        // Handle permission error
        break;
      case 'RATE_LIMITED':
        // Handle rate limit
        break;
      case 'INTERNAL_ERROR':
        // Handle server error
        break;
    }
  }
}
```

## Testing with FakeSchedulerAdapter

```typescript
import { FakeSchedulerAdapter } from '@hospital/scheduler-client';

describe('Appointment Service', () => {
  let scheduler: FakeSchedulerAdapter;
  
  beforeEach(() => {
    scheduler = new FakeSchedulerAdapter({
      delay: 0 // No delay for tests
    });
  });
  
  afterEach(() => {
    scheduler.reset(); // Clear all data
  });
  
  it('should create appointment reminder', async () => {
    const schedule = await scheduler.createOrUpdateByDedup({
      tenantId: 'hospital-1',
      ownerService: 'appointments',
      scheduleType: 'ONCE',
      startAtUtc: new Date('2025-10-23T09:00:00Z'),
      topicOrCommand: 'appointments.appointment.reminder.24h',
      payloadJson: { appointmentId: 'appt-123' },
      dedupKey: 'appt-123:reminder-24h'
    });
    
    expect(schedule.scheduleId).toBeDefined();
    expect(schedule.status).toBe('ACTIVE');
  });
  
  it('should simulate errors', async () => {
    const scheduler = new FakeSchedulerAdapter({
      simulateErrors: {
        createOrUpdateByDedup: 'VALIDATION_ERROR'
      }
    });
    
    await expect(
      scheduler.createOrUpdateByDedup(request)
    ).rejects.toThrow('VALIDATION_ERROR');
  });
});
```

## API Reference

See [IScheduler interface](./src/IScheduler.ts) for complete API documentation.

## License

MIT

