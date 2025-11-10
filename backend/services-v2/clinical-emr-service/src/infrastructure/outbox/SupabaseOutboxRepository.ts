import { SupabaseClient } from "@supabase/supabase-js";
import { ILogger } from "../../shared/logger";
import { DomainEvent } from "../../shared/domain-event";

export enum OutboxEventStatus {
  PENDING = "PENDING",
  PUBLISHED = "PUBLISHED",
  FAILED = "FAILED",
}

export interface OutboxEvent {
  id: string;
  event_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: any;
  metadata: any;
  status: OutboxEventStatus;
  retry_count: number;
  max_retries: number;
  last_error?: string;
  created_at: string;
  published_at?: string;
  sequence_number: number;
  partition_key?: string;
}

export interface IOutboxRepository {
  saveEvents(events: DomainEvent[]): Promise<void>;
  getPendingEvents(batchSize?: number): Promise<OutboxEvent[]>;
  markAsPublished(eventIds: string[]): Promise<void>;
  markAsFailed(eventId: string, errorMessage: string): Promise<void>;
  moveToDeadLetterQueue(eventId: string, failureReason: string): Promise<void>;
  cleanupPublishedEvents(retentionDays?: number): Promise<number>;
}

export class SupabaseOutboxRepository implements IOutboxRepository {
  private readonly TABLE_NAME = "outbox_events";
  private readonly DLQ_TABLE = "outbox_dead_letter_queue";
  private readonly SCHEMA = "clinical_schema";

  constructor(
    private readonly supabase: SupabaseClient<any, any>,
    private readonly logger: ILogger,
  ) {}

  async saveEvents(events: DomainEvent[]): Promise<void> {
    if (!events.length) {
      return;
    }

    const rows = events.map((event) => ({
      event_id: event.eventId ?? event.aggregateId,
      event_type: event.eventType,
      aggregate_type: event.aggregateType,
      aggregate_id: event.aggregateId,
      payload: event.toJSON(),
      metadata: {
        occurredAt: event.occurredAt,
        version: (event as any).eventVersion ?? 1,
        patientId: (event as any).getPatientId?.() ?? null,
      },
      status: OutboxEventStatus.PENDING,
      retry_count: 0,
      max_retries: 3,
      partition_key: event.aggregateId,
    }));

    const { error } = await this.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE_NAME)
      .insert(rows);

    if (error) {
      this.logger.error("[OutboxRepository] Failed to save events", {
        error: error.message,
      });
      throw new Error(`Failed to save outbox events: ${error.message}`);
    }
  }

  async getPendingEvents(batchSize: number = 50): Promise<OutboxEvent[]> {
    const { data, error } = await this.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE_NAME)
      .select("*")
      .eq("status", OutboxEventStatus.PENDING)
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (error) {
      throw new Error(`Failed to load pending events: ${error.message}`);
    }

    return (data ?? []) as OutboxEvent[];
  }

  async markAsPublished(eventIds: string[]): Promise<void> {
    if (!eventIds.length) return;

    const { error } = await this.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE_NAME)
      .update({
        status: OutboxEventStatus.PUBLISHED,
        published_at: new Date().toISOString(),
      })
      .in("id", eventIds);

    if (error) {
      throw new Error(`Failed to mark events as published: ${error.message}`);
    }
  }

  async markAsFailed(eventId: string, errorMessage: string): Promise<void> {
    const { data, error } = await this.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load outbox event: ${error.message}`);
    }

    if (!data) {
      this.logger.warn(
        "[OutboxRepository] Event not found when marking failed",
        {
          eventId,
        },
      );
      return;
    }

    if (data.retry_count + 1 >= (data.max_retries ?? 3)) {
      await this.moveToDeadLetterQueue(eventId, errorMessage);
      return;
    }

    const update = await this.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE_NAME)
      .update({
        retry_count: (data.retry_count ?? 0) + 1,
        last_error: errorMessage,
      })
      .eq("id", eventId);

    if (update.error) {
      throw new Error(
        `Failed to mark event as failed: ${update.error.message}`,
      );
    }
  }

  async moveToDeadLetterQueue(
    eventId: string,
    failureReason: string,
  ): Promise<void> {
    const { data, error } = await this.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch event for DLQ: ${error.message}`);
    }

    if (!data) return;

    const { error: dlqError } = await this.supabase
      .schema(this.SCHEMA)
      .from(this.DLQ_TABLE)
      .insert({
        event_id: data.event_id,
        event_type: data.event_type,
        aggregate_type: data.aggregate_type,
        aggregate_id: data.aggregate_id,
        payload: data.payload,
        metadata: {
          ...data.metadata,
          failureReason,
        },
      });

    if (dlqError) {
      throw new Error(`Failed to move event to DLQ: ${dlqError.message}`);
    }

    await this.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE_NAME)
      .delete()
      .eq("id", eventId);
  }

  async cleanupPublishedEvents(retentionDays: number = 7): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const { count, error } = await this.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE_NAME)
      .delete({ count: "exact" })
      .eq("status", OutboxEventStatus.PUBLISHED)
      .lt("published_at", cutoff.toISOString());

    if (error) {
      throw new Error(`Failed to cleanup outbox events: ${error.message}`);
    }

    return count ?? 0;
  }
}
