import { ListSchedulesUseCase, ListSchedulesRequest } from '../../../../src/application/use-cases/ListSchedulesUseCase';
import { IScheduleRepository } from '../../../../src/domain/repositories/IScheduleRepository';
import { Schedule } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { RetryPolicy } from '../../../../src/domain/value-objects/RetryPolicy';

describe('ListSchedulesUseCase', () => {
  let useCase: ListSchedulesUseCase;
  let mockScheduleRepo: jest.Mocked<IScheduleRepository>;

  beforeEach(() => {
    mockScheduleRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByTenantAndDedupKey: jest.fn(),
      findByOwner: jest.fn(),
      findByTenant: jest.fn(),
      findActiveSchedules: jest.fn(),
      delete: jest.fn()
    } as any;

    useCase = new ListSchedulesUseCase(mockScheduleRepo);
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

  describe('list schedules', () => {
    it('should list schedules successfully', async () => {
      const schedule1 = createTestSchedule('1');
      const schedule2 = createTestSchedule('2');
      // When ownerService is not provided, should call findByTenant
      mockScheduleRepo.findByTenant.mockResolvedValue([schedule1, schedule2]);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      const response = await useCase.execute(request);

      expect(response).toBeDefined();
      expect(response.schedules).toHaveLength(2);
      expect(response.total).toBe(2);
      expect(mockScheduleRepo.findByTenant).toHaveBeenCalledWith(
        expect.any(TenantId),
        100,
        0
      );
    });

    it('should return schedule details', async () => {
      const schedule = createTestSchedule('1');
      // When ownerService is not provided, should call findByTenant
      mockScheduleRepo.findByTenant.mockResolvedValue([schedule]);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      const response = await useCase.execute(request);

      const scheduleData = response.schedules[0];
      expect(scheduleData.scheduleId).toBe(schedule.getScheduleId());
      expect(scheduleData.tenantId).toBe('test-tenant');
      expect(scheduleData.dedupKey).toBe('dedup-key-1');
      expect(scheduleData.ownerService).toBe('test-service');
      expect(scheduleData.scheduleType).toBe('ONCE');
      expect(scheduleData.timezone).toBe('UTC');
      expect(scheduleData.topicOrCommand).toBe('test.command');
      expect(scheduleData.payloadJson).toEqual({ test: true });
      expect(scheduleData.status).toBe('ACTIVE');
    });

    it('should use default limit of 100', async () => {
      const schedules = Array.from({ length: 100 }, (_, i) => createTestSchedule(String(i)));
      mockScheduleRepo.findByTenant.mockResolvedValue(schedules);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      const response = await useCase.execute(request);

      expect(response.schedules).toHaveLength(100);
      expect(response.total).toBe(100);
      expect(response.limit).toBe(100);
      expect(response.offset).toBe(0);
    });

    it('should use custom limit', async () => {
      const schedules = Array.from({ length: 50 }, (_, i) => createTestSchedule(String(i)));
      mockScheduleRepo.findByTenant.mockResolvedValue(schedules);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant',
        limit: 50
      };

      const response = await useCase.execute(request);

      expect(response.schedules).toHaveLength(50);
      expect(response.limit).toBe(50);
    });

    it('should use default offset of 0', async () => {
      const schedules = [createTestSchedule('1'), createTestSchedule('2')];
      mockScheduleRepo.findByTenant.mockResolvedValue(schedules);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      const response = await useCase.execute(request);

      expect(response.offset).toBe(0);
    });

    it('should use custom offset', async () => {
      const schedules = Array.from({ length: 75 }, (_, i) => createTestSchedule(String(i)));
      mockScheduleRepo.findByTenant.mockResolvedValue(schedules);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant',
        offset: 25
      };

      const response = await useCase.execute(request);

      expect(response.schedules).toHaveLength(75);
      expect(response.offset).toBe(25);
    });

    it('should apply pagination correctly', async () => {
      const schedules = Array.from({ length: 20 }, (_, i) => createTestSchedule(String(i)));
      mockScheduleRepo.findByTenant.mockResolvedValue(schedules);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant',
        limit: 20,
        offset: 40
      };

      const response = await useCase.execute(request);

      expect(response.schedules).toHaveLength(20);
      expect(response.total).toBe(20);
      expect(response.limit).toBe(20);
      expect(response.offset).toBe(40);
    });
  });

  describe('filtering', () => {
    it('should filter by ownerService', async () => {
      mockScheduleRepo.findByOwner.mockResolvedValue([]);

      const request: ListSchedulesRequest = {
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
      mockScheduleRepo.findByOwner.mockResolvedValue([]);

      const request: ListSchedulesRequest = {
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
      mockScheduleRepo.findByOwner.mockResolvedValue([]);

      const request: ListSchedulesRequest = {
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

    it('should use findByTenant if ownerService not provided', async () => {
      mockScheduleRepo.findByTenant.mockResolvedValue([]);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      await useCase.execute(request);

      expect(mockScheduleRepo.findByTenant).toHaveBeenCalledWith(
        expect.any(TenantId),
        100,
        0
      );
      expect(mockScheduleRepo.findByOwner).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should throw error for invalid tenant ID', async () => {
      const request: ListSchedulesRequest = {
        tenantId: ''
      };

      await expect(useCase.execute(request)).rejects.toThrow('Tenant ID cannot be empty');
    });
  });

  describe('empty results', () => {
    it('should return empty array if no schedules found', async () => {
      mockScheduleRepo.findByTenant.mockResolvedValue([]);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      const response = await useCase.execute(request);

      expect(response.schedules).toEqual([]);
      expect(response.total).toBe(0);
    });

    it('should not throw error if no schedules found', async () => {
      mockScheduleRepo.findByOwner.mockResolvedValue([]);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant',
        ownerService: 'non-existent-service'
      };

      await expect(useCase.execute(request)).resolves.not.toThrow();
    });
  });

  describe('timestamps', () => {
    it('should return timestamps in ISO format', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByTenant.mockResolvedValue([schedule]);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      const response = await useCase.execute(request);

      const scheduleData = response.schedules[0];
      expect(scheduleData.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(scheduleData.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return startAtUtc in ISO format if set', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByTenant.mockResolvedValue([schedule]);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      const response = await useCase.execute(request);

      const scheduleData = response.schedules[0];
      expect(scheduleData.startAtUtc).toBe('2025-01-15T10:00:00.000Z');
    });
  });

  describe('optional fields', () => {
    it('should return undefined for optional fields if not set', async () => {
      const schedule = createTestSchedule('1');
      mockScheduleRepo.findByTenant.mockResolvedValue([schedule]);

      const request: ListSchedulesRequest = {
        tenantId: 'test-tenant'
      };

      const response = await useCase.execute(request);

      const scheduleData = response.schedules[0];
      expect(scheduleData.ownerResourceType).toBeUndefined();
      expect(scheduleData.ownerResourceId).toBeUndefined();
      expect(scheduleData.policyTag).toBeUndefined();
      expect(scheduleData.endAtUtc).toBeUndefined();
      expect(scheduleData.maxRuns).toBeUndefined();
    });
  });
});

