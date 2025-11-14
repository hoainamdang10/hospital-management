"use strict";
/**
 * ClinicalEventConsumer - Consumes clinical events from Clinical EMR Service
 * Handles automatic billing for medical services, procedures, and medications
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalEventConsumer = void 0;
/**
 * ClinicalEventConsumer - Handles clinical events for billing
 */
class ClinicalEventConsumer {
    constructor(config, loggerInstance, billingService, invoiceRepository, patientRepository) {
        this.config = config;
        this.loggerInstance = loggerInstance;
        this.billingService = billingService;
        this.invoiceRepository = invoiceRepository;
        this.patientRepository = patientRepository;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            this.loggerInstance.info('Connecting to RabbitMQ for Clinical events', {
                queueName: this.config.queueName,
            });
            const amqp = require('amqplib');
            this.connection = await amqp.connect(this.config.rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            if (!this.channel) {
                throw new Error('Failed to create RabbitMQ channel');
            }
            // Assert exchange
            await this.channel.assertExchange(this.config.exchangeName, 'topic', {
                durable: true,
            });
            // Assert queue
            await this.channel.assertQueue(this.config.queueName, {
                durable: true,
            });
            // Bind queue to routing keys
            for (const routingKey of this.config.routingKeys) {
                await this.channel.bindQueue(this.config.queueName, this.config.exchangeName, routingKey);
                this.loggerInstance.info('Queue bound to routing key', {
                    queueName: this.config.queueName,
                    routingKey,
                });
            }
            // Start consuming
            await this.channel.consume(this.config.queueName, this.handleMessage.bind(this), { noAck: false });
            this.isConnected = true;
            this.loggerInstance.info('Clinical event consumer connected successfully');
            // Handle connection errors
            this.connection.on('error', (error) => {
                this.loggerInstance.error('RabbitMQ connection error', {
                    error: error.message,
                });
                this.isConnected = false;
            });
            this.connection.on('close', () => {
                this.loggerInstance.warn('RabbitMQ connection closed');
                this.isConnected = false;
            });
        }
        catch (error) {
            this.loggerInstance.error('Failed to connect to RabbitMQ', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(msg) {
        if (!msg || !this.channel) {
            return;
        }
        try {
            const content = msg.content.toString();
            const event = JSON.parse(content);
            const routingKey = msg.fields.routingKey;
            this.loggerInstance.debug('Received clinical event', {
                routingKey,
                eventId: event.eventId,
            });
            // Route to appropriate handler
            switch (routingKey) {
                case 'clinical.prescription.created':
                    await this.handlePrescriptionCreated(event.payload);
                    break;
                case 'clinical.lab_result.created':
                    await this.handleLabResultCreated(event.payload);
                    break;
                case 'clinical.treatment_plan.created':
                    await this.handleTreatmentPlanCreated(event.payload);
                    break;
                case 'clinical.medical_record.created':
                    await this.handleMedicalRecordCreated(event.payload);
                    break;
                default:
                    this.loggerInstance.warn('Unhandled routing key', { routingKey });
                    break;
            }
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            this.loggerInstance.error('Error processing clinical event', {
                error: error instanceof Error ? error.message : 'Unknown error',
                routingKey: msg.fields.routingKey,
            });
            // Negative acknowledge (requeue)
            if (this.channel) {
                this.channel.nack(msg, false, true);
            }
        }
    }
    /**
     * Handle prescription created event
     */
    async handlePrescriptionCreated(data) {
        this.loggerInstance.info('Processing prescription billing', {
            prescriptionId: data.prescriptionId,
            patientId: data.patientId,
            medicationCount: data.medications.length,
            totalCost: data.totalCost,
        });
        try {
            // Get patient billing information
            const patient = await this.patientRepository.findById(data.patientId);
            if (!patient) {
                this.loggerInstance.error('Patient not found for prescription billing', {
                    patientId: data.patientId,
                    prescriptionId: data.prescriptionId,
                });
                return;
            }
            // Generate prescription billing invoice
            const invoice = await this.billingService.generatePrescriptionInvoice({
                prescriptionId: data.prescriptionId,
                patientId: data.patientId,
                staffId: data.staffId,
                appointmentId: data.appointmentId,
                medications: data.medications,
                prescribedAt: data.prescribedAt,
                totalCost: data.totalCost,
                insuranceInfo: patient.insuranceInfo,
            });
            this.loggerInstance.info('Prescription invoice generated', {
                prescriptionId: data.prescriptionId,
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
            });
        }
        catch (error) {
            this.loggerInstance.error('Failed to generate prescription invoice', {
                prescriptionId: data.prescriptionId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle lab result created event
     */
    async handleLabResultCreated(data) {
        this.loggerInstance.info('Processing lab test billing', {
            labResultId: data.labResultId,
            patientId: data.patientId,
            testType: data.testType,
            cost: data.cost,
            isUrgent: data.isUrgent,
        });
        try {
            // Get patient billing information
            const patient = await this.patientRepository.findById(data.patientId);
            if (!patient) {
                this.loggerInstance.error('Patient not found for lab billing', {
                    patientId: data.patientId,
                    labResultId: data.labResultId,
                });
                return;
            }
            // Generate lab test billing invoice
            const invoice = await this.billingService.generateLabTestInvoice({
                labResultId: data.labResultId,
                patientId: data.patientId,
                staffId: data.staffId,
                appointmentId: data.appointmentId,
                testType: data.testType,
                testCode: data.testCode,
                performedAt: data.performedAt,
                cost: data.cost,
                isUrgent: data.isUrgent,
                insuranceInfo: patient.insuranceInfo,
            });
            this.loggerInstance.info('Lab test invoice generated', {
                labResultId: data.labResultId,
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
            });
        }
        catch (error) {
            this.loggerInstance.error('Failed to generate lab test invoice', {
                labResultId: data.labResultId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle treatment plan created event
     */
    async handleTreatmentPlanCreated(data) {
        this.loggerInstance.info('Processing treatment plan billing', {
            treatmentPlanId: data.treatmentPlanId,
            patientId: data.patientId,
            procedureCount: data.procedures.length,
            totalCost: data.totalCost,
        });
        try {
            // Get patient billing information
            const patient = await this.patientRepository.findById(data.patientId);
            if (!patient) {
                this.loggerInstance.error('Patient not found for treatment plan billing', {
                    patientId: data.patientId,
                    treatmentPlanId: data.treatmentPlanId,
                });
                return;
            }
            // Generate treatment plan billing invoice
            const invoice = await this.billingService.generateTreatmentPlanInvoice({
                treatmentPlanId: data.treatmentPlanId,
                patientId: data.patientId,
                staffId: data.staffId,
                appointmentId: data.appointmentId,
                procedures: data.procedures,
                createdAt: data.createdAt,
                totalCost: data.totalCost,
                estimatedDuration: data.estimatedDuration,
                insuranceInfo: patient.insuranceInfo,
            });
            this.loggerInstance.info('Treatment plan invoice generated', {
                treatmentPlanId: data.treatmentPlanId,
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
            });
        }
        catch (error) {
            this.loggerInstance.error('Failed to generate treatment plan invoice', {
                treatmentPlanId: data.treatmentPlanId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle medical record created event
     */
    async handleMedicalRecordCreated(data) {
        this.loggerInstance.info('Processing medical record billing', {
            medicalRecordId: data.medicalRecordId,
            patientId: data.patientId,
            recordType: data.recordType,
            serviceCount: data.services.length,
            totalCost: data.totalCost,
        });
        try {
            // Get patient billing information
            const patient = await this.patientRepository.findById(data.patientId);
            if (!patient) {
                this.loggerInstance.error('Patient not found for medical record billing', {
                    patientId: data.patientId,
                    medicalRecordId: data.medicalRecordId,
                });
                return;
            }
            // Generate medical record billing invoice
            const invoice = await this.billingService.generateMedicalRecordInvoice({
                medicalRecordId: data.medicalRecordId,
                patientId: data.patientId,
                staffId: data.staffId,
                appointmentId: data.appointmentId,
                recordType: data.recordType,
                services: data.services,
                createdAt: data.createdAt,
                totalCost: data.totalCost,
                insuranceInfo: patient.insuranceInfo,
            });
            this.loggerInstance.info('Medical record invoice generated', {
                medicalRecordId: data.medicalRecordId,
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
            });
        }
        catch (error) {
            this.loggerInstance.error('Failed to generate medical record invoice', {
                medicalRecordId: data.medicalRecordId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Disconnect from RabbitMQ
     */
    async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = undefined;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = undefined;
            }
            this.isConnected = false;
            this.loggerInstance.info('Clinical event consumer disconnected successfully');
        }
        catch (error) {
            this.loggerInstance.error('Error disconnecting clinical event consumer', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * Check if consumer is connected
     */
    isConsumerConnected() {
        return this.isConnected;
    }
}
exports.ClinicalEventConsumer = ClinicalEventConsumer;
//# sourceMappingURL=ClinicalEventConsumer.js.map