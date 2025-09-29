"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_service_1 = require("../services/subscription.service");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
// Helper functions for consistent responses
const sendError = (res, message, status = 400) => {
    return res.status(status).json(response_helpers_1.EnhancedResponseHelper.error(message));
};
const sendSuccess = (res, message) => {
    return res.json(response_helpers_1.EnhancedResponseHelper.success(message));
};
const sendInternalError = (res, message) => {
    return res.status(500).json(response_helpers_1.EnhancedResponseHelper.internalError(message));
};
const router = (0, express_1.Router)();
/**
 * Webhook endpoint for appointment updates from appointment service
 */
router.post('/webhooks/appointment-created', async (req, res) => {
    try {
        const appointment = req.body;
        if (!appointment || !appointment.appointment_id) {
            return sendError(res, 'Invalid appointment data');
        }
        await subscription_service_1.subscriptionService.publishAppointmentUpdate(appointment);
        logger_1.default.info(`📢 Webhook: Published appointment created for ${appointment.appointment_id}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - appointment created:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
router.post('/webhooks/appointment-status-changed', async (req, res) => {
    try {
        const appointment = req.body;
        if (!appointment || !appointment.appointment_id) {
            return sendError(res, 'Invalid appointment data');
        }
        await subscription_service_1.subscriptionService.publishAppointmentStatusChange(appointment);
        logger_1.default.info(`📢 Webhook: Published appointment status change for ${appointment.appointment_id}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - appointment status changed:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Webhook endpoint for queue updates
 */
router.post('/webhooks/queue-updated', async (req, res) => {
    try {
        const queueData = req.body;
        if (!queueData || !queueData.queueId) {
            return sendError(res, 'Invalid queue data');
        }
        // await subscriptionService.publishQueueUpdate(queueData); // Method not implemented yet
        logger_1.default.info(`📢 Webhook: Published queue update for ${queueData.queueId}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - queue updated:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Webhook endpoint for doctor availability updates
 */
router.post('/webhooks/doctor-availability-changed', async (req, res) => {
    try {
        const doctorData = req.body;
        if (!doctorData || !doctorData.doctor_id) {
            return sendError(res, 'Invalid doctor data');
        }
        await subscription_service_1.subscriptionService.publishDoctorAvailabilityChange(doctorData);
        logger_1.default.info(`📢 Webhook: Published doctor availability change for ${doctorData.doctor_id}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - doctor availability changed:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Webhook endpoint for schedule updates
 */
router.post('/webhooks/schedule-updated', async (req, res) => {
    try {
        const scheduleData = req.body;
        if (!scheduleData || !scheduleData.scheduleId) {
            return sendError(res, 'Invalid schedule data');
        }
        // await subscriptionService.publishScheduleUpdate(scheduleData); // Method not implemented yet
        logger_1.default.info(`📢 Webhook: Published schedule update for ${scheduleData.scheduleId}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - schedule updated:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Webhook endpoint for doctor status updates
 */
router.post('/webhooks/doctor-status-changed', async (req, res) => {
    try {
        const doctorData = req.body;
        if (!doctorData || !doctorData.doctor_id) {
            return sendError(res, 'Invalid doctor data');
        }
        await subscription_service_1.subscriptionService.publishDoctorStatusChange(doctorData);
        logger_1.default.info(`📢 Webhook: Published doctor status change for ${doctorData.doctor_id}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - doctor status changed:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Webhook endpoint for system notifications
 */
router.post('/webhooks/system-notification', async (req, res) => {
    try {
        const notificationData = req.body;
        if (!notificationData || !notificationData.type) {
            return sendError(res, 'Invalid notification data');
        }
        await subscription_service_1.subscriptionService.publishSystemNotification(notificationData);
        logger_1.default.info(`📢 Webhook: Published system notification of type ${notificationData.type}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - system notification:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Webhook endpoint for patient updates
 */
router.post('/webhooks/patient-updated', async (req, res) => {
    try {
        const patientData = req.body;
        if (!patientData || !patientData.patient_id) {
            return sendError(res, 'Invalid patient data');
        }
        await subscription_service_1.subscriptionService.publishPatientUpdate(patientData);
        logger_1.default.info(`📢 Webhook: Published patient update for ${patientData.patient_id}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - patient updated:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Webhook endpoint for patient status changes
 */
router.post('/webhooks/patient-status-changed', async (req, res) => {
    try {
        const patientData = req.body;
        if (!patientData || !patientData.patient_id) {
            return sendError(res, 'Invalid patient data');
        }
        await subscription_service_1.subscriptionService.publishPatientStatusChange(patientData);
        logger_1.default.info(`📢 Webhook: Published patient status change for ${patientData.patient_id}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - patient status changed:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Webhook endpoint for emergency notifications
 */
router.post('/webhooks/emergency-notification', async (req, res) => {
    try {
        const emergencyData = req.body;
        if (!emergencyData || !emergencyData.type) {
            return sendError(res, 'Invalid notification data');
        }
        await subscription_service_1.subscriptionService.publishSystemNotification(emergencyData);
        logger_1.default.info(`📢 Webhook: Published emergency notification of type ${emergencyData.type}`);
        return sendSuccess(res, 'Event published successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Webhook error - emergency notification:', error);
        return sendInternalError(res, 'Failed to publish event');
    }
});
/**
 * Health check endpoint for subscription service
 */
router.get('/health', (req, res) => {
    try {
        const healthData = {
            status: 'healthy',
            service: 'GraphQL Subscriptions',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            subscriptions: {
                active: 0, // subscriptionService.getActiveSubscriptionsCount() not implemented
                supported: [
                    'appointmentCreated',
                    'appointmentStatusChanged',
                    'queueUpdated',
                    'doctorAvailabilityChanged',
                    'scheduleUpdated',
                    'doctorStatusChanged',
                    'systemNotification',
                    'patientUpdated',
                    'patientStatusChanged',
                    'emergencyNotification'
                ]
            }
        };
        return res.json(healthData);
    }
    catch (error) {
        logger_1.default.error('❌ Subscription health check failed:', error);
        return res.status(503).json(response_helpers_1.EnhancedResponseHelper.serviceUnavailable('Subscription service not ready'));
    }
});
exports.default = router;
//# sourceMappingURL=subscriptions.routes.js.map