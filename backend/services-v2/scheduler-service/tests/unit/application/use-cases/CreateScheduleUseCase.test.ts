import { CreateScheduleUseCase, CreateScheduleRequest } from '../../../../src/application/use-cases/CreateScheduleUseCase';
import { IScheduleRepository } from '../../../../src/domain/repositories/IScheduleRepository';
import { Schedule, ScheduleStatus } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { RetryStrategy } from '../../../../src/domain/value-objects/RetryPolicy';

describe('CreateScheduleUseCase', () => {
  let useCase: CreateScheduleUseCase;
  let mockScheduleRepo: jest.Mocked<IScheduleRepository>;

  beforeEach(() => {
    mockScheduleRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByTenantAndDedupKey: jest.fn(),
      findByOwner: jest.fn(),
      delete: jest.fn()
    } as any;

    useCase = new CreateScheduleUseCase(mockScheduleRepo);
  });

  const createValidRequest = (overrides?: Partial<CreateScheduleRequest>): CreateScheduleRequest => ({
    tenantId: 'test-tenant',
    ownerService: 'test-service',
    scheduleType: 'ONCE',
    startAtUtc: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    topicOrCommand: 'test.command',
    payloadJson: { test: true },
    dedupKey: 'test-dedup-key',
    ...overrides
  });

  describe('create new schedule', () => {
    it('should create ONCE schedule successfully', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest();
      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.scheduleId).toBeDefined();
      expect(response.status).toBe(ScheduleStatus.ACTIVE);
      expect(response.nextRunAt).toBeDefined();
      expect(mockScheduleRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should create CRON schedule successfully', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        scheduleType: 'CRON',
        cronExpr: '0 9 * * *',
        startAtUtc: undefined
      });

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.scheduleId).toBeDefined();
      expect(response.status).toBe(ScheduleStatus.ACTIVE);
      expect(mockScheduleRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should create RRULE schedule successfully', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        scheduleType: 'RRULE',
        rrule: 'FREQ=DAILY;COUNT=5',
        startAtUtc: undefined
      });

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.scheduleId).toBeDefined();
      expect(response.status).toBe(ScheduleStatus.ACTIVE);
      expect(mockScheduleRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should use default timezone if not provided', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest();
      await useCase.execute(request);

      expect(mockScheduleRepo.save).toHaveBeenCalledTimes(1);
      const savedSchedule = mockScheduleRepo.save.mock.calls[0][0];
      expect(savedSchedule.getProps().timezone.getValue()).toBe('UTC');
    });

    it('should use custom timezone if provided', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        timezone: 'Asia/Ho_Chi_Minh'
      });

      await useCase.execute(request);

      const savedSchedule = mockScheduleRepo.save.mock.calls[0][0];
      expect(savedSchedule.getProps().timezone.getValue()).toBe('Asia/Ho_Chi_Minh');
    });

    it('should use default retry policy if not provided', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest();
      await useCase.execute(request);

      const savedSchedule = mockScheduleRepo.save.mock.calls[0][0];
      expect(savedSchedule.getProps().retryPolicy.getMaxAttempts()).toBe(5);
    });

    it('should use custom retry policy if provided', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        retryPolicy: {
          strategy: RetryStrategy.LINEAR,
          maxAttempts: 3,
          baseMs: 2000
        }
      });

      await useCase.execute(request);

      const savedSchedule = mockScheduleRepo.save.mock.calls[0][0];
      expect(savedSchedule.getProps().retryPolicy.getMaxAttempts()).toBe(3);
    });

    it('should set jitterMs to 0 if not provided', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest();
      await useCase.execute(request);

      const savedSchedule = mockScheduleRepo.save.mock.calls[0][0];
      expect(savedSchedule.getProps().jitterMs).toBe(0);
    });

    it('should use custom jitterMs if provided', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        jitterMs: 5000
      });

      await useCase.execute(request);

      const savedSchedule = mockScheduleRepo.save.mock.calls[0][0];
      expect(savedSchedule.getProps().jitterMs).toBe(5000);
    });
  });

  describe('deduplication', () => {
    it('should update existing schedule if dedupKey matches', async () => {
      const existingSchedule = Schedule.create({
        tenantId: TenantId.create('test-tenant'),
        ownerService: 'test-service',
        scheduleType: require('../../../../src/domain/value-objects/ScheduleType').ScheduleTypeVO.once(),
        timezone: require('../../../../src/domain/value-objects/Timezone').Timezone.utc(),
        startAtUtc: new Date('2025-01-15T10:00:00Z'),
        topicOrCommand: 'test.command',
        payloadJson: { old: true },
        jitterMs: 0,
        retryPolicy: require('../../../../src/domain/value-objects/RetryPolicy').RetryPolicy.default(),
        dedupKey: DedupKey.create('test-dedup-key')
      });

      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(existingSchedule);

      const request = createValidRequest({
        payloadJson: { updated: true },
        maxRuns: 100
      });

      const response = await useCase.execute(request);

      expect(response.scheduleId).toBe(existingSchedule.getScheduleId());
      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
      expect(mockScheduleRepo.save).not.toHaveBeenCalled();
    });

    it('should update payload when dedup key matches', async () => {
      const existingSchedule = Schedule.create({
        tenantId: TenantId.create('test-tenant'),
        ownerService: 'test-service',
        scheduleType: require('../../../../src/domain/value-objects/ScheduleType').ScheduleTypeVO.once(),
        timezone: require('../../../../src/domain/value-objects/Timezone').Timezone.utc(),
        startAtUtc: new Date('2025-01-15T10:00:00Z'),
        topicOrCommand: 'test.command',
        payloadJson: { old: true },
        jitterMs: 0,
        retryPolicy: require('../../../../src/domain/value-objects/RetryPolicy').RetryPolicy.default(),
        dedupKey: DedupKey.create('test-dedup-key')
      });

      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(existingSchedule);

      const newPayload = { updated: true, version: 2 };
      const request = createValidRequest({
        payloadJson: newPayload
      });

      await useCase.execute(request);

      const updatedSchedule = mockScheduleRepo.update.mock.calls[0][0];
      expect(updatedSchedule.getPayloadJson()).toEqual(newPayload);
    });
  });

  describe('validation', () => {
    it('should throw error if CRON schedule missing cronExpr', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        scheduleType: 'CRON',
        cronExpr: undefined,
        startAtUtc: undefined
      });

      await expect(useCase.execute(request)).rejects.toThrow('CRON expression required for CRON schedule');
    });

    it('should throw error if RRULE schedule missing rrule', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        scheduleType: 'RRULE',
        rrule: undefined,
        startAtUtc: undefined
      });

      await expect(useCase.execute(request)).rejects.toThrow('RRULE required for RRULE schedule');
    });

    it('should throw error for invalid tenant ID', async () => {
      const request = createValidRequest({
        tenantId: ''
      });

      await expect(useCase.execute(request)).rejects.toThrow('Tenant ID cannot be empty');
    });

    it('should throw error for invalid dedup key', async () => {
      const request = createValidRequest({
        dedupKey: ''
      });

      await expect(useCase.execute(request)).rejects.toThrow('Deduplication key cannot be empty');
    });

    it('should throw error for invalid cron expression', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        scheduleType: 'CRON',
        cronExpr: 'invalid cron',
        startAtUtc: undefined
      });

      await expect(useCase.execute(request)).rejects.toThrow('Invalid CRON expression');
    });

    it('should throw error for invalid rrule expression', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        scheduleType: 'RRULE',
        rrule: 'invalid rrule',
        startAtUtc: undefined
      });

      await expect(useCase.execute(request)).rejects.toThrow('Invalid RRULE expression');
    });
  });

  describe('response', () => {
    it('should return schedule ID in response', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest();
      const response = await useCase.execute(request);

      expect(response.scheduleId).toBeDefined();
      expect(typeof response.scheduleId).toBe('string');
    });

    it('should return status in response', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest();
      const response = await useCase.execute(request);

      expect(response.status).toBe(ScheduleStatus.ACTIVE);
    });

    it('should return nextRunAt for ONCE schedule', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      // Use future date to ensure nextRunAt is defined
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const request = createValidRequest({
        startAtUtc: futureDate.toISOString()
      });

      const response = await useCase.execute(request);

      expect(response.nextRunAt).toBeDefined();
      expect(response.nextRunAt).toBe(futureDate.toISOString());
    });

    it('should return nextRunAt for CRON schedule', async () => {
      mockScheduleRepo.findByTenantAndDedupKey.mockResolvedValue(null);

      const request = createValidRequest({
        scheduleType: 'CRON',
        cronExpr: '0 9 * * *',
        startAtUtc: undefined
      });

      const response = await useCase.execute(request);

      expect(response.nextRunAt).toBeDefined();
    });
  });
});

