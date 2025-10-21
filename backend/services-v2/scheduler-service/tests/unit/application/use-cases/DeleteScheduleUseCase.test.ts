import { DeleteScheduleUseCase, DeleteScheduleRequest } from '../../../../src/application/use-cases/DeleteScheduleUseCase';
import { IScheduleRepository } from '../../../../src/domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../../../src/domain/repositories/IScheduleRunRepository';
import { Schedule } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { RetryPolicy } from '../../../../src/domain/value-objects/RetryPolicy';

describe('DeleteScheduleUseCase', () => {
  let useCase: DeleteScheduleUseCase;
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

    useCase = new DeleteScheduleUseCase(mockScheduleRepo, mockRunRepo);
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

  describe('delete schedule', () => {
    it('should delete schedule successfully', async () => {
      const schedule = createTestSchedule();
      const scheduleId = schedule.getScheduleId();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: DeleteScheduleRequest = {
        scheduleId
      };

      const response = await useCase.execute(request);

      expect(response.scheduleId).toBe(scheduleId);
      expect(response.deleted).toBe(true);
      expect(mockScheduleRepo.delete).toHaveBeenCalledWith(scheduleId);
      expect(mockScheduleRepo.delete).toHaveBeenCalledTimes(1);
    });

    it('should delete all runs before deleting schedule', async () => {
      const schedule = createTestSchedule();
      const scheduleId = schedule.getScheduleId();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: DeleteScheduleRequest = {
        scheduleId
      };

      await useCase.execute(request);

      expect(mockRunRepo.deleteByScheduleId).toHaveBeenCalledWith(scheduleId);
      expect(mockRunRepo.deleteByScheduleId).toHaveBeenCalledTimes(1);
    });

    it('should delete runs before schedule', async () => {
      const schedule = createTestSchedule();
      const scheduleId = schedule.getScheduleId();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const deleteOrder: string[] = [];
      mockRunRepo.deleteByScheduleId.mockImplementation(async () => {
        deleteOrder.push('runs');
      });
      mockScheduleRepo.delete.mockImplementation(async () => {
        deleteOrder.push('schedule');
      });

      const request: DeleteScheduleRequest = {
        scheduleId
      };

      await useCase.execute(request);

      expect(deleteOrder).toEqual(['runs', 'schedule']);
    });
  });

  describe('validation', () => {
    it('should throw error if schedule not found', async () => {
      mockScheduleRepo.findById.mockResolvedValue(null);

      const request: DeleteScheduleRequest = {
        scheduleId: 'non-existent-id'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Schedule non-existent-id not found');
    });

    it('should not delete if schedule not found', async () => {
      mockScheduleRepo.findById.mockResolvedValue(null);

      const request: DeleteScheduleRequest = {
        scheduleId: 'non-existent-id'
      };

      await expect(useCase.execute(request)).rejects.toThrow();
      expect(mockScheduleRepo.delete).not.toHaveBeenCalled();
      expect(mockRunRepo.deleteByScheduleId).not.toHaveBeenCalled();
    });
  });

  describe('response', () => {
    it('should return schedule ID in response', async () => {
      const schedule = createTestSchedule();
      const scheduleId = schedule.getScheduleId();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: DeleteScheduleRequest = {
        scheduleId
      };

      const response = await useCase.execute(request);

      expect(response.scheduleId).toBe(scheduleId);
    });

    it('should return deleted true in response', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: DeleteScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.deleted).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle schedule with no runs', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);
      mockRunRepo.deleteByScheduleId.mockResolvedValue(undefined);

      const request: DeleteScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.deleted).toBe(true);
      expect(mockRunRepo.deleteByScheduleId).toHaveBeenCalled();
    });

    it('should handle schedule with many runs', async () => {
      const schedule = createTestSchedule();
      mockScheduleRepo.findById.mockResolvedValue(schedule);

      const request: DeleteScheduleRequest = {
        scheduleId: schedule.getScheduleId()
      };

      const response = await useCase.execute(request);

      expect(response.deleted).toBe(true);
      expect(mockRunRepo.deleteByScheduleId).toHaveBeenCalledWith(schedule.getScheduleId());
    });
  });
});

