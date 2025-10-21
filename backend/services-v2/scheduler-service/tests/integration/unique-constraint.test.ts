import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientFactory } from '../../src/infrastructure/database/SupabaseClientFactory';
import { SupabaseScheduleRepository } from '../../src/infrastructure/persistence/SupabaseScheduleRepository';
import { SupabaseScheduleRunRepository } from '../../src/infrastructure/persistence/SupabaseScheduleRunRepository';
import { Schedule } from '../../src/domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../src/domain/value-objects/TenantId';
import { ScheduleTypeVO } from '../../src/domain/value-objects/ScheduleType';
import { Timezone } from '../../src/domain/value-objects/Timezone';
import { DedupKey } from '../../src/domain/value-objects/DedupKey';
import { RetryPolicy } from '../../src/domain/value-objects/RetryPolicy';
import { ScheduleRun } from '../../src/domain/entities/ScheduleRun.entity';

describe('UNIQUE Constraint - Prevent Duplicate Runs', () => {
  let supabase: SupabaseClient;
  let scheduleRepo: SupabaseScheduleRepository;
  let runRepo: SupabaseScheduleRunRepository;

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    supabase = SupabaseClientFactory.create({
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceKey,
      schema: 'scheduler'
    });

    scheduleRepo = new SupabaseScheduleRepository(supabase);
    runRepo = new SupabaseScheduleRunRepository(supabase);
  });

  afterAll(async () => {
    await SupabaseClientFactory.close();
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('schedule_runs').delete().neq('run_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('schedules').delete().neq('schedule_id', '00000000-0000-0000-0000-000000000000');
  });

  it('should prevent duplicate runs with same schedule_id and due_at_utc', async () => {
    // Arrange
    const tenantId = TenantId.create('test-tenant');
    const schedule = Schedule.create({
      tenantId,
      ownerService: 'test-service',
      ownerResourceType: 'test-resource',
      ownerResourceId: 'test-123',
      policyTag: 'test-policy',
      scheduleType: ScheduleTypeVO.once(),
      timezone: Timezone.create('UTC'),
      startAtUtc: new Date('2025-10-22T10:00:00Z'),
      topicOrCommand: 'test.topic',
      payloadJson: { test: 'data' },
      jitterMs: 0,
      retryPolicy: RetryPolicy.default(),
      dedupKey: DedupKey.create('test-dedup-key')
    });

    await scheduleRepo.save(schedule);

    const dueAt = new Date('2025-10-22T10:00:00Z');

    // Act - Create first run
    const run1 = ScheduleRun.create(
      schedule.getScheduleId(),
      tenantId,
      dueAt,
      0
    );

    await runRepo.save(run1);

    // Act - Try to create duplicate run
    const run2 = ScheduleRun.create(
      schedule.getScheduleId(),
      tenantId,
      dueAt, // Same due_at_utc
      0
    );

    // Assert - Should throw UNIQUE constraint violation
    await expect(runRepo.save(run2)).rejects.toThrow();
  });

  it('should allow runs with same schedule_id but different due_at_utc', async () => {
    // Arrange
    const tenantId = TenantId.create('test-tenant');
    const schedule = Schedule.create({
      tenantId,
      ownerService: 'test-service',
      ownerResourceType: 'test-resource',
      ownerResourceId: 'test-456',
      policyTag: 'test-policy',
      scheduleType: ScheduleTypeVO.once(),
      timezone: Timezone.create('UTC'),
      startAtUtc: new Date('2025-10-22T10:00:00Z'),
      topicOrCommand: 'test.topic',
      payloadJson: { test: 'data' },
      jitterMs: 0,
      retryPolicy: RetryPolicy.default(),
      dedupKey: DedupKey.create('test-dedup-key-2')
    });

    await scheduleRepo.save(schedule);

    // Act - Create runs with different due_at_utc
    const run1 = ScheduleRun.create(
      schedule.getScheduleId(),
      tenantId,
      new Date('2025-10-22T10:00:00Z'),
      0
    );

    const run2 = ScheduleRun.create(
      schedule.getScheduleId(),
      tenantId,
      new Date('2025-10-22T11:00:00Z'), // Different due_at_utc
      0
    );

    // Assert - Both should succeed
    await expect(runRepo.save(run1)).resolves.not.toThrow();
    await expect(runRepo.save(run2)).resolves.not.toThrow();
  });

  it('should prevent race condition when two materializers run concurrently', async () => {
    // Arrange
    const tenantId = TenantId.create('test-tenant');
    const schedule = Schedule.create({
      tenantId,
      ownerService: 'test-service',
      ownerResourceType: 'test-resource',
      ownerResourceId: 'test-789',
      policyTag: 'test-policy',
      scheduleType: ScheduleTypeVO.once(),
      timezone: Timezone.create('UTC'),
      startAtUtc: new Date('2025-10-22T10:00:00Z'),
      topicOrCommand: 'test.topic',
      payloadJson: { test: 'data' },
      jitterMs: 0,
      retryPolicy: RetryPolicy.default(),
      dedupKey: DedupKey.create('test-dedup-key-3')
    });

    await scheduleRepo.save(schedule);

    const dueAt = new Date('2025-10-22T10:00:00Z');

    // Act - Simulate two materializers trying to create the same run concurrently
    const run1 = ScheduleRun.create(
      schedule.getScheduleId(),
      tenantId,
      dueAt,
      0
    );

    const run2 = ScheduleRun.create(
      schedule.getScheduleId(),
      tenantId,
      dueAt,
      0
    );

    // Execute in parallel
    const results = await Promise.allSettled([
      runRepo.save(run1),
      runRepo.save(run2)
    ]);

    // Assert - One should succeed, one should fail
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    // Verify only one run exists in database
    const runs = await runRepo.findByScheduleId(schedule.getScheduleId(), 100);
    expect(runs.length).toBe(1);
  });

  it('should handle DST edge cases correctly', async () => {
    // Arrange
    const tenantId = TenantId.create('test-tenant');
    const schedule = Schedule.create({
      tenantId,
      ownerService: 'test-service',
      ownerResourceType: 'test-resource',
      ownerResourceId: 'test-dst',
      policyTag: 'test-policy',
      scheduleType: ScheduleTypeVO.once(),
      timezone: Timezone.create('America/New_York'), // Timezone with DST
      startAtUtc: new Date('2025-03-09T07:00:00Z'), // DST transition date
      topicOrCommand: 'test.topic',
      payloadJson: { test: 'data' },
      jitterMs: 0,
      retryPolicy: RetryPolicy.default(),
      dedupKey: DedupKey.create('test-dedup-key-dst')
    });

    await scheduleRepo.save(schedule);

    // Act - Create run at DST transition time
    const dueAt = new Date('2025-03-09T07:00:00Z');

    const run1 = ScheduleRun.create(
      schedule.getScheduleId(),
      tenantId,
      dueAt,
      0
    );

    await runRepo.save(run1);

    // Try to create duplicate at same UTC time
    const run2 = ScheduleRun.create(
      schedule.getScheduleId(),
      tenantId,
      dueAt,
      0
    );

    // Assert - Should prevent duplicate
    await expect(runRepo.save(run2)).rejects.toThrow();
  });
});

