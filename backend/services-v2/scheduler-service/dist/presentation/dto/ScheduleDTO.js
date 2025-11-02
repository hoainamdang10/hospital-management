"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelScheduleSchema = exports.createScheduleSchema = void 0;
const joi_1 = __importDefault(require("joi"));
/**
 * Create Schedule DTO Validation
 * Supports: ONCE, CRON, RRULE schedule types
 */
exports.createScheduleSchema = joi_1.default.object({
    tenantId: joi_1.default.string().required(),
    ownerService: joi_1.default.string().required(),
    ownerResourceType: joi_1.default.string().optional(),
    ownerResourceId: joi_1.default.string().optional(),
    policyTag: joi_1.default.string().optional(),
    // Support all schedule types: ONCE, CRON, RRULE
    scheduleType: joi_1.default.string().valid('ONCE', 'CRON', 'RRULE').required()
        .messages({
        'any.only': 'scheduleType must be one of: ONCE, CRON, RRULE'
    }),
    timezone: joi_1.default.string().optional().default('UTC'),
    // ONCE schedules require startAtUtc
    startAtUtc: joi_1.default.string().isoDate().when('scheduleType', {
        is: 'ONCE',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }).messages({
        'any.required': 'ONCE schedules require startAtUtc'
    }),
    endAtUtc: joi_1.default.string().isoDate().optional(),
    // CRON schedules require cronExpr (e.g., "0 9 * * 1-5" = 9am weekdays)
    cronExpr: joi_1.default.string().when('scheduleType', {
        is: 'CRON',
        then: joi_1.default.required(),
        otherwise: joi_1.default.forbidden()
    }).messages({
        'any.required': 'CRON schedules require cronExpr',
        'any.unknown': 'Only CRON schedules can have cronExpr'
    }),
    // RRULE schedules require rrule (RFC 5545 format)
    rrule: joi_1.default.string().when('scheduleType', {
        is: 'RRULE',
        then: joi_1.default.required(),
        otherwise: joi_1.default.forbidden()
    }).messages({
        'any.required': 'RRULE schedules require rrule (RFC 5545 format)',
        'any.unknown': 'Only RRULE schedules can have rrule'
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