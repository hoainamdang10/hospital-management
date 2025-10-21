"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseScheduleRepository = void 0;
const Schedule_aggregate_1 = require("../../domain/aggregates/Schedule.aggregate");
const ScheduleType_1 = require("../../domain/value-objects/ScheduleType");
const CronExpression_1 = require("../../domain/value-objects/CronExpression");
const RRuleExpression_1 = require("../../domain/value-objects/RRuleExpression");
const Timezone_1 = require("../../domain/value-objects/Timezone");
const TenantId_1 = require("../../domain/value-objects/TenantId");
const DedupKey_1 = require("../../domain/value-objects/DedupKey");
const RetryPolicy_1 = require("../../domain/value-objects/RetryPolicy");
class SupabaseScheduleRepository {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async save(schedule) {
        const props = schedule.getProps();
        const row = this.toRow(props);
        const { error } = await this.supabase
            .from('schedules')
            .insert(row);
        if (error) {
            throw new Error(`Failed to save schedule: ${error.message}`);
        }
    }
    async findById(scheduleId) {
        const { data, error } = await this.supabase
            .from('schedules')
            .select('*')
            .eq('schedule_id', scheduleId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find schedule: ${error.message}`);
        }
        return this.toDomain(data);
    }
    async findByTenantAndDedupKey(tenantId, dedupKey) {
        const { data, error } = await this.supabase
            .from('schedules')
            .select('*')
            .eq('tenant_id', tenantId.getValue())
            .eq('dedup_key', dedupKey.getValue())
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find schedule: ${error.message}`);
        }
        return this.toDomain(data);
    }
    async findByOwner(tenantId, ownerService, ownerResourceType, ownerResourceId, policyTag) {
        let query = this.supabase
            .from('schedules')
            .select('*')
            .eq('tenant_id', tenantId.getValue())
            .eq('owner_service', ownerService);
        if (ownerResourceType) {
            query = query.eq('owner_resource_type', ownerResourceType);
        }
        if (ownerResourceId) {
            query = query.eq('owner_resource_id', ownerResourceId);
        }
        if (policyTag) {
            query = query.eq('policy_tag', policyTag);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find schedules: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async findActiveSchedules(limit = 100, offset = 0) {
        const { data, error } = await this.supabase
            .from('schedules')
            .select('*')
            .eq('status', 'ACTIVE')
            .range(offset, offset + limit - 1);
        if (error) {
            throw new Error(`Failed to find active schedules: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async update(schedule) {
        const props = schedule.getProps();
        const row = this.toRow(props);
        const { error } = await this.supabase
            .from('schedules')
            .update(row)
            .eq('schedule_id', props.scheduleId);
        if (error) {
            throw new Error(`Failed to update schedule: ${error.message}`);
        }
    }
    async delete(scheduleId) {
        const { error } = await this.supabase
            .from('schedules')
            .delete()
            .eq('schedule_id', scheduleId);
        if (error) {
            throw new Error(`Failed to delete schedule: ${error.message}`);
        }
    }
    toDomain(row) {
        return Schedule_aggregate_1.Schedule.reconstitute({
            scheduleId: row.schedule_id,
            tenantId: TenantId_1.TenantId.create(row.tenant_id),
            ownerService: row.owner_service,
            ownerResourceType: row.owner_resource_type || undefined,
            ownerResourceId: row.owner_resource_id || undefined,
            policyTag: row.policy_tag || undefined,
            scheduleType: ScheduleType_1.ScheduleTypeVO.create(row.schedule_type),
            timezone: Timezone_1.Timezone.create(row.timezone),
            startAtUtc: row.start_at_utc ? new Date(row.start_at_utc) : undefined,
            endAtUtc: row.end_at_utc ? new Date(row.end_at_utc) : undefined,
            cronExpr: row.cron_expr ? CronExpression_1.CronExpression.create(row.cron_expr) : undefined,
            rrule: row.rrule ? RRuleExpression_1.RRuleExpression.create(row.rrule) : undefined,
            topicOrCommand: row.topic_or_command,
            payloadJson: row.payload_json,
            maxRuns: row.max_runs || undefined,
            jitterMs: row.jitter_ms,
            retryPolicy: RetryPolicy_1.RetryPolicy.fromJson(row.retry_policy_json),
            dedupKey: DedupKey_1.DedupKey.create(row.dedup_key),
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            createdBy: row.created_by || undefined
        });
    }
    toRow(props) {
        return {
            schedule_id: props.scheduleId,
            tenant_id: props.tenantId.getValue(),
            owner_service: props.ownerService,
            owner_resource_type: props.ownerResourceType || null,
            owner_resource_id: props.ownerResourceId || null,
            policy_tag: props.policyTag || null,
            schedule_type: props.scheduleType.getValue(),
            timezone: props.timezone.getValue(),
            start_at_utc: props.startAtUtc?.toISOString() || null,
            end_at_utc: props.endAtUtc?.toISOString() || null,
            cron_expr: props.cronExpr?.getValue() || null,
            rrule: props.rrule?.getValue() || null,
            topic_or_command: props.topicOrCommand,
            payload_json: props.payloadJson,
            max_runs: props.maxRuns || null,
            jitter_ms: props.jitterMs,
            retry_policy_json: props.retryPolicy.toJson(),
            dedup_key: props.dedupKey.getValue(),
            status: props.status,
            created_at: props.createdAt.toISOString(),
            updated_at: props.updatedAt.toISOString(),
            created_by: props.createdBy || null
        };
    }
}
exports.SupabaseScheduleRepository = SupabaseScheduleRepository;
//# sourceMappingURL=SupabaseScheduleRepository.js.map