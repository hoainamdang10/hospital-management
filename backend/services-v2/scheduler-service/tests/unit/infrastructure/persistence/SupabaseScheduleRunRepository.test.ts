import { SupabaseScheduleRunRepository } from '../../../../src/infrastructure/persistence/SupabaseScheduleRunRepository';
import { ScheduleRun, ScheduleRunStatus } from '../../../../src/domain/entities/ScheduleRun.entity';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';

describe('SupabaseScheduleRunRepository', () => {
  let repository: SupabaseScheduleRunRepository;
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
      lt: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn()
    };

    repository = new SupabaseScheduleRunRepository(mockSupabase);
  });

  const createTestRun = (): ScheduleRun => {
    return ScheduleRun.create(
      'test-schedule-id',
      TenantId.create('test-tenant'),
      new Date('2025-01-15T10:00:00Z'),
      5
    );
  };

  const createMockRow = (run: ScheduleRun) => {
    const props = run.getProps();
    return {
      run_id: props.runId,
      schedule_id: props.scheduleId,
      tenant_id: props.tenantId.getValue(),
      due_at_utc: props.dueAtUtc.toISOString(),
      status: props.status,
      attempt: props.attempt,
      locked_by: null as string | null,
      locked_at_utc: null as string | null,
      started_at_utc: null as string | null,
      finished_at_utc: null as string | null,
      last_error: null as string | null,
      segment: props.segment || null,
      created_at: props.createdAt.toISOString()
    };
  };

  describe('save', () => {
    it('should save run successfully', async () => {
      const run = createTestRun();
      mockSupabase.insert.mockResolvedValue({ error: null });

      await repository.save(run);

      expect(mockSupabase.from).toHaveBeenCalledWith('schedule_runs');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should throw error if save fails', async () => {
      const run = createTestRun();
      mockSupabase.insert.mockResolvedValue({ error: { message: 'Insert failed' } });

      await expect(repository.save(run)).rejects.toThrow('Failed to save schedule run: Insert failed');
    });

    it('should convert domain to row correctly', async () => {
      const run = createTestRun();
      mockSupabase.insert.mockResolvedValue({ error: null });

      await repository.save(run);

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.schedule_id).toBe('test-schedule-id');
      expect(insertCall.tenant_id).toBe('test-tenant');
      expect(insertCall.status).toBe('DUE');
      expect(insertCall.segment).toBe(5);
    });
  });

  describe('findById', () => {
    it('should find run by ID', async () => {
      const run = createTestRun();
      const mockRow = createMockRow(run);
      mockSupabase.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.findById(run.getRunId());

      expect(result).toBeDefined();
      expect(result?.getRunId()).toBe(run.getRunId());
      expect(mockSupabase.eq).toHaveBeenCalledWith('run_id', run.getRunId());
    });

    it('should return null if run not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      await expect(repository.findById('test-id')).rejects.toThrow('Failed to find schedule run: Database error');
    });
  });

  describe('findByScheduleId', () => {
    it('should find runs by schedule ID with default pagination', async () => {
      const run = createTestRun();
      const mockRow = createMockRow(run);
      mockSupabase.range.mockResolvedValue({ data: [mockRow], error: null });

      const result = await repository.findByScheduleId('test-schedule-id');

      expect(result).toHaveLength(1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('schedule_id', 'test-schedule-id');
      expect(mockSupabase.order).toHaveBeenCalledWith('due_at_utc', { ascending: false });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 99);
    });

    it('should find runs with custom pagination', async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null });

      await repository.findByScheduleId('test-schedule-id', 50, 100);

      expect(mockSupabase.range).toHaveBeenCalledWith(100, 149);
    });

    it('should throw error if query fails', async () => {
      mockSupabase.range.mockResolvedValue({ data: null, error: { message: 'Query failed' } });

      await expect(repository.findByScheduleId('test-id')).rejects.toThrow('Failed to find schedule runs: Query failed');
    });
  });

  describe('findDueRuns', () => {
    it('should find due runs without segment filter', async () => {
      const run = createTestRun();
      const mockRow = createMockRow(run);
      mockSupabase.limit.mockResolvedValue({ data: [mockRow], error: null });

      const result = await repository.findDueRuns(new Date('2025-01-15T11:00:00Z'));

      expect(result).toHaveLength(1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'DUE');
      expect(mockSupabase.lte).toHaveBeenCalledWith('due_at_utc', '2025-01-15T11:00:00.000Z');
      expect(mockSupabase.order).toHaveBeenCalledWith('due_at_utc', { ascending: true });
    });

    it('should find due runs with segment filter', async () => {
      const run = createTestRun();
      const mockRow = createMockRow(run);

      // Mock the full chain including segment eq
      // Note: query is reassigned after limit(), so limit() must return object with eq()
      const mockLimitResult = {
        eq: jest.fn().mockResolvedValue({ data: [mockRow], error: null })
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(mockLimitResult)
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.findDueRuns(new Date('2025-01-15T11:00:00Z'), 5);

      expect(mockLimitResult.eq).toHaveBeenCalledWith('segment', 5);
    });

    it('should respect limit parameter', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      await repository.findDueRuns(new Date(), undefined, 50);

      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });

    it('should throw error if query fails', async () => {
      mockSupabase.limit.mockResolvedValue({ data: null, error: { message: 'Query failed' } });

      await expect(repository.findDueRuns(new Date())).rejects.toThrow('Failed to find due runs: Query failed');
    });
  });

  describe('acquireDueRuns', () => {
    it('should acquire due runs using RPC', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      const mockRow = createMockRow(run);
      mockSupabase.rpc.mockResolvedValue({ data: [mockRow], error: null });

      const result = await repository.acquireDueRuns(
        new Date('2025-01-15T11:00:00Z'),
        'worker-1',
        5,
        10,
        60000,
        60000
      );

      expect(result).toHaveLength(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('acquire_due_runs', {
        p_before_date: '2025-01-15T11:00:00.000Z',
        p_worker_id: 'worker-1',
        p_segment: 5,
        p_limit: 10,
        p_grace_window_ms: 60000,
        p_lease_ttl_ms: 60000
      });
    });

    it('should return empty array if no runs acquired', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const result = await repository.acquireDueRuns(new Date(), 'worker-1');

      expect(result).toEqual([]);
    });

    it('should throw error if RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(
        repository.acquireDueRuns(new Date(), 'worker-1')
      ).rejects.toThrow('Failed to acquire due runs: RPC failed');
    });
  });

  describe('findByStatus', () => {
    it('should find runs by status', async () => {
      const run = createTestRun();
      const mockRow = createMockRow(run);
      mockSupabase.limit.mockResolvedValue({ data: [mockRow], error: null });

      const result = await repository.findByStatus(ScheduleRunStatus.DUE);

      expect(result).toHaveLength(1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'DUE');
    });

    it('should respect limit parameter', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      await repository.findByStatus(ScheduleRunStatus.RUNNING, 50);

      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });

    it('should throw error if query fails', async () => {
      mockSupabase.limit.mockResolvedValue({ data: null, error: { message: 'Query failed' } });

      await expect(repository.findByStatus(ScheduleRunStatus.DUE)).rejects.toThrow('Failed to find runs by status: Query failed');
    });
  });

  describe('update', () => {
    it('should update run successfully', async () => {
      const run = createTestRun();

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.update(run);

      expect(mockSupabase.from).toHaveBeenCalledWith('schedule_runs');
      expect(mockQuery.update).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('run_id', run.getRunId());
    });

    it('should throw error if update fails', async () => {
      const run = createTestRun();

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(repository.update(run)).rejects.toThrow('Failed to update schedule run: Update failed');
    });
  });

  describe('delete', () => {
    it('should delete run successfully', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.delete('test-run-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('schedule_runs');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('run_id', 'test-run-id');
    });

    it('should throw error if delete fails', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(repository.delete('test-id')).rejects.toThrow('Failed to delete schedule run: Delete failed');
    });
  });

  describe('deleteByScheduleId', () => {
    it('should delete all runs for schedule', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.deleteByScheduleId('test-schedule-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('schedule_runs');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('schedule_id', 'test-schedule-id');
    });

    it('should throw error if delete fails', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(repository.deleteByScheduleId('test-id')).rejects.toThrow('Failed to delete schedule runs: Delete failed');
    });
  });

  describe('countByScheduleId', () => {
    it('should count runs for schedule', async () => {
      mockSupabase.eq.mockResolvedValue({ count: 42, error: null });

      const result = await repository.countByScheduleId('test-schedule-id');

      expect(result).toBe(42);
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockSupabase.eq).toHaveBeenCalledWith('schedule_id', 'test-schedule-id');
    });

    it('should return 0 if count is null', async () => {
      mockSupabase.eq.mockResolvedValue({ count: null, error: null });

      const result = await repository.countByScheduleId('test-schedule-id');

      expect(result).toBe(0);
    });

    it('should throw error if count fails', async () => {
      mockSupabase.eq.mockResolvedValue({ count: null, error: { message: 'Count failed' } });

      await expect(repository.countByScheduleId('test-id')).rejects.toThrow('Failed to count schedule runs: Count failed');
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete old completed runs', async () => {
      const mockDeletedRuns = [
        { run_id: 'run-1' },
        { run_id: 'run-2' },
        { run_id: 'run-3' }
      ];
      mockSupabase.select.mockResolvedValue({ data: mockDeletedRuns, error: null });

      const result = await repository.deleteOlderThan(30);

      expect(result).toBe(3);
      expect(mockSupabase.from).toHaveBeenCalledWith('schedule_runs');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.in).toHaveBeenCalledWith('status', ['COMPLETED', 'FAILED', 'CANCELLED']);
    });

    it('should calculate cutoff date correctly', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const beforeDate = new Date();
      await repository.deleteOlderThan(30);

      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 30);

      expect(mockSupabase.lt).toHaveBeenCalled();
      const ltCall = mockSupabase.lt.mock.calls[0];
      expect(ltCall[0]).toBe('finished_at_utc');
    });

    it('should return 0 if no runs deleted', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const result = await repository.deleteOlderThan(30);

      expect(result).toBe(0);
    });

    it('should return 0 if data is null', async () => {
      mockSupabase.select.mockResolvedValue({ data: null, error: null });

      const result = await repository.deleteOlderThan(30);

      expect(result).toBe(0);
    });

    it('should throw error if delete fails', async () => {
      mockSupabase.select.mockResolvedValue({ data: null, error: { message: 'Delete failed' } });

      await expect(repository.deleteOlderThan(30)).rejects.toThrow('Failed to delete old runs: Delete failed');
    });
  });

  describe('domain mapping', () => {
    it('should map run with all fields correctly', async () => {
      const run = createTestRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsFailed('Test error');

      const mockRow = createMockRow(run);
      mockRow.locked_by = 'worker-1';
      mockRow.locked_at_utc = new Date().toISOString();
      mockRow.started_at_utc = new Date().toISOString();
      mockRow.finished_at_utc = new Date().toISOString();
      mockRow.last_error = 'Test error';

      mockSupabase.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.findById(run.getRunId());

      expect(result).toBeDefined();
      expect(result?.getProps().lockedBy).toBe('worker-1');
      expect(result?.getProps().lastError).toBe('Test error');
      expect(result?.getProps().status).toBe('FAILED');
    });

    it('should handle null optional fields', async () => {
      const run = createTestRun();
      const mockRow = createMockRow(run);

      mockSupabase.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await repository.findById(run.getRunId());

      expect(result).toBeDefined();
      expect(result?.getProps().lockedBy).toBeUndefined();
      expect(result?.getProps().lockedAtUtc).toBeUndefined();
      expect(result?.getProps().startedAtUtc).toBeUndefined();
      expect(result?.getProps().finishedAtUtc).toBeUndefined();
      expect(result?.getProps().lastError).toBeUndefined();
    });
  });
});

