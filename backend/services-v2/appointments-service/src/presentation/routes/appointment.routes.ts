/**
 * Appointment Routes - Presentation Layer
 * V3 Clean Architecture Implementation
 * REST API routes for appointment management (Commands)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { Router } from 'express';
import { getContainer } from '../../infrastructure/di/container';
import { idempotencyMiddleware } from '../middleware/IdempotencyMiddleware';
import { authenticate, requireRole } from '../middleware/AuthMiddleware';
import { validateRequest } from '../middleware/ValidationMiddleware';
import {
  scheduleAppointmentSchema,
  confirmAppointmentSchema,
  cancelAppointmentSchema,
  getAppointmentSchema,
  listAppointmentsSchema,
} from '../dto/ValidationSchemas';

/**
 * Create appointment command routes
 * Uses DI container for dependency injection
 */
export function createAppointmentRoutes(): Router {
  const router = Router();
  const container = getContainer();
  const controller = container.getAppointmentController();

  // Command Routes (Write Operations) - with auth, validation, and idempotency
  router.post(
    '/appointments',
    authenticate,
    validateRequest(scheduleAppointmentSchema, 'body'),
    idempotencyMiddleware,
    (req, res) => controller.scheduleAppointment(req, res)
  );

  router.post(
    '/appointments/:id/confirm',
    authenticate,
    requireRole(['DOCTOR', 'NURSE', 'ADMIN']),
    validateRequest(confirmAppointmentSchema, 'body'),
    idempotencyMiddleware,
    (req, res) => controller.confirmAppointment(req, res)
  );

  router.post(
    '/appointments/:id/complete',
    authenticate,
    requireRole(['DOCTOR', 'NURSE']),
    idempotencyMiddleware,
    (req, res) => controller.completeAppointment(req, res)
  );

  router.post(
    '/appointments/:id/cancel',
    authenticate,
    validateRequest(cancelAppointmentSchema, 'body'),
    idempotencyMiddleware,
    (req, res) => controller.cancelAppointment(req, res)
  );

  // Utilities
  router.get(
    '/appointments/:id/preview-reminders',
    authenticate,
    (req, res) => controller.previewReminders(req, res)
  );

  // Legacy Query Routes (for backward compatibility)
  // Note: These use write model, not read model
  router.get(
    '/appointments/:id',
    authenticate,
    validateRequest(getAppointmentSchema, 'params'),
    (req, res) => controller.getAppointment(req, res)
  );

  router.get(
    '/appointments',
    authenticate,
    validateRequest(listAppointmentsSchema, 'query'),
    (req, res) => controller.listAppointments(req, res)
  );

  return router;
}

