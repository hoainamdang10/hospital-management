import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type OutboxStatus = "PENDING" | "RESERVED" | "SENT" | "FAILED";

export interface OutboxEventRecord {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload_json: any;
  dedup_key?: string | null;
  status: OutboxStatus;
  attempts: number;
  next_retry_at: string;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnqueueParams {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  dedupKey?: string;
}

export class OutboxRepository {
  private supabase: SupabaseClient<any, "appointments_schema">;
  private readonly table = "outbox_events";
  private readonly reservedTimeoutMinutes: number;

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    reservedTimeoutMinutes: number = 5,
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "appointments_schema" },
      global: { headers: { "X-Client-Info": "appointments-outbox" } },
    }) as SupabaseClient<any, "appointments_schema">;
    this.reservedTimeoutMinutes =
      Number.isFinite(reservedTimeoutMinutes) && reservedTimeoutMinutes > 0
        ? reservedTimeoutMinutes
        : 5;
  }

  async enqueue(params: EnqueueParams): Promise<void> {
    const { error } = await this.supabase.from(this.table).insert({
      event_type: params.eventType,
      aggregate_type: params.aggregateType,
      aggregate_id: params.aggregateId,
      payload_json: params.payload,
      dedup_key: params.dedupKey ?? null,
      status: "PENDING",
    });

    if (error) {
      // Unique violation on dedup_key -> treat as idempotent success
      if ((error as any).code === "23505") return;
      throw new Error(`Outbox enqueue failed: ${error.message}`);
    }
  }

  async claimBatch(limit: number): Promise<OutboxEventRecord[]> {
    // Use RPC function created by migration for SKIP LOCKED claim
    const { data, error } = await (this.supabase as any).rpc(
      "claim_outbox_events",
      {
        batch_size: limit,
        reserved_timeout_minutes: this.reservedTimeoutMinutes,
      },
    );
    if (error) throw new Error(`Outbox claim failed: ${error.message}`);
    return (data || []) as OutboxEventRecord[];
  }

  async markSent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update({ status: "SENT", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(`Outbox markSent failed: ${error.message}`);
  }

  async markFailed(
    id: string,
    lastError: string,
    nextRetryAt: Date,
    attempts: number,
  ): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update({
        status: "FAILED",
        last_error: lastError,
        next_retry_at: nextRetryAt.toISOString(),
        attempts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(`Outbox markFailed failed: ${error.message}`);
  }
}
