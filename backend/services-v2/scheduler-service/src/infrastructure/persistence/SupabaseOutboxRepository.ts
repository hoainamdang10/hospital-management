import { SupabaseClient } from '@supabase/supabase-js';
import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
import { Outbox } from '../../domain/entities/Outbox.entity';

interface OutboxRow {
  outbox_id: number;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload_json: any;
  headers_json: any;
  occurred_at_utc: string;
  published_at_utc: string | null;
  publish_attempts: number;
  last_publish_error: string | null;
}

export class SupabaseOutboxRepository implements IOutboxRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(outbox: Outbox): Promise<void> {
    const props = outbox.getProps();
    const row = this.toRow(props);

    const { error } = await this.supabase
      .from('outbox')
      .insert(row);

    if (error) {
      throw new Error(`Failed to save outbox entry: ${error.message}`);
    }
  }

  async findUnpublished(limit: number = 100): Promise<Outbox[]> {
    const { data, error } = await this.supabase
      .from('outbox')
      .select('*')
      .is('published_at_utc', null)
      .order('occurred_at_utc', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find unpublished outbox entries: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async update(outbox: Outbox): Promise<void> {
    const props = outbox.getProps();
    const row = this.toRow(props);

    const { error } = await this.supabase
      .from('outbox')
      .update(row)
      .eq('outbox_id', props.outboxId);

    if (error) {
      throw new Error(`Failed to update outbox entry: ${error.message}`);
    }
  }

  async deletePublished(olderThan: Date): Promise<number> {
    const { data, error } = await this.supabase
      .from('outbox')
      .delete()
      .not('published_at_utc', 'is', null)
      .lt('published_at_utc', olderThan.toISOString())
      .select('outbox_id');

    if (error) {
      throw new Error(`Failed to delete published outbox entries: ${error.message}`);
    }

    return data?.length || 0;
  }

  private toDomain(row: OutboxRow): Outbox {
    return Outbox.reconstitute({
      outboxId: row.outbox_id,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      payloadJson: row.payload_json,
      headersJson: row.headers_json,
      occurredAtUtc: new Date(row.occurred_at_utc),
      publishedAtUtc: row.published_at_utc ? new Date(row.published_at_utc) : undefined,
      publishAttempts: row.publish_attempts,
      lastPublishError: row.last_publish_error || undefined
    });
  }

  private toRow(props: any): Partial<OutboxRow> {
    return {
      outbox_id: props.outboxId || undefined,
      aggregate_type: props.aggregateType,
      aggregate_id: props.aggregateId,
      event_type: props.eventType,
      payload_json: props.payloadJson,
      headers_json: props.headersJson,
      occurred_at_utc: props.occurredAtUtc.toISOString(),
      published_at_utc: props.publishedAtUtc?.toISOString() || null,
      publish_attempts: props.publishAttempts,
      last_publish_error: props.lastPublishError || null
    };
  }
}

