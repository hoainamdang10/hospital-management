import { SupabaseClient } from '@supabase/supabase-js';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
import { ScheduleRun, ScheduleRunStatus } from '../../domain/entities/ScheduleRun.entity';
import { TenantId } from '../../domain/value-objects/TenantId';

interface ScheduleRunRow {
  run_id: string;
  schedule_id: string;
  tenant_id: string;
  due_at_utc: string;
  status: string;
  attempt: number;
  locked_by: string | null;
  locked_at_utc: string | null;
  started_at_utc: string | null;
  finished_at_utc: string | null;
  last_error: string | null;
  segment: number | null;
  created_at: string;
}

export class SupabaseScheduleRunRepository implements IScheduleRunRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(run: ScheduleRun): Promise<void> {
    const props = run.getProps();
    const row = this.toRow(props);

    const { error } = await this.supabase
      .from('schedule_runs')
      .insert(row);

    if (error) {
      throw new Error(`Failed to save schedule run: ${error.message}`);
    }
  }

  async findById(runId: string): Promise<ScheduleRun | null> {
    const { data, error } = await this.supabase
      .from('schedule_runs')
      .select('*')
      .eq('run_id', runId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find schedule run: ${error.message}`);
    }

    return this.toDomain(data);
  }

  async findByScheduleId(scheduleId: string, limit: number = 100, offset: number = 0): Promise<ScheduleRun[]> {
    const { data, error } = await this.supabase
      .from('schedule_runs')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('due_at_utc', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to find schedule runs: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async findDueRuns(beforeDate: Date, segment?: number, limit: number = 100): Promise<ScheduleRun[]> {
    let query = this.supabase
      .from('schedule_runs')
      .select('*')
      .eq('status', 'DUE')
      .lte('due_at_utc', beforeDate.toISOString())
      .order('due_at_utc', { ascending: true })
      .limit(limit);

    if (segment !== undefined) {
      query = query.eq('segment', segment);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find due runs: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async acquireDueRuns(
    beforeDate: Date,
    workerId: string,
    segment?: number,
    limit: number = 100,
    graceWindowMs: number = 60000,
    leaseTtlMs: number = 60000
  ): Promise<ScheduleRun[]> {
    try {
      const { data, error } = await this.supabase.rpc('acquire_due_runs', {
        p_before_date: beforeDate.toISOString(),
        p_worker_id: workerId,
        p_segment: segment,
        p_limit: limit,
        p_grace_window_ms: graceWindowMs,
        p_lease_ttl_ms: leaseTtlMs
      });

      if (error) {
        throw new Error(`Failed to acquire due runs: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row: ScheduleRunRow) => this.toDomain(row));
    } catch (error) {
      console.error('Error acquiring due runs:', error);
      throw error;
    }
  }

  async findByStatus(status: ScheduleRunStatus, limit: number = 100): Promise<ScheduleRun[]> {
    const { data, error } = await this.supabase
      .from('schedule_runs')
      .select('*')
      .eq('status', status)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find runs by status: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async update(run: ScheduleRun): Promise<void> {
    const props = run.getProps();
    const row = this.toRow(props);

    const { error } = await this.supabase
      .from('schedule_runs')
      .update(row)
      .eq('run_id', props.runId);

    if (error) {
      throw new Error(`Failed to update schedule run: ${error.message}`);
    }
  }

  async delete(runId: string): Promise<void> {
    const { error } = await this.supabase
      .from('schedule_runs')
      .delete()
      .eq('run_id', runId);

    if (error) {
      throw new Error(`Failed to delete schedule run: ${error.message}`);
    }
  }

  async deleteByScheduleId(scheduleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('schedule_runs')
      .delete()
      .eq('schedule_id', scheduleId);

    if (error) {
      throw new Error(`Failed to delete schedule runs: ${error.message}`);
    }
  }

  async countByScheduleId(scheduleId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('schedule_runs')
      .select('*', { count: 'exact', head: true })
      .eq('schedule_id', scheduleId);

    if (error) {
      throw new Error(`Failed to count schedule runs: ${error.message}`);
    }

    return count || 0;
  }

  private toDomain(row: ScheduleRunRow): ScheduleRun {
    return ScheduleRun.reconstitute({
      runId: row.run_id,
      scheduleId: row.schedule_id,
      tenantId: TenantId.create(row.tenant_id),
      dueAtUtc: new Date(row.due_at_utc),
      status: row.status as ScheduleRunStatus,
      attempt: row.attempt,
      lockedBy: row.locked_by || undefined,
      lockedAtUtc: row.locked_at_utc ? new Date(row.locked_at_utc) : undefined,
      startedAtUtc: row.started_at_utc ? new Date(row.started_at_utc) : undefined,
      finishedAtUtc: row.finished_at_utc ? new Date(row.finished_at_utc) : undefined,
      lastError: row.last_error || undefined,
      segment: row.segment || undefined,
      createdAt: new Date(row.created_at)
    });
  }

  async deleteOlderThan(daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from('schedule_runs')
        .delete()
        .in('status', ['COMPLETED', 'FAILED', 'CANCELLED'])
        .lt('finished_at_utc', cutoffDate.toISOString())
        .select('run_id');

      if (error) {
        throw new Error(`Failed to delete old runs: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error deleting old runs:', error);
      throw error;
    }
  }

  private toRow(props: any): Partial<ScheduleRunRow> {
    return {
      run_id: props.runId,
      schedule_id: props.scheduleId,
      tenant_id: props.tenantId.getValue(),
      due_at_utc: props.dueAtUtc.toISOString(),
      status: props.status,
      attempt: props.attempt,
      locked_by: props.lockedBy || null,
      locked_at_utc: props.lockedAtUtc?.toISOString() || null,
      started_at_utc: props.startedAtUtc?.toISOString() || null,
      finished_at_utc: props.finishedAtUtc?.toISOString() || null,
      last_error: props.lastError || null,
      segment: props.segment || null,
      created_at: props.createdAt.toISOString()
    };
  }
}

