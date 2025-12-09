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
  rescheduleAppointmentSchema,
} from '../dto/ValidationSchemas';
import Joi from 'joi';

/**
 * Create appointment command routes
 * Uses DI container for dependency injection
 */
export function createAppointmentRoutes(): Router {
  const router = Router();
  const container = getContainer();
  const controller = container.getAppointmentController();

  // Command Routes (Write Operations) - with auth, validation, and idempotency

  // Simplified booking endpoint for patient self-service (MVP)
  // Minimal validation - patient enters own info
  router.post(
    '/appointments/book',
    authenticate,
    idempotencyMiddleware,
    (req, res) => controller.scheduleAppointmentSimplified(req, res)
  );

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

  // Phase 1: Critical Use Cases
  router.post(
    '/appointments/:id/reschedule',
    authenticate,
    validateRequest(rescheduleAppointmentSchema, 'body'),
    idempotencyMiddleware,
    (req, res) => controller.rescheduleAppointment(req, res)
  );

  router.post(
    '/appointments/:id/no-show',
    authenticate,
    requireRole(['RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN']),
    idempotencyMiddleware,
    (req, res) => controller.markAsNoShow(req, res)
  );

  router.post(
    '/appointments/:id/start',
    authenticate,
    requireRole(['DOCTOR']),
    idempotencyMiddleware,
    (req, res) => controller.startAppointment(req, res)
  );

  // Phase 3: Nice-to-Have Features
  // ===== ARCHIVED FOR POST-MVP: BulkReschedule Route =====
  // router.post(
  //   '/appointments/bulk-reschedule',
  //   authenticate,
  //   requireRole(['ADMIN', 'DOCTOR']),
  //   idempotencyMiddleware,
  //   (req, res) => controller.bulkRescheduleAppointments(req, res)
  // );

  router.get(
    '/appointments/history',
    authenticate,
    (req, res) => controller.getAppointmentHistory(req, res)
  );

  router.get(
    '/appointments/statistics',
    authenticate,
    requireRole(['ADMIN', 'DOCTOR']),
    (req, res) => controller.getAppointmentStatistics(req, res)
  );

  router.post(
    '/appointments/emergency',
    authenticate,
    requireRole(['DOCTOR', 'NURSE', 'ADMIN']),
    idempotencyMiddleware,
    (req, res) => controller.createEmergencyAppointment(req, res)
  );

  router.post(
    '/appointments/:id/transfer',
    authenticate,
    requireRole(['ADMIN', 'DOCTOR']),
    idempotencyMiddleware,
    (req, res) => controller.transferAppointment(req, res)
  );

  // Recurring appointments
  router.post(
    '/appointments/recurring',
    authenticate,
    requireRole(['ADMIN', 'DOCTOR']),
    idempotencyMiddleware,
    (req, res) => controller.createRecurringAppointmentSeries(req, res)
  );

  // Utilities
  router.get(
    '/appointments/:id/preview-reminders',
    authenticate,
    (req, res) => controller.previewReminders(req, res)
  );

  // Legacy Query Routes (for backward compatibility)
  // Note: These use write model, not read model
  // RESTORED TO USE FALLBACK MECHANISM IN USE CASE
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

