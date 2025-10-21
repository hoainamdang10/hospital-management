import Joi from 'joi';

// MVP: ONCE schedules only
// TODO: Add CRON and RRULE support in future phases
export const createScheduleSchema = Joi.object({
  tenantId: Joi.string().required(),
  ownerService: Joi.string().required(),
  ownerResourceType: Joi.string().optional(),
  ownerResourceId: Joi.string().optional(),
  policyTag: Joi.string().optional(),

  // MVP: Only ONCE schedules allowed
  scheduleType: Joi.string().valid('ONCE').required()
    .messages({
      'any.only': 'MVP only supports ONCE schedules. CRON and RRULE will be available in future releases.'
    }),

  timezone: Joi.string().optional().default('UTC'),

  // ONCE schedules require startAtUtc
  startAtUtc: Joi.string().isoDate().required()
    .messages({
      'any.required': 'ONCE schedules require startAtUtc'
    }),

  endAtUtc: Joi.string().isoDate().optional(),

  // ONCE schedules cannot have cronExpr or rrule
  cronExpr: Joi.forbidden()
    .messages({
      'any.unknown': 'ONCE schedules cannot have cronExpr'
    }),

  rrule: Joi.forbidden()
    .messages({
      'any.unknown': 'ONCE schedules cannot have rrule'
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

