"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseInboxRepository = void 0;
const InboxEvent_aggregate_1 = require("../../domain/aggregates/InboxEvent.aggregate");
class SupabaseInboxRepository {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async exists(idempotencyKey) {
        const { data, error } = await this.supabase
            .from('inbox_events')
            .select('inbox_id')
            .eq('idempotency_key', idempotencyKey)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to check event existence: ${error.message}`);
        }
        return !!data;
    }
    async store(event) {
        const inboxId = crypto.randomUUID();
        const { data, error } = await this.supabase
            .from('inbox_events')
            .insert({
            inbox_id: inboxId,
            idempotency_key: event.idempotencyKey,
            event_type: event.eventType,
            payload_json: event.payload,
            headers_json: event.headers,
            status: 'PENDING',
            received_at_utc: new Date().toISOString(),
            created_at_utc: new Date().toISOString(),
            updated_at_utc: new Date().toISOString(),
        })
            .select('inbox_id')
            .single();
        if (error) {
            throw new Error(`Failed to store event: ${error.message}`);
        }
        return data.inbox_id;
    }
    async processEventIdempotent(idempotencyKey, eventType, payloadJson, headersJson = {}) {
        try {
            const { data, error } = await this.supabase.rpc('process_event_idempotent', {
                p_idempotency_key: idempotencyKey,
                p_event_type: eventType,
                p_payload_json: payloadJson,
                p_headers_json: headersJson
            });
            if (error) {
                throw new Error(`Failed to process event idempotently: ${error.message}`);
            }
            if (!data || data.length === 0) {
                throw new Error('No result returned from process_event_idempotent');
            }
            const result = data[0];
            return {
                isNew: result.is_new,
                inboxId: result.inbox_id.toString(),
                status: result.status
            };
        }
        catch (error) {
            console.error('Error processing event idempotently:', error);
            throw error;
        }
    }
    async findByIdempotencyKey(idempotencyKey) {
        const { data, error } = await this.supabase
            .from('inbox')
            .select('*')
            .eq('idempotency_key', idempotencyKey)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find inbox event: ${error.message}`);
        }
        return this.toDomain(data);
    }
    async findById(inboxId) {
        const { data, error } = await this.supabase
            .from('inbox')
            .select('*')
            .eq('inbox_id', inboxId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find inbox event: ${error.message}`);
        }
        return this.toDomain(data);
    }
    async findPending(limit = 100) {
        const { data, error } = await this.supabase
            .from('inbox')
            .select('*')
            .eq('status', 'PENDING')
            .order('received_at_utc', { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to find pending events: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async findFailed(limit = 100) {
        const { data, error } = await this.supabase
            .from('inbox')
            .select('*')
            .eq('status', 'FAILED')
            .order('last_retry_at_utc', { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to find failed events: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async update(event) {
        const props = event.getProps();
        const row = this.toRow(props);
        const { error } = await this.supabase
            .from('inbox')
            .update(row)
            .eq('inbox_id', props.inboxId);
        if (error) {
            throw new Error(`Failed to update inbox event: ${error.message}`);
        }
    }
    async deleteOldCompleted(olderThanDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const { data, error } = await this.supabase
            .from('inbox')
            .delete()
            .eq('status', 'COMPLETED')
            .lt('processed_at_utc', cutoffDate.toISOString())
            .select('inbox_id');
        if (error) {
            throw new Error(`Failed to delete old completed events: ${error.message}`);
        }
        return data?.length || 0;
    }
    toDomain(row) {
        return InboxEvent_aggregate_1.InboxEvent.reconstitute({
            inboxId: row.inbox_id.toString(),
            idempotencyKey: row.idempotency_key,
            eventType: row.event_type,
            payloadJson: row.payload_json,
            headersJson: row.headers_json,
            status: row.status,
            receivedAtUtc: new Date(row.received_at_utc),
            processedAtUtc: row.processed_at_utc ? new Date(row.processed_at_utc) : undefined,
            errorMessage: row.error_message || undefined,
            retryCount: row.retry_count,
            lastRetryAtUtc: row.last_retry_at_utc ? new Date(row.last_retry_at_utc) : undefined,
            createdAtUtc: new Date(row.created_at_utc),
            updatedAtUtc: new Date(row.updated_at_utc)
        });
    }
    toRow(props) {
        return {
            idempotency_key: props.idempotencyKey,
            event_type: props.eventType,
            payload_json: props.payloadJson,
            headers_json: props.headersJson,
            status: props.status,
            processed_at_utc: props.processedAtUtc?.toISOString() || null,
            error_message: props.errorMessage || null,
            retry_count: props.retryCount,
            last_retry_at_utc: props.lastRetryAtUtc?.toISOString() || null
        };
    }
}
exports.SupabaseInboxRepository = SupabaseInboxRepository;
//# sourceMappingURL=SupabaseInboxRepository.js.map