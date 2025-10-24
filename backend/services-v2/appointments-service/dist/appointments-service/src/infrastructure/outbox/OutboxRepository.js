"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class OutboxRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.table = 'outbox_events';
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            db: { schema: 'appointments_schema' },
            global: { headers: { 'X-Client-Info': 'appointments-outbox' } }
        });
    }
    async enqueue(params) {
        const { error } = await this.supabase.from(this.table).insert({
            event_type: params.eventType,
            aggregate_type: params.aggregateType,
            aggregate_id: params.aggregateId,
            payload_json: params.payload,
            dedup_key: params.dedupKey ?? null,
            status: 'PENDING'
        });
        if (error) {
            // Unique violation on dedup_key -> treat as idempotent success
            if (error.code === '23505')
                return;
            throw new Error(`Outbox enqueue failed: ${error.message}`);
        }
    }
    async claimBatch(limit) {
        // Use RPC function created by migration for SKIP LOCKED claim
        const { data, error } = await this.supabase.rpc('claim_outbox_events', { batch_size: limit });
        if (error)
            throw new Error(`Outbox claim failed: ${error.message}`);
        return (data || []);
    }
    async markSent(id) {
        const { error } = await this.supabase.from(this.table)
            .update({ status: 'SENT', updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error)
            throw new Error(`Outbox markSent failed: ${error.message}`);
    }
    async markFailed(id, lastError, nextRetryAt, attempts) {
        const { error } = await this.supabase.from(this.table)
            .update({ status: 'FAILED', last_error: lastError, next_retry_at: nextRetryAt.toISOString(), attempts, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error)
            throw new Error(`Outbox markFailed failed: ${error.message}`);
    }
}
exports.OutboxRepository = OutboxRepository;
//# sourceMappingURL=OutboxRepository.js.map