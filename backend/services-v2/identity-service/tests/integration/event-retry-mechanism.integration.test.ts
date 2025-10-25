/**
 * Integration Tests for Event Retry Mechanism
 * Tests DLQ + retry logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Retry Pattern
 */

import { InboxService } from '@infrastructure/inbox/InboxService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('Event Retry Mechanism Integration Tests', () => {
  let supabaseClient: SupabaseClient;
  let inboxService: InboxService;
  let logger: any;

  beforeAll(() => {
    supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    inboxService = new InboxService(supabaseClient, logger);
  });

  afterAll(async () => {
    // Cleanup test data
    await supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .delete()
      .like('event_id', 'retry-test-%');
  });

  describe('Retry Count Tracking', () => {
    it('should increment retry count on failure', async () => {
      const eventId = 'retry-test-001';
      const eventData = {
        eventId,
        eventType: 'TestEvent',
        aggregateId: 'test-agg-001',
        aggregateType: 'Test',
        payloadJson: { test: 'data' },
        sourceService: 'test-service',
        routingKey: 'test.event',
        occurredAt: new Date()
      };

      // Store event
      await inboxService.storeEvent(eventData);

      // Mark as failed multiple times
      await inboxService.markFailed(eventId, 'Error 1');
      await inboxService.markFailed(eventId, 'Error 2');
      await inboxService.markFailed(eventId, 'Error 3');

      // Verify retry count
      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('retry_count, error_message')
        .eq('event_id', eventId)
        .single();

      expect(data.retry_count).toBeGreaterThanOrEqual(1);
      expect(data.error_message).toBeDefined();
    });

    it('should store error message on failure', async () => {
      const eventId = 'retry-test-002';
      const eventData = {
        eventId,
        eventType: 'TestEvent',
        aggregateId: 'test-agg-002',
        aggregateType: 'Test',
        payloadJson: { test: 'data' },
        sourceService: 'test-service',
        routingKey: 'test.event',
        occurredAt: new Date()
      };

      // Store event
      await inboxService.storeEvent(eventData);

      // Mark as failed with specific error
      const errorMessage = 'Database connection timeout';
      await inboxService.markFailed(eventId, errorMessage);

      // Verify error message stored
      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('error_message')
        .eq('event_id', eventId)
        .single();

      expect(data.error_message).toBe(errorMessage);
    });
  });

  describe('Failed Event Queries', () => {
    it('should query failed events for retry', async () => {
      // Create multiple failed events
      const failedEvents = [
        {
          eventId: 'retry-test-003',
          eventType: 'TestEvent',
          aggregateId: 'test-agg-003',
          aggregateType: 'Test',
          payloadJson: { test: 'data' },
          sourceService: 'test-service',
          routingKey: 'test.event',
          occurredAt: new Date()
        },
        {
          eventId: 'retry-test-004',
          eventType: 'TestEvent',
          aggregateId: 'test-agg-004',
          aggregateType: 'Test',
          payloadJson: { test: 'data' },
          sourceService: 'test-service',
          routingKey: 'test.event',
          occurredAt: new Date()
        }
      ];

      for (const event of failedEvents) {
        await inboxService.storeEvent(event);
        await inboxService.markFailed(event.eventId, 'Test error');
      }

      // Query failed events
      const { data, error } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('status', 'FAILED')
        .like('event_id', 'retry-test-%')
        .order('created_at', { ascending: true });

      expect(error).toBeNull();
      expect(data.length).toBeGreaterThanOrEqual(2);
      expect(data.every(e => e.status === 'FAILED')).toBe(true);
    });

    it('should filter events by retry count', async () => {
      const eventId = 'retry-test-005';
      const eventData = {
        eventId,
        eventType: 'TestEvent',
        aggregateId: 'test-agg-005',
        aggregateType: 'Test',
        payloadJson: { test: 'data' },
        sourceService: 'test-service',
        routingKey: 'test.event',
        occurredAt: new Date()
      };

      // Store event
      await inboxService.storeEvent(eventData);

      // Fail multiple times
      await inboxService.markFailed(eventId, 'Error 1');
      await inboxService.markFailed(eventId, 'Error 2');
      await inboxService.markFailed(eventId, 'Error 3');

      // Query events with high retry count (>= 3)
      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('event_id', eventId)
        .gte('retry_count', 3)
        .single();

      expect(data).toBeDefined();
      expect(data.retry_count).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Event Recovery', () => {
    it('should allow failed event to be reprocessed', async () => {
      const eventId = 'retry-test-006';
      const eventData = {
        eventId,
        eventType: 'TestEvent',
        aggregateId: 'test-agg-006',
        aggregateType: 'Test',
        payloadJson: { test: 'data' },
        sourceService: 'test-service',
        routingKey: 'test.event',
        occurredAt: new Date()
      };

      // Store event
      await inboxService.storeEvent(eventData);

      // Mark as failed
      await inboxService.markFailed(eventId, 'Temporary error');

      // Verify failed
      let { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('status')
        .eq('event_id', eventId)
        .single();

      expect(data.status).toBe('FAILED');

      // Reprocess - mark as processed
      await inboxService.markProcessed(eventId);

      // Verify recovered
      ({ data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('status')
        .eq('event_id', eventId)
        .single());

      expect(data.status).toBe('PROCESSED');
    });
  });

  describe('Dead Letter Queue Simulation', () => {
    it('should identify events for DLQ (retry count > threshold)', async () => {
      const eventId = 'retry-test-007';
      const eventData = {
        eventId,
        eventType: 'TestEvent',
        aggregateId: 'test-agg-007',
        aggregateType: 'Test',
        payloadJson: { test: 'data' },
        sourceService: 'test-service',
        routingKey: 'test.event',
        occurredAt: new Date()
      };

      // Store event
      await inboxService.storeEvent(eventData);

      // Fail multiple times (simulate max retries exceeded)
      for (let i = 0; i < 5; i++) {
        await inboxService.markFailed(eventId, `Error attempt ${i + 1}`);
      }

      // Query events that should go to DLQ (retry_count >= 3)
      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('status', 'FAILED')
        .gte('retry_count', 3)
        .eq('event_id', eventId);

      expect(data.length).toBeGreaterThan(0);
      expect(data[0].retry_count).toBeGreaterThanOrEqual(3);
    });
  });
});
