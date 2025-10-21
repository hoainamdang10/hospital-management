import { SupabaseScheduleRepository } from '../../../../src/infrastructure/persistence/SupabaseScheduleRepository';
import { Schedule } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { RetryPolicy } from '../../../../src/domain/value-objects/RetryPolicy';
import { CronExpression } from '../../../../src/domain/value-objects/CronExpression';

describe('SupabaseScheduleRepository', () => {
  let repository: SupabaseScheduleRepository;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    repository = new SupabaseScheduleRepository(mockSupabase);
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

  const createMockRow = (schedule: Schedule) => {
    const props = schedule.getProps();
    return {
      schedule_id: props.scheduleId,
      tenant_id: props.tenantId.getValue(),
      owner_service: props.ownerService,
      owner_resource_type: null as string | null,
      owner_resource_id: null as string | null,
      policy_tag: null as string | null,
      schedule_type: props.scheduleType.getValue(),
      timezone: props.timezone.getValue(),
      start_at_utc: props.startAtUtc?.toISOString() || null,
      end_at_utc: null as string | null,
      cron_expr: null as string | null,
      rrule: null as string | null,
      topic_or_command: props.topicOrCommand,
      payload_json: props.payloadJson,
      max_runs: null as number | null,
      jitter_ms: props.jitterMs,
      retry_policy_json: props.retryPolicy.toJson(),
      dedup_key: props.dedupKey.getValue(),
      status: props.status,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
      created_by: null as string | null
    };
  };

  describe('save', () => {
    it('should save schedule successfully', async () => {
      const schedule = createTestSchedule();
      mockSupabase.insert.mockResolvedValue({ error: null });

      await repository.save(schedule);

      expect(mockSupabase.from).toHaveBeenCalledWith('schedules');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should throw error if save fails', async () => {
      const schedule = createTestSchedule();
      mockSupabase.insert.mockResolvedValue({ error: { message: 'Insert failed' } });

      await expect(repository.save(schedule)).rejects.toThrow('Failed to save schedule: Insert failed');
    });

    it('should convert domain to row correctly', async () => {
      const schedule = createTestSchedule();
      mockSupabase.insert.mockResolvedValue({ error: null });

      await repository.save(schedule);

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.tenant_id).toBe('test-tenant');
      expect(insertCall.owner_service).toBe('test-service');
      expect(insertCall.schedule_type).toBe('ONCE');
      expect(insertCall.topic_or_command).toBe('test.command');
    });
  });

  describe('findById', () => {
    it('should find schedule by ID', async () => {
      const schedule = createTestSchedule();
      const mockRow = createMockRow(schedule);
      mockSupabase.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.findById(schedule.getScheduleId());

      expect(result).toBeDefined();
      expect(result?.getScheduleId()).toBe(schedule.getScheduleId());
      expect(mockSupabase.eq).toHaveBeenCalledWith('schedule_id', schedule.getScheduleId());
    });

    it('should return null if schedule not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      await expect(repository.findById('test-id')).rejects.toThrow('Failed to find schedule: Database error');
    });
  });

  describe('findByTenantAndDedupKey', () => {
    it('should find schedule by tenant and dedup key', async () => {
      const schedule = createTestSchedule();
      const mockRow = createMockRow(schedule);
      mockSupabase.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.findByTenantAndDedupKey(
        TenantId.create('test-tenant'),
        DedupKey.create('test-dedup-key')
      );

      expect(result).toBeDefined();
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant');
      expect(mockSupabase.eq).toHaveBeenCalledWith('dedup_key', 'test-dedup-key');
    });

    it('should return null if not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await repository.findByTenantAndDedupKey(
        TenantId.create('test-tenant'),
        DedupKey.create('non-existent-key')
      );

      expect(result).toBeNull();
    });
  });

  describe('findByOwner', () => {
    it('should find schedules by owner service only', async () => {
      const schedule = createTestSchedule();
      const mockRow = createMockRow(schedule);

      // Mock the full chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [mockRow], error: null }))
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await repository.findByOwner(
        TenantId.create('test-tenant'),
        'test-service'
      );

      expect(result).toHaveLength(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant');
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_service', 'test-service');
    });

    it('should find schedules with all filters', async () => {
      const schedule = createTestSchedule();
      const mockRow = createMockRow(schedule);

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [mockRow], error: null }))
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await repository.findByOwner(
        TenantId.create('test-tenant'),
        'test-service',
        'appointment',
        'appt-123',
        'reminder'
      );

      expect(result).toHaveLength(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_resource_type', 'appointment');
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_resource_id', 'appt-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('policy_tag', 'reminder');
    });

    it('should return empty array if no schedules found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null }))
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await repository.findByOwner(
        TenantId.create('test-tenant'),
        'test-service'
      );

      expect(result).toEqual([]);
    });

    it('should throw error if query fails', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: { message: 'Query failed' } }))
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        repository.findByOwner(TenantId.create('test-tenant'), 'test-service')
      ).rejects.toThrow('Failed to find schedules: Query failed');
    });
  });

  describe('findActiveSchedules', () => {
    it('should find active schedules with default pagination', async () => {
      const schedule = createTestSchedule();
      const mockRow = createMockRow(schedule);
      mockSupabase.range.mockResolvedValue({ data: [mockRow], error: null });

      const result = await repository.findActiveSchedules();

      expect(result).toHaveLength(1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'ACTIVE');
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 99);
    });

    it('should find active schedules with custom pagination', async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null });

      await repository.findActiveSchedules(50, 100);

      expect(mockSupabase.range).toHaveBeenCalledWith(100, 149);
    });

    it('should throw error if query fails', async () => {
      mockSupabase.range.mockResolvedValue({ data: null, error: { message: 'Query failed' } });

      await expect(repository.findActiveSchedules()).rejects.toThrow('Failed to find active schedules: Query failed');
    });
  });

  describe('update', () => {
    it('should update schedule successfully', async () => {
      const schedule = createTestSchedule();

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.update(schedule);

      expect(mockSupabase.from).toHaveBeenCalledWith('schedules');
      expect(mockQuery.update).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('schedule_id', schedule.getScheduleId());
    });

    it('should throw error if update fails', async () => {
      const schedule = createTestSchedule();

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(repository.update(schedule)).rejects.toThrow('Failed to update schedule: Update failed');
    });
  });

  describe('delete', () => {
    it('should delete schedule successfully', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.delete('test-schedule-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('schedules');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('schedule_id', 'test-schedule-id');
    });

    it('should throw error if delete fails', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(repository.delete('test-id')).rejects.toThrow('Failed to delete schedule: Delete failed');
    });
  });

  describe('domain mapping', () => {
    it('should map CRON schedule correctly', async () => {
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

      const mockRow = createMockRow(schedule);
      mockRow.cron_expr = '0 9 * * *';
      mockSupabase.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.findById(schedule.getScheduleId());

      expect(result).toBeDefined();
      expect(result?.getProps().scheduleType.getValue()).toBe('CRON');
      expect(result?.getProps().cronExpr?.getValue()).toBe('0 9 * * *');
    });
  });
});

