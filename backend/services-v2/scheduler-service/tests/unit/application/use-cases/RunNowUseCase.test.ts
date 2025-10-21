import { RunNowUseCase, RunNowRequest } from '../../../../src/application/use-cases/RunNowUseCase';
import { IScheduleRepository } from '../../../../src/domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../../../src/domain/repositories/IScheduleRunRepository';
import { Schedule, ScheduleStatus } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { RetryPolicy } from '../../../../src/domain/value-objects/RetryPolicy';

describe('RunNowUseCase', () => {
  let useCase: RunNowUseCase;
  let mockScheduleRepo: jest.Mocked<IScheduleRepository>;
  let mockRunRepo: jest.Mocked<IScheduleRunRepository>;

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
      countByScheduleId: jest.fn()
    } as any;

    useCase = new RunNowUseCase(mockScheduleRepo, mockRunRepo);
  });

  const createTestSchedule = (status: ScheduleStatus = ScheduleStatus.ACTIVE): Schedule => {
    const schedule = Schedule.create({
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

    if (status === ScheduleStatus.PAUSED) {
      schedule.pause();
    } else if (status === ScheduleStatus.CANCELLED) {
      schedule.cancel();
    }

    return schedule;
  };

  describe('run now', () => {
    it('should create run successfully for active schedule', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.runId).toBeDefined();
      expect(response.scheduleId).toBe(schedule.getScheduleId());
      expect(response.status).toBe('DUE');
      expect(mockRunRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should set dueAtUtc to current time', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const beforeTime = new Date();
      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);
      const afterTime = new Date();

      const dueAt = new Date(response.dueAtUtc);
      expect(dueAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(dueAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should calculate segment from schedule ID', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      await useCase.execute(request);

      const savedRun = mockRunRepo.save.mock.calls[0][0];
      const segment = savedRun.getProps().segment;
      expect(segment).toBeGreaterThanOrEqual(0);
      expect(segment).toBeLessThan(10);
    });

    it('should use tenant ID from schedule', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      await useCase.execute(request);

      const savedRun = mockRunRepo.save.mock.calls[0][0];
      expect(savedRun.getProps().tenantId.getValue()).toBe('test-tenant');
    });
  });

  describe('validation', () => {
    it('should throw error if schedule not found', async () => {
      mockScheduleRepo.findById.mockResolvedValue(null);

      const request: RunNowRequest = {
        scheduleId: 'non-existent-id'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Schedule not found: non-existent-id');
    });

    it('should throw error if schedule is paused', async () => {
      const schedule = createTestSchedule(ScheduleStatus.PAUSED);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      await expect(useCase.execute(request)).rejects.toThrow('Schedule is not active: PAUSED');
    });

    it('should throw error if schedule is cancelled', async () => {
      const schedule = createTestSchedule(ScheduleStatus.CANCELLED);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      await expect(useCase.execute(request)).rejects.toThrow('Schedule is not active: CANCELLED');
    });

    it('should not create run if schedule not active', async () => {
      const schedule = createTestSchedule(ScheduleStatus.PAUSED);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      await expect(useCase.execute(request)).rejects.toThrow();
      expect(mockRunRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('response', () => {
    it('should return run ID', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.runId).toBeDefined();
      expect(typeof response.runId).toBe('string');
    });

    it('should return schedule ID', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.scheduleId).toBe(schedule.getScheduleId());
    });

    it('should return dueAtUtc in ISO format', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.dueAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return status as DUE', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.status).toBe('DUE');
    });
  });

  describe('segment calculation', () => {
    it('should calculate consistent segment for same schedule ID', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      await useCase.execute(request);
      const segment1 = mockRunRepo.save.mock.calls[0][0].getProps().segment;

      mockRunRepo.save.mockClear();
      await useCase.execute(request);
      const segment2 = mockRunRepo.save.mock.calls[0][0].getProps().segment;

      expect(segment1).toBe(segment2);
    });

    it('should calculate segment in range 0-9', async () => {
      const schedule = createTestSchedule(ScheduleStatus.ACTIVE);
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: RunNowRequest = {
        scheduleId: schedule.getScheduleId()
      };

      await useCase.execute(request);

      const savedRun = mockRunRepo.save.mock.calls[0][0];
      const segment = savedRun.getProps().segment;
      expect(segment).toBeGreaterThanOrEqual(0);
      expect(segment).toBeLessThan(10);
      expect(Number.isInteger(segment)).toBe(true);
    });
  });
});

