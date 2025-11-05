import { SupabaseOutboxRepository } from '../../src/infrastructure/outbox/SupabaseOutboxRepository';
import { OutboxPublisherWorker } from '../../src/infrastructure/outbox/OutboxPublisherWorker';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { ConsoleLogger } from '@shared/application/services/logger.interface';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const testLogger = new ConsoleLogger('outbox-test');

describe('Outbox Pattern Integration Tests', () => {
  let supabase: SupabaseClient<any, 'patient_schema', 'patient_schema'>;
  let outboxRepository: SupabaseOutboxRepository;

  beforeAll(async () => {
    supabase = createClient<any, 'patient_schema', 'patient_schema'>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'patient_schema',
        },
      }
    );
    outboxRepository = new SupabaseOutboxRepository(supabase as any, testLogger);
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.schema('patient_schema').from('outbox_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.schema('patient_schema').from('outbox_dead_letter_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  describe('SupabaseOutboxRepository', () => {
    it('should save events to outbox table', async () => {
      const events: Partial<DomainEvent>[] = [
        {
          eventId: uuidv4(),
          eventType: 'patient.registered',
          aggregateId: 'PAT-202501-001',
          aggregateType: 'Patient',
          occurredAt: new Date(),
          metadata: {
            source: 'domain',
            priority: 'normal',
            retryable: true,
          },
        },
      ];

      await outboxRepository.saveEvents(events as DomainEvent[]);

      const { data, error } = await supabase
        .schema('patient_schema')
        .from('outbox_events')
        .select('*')
        .eq('event_type', 'patient.registered')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.status).toBe('PENDING');
      expect(data?.retry_count).toBe(0);
    });

    it('should get pending events ordered by created_at', async () => {
      const events: Partial<DomainEvent>[] = [
        {
          eventId: uuidv4(),
          eventType: 'patient.registered',
          aggregateId: 'PAT-202501-001',
          aggregateType: 'Patient',
          occurredAt: new Date(),
          metadata: { source: 'domain', priority: 'normal', retryable: true },
        },
        {
          eventId: uuidv4(),
          eventType: 'patient.updated',
          aggregateId: 'PAT-202501-002',
          aggregateType: 'Patient',
          occurredAt: new Date(),
          metadata: { source: 'domain', priority: 'normal', retryable: true },
        },
      ];

      await outboxRepository.saveEvents(events as DomainEvent[]);

      const pendingEvents = await outboxRepository.getPendingEvents(10);

      expect(pendingEvents.length).toBeGreaterThanOrEqual(2);
      expect(pendingEvents[0].status).toBe('PENDING');
    });

    it('should mark events as published', async () => {
      const events: Partial<DomainEvent>[] = [
        {
          eventId: uuidv4(),
          eventType: 'patient.registered',
          aggregateId: 'PAT-202501-001',
          aggregateType: 'Patient',
          occurredAt: new Date(),
          metadata: { source: 'domain', priority: 'normal', retryable: true },
        },
      ];

      await outboxRepository.saveEvents(events as DomainEvent[]);
      const pendingEvents = await outboxRepository.getPendingEvents(1);
      const eventId = pendingEvents[0].id;

      await outboxRepository.markAsPublished([eventId]);

      const { data } = await supabase
        .schema('patient_schema')
        .from('outbox_events')
        .select('*')
        .eq('id', eventId)
        .single();

      expect(data?.status).toBe('PUBLISHED');
      expect(data?.published_at).toBeDefined();
    });

    it('should increment retry count on failure', async () => {
      const events: Partial<DomainEvent>[] = [
        {
          eventId: uuidv4(),
          eventType: 'patient.registered',
          aggregateId: 'PAT-202501-001',
          aggregateType: 'Patient',
          occurredAt: new Date(),
          metadata: { source: 'domain', priority: 'normal', retryable: true },
        },
      ];

      await outboxRepository.saveEvents(events as DomainEvent[]);
      const pendingEvents = await outboxRepository.getPendingEvents(1);
      const eventId = pendingEvents[0].id;

      await outboxRepository.markAsFailed(eventId, 'Test error');

      const { data } = await supabase
        .schema('patient_schema')
        .from('outbox_events')
        .select('*')
        .eq('id', eventId)
        .single();

      expect(data?.status).toBe('FAILED');
      expect(data?.retry_count).toBe(1);
      expect(data?.last_error).toBe('Test error');
    });
  });

  describe('OutboxPublisherWorker', () => {
    it('should poll and publish pending events', async () => {
      const events: Partial<DomainEvent>[] = [
        {
          eventId: uuidv4(),
          eventType: 'patient.registered',
          aggregateId: 'PAT-202501-001',
          aggregateType: 'Patient',
          occurredAt: new Date(),
          metadata: { source: 'domain', priority: 'normal', retryable: true },
        },
      ];

      await outboxRepository.saveEvents(events as DomainEvent[]);

      let publishedCount = 0;
      const mockPublishEvent = async (event: DomainEvent) => {
        publishedCount++;
      };

      const worker = new OutboxPublisherWorker(
        outboxRepository,
        testLogger,
        mockPublishEvent,
        {
          enabled: true,
          pollingIntervalMs: 500,
          batchSize: 50,
        }
      );

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 1500));
      await worker.stop();

      expect(publishedCount).toBeGreaterThanOrEqual(1);
    });
  });
});

