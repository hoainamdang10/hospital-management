import { CleanerWorker, CleanerWorkerConfig } from '../../src/infrastructure/workers/CleanerWorker';
import { IScheduleRunRepository } from '../../src/domain/repositories/IScheduleRunRepository';
import { IOutboxRepository } from '../../src/domain/repositories/IOutboxRepository';
import { IDeadLetterRepository } from '../../src/domain/repositories/IDeadLetterRepository';

describe('CleanerWorker', () => {
  let worker: CleanerWorker;
  let mockRunRepo: jest.Mocked<IScheduleRunRepository>;
  let mockOutboxRepo: jest.Mocked<IOutboxRepository>;
  let mockDeadLetterRepo: jest.Mocked<IDeadLetterRepository>;
  let config: CleanerWorkerConfig;

  beforeEach(() => {
    mockRunRepo = {
      deleteOlderThan: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByScheduleId: jest.fn(),
      findDueRuns: jest.fn(),
      acquireDueRuns: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByScheduleId: jest.fn(),
      countByScheduleId: jest.fn()
    } as any;

    mockOutboxRepo = {
      deletePublished: jest.fn(),
      save: jest.fn(),
      findUnpublished: jest.fn(),
      update: jest.fn()
    } as any;

    mockDeadLetterRepo = {
      deleteOlderThan: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByScheduleId: jest.fn(),
      findByTenantId: jest.fn(),
      delete: jest.fn()
    } as any;

    config = {
      interval: 86400000, // 24 hours
      completedRunsRetentionDays: 30,
      publishedOutboxRetentionDays: 7,
      deadLettersRetentionDays: 90
    };

    worker = new CleanerWorker(mockRunRepo, mockOutboxRepo, mockDeadLetterRepo, config);
  });

  afterEach(async () => {
    await worker.stop();
  });

  describe('Cleanup Operations', () => {
    it('should delete completed runs older than retention period', async () => {
      mockRunRepo.deleteOlderThan.mockResolvedValue(150);
      mockOutboxRepo.deletePublished.mockResolvedValue(0);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(0);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.deleteOlderThan).toHaveBeenCalledWith(30);
      expect(mockRunRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
    });

    it('should delete published outbox older than retention period', async () => {
      mockRunRepo.deleteOlderThan.mockResolvedValue(0);
      mockOutboxRepo.deletePublished.mockResolvedValue(50);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(0);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockOutboxRepo.deletePublished).toHaveBeenCalledTimes(1);
      const callArgs = mockOutboxRepo.deletePublished.mock.calls[0][0];
      expect(callArgs).toBeInstanceOf(Date);
    });

    it('should delete dead letters older than retention period', async () => {
      mockRunRepo.deleteOlderThan.mockResolvedValue(0);
      mockOutboxRepo.deletePublished.mockResolvedValue(0);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(25);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockDeadLetterRepo.deleteOlderThan).toHaveBeenCalledWith(90);
      expect(mockDeadLetterRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
    });

    it('should perform all cleanup operations in one cycle', async () => {
      mockRunRepo.deleteOlderThan.mockResolvedValue(100);
      mockOutboxRepo.deletePublished.mockResolvedValue(50);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(25);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
      expect(mockOutboxRepo.deletePublished).toHaveBeenCalledTimes(1);
      expect(mockDeadLetterRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should continue cleanup if one operation fails', async () => {
      mockRunRepo.deleteOlderThan.mockRejectedValue(new Error('Database error'));
      mockOutboxRepo.deletePublished.mockResolvedValue(50);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(25);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      // Verify all operations were attempted despite first one failing
      expect(mockRunRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
      expect(mockOutboxRepo.deletePublished).toHaveBeenCalledTimes(1);
      expect(mockDeadLetterRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
    });

    it('should not throw if all operations fail', async () => {
      mockRunRepo.deleteOlderThan.mockRejectedValue(new Error('Error 1'));
      mockOutboxRepo.deletePublished.mockRejectedValue(new Error('Error 2'));
      mockDeadLetterRepo.deleteOlderThan.mockRejectedValue(new Error('Error 3'));

      // Should not throw even if all operations fail
      await expect(worker.start()).resolves.not.toThrow();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      // Verify all operations were attempted
      expect(mockRunRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
      expect(mockOutboxRepo.deletePublished).toHaveBeenCalledTimes(1);
      expect(mockDeadLetterRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
    });
  });

  describe('Worker Lifecycle', () => {
    it('should start and stop correctly', async () => {
      mockRunRepo.deleteOlderThan.mockResolvedValue(0);
      mockOutboxRepo.deletePublished.mockResolvedValue(0);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(0);

      await worker.start();
      expect(worker.getStatus().isRunning).toBe(true);

      await worker.stop();
      expect(worker.getStatus().isRunning).toBe(false);
    });

    it('should not start if already running', async () => {
      mockRunRepo.deleteOlderThan.mockResolvedValue(0);
      mockOutboxRepo.deletePublished.mockResolvedValue(0);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(0);

      await worker.start();

      // Try to start again - should be ignored
      await worker.start();

      // Worker should still be running
      expect(worker.getStatus().isRunning).toBe(true);

      await worker.stop();
    });

    it('should run cleanup immediately on start', async () => {
      mockRunRepo.deleteOlderThan.mockResolvedValue(10);
      mockOutboxRepo.deletePublished.mockResolvedValue(5);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(2);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRunRepo.deleteOlderThan).toHaveBeenCalledTimes(1);
      expect(mockOutboxRepo.deletePublished).toHaveBeenCalledTimes(1);
      expect(mockDeadLetterRepo.deleteOlderThan).toHaveBeenCalledTimes(1);

      await worker.stop();
    });
  });

  describe('Configuration', () => {
    it('should use custom retention periods', async () => {
      const customConfig: CleanerWorkerConfig = {
        interval: 3600000, // 1 hour
        completedRunsRetentionDays: 60,
        publishedOutboxRetentionDays: 14,
        deadLettersRetentionDays: 180
      };

      const customWorker = new CleanerWorker(
        mockRunRepo,
        mockOutboxRepo,
        mockDeadLetterRepo,
        customConfig
      );

      mockRunRepo.deleteOlderThan.mockResolvedValue(0);
      mockOutboxRepo.deletePublished.mockResolvedValue(0);
      mockDeadLetterRepo.deleteOlderThan.mockResolvedValue(0);

      await customWorker.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRunRepo.deleteOlderThan).toHaveBeenCalledWith(60);
      expect(mockDeadLetterRepo.deleteOlderThan).toHaveBeenCalledWith(180);

      await customWorker.stop();
    });

    it('should return correct status', async () => {
      const status = worker.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.config).toEqual(config);
    });
  });
});

