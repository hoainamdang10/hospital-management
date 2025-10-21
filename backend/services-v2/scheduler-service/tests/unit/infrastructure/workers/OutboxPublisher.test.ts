import { OutboxPublisher, OutboxPublisherConfig } from '../../../../src/infrastructure/workers/OutboxPublisher';
import { IOutboxRepository } from '../../../../src/domain/repositories/IOutboxRepository';
import { RabbitMQPublisher } from '../../../../src/infrastructure/messaging/RabbitMQPublisher';
import { Outbox } from '../../../../src/domain/entities/Outbox.entity';

describe('OutboxPublisher', () => {
  let publisher: OutboxPublisher;
  let mockOutboxRepo: jest.Mocked<IOutboxRepository>;
  let mockRabbitMQ: jest.Mocked<RabbitMQPublisher>;
  let config: OutboxPublisherConfig;

  beforeEach(() => {
    mockOutboxRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findUnpublished: jest.fn(),
      deletePublished: jest.fn()
    } as any;

    mockRabbitMQ = {
      publish: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    } as any;

    config = {
      interval: 1000,
      batchSize: 10,
      maxRetries: 5
    };

    publisher = new OutboxPublisher(mockOutboxRepo, mockRabbitMQ, config);
  });

  afterEach(async () => {
    if (publisher.getStatus().isRunning) {
      await publisher.stop();
    }
  });

  const createTestOutbox = (id: number = 1): Outbox => {
    return Outbox.create(
      `run-${id}`,
      'test.event',
      { test: true, id },
      {
        correlation_id: `corr-${id}`,
        causation_id: `cause-${id}`,
        schedule_id: `schedule-${id}`,
        run_id: `run-${id}`,
        tenant_id: 'test-tenant',
        idempotency_key: `key-${id}`,
        emitted_at: new Date().toISOString()
      }
    );
  };

  describe('start and stop', () => {
    it('should start publisher successfully', async () => {
      mockOutboxRepo.findUnpublished.mockResolvedValue([]);

      await publisher.start();

      const status = publisher.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should not start if already running', async () => {
      mockOutboxRepo.findUnpublished.mockResolvedValue([]);

      await publisher.start();
      await publisher.start();

      const status = publisher.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should stop publisher successfully', async () => {
      mockOutboxRepo.findUnpublished.mockResolvedValue([]);

      await publisher.start();
      await publisher.stop();

      const status = publisher.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe('publish', () => {
    it('should publish unpublished entries', async () => {
      const entry = createTestOutbox(1);
      mockOutboxRepo.findUnpublished.mockResolvedValue([entry]);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(1);
      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        'test.event',
        { test: true, id: 1 },
        expect.objectContaining({
          correlation_id: 'corr-1',
          causation_id: 'cause-1'
        })
      );
    });

    it('should mark entry as published after successful publish', async () => {
      const entry = createTestOutbox(1);
      mockOutboxRepo.findUnpublished.mockResolvedValue([entry]);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOutboxRepo.update).toHaveBeenCalledTimes(1);
      const updatedEntry = mockOutboxRepo.update.mock.calls[0][0];
      expect(updatedEntry.isPublished()).toBe(true);
    });

    it('should publish multiple entries in batch', async () => {
      const entries = [
        createTestOutbox(1),
        createTestOutbox(2),
        createTestOutbox(3)
      ];
      mockOutboxRepo.findUnpublished.mockResolvedValue(entries);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(3);
      expect(mockOutboxRepo.update).toHaveBeenCalledTimes(3);
    });

    it('should respect batch size', async () => {
      const entries = Array.from({ length: 20 }, (_, i) => createTestOutbox(i + 1));
      mockOutboxRepo.findUnpublished.mockResolvedValue(entries);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOutboxRepo.findUnpublished).toHaveBeenCalledWith(config.batchSize);
    });

    it('should not publish if no unpublished entries', async () => {
      mockOutboxRepo.findUnpublished.mockResolvedValue([]);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should record publish attempt on failure', async () => {
      const entry = createTestOutbox(1);
      mockOutboxRepo.findUnpublished.mockResolvedValue([entry]);
      mockRabbitMQ.publish.mockRejectedValue(new Error('Publish failed'));

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOutboxRepo.update).toHaveBeenCalledTimes(1);
      const updatedEntry = mockOutboxRepo.update.mock.calls[0][0];
      expect(updatedEntry.getProps().publishAttempts).toBe(1);
      expect(updatedEntry.getProps().lastPublishError).toBe('Publish failed');
    });

    it('should skip entry if max retries exceeded', async () => {
      const entry = createTestOutbox(1);
      for (let i = 0; i < 5; i++) {
        entry.recordPublishAttempt('Previous error');
      }

      mockOutboxRepo.findUnpublished.mockResolvedValue([entry]);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).not.toHaveBeenCalled();
    });

    it('should continue publishing other entries if one fails', async () => {
      const entry1 = createTestOutbox(1);
      const entry2 = createTestOutbox(2);
      const entry3 = createTestOutbox(3);

      mockOutboxRepo.findUnpublished.mockResolvedValue([entry1, entry2, entry3]);
      mockRabbitMQ.publish
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Publish failed'))
        .mockResolvedValueOnce(undefined);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(3);
      expect(mockOutboxRepo.update).toHaveBeenCalledTimes(3);
    });

    it('should handle repository errors gracefully', async () => {
      mockOutboxRepo.findUnpublished.mockRejectedValue(new Error('Database error'));

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).not.toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      const entry = createTestOutbox(1);
      mockOutboxRepo.findUnpublished.mockResolvedValue([entry]);
      mockOutboxRepo.update.mockRejectedValue(new Error('Update failed'));

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry logic', () => {
    it('should retry failed entries on next cycle', async () => {
      const entry = createTestOutbox(1);
      mockOutboxRepo.findUnpublished
        .mockResolvedValueOnce([entry])
        .mockResolvedValueOnce([entry]);
      mockRabbitMQ.publish
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(2);
    });

    it('should increment publish attempts on each retry', async () => {
      const entry = createTestOutbox(1);
      mockOutboxRepo.findUnpublished.mockResolvedValue([entry]);
      mockRabbitMQ.publish.mockRejectedValue(new Error('Publish failed'));

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      const firstUpdate = mockOutboxRepo.update.mock.calls[0][0];
      expect(firstUpdate.getProps().publishAttempts).toBe(1);

      mockOutboxRepo.findUnpublished.mockResolvedValue([firstUpdate]);
      await new Promise(resolve => setTimeout(resolve, 1100));

      const secondUpdate = mockOutboxRepo.update.mock.calls[1][0];
      expect(secondUpdate.getProps().publishAttempts).toBe(2);
    });
  });

  describe('getStatus', () => {
    it('should return correct status', () => {
      const status = publisher.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.config).toEqual(config);
    });

    it('should update status when running', async () => {
      mockOutboxRepo.findUnpublished.mockResolvedValue([]);

      await publisher.start();
      const status = publisher.getStatus();

      expect(status.isRunning).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty batch', async () => {
      mockOutboxRepo.findUnpublished.mockResolvedValue([]);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).not.toHaveBeenCalled();
      expect(mockOutboxRepo.update).not.toHaveBeenCalled();
    });

    it('should handle single entry batch', async () => {
      const entry = createTestOutbox(1);
      mockOutboxRepo.findUnpublished.mockResolvedValue([entry]);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(1);
      expect(mockOutboxRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should handle large batch', async () => {
      const entries = Array.from({ length: 100 }, (_, i) => createTestOutbox(i + 1));
      mockOutboxRepo.findUnpublished.mockResolvedValue(entries);

      await publisher.start();
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockRabbitMQ.publish).toHaveBeenCalledTimes(100);
      expect(mockOutboxRepo.update).toHaveBeenCalledTimes(100);
    });
  });
});

