"use strict";
/**
 * notificationRoutes - Presentation Routes
 * Express routes for notification service with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationRoutes = createNotificationRoutes;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const rateLimitMiddleware_1 = require("../middleware/rateLimitMiddleware");
const loggingMiddleware_1 = require("../middleware/loggingMiddleware");
function createNotificationRoutes(controller) {
    const router = (0, express_1.Router)();
    // Apply common middleware
    router.use(loggingMiddleware_1.loggingMiddleware);
    router.use(authMiddleware_1.authMiddleware);
    router.use(rateLimitMiddleware_1.rateLimitMiddleware);
    // Validation schemas
    const sendNotificationSchema = {
        recipientId: { required: true, type: 'string', minLength: 1 },
        recipientType: { required: true, type: 'string', enum: ['PATIENT', 'DOCTOR', 'STAFF', 'FAMILY'] },
        templateType: { required: true, type: 'string', minLength: 1 },
        templateData: { required: false, type: 'object' },
        channels: { required: false, type: 'array', items: { type: 'string', enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE'] } },
        priority: { required: false, type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        scheduledAt: { required: false, type: 'string', format: 'date-time' },
        expiresAt: { required: false, type: 'string', format: 'date-time' },
        metadata: { required: false, type: 'object' }
    };
    const scheduleNotificationSchema = {
        ...sendNotificationSchema,
        scheduledAt: { required: true, type: 'string', format: 'date-time' },
        recurrence: {
            required: false,
            type: 'object',
            properties: {
                pattern: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY'] },
                interval: { type: 'number', minimum: 1 },
                endDate: { type: 'string', format: 'date-time' },
                maxOccurrences: { type: 'number', minimum: 1 }
            }
        }
    };
    const bulkNotificationSchema = {
        recipientIds: { required: true, type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 1000 },
        recipientType: { required: true, type: 'string', enum: ['PATIENT', 'DOCTOR', 'STAFF', 'FAMILY'] },
        templateType: { required: true, type: 'string', minLength: 1 },
        templateData: { required: true, type: 'object' },
        channels: { required: false, type: 'array', items: { type: 'string', enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE'] } },
        priority: { required: false, type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        scheduledAt: { required: false, type: 'string', format: 'date-time' },
        expiresAt: { required: false, type: 'string', format: 'date-time' },
        metadata: { required: false, type: 'object' }
    };
    const processQueueSchema = {
        batchSize: { required: false, type: 'number', minimum: 1, maximum: 1000 },
        priorityFilter: { required: false, type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        maxProcessingTime: { required: false, type: 'number', minimum: 1000, maximum: 3600000 },
        onlyExpiredNotifications: { required: false, type: 'boolean' }
    };
    const searchNotificationsSchema = {
        recipientId: { required: false, type: 'string' },
        recipientType: { required: false, type: 'string', enum: ['PATIENT', 'DOCTOR', 'STAFF', 'FAMILY'] },
        templateType: { required: false, type: 'string' },
        status: { required: false, type: 'string', enum: ['DRAFT', 'SCHEDULED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED', 'EXPIRED'] },
        priority: { required: false, type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        channels: { required: false, type: 'array', items: { type: 'string' } },
        scheduledAfter: { required: false, type: 'string', format: 'date-time' },
        scheduledBefore: { required: false, type: 'string', format: 'date-time' },
        createdAfter: { required: false, type: 'string', format: 'date-time' },
        createdBefore: { required: false, type: 'string', format: 'date-time' },
        limit: { required: false, type: 'number', minimum: 1, maximum: 1000 },
        offset: { required: false, type: 'number', minimum: 0 },
        sortBy: { required: false, type: 'string', enum: ['createdAt', 'scheduledAt', 'priority', 'status'] },
        sortOrder: { required: false, type: 'string', enum: ['ASC', 'DESC'] },
        healthcareContext: {
            required: false,
            type: 'object',
            properties: {
                patientId: { type: 'string' },
                doctorId: { type: 'string' },
                appointmentId: { type: 'string' },
                medicalRecordId: { type: 'string' }
            }
        },
        tags: { required: false, type: 'array', items: { type: 'string' } }
    };
    // Routes
    /**
     * Send notification immediately
     * POST /api/v1/notifications/send
     */
    router.post('/send', (0, validationMiddleware_1.validationMiddleware)(sendNotificationSchema), async (req, res) => {
        await controller.sendNotification(req, res);
    });
    /**
     * Schedule notification for future delivery
     * POST /api/v1/notifications/schedule
     */
    router.post('/schedule', (0, validationMiddleware_1.validationMiddleware)(scheduleNotificationSchema), async (req, res) => {
        await controller.scheduleNotification(req, res);
    });
    /**
     * Send bulk notifications
     * POST /api/v1/notifications/bulk
     */
    router.post('/bulk', (0, validationMiddleware_1.validationMiddleware)(bulkNotificationSchema), async (req, res) => {
        await controller.sendBulkNotifications(req, res);
    });
    /**
     * Search notifications
     * POST /api/v1/notifications/search
     */
    router.post('/search', (0, validationMiddleware_1.validationMiddleware)(searchNotificationsSchema), async (req, res) => {
        await controller.searchNotifications(req, res);
    });
    /**
     * Process notification queue
     * POST /api/v1/notifications/process-queue
     */
    router.post('/process-queue', (0, validationMiddleware_1.validationMiddleware)(processQueueSchema), async (req, res) => {
        await controller.processQueue(req, res);
    });
    /**
     * Get notification by ID
     * GET /api/v1/notifications/:id
     */
    router.get('/:id', async (req, res) => {
        await controller.getNotification(req, res);
    });
    /**
     * Cancel notification
     * PUT /api/v1/notifications/:id/cancel
     */
    router.put('/:id/cancel', (0, validationMiddleware_1.validationMiddleware)({
        reason: { required: false, type: 'string', maxLength: 500 }
    }), async (req, res) => {
        await controller.cancelNotification(req, res);
    });
    /**
     * Retry failed notification
     * PUT /api/v1/notifications/:id/retry
     */
    router.put('/:id/retry', (0, validationMiddleware_1.validationMiddleware)({
        channels: { required: false, type: 'array', items: { type: 'string', enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE'] } }
    }), async (req, res) => {
        await controller.retryNotification(req, res);
    });
    /**
     * Get notifications by recipient
     * GET /api/v1/notifications/recipient/:recipientId
     */
    router.get('/recipient/:recipientId', async (req, res) => {
        await controller.getNotificationsByRecipient(req, res);
    });
    /**
     * Get notification analytics
     * GET /api/v1/notifications/analytics
     */
    router.get('/analytics', async (req, res) => {
        await controller.getAnalytics(req, res);
    });
    /**
     * Get dashboard summary
     * GET /api/v1/notifications/dashboard
     */
    router.get('/dashboard', async (req, res) => {
        await controller.getDashboard(req, res);
    });
    /**
     * Get service health
     * GET /api/v1/notifications/health
     */
    router.get('/health', async (req, res) => {
        await controller.getHealth(req, res);
    });
    // Healthcare-specific routes
    /**
     * Get notifications by patient
     * GET /api/v1/notifications/patient/:patientId
     */
    router.get('/patient/:patientId', async (req, res) => {
        req.params.recipientId = req.params.patientId;
        req.query.recipientType = 'PATIENT';
        await controller.getNotificationsByRecipient(req, res);
    });
    /**
     * Get notifications by doctor
     * GET /api/v1/notifications/doctor/:doctorId
     */
    router.get('/doctor/:doctorId', async (req, res) => {
        req.params.recipientId = req.params.doctorId;
        req.query.recipientType = 'DOCTOR';
        await controller.getNotificationsByRecipient(req, res);
    });
    /**
     * Get notifications by appointment
     * GET /api/v1/notifications/appointment/:appointmentId
     */
    router.get('/appointment/:appointmentId', async (req, res) => {
        const searchCriteria = {
            healthcareContext: {
                appointmentId: req.params.appointmentId
            },
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
            sortBy: 'createdAt',
            sortOrder: 'DESC'
        };
        req.body = searchCriteria;
        await controller.searchNotifications(req, res);
    });
    /**
     * Get notifications by medical record
     * GET /api/v1/notifications/medical-record/:recordId
     */
    router.get('/medical-record/:recordId', async (req, res) => {
        const searchCriteria = {
            healthcareContext: {
                medicalRecordId: req.params.recordId
            },
            limit: parseInt(req.query.limit) || 20,
            offset: parseInt(req.query.offset) || 0,
            sortBy: 'createdAt',
            sortOrder: 'DESC'
        };
        req.body = searchCriteria;
        await controller.searchNotifications(req, res);
    });
    /**
     * Send appointment reminder
     * POST /api/v1/notifications/appointment-reminder
     */
    router.post('/appointment-reminder', (0, validationMiddleware_1.validationMiddleware)({
        patientId: { required: true, type: 'string' },
        appointmentId: { required: true, type: 'string' },
        appointmentDate: { required: true, type: 'string', format: 'date-time' },
        doctorName: { required: true, type: 'string' },
        roomNumber: { required: false, type: 'string' },
        reminderTime: { required: false, type: 'string', format: 'date-time' },
        channels: { required: false, type: 'array', items: { type: 'string' } }
    }), async (req, res) => {
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
        }
        else {
            await controller.sendNotification(req, res);
        }
    });
    /**
     * Send test results notification
     * POST /api/v1/notifications/test-results
     */
    router.post('/test-results', (0, validationMiddleware_1.validationMiddleware)({
        patientId: { required: true, type: 'string' },
        testType: { required: true, type: 'string' },
        testCode: { required: true, type: 'string' },
        sampleDate: { required: true, type: 'string', format: 'date' },
        requiresConsultation: { required: false, type: 'boolean' },
        channels: { required: false, type: 'array', items: { type: 'string' } }
    }), async (req, res) => {
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
    });
    /**
     * Send payment reminder
     * POST /api/v1/notifications/payment-reminder
     */
    router.post('/payment-reminder', (0, validationMiddleware_1.validationMiddleware)({
        patientId: { required: true, type: 'string' },
        invoiceNumber: { required: true, type: 'string' },
        amount: { required: true, type: 'number', minimum: 0 },
        dueDate: { required: true, type: 'string', format: 'date' },
        services: { required: true, type: 'array', items: { type: 'object' } },
        insuranceCoverage: { required: false, type: 'boolean' },
        channels: { required: false, type: 'array', items: { type: 'string' } }
    }), async (req, res) => {
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
    });
    return router;
}
//# sourceMappingURL=notificationRoutes.js.map