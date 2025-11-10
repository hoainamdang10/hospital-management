import { SupabaseClient } from "@supabase/supabase-js";
import { ILogger } from "../../shared/logger";

const SCHEMA = "clinical_schema";
const TABLE = "integration_inbox_events";

export type IntegrationEventStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED";

export interface IntegrationInboxEvent {
  eventId: string;
  routingKey: string;
  sourceService?: string;
  payload: Record<string, unknown>;
}

export class SupabaseIntegrationInboxRepository {
  constructor(
    private readonly supabase: SupabaseClient<any, any>,
    private readonly logger: ILogger,
  ) {}

  /**
   * Register an incoming event. Returns false if the event was already stored.
   */
  async registerEvent(event: IntegrationInboxEvent): Promise<boolean> {
    const row = {
      event_id: event.eventId,
      routing_key: event.routingKey,
      source_service: event.sourceService ?? null,
      payload: event.payload,
    };

    const { error } = await this.supabase
      .schema(SCHEMA)
      .from(TABLE)
      .insert(row);

    if (!error) {
      return true;
    }

    if (error.code === "23505") {
      this.logger.info("[IntegrationInbox] Duplicate event skipped", {
        eventId: event.eventId,
      });
      return false;
    }

    this.logger.error("[IntegrationInbox] Failed to register event", {
      eventId: event.eventId,
      error: error.message,
    });
    throw new Error(
      `Failed to register integration event ${event.eventId}: ${error.message}`,
    );
  }

  async markProcessed(eventId: string): Promise<void> {
    const { error } = await this.supabase
      .schema(SCHEMA)
      .from(TABLE)
      .update({
        status: "PROCESSED",
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("event_id", eventId);

    if (error) {
      throw new Error(
        `Failed to mark integration event processed: ${error.message}`,
      );
    }
  }

  async markFailed(eventId: string, reason: string): Promise<void> {
    const { data, error } = await this.supabase
      .schema(SCHEMA)
      .from(TABLE)
      .select("retry_count")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to fetch integration event for failure update: ${error.message}`,
      );
    }

    const retryCount = (data?.retry_count ?? 0) + 1;
    const { error: updateError } = await this.supabase
      .schema(SCHEMA)
      .from(TABLE)
      .update({
        status: "FAILED",
        processed_at: new Date().toISOString(),
        last_error: reason,
        retry_count: retryCount,
      })
      .eq("event_id", eventId);

    if (updateError) {
      throw new Error(
        `Failed to mark integration event failed: ${updateError.message}`,
      );
    }
  }
}
