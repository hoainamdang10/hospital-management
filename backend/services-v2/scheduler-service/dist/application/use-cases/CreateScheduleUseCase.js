"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateScheduleUseCase = void 0;
const Schedule_aggregate_1 = require("../../domain/aggregates/Schedule.aggregate");
const ScheduleType_1 = require("../../domain/value-objects/ScheduleType");
const CronExpression_1 = require("../../domain/value-objects/CronExpression");
const RRuleExpression_1 = require("../../domain/value-objects/RRuleExpression");
const Timezone_1 = require("../../domain/value-objects/Timezone");
const TenantId_1 = require("../../domain/value-objects/TenantId");
const DedupKey_1 = require("../../domain/value-objects/DedupKey");
const RetryPolicy_1 = require("../../domain/value-objects/RetryPolicy");
class CreateScheduleUseCase {
    constructor(scheduleRepo) {
        this.scheduleRepo = scheduleRepo;
    }
    async execute(request) {
        const tenantId = TenantId_1.TenantId.create(request.tenantId);
        const dedupKey = DedupKey_1.DedupKey.create(request.dedupKey);
        const existing = await this.scheduleRepo.findByTenantAndDedupKey(tenantId, dedupKey);
        if (existing) {
            existing.update({
                payloadJson: request.payloadJson,
                endAtUtc: request.endAtUtc ? new Date(request.endAtUtc) : undefined,
                maxRuns: request.maxRuns
            });
            await this.scheduleRepo.update(existing);
            const nextOccurrence = existing.getNextOccurrence();
            return {
                scheduleId: existing.getScheduleId(),
                status: existing.getStatus(),
                nextRunAt: nextOccurrence?.toISOString()
            };
        }
        const scheduleType = ScheduleType_1.ScheduleTypeVO.create(request.scheduleType);
        const timezone = request.timezone ? Timezone_1.Timezone.create(request.timezone) : Timezone_1.Timezone.utc();
        let cronExpr;
        let rrule;
        if (scheduleType.isCron()) {
            if (!request.cronExpr) {
                throw new Error('CRON expression required for CRON schedule');
            }
            cronExpr = CronExpression_1.CronExpression.create(request.cronExpr);
        }
        if (scheduleType.isRRule()) {
            if (!request.rrule) {
                throw new Error('RRULE required for RRULE schedule');
            }
            rrule = RRuleExpression_1.RRuleExpression.create(request.rrule);
        }
        const retryPolicy = request.retryPolicy
            ? RetryPolicy_1.RetryPolicy.create(request.retryPolicy)
            : RetryPolicy_1.RetryPolicy.default();
        const schedule = Schedule_aggregate_1.Schedule.create({
            tenantId,
            ownerService: request.ownerService,
            ownerResourceType: request.ownerResourceType,
            ownerResourceId: request.ownerResourceId,
            policyTag: request.policyTag,
            scheduleType,
            timezone,
            startAtUtc: request.startAtUtc ? new Date(request.startAtUtc) : undefined,
            endAtUtc: request.endAtUtc ? new Date(request.endAtUtc) : undefined,
            cronExpr,
            rrule,
            topicOrCommand: request.topicOrCommand,
            payloadJson: request.payloadJson,
            maxRuns: request.maxRuns,
            jitterMs: request.jitterMs || 0,
            retryPolicy,
            dedupKey,
            createdBy: request.createdBy
        });
        await this.scheduleRepo.save(schedule);
        const nextOccurrence = schedule.getNextOccurrence();
        return {
            scheduleId: schedule.getScheduleId(),
            status: schedule.getStatus(),
            nextRunAt: nextOccurrence?.toISOString()
        };
    }
}
exports.CreateScheduleUseCase = CreateScheduleUseCase;
//# sourceMappingURL=CreateScheduleUseCase.js.map