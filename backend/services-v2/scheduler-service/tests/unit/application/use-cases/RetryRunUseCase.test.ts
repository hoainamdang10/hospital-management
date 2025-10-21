import { RetryRunUseCase, RetryRunRequest } from '../../../../src/application/use-cases/RetryRunUseCase';
import { IScheduleRunRepository } from '../../../../src/domain/repositories/IScheduleRunRepository';
import { ScheduleRun, ScheduleRunStatus } from '../../../../src/domain/entities/ScheduleRun.entity';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';

describe('RetryRunUseCase', () => {
  let useCase: RetryRunUseCase;
  let mockRunRepo: jest.Mocked<IScheduleRunRepository>;

  beforeEach(() => {
    mockRunRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByScheduleId: jest.fn(),
      deleteByScheduleId: jest.fn(),
      countByScheduleId: jest.fn()
    } as any;

    useCase = new RetryRunUseCase(mockRunRepo);
  });

  const createFailedRun = (): ScheduleRun => {
    const run = ScheduleRun.create(
      'test-schedule-id',
      TenantId.create('test-tenant'),
      new Date('2025-01-15T10:00:00Z'),
      5
    );

    run.acquireLock('worker-1');
    run.start('worker-1');
    run.markAsFailed('Test error');

    return run;
  };

  describe('retry run', () => {
    it('should retry failed run successfully', async () => {
      const run = createFailedRun();
      const runId = run.getRunId();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId
      };

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.runId).toBe(runId);
      expect(response.status).toBe(ScheduleRunStatus.DUE);
      expect(mockRunRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should reset status to DUE', async () => {
      const run = createFailedRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      await useCase.execute(request);

      const updatedRun = mockRunRepo.update.mock.calls[0][0];
      expect(updatedRun.getProps().status).toBe(ScheduleRunStatus.DUE);
    });

    it('should preserve attempt number', async () => {
      const run = createFailedRun();
      const originalAttempt = run.getProps().attempt;
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.attempt).toBe(originalAttempt);
    });

    it('should clear timestamps', async () => {
      const run = createFailedRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      await useCase.execute(request);

      const updatedRun = mockRunRepo.update.mock.calls[0][0];
      const props = updatedRun.getProps();
      expect(props.lockedBy).toBeUndefined();
      expect(props.lockedAtUtc).toBeUndefined();
      expect(props.startedAtUtc).toBeUndefined();
      expect(props.finishedAtUtc).toBeUndefined();
    });

    it('should clear last error', async () => {
      const run = createFailedRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      await useCase.execute(request);

      const updatedRun = mockRunRepo.update.mock.calls[0][0];
      expect(updatedRun.getProps().lastError).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should throw error if run not found', async () => {
      mockRunRepo.findById.mockResolvedValue(null);

      const request: RetryRunRequest = {
        runId: 'non-existent-id'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Run non-existent-id not found');
    });

    it('should throw error if run is not in FAILED status', async () => {
      const run = ScheduleRun.create(
        'test-schedule-id',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z'),
        5
      );
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      await expect(useCase.execute(request)).rejects.toThrow(
        `Cannot retry run ${run.getRunId()}: status is DUE, expected FAILED`
      );
    });

    it('should not update if run is not FAILED', async () => {
      const run = ScheduleRun.create(
        'test-schedule-id',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z'),
        5
      );
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      await expect(useCase.execute(request)).rejects.toThrow();
      expect(mockRunRepo.update).not.toHaveBeenCalled();
    });

    it('should throw error if run is RUNNING', async () => {
      const run = ScheduleRun.create(
        'test-schedule-id',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z'),
        5
      );
      run.acquireLock('worker-1');
      run.start('worker-1');
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      await expect(useCase.execute(request)).rejects.toThrow('expected FAILED');
    });

    it('should throw error if run is SUCCEEDED', async () => {
      const run = ScheduleRun.create(
        'test-schedule-id',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z'),
        5
      );
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();
      run.markAsEmitted('test.topic');
      run.markAsSucceeded();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      await expect(useCase.execute(request)).rejects.toThrow('expected FAILED');
    });
  });

  describe('response', () => {
    it('should return run ID', async () => {
      const run = createFailedRun();
      const runId = run.getRunId();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId
      };

      const response = await useCase.execute(request);

      expect(response.runId).toBe(runId);
    });

    it('should return schedule ID', async () => {
      const run = createFailedRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.scheduleId).toBe('test-schedule-id');
    });

    it('should return status as DUE', async () => {
      const run = createFailedRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.status).toBe(ScheduleRunStatus.DUE);
    });

    it('should return retriedAtUtc timestamp', async () => {
      const run = createFailedRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const beforeTime = new Date();
      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);
      const afterTime = new Date();

      const retriedAt = new Date(response.retriedAtUtc);
      expect(retriedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(retriedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should return retriedAtUtc in ISO format', async () => {
      const run = createFailedRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.retriedAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('edge cases', () => {
    it('should handle run with multiple previous failures', async () => {
      const run = ScheduleRun.create(
        'test-schedule-id',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z'),
        5
      );

      for (let i = 0; i < 3; i++) {
        run.acquireLock(`worker-${i}`);
        run.start(`worker-${i}`);
        run.markAsFailed(`Error ${i}`);
        if (i < 2) {
          run.retry();
        }
      }

      mockRunRepo.findById.mockResolvedValue(run);

      const request: RetryRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.status).toBe(ScheduleRunStatus.DUE);
      expect(response.attempt).toBe(3); // Failed 3 times (i=0,1,2), attempt is 3
    });
  });
});

