import { UpdateScheduleUseCase, UpdateScheduleRequest } from '../../../../src/application/use-cases/UpdateScheduleUseCase';
import { IScheduleRepository } from '../../../../src/domain/repositories/IScheduleRepository';
import { Schedule } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { RetryPolicy } from '../../../../src/domain/value-objects/RetryPolicy';

describe('UpdateScheduleUseCase', () => {
  let useCase: UpdateScheduleUseCase;
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

    useCase = new UpdateScheduleUseCase(mockScheduleRepo);
  });

  const createTestSchedule = (): Schedule => {
    return Schedule.create({
      tenantId: TenantId.create('test-tenant'),
      ownerService: 'test-service',
      scheduleType: ScheduleTypeVO.once(),
      timezone: Timezone.utc(),
      startAtUtc: new Date('2025-01-15T10:00:00Z'),
      topicOrCommand: 'test.command',
      payloadJson: { original: true },
      jitterMs: 0,
      retryPolicy: RetryPolicy.default(),
      dedupKey: DedupKey.create('test-dedup-key')
    });
  };

  describe('update schedule', () => {
    it('should update payloadJson successfully', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const newPayload = { updated: true, version: 2 };
      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: newPayload
      };

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.payloadJson).toEqual(newPayload);
      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should update endAtUtc successfully', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const newEndAt = new Date('2025-12-31T23:59:59Z');
      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        endAtUtc: newEndAt
      };

      const response = await useCase.execute(request);

      expect(response.endAtUtc).toBe(newEndAt.toISOString());
      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should update maxRuns successfully', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        maxRuns: 100
      };

      const response = await useCase.execute(request);

      expect(response.maxRuns).toBe(100);
      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should update multiple fields at once', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const newPayload = { updated: true };
      const newEndAt = new Date('2025-12-31T23:59:59Z');
      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: newPayload,
        endAtUtc: newEndAt,
        maxRuns: 50
      };

      const response = await useCase.execute(request);

      expect(response.payloadJson).toEqual(newPayload);
      expect(response.endAtUtc).toBe(newEndAt.toISOString());
      expect(response.maxRuns).toBe(50);
      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should update updatedAt timestamp', async () => {
      const schedule = createTestSchedule();
      const originalUpdatedAt = schedule.getUpdatedAt();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: { updated: true }
      };

      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await useCase.execute(request);

      const updatedSchedule = mockScheduleRepo.update.mock.calls[0][0];
      expect(updatedSchedule.getUpdatedAt().getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('validation', () => {
    it('should throw error if schedule not found', async () => {
      mockScheduleRepo.findById.mockResolvedValue(null);

      const request: UpdateScheduleRequest = {
        scheduleId: 'non-existent-id',
        payloadJson: { test: true }
      };

      await expect(useCase.execute(request)).rejects.toThrow('Schedule non-existent-id not found');
    });

    it('should not call update if schedule not found', async () => {
      mockScheduleRepo.findById.mockResolvedValue(null);

      const request: UpdateScheduleRequest = {
        scheduleId: 'non-existent-id',
        payloadJson: { test: true }
      };

      await expect(useCase.execute(request)).rejects.toThrow();
      expect(mockScheduleRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('response', () => {
    it('should return complete schedule details', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: { updated: true }
      };

      const response = await useCase.execute(request);

      expect(response.scheduleId).toBe(schedule.getScheduleId());
      expect(response.tenantId).toBe('test-tenant');
      expect(response.ownerService).toBe('test-service');
      expect(response.topicOrCommand).toBe('test.command');
      expect(response.scheduleType).toBe('ONCE');
      expect(response.status).toBeDefined();
      expect(response.createdAtUtc).toBeDefined();
      expect(response.updatedAtUtc).toBeDefined();
    });

    it('should return null for optional fields if not set', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: { updated: true }
      };

      const response = await useCase.execute(request);

      expect(response.endAtUtc).toBeNull();
      expect(response.maxRuns).toBeNull();
    });

    it('should return empty string for optional string fields if not set', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: { updated: true }
      };

      const response = await useCase.execute(request);

      expect(response.ownerResourceType).toBe('');
      expect(response.ownerResourceId).toBe('');
      expect(response.policyTag).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle updating with undefined values', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: undefined,
        endAtUtc: undefined,
        maxRuns: undefined
      };

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should handle updating with null payload', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: null
      };

      const response = await useCase.execute(request);

      expect(response.payloadJson).toBeNull();
    });

    it('should handle updating with empty object payload', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: UpdateScheduleRequest = {
        scheduleId: schedule.getScheduleId(),
        payloadJson: {}
      };

      const response = await useCase.execute(request);

      expect(response.payloadJson).toEqual({});
    });
  });
});

