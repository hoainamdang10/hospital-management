import { GetRunUseCase, GetRunRequest } from '../../../../src/application/use-cases/GetRunUseCase';
import { IScheduleRunRepository } from '../../../../src/domain/repositories/IScheduleRunRepository';
import { ScheduleRun } from '../../../../src/domain/entities/ScheduleRun.entity';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';

describe('GetRunUseCase', () => {
  let useCase: GetRunUseCase;
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

    useCase = new GetRunUseCase(mockRunRepo);
  });

  const createTestRun = (): ScheduleRun => {
    return ScheduleRun.create(
      'test-schedule-id',
      TenantId.create('test-tenant'),
      new Date('2025-01-15T10:00:00Z'),
      5
    );
  };

  describe('get run', () => {
    it('should get run successfully', async () => {
      const run = createTestRun();
      const runId = run.getRunId();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId
      };

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.runId).toBe(runId);
    });

    it('should return complete run details', async () => {
      const run = createTestRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.runId).toBe(run.getRunId());
      expect(response.scheduleId).toBe('test-schedule-id');
      expect(response.tenantId).toBe('test-tenant');
      expect(response.dueAtUtc).toBe('2025-01-15T10:00:00.000Z');
      expect(response.status).toBe('DUE');
      expect(response.segment).toBe(5);
      expect(response.attempt).toBe(0); // Initial attempt is 0
    });

    it('should return null for optional fields if not set', async () => {
      const run = createTestRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.lockedBy).toBeNull();
      expect(response.lockedAtUtc).toBeNull();
      expect(response.startedAtUtc).toBeNull();
      expect(response.finishedAtUtc).toBeNull();
      expect(response.lastError).toBeNull();
    });

    it('should return locked run details', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.lockedBy).toBe('worker-1');
      expect(response.lockedAtUtc).toBeDefined();
      expect(response.lockedAtUtc).not.toBeNull();
    });

    it('should return started run details', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.status).toBe('RUNNING');
      expect(response.startedAtUtc).toBeDefined();
      expect(response.startedAtUtc).not.toBeNull();
    });

    it('should return failed run details', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsFailed('Test error');
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.status).toBe('FAILED');
      expect(response.lastError).toBe('Test error');
      expect(response.finishedAtUtc).toBeDefined();
      expect(response.finishedAtUtc).not.toBeNull();
      expect(response.attempt).toBe(1); // Failed once, attempt incremented from 0 to 1
    });

    it('should return succeeded run details', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();
      run.markAsEmitted('test.topic');
      run.markAsSucceeded();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.status).toBe('SUCCEEDED');
      expect(response.finishedAtUtc).toBeDefined();
      expect(response.finishedAtUtc).not.toBeNull();
    });
  });

  describe('validation', () => {
    it('should throw error if run not found', async () => {
      mockRunRepo.findById.mockResolvedValue(null);

      const request: GetRunRequest = {
        runId: 'non-existent-id'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Run non-existent-id not found');
    });
  });

  describe('timestamps', () => {
    it('should return dueAtUtc in ISO format', async () => {
      const run = createTestRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.dueAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return createdAtUtc in ISO format', async () => {
      const run = createTestRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.createdAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return updatedAtUtc in ISO format', async () => {
      const run = createTestRun();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.updatedAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return lockedAtUtc in ISO format if locked', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.lockedAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return startedAtUtc in ISO format if started', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.startedAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return finishedAtUtc in ISO format if finished', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();
      run.markAsEmitted('test.topic');
      run.markAsSucceeded();
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.finishedAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('edge cases', () => {
    it('should handle run with null segment', async () => {
      const run = ScheduleRun.create(
        'test-schedule-id',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z')
      );
      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.segment).toBeNull();
    });

    it('should handle run with multiple retries', async () => {
      const run = createTestRun();
      
      for (let i = 0; i < 3; i++) {
        run.acquireLock(`worker-${i}`);
        run.start(`worker-${i}`);
        run.markAsFailed(`Error ${i}`);
        if (i < 2) {
          run.retry();
        }
      }

      mockRunRepo.findById.mockResolvedValue(run);

      const request: GetRunRequest = {
        runId: run.getRunId()
      };

      const response = await useCase.execute(request);

      expect(response.attempt).toBe(3); // Failed 3 times (i=0,1,2), attempt incremented from 0 to 3
      expect(response.lastError).toBe('Error 2');
    });
  });
});

