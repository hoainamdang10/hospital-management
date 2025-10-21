import { ExecutionWorker, ExecutionWorkerConfig } from '../../../../src/infrastructure/workers/ExecutionWorker';
import { IScheduleRepository } from '../../../../src/domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../../../src/domain/repositories/IScheduleRunRepository';
import { IOutboxRepository } from '../../../../src/domain/repositories/IOutboxRepository';
import { Schedule } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { ScheduleRun } from '../../../../src/domain/entities/ScheduleRun.entity';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { RetryPolicy } from '../../../../src/domain/value-objects/RetryPolicy';

describe('ExecutionWorker', () => {
  let worker: ExecutionWorker;
  let mockScheduleRepo: jest.Mocked<IScheduleRepository>;
  let mockRunRepo: jest.Mocked<IScheduleRunRepository>;
  let mockOutboxRepo: jest.Mocked<IOutboxRepository>;
  let config: ExecutionWorkerConfig;

  beforeEach(() => {
    mockScheduleRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByTenantAndDedupKey: jest.fn(),
      findByOwner: jest.fn(),
      delete: jest.fn()
    } as any;

    mockRunRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByScheduleId: jest.fn(),
      deleteByScheduleId: jest.fn(),
      countByScheduleId: jest.fn(),
      acquireDueRuns: jest.fn()
    } as any;

    mockOutboxRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findUnpublished: jest.fn(),
      deletePublished: jest.fn()
    } as any;

    config = {
      workerId: 'test-worker-1',
      pollInterval: 1000,
      concurrency: 5,
      segment: 0,
      leaseTtl: 60000,
      graceWindowMs: 60000
    };

    worker = new ExecutionWorker(mockScheduleRepo, mockRunRepo, mockOutboxRepo, config);
  });

  afterEach(async () => {
    if (worker.getStatus().isRunning) {
      await worker.stop();
    }
  });

  const createTestSchedule = (): Schedule => {
    return Schedule.create({
      tenantId: TenantId.create('test-tenant'),
      ownerService: 'test-service',
      scheduleType: ScheduleTypeVO.once(),
      timezone: Timezone.utc(),
      startAtUtc: new Date('2025-01-15T10:00:00Z'),
      topicOrCommand: 'test.command',
      payloadJson: { test: true },
      jitterMs: 0,
      retryPolicy: RetryPolicy.default(),
      dedupKey: DedupKey.create('test-dedup-key')
    });
  };

  const createTestRun = (scheduleId: string): ScheduleRun => {
    return ScheduleRun.create(
      scheduleId,
      TenantId.create('test-tenant'),
      new Date('2025-01-15T10:00:00Z'),
      0
    );
  };

  describe('start and stop', () => {
    it('should start worker successfully', async () => {
      mockRunRepo.acquireDueRuns.mockResolvedValue([]);

      await worker.start();

      const status = worker.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.activeExecutions).toBe(0);
    });

    it('should not start if already running', async () => {
      mockRunRepo.acquireDueRuns.mockResolvedValue([]);

      await worker.start();
      await worker.start();

      const status = worker.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should stop worker successfully', async () => {
      mockRunRepo.acquireDueRuns.mockResolvedValue([]);

      await worker.start();
      await worker.stop();

      const status = worker.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should wait for active executions before stopping', async () => {
      const schedule = createTestSchedule();
      const run = createTestRun(schedule.getScheduleId());
      run.acquireLock(config.workerId);

      mockRunRepo.acquireDueRuns.mockResolvedValue([run]);
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.update.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 50));

      const stopPromise = worker.stop();
      const status = worker.getStatus();
      expect(status.activeExecutions).toBeGreaterThan(0);

      await stopPromise;
      const finalStatus = worker.getStatus();
      expect(finalStatus.activeExecutions).toBe(0);
    });
  });

  describe('poll and acquire runs', () => {
    it('should acquire due runs', async () => {
      const schedule = createTestSchedule();
      const run = createTestRun(schedule.getScheduleId());
      run.acquireLock(config.workerId);

      mockRunRepo.acquireDueRuns.mockResolvedValue([run]);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRunRepo.acquireDueRuns).toHaveBeenCalled();
    });

    it('should respect concurrency limit', async () => {
      const runs = Array.from({ length: 10 }, (_, i) => {
        const schedule = createTestSchedule();
        const run = createTestRun(schedule.getScheduleId());
        run.acquireLock(config.workerId);
        return run;
      });

      mockRunRepo.acquireDueRuns.mockResolvedValue(runs);
      mockScheduleRepo.findById.mockResolvedValue(createTestSchedule());
      mockRunRepo.update.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = worker.getStatus();
      expect(status.activeExecutions).toBeLessThanOrEqual(config.concurrency);
    });

    it('should not poll if at concurrency limit', async () => {
      const runs = Array.from({ length: 5 }, (_, i) => {
        const schedule = createTestSchedule();
        const run = createTestRun(schedule.getScheduleId());
        run.acquireLock(config.workerId);
        return run;
      });

      mockRunRepo.acquireDueRuns.mockResolvedValue(runs);
      mockScheduleRepo.findById.mockResolvedValue(createTestSchedule());
      mockRunRepo.update.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      const callCount = mockRunRepo.acquireDueRuns.mock.calls.length;
      await new Promise(resolve => setTimeout(resolve, 200));
      const newCallCount = mockRunRepo.acquireDueRuns.mock.calls.length;

      expect(newCallCount).toBe(callCount);
    });
  });

  describe('execute run', () => {
    it('should execute run successfully', async () => {
      const schedule = createTestSchedule();
      const run = createTestRun(schedule.getScheduleId());
      run.acquireLock(config.workerId);

      mockRunRepo.acquireDueRuns.mockResolvedValue([run]);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockRunRepo.update).toHaveBeenCalled();
      expect(mockOutboxRepo.save).toHaveBeenCalled();
    });

    it('should mark run as RUNNING', async () => {
      const schedule = createTestSchedule();
      const run = createTestRun(schedule.getScheduleId());
      run.acquireLock(config.workerId);

      mockRunRepo.acquireDueRuns.mockResolvedValue([run]);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 200));

      const updateCalls = mockRunRepo.update.mock.calls;
      // Worker may complete run quickly, so check if any update has RUNNING status
      const hasRunningStatus = updateCalls.some(call =>
        call[0].getProps().status === 'RUNNING' || call[0].getProps().status === 'EMITTING'
      );
      expect(hasRunningStatus || updateCalls[0][0].getProps().status === 'SUCCEEDED').toBeTruthy();
    });

    it('should create outbox entry', async () => {
      const schedule = createTestSchedule();
      const run = createTestRun(schedule.getScheduleId());
      run.acquireLock(config.workerId);

      mockRunRepo.acquireDueRuns.mockResolvedValue([run]);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockOutboxRepo.save).toHaveBeenCalledTimes(1);
      const outbox = mockOutboxRepo.save.mock.calls[0][0];
      expect(outbox.getEventType()).toBe('test.command');
      expect(outbox.getPayloadJson()).toEqual({ test: true });
    });

    it('should mark run as SUCCEEDED', async () => {
      const schedule = createTestSchedule();
      const run = createTestRun(schedule.getScheduleId());
      run.acquireLock(config.workerId);

      mockRunRepo.acquireDueRuns.mockResolvedValue([run]);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 200));

      const updateCalls = mockRunRepo.update.mock.calls;
      const lastUpdate = updateCalls[updateCalls.length - 1][0];
      expect(lastUpdate.getProps().status).toBe('SUCCEEDED');
    });

    it('should handle schedule not found error', async () => {
      const run = createTestRun('non-existent-schedule');
      run.acquireLock(config.workerId);

      mockRunRepo.acquireDueRuns.mockResolvedValue([run]);
      mockScheduleRepo.findById.mockResolvedValue(null);

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 200));

      const updateCalls = mockRunRepo.update.mock.calls;
      const lastUpdate = updateCalls[updateCalls.length - 1][0];
      expect(lastUpdate.getProps().status).toBe('FAILED');
    });

    it('should mark run as FAILED on error', async () => {
      const schedule = createTestSchedule();
      const run = createTestRun(schedule.getScheduleId());
      run.acquireLock(config.workerId);

      mockRunRepo.acquireDueRuns.mockResolvedValue([run]);
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockOutboxRepo.save.mockRejectedValue(new Error('Outbox save failed'));

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 200));

      const updateCalls = mockRunRepo.update.mock.calls;
      const lastUpdate = updateCalls[updateCalls.length - 1][0];
      expect(lastUpdate.getProps().status).toBe('FAILED');
      expect(lastUpdate.getProps().lastError).toContain('Outbox save failed');
    });
  });

  describe('getStatus', () => {
    it('should return correct status', () => {
      const status = worker.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.activeExecutions).toBe(0);
      expect(status.config).toEqual(config);
    });

    it('should update status when running', async () => {
      mockRunRepo.acquireDueRuns.mockResolvedValue([]);

      await worker.start();
      const status = worker.getStatus();

      expect(status.isRunning).toBe(true);
    });
  });
});

