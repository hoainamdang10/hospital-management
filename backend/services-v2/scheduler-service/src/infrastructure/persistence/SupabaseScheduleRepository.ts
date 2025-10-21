import { SupabaseClient } from '@supabase/supabase-js';
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { Schedule, ScheduleStatus } from '../../domain/aggregates/Schedule.aggregate';
import { ScheduleTypeVO } from '../../domain/value-objects/ScheduleType';
import { CronExpression } from '../../domain/value-objects/CronExpression';
import { RRuleExpression } from '../../domain/value-objects/RRuleExpression';
import { Timezone } from '../../domain/value-objects/Timezone';
import { TenantId } from '../../domain/value-objects/TenantId';
import { DedupKey } from '../../domain/value-objects/DedupKey';
import { RetryPolicy } from '../../domain/value-objects/RetryPolicy';

interface ScheduleRow {
  schedule_id: string;
  tenant_id: string;
  owner_service: string;
  owner_resource_type: string | null;
  owner_resource_id: string | null;
  policy_tag: string | null;
  schedule_type: string;
  timezone: string;
  start_at_utc: string | null;
  end_at_utc: string | null;
  cron_expr: string | null;
  rrule: string | null;
  topic_or_command: string;
  payload_json: any;
  max_runs: number | null;
  jitter_ms: number;
  retry_policy_json: any;
  dedup_key: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export class SupabaseScheduleRepository implements IScheduleRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(schedule: Schedule): Promise<void> {
    const props = schedule.getProps();
    const row = this.toRow(props);

    const { error } = await this.supabase
      .from('schedules')
      .insert(row);

    if (error) {
      throw new Error(`Failed to save schedule: ${error.message}`);
    }
  }

  async findById(scheduleId: string): Promise<Schedule | null> {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('schedule_id', scheduleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find schedule: ${error.message}`);
    }

    return this.toDomain(data);
  }

  async findByTenantAndDedupKey(tenantId: TenantId, dedupKey: DedupKey): Promise<Schedule | null> {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .eq('dedup_key', dedupKey.getValue())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find schedule: ${error.message}`);
    }

    return this.toDomain(data);
  }

  async findByOwner(
    tenantId: TenantId,
    ownerService: string,
    ownerResourceType?: string,
    ownerResourceId?: string,
    policyTag?: string
  ): Promise<Schedule[]> {
    let query = this.supabase
      .from('schedules')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .eq('owner_service', ownerService);

    if (ownerResourceType) {
      query = query.eq('owner_resource_type', ownerResourceType);
    }

    if (ownerResourceId) {
      query = query.eq('owner_resource_id', ownerResourceId);
    }

    if (policyTag) {
      query = query.eq('policy_tag', policyTag);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find schedules: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async findByTenant(
    tenantId: TenantId,
    limit: number = 100,
    offset: number = 0
  ): Promise<Schedule[]> {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('tenant_id', tenantId.getValue())
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find schedules by tenant: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async findActiveSchedules(limit: number = 100, offset: number = 0): Promise<Schedule[]> {
    const { data, error } = await this.supabase
      .from('schedules')
      .select('*')
      .eq('status', 'ACTIVE')
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to find active schedules: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async update(schedule: Schedule): Promise<void> {
    const props = schedule.getProps();
    const row = this.toRow(props);

    const { error } = await this.supabase
      .from('schedules')
      .update(row)
      .eq('schedule_id', props.scheduleId);

    if (error) {
      throw new Error(`Failed to update schedule: ${error.message}`);
    }
  }

  async delete(scheduleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('schedules')
      .delete()
      .eq('schedule_id', scheduleId);

    if (error) {
      throw new Error(`Failed to delete schedule: ${error.message}`);
    }
  }

  private toDomain(row: ScheduleRow): Schedule {
    return Schedule.reconstitute({
      scheduleId: row.schedule_id,
      tenantId: TenantId.create(row.tenant_id),
      ownerService: row.owner_service,
      ownerResourceType: row.owner_resource_type || undefined,
      ownerResourceId: row.owner_resource_id || undefined,
      policyTag: row.policy_tag || undefined,
      scheduleType: ScheduleTypeVO.create(row.schedule_type),
      timezone: Timezone.create(row.timezone),
      startAtUtc: row.start_at_utc ? new Date(row.start_at_utc) : undefined,
      endAtUtc: row.end_at_utc ? new Date(row.end_at_utc) : undefined,
      cronExpr: row.cron_expr ? CronExpression.create(row.cron_expr) : undefined,
      rrule: row.rrule ? RRuleExpression.create(row.rrule) : undefined,
      topicOrCommand: row.topic_or_command,
      payloadJson: row.payload_json,
      maxRuns: row.max_runs || undefined,
      jitterMs: row.jitter_ms,
      retryPolicy: RetryPolicy.fromJson(row.retry_policy_json),
      dedupKey: DedupKey.create(row.dedup_key),
      status: row.status as ScheduleStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by || undefined
    });
  }

  private toRow(props: any): Partial<ScheduleRow> {
    return {
      schedule_id: props.scheduleId,
      tenant_id: props.tenantId.getValue(),
      owner_service: props.ownerService,
      owner_resource_type: props.ownerResourceType || null,
      owner_resource_id: props.ownerResourceId || null,
      policy_tag: props.policyTag || null,
      schedule_type: props.scheduleType.getValue(),
      timezone: props.timezone.getValue(),
      start_at_utc: props.startAtUtc?.toISOString() || null,
      end_at_utc: props.endAtUtc?.toISOString() || null,
      cron_expr: props.cronExpr?.getValue() || null,
      rrule: props.rrule?.getValue() || null,
      topic_or_command: props.topicOrCommand,
      payload_json: props.payloadJson,
      max_runs: props.maxRuns || null,
      jitter_ms: props.jitterMs,
      retry_policy_json: props.retryPolicy.toJson(),
      dedup_key: props.dedupKey.getValue(),
      status: props.status,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
      created_by: props.createdBy || null
    };
  }
}

