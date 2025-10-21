import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientFactory } from '../../src/infrastructure/database/SupabaseClientFactory';
import { SupabaseDeadLetterRepository } from '../../src/infrastructure/persistence/SupabaseDeadLetterRepository';
import { RabbitMQPublisher } from '../../src/infrastructure/messaging/RabbitMQPublisher';
import { DeadLetter } from '../../src/domain/entities/DeadLetter.entity';

describe('Dead Letter Handling - Unroutable Messages', () => {
  let supabase: SupabaseClient;
  let deadLetterRepo: SupabaseDeadLetterRepository;
  let publisher: RabbitMQPublisher;

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    supabase = SupabaseClientFactory.create({
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceKey,
      schema: 'scheduler'
    });

    deadLetterRepo = new SupabaseDeadLetterRepository(supabase);

    publisher = new RabbitMQPublisher(
      {
        url: rabbitmqUrl,
        exchange: 'hospital.events.test',
        exchangeType: 'topic',
        durable: true
      },
      deadLetterRepo
    );

    await publisher.connect();
  });

  afterAll(async () => {
    await publisher.close();
    await SupabaseClientFactory.close();
  });

  beforeEach(async () => {
    // Clean up dead_letters table
    await supabase.from('dead_letters').delete().neq('id', 0);
  });

  it('should save unroutable message to dead_letters table', async () => {
    // Arrange
    const topic = 'test.unroutable.message';
    const payload = {
      scheduleId: 'sched-123',
      runId: 'run-123',
      tenantId: 'tenant-1'
    };
    const headers = {
      correlation_id: 'corr-123',
      causation_id: 'cause-123',
      schedule_id: 'sched-123',
      run_id: 'run-123',
      tenant_id: 'tenant-1',
      idempotency_key: 'sched:sched-123:run-123',
      emitted_at: new Date().toISOString()
    };

    // Act - Publish message (will be unroutable because no consumer bound)
    await publisher.publish(topic, JSON.stringify(payload), headers);

    // Wait for 'return' event to be processed
    await new Promise(resolve => setTimeout(resolve, 500));

    // Assert - Check dead_letters table
    const { data, error } = await supabase
      .from('dead_letters')
      .select('*')
      .eq('message_id', headers.idempotency_key)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.message_id).toBe(headers.idempotency_key);
    expect(data.routing_key).toBe(topic);
    expect(data.exchange).toBe('hospital.events.test');
    expect(data.failure_type).toBe('unroutable_message');

    // Supabase may return JSONB as string or object - handle both
    const parsedPayload = typeof data.payload === 'string'
      ? JSON.parse(data.payload)
      : data.payload;
    const parsedHeaders = typeof data.headers === 'string'
      ? JSON.parse(data.headers)
      : data.headers;

    expect(parsedPayload).toEqual(payload);
    expect(parsedHeaders).toEqual(headers);
    expect(data.error_message).toContain('unroutable');
  });

  it('should handle multiple unroutable messages', async () => {
    // Arrange
    const messages = [
      {
        topic: 'test.unroutable.1',
        payload: { id: 1 },
        idempotency_key: 'sched:sched-1:run-1'
      },
      {
        topic: 'test.unroutable.2',
        payload: { id: 2 },
        idempotency_key: 'sched:sched-2:run-2'
      },
      {
        topic: 'test.unroutable.3',
        payload: { id: 3 },
        idempotency_key: 'sched:sched-3:run-3'
      }
    ];

    // Act - Publish all messages
    for (const msg of messages) {
      await publisher.publish(
        msg.topic,
        JSON.stringify(msg.payload),
        {
          correlation_id: 'corr-123',
          causation_id: 'cause-123',
          schedule_id: 'sched-123',
          run_id: 'run-123',
          tenant_id: 'tenant-1',
          idempotency_key: msg.idempotency_key,
          emitted_at: new Date().toISOString()
        }
      );
    }

    // Wait for 'return' events to be processed (increased for alerting)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Assert - Check all messages saved
    const { data, error } = await supabase
      .from('dead_letters')
      .select('*')
      .eq('failure_type', 'unroutable_message')
      .order('stored_at_utc', { ascending: true });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).not.toBeNull();
    expect(data!.length).toBe(3);

    // Verify each message
    for (let i = 0; i < messages.length; i++) {
      expect(data![i].message_id).toBe(messages[i].idempotency_key);
      expect(data![i].routing_key).toBe(messages[i].topic);

      // Handle JSONB serialization
      const parsedPayload = typeof data![i].payload === 'string'
        ? JSON.parse(data![i].payload)
        : data![i].payload;
      expect(parsedPayload).toEqual(messages[i].payload);
    }
  });

  it('should not crash publisher when dead letter save fails', async () => {
    // Arrange - Create publisher without DeadLetterRepository
    const publisherWithoutRepo = new RabbitMQPublisher({
      url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
      exchange: 'hospital.events.test',
      exchangeType: 'topic',
      durable: true
    });

    await publisherWithoutRepo.connect();

    const topic = 'test.unroutable.no.repo';
    const payload = { test: 'data' };
    const headers = {
      correlation_id: 'corr-123',
      causation_id: 'cause-123',
      schedule_id: 'sched-123',
      run_id: 'run-123',
      tenant_id: 'tenant-1',
      idempotency_key: 'sched:sched-no-repo:run-no-repo',
      emitted_at: new Date().toISOString()
    };

    // Act - Publish message (should not crash even though repo is missing)
    await expect(
      publisher.publish(topic, JSON.stringify(payload), headers)
    ).resolves.not.toThrow();

    // Wait for 'return' event
    await new Promise(resolve => setTimeout(resolve, 500));

    // Assert - Publisher should still be connected
    expect(publisherWithoutRepo.getConnectionStatus()).toBe(true);

    await publisherWithoutRepo.close();
  });

  it('should create DeadLetter entity for unroutable message', () => {
    // Arrange
    const messageId = 'sched:sched-123:run-123';
    const routingKey = 'test.unroutable.message';
    const exchange = 'hospital.events.test';
    const payload = { scheduleId: 'sched-123', runId: 'run-123' };
    const headers = { correlation_id: 'corr-123' };
    const errorMessage = 'Message returned as unroutable';

    // Act
    const deadLetter = DeadLetter.createForUnroutableMessage(
      messageId,
      routingKey,
      exchange,
      payload,
      headers,
      errorMessage
    );

    // Assert
    expect(deadLetter.getMessageId()).toBe(messageId);
    expect(deadLetter.getRoutingKey()).toBe(routingKey);
    expect(deadLetter.getExchange()).toBe(exchange);
    expect(deadLetter.getPayload()).toEqual(payload);
    expect(deadLetter.getHeaders()).toEqual(headers);
    expect(deadLetter.getErrorMessage()).toBe(errorMessage);
    expect(deadLetter.getFailureType()).toBe('unroutable_message');
    expect(deadLetter.getStoredAtUtc()).toBeInstanceOf(Date);
  });

  it('should query dead letters by failure_type', async () => {
    // Arrange - Create unroutable message
    const deadLetter = DeadLetter.createForUnroutableMessage(
      'sched:sched-query:run-query',
      'test.query.message',
      'hospital.events.test',
      { test: 'data' },
      { correlation_id: 'corr-123' },
      'Test unroutable message'
    );

    await deadLetterRepo.save(deadLetter);

    // Act - Query by failure_type
    const { data, error } = await supabase
      .from('dead_letters')
      .select('*')
      .eq('failure_type', 'unroutable_message');

    // Assert
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data![0].failure_type).toBe('unroutable_message');
    expect(data![0].message_id).toBe('sched:sched-query:run-query');
  });
});

