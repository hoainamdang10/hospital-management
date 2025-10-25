"use strict";
/**
 * Event Subscriptions Setup - Infrastructure Layer
 * Configures event subscriptions for Clinical EMR Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSubscriptions = void 0;
exports.createEventSubscriptions = createEventSubscriptions;
const EventBus_1 = require("../../../shared/infrastructure/event-bus/EventBus");
/**
 * Event Subscriptions Manager
 * Manages all event subscriptions for Clinical EMR Service
 */
class EventSubscriptions {
    constructor(clinicalEMREventHandler, medicalRecordDomainEventHandler, config, logger) {
        this.clinicalEMREventHandler = clinicalEMREventHandler;
        this.medicalRecordDomainEventHandler = medicalRecordDomainEventHandler;
        this.config = config;
        this.logger = logger;
        this.isConnected = false;
        this.eventBus = EventBus_1.EventBusFactory.create(config);
    }
    /**
     * Connect to event bus and setup subscriptions
     */
    async connect() {
        if (this.isConnected) {
            this.logger.info('[EventSubscriptions] Already connected');
            return;
        }
        try {
            this.logger.info('[EventSubscriptions] 🔌 Connecting to RabbitMQ event bus...');
            await this.eventBus.connect();
            this.logger.info('[EventSubscriptions] 📡 Setting up event subscriptions...');
            await this.setupSubscriptions();
            this.isConnected = true;
            this.logger.info('[EventSubscriptions] ✅ All subscriptions ready and listening');
        }
        catch (error) {
            this.logger.error('[EventSubscriptions] ❌ Failed to setup subscriptions:', error);
            throw error;
        }
    }
    /**
     * Disconnect from event bus
     */
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            this.logger.info('[EventSubscriptions] 🔌 Disconnecting from event bus...');
            await this.eventBus.disconnect();
            this.isConnected = false;
            this.logger.info('[EventSubscriptions] ✅ Disconnected successfully');
        }
        catch (error) {
            this.logger.error('[EventSubscriptions] ❌ Failed to disconnect:', error);
            throw error;
        }
    }
    /**
     * Setup all event subscriptions
     */
    async setupSubscriptions() {
        const serviceName = this.config.serviceName || 'clinical-emr-service';
        // =====================================================
        // SUBSCRIBE TO APPOINTMENTS SERVICE EVENTS
        // =====================================================
        // 1. Appointment Completed → Create Medical Record
        await this.eventBus.subscribe('AppointmentCompleted', async (event) => {
            this.logger.info(`[Event] 📅 Received AppointmentCompleted: ${event.aggregateId}`);
            await this.clinicalEMREventHandler.processEvent(event);
        }, `${serviceName}.appointment.completed`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to appointment.completed (from Appointments Service)');
        // 2. Appointment Cancelled → Update Medical Record if exists
        await this.eventBus.subscribe('AppointmentCancelled', async (event) => {
            this.logger.info(`[Event] ❌ Received AppointmentCancelled: ${event.aggregateId}`);
            // Update medical record status if linked
        }, `${serviceName}.appointment.cancelled`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to appointment.cancelled');
        // =====================================================
        // SUBSCRIBE TO PATIENT REGISTRY EVENTS
        // =====================================================
        // 3. Patient Registered → Initialize EMR Profile
        await this.eventBus.subscribe('PatientRegistered', async (event) => {
            this.logger.info(`[Event] 👤 Received PatientRegistered: ${event.aggregateId}`);
            await this.clinicalEMREventHandler.processEvent(event);
        }, `${serviceName}.patient.registered`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to patient.registered (from Patient Registry)');
        // 4. Patient Updated → Sync Patient Data
        await this.eventBus.subscribe('PatientUpdated', async (event) => {
            this.logger.info(`[Event] 👤 Received PatientUpdated: ${event.aggregateId}`);
            // Update cached patient data if needed
        }, `${serviceName}.patient.updated`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to patient.updated');
        // =====================================================
        // SUBSCRIBE TO PROVIDER/STAFF SERVICE EVENTS
        // =====================================================
        // 5. Staff Registered → Cache Doctor Info
        await this.eventBus.subscribe('StaffRegistered', async (event) => {
            this.logger.info(`[Event] 👨‍⚕️ Received StaffRegistered: ${event.aggregateId}`);
            // Cache doctor information for faster lookups
        }, `${serviceName}.staff.registered`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to staff.registered (from Provider Service)');
        // 6. Staff Updated → Update Cached Doctor Data
        await this.eventBus.subscribe('StaffUpdated', async (event) => {
            this.logger.info(`[Event] 👨‍⚕️ Received StaffUpdated: ${event.aggregateId}`);
            // Update cached doctor data
        }, `${serviceName}.staff.updated`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to staff.updated');
        // =====================================================
        // SUBSCRIBE TO LABORATORY SERVICE EVENTS (Future)
        // =====================================================
        // 7. Test Results Ready → Add to Medical Record
        await this.eventBus.subscribe('TestResultsReady', async (event) => {
            this.logger.info(`[Event] 🧪 Received TestResultsReady: ${event.aggregateId}`);
            await this.clinicalEMREventHandler.processEvent(event);
        }, `${serviceName}.test.results.ready`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to test-results.ready (from Lab Service)');
        // =====================================================
        // SUBSCRIBE TO BILLING SERVICE EVENTS
        // =====================================================
        // 8. Payment Completed → Update Medical Record Payment Status
        await this.eventBus.subscribe('PaymentCompleted', async (event) => {
            this.logger.info(`[Event] 💰 Received PaymentCompleted: ${event.aggregateId}`);
            // Update payment status in medical record
        }, `${serviceName}.billing.payment.completed`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to billing.payment.completed');
        // =====================================================
        // SUBSCRIBE TO OWN DOMAIN EVENTS (for side effects)
        // =====================================================
        // 9. Medical Record Created → Publish to other services
        await this.eventBus.subscribe('MedicalRecordCreated', async (event) => {
            this.logger.info(`[Event] 📋 Received MedicalRecordCreated: ${event.aggregateId}`);
            await this.medicalRecordDomainEventHandler.handle(event);
        }, `${serviceName}.medical.record.created.internal`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to medical-record.created (internal)');
        // 10. Medical Record Updated → Notify other services
        await this.eventBus.subscribe('MedicalRecordUpdated', async (event) => {
            this.logger.info(`[Event] 📝 Received MedicalRecordUpdated: ${event.aggregateId}`);
            await this.medicalRecordDomainEventHandler.handle(event);
        }, `${serviceName}.medical.record.updated.internal`);
        this.logger.info('[EventSubscriptions] ✅ Subscribed to medical-record.updated (internal)');
        // Summary
        this.logger.info('[EventSubscriptions] 📊 Subscription Summary:');
        this.logger.info('   - Appointments Service: 2 events');
        this.logger.info('   - Patient Registry: 2 events');
        this.logger.info('   - Provider Service: 2 events');
        this.logger.info('   - Lab Service: 1 event');
        this.logger.info('   - Billing Service: 1 event');
        this.logger.info('   - Internal Events: 2 events');
        this.logger.info('   TOTAL: 10 event subscriptions active');
    }
    /**
     * Get event bus instance
     */
    getEventBus() {
        return this.eventBus;
    }
    /**
     * Check if connected
     */
    isEventBusConnected() {
        return this.isConnected;
    }
    /**
     * Get subscription status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            subscriptions: 10, // Total subscriptions
            serviceName: this.config.serviceName || 'clinical-emr-service'
        };
    }
}
exports.EventSubscriptions = EventSubscriptions;
/**
 * Create event subscriptions instance
 */
function createEventSubscriptions(clinicalEMREventHandler, medicalRecordDomainEventHandler, logger) {
    const config = {
        rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq-v2:5672',
        exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
        serviceName: 'clinical-emr-service'
    };
    return new EventSubscriptions(clinicalEMREventHandler, medicalRecordDomainEventHandler, config, logger);
}
//# sourceMappingURL=EventSubscriptions.js.map