"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.SubscriptionEvents = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
// Subscription event types
var SubscriptionEvents;
(function (SubscriptionEvents) {
    // Appointment events
    SubscriptionEvents["APPOINTMENT_UPDATED"] = "APPOINTMENT_UPDATED";
    SubscriptionEvents["APPOINTMENT_STATUS_CHANGED"] = "APPOINTMENT_STATUS_CHANGED";
    SubscriptionEvents["DOCTOR_APPOINTMENT_UPDATED"] = "DOCTOR_APPOINTMENT_UPDATED";
    SubscriptionEvents["PATIENT_APPOINTMENT_UPDATED"] = "PATIENT_APPOINTMENT_UPDATED";
    SubscriptionEvents["NEW_APPOINTMENT_CREATED"] = "NEW_APPOINTMENT_CREATED";
    SubscriptionEvents["WAITING_QUEUE_UPDATED"] = "WAITING_QUEUE_UPDATED";
    SubscriptionEvents["APPOINTMENT_REMINDER"] = "APPOINTMENT_REMINDER";
    // Doctor events
    SubscriptionEvents["DOCTOR_STATUS_CHANGED"] = "DOCTOR_STATUS_CHANGED";
    SubscriptionEvents["DOCTOR_SCHEDULE_CHANGED"] = "DOCTOR_SCHEDULE_CHANGED";
    SubscriptionEvents["DOCTOR_AVAILABILITY_CHANGED"] = "DOCTOR_AVAILABILITY_CHANGED";
    SubscriptionEvents["DOCTOR_NOTIFICATION"] = "DOCTOR_NOTIFICATION";
    SubscriptionEvents["DOCTOR_REVIEW_ADDED"] = "DOCTOR_REVIEW_ADDED";
    SubscriptionEvents["DOCTOR_SHIFT_CHANGED"] = "DOCTOR_SHIFT_CHANGED";
    SubscriptionEvents["DOCTOR_WORKLOAD_UPDATED"] = "DOCTOR_WORKLOAD_UPDATED";
    // Patient events
    SubscriptionEvents["PATIENT_STATUS_CHANGED"] = "PATIENT_STATUS_CHANGED";
    SubscriptionEvents["PATIENT_UPDATED"] = "PATIENT_UPDATED";
    SubscriptionEvents["PATIENT_MEDICAL_RECORD_ADDED"] = "PATIENT_MEDICAL_RECORD_ADDED";
    SubscriptionEvents["PATIENT_PRESCRIPTION_ADDED"] = "PATIENT_PRESCRIPTION_ADDED";
    SubscriptionEvents["PATIENT_VITAL_SIGNS_UPDATED"] = "PATIENT_VITAL_SIGNS_UPDATED";
    SubscriptionEvents["PATIENT_LAB_RESULT_ADDED"] = "PATIENT_LAB_RESULT_ADDED";
    SubscriptionEvents["PATIENT_NOTIFICATION"] = "PATIENT_NOTIFICATION";
    SubscriptionEvents["PATIENT_QUEUE_STATUS"] = "PATIENT_QUEUE_STATUS";
    // Department events
    SubscriptionEvents["DEPARTMENT_UPDATED"] = "DEPARTMENT_UPDATED";
    SubscriptionEvents["DEPARTMENT_STATS_UPDATED"] = "DEPARTMENT_STATS_UPDATED";
    SubscriptionEvents["ROOM_AVAILABILITY_CHANGED"] = "ROOM_AVAILABILITY_CHANGED";
    SubscriptionEvents["EQUIPMENT_STATUS_CHANGED"] = "EQUIPMENT_STATUS_CHANGED";
    // System events
    SubscriptionEvents["SYSTEM_NOTIFICATION"] = "SYSTEM_NOTIFICATION";
    SubscriptionEvents["GLOBAL_UPDATE"] = "GLOBAL_UPDATE";
})(SubscriptionEvents || (exports.SubscriptionEvents = SubscriptionEvents = {}));
class SubscriptionService {
    constructor() {
        this.isInitialized = false;
        this.pubsub = new graphql_subscriptions_1.PubSub();
    }
    /**
     * Initialize the subscription service
     */
    async initialize() {
        try {
            logger_1.default.info('🔄 Initializing Subscription Service...');
            // Setup event listeners for microservice events
            this.setupEventListeners();
            this.isInitialized = true;
            logger_1.default.info('✅ Subscription Service initialized successfully');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to initialize Subscription Service:', error);
            throw error;
        }
    }
    /**
     * Setup event listeners for microservice events
     */
    setupEventListeners() {
        // This would typically listen to message queues or webhooks from microservices
        // For now, we'll provide methods for microservices to call directly
        logger_1.default.info('📡 Setting up event listeners for microservice events');
    }
    /**
     * Publish appointment update event
     */
    async publishAppointmentUpdate(appointment) {
        try {
            await this.pubsub.publish(SubscriptionEvents.APPOINTMENT_UPDATED, {
                appointmentUpdated: appointment
            });
            // Also publish to doctor-specific channel
            if (appointment.doctor_id) {
                await this.pubsub.publish(SubscriptionEvents.DOCTOR_APPOINTMENT_UPDATED, {
                    doctorAppointmentUpdated: appointment
                });
            }
            // Also publish to patient-specific channel
            if (appointment.patient_id) {
                await this.pubsub.publish(SubscriptionEvents.PATIENT_APPOINTMENT_UPDATED, {
                    patientAppointmentUpdated: appointment
                });
            }
            logger_1.default.info(`📢 Published appointment update: ${appointment.appointment_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish appointment update:', error);
        }
    }
    /**
     * Publish appointment status change event
     */
    async publishAppointmentStatusChange(appointment) {
        try {
            await this.pubsub.publish(SubscriptionEvents.APPOINTMENT_STATUS_CHANGED, {
                appointmentStatusChanged: appointment
            });
            logger_1.default.info(`📢 Published appointment status change: ${appointment.appointment_id} -> ${appointment.status}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish appointment status change:', error);
        }
    }
    /**
     * Publish new appointment created event
     */
    async publishNewAppointment(appointment) {
        try {
            await this.pubsub.publish(SubscriptionEvents.NEW_APPOINTMENT_CREATED, {
                newAppointmentCreated: appointment
            });
            logger_1.default.info(`📢 Published new appointment: ${appointment.appointment_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish new appointment:', error);
        }
    }
    /**
     * Publish waiting queue update event
     */
    async publishWaitingQueueUpdate(doctor_id, queue) {
        try {
            await this.pubsub.publish(SubscriptionEvents.WAITING_QUEUE_UPDATED, {
                waitingQueueUpdated: queue
            });
            logger_1.default.info(`📢 Published waiting queue update for doctor: ${doctor_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish waiting queue update:', error);
        }
    }
    /**
     * Publish doctor status change event
     */
    async publishDoctorStatusChange(doctor) {
        try {
            await this.pubsub.publish(SubscriptionEvents.DOCTOR_STATUS_CHANGED, {
                doctorStatusChanged: doctor
            });
            logger_1.default.info(`📢 Published doctor status change: ${doctor.doctor_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish doctor status change:', error);
        }
    }
    /**
     * Publish doctor schedule change event
     */
    async publishDoctorScheduleChange(schedule) {
        try {
            await this.pubsub.publish(SubscriptionEvents.DOCTOR_SCHEDULE_CHANGED, {
                doctorScheduleChanged: schedule
            });
            logger_1.default.info(`📢 Published doctor schedule change: ${schedule.doctor_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish doctor schedule change:', error);
        }
    }
    /**
     * Publish doctor availability change event
     */
    async publishDoctorAvailabilityChange(doctor) {
        try {
            await this.pubsub.publish(SubscriptionEvents.DOCTOR_AVAILABILITY_CHANGED, {
                doctorAvailabilityChanged: doctor
            });
            logger_1.default.info(`📢 Published doctor availability change: ${doctor.doctor_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish doctor availability change:', error);
        }
    }
    /**
     * Publish doctor notification event
     */
    async publishDoctorNotification(doctor_id, notification) {
        try {
            await this.pubsub.publish(SubscriptionEvents.DOCTOR_NOTIFICATION, {
                doctorNotification: notification
            });
            logger_1.default.info(`📢 Published doctor notification: ${doctor_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish doctor notification:', error);
        }
    }
    /**
     * Publish patient status change event
     */
    async publishPatientStatusChange(patient) {
        try {
            await this.pubsub.publish(SubscriptionEvents.PATIENT_STATUS_CHANGED, {
                patientStatusChanged: patient
            });
            logger_1.default.info(`📢 Published patient status change: ${patient.patient_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish patient status change:', error);
        }
    }
    /**
     * Publish patient update event
     */
    async publishPatientUpdate(patient) {
        try {
            await this.pubsub.publish(SubscriptionEvents.PATIENT_UPDATED, {
                patientUpdated: patient
            });
            logger_1.default.info(`📢 Published patient update: ${patient.patient_id}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish patient update:', error);
        }
    }
    /**
     * Publish system notification event
     */
    async publishSystemNotification(notification) {
        try {
            await this.pubsub.publish(SubscriptionEvents.SYSTEM_NOTIFICATION, {
                systemNotification: notification
            });
            logger_1.default.info(`📢 Published system notification: ${notification.type}`);
        }
        catch (error) {
            logger_1.default.error('❌ Failed to publish system notification:', error);
        }
    }
    /**
     * Get PubSub instance for direct access
     */
    getPubSub() {
        return this.pubsub;
    }
    /**
     * Check if service is initialized
     */
    isReady() {
        return this.isInitialized;
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            logger_1.default.info('🧹 Cleaning up Subscription Service...');
            // Cleanup PubSub resources if needed
            this.isInitialized = false;
            logger_1.default.info('✅ Subscription Service cleanup completed');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to cleanup Subscription Service:', error);
        }
    }
}
// Export singleton instance
exports.subscriptionService = new SubscriptionService();
exports.default = exports.subscriptionService;
//# sourceMappingURL=subscription.service.js.map