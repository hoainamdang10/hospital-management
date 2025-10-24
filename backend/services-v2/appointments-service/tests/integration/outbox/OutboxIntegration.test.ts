/**
 * Integration Test: Transactional Outbox Pattern
 * Tests full flow: Event -> Outbox -> Worker -> Scheduler
 */

import { OutboxRepository } from '../../../src/infrastructure/outbox/OutboxRepository';
import { OutboxPublisherWorker } from '../../../src/infrastructure/outbox/OutboxPublisherWorker';

describe('Outbox Integration Tests', () => {
  let outboxRepo: OutboxRepository;
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  beforeAll(() => {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for integration tests');
    }
    outboxRepo = new OutboxRepository(supabaseUrl, supabaseKey);
  });

  describe('OutboxRepository', () => {
    it('should enqueue event to outbox', async () => {
      const testId = `test-${Date.now()}`;
      await outboxRepo.enqueue({
        eventType: 'SchedulerReminderCreate',
        aggregateType: 'Appointment',
        aggregateId: testId,
        dedupKey: `${testId}:test`,
        payload: {
          tenantId: 'test-tenant',
          ownerService: 'appointments',
          ownerResourceId: testId,
          topicOrCommand: 'test.reminder',
          startAtUtc: new Date().toISOString(),
          payloadJson: { test: true }
        }
      });

      // Verify by claiming
      const claimed = await outboxRepo.claimBatch(10);
      const found = claimed.find(e => e.aggregate_id === testId);
      expect(found).toBeDefined();
      expect(found?.status).toBe('RESERVED');
    });

    it('should handle duplicate dedup_key gracefully', async () => {
      const testId = `dup-${Date.now()}`;
      const dedupKey = `${testId}:duplicate`;

      await outboxRepo.enqueue({
        eventType: 'SchedulerReminderCreate',
        aggregateType: 'Appointment',
        aggregateId: testId,
        dedupKey,
        payload: { test: 1 }
      });

      // Second enqueue with same dedup_key should not throw
      await expect(outboxRepo.enqueue({
        eventType: 'SchedulerReminderCreate',
        aggregateType: 'Appointment',
        aggregateId: testId,
        dedupKey,
        payload: { test: 2 }
      })).resolves.not.toThrow();
    });

    it('should mark event as SENT', async () => {
      const testId = `sent-${Date.now()}`;
      await outboxRepo.enqueue({
        eventType: 'SchedulerReminderCreate',
        aggregateType: 'Appointment',
        aggregateId: testId,
        dedupKey: `${testId}:sent`,
        payload: { test: true }
      });

      const claimed = await outboxRepo.claimBatch(10);
      const evt = claimed.find(e => e.aggregate_id === testId);
      if (!evt) throw new Error('Event not found');

      await outboxRepo.markSent(evt.id);

      // Verify it's not claimed again
      const claimed2 = await outboxRepo.claimBatch(10);
      const found2 = claimed2.find(e => e.id === evt.id);
      expect(found2).toBeUndefined();
    });

    it('should mark event as FAILED with retry', async () => {
      const testId = `failed-${Date.now()}`;
      await outboxRepo.enqueue({
        eventType: 'SchedulerReminderCreate',
        aggregateType: 'Appointment',
        aggregateId: testId,
        dedupKey: `${testId}:failed`,
        payload: { test: true }
      });

      const claimed = await outboxRepo.claimBatch(10);
      const evt = claimed.find(e => e.aggregate_id === testId);
      if (!evt) throw new Error('Event not found');

      const nextRetry = new Date(Date.now() + 60000); // 1 min later
      await outboxRepo.markFailed(evt.id, 'Test error', nextRetry, 1);

      // Verify status changed
      const claimed2 = await outboxRepo.claimBatch(10);
      const found2 = claimed2.find(e => e.id === evt.id);
      expect(found2).toBeUndefined(); // Should not be claimed (next_retry_at in future)
    });
  });

  describe('OutboxPublisherWorker', () => {
    it('should process events from outbox (mock scheduler)', async () => {
      const mockScheduler = {
        createOrUpdateByDedup: jest.fn().mockResolvedValue(undefined),
        cancelByOwner: jest.fn().mockResolvedValue(undefined)
      };

      const worker = new OutboxPublisherWorker(
        outboxRepo,
        mockScheduler as any,
        { intervalMs: 1000, batchSize: 10 }
      );

      // Enqueue test event
      const testId = `worker-${Date.now()}`;
      await outboxRepo.enqueue({
        eventType: 'SchedulerReminderCreate',
        aggregateType: 'Appointment',
        aggregateId: testId,
        dedupKey: `${testId}:worker`,
        payload: {
          tenantId: 'test',
          ownerService: 'appointments',
          ownerResourceId: testId,
          topicOrCommand: 'test',
          startAtUtc: new Date().toISOString(),
          payloadJson: {}
        }
      });

      // Run worker once
      await worker.runOnce();

      // Verify scheduler was called
      expect(mockScheduler.createOrUpdateByDedup).toHaveBeenCalled();
    });
  });
});

