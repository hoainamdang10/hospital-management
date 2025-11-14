# Outbox Pattern Integration Guide

## Overview

This guide explains how to integrate the Outbox Pattern into the Identity Service to guarantee reliable event publishing.

## Files Created

1. **Migration**: `migrations/016_create_event_outbox_table.sql`
   - Creates `auth_schema.event_outbox` table
   - Indexes for performance
   - RLS policies for security

2. **OutboxService**: `src/infrastructure/outbox/OutboxService.ts`
   - Manages outbox table operations
   - Store, retrieve, and update events
   - Provides statistics and monitoring

3. **OutboxPublisher**: `src/infrastructure/outbox/OutboxPublisher.ts`
   - Background job for publishing events
   - Polls outbox table periodically
   - Handles retries and failures

## Integration Steps

### Step 1: Apply Migration

Run the migration to create the outbox table:

```bash
npm run db:migrate -- --file migrations/016_create_event_outbox_table.sql
```

Or apply via Supabase dashboard:
- Copy SQL from `migrations/016_create_event_outbox_table.sql`
- Paste into Supabase SQL editor
- Execute

### Step 2: Update Dependency Container

In `src/bootstrap/dependency-container.ts`, add:

```typescript
import { OutboxService } from '../infrastructure/outbox/OutboxService';
import { OutboxPublisher } from '../infrastructure/outbox/OutboxPublisher';

// In buildInfrastructure() method:
const outboxService = new OutboxService(
  this.supabaseClient,
  this.logger
);

const outboxPublisher = new OutboxPublisher(
  outboxService,
  this.eventPublisher,
  this.logger,
  {
    pollingIntervalMs: 5000, // Poll every 5 seconds
    batchSize: 100,
    enabled: true
  }
);

// Store in container
this.outboxService = outboxService;
this.outboxPublisher = outboxPublisher;
```

### Step 3: Start OutboxPublisher in main.ts

In `src/main.ts`, add:

```typescript
// After event consumer connects
await deps.outboxPublisher.start();

// In graceful shutdown
process.on('SIGTERM', async () => {
  await deps.outboxPublisher.stop();
  // ... rest of shutdown
});
```

### Step 4: Update SupabaseUserRepository

Modify `src/infrastructure/repositories/SupabaseUserRepository.ts`:

```typescript
// Add outboxService to constructor
constructor(
  supabaseClient: SupabaseClient,
  private logger: ILogger,
  cacheService?: RedisCacheService,
  permissionRepository?: IPermissionRepository,
  eventPublisher?: IEventPublisher,
  private outboxService?: OutboxService  // ADD THIS
) {
  // ...
}

// Update publishDomainEvents method
private async publishDomainEvents(user: User): Promise<void> {
  if (!this.eventPublisher && !this.outboxService) {
    this.logger.debug("Event publisher not configured");
    return;
  }

  const events = user.getUncommittedEvents();
  if (events.length === 0) {
    return;
  }

  try {
    // Store events in outbox (guaranteed persistence)
    if (this.outboxService) {
      for (const event of events) {
        await this.outboxService.storeEvent(event);
      }
      this.logger.info("Domain events stored in outbox", {
        userId: user.id,
        eventCount: events.length
      });
    }

    // Also publish immediately if eventPublisher available
    if (this.eventPublisher) {
      await this.eventPublisher.publishDomainEvents(events);
    }

    user.markEventsAsCommitted();
  } catch (error) {
    this.logger.error("Failed to handle domain events", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't throw - outbox will retry
  }
}
```

### Step 5: Add Monitoring Endpoint (Optional)

In `src/presentation/routes/health.routes.ts`, add:

```typescript
// Get outbox statistics
router.get('/outbox/stats', async (_req, res) => {
  try {
    const stats = await deps.outboxPublisher.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get outbox stats', { error: getErrorMessage(error) });
    res.status(500).json({ error: 'Failed to get outbox stats' });
  }
});

// Get failed events
router.get('/outbox/failed', async (_req, res) => {
  try {
    const failed = await deps.outboxPublisher.getFailedEvents(50);
    res.json(failed);
  } catch (error) {
    logger.error('Failed to get failed events', { error: getErrorMessage(error) });
    res.status(500).json({ error: 'Failed to get failed events' });
  }
});
```

## How It Works

### Publishing Flow

```
1. Domain event created in Use Case
   ↓
2. User aggregate stores event
   ↓
3. SupabaseUserRepository.save() called
   ↓
4. User data saved to database
   ↓
5. Domain events stored in outbox table (atomic with step 4)
   ↓
6. publishDomainEvents() called
   ↓
7. Events published to RabbitMQ (best effort)
   ↓
8. OutboxPublisher background job runs every 5 seconds
   ↓
9. Polls outbox for PENDING events
   ↓
10. Publishes to RabbitMQ
    ↓
11. Marks as PUBLISHED on success
    ↓
12. Marks as FAILED (with retry) on failure
```

### Guarantees

- **At-least-once delivery**: Events are persisted in outbox, so they won't be lost
- **Exactly-once with idempotency**: Inbox pattern on consumer side ensures idempotent processing
- **Retry logic**: Failed events are retried up to 3 times
- **Monitoring**: Failed events are tracked and can be manually retried

## Testing

### Unit Test Example

```typescript
describe('OutboxService', () => {
  it('should store event in outbox', async () => {
    const event = new UserCreatedEvent(...);
    const stored = await outboxService.storeEvent(event);
    
    expect(stored.status).toBe('PENDING');
    expect(stored.eventId).toBe(event.eventId);
  });

  it('should mark event as published', async () => {
    const event = await outboxService.storeEvent(...);
    await outboxService.markAsPublished(event.outboxId);
    
    const stats = await outboxService.getStats();
    expect(stats.published).toBe(1);
  });
});
```

### Integration Test Example

```typescript
describe('OutboxPublisher', () => {
  it('should publish pending events', async () => {
    // Store event in outbox
    await outboxService.storeEvent(event);
    
    // Start publisher
    await outboxPublisher.start();
    
    // Wait for polling
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Verify event was published
    const stats = await outboxPublisher.getStats();
    expect(stats.published).toBe(1);
    expect(stats.pending).toBe(0);
  });
});
```

## Monitoring

### Check Outbox Status

```bash
# Get statistics
curl http://localhost:3001/outbox/stats

# Response:
{
  "pending": 0,
  "publishing": 0,
  "published": 150,
  "failed": 2,
  "total": 152
}
```

### Check Failed Events

```bash
# Get failed events
curl http://localhost:3001/outbox/failed

# Response:
[
  {
    "outboxId": "uuid",
    "eventId": "uuid",
    "eventType": "UserCreatedEvent",
    "status": "FAILED",
    "publishAttempts": 3,
    "publishingError": "Connection timeout",
    "createdAt": "2025-11-12T10:00:00Z"
  }
]
```

## Troubleshooting

### Events stuck in PENDING

1. Check if OutboxPublisher is running
2. Check logs for errors
3. Verify RabbitMQ connection
4. Check database permissions

### Events in FAILED status

1. Check `publishingError` message
2. Verify RabbitMQ is healthy
3. Check network connectivity
4. Review event payload for issues

## Performance Considerations

- **Polling interval**: Default 5 seconds (configurable)
- **Batch size**: Default 100 events per poll (configurable)
- **Indexes**: Created on status, created_at, aggregate_type for fast queries
- **Retention**: Consider archiving old published events periodically

## Next Steps

1. Apply migration
2. Update dependency container
3. Modify SupabaseUserRepository
4. Start OutboxPublisher in main.ts
5. Test with integration tests
6. Monitor in production

## References

- Outbox Pattern: https://microservices.io/patterns/data/transactional-outbox.html
- Event-Driven Architecture: https://martinfowler.com/articles/201701-event-driven.html
- Inbox Pattern: https://microservices.io/patterns/data/transactional-outbox.html#inbox
