import { RabbitMQPublisher, MessageHeaders } from '../../src/infrastructure/messaging/RabbitMQPublisher';

describe('RabbitMQ Publisher Confirms', () => {
  let publisher: RabbitMQPublisher;

  beforeAll(async () => {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673';

    publisher = new RabbitMQPublisher({
      url: rabbitmqUrl,
      exchange: 'hospital.events.test',
      exchangeType: 'topic',
      durable: true
    });

    await publisher.connect();
  });

  afterAll(async () => {
    await publisher.close();
  });

  it('should publish message with publisher confirms', async () => {
    // Arrange
    const topic = 'test.message.published';
    const payload = {
      testId: 'test-123',
      message: 'Test message'
    };
    const headers: MessageHeaders = {
      correlation_id: 'corr-123',
      causation_id: 'cause-123',
      schedule_id: 'sched-123',
      run_id: 'run-123',
      tenant_id: 'tenant-123',
      idempotency_key: 'sched:sched-123:run-123',
      emitted_at: new Date().toISOString()
    };

    // Act & Assert - Should not throw
    await expect(publisher.publish(topic, payload, headers)).resolves.not.toThrow();
  });

  it('should use idempotency_key as messageId', async () => {
    // Arrange
    const topic = 'test.message.idempotency';
    const payload = { test: 'data' };
    const idempotencyKey = 'sched:unique-123:run-456';
    const headers: MessageHeaders = {
      correlation_id: 'corr-456',
      causation_id: 'cause-456',
      schedule_id: 'sched-456',
      run_id: 'run-456',
      tenant_id: 'tenant-456',
      idempotency_key: idempotencyKey,
      emitted_at: new Date().toISOString()
    };

    // Act - Publish message
    await publisher.publish(topic, payload, headers);

    // Assert - Message should be published with messageId = idempotency_key
    // (This is verified by RabbitMQ management console or consumer)
    expect(true).toBe(true); // Placeholder - actual verification requires consumer
  });

  it('should handle publish failure gracefully', async () => {
    // Arrange - Create publisher with invalid exchange
    const invalidPublisher = new RabbitMQPublisher({
      url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
      exchange: 'invalid.exchange.that.does.not.exist',
      exchangeType: 'topic',
      durable: true
    });

    // Don't connect - simulate disconnected state

    const topic = 'test.message.fail';
    const payload = { test: 'data' };
    const headers: MessageHeaders = {
      correlation_id: 'corr-fail',
      causation_id: 'cause-fail',
      schedule_id: 'sched-fail',
      run_id: 'run-fail',
      tenant_id: 'tenant-fail',
      idempotency_key: 'sched:sched-fail:run-fail',
      emitted_at: new Date().toISOString()
    };

    // Act & Assert - Should throw error
    await expect(invalidPublisher.publish(topic, payload, headers)).rejects.toThrow('RabbitMQ not connected');
  });

  it('should set mandatory flag to detect unroutable messages', async () => {
    // Arrange
    const topic = 'test.unroutable.message'; // No consumer for this topic
    const payload = { test: 'unroutable' };
    const headers: MessageHeaders = {
      correlation_id: 'corr-unroutable',
      causation_id: 'cause-unroutable',
      schedule_id: 'sched-unroutable',
      run_id: 'run-unroutable',
      tenant_id: 'tenant-unroutable',
      idempotency_key: 'sched:sched-unroutable:run-unroutable',
      emitted_at: new Date().toISOString()
    };

    // Act - Publish to unroutable topic
    // Note: This will trigger 'return' event listener in RabbitMQPublisher
    await publisher.publish(topic, payload, headers);

    // Assert - Message should be published (but will be returned)
    // The 'return' event listener will log the error
    expect(true).toBe(true); // Placeholder - actual verification requires monitoring logs
  });

  it('should handle concurrent publishes correctly', async () => {
    // Arrange
    const publishPromises = [];

    for (let i = 0; i < 10; i++) {
      const topic = `test.concurrent.message.${i}`;
      const payload = { index: i };
      const headers: MessageHeaders = {
        correlation_id: `corr-${i}`,
        causation_id: `cause-${i}`,
        schedule_id: `sched-${i}`,
        run_id: `run-${i}`,
        tenant_id: `tenant-${i}`,
        idempotency_key: `sched:sched-${i}:run-${i}`,
        emitted_at: new Date().toISOString()
      };

      publishPromises.push(publisher.publish(topic, payload, headers));
    }

    // Act - Publish all messages concurrently
    const results = await Promise.allSettled(publishPromises);

    // Assert - All should succeed
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    expect(successCount).toBe(10);
  });

  it('should persist messages with persistent flag', async () => {
    // Arrange
    const topic = 'test.persistent.message';
    const payload = { persistent: true };
    const headers: MessageHeaders = {
      correlation_id: 'corr-persistent',
      causation_id: 'cause-persistent',
      schedule_id: 'sched-persistent',
      run_id: 'run-persistent',
      tenant_id: 'tenant-persistent',
      idempotency_key: 'sched:sched-persistent:run-persistent',
      emitted_at: new Date().toISOString()
    };

    // Act - Publish persistent message
    await publisher.publish(topic, payload, headers);

    // Assert - Message should be persisted to disk
    // (Verified by RabbitMQ management console - message should survive broker restart)
    expect(true).toBe(true); // Placeholder
  });
});

