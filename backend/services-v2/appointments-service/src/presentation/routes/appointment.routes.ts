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

/**
 * Create appointment command routes
 * Uses DI container for dependency injection
 */
export function createAppointmentRoutes(): Router {
  const router = Router();
  const container = getContainer();
  const controller = container.getAppointmentController();

  // Command Routes (Write Operations) - with idempotency protection
  router.post('/appointments', idempotencyMiddleware, (req, res) => controller.scheduleAppointment(req, res));
  router.post('/appointments/:id/confirm', idempotencyMiddleware, (req, res) => controller.confirmAppointment(req, res));
  router.post('/appointments/:id/complete', idempotencyMiddleware, (req, res) => controller.completeAppointment(req, res));
  router.post('/appointments/:id/cancel', idempotencyMiddleware, (req, res) => controller.cancelAppointment(req, res));

  // Utilities
  router.get('/appointments/:id/preview-reminders', (req, res) => controller.previewReminders(req, res));

  // Legacy Query Routes (for backward compatibility)
  // Note: These use write model, not read model
  router.get('/appointments/:id', (req, res) => controller.getAppointment(req, res));
  router.get('/appointments', (req, res) => controller.listAppointments(req, res));

  return router;
}

