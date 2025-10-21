import { SupabaseClient } from '@supabase/supabase-js';
import { IDeadLetterRepository } from '../../domain/repositories/IDeadLetterRepository';
import { DeadLetter, DeadLetterFailureType } from '../../domain/entities/DeadLetter.entity';
import { TenantId } from '../../domain/value-objects/TenantId';

interface DeadLetterRow {
  id: string;
  run_id: string | null;
  schedule_id: string | null;
  tenant_id: string | null;
  error_message: string;
  error_stack: string | null;
  attempt_count: number | null;
  last_attempt_at_utc: string | null;
  stored_at_utc: string;

  // For unroutable messages
  message_id: string | null;
  routing_key: string | null;
  exchange: string | null;
  payload: any | null;
  headers: any | null;
  failure_type: DeadLetterFailureType;
}

export class SupabaseDeadLetterRepository implements IDeadLetterRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(deadLetter: DeadLetter): Promise<void> {
    const props = deadLetter.getProps();
    const row = this.toRow(props);

    const { error } = await this.supabase
      .from('dead_letters')
      .insert(row);

    if (error) {
      throw new Error(`Failed to save dead letter: ${error.message}`);
    }
  }

  async findById(id: string): Promise<DeadLetter | null> {
    const { data, error } = await this.supabase
      .from('dead_letters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find dead letter: ${error.message}`);
    }

    return this.toDomain(data);
  }

  async findByScheduleId(scheduleId: string, limit: number = 100): Promise<DeadLetter[]> {
    const { data, error } = await this.supabase
      .from('dead_letters')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('stored_at_utc', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find dead letters by schedule: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async findByTenantId(tenantId: string, limit: number = 100): Promise<DeadLetter[]> {
    const { data, error } = await this.supabase
      .from('dead_letters')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('stored_at_utc', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find dead letters by tenant: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async deleteOlderThan(daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from('dead_letters')
        .delete()
        .lt('stored_at_utc', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to delete old dead letters: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error deleting old dead letters:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('dead_letters')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete dead letter: ${error.message}`);
    }
  }

  private toDomain(row: DeadLetterRow): DeadLetter {
    return DeadLetter.reconstitute({
      id: row.id,
      runId: row.run_id || undefined,
      scheduleId: row.schedule_id || undefined,
      tenantId: row.tenant_id ? TenantId.create(row.tenant_id) : undefined,
      errorMessage: row.error_message,
      errorStack: row.error_stack || undefined,
      attemptCount: row.attempt_count || undefined,
      lastAttemptAtUtc: row.last_attempt_at_utc ? new Date(row.last_attempt_at_utc) : undefined,
      storedAtUtc: new Date(row.stored_at_utc),

      // Unroutable message fields
      messageId: row.message_id || undefined,
      routingKey: row.routing_key || undefined,
      exchange: row.exchange || undefined,
      payload: row.payload || undefined,
      headers: row.headers || undefined,
      failureType: row.failure_type
    });
  }

  private toRow(props: any): any {
    const row: any = {
      run_id: props.runId || null,
      schedule_id: props.scheduleId || null,
      tenant_id: props.tenantId?.getValue() || null,
      error_message: props.errorMessage,
      stored_at_utc: props.storedAtUtc.toISOString(),

      // Unroutable message fields
      message_id: props.messageId || null,
      routing_key: props.routingKey || null,
      exchange: props.exchange || null,
      payload: props.payload || null,
      headers: props.headers || null,
      failure_type: props.failureType
    };

    // Optional fields (may not exist in schema)
    if (props.errorStack) {
      row.error_stack = props.errorStack;
    }
    if (props.attemptCount !== undefined) {
      row.attempt_count = props.attemptCount;
    }
    if (props.lastAttemptAtUtc) {
      row.last_attempt_at_utc = props.lastAttemptAtUtc.toISOString();
    }

    return row;
  }
}

