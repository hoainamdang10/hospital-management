/**
 * Appointment Query Routes - Presentation Layer
 * REST API routes for appointment queries (CQRS Read Model)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, CQRS, REST API
 */

import { Router } from 'express';
import { getContainer } from '../../infrastructure/di/container';
import { authenticate } from '../middleware/AuthMiddleware';

/**
 * Create appointment query routes
 * Uses DI container for dependency injection
 */
export function createAppointmentQueryRoutes(): Router {
  const router = Router();
  const container = getContainer();
  const controller = container.getAppointmentQueryController();

  /**
   * GET /api/v1/appointments/:id
   * Get appointment details with patient/doctor info (Read Model)
   */
  router.get(
    '/appointments/:id',
    authenticate,
    (req, res) => controller.getAppointmentDetails(req, res)
  );

  /**
   * GET /api/v1/appointments
   * List appointments with filters and pagination (Read Model)
   */
  router.get(
    '/appointments',
    authenticate,
    (req, res) => controller.listAppointments(req, res)
  );

  /**
   * GET /api/v1/patients/:patientId/appointments
   * Get appointments for a specific patient (Read Model)
   */
  router.get(
    '/patients/:patientId/appointments',
    authenticate,
    (req, res) => controller.getPatientAppointments(req, res)
  );

  /**
   * GET /api/v1/doctors/:doctorId/appointments
   * Get appointments for a specific doctor (Read Model)
   */
  router.get(
    '/doctors/:doctorId/appointments',
    authenticate,
    (req, res) => controller.getDoctorAppointments(req, res)
  );

  return router;
}

