"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseOutboxRepository = void 0;
const Outbox_entity_1 = require("../../domain/entities/Outbox.entity");
class SupabaseOutboxRepository {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async save(outbox) {
        const props = outbox.getProps();
        const row = this.toRow(props);
        const { error } = await this.supabase
            .from('outbox')
            .insert(row);
        if (error) {
            throw new Error(`Failed to save outbox entry: ${error.message}`);
        }
    }
    async findUnpublished(limit = 100) {
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
    async update(outbox) {
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
    async deletePublished(olderThan) {
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
    toDomain(row) {
        return Outbox_entity_1.Outbox.reconstitute({
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
    toRow(props) {
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
exports.SupabaseOutboxRepository = SupabaseOutboxRepository;
//# sourceMappingURL=SupabaseOutboxRepository.js.map