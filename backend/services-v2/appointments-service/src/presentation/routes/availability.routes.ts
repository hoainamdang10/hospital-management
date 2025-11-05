/**
 * Availability Routes - Presentation Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * Routes for provider availability queries
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */

import { Router } from 'express';
import { getContainer } from '../../infrastructure/di/container';
import { authenticate } from '../middleware/AuthMiddleware';
import { validateRequest } from '../middleware/ValidationMiddleware';
import Joi from 'joi';

/**
 * Validation schemas for availability routes
 */
const availableSlotsSchema = Joi.object({
  date: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Ngày không hợp lệ',
      'date.min': 'Ngày phải trong tương lai',
      'any.required': 'Ngày là bắt buộc'
    }),
  duration: Joi.number()
    .integer()
    .min(15)
    .max(120)
    .default(30)
    .messages({
      'number.base': 'Thời lượng phải là số',
      'number.min': 'Thời lượng tối thiểu 15 phút',
      'number.max': 'Thời lượng tối đa 120 phút'
    })
});

const providerIdSchema = Joi.object({
  providerId: Joi.string()
    .pattern(/^DEPT-DOC-\d{6}-\d{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mã bác sĩ không đúng định dạng (DEPT-DOC-YYYYMM-XXX)',
      'any.required': 'Mã bác sĩ là bắt buộc'
    })
});

/**
 * Create availability routes
 * Uses DI container for dependency injection
 *
 * Routes:
 * - GET /api/v1/appointments/providers/:providerId/available-slots
 * - GET /api/v1/appointments/providers/:providerId/schedule
 */
export function createAvailabilityRoutes(): Router {
  const router = Router();
  const container = getContainer();

  // Get AvailabilityController from DI container
  const availabilityController = container.getAvailabilityController();

  /**
   * GET /api/v1/appointments/providers/:providerId/available-slots
   *
   * Get available time slots for provider on specific date
   *
   * Query params:
   * - date: YYYY-MM-DD (required)
   * - duration: number in minutes (optional, default: 30)
   *
   * Example: GET /api/v1/appointments/providers/DEPT-DOC-202510-001/available-slots?date=2025-10-24&duration=30
   */
  router.get(
    '/providers/:providerId/available-slots',
    authenticate,
    validateRequest(providerIdSchema, 'params'),
    validateRequest(availableSlotsSchema, 'query'),
    (req, res) => availabilityController.getAvailableTimeSlots(req, res)
  );

  /**
   * GET /api/appointments/providers/:providerId/schedule
   *
   * Get cached work schedule template for provider
   *
   * Example: GET /api/appointments/providers/DEPT-DOC-202510-001/schedule
   */
  router.get(
    '/providers/:providerId/schedule',
    authenticate,
    validateRequest(providerIdSchema, 'params'),
    (req, res) => availabilityController.getProviderSchedule(req, res)
  );

  return router;
}
