import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { DomainEvent, buildRoutingKey } from "@shared/domain/base/domain-event";
import { ILogger } from "../../application/interfaces/ILogger";

export type OutboxStatus = "PENDING" | "PUBLISHING" | "PUBLISHED" | "FAILED";

export interface OutboxEvent {
  outboxId: string;
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  routingKey?: string;
  occurredAt: Date;
  status: OutboxStatus;
  publishAttempts: number;
  publishingError?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class OutboxService {
  private readonly schema: string;
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 100;
  private readonly REQUEUE_GRACE_MS = 60_000;

  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly logger: ILogger,
    schema: string = "provider_schema",
  ) {
    this.schema = schema;
  }

  async storeEvent(
    event: DomainEvent,
    routingKey?: string,
  ): Promise<OutboxEvent> {
    const eventId = event.eventId || crypto.randomUUID();
    const payload: Record<string, unknown> = {
      ...(event as any),
      eventData:
        (event as any).getEventData?.() ??
        (event as any).eventData ??
        (event as any).data,
    };

    const resolvedRoutingKey =
      routingKey ||
      (typeof (event as any).getRoutingKey === "function"
        ? (event as any).getRoutingKey()
        : buildRoutingKey(
            event.aggregateType || "ProviderStaff",
            event.eventType,
          ));

    const occurredAt =
      (event as any).occurredAt instanceof Date
        ? (event as any).occurredAt.toISOString()
        : new Date().toISOString();

    const { data, error } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .insert({
        event_id: eventId,
        event_type: event.eventType,
        aggregate_id: event.aggregateId,
        aggregate_type: event.aggregateType || "ProviderStaff",
        payload,
        routing_key: resolvedRoutingKey,
        occurred_at: occurredAt,
        status: "PENDING",
        publish_attempts: 0,
      })
      .select("*")
      .single();

    if (error) {
      this.logger.error("Failed to store event in outbox", {
        eventId,
        eventType: event.eventType,
        error: error.message,
      });
      throw new Error(`Failed to store event in outbox: ${error.message}`);
    }

    this.logger.debug("Event stored in outbox", {
      outboxId: data.outbox_id,
      eventId,
      eventType: event.eventType,
      routingKey: resolvedRoutingKey,
    });

    return this.mapToOutboxEvent(data);
  }

  async getPendingEvents(
    limit: number = this.BATCH_SIZE,
  ): Promise<OutboxEvent[]> {
    const { data, error } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      this.logger.error("Failed to fetch pending outbox events", {
        error: error.message,
      });
      throw new Error(`Failed to fetch pending events: ${error.message}`);
    }

    return (data || []).map((row) => this.mapToOutboxEvent(row));
  }

  /**
   * Requeue events stuck in PUBLISHING (e.g., service crashed mid-flight)
   */
  async requeueStuckPublishing(
    graceMs: number = this.REQUEUE_GRACE_MS,
  ): Promise<number> {
    const cutoff = new Date(Date.now() - graceMs).toISOString();

    const { data, error } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .update({
        status: "PENDING",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "PUBLISHING")
      .lt("updated_at", cutoff)
      .select("outbox_id");

    if (error) {
      this.logger.error("Failed to requeue stuck publishing events", {
        error: error.message,
      });
      throw new Error(
        `Failed to requeue stuck publishing events: ${error.message}`,
      );
    }

    const requeuedCount = data?.length || 0;
    if (requeuedCount > 0) {
      this.logger.warn("Requeued stuck PUBLISHING events", {
        count: requeuedCount,
        cutoff,
      });
    }
    return requeuedCount;
  }

  async markAsPublishing(outboxId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .update({
        status: "PUBLISHING",
        updated_at: new Date().toISOString(),
      })
      .eq("outbox_id", outboxId);

    if (error) {
      throw new Error(
        `Failed to mark outbox event as publishing: ${error.message}`,
      );
    }
  }

  async markAsPublished(outboxId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .update({
        status: "PUBLISHED",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("outbox_id", outboxId);

    if (error) {
      throw new Error(
        `Failed to mark outbox event as published: ${error.message}`,
      );
    }
  }

  async markAsFailed(outboxId: string, errorMessage: string): Promise<void> {
    const { data: current, error: fetchError } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .select("publish_attempts")
      .eq("outbox_id", outboxId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch retry count: ${fetchError.message}`);
    }

    const attempts = (current?.publish_attempts || 0) + 1;
    const shouldFail = attempts >= this.MAX_RETRIES;

    const { error } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .update({
        status: shouldFail ? "FAILED" : "PENDING",
        publish_attempts: attempts,
        publishing_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("outbox_id", outboxId);

    if (error) {
      throw new Error(
        `Failed to mark outbox event as failed: ${error.message}`,
      );
    }
  }

  async getStats(): Promise<{
    pending: number;
    publishing: number;
    published: number;
    failed: number;
    total: number;
  }> {
    const { data, error } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .select("status", { count: "exact" });

    if (error) {
      throw new Error(`Failed to fetch outbox stats: ${error.message}`);
    }

    const stats = {
      pending: 0,
      publishing: 0,
      published: 0,
      failed: 0,
      total: data?.length || 0,
    };

    (data || []).forEach((row) => {
      if (row.status === "PENDING") stats.pending++;
      else if (row.status === "PUBLISHING") stats.publishing++;
      else if (row.status === "PUBLISHED") stats.published++;
      else if (row.status === "FAILED") stats.failed++;
    });

    return stats;
  }

  async getFailedEvents(limit: number = 100): Promise<OutboxEvent[]> {
    const { data, error } = await this.supabaseClient
      .schema(this.schema)
      .from("event_outbox")
      .select("*")
      .eq("status", "FAILED")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch failed outbox events: ${error.message}`);
    }

    return (data || []).map((row) => this.mapToOutboxEvent(row));
  }

  private mapToOutboxEvent(row: Record<string, any>): OutboxEvent {
    return {
      outboxId: row.outbox_id as string,
      eventId: row.event_id as string,
      eventType: row.event_type as string,
      aggregateId: row.aggregate_id as string,
      aggregateType: row.aggregate_type as string,
      payload: row.payload as Record<string, unknown>,
      routingKey: row.routing_key as string | undefined,
      occurredAt: new Date(row.occurred_at as string),
      status: row.status as OutboxStatus,
      publishAttempts: (row.publish_attempts as number) ?? 0,
      publishingError: row.publishing_error as string | undefined,
      publishedAt: row.published_at
        ? new Date(row.published_at as string)
        : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
