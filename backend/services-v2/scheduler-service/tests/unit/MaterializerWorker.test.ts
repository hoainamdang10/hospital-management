import { MaterializerWorker, MaterializerConfig } from '../../src/infrastructure/workers/MaterializerWorker';
import { IScheduleRepository } from '../../src/domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../src/domain/repositories/IScheduleRunRepository';
import { ScheduleRun } from '../../src/domain/entities/ScheduleRun.entity';
import { TenantId } from '../../src/domain/value-objects/TenantId';

describe('MaterializerWorker', () => {
  let worker: MaterializerWorker;
  let mockScheduleRepo: jest.Mocked<IScheduleRepository>;
  let mockRunRepo: jest.Mocked<IScheduleRunRepository>;
  let config: MaterializerConfig;

  // Helper to create mock schedule
  const createMockSchedule = (id: string, tenantId: TenantId, occurrences: Date[], jitterMs = 0) => ({
    getScheduleId: () => id,
    getTenantId: () => tenantId,
    getProps: () => ({
      jitterMs,
      scheduleType: { getValue: () => 'ONCE' }
    }),
    getOccurrencesBetween: jest.fn().mockReturnValue(occurrences)
  });

  beforeEach(() => {
    mockScheduleRepo = {
      findActiveSchedules: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByTenantId: jest.fn(),
      cancel: jest.fn()
    } as any;

    mockRunRepo = {
      findByScheduleId: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findDueRuns: jest.fn(),
      acquireDueRuns: jest.fn(),
      updateStatus: jest.fn()
    } as any;

    config = {
      interval: 60000,
      lookaheadHours: 24,
      batchSize: 100,
      numSegments: 4
    };

    worker = new MaterializerWorker(mockScheduleRepo, mockRunRepo, config);
  });

  afterEach(async () => {
    await worker.stop();
  });

  describe('N+1 Query Prevention', () => {
    it('should fetch existing runs only ONCE per schedule, not per occurrence', async () => {
      const tenantId = TenantId.create('test-tenant');
      const now = new Date();
      const lookaheadEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockSchedule = createMockSchedule('schedule-1', tenantId, [
        new Date(now.getTime() + 1000),
        new Date(now.getTime() + 2000),
        new Date(now.getTime() + 3000),
        new Date(now.getTime() + 4000),
        new Date(now.getTime() + 5000)
      ]) as any;

      mockScheduleRepo.findActiveSchedules.mockResolvedValue([mockSchedule]);
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.save.mockResolvedValue();

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.findByScheduleId).toHaveBeenCalledTimes(1);
      expect(mockRunRepo.findByScheduleId).toHaveBeenCalledWith('schedule-1', 1000);
      expect(mockRunRepo.save).toHaveBeenCalledTimes(5);
    });

    it('should use Set for O(1) lookup instead of O(n) query', async () => {
      const tenantId = TenantId.create('test-tenant');
      const now = new Date();
      const occurrence1 = new Date(now.getTime() + 1000);
      const occurrence2 = new Date(now.getTime() + 2000);

      const mockSchedule = createMockSchedule('schedule-1', tenantId, [occurrence1, occurrence2]) as any;

      const existingRun = {
        getProps: () => ({
          dueAtUtc: occurrence1
        })
      } as any;

      mockScheduleRepo.findActiveSchedules.mockResolvedValue([mockSchedule]);
      mockRunRepo.findByScheduleId.mockResolvedValue([existingRun]);
      mockRunRepo.save.mockResolvedValue();

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.findByScheduleId).toHaveBeenCalledTimes(1);
      expect(mockRunRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Deduplication Logic', () => {
    it('should skip occurrence if already materialized (within 1 second tolerance)', async () => {
      const tenantId = TenantId.create('test-tenant');
      const now = new Date();
      const occurrence = new Date(now.getTime() + 1000);

      const mockSchedule = createMockSchedule('schedule-1', tenantId, [occurrence]) as any;

      const existingRun = {
        getProps: () => ({
          dueAtUtc: new Date(occurrence.getTime() + 500)
        })
      } as any;

      mockScheduleRepo.findActiveSchedules.mockResolvedValue([mockSchedule]);
      mockRunRepo.findByScheduleId.mockResolvedValue([existingRun]);
      mockRunRepo.save.mockResolvedValue();

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.save).not.toHaveBeenCalled();
    });

    it('should create run if not already materialized', async () => {
      const tenantId = TenantId.create('test-tenant');
      const now = new Date();
      const occurrence = new Date(now.getTime() + 1000);

      const mockSchedule = createMockSchedule('schedule-1', tenantId, [occurrence]) as any;

      const existingRun = {
        getProps: () => ({
          dueAtUtc: new Date(occurrence.getTime() + 2000)
        })
      } as any;

      mockScheduleRepo.findActiveSchedules.mockResolvedValue([mockSchedule]);
      mockRunRepo.findByScheduleId.mockResolvedValue([existingRun]);
      mockRunRepo.save.mockResolvedValue();

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Segment Assignment', () => {
    it('should calculate segment using consistent hashing', async () => {
      const tenantId = TenantId.create('test-tenant');
      const now = new Date();
      const occurrence = new Date(now.getTime() + 1000);

      const mockSchedule = createMockSchedule('schedule-1', tenantId, [occurrence]) as any;

      mockScheduleRepo.findActiveSchedules.mockResolvedValue([mockSchedule]);
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.save.mockResolvedValue();

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.save).toHaveBeenCalledTimes(1);
      const savedRun = mockRunRepo.save.mock.calls[0][0];
      expect(savedRun.getProps().segment).toBeGreaterThanOrEqual(0);
      expect(savedRun.getProps().segment).toBeLessThan(config.numSegments);
    });

    it('should assign same segment for same schedule ID', async () => {
      const tenantId = TenantId.create('test-tenant');
      const now = new Date();
      const occurrence1 = new Date(now.getTime() + 1000);
      const occurrence2 = new Date(now.getTime() + 2000);

      const mockSchedule = createMockSchedule('schedule-1', tenantId, [occurrence1, occurrence2]) as any;

      mockScheduleRepo.findActiveSchedules.mockResolvedValue([mockSchedule]);
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.save.mockResolvedValue();

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.save).toHaveBeenCalledTimes(2);
      const segment1 = mockRunRepo.save.mock.calls[0][0].getProps().segment;
      const segment2 = mockRunRepo.save.mock.calls[1][0].getProps().segment;
      expect(segment1).toBe(segment2);
    });
  });

  describe('Error Handling', () => {
    it('should continue processing other schedules if one fails', async () => {
      const tenantId = TenantId.create('test-tenant');
      const now = new Date();

      const mockSchedule1 = {
        ...createMockSchedule('schedule-1', tenantId, []),
        getOccurrencesBetween: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        })
      } as any;

      const mockSchedule2 = createMockSchedule('schedule-2', tenantId, [new Date(now.getTime() + 1000)]) as any;

      mockScheduleRepo.findActiveSchedules.mockResolvedValue([mockSchedule1, mockSchedule2]);
      mockRunRepo.findByScheduleId.mockResolvedValue([]);
      mockRunRepo.save.mockResolvedValue();

      await worker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await worker.stop();

      expect(mockRunRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Worker Lifecycle', () => {
    it('should start and stop correctly', async () => {
      mockScheduleRepo.findActiveSchedules.mockResolvedValue([]);

      await worker.start();
      expect(worker.getStatus().isRunning).toBe(true);

      await worker.stop();
      expect(worker.getStatus().isRunning).toBe(false);
    });

    it('should not start if already running', async () => {
      mockScheduleRepo.findActiveSchedules.mockResolvedValue([]);

      await worker.start();

      // Try to start again - should be ignored
      await worker.start();

      // Worker should still be running
      expect(worker.getStatus().isRunning).toBe(true);

      await worker.stop();
    });
  });
});

