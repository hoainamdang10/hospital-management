"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseScheduleRunRepository = void 0;
const ScheduleRun_entity_1 = require("../../domain/entities/ScheduleRun.entity");
const TenantId_1 = require("../../domain/value-objects/TenantId");
class SupabaseScheduleRunRepository {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async save(run) {
        const props = run.getProps();
        const row = this.toRow(props);
        const { error } = await this.supabase
            .from('schedule_runs')
            .insert(row);
        if (error) {
            throw new Error(`Failed to save schedule run: ${error.message}`);
        }
    }
    async findById(runId) {
        const { data, error } = await this.supabase
            .from('schedule_runs')
            .select('*')
            .eq('run_id', runId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find schedule run: ${error.message}`);
        }
        return this.toDomain(data);
    }
    async findByScheduleId(scheduleId, limit = 100, offset = 0) {
        const { data, error } = await this.supabase
            .from('schedule_runs')
            .select('*')
            .eq('schedule_id', scheduleId)
            .order('due_at_utc', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            throw new Error(`Failed to find schedule runs: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async findDueRuns(beforeDate, segment, limit = 100) {
        let query = this.supabase
            .from('schedule_runs')
            .select('*')
            .eq('status', 'DUE')
            .lte('due_at_utc', beforeDate.toISOString())
            .order('due_at_utc', { ascending: true })
            .limit(limit);
        if (segment !== undefined) {
            query = query.eq('segment', segment);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find due runs: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async acquireDueRuns(beforeDate, workerId, segment, limit = 100, graceWindowMs = 60000, leaseTtlMs = 60000) {
        try {
            const { data, error } = await this.supabase.rpc('acquire_due_runs', {
                p_before_date: beforeDate.toISOString(),
                p_worker_id: workerId,
                p_segment: segment,
                p_limit: limit,
                p_grace_window_ms: graceWindowMs,
                p_lease_ttl_ms: leaseTtlMs
            });
            if (error) {
                throw new Error(`Failed to acquire due runs: ${error.message}`);
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map((row) => this.toDomain(row));
        }
        catch (error) {
            console.error('Error acquiring due runs:', error);
            throw error;
        }
    }
    async executeRunTransactional(params) {
        try {
            const { data, error } = await this.supabase.rpc('execute_run_transactional', {
                p_run_id: params.runId,
                p_worker_id: params.workerId,
                p_topic_or_command: params.topicOrCommand,
                p_payload_json: params.payloadJson,
                p_headers_json: params.headersJson
            });
            if (error) {
                throw new Error(`Failed to execute run transactionally: ${error.message}`);
            }
            if (!data || data.length === 0) {
                return {
                    success: false,
                    errorMessage: 'No result returned from execute_run_transactional'
                };
            }
            const result = data[0];
            return {
                success: result.success,
                errorMessage: result.error_message || undefined
            };
        }
        catch (error) {
            console.error('Error executing run transactionally:', error);
            return {
                success: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async findByStatus(status, limit = 100) {
        const { data, error } = await this.supabase
            .from('schedule_runs')
            .select('*')
            .eq('status', status)
            .limit(limit);
        if (error) {
            throw new Error(`Failed to find runs by status: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async update(run) {
        const props = run.getProps();
        const row = this.toRow(props);
        const { error } = await this.supabase
            .from('schedule_runs')
            .update(row)
            .eq('run_id', props.runId);
        if (error) {
            throw new Error(`Failed to update schedule run: ${error.message}`);
        }
    }
    async delete(runId) {
        const { error } = await this.supabase
            .from('schedule_runs')
            .delete()
            .eq('run_id', runId);
        if (error) {
            throw new Error(`Failed to delete schedule run: ${error.message}`);
        }
    }
    async deleteByScheduleId(scheduleId) {
        const { error } = await this.supabase
            .from('schedule_runs')
            .delete()
            .eq('schedule_id', scheduleId);
        if (error) {
            throw new Error(`Failed to delete schedule runs: ${error.message}`);
        }
    }
    async countByScheduleId(scheduleId) {
        const { count, error } = await this.supabase
            .from('schedule_runs')
            .select('*', { count: 'exact', head: true })
            .eq('schedule_id', scheduleId);
        if (error) {
            throw new Error(`Failed to count schedule runs: ${error.message}`);
        }
        return count || 0;
    }
    toDomain(row) {
        return ScheduleRun_entity_1.ScheduleRun.reconstitute({
            runId: row.run_id,
            scheduleId: row.schedule_id,
            tenantId: TenantId_1.TenantId.create(row.tenant_id),
            dueAtUtc: new Date(row.due_at_utc),
            status: row.status,
            attempt: row.attempt,
            lockedBy: row.locked_by || undefined,
            lockedAtUtc: row.locked_at_utc ? new Date(row.locked_at_utc) : undefined,
            startedAtUtc: row.started_at_utc ? new Date(row.started_at_utc) : undefined,
            finishedAtUtc: row.finished_at_utc ? new Date(row.finished_at_utc) : undefined,
            lastError: row.last_error || undefined,
            segment: row.segment || undefined,
            createdAt: new Date(row.created_at)
        });
    }
    async deleteOlderThan(daysOld) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const { data, error } = await this.supabase
                .from('schedule_runs')
                .delete()
                .in('status', ['COMPLETED', 'FAILED', 'CANCELLED'])
                .lt('finished_at_utc', cutoffDate.toISOString())
                .select('run_id');
            if (error) {
                throw new Error(`Failed to delete old runs: ${error.message}`);
            }
            return data?.length || 0;
        }
        catch (error) {
            console.error('Error deleting old runs:', error);
            throw error;
        }
    }
    toRow(props) {
        return {
            run_id: props.runId,
            schedule_id: props.scheduleId,
            tenant_id: props.tenantId.getValue(),
            due_at_utc: props.dueAtUtc.toISOString(),
            status: props.status,
            attempt: props.attempt,
            locked_by: props.lockedBy || null,
            locked_at_utc: props.lockedAtUtc?.toISOString() || null,
            started_at_utc: props.startedAtUtc?.toISOString() || null,
            finished_at_utc: props.finishedAtUtc?.toISOString() || null,
            last_error: props.lastError || null,
            segment: props.segment || null,
            created_at: props.createdAt.toISOString()
        };
    }
}
exports.SupabaseScheduleRunRepository = SupabaseScheduleRunRepository;
//# sourceMappingURL=SupabaseScheduleRunRepository.js.map