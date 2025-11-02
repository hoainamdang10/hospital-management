import Joi from 'joi';

/**
 * Create Schedule DTO Validation
 * Supports: ONCE, CRON, RRULE schedule types
 */
export const createScheduleSchema = Joi.object({
  tenantId: Joi.string().required(),
  ownerService: Joi.string().required(),
  ownerResourceType: Joi.string().optional(),
  ownerResourceId: Joi.string().optional(),
  policyTag: Joi.string().optional(),

  // Support all schedule types: ONCE, CRON, RRULE
  scheduleType: Joi.string().valid('ONCE', 'CRON', 'RRULE').required()
    .messages({
      'any.only': 'scheduleType must be one of: ONCE, CRON, RRULE'
    }),

  timezone: Joi.string().optional().default('UTC'),

  // ONCE schedules require startAtUtc
  startAtUtc: Joi.string().isoDate().when('scheduleType', {
    is: 'ONCE',
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'any.required': 'ONCE schedules require startAtUtc'
  }),

  endAtUtc: Joi.string().isoDate().optional(),

  // CRON schedules require cronExpr (e.g., "0 9 * * 1-5" = 9am weekdays)
  cronExpr: Joi.string().when('scheduleType', {
    is: 'CRON',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }).messages({
    'any.required': 'CRON schedules require cronExpr',
    'any.unknown': 'Only CRON schedules can have cronExpr'
  }),

  // RRULE schedules require rrule (RFC 5545 format)
  rrule: Joi.string().when('scheduleType', {
    is: 'RRULE',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }).messages({
    'any.required': 'RRULE schedules require rrule (RFC 5545 format)',
    'any.unknown': 'Only RRULE schedules can have rrule'
  }),

  topicOrCommand: Joi.string().required(),
  payloadJson: Joi.object().required(),
  maxRuns: Joi.number().integer().min(1).optional(),
  jitterMs: Joi.number().integer().min(0).max(60000).optional().default(0),
  retryPolicy: Joi.object({
    strategy: Joi.string().valid('exp', 'linear', 'fixed').required(),
    maxAttempts: Joi.number().integer().min(0).max(10).required(),
    baseMs: Joi.number().integer().min(100).required(),
    maxDelayMs: Joi.number().integer().min(1000).optional()
  }).optional(),
  dedupKey: Joi.string().required(),
  createdBy: Joi.string().optional()
});

export const cancelScheduleSchema = Joi.object({
  tenantId: Joi.string().required(),
  ownerService: Joi.string().required(),
  ownerResourceType: Joi.string().optional(),
  ownerResourceId: Joi.string().optional(),
  policyTag: Joi.string().optional(),
  reason: Joi.string().optional()
});

