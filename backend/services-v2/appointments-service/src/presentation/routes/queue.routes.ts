/**
 * Queue Routes - Presentation Layer
 * V3 Clean Architecture + DDD Implementation
 * 
 * Routes for queue management
 * 
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */

import { Router } from 'express';
import { getContainer } from '../../infrastructure/di/container';
import { QueueController } from '../controllers/QueueController';
import { authenticate, requireRole } from '../middleware/AuthMiddleware';
import { validateRequest } from '../middleware/ValidationMiddleware';
import Joi from 'joi';

/**
 * Validation schemas
 */
const joinQueueSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^PAT-\d{6}-\d{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mã bệnh nhân không đúng định dạng',
      'any.required': 'Mã bệnh nhân là bắt buộc'
    }),
  doctorId: Joi.string()
    .pattern(/^DEPT-DOC-\d{6}-\d{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mã bác sĩ không đúng định dạng',
      'any.required': 'Mã bác sĩ là bắt buộc'
    }),
  appointmentId: Joi.string()
    .optional(),
  departmentId: Joi.string()
    .optional(),
  priority: Joi.string()
    .valid('EMERGENCY', 'URGENT', 'NORMAL', 'LOW')
    .required()
    .messages({
      'any.only': 'Độ ưu tiên phải là EMERGENCY, URGENT, NORMAL hoặc LOW',
      'any.required': 'Độ ưu tiên là bắt buộc'
    }),
  checkInTime: Joi.date()
    .iso()
    .optional()
});

const callNextPatientSchema = Joi.object({
  doctorId: Joi.string()
    .pattern(/^DEPT-DOC-\d{6}-\d{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mã bác sĩ không đúng định dạng',
      'any.required': 'Mã bác sĩ là bắt buộc'
    })
});

const leaveQueueSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^PAT-\d{6}-\d{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mã bệnh nhân không đúng định dạng',
      'any.required': 'Mã bệnh nhân là bắt buộc'
    }),
  doctorId: Joi.string()
    .pattern(/^DEPT-DOC-\d{6}-\d{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mã bác sĩ không đúng định dạng',
      'any.required': 'Mã bác sĩ là bắt buộc'
    }),
  reason: Joi.string()
    .min(3)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Lý do phải có ít nhất 3 ký tự',
      'string.max': 'Lý do không được quá 500 ký tự'
    })
});

const queueStatusSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^PAT-\d{6}-\d{3}$/)
    .optional(),
  doctorId: Joi.string()
    .pattern(/^DEPT-DOC-\d{6}-\d{3}$/)
    .optional()
}).or('patientId', 'doctorId')
  .messages({
    'object.missing': 'Phải cung cấp patientId hoặc doctorId'
  });

const manageRemindersSchema = Joi.object({
  action: Joi.string()
    .valid('enable', 'disable', 'reschedule')
    .required()
    .messages({
      'any.only': 'Hành động phải là enable, disable hoặc reschedule',
      'any.required': 'Hành động là bắt buộc'
    }),
  reminderWindows: Joi.array()
    .items(
      Joi.object({
        window: Joi.string()
          .pattern(/^\d+(h|m)$/)
          .required()
          .messages({
            'string.pattern.base': 'Khung thời gian phải có định dạng như 24h, 2h, 30m'
          }),
        channels: Joi.array()
          .items(Joi.string().valid('SMS', 'EMAIL', 'APP'))
          .min(1)
          .required()
          .messages({
            'array.min': 'Phải có ít nhất 1 kênh thông báo'
          })
      })
    )
    .optional()
});

/**
 * Create queue routes
 */
export function createQueueRoutes(): Router {
  const router = Router();
  const container = getContainer();

  // Initialize controller
  const controller = new QueueController(
    container.getCallNextPatientUseCase(),
    container.getJoinQueueUseCase(),
    container.getLeaveQueueUseCase(),
    container.getQueueStatusUseCase(),
    container.getValidateCancellationPolicyUseCase(),
    container.getManageAppointmentRemindersUseCase()
  );

  /**
   * POST /api/queue/call-next
   * Call next patient in queue
   * 
   * Roles: DOCTOR, NURSE, RECEPTIONIST
   */
  router.post(
    '/call-next',
    authenticate,
    requireRole(['DOCTOR', 'NURSE', 'RECEPTIONIST']),
    validateRequest(callNextPatientSchema, 'body'),
    (req, res) => controller.callNextPatient(req, res)
  );

  /**
   * POST /api/queue/join
   * Join queue
   * 
   * Roles: PATIENT (own), RECEPTIONIST (any)
   */
  router.post(
    '/join',
    authenticate,
    requireRole(['PATIENT', 'RECEPTIONIST']),
    validateRequest(joinQueueSchema, 'body'),
    (req, res) => controller.joinQueue(req, res)
  );

  /**
   * POST /api/queue/leave
   * Leave queue
   * 
   * Roles: PATIENT (own), RECEPTIONIST (any)
   */
  router.post(
    '/leave',
    authenticate,
    validateRequest(leaveQueueSchema, 'body'),
    (req, res) => controller.leaveQueue(req, res)
  );

  /**
   * GET /api/queue/status
   * Get queue status
   * 
   * Query params:
   * - patientId: Get patient's queue status
   * - doctorId: Get doctor's queue status
   */
  router.get(
    '/status',
    authenticate,
    validateRequest(queueStatusSchema, 'query'),
    (req, res) => controller.getQueueStatus(req, res)
  );

  /**
   * GET /api/appointments/:id/cancellation-policy
   * Validate cancellation policy
   */
  router.get(
    '/appointments/:id/cancellation-policy',
    authenticate,
    (req, res) => controller.validateCancellationPolicy(req, res)
  );

  /**
   * POST /api/appointments/:id/reminders
   * Manage appointment reminders
   * 
   * Body:
   * - action: enable | disable | reschedule
   * - reminderWindows: [{ window: "24h", channels: ["SMS", "EMAIL"] }]
   */
  router.post(
    '/appointments/:id/reminders',
    authenticate,
    validateRequest(manageRemindersSchema, 'body'),
    (req, res) => controller.manageReminders(req, res)
  );

  return router;
}

