import dotenv from 'dotenv';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientFactory } from '../../src/infrastructure/database/SupabaseClientFactory';
import { SupabaseScheduleRunRepository } from '../../src/infrastructure/persistence/SupabaseScheduleRunRepository';
import { ScheduleRun } from '../../src/domain/entities/ScheduleRun.entity';
import { TenantId } from '../../src/domain/value-objects/TenantId';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

describe('acquireDueRuns - Simple Integration Test', () => {
  let supabase: SupabaseClient;
  let repository: SupabaseScheduleRunRepository;
  let testScheduleId: string;
  const testTenantId = 'test-tenant-integration';

  beforeAll(async () => {
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

    repository = new SupabaseScheduleRunRepository(supabase);

    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        tenant_id: testTenantId,
        owner_service: 'test-service',
        dedup_key: 'test-acquire-integration',
        schedule_type: 'ONCE',
        start_at_utc: new Date().toISOString(),
        topic_or_command: 'test.command',
        payload_json: { test: true },
        status: 'ACTIVE'
      })
      .select('schedule_id')
      .single();

    if (scheduleError || !scheduleData) {
      throw new Error(`Failed to create test schedule: ${scheduleError?.message}`);
    }

    testScheduleId = scheduleData.schedule_id;
  });

  afterAll(async () => {
    await supabase
      .from('schedule_runs')
      .delete()
      .eq('schedule_id', testScheduleId);

    await supabase
      .from('schedules')
      .delete()
      .eq('schedule_id', testScheduleId);

    await SupabaseClientFactory.close();
  });

  beforeEach(async () => {
    await supabase
      .from('schedule_runs')
      .delete()
      .eq('schedule_id', testScheduleId);
  });

  it('should acquire due run successfully', async () => {
    const run = ScheduleRun.create(
      testScheduleId,
      TenantId.create(testTenantId),
      new Date(),
      0
    );

    await repository.save(run);

    const acquiredRuns = await repository.acquireDueRuns(
      new Date(),
      'test-worker-1',
      undefined,
      10,
      60000,
      60000
    );

    expect(acquiredRuns).toHaveLength(1);
    expect(acquiredRuns[0].getProps().lockedBy).toBe('test-worker-1');
  });

  it('should prevent duplicate acquisition', async () => {
    const run = ScheduleRun.create(
      testScheduleId,
      TenantId.create(testTenantId),
      new Date(),
      0
    );

    await repository.save(run);

    const worker1Runs = await repository.acquireDueRuns(
      new Date(),
      'worker-1',
      undefined,
      10,
      60000,
      60000
    );

    const worker2Runs = await repository.acquireDueRuns(
      new Date(),
      'worker-2',
      undefined,
      10,
      60000,
      60000
    );

    expect(worker1Runs).toHaveLength(1);
    expect(worker2Runs).toHaveLength(0);
  });

  it('should acquire run within grace window', async () => {
    const dueAt = new Date(Date.now() - 30000);
    const run = ScheduleRun.create(
      testScheduleId,
      TenantId.create(testTenantId),
      dueAt,
      0
    );

    await repository.save(run);

    const acquiredRuns = await repository.acquireDueRuns(
      new Date(),
      'test-worker',
      undefined,
      10,
      60000,
      60000
    );

    expect(acquiredRuns).toHaveLength(1);
  });

  it('should skip run beyond grace window', async () => {
    const dueAt = new Date(Date.now() - 120000);
    const run = ScheduleRun.create(
      testScheduleId,
      TenantId.create(testTenantId),
      dueAt,
      0
    );

    await repository.save(run);

    const acquiredRuns = await repository.acquireDueRuns(
      new Date(),
      'test-worker',
      undefined,
      10,
      60000,
      60000
    );

    expect(acquiredRuns).toHaveLength(0);
  });
});

