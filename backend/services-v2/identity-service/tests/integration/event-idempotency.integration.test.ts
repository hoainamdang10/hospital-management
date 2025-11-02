/**
 * Integration Tests for Event Idempotency
 * Tests Inbox Pattern verification
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Idempotency Pattern
 */

import { InboxService } from '@infrastructure/inbox/InboxService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('Event Idempotency Integration Tests', () => {
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
      .like('event_id', 'idempotency-test-%');
  });

  describe('Inbox Service Idempotency', () => {
    it('should detect new event correctly', async () => {
      const eventId = 'idempotency-test-001';
      
      const isProcessed = await inboxService.checkProcessed(eventId);
      
      expect(isProcessed).toBe(false);
    });

    it('should store event and prevent duplicates', async () => {
      const eventId = 'idempotency-test-002';
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

      // Store event first time
      const result1 = await inboxService.storeEvent(eventData);
      expect(result1.isNew).toBe(true);
      expect(result1.status).toBe('PENDING');

      // Try to store same event again
      const result2 = await inboxService.storeEvent(eventData);
      expect(result2.isNew).toBe(false);
      expect(result2.status).toBe('PENDING');
    });

    it('should mark event as processed', async () => {
      const eventId = 'idempotency-test-003';
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

      // Mark as processed
      await inboxService.markProcessed(eventId);

      // Verify processed
      const isProcessed = await inboxService.checkProcessed(eventId);
      expect(isProcessed).toBe(true);

      // Verify database record
      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('event_id', eventId)
        .single();

      expect(data.status).toBe('PROCESSED');
      expect(data.processed_at).not.toBeNull();
    });

    it('should mark event as failed with error message', async () => {
      const eventId = 'idempotency-test-004';
      const eventData = {
        eventId,
        eventType: 'TestEvent',
        aggregateId: 'test-agg-003',
        aggregateType: 'Test',
        payloadJson: { test: 'data' },
        sourceService: 'test-service',
        routingKey: 'test.event',
        occurredAt: new Date()
      };

      // Store event
      await inboxService.storeEvent(eventData);

      // Mark as failed
      const errorMessage = 'Test processing error';
      await inboxService.markFailed(eventId, errorMessage);

      // Verify database record
      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('event_id', eventId)
        .single();

      expect(data.status).toBe('FAILED');
      expect(data.processing_error).toBe(errorMessage);
      expect(data.retry_count).toBeGreaterThan(0);
    });

    it('should handle concurrent duplicate events', async () => {
      const eventId = 'idempotency-test-005';
      const eventData = {
        eventId,
        eventType: 'TestEvent',
        aggregateId: 'test-agg-004',
        aggregateType: 'Test',
        payloadJson: { test: 'data' },
        sourceService: 'test-service',
        routingKey: 'test.event',
        occurredAt: new Date()
      };

      // Simulate concurrent requests
      const promises = [
        inboxService.storeEvent(eventData),
        inboxService.storeEvent(eventData),
        inboxService.storeEvent(eventData)
      ];

      const results = await Promise.all(promises);

      // Only one should be new
      const newCount = results.filter(r => r.isNew).length;
      expect(newCount).toBe(1);

      // Verify only one record in database
      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('event_id', eventId);

      expect(data).toHaveLength(1);
    });
  });

  describe('Event Processing State Transitions', () => {
    it('should transition from PENDING to PROCESSED', async () => {
      const eventId = 'idempotency-test-006';
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

      // Store event (PENDING)
      await inboxService.storeEvent(eventData);

      let { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('status')
        .eq('event_id', eventId)
        .single();

      expect(data!.status).toBe('PENDING');

      // Mark as processed
      await inboxService.markProcessed(eventId);

      ({ data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('status')
        .eq('event_id', eventId)
        .single());

      expect(data!.status).toBe('PROCESSED');
    });

    it('should transition from PENDING to FAILED', async () => {
      const eventId = 'idempotency-test-007';
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

      // Store event (PENDING)
      await inboxService.storeEvent(eventData);

      // Mark as failed
      await inboxService.markFailed(eventId, 'Test error');

      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('status')
        .eq('event_id', eventId)
        .single();

      expect(data!.status).toBe('FAILED');
    });
  });
});
