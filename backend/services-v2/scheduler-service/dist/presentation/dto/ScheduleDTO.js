"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelScheduleSchema = exports.createScheduleSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// MVP: ONCE schedules only
// TODO: Add CRON and RRULE support in future phases
exports.createScheduleSchema = joi_1.default.object({
    tenantId: joi_1.default.string().required(),
    ownerService: joi_1.default.string().required(),
    ownerResourceType: joi_1.default.string().optional(),
    ownerResourceId: joi_1.default.string().optional(),
    policyTag: joi_1.default.string().optional(),
    // MVP: Only ONCE schedules allowed
    scheduleType: joi_1.default.string().valid('ONCE').required()
        .messages({
        'any.only': 'MVP only supports ONCE schedules. CRON and RRULE will be available in future releases.'
    }),
    timezone: joi_1.default.string().optional().default('UTC'),
    // ONCE schedules require startAtUtc
    startAtUtc: joi_1.default.string().isoDate().required()
        .messages({
        'any.required': 'ONCE schedules require startAtUtc'
    }),
    endAtUtc: joi_1.default.string().isoDate().optional(),
    // ONCE schedules cannot have cronExpr or rrule
    cronExpr: joi_1.default.forbidden()
        .messages({
        'any.unknown': 'ONCE schedules cannot have cronExpr'
    }),
    rrule: joi_1.default.forbidden()
        .messages({
        'any.unknown': 'ONCE schedules cannot have rrule'
    }),
    topicOrCommand: joi_1.default.string().required(),
    payloadJson: joi_1.default.object().required(),
    maxRuns: joi_1.default.number().integer().min(1).optional(),
    jitterMs: joi_1.default.number().integer().min(0).max(60000).optional().default(0),
    retryPolicy: joi_1.default.object({
        strategy: joi_1.default.string().valid('exp', 'linear', 'fixed').required(),
        maxAttempts: joi_1.default.number().integer().min(0).max(10).required(),
        baseMs: joi_1.default.number().integer().min(100).required(),
        maxDelayMs: joi_1.default.number().integer().min(1000).optional()
    }).optional(),
    dedupKey: joi_1.default.string().required(),
    createdBy: joi_1.default.string().optional()
});
exports.cancelScheduleSchema = joi_1.default.object({
    tenantId: joi_1.default.string().required(),
    ownerService: joi_1.default.string().required(),
    ownerResourceType: joi_1.default.string().optional(),
    ownerResourceId: joi_1.default.string().optional(),
    policyTag: joi_1.default.string().optional(),
    reason: joi_1.default.string().optional()
});
//# sourceMappingURL=ScheduleDTO.js.map