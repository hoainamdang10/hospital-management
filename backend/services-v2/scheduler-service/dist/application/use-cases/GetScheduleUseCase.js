"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetScheduleUseCase = void 0;
class GetScheduleUseCase {
    constructor(scheduleRepo, runRepo) {
        this.scheduleRepo = scheduleRepo;
        this.runRepo = runRepo;
    }
    async execute(request) {
        const schedule = await this.scheduleRepo.findById(request.scheduleId);
        if (!schedule) {
            throw new Error(`Schedule not found: ${request.scheduleId}`);
        }
        const props = schedule.getProps();
        const nextOccurrence = schedule.getNextOccurrence();
        const totalRuns = await this.runRepo.countByScheduleId(request.scheduleId);
        return {
            schedule: {
                scheduleId: props.scheduleId,
                tenantId: props.tenantId.getValue(),
                ownerService: props.ownerService,
                ownerResourceType: props.ownerResourceType,
                ownerResourceId: props.ownerResourceId,
                policyTag: props.policyTag,
                scheduleType: props.scheduleType.getValue(),
                timezone: props.timezone.getValue(),
                startAtUtc: props.startAtUtc?.toISOString(),
                endAtUtc: props.endAtUtc?.toISOString(),
                cronExpr: props.cronExpr?.getValue(),
                rrule: props.rrule?.getValue(),
                topicOrCommand: props.topicOrCommand,
                payloadJson: props.payloadJson,
                maxRuns: props.maxRuns,
                jitterMs: props.jitterMs,
                retryPolicy: props.retryPolicy.toJson(),
                dedupKey: props.dedupKey.getValue(),
                status: props.status,
                createdAt: props.createdAt.toISOString(),
                updatedAt: props.updatedAt.toISOString(),
                createdBy: props.createdBy
            },
            nextRunAt: nextOccurrence?.toISOString(),
            totalRuns
        };
    }
}
exports.GetScheduleUseCase = GetScheduleUseCase;
//# sourceMappingURL=GetScheduleUseCase.js.map