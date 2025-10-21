import { CancelScheduleUseCase, CancelScheduleRequest } from '../../../../src/application/use-cases/CancelScheduleUseCase';
import { IScheduleRepository } from '../../../../src/domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../../../src/domain/repositories/IScheduleRunRepository';
import { Schedule, ScheduleStatus } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { RetryPolicy } from '../../../../src/domain/value-objects/RetryPolicy';

describe('CancelScheduleUseCase', () => {
  let useCase: CancelScheduleUseCase;
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

    useCase = new CancelScheduleUseCase(mockScheduleRepo, mockRunRepo);
  });

  const createTestSchedule = (id: string): Schedule => {
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
      dedupKey: DedupKey.create(`dedup-key-${id}`)
    });
  };

  describe('cancel schedules', () => {
    it('should cancel single schedule successfully', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service'
      };

      const response = await useCase.execute(request);

      expect(response.cancelledCount).toBe(1);
      expect(response.scheduleIds).toHaveLength(1);
      expect(response.scheduleIds[0]).toBe(schedule.getScheduleId());
      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
      expect(mockRunRepo.deleteByScheduleId).toHaveBeenCalledTimes(1);
    });

    it('should cancel multiple schedules successfully', async () => {
      const schedule1 = createTestSchedule('1');
      const schedule2 = createTestSchedule('2');
      const schedule3 = createTestSchedule('3');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule1, schedule2, schedule3]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service'
      };

      const response = await useCase.execute(request);

      expect(response.cancelledCount).toBe(3);
      expect(response.scheduleIds).toHaveLength(3);
      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(3);
      expect(mockRunRepo.deleteByScheduleId).toHaveBeenCalledTimes(3);
    });

    it('should set schedule status to CANCELLED', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service'
      };

      await useCase.execute(request);

      const updatedSchedule = mockScheduleRepo.update.mock.calls[0][0];
      expect(updatedSchedule.getStatus()).toBe(ScheduleStatus.CANCELLED);
    });

    it('should delete all runs for cancelled schedule', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service'
      };

      await useCase.execute(request);

      expect(mockRunRepo.deleteByScheduleId).toHaveBeenCalledWith(schedule.getScheduleId());
    });

    it('should include cancellation reason if provided', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service',
        reason: 'User requested cancellation'
      };

      await useCase.execute(request);

      expect(mockScheduleRepo.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('filtering by owner', () => {
    it('should filter by ownerService only', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service'
      };

      await useCase.execute(request);

      expect(mockScheduleRepo.findByOwner).toHaveBeenCalledWith(
        expect.any(TenantId),
        'test-service',
        undefined,
        undefined,
        undefined
      );
    });

    it('should filter by ownerService and ownerResourceType', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service',
        ownerResourceType: 'appointment'
      };

      await useCase.execute(request);

      expect(mockScheduleRepo.findByOwner).toHaveBeenCalledWith(
        expect.any(TenantId),
        'test-service',
        'appointment',
        undefined,
        undefined
      );
    });

    it('should filter by all owner fields', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service',
        ownerResourceType: 'appointment',
        ownerResourceId: 'appt-123',
        policyTag: 'reminder'
      };

      await useCase.execute(request);

      expect(mockScheduleRepo.findByOwner).toHaveBeenCalledWith(
        expect.any(TenantId),
        'test-service',
        'appointment',
        'appt-123',
        'reminder'
      );
    });
  });

  describe('no schedules found', () => {
    it('should return zero count if no schedules found', async () => {
      mockScheduleRepo.findByOwner.mockResolvedValue([]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service'
      };

      const response = await useCase.execute(request);

      expect(response.cancelledCount).toBe(0);
      expect(response.scheduleIds).toEqual([]);
      expect(mockScheduleRepo.update).not.toHaveBeenCalled();
      expect(mockRunRepo.deleteByScheduleId).not.toHaveBeenCalled();
    });

    it('should not throw error if no schedules found', async () => {
      mockScheduleRepo.findByOwner.mockResolvedValue([]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'non-existent-service'
      };

      await expect(useCase.execute(request)).resolves.not.toThrow();
    });
  });

  describe('validation', () => {
    it('should throw error for invalid tenant ID', async () => {
      const request: CancelScheduleRequest = {
        tenantId: '',
        ownerService: 'test-service'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Tenant ID cannot be empty');
    });
  });

  describe('response', () => {
    it('should return correct schedule IDs', async () => {
      const schedule1 = createTestSchedule('1');
      const schedule2 = createTestSchedule('2');
      mockScheduleRepo.findByOwner.mockResolvedValue([schedule1, schedule2]);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service'
      };

      const response = await useCase.execute(request);

      expect(response.scheduleIds).toContain(schedule1.getScheduleId());
      expect(response.scheduleIds).toContain(schedule2.getScheduleId());
    });

    it('should return count matching number of schedules', async () => {
      const schedules = [
        createTestSchedule('1'),
        createTestSchedule('2'),
        createTestSchedule('3'),
        createTestSchedule('4'),
        createTestSchedule('5')
      ];
      mockScheduleRepo.findByOwner.mockResolvedValue(schedules);

      const request: CancelScheduleRequest = {
        tenantId: 'test-tenant',
        ownerService: 'test-service'
      };

      const response = await useCase.execute(request);

      expect(response.cancelledCount).toBe(5);
      expect(response.scheduleIds).toHaveLength(5);
    });
  });
});

