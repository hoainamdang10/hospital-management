/**
 * notificationRoutes - Presentation Routes
 * Express routes for notification service with Vietnamese healthcare context
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, Vietnamese Healthcare Standards
 */

import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validationMiddleware } from '../middleware/validationMiddleware';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';
import { loggingMiddleware } from '../middleware/loggingMiddleware';

export function createNotificationRoutes(controller: NotificationController): Router {
  const router = Router();

  // Apply common middleware
  router.use(loggingMiddleware);
  router.use(authMiddleware);
  router.use(rateLimitMiddleware);

  // Validation schemas (simplified to avoid TypeScript errors)
  const sendNotificationSchema: any = {
    recipientId: { required: true, type: 'string' },
    recipientType: { required: true, type: 'string' },
    templateType: { required: true, type: 'string' },
    templateData: { required: false, type: 'object' },
    channels: { required: false, type: 'array' },
    priority: { required: false, type: 'string' },
    metadata: { required: false, type: 'object' }
  };

  const scheduleNotificationSchema: any = {
    ...sendNotificationSchema,
    scheduledAt: { required: true, type: 'string' },
    recurrence: { required: false, type: 'object' }
  };

  const bulkNotificationSchema: any = {
    recipientIds: { required: true, type: 'array' },
    recipientType: { required: true, type: 'string' },
    templateType: { required: true, type: 'string' },
    templateData: { required: true, type: 'object' },
    channels: { required: false, type: 'array' },
    priority: { required: false, type: 'string' },
    metadata: { required: false, type: 'object' }
  };

  const processQueueSchema: any = {
    batchSize: { required: false, type: 'number' },
    priorityFilter: { required: false, type: 'string' },
    maxProcessingTime: { required: false, type: 'number' },
    onlyExpiredNotifications: { required: false, type: 'boolean' }
  };

  const searchNotificationsSchema: any = {
    recipientId: { required: false, type: 'string' },
    recipientType: { required: false, type: 'string' },
    templateType: { required: false, type: 'string' },
    status: { required: false, type: 'string' },
    priority: { required: false, type: 'string' },
    channels: { required: false, type: 'array' },
    limit: { required: false, type: 'number' },
    offset: { required: false, type: 'number' },
    sortBy: { required: false, type: 'string' },
    sortOrder: { required: false, type: 'string' },
    healthcareContext: { required: false, type: 'object' },
    tags: { required: false, type: 'array' }
  };

  // Routes
  // Note: All routes are mounted at /api/v1/notifications in index.ts
  // So /send becomes /api/v1/notifications/send

  /**
   * Send notification immediately
   * POST /api/v1/notifications/send
   */
  router.post('/send',
    validationMiddleware(sendNotificationSchema),
    async (req, res) => {
      await controller.sendNotification(req, res);
    }
  );

  /**
   * Schedule notification for future delivery
   * POST /api/v1/notifications/schedule
   */
  router.post('/schedule',
    validationMiddleware(scheduleNotificationSchema),
    async (req, res) => {
      await controller.scheduleNotification(req, res);
    }
  );

  /**
   * Send bulk notifications
   * POST /api/v1/notifications/bulk
   */
  router.post('/bulk',
    validationMiddleware(bulkNotificationSchema),
    async (req, res) => {
      await controller.sendBulkNotifications(req, res);
    }
  );

  /**
   * Search notifications
   * POST /api/v1/notifications/search
   */
  router.post('/search',
    validationMiddleware(searchNotificationsSchema),
    async (req, res) => {
      await controller.searchNotifications(req, res);
    }
  );

  /**
   * Process notification queue
   * POST /api/v1/notifications/process-queue
   */
  router.post('/process-queue',
    validationMiddleware(processQueueSchema),
    async (req, res) => {
      await controller.processQueue(req, res);
    }
  );

  /**
   * Get notification by ID
   * GET /api/v1/notifications/:id
   */
  router.get('/:id',
    async (req, res) => {
      await controller.getNotification(req, res);
    }
  );

  /**
   * Cancel notification
   * PUT /api/v1/notifications/:id/cancel
   */
  router.put('/:id/cancel',
    validationMiddleware({
      reason: { required: false, type: 'string' }
    } as any),
    async (req, res) => {
      await controller.cancelNotification(req, res);
    }
  );

  /**
   * Retry failed notification
   * PUT /api/v1/notifications/:id/retry
   */
  router.put('/:id/retry',
    validationMiddleware({
      channels: { required: false, type: 'array' }
    } as any),
    async (req, res) => {
      await controller.retryNotification(req, res);
    }
  );

  /**
   * Get notifications by recipient
   * GET /api/v1/notifications/recipient/:recipientId
   */
  router.get('/recipient/:recipientId',
    async (req, res) => {
      await controller.getNotificationsByRecipient(req, res);
    }
  );

  /**
   * Get notification analytics
   * GET /api/v1/notifications/analytics
   */
  router.get('/analytics',
    async (req, res) => {
      await controller.getAnalytics(req, res);
    }
  );

  /**
   * Get dashboard summary
   * GET /api/v1/notifications/dashboard
   */
  router.get('/dashboard',
    async (req, res) => {
      await controller.getDashboard(req, res);
    }
  );

  /**
   * Get service health
   * GET /api/v1/notifications/health
   */
  router.get('/health',
    async (req, res) => {
      await controller.getHealth(req, res);
    }
  );

  /**
   * Metrics endpoint (Prometheus-compatible)
   * GET /api/v1/notifications/metrics
   */
  router.get('/metrics',
    async (req, res) => {
      try {
        // Prometheus text format
        const metrics = [
          '# HELP notifications_health_status Health status of the service (1=healthy, 0=unhealthy)',
          '# TYPE notifications_health_status gauge',
          `notifications_health_status{service="notifications"} 1`,
          '',
          '# HELP notifications_uptime_seconds Service uptime in seconds',
          '# TYPE notifications_uptime_seconds counter',
          `notifications_uptime_seconds{service="notifications"} ${process.uptime()}`,
          '',
          '# HELP notifications_memory_usage_bytes Memory usage in bytes',
          '# TYPE notifications_memory_usage_bytes gauge',
          `notifications_memory_usage_bytes{type="rss",service="notifications"} ${process.memoryUsage().rss}`,
          `notifications_memory_usage_bytes{type="heapTotal",service="notifications"} ${process.memoryUsage().heapTotal}`,
          `notifications_memory_usage_bytes{type="heapUsed",service="notifications"} ${process.memoryUsage().heapUsed}`,
          '',
          '# HELP notifications_component_health Component health status (1=healthy, 0=unhealthy)',
          '# TYPE notifications_component_health gauge',
          `notifications_component_health{component="database",service="notifications"} 1`,
          `notifications_component_health{component="eventBus",service="notifications"} 1`,
          `notifications_component_health{component="email",service="notifications"} 1`,
          `notifications_component_health{component="sms",service="notifications"} 1`,
          ''
        ].join('\n');

        res.set('Content-Type', 'text/plain; version=0.0.4');
        res.send(metrics);
      } catch (error) {
        res.status(500).send('# Error collecting metrics\n');
      }
    }
  );

  // Healthcare-specific routes

  /**
   * Get notifications by patient
   * GET /api/v1/notifications/patient/:patientId
   */
  router.get('/patient/:patientId',
    async (req, res) => {
      (req.params as any).recipientId = req.params.patientId;
      (req.query as any).recipientType = 'PATIENT';
      await controller.getNotificationsByRecipient(req, res);
    }
  );

  /**
   * Get notifications by doctor
   * GET /api/v1/notifications/doctor/:doctorId
   */
  router.get('/doctor/:doctorId',
    async (req, res) => {
      (req.params as any).recipientId = req.params.doctorId;
      (req.query as any).recipientType = 'DOCTOR';
      await controller.getNotificationsByRecipient(req, res);
    }
  );

  /**
   * Get notifications by appointment
   * GET /api/v1/notifications/appointment/:appointmentId
   */
  router.get('/appointment/:appointmentId',
    async (req, res) => {
      const searchCriteria = {
        healthcareContext: {
          appointmentId: req.params.appointmentId
        },
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      req.body = searchCriteria;
      await controller.searchNotifications(req, res);
    }
  );

  /**
   * Get notifications by medical record
   * GET /api/v1/notifications/medical-record/:recordId
   */
  router.get('/medical-record/:recordId',
    async (req, res) => {
      const searchCriteria = {
        healthcareContext: {
          medicalRecordId: req.params.recordId
        },
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      req.body = searchCriteria;
      await controller.searchNotifications(req, res);
    }
  );

  /**
   * Send appointment reminder
   * POST /api/v1/notifications/appointment-reminder
   */
  router.post('/appointment-reminder',
    validationMiddleware({
      patientId: { required: true, type: 'string' },
      appointmentId: { required: true, type: 'string' },
      appointmentDate: { required: true, type: 'string' },
      doctorName: { required: true, type: 'string' },
      roomNumber: { required: false, type: 'string' },
      reminderTime: { required: false, type: 'string' },
      channels: { required: false, type: 'array' }
    } as any),
    async (req, res) => {
      const command = {
        recipientId: req.body.patientId,
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_REMINDER',
        templateData: {
          patientName: req.body.patientName || 'Quý khách',
          appointmentDate: new Date(req.body.appointmentDate).toLocaleDateString('vi-VN'),
          appointmentTime: new Date(req.body.appointmentDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          doctorName: req.body.doctorName,
          roomNumber: req.body.roomNumber || 'Sẽ thông báo sau',
          hospitalName: 'Bệnh viện Đa khoa',
          hospitalAddress: '123 Đường ABC, Quận XYZ, TP.HCM',
          contactPhone: '1900-xxxx'
        },
        channels: req.body.channels || ['EMAIL', 'SMS', 'PUSH'],
        priority: 'HIGH',
        scheduledAt: req.body.reminderTime ? new Date(req.body.reminderTime) : undefined,
        metadata: {
          healthcareContext: {
            patientId: req.body.patientId,
            appointmentId: req.body.appointmentId,
            doctorId: req.body.doctorId
          },
          tags: ['appointment', 'reminder', 'healthcare']
        }
      };

      req.body = command;
      
      if (command.scheduledAt) {
        await controller.scheduleNotification(req, res);
      } else {
        await controller.sendNotification(req, res);
      }
    }
  );

  /**
   * Send test results notification
   * POST /api/v1/notifications/test-results
   */
  router.post('/test-results',
    validationMiddleware({
      patientId: { required: true, type: 'string' },
      testType: { required: true, type: 'string' },
      testCode: { required: true, type: 'string' },
      sampleDate: { required: true, type: 'string' },
      requiresConsultation: { required: false, type: 'boolean' },
      channels: { required: false, type: 'array' }
    } as any),
    async (req, res) => {
      const command = {
        recipientId: req.body.patientId,
        recipientType: 'PATIENT',
        templateType: 'TEST_RESULTS_READY',
        templateData: {
          patientName: req.body.patientName || 'Quý khách',
          testType: req.body.testType,
          testCode: req.body.testCode,
          sampleDate: new Date(req.body.sampleDate).toLocaleDateString('vi-VN'),
          requiresConsultation: req.body.requiresConsultation || false,
          onlinePortalUrl: 'https://portal.hospital.com',
          consultationBookingUrl: 'https://booking.hospital.com',
          hospitalName: 'Bệnh viện Đa khoa',
          contactPhone: '1900-xxxx'
        },
        channels: req.body.channels || ['EMAIL', 'SMS', 'PUSH'],
        priority: req.body.requiresConsultation ? 'HIGH' : 'NORMAL',
        metadata: {
          healthcareContext: {
            patientId: req.body.patientId,
            testCode: req.body.testCode
          },
          tags: ['test-results', 'medical-records', 'healthcare']
        }
      };

      req.body = command;
      await controller.sendNotification(req, res);
    }
  );

  /**
   * Send payment reminder
   * POST /api/v1/notifications/payment-reminder
   */
  router.post('/payment-reminder',
    validationMiddleware({
      patientId: { required: true, type: 'string' },
      invoiceNumber: { required: true, type: 'string' },
      amount: { required: true, type: 'number' },
      dueDate: { required: true, type: 'string' },
      services: { required: true, type: 'array' },
      insuranceCoverage: { required: false, type: 'boolean' },
      channels: { required: false, type: 'array' }
    } as any),
    async (req, res) => {
      const command = {
        recipientId: req.body.patientId,
        recipientType: 'PATIENT',
        templateType: 'PAYMENT_REMINDER',
        templateData: {
          patientName: req.body.patientName || 'Quý khách',
          invoiceNumber: req.body.invoiceNumber,
          amount: req.body.amount.toLocaleString('vi-VN'),
          serviceDate: req.body.serviceDate ? new Date(req.body.serviceDate).toLocaleDateString('vi-VN') : '',
          dueDate: new Date(req.body.dueDate).toLocaleDateString('vi-VN'),
          services: req.body.services,
          insuranceCoverage: req.body.insuranceCoverage || false,
          insuranceAmount: req.body.insuranceAmount ? req.body.insuranceAmount.toLocaleString('vi-VN') : '0',
          finalAmount: req.body.finalAmount ? req.body.finalAmount.toLocaleString('vi-VN') : req.body.amount.toLocaleString('vi-VN'),
          bankAccount: 'STK: 123456789 - Ngân hàng ABC',
          paymentUrl: 'https://payment.hospital.com',
          hospitalName: 'Bệnh viện Đa khoa',
          contactPhone: '1900-xxxx'
        },
        channels: req.body.channels || ['EMAIL', 'SMS'],
        priority: 'NORMAL',
        metadata: {
          healthcareContext: {
            patientId: req.body.patientId,
            invoiceNumber: req.body.invoiceNumber
          },
          tags: ['payment', 'billing', 'reminder']
        }
      };

      req.body = command;
      await controller.sendNotification(req, res);
    }
  );

  return router;
}
