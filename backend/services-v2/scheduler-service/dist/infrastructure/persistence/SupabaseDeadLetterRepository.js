"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseDeadLetterRepository = void 0;
const DeadLetter_entity_1 = require("../../domain/entities/DeadLetter.entity");
const TenantId_1 = require("../../domain/value-objects/TenantId");
class SupabaseDeadLetterRepository {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async save(deadLetter) {
        const props = deadLetter.getProps();
        const row = this.toRow(props);
        const { error } = await this.supabase
            .from('dead_letters')
            .insert(row);
        if (error) {
            throw new Error(`Failed to save dead letter: ${error.message}`);
        }
    }
    async findById(id) {
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
    async findByScheduleId(scheduleId, limit = 100) {
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
    async findByTenantId(tenantId, limit = 100) {
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
    async deleteOlderThan(daysOld) {
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
        }
        catch (error) {
            console.error('Error deleting old dead letters:', error);
            throw error;
        }
    }
    async delete(id) {
        const { error } = await this.supabase
            .from('dead_letters')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete dead letter: ${error.message}`);
        }
    }
    toDomain(row) {
        return DeadLetter_entity_1.DeadLetter.reconstitute({
            id: row.id,
            runId: row.run_id || undefined,
            scheduleId: row.schedule_id || undefined,
            tenantId: row.tenant_id ? TenantId_1.TenantId.create(row.tenant_id) : undefined,
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
    toRow(props) {
        const row = {
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
exports.SupabaseDeadLetterRepository = SupabaseDeadLetterRepository;
//# sourceMappingURL=SupabaseDeadLetterRepository.js.map