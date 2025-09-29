/**
 * Scheduling Routes - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * RESTful API routes for appointment scheduling operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */

import { Router } from 'express';
import { SchedulingController } from '../controllers/SchedulingController';
import { validateRequest, rateLimitMiddleware, requestSizeLimitMiddleware, validateContentType } from '../middleware/ValidationMiddleware';
import { scheduleAppointmentSchema, rescheduleAppointmentSchema, checkAvailabilitySchema } from '../dto/ValidationSchemas';
import { ServiceTokens } from '../../infrastructure/di/setup';
import { DIContainer } from '../../../shared/infrastructure/di/container';

/**
 * Create scheduling routes
 */
export function createSchedulingRoutes(container: DIContainer): Router {
  const router = Router();
  
  // Get controller from DI container
  const schedulingController = new SchedulingController(
    container.resolve(ServiceTokens.SCHEDULING_APPLICATION_SERVICE)
  );

  // Apply common middleware
  router.use(rateLimitMiddleware(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
  router.use(requestSizeLimitMiddleware(1024 * 1024)); // 1MB limit
  router.use(validateContentType(['application/json']));

  /**
   * @swagger
   * /api/v1/scheduling/appointments:
   *   post:
   *     summary: Schedule new appointment
   *     description: Create a new appointment with Vietnamese healthcare compliance
   *     tags: [Scheduling]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ScheduleAppointmentRequest'
   *     responses:
   *       201:
   *         description: Appointment scheduled successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ScheduleAppointmentResponse'
   *       400:
   *         description: Invalid request data
   *       409:
   *         description: Appointment conflict
   *       422:
   *         description: Business logic error
   */
  router.post(
    '/appointments',
    validateRequest(scheduleAppointmentSchema, 'body'),
    schedulingController.scheduleAppointment
  );

  /**
   * @swagger
   * /api/v1/scheduling/appointments/{appointmentId}/reschedule:
   *   put:
   *     summary: Reschedule existing appointment
   *     description: Change appointment time with conflict checking
   *     tags: [Scheduling]
   *     parameters:
   *       - in: path
   *         name: appointmentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Appointment ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RescheduleAppointmentRequest'
   *     responses:
   *       200:
   *         description: Appointment rescheduled successfully
   *       404:
   *         description: Appointment not found
   *       409:
   *         description: New time slot conflict
   */
  router.put(
    '/appointments/:appointmentId/reschedule',
    validateRequest(rescheduleAppointmentSchema, 'body'),
    schedulingController.rescheduleAppointment
  );

  /**
   * @swagger
   * /api/v1/scheduling/availability:
   *   get:
   *     summary: Check provider availability
   *     description: Check available time slots for providers or departments
   *     tags: [Scheduling]
   *     parameters:
   *       - in: query
   *         name: providerId
   *         schema:
   *           type: string
   *         description: Provider ID (optional if departmentCode provided)
   *       - in: query
   *         name: departmentCode
   *         schema:
   *           type: string
   *         description: Department code (optional if providerId provided)
   *       - in: query
   *         name: date
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Date to check (YYYY-MM-DD)
   *       - in: query
   *         name: startTime
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start time filter (optional)
   *       - in: query
   *         name: endTime
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End time filter (optional)
   *       - in: query
   *         name: appointmentType
   *         schema:
   *           type: string
   *         description: Type of appointment (optional)
   *       - in: query
   *         name: duration
   *         schema:
   *           type: integer
   *         description: Required duration in minutes (optional)
   *       - in: query
   *         name: includeUnavailable
   *         schema:
   *           type: boolean
   *         description: Include unavailable slots (default: false)
   *     responses:
   *       200:
   *         description: Availability check successful
   *       400:
   *         description: Invalid request parameters
   */
  router.get(
    '/availability',
    validateRequest(checkAvailabilitySchema, 'query'),
    schedulingController.checkAvailability
  );

  /**
   * @swagger
   * /api/v1/scheduling/appointments/{appointmentId}:
   *   get:
   *     summary: Get appointment details
   *     description: Retrieve detailed information about an appointment
   *     tags: [Scheduling]
   *     parameters:
   *       - in: path
   *         name: appointmentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Appointment ID
   *     responses:
   *       200:
   *         description: Appointment details retrieved successfully
   *       404:
   *         description: Appointment not found
   */
  router.get(
    '/appointments/:appointmentId',
    schedulingController.getAppointmentDetails
  );

  /**
   * @swagger
   * /api/v1/scheduling/appointments/{appointmentId}:
   *   delete:
   *     summary: Cancel appointment
   *     description: Cancel an existing appointment
   *     tags: [Scheduling]
   *     parameters:
   *       - in: path
   *         name: appointmentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Appointment ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Cancellation reason
   *                 minLength: 3
   *                 maxLength: 500
   *             required:
   *               - reason
   *     responses:
   *       200:
   *         description: Appointment cancelled successfully
   *       404:
   *         description: Appointment not found
   */
  router.delete(
    '/appointments/:appointmentId',
    schedulingController.cancelAppointment
  );

  /**
   * @swagger
   * /api/v1/scheduling/appointments/{appointmentId}/confirm:
   *   post:
   *     summary: Confirm appointment
   *     description: Confirm an existing appointment
   *     tags: [Scheduling]
   *     parameters:
   *       - in: path
   *         name: appointmentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Appointment ID
   *     responses:
   *       200:
   *         description: Appointment confirmed successfully
   *       404:
   *         description: Appointment not found
   *       422:
   *         description: Appointment cannot be confirmed
   */
  router.post(
    '/appointments/:appointmentId/confirm',
    schedulingController.confirmAppointment
  );

  /**
   * @swagger
   * /api/v1/scheduling/health:
   *   get:
   *     summary: Health check endpoint
   *     description: Check service health status
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 service:
   *                   type: string
   *                   example: scheduling-service
   *                 version:
   *                   type: string
   *                   example: 2.0.0
   */
  router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'scheduling-service',
      version: '2.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  /**
   * @swagger
   * /api/v1/scheduling/metrics:
   *   get:
   *     summary: Service metrics endpoint
   *     description: Get service performance metrics
   *     tags: [Metrics]
   *     responses:
   *       200:
   *         description: Service metrics
   */
  router.get('/metrics', async (req, res) => {
    try {
      const schedulingService = container.resolve(ServiceTokens.SCHEDULING_APPLICATION_SERVICE);
      const metrics = await schedulingService.getServiceMetrics();
      
      res.status(200).json({
        success: true,
        message: 'Service metrics retrieved successfully',
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve service metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

/**
 * Swagger Schema Definitions
 */
export const swaggerSchemas = {
  ScheduleAppointmentRequest: {
    type: 'object',
    required: ['patient', 'provider', 'appointment', 'departmentCode'],
    properties: {
      patient: {
        type: 'object',
        required: ['patientId', 'fullName', 'phone', 'dateOfBirth', 'nationalId'],
        properties: {
          patientId: { type: 'string', pattern: '^PAT-\\d{6}-\\d{3}$' },
          fullName: { type: 'string', minLength: 2, maxLength: 100 },
          phone: { type: 'string', pattern: '^0\\d{9}$' },
          dateOfBirth: { type: 'string', format: 'date' },
          nationalId: { type: 'string', pattern: '^\\d{9}(\\d{3})?$' },
          email: { type: 'string', format: 'email' },
          address: { type: 'string', maxLength: 200 },
          emergencyContact: { type: 'string', pattern: '^0\\d{9}$' },
          insuranceNumber: { type: 'string', pattern: '^[A-Z]{2}\\d{13}$' },
          insuranceType: { type: 'string', enum: ['BHYT', 'BHTN', 'PRIVATE', 'NONE'] }
        }
      },
      provider: {
        type: 'object',
        required: ['providerId'],
        properties: {
          providerId: { type: 'string', pattern: '^[A-Z]{3,4}-DOC-\\d{6}-\\d{3}$' },
          fullName: { type: 'string' },
          specialization: { type: 'string' },
          department: { type: 'string' }
        }
      },
      appointment: {
        type: 'object',
        required: ['appointmentType', 'priority', 'startTime', 'endTime', 'reason', 'estimatedDuration'],
        properties: {
          appointmentType: { 
            type: 'string', 
            enum: ['consultation', 'follow_up', 'emergency', 'surgery', 'diagnostic', 'therapy', 'vaccination', 'checkup', 'prescription', 'referral'] 
          },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent', 'emergency'] },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          roomId: { type: 'string', pattern: '^ROOM-\\d{3}$' },
          reason: { type: 'string', minLength: 3, maxLength: 500 },
          symptoms: { type: 'string', maxLength: 1000 },
          notes: { type: 'string', maxLength: 1000 },
          estimatedDuration: { type: 'integer', minimum: 15, maximum: 480 },
          urgencyLevel: { type: 'string', enum: ['routine', 'urgent', 'emergency'] }
        }
      },
      departmentCode: { type: 'string', pattern: '^[A-Z]{3,4}$' }
    }
  }
};
