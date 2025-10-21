import { GetScheduleRunsUseCase, GetScheduleRunsRequest } from '../../../../src/application/use-cases/GetScheduleRunsUseCase';
import { IScheduleRunRepository } from '../../../../src/domain/repositories/IScheduleRunRepository';
import { ScheduleRun } from '../../../../src/domain/entities/ScheduleRun.entity';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';

describe('GetScheduleRunsUseCase', () => {
  let useCase: GetScheduleRunsUseCase;
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

    useCase = new GetScheduleRunsUseCase(mockRunRepo);
  });

  const createTestRun = (scheduleId: string, dueAt: Date): ScheduleRun => {
    return ScheduleRun.create(
      scheduleId,
      TenantId.create('test-tenant'),
      dueAt,
      5
    );
  };

  describe('get schedule runs', () => {
    it('should get runs successfully', async () => {
      const run1 = createTestRun('schedule-1', new Date('2025-01-15T10:00:00Z'));
      const run2 = createTestRun('schedule-1', new Date('2025-01-15T11:00:00Z'));
      mockRunRepo.findByScheduleId.mockResolvedValue([run1, run2]);
      mockRunRepo.countByScheduleId.mockResolvedValue(2);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.runs).toHaveLength(2);
      expect(response.total).toBe(2);
    });

    it('should return run details', async () => {
      const run = createTestRun('schedule-1', new Date('2025-01-15T10:00:00Z'));
      mockRunRepo.findByScheduleId.mockResolvedValue([run]);
      mockRunRepo.countByScheduleId.mockResolvedValue(1);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      const response = await useCase.execute(request);

      const runData = response.runs[0];
      expect(runData.runId).toBe(run.getRunId());
      expect(runData.scheduleId).toBe('schedule-1');
      expect(runData.tenantId).toBe('test-tenant');
      expect(runData.dueAtUtc).toBe('2025-01-15T10:00:00.000Z');
      expect(runData.status).toBe('DUE');
      expect(runData.attempt).toBe(0);
      expect(runData.segment).toBe(5);
    });

    it('should use default limit of 100', async () => {
      const runs = Array.from({ length: 150 }, (_, i) =>
        createTestRun('schedule-1', new Date(`2025-01-15T${String(i % 24).padStart(2, '0')}:00:00Z`))
      );
      mockRunRepo.findByScheduleId.mockResolvedValue(runs);
      mockRunRepo.countByScheduleId.mockResolvedValue(150);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      await useCase.execute(request);

      expect(mockRunRepo.findByScheduleId).toHaveBeenCalledWith('schedule-1', 100, 0);
    });

    it('should use custom limit', async () => {
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1',
        limit: 50
      };

      await useCase.execute(request);

      expect(mockRunRepo.findByScheduleId).toHaveBeenCalledWith('schedule-1', 50, 0);
    });

    it('should use default offset of 0', async () => {
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      await useCase.execute(request);

      expect(mockRunRepo.findByScheduleId).toHaveBeenCalledWith('schedule-1', 100, 0);
    });

    it('should use custom offset', async () => {
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1',
        offset: 25
      };

      await useCase.execute(request);

      expect(mockRunRepo.findByScheduleId).toHaveBeenCalledWith('schedule-1', 100, 25);
    });

    it('should use custom limit and offset', async () => {
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1',
        limit: 20,
        offset: 40
      };

      await useCase.execute(request);

      expect(mockRunRepo.findByScheduleId).toHaveBeenCalledWith('schedule-1', 20, 40);
    });
  });

  describe('run details', () => {
    it('should include locked run details', async () => {
      const run = createTestRun('schedule-1', new Date('2025-01-15T10:00:00Z'));
      run.acquireLock('worker-1');
      mockRunRepo.findByScheduleId.mockResolvedValue([run]);
      mockRunRepo.countByScheduleId.mockResolvedValue(1);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      const response = await useCase.execute(request);

      const runData = response.runs[0];
      expect(runData.lockedBy).toBe('worker-1');
      expect(runData.lockedAtUtc).toBeDefined();
    });

    it('should include started run details', async () => {
      const run = createTestRun('schedule-1', new Date('2025-01-15T10:00:00Z'));
      run.acquireLock('worker-1');
      run.start('worker-1');
      mockRunRepo.findByScheduleId.mockResolvedValue([run]);
      mockRunRepo.countByScheduleId.mockResolvedValue(1);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      const response = await useCase.execute(request);

      const runData = response.runs[0];
      expect(runData.status).toBe('RUNNING');
      expect(runData.startedAtUtc).toBeDefined();
    });

    it('should include failed run details', async () => {
      const run = createTestRun('schedule-1', new Date('2025-01-15T10:00:00Z'));
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsFailed('Test error');
      mockRunRepo.findByScheduleId.mockResolvedValue([run]);
      mockRunRepo.countByScheduleId.mockResolvedValue(1);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      const response = await useCase.execute(request);

      const runData = response.runs[0];
      expect(runData.status).toBe('FAILED');
      expect(runData.lastError).toBe('Test error');
      expect(runData.finishedAtUtc).toBeDefined();
      expect(runData.attempt).toBe(1); // Failed once, so attempt incremented from 0 to 1
    });

    it('should include succeeded run details', async () => {
      const run = createTestRun('schedule-1', new Date('2025-01-15T10:00:00Z'));
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();
      run.markAsEmitted('test.topic');
      run.markAsSucceeded();
      mockRunRepo.findByScheduleId.mockResolvedValue([run]);
      mockRunRepo.countByScheduleId.mockResolvedValue(1);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      const response = await useCase.execute(request);

      const runData = response.runs[0];
      expect(runData.status).toBe('SUCCEEDED');
      expect(runData.finishedAtUtc).toBeDefined();
    });
  });

  describe('empty results', () => {
    it('should return empty array if no runs found', async () => {
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      const response = await useCase.execute(request);

      expect(response.runs).toEqual([]);
      expect(response.total).toBe(0);
    });

    it('should not throw error if no runs found', async () => {
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'non-existent-schedule'
      };

      await expect(useCase.execute(request)).resolves.not.toThrow();
    });
  });

  describe('timestamps', () => {
    it('should return timestamps in ISO format', async () => {
      const run = createTestRun('schedule-1', new Date('2025-01-15T10:00:00Z'));
      mockRunRepo.findByScheduleId.mockResolvedValue([run]);
      mockRunRepo.countByScheduleId.mockResolvedValue(1);

      const request: GetScheduleRunsRequest = {
        scheduleId: 'schedule-1'
      };

      const response = await useCase.execute(request);

      const runData = response.runs[0];
      expect(runData.dueAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(runData.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});

