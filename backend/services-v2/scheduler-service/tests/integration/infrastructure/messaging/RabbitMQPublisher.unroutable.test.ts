/**
 * Integration Tests for RabbitMQPublisher - Unroutable Messages
 * Tests the handling of unroutable messages and metrics tracking
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { RabbitMQPublisher, RabbitMQConfig, MessageHeaders } from '../../../../src/infrastructure/messaging/RabbitMQPublisher';
import { MetricsCollector } from '../../../../src/infrastructure/observability/MetricsCollector';
import { IDeadLetterRepository } from '../../../../src/domain/repositories/IDeadLetterRepository';
import { DeadLetter } from '../../../../src/domain/entities/DeadLetter.entity';

// Mock DeadLetterRepository
class MockDeadLetterRepository implements IDeadLetterRepository {
  private deadLetters: DeadLetter[] = [];

  async save(deadLetter: DeadLetter): Promise<void> {
    this.deadLetters.push(deadLetter);
  }

  async findById(id: string): Promise<DeadLetter | null> {
    return this.deadLetters.find(dl => dl.getId() === id) || null;
  }

  async findByScheduleId(scheduleId: string, limit?: number): Promise<DeadLetter[]> {
    const filtered = this.deadLetters.filter(dl => dl.getScheduleId() === scheduleId);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async findByTenantId(tenantId: string, limit?: number): Promise<DeadLetter[]> {
    const filtered = this.deadLetters.filter(dl => dl.getTenantId()?.getValue() === tenantId);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async deleteOlderThan(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialLength = this.deadLetters.length;
    this.deadLetters = this.deadLetters.filter(dl =>
      dl.getStoredAtUtc() > cutoffDate
    );
    return initialLength - this.deadLetters.length;
  }

  async delete(id: string): Promise<void> {
    this.deadLetters = this.deadLetters.filter(dl => dl.getId() !== id);
  }

  // Helper methods for testing
  getDeadLetters(): DeadLetter[] {
    return this.deadLetters;
  }

  clear(): void {
    this.deadLetters = [];
  }
}

describe('RabbitMQPublisher - Unroutable Messages Integration', () => {
  let publisher: RabbitMQPublisher;
  let deadLetterRepo: MockDeadLetterRepository;
  let metricsCollector: MetricsCollector;
  
  const config: RabbitMQConfig = {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
    exchange: 'test.scheduler.exchange',
    exchangeType: 'topic',
    durable: true
  };

  beforeAll(async () => {
    deadLetterRepo = new MockDeadLetterRepository();
    metricsCollector = MetricsCollector.getInstance();
    
    publisher = new RabbitMQPublisher(
      config,
      deadLetterRepo
    );

    await publisher.connect();
  });

  afterAll(async () => {
    await publisher.close();
  });

  beforeEach(() => {
    deadLetterRepo.clear();
    metricsCollector.reset();
  });

  describe('Unroutable Message Detection', () => {
    it('should detect unroutable message when no queue is bound', async () => {
      // Arrange
      const invalidRoutingKey = 'invalid.routing.key.no.queue.bound';
      const headers: MessageHeaders = {
        correlation_id: 'test-correlation-1',
        causation_id: 'test-causation-1',
        schedule_id: 'test-schedule-1',
        run_id: 'test-run-1',
        tenant_id: 'test-tenant',
        idempotency_key: 'test-idempotency-1',
        emitted_at: new Date().toISOString()
      };
      const payload = { test: 'data' };

      // Act
      await publisher.publish(invalidRoutingKey, payload, headers);

      // Wait for return event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Assert
      const deadLetters = deadLetterRepo.getDeadLetters();
      expect(deadLetters.length).toBeGreaterThan(0);

      const unroutableDeadLetter = deadLetters.find(
        dl => dl.getMessageId() === headers.idempotency_key
      );
      expect(unroutableDeadLetter).toBeDefined();
      expect(unroutableDeadLetter?.getRoutingKey()).toBe(invalidRoutingKey);
      expect(unroutableDeadLetter?.getExchange()).toBe(config.exchange);
      expect(unroutableDeadLetter?.getFailureType()).toBe('unroutable_message');
    });

    it('should increment Prometheus metrics for unroutable messages', async () => {
      // Arrange
      const invalidRoutingKey = 'test.unroutable.metrics';
      const headers: MessageHeaders = {
        correlation_id: 'test-correlation-2',
        causation_id: 'test-causation-2',
        schedule_id: 'test-schedule-2',
        run_id: 'test-run-2',
        tenant_id: 'test-tenant',
        idempotency_key: 'test-idempotency-2',
        emitted_at: new Date().toISOString()
      };
      const payload = { test: 'metrics' };

      // Act
      await publisher.publish(invalidRoutingKey, payload, headers);

      // Wait for return event and metrics update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Assert
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain('scheduler_unroutable_messages_total');
      expect(metrics).toContain(`routing_key="${invalidRoutingKey}"`);
      expect(metrics).toContain(`exchange="${config.exchange}"`);
      expect(metrics).toContain('scheduler_unroutable_messages_by_exchange_total');
    });

    it('should save message payload and headers to dead_letters', async () => {
      // Arrange
      const invalidRoutingKey = 'test.unroutable.payload';
      const headers: MessageHeaders = {
        correlation_id: 'test-correlation-3',
        causation_id: 'test-causation-3',
        schedule_id: 'test-schedule-3',
        run_id: 'test-run-3',
        tenant_id: 'test-tenant',
        idempotency_key: 'test-idempotency-3',
        emitted_at: new Date().toISOString()
      };
      const payload = {
        appointmentId: 'apt_123',
        patientId: 'pat_456',
        message: 'Test unroutable message'
      };

      // Act
      await publisher.publish(invalidRoutingKey, payload, headers);

      // Wait for return event
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Assert
      const deadLetters = deadLetterRepo.getDeadLetters();
      const unroutableDeadLetter = deadLetters.find(
        dl => dl.getMessageId() === headers.idempotency_key
      );

      expect(unroutableDeadLetter).toBeDefined();
      expect(unroutableDeadLetter?.getPayload()).toEqual(payload);
      expect(unroutableDeadLetter?.getHeaders()).toMatchObject(headers);
    });
  });

  describe('Multiple Unroutable Messages', () => {
    it('should track multiple unroutable messages separately', async () => {
      // Arrange
      const scenarios = [
        { routingKey: 'test.unroutable.1', idempotencyKey: 'test-1' },
        { routingKey: 'test.unroutable.2', idempotencyKey: 'test-2' },
        { routingKey: 'test.unroutable.3', idempotencyKey: 'test-3' }
      ];

      // Act
      for (const scenario of scenarios) {
        const headers: MessageHeaders = {
          correlation_id: `correlation-${scenario.idempotencyKey}`,
          causation_id: `causation-${scenario.idempotencyKey}`,
          schedule_id: `schedule-${scenario.idempotencyKey}`,
          run_id: `run-${scenario.idempotencyKey}`,
          tenant_id: 'test-tenant',
          idempotency_key: scenario.idempotencyKey,
          emitted_at: new Date().toISOString()
        };
        await publisher.publish(scenario.routingKey, { test: 'data' }, headers);
      }

      // Wait for all return events
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Assert
      const deadLetters = deadLetterRepo.getDeadLetters();
      expect(deadLetters.length).toBeGreaterThanOrEqual(scenarios.length);

      scenarios.forEach(scenario => {
        const deadLetter = deadLetters.find(dl => dl.getMessageId() === scenario.idempotencyKey);
        expect(deadLetter).toBeDefined();
        expect(deadLetter?.getRoutingKey()).toBe(scenario.routingKey);
      });
    });

    it('should aggregate metrics by exchange', async () => {
      // Arrange
      const routingKeys = [
        'test.unroutable.a',
        'test.unroutable.b',
        'test.unroutable.c'
      ];

      // Act
      for (let i = 0; i < routingKeys.length; i++) {
        const headers: MessageHeaders = {
          correlation_id: `correlation-${i}`,
          causation_id: `causation-${i}`,
          schedule_id: `schedule-${i}`,
          run_id: `run-${i}`,
          tenant_id: 'test-tenant',
          idempotency_key: `idempotency-${i}`,
          emitted_at: new Date().toISOString()
        };
        await publisher.publish(routingKeys[i], { test: 'data' }, headers);
      }

      // Wait for all return events
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Assert
      const metrics = await metricsCollector.getMetrics();
      
      // Check individual routing key metrics
      routingKeys.forEach(routingKey => {
        expect(metrics).toContain(`routing_key="${routingKey}"`);
      });

      // Check exchange aggregation
      expect(metrics).toContain(`exchange="${config.exchange}"`);
      expect(metrics).toContain('scheduler_unroutable_messages_by_exchange_total');
    });
  });

  describe('Error Handling', () => {
    it('should handle unroutable message even if dead letter save fails', async () => {
      // Arrange
      const failingRepo: IDeadLetterRepository = {
        save: jest.fn().mockRejectedValue(new Error('Database error')),
        findById: jest.fn(),
        findByScheduleId: jest.fn(),
        findByTenantId: jest.fn(),
        deleteOlderThan: jest.fn(),
        delete: jest.fn()
      };

      const publisherWithFailingRepo = new RabbitMQPublisher(
        config,
        failingRepo
      );

      await publisherWithFailingRepo.connect();

      const headers: MessageHeaders = {
        correlation_id: 'test-correlation-error',
        causation_id: 'test-causation-error',
        schedule_id: 'test-schedule-error',
        run_id: 'test-run-error',
        tenant_id: 'test-tenant',
        idempotency_key: 'test-idempotency-error',
        emitted_at: new Date().toISOString()
      };

      // Act & Assert - Should not throw
      await expect(
        publisherWithFailingRepo.publish('test.unroutable.error', { test: 'data' }, headers)
      ).resolves.not.toThrow();

      // Wait for return event
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Metrics should still be incremented
      const metrics = await metricsCollector.getMetrics();
      expect(metrics).toContain('scheduler_unroutable_messages_total');

      await publisherWithFailingRepo.close();
    });
  });
});

