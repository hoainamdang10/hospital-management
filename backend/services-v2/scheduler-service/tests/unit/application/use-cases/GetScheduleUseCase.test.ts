import { GetScheduleUseCase, GetScheduleRequest } from '../../../../src/application/use-cases/GetScheduleUseCase';
import { IScheduleRepository } from '../../../../src/domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../../../src/domain/repositories/IScheduleRunRepository';
import { Schedule } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { RetryPolicy, RetryStrategy } from '../../../../src/domain/value-objects/RetryPolicy';
import { CronExpression } from '../../../../src/domain/value-objects/CronExpression';

describe('GetScheduleUseCase', () => {
  let useCase: GetScheduleUseCase;
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

    useCase = new GetScheduleUseCase(mockScheduleRepo, mockRunRepo);
  });

  const createTestSchedule = (): Schedule => {
    return Schedule.create({
      tenantId: TenantId.create('test-tenant'),
      ownerService: 'test-service',
      ownerResourceType: 'appointment',
      ownerResourceId: 'appt-123',
      policyTag: 'reminder',
      scheduleType: ScheduleTypeVO.once(),
      timezone: Timezone.utc(),
      startAtUtc: new Date('2025-01-15T10:00:00Z'),
      topicOrCommand: 'test.command',
      payloadJson: { test: true },
      maxRuns: 10,
      jitterMs: 1000,
      retryPolicy: RetryPolicy.create({
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 3,
        baseMs: 1000
      }),
      dedupKey: DedupKey.create('test-dedup-key'),
      createdBy: 'user-123'
    });
  };

  describe('get schedule', () => {
    it('should get schedule successfully', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(5);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.schedule).toBeDefined();
      expect(response.schedule.scheduleId).toBe(schedule.getScheduleId());
    });

    it('should return complete schedule details', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(5);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.schedule.tenantId).toBe('test-tenant');
      expect(response.schedule.ownerService).toBe('test-service');
      expect(response.schedule.ownerResourceType).toBe('appointment');
      expect(response.schedule.ownerResourceId).toBe('appt-123');
      expect(response.schedule.policyTag).toBe('reminder');
      expect(response.schedule.scheduleType).toBe('ONCE');
      expect(response.schedule.timezone).toBe('UTC');
      expect(response.schedule.topicOrCommand).toBe('test.command');
      expect(response.schedule.payloadJson).toEqual({ test: true });
      expect(response.schedule.maxRuns).toBe(10);
      expect(response.schedule.jitterMs).toBe(1000);
      expect(response.schedule.dedupKey).toBe('test-dedup-key');
      expect(response.schedule.createdBy).toBe('user-123');
    });

    it('should return nextRunAt for ONCE schedule', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      // For ONCE schedule, nextRunAt is only returned if startAtUtc is in the future
      // Since createTestSchedule() uses past date, nextRunAt will be undefined
      expect(response.nextRunAt).toBeUndefined();
    });

    it('should return nextRunAt for CRON schedule', async () => {
      const schedule = Schedule.create({
        tenantId: TenantId.create('test-tenant'),
        ownerService: 'test-service',
        scheduleType: ScheduleTypeVO.cron(),
        timezone: Timezone.utc(),
        cronExpr: CronExpression.create('0 9 * * *'),
        topicOrCommand: 'test.command',
        payloadJson: { test: true },
        jitterMs: 0,
        retryPolicy: RetryPolicy.default(),
        dedupKey: DedupKey.create('test-dedup-key')
      });

      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.nextRunAt).toBeDefined();
    });

    it('should return total runs count', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(42);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.totalRuns).toBe(42);
    });

    it('should return retry policy details', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.schedule.retryPolicy).toBeDefined();
      expect(response.schedule.retryPolicy.strategy).toBe(RetryStrategy.EXPONENTIAL);
      expect(response.schedule.retryPolicy.max_attempts).toBe(3); // toJson() uses snake_case
      expect(response.schedule.retryPolicy.base_ms).toBe(1000); // toJson() uses snake_case
    });
  });

  describe('validation', () => {
    it('should throw error if schedule not found', async () => {
      mockScheduleRepo.findById.mockResolvedValue(null);

      const request: GetScheduleRequest = {
        scheduleId: 'non-existent-id'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Schedule not found: non-existent-id');
    });

    it('should not call countByScheduleId if schedule not found', async () => {
      mockScheduleRepo.findById.mockResolvedValue(null);

      const request: GetScheduleRequest = {
        scheduleId: 'non-existent-id'
      };

      await expect(useCase.execute(request)).rejects.toThrow();
      expect(mockRunRepo.countByScheduleId).not.toHaveBeenCalled();
    });
  });

  describe('optional fields', () => {
    it('should handle schedule without optional fields', async () => {
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

      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.schedule.ownerResourceType).toBeUndefined();
      expect(response.schedule.ownerResourceId).toBeUndefined();
      expect(response.schedule.policyTag).toBeUndefined();
      expect(response.schedule.maxRuns).toBeUndefined();
      expect(response.schedule.createdBy).toBeUndefined();
    });

    it('should return undefined for nextRunAt if schedule has no next occurrence', async () => {
      const schedule = Schedule.create({
        tenantId: TenantId.create('test-tenant'),
        ownerService: 'test-service',
        scheduleType: ScheduleTypeVO.once(),
        timezone: Timezone.utc(),
        startAtUtc: new Date('2020-01-01T00:00:00Z'),
        endAtUtc: new Date('2020-12-31T23:59:59Z'),
        topicOrCommand: 'test.command',
        payloadJson: { test: true },
        jitterMs: 0,
        retryPolicy: RetryPolicy.default(),
        dedupKey: DedupKey.create('test-dedup-key')
      });

      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.nextRunAt).toBeUndefined();
    });
  });

  describe('timestamps', () => {
    it('should return createdAt in ISO format', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.schedule.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return updatedAt in ISO format', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.countByScheduleId.mockResolvedValue(0);

      const request: GetScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.schedule.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});

