"use strict";
/**
 * Billing Event Consumer - Infrastructure Layer
 * Consumes billing events from Billing Service
 * Handles payment confirmation and insurance claim processing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingEventConsumer = void 0;
const UpdateMedicalRecordUseCase_1 = require("../../application/use-cases/UpdateMedicalRecordUseCase");
const GetMedicalRecordUseCase_1 = require("../../application/use-cases/GetMedicalRecordUseCase");
const CreateClinicalNoteUseCase_1 = require("../../application/use-cases/CreateClinicalNoteUseCase");
/**
 * BillingEventConsumer - Handles billing events for clinical records
 */
class BillingEventConsumer {
    constructor(config, logger, medicalRecordRepo, clinicalNoteRepo, patientSnapshotRepo) {
        this.config = config;
        this.logger = logger;
        this.medicalRecordRepo = medicalRecordRepo;
        this.clinicalNoteRepo = clinicalNoteRepo;
        this.patientSnapshotRepo = patientSnapshotRepo;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            this.logger.info('Connecting to RabbitMQ for Billing events', {
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
                this.logger.info('Queue bound to routing key', {
                    queueName: this.config.queueName,
                    routingKey,
                });
            }
            // Start consuming
            await this.channel.consume(this.config.queueName, this.handleMessage.bind(this), { noAck: false });
            this.isConnected = true;
            this.logger.info('Billing event consumer connected successfully');
            // Handle connection errors
            this.connection.on('error', (error) => {
                this.logger.error('RabbitMQ connection error', {
                    error: error.message,
                });
                this.isConnected = false;
            });
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed');
                this.isConnected = false;
            });
        }
        catch (error) {
            this.logger.error('Failed to connect to RabbitMQ', {
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
            this.logger.debug('Received billing event', {
                routingKey,
                eventId: event.eventId,
            });
            // Route to appropriate handler
            switch (routingKey) {
                case 'billing.invoice.paid':
                    await this.handleInvoicePaid(event.payload);
                    break;
                case 'billing.invoice.finalized':
                    await this.handleInvoiceFinalized(event.payload);
                    break;
                case 'billing.insurance.claim.processed':
                    await this.handleInsuranceClaimProcessed(event.payload);
                    break;
                default:
                    this.logger.warn('Unhandled routing key', { routingKey });
                    break;
            }
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            this.logger.error('Error processing billing event', {
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
     * Handle invoice paid event
     */
    async handleInvoicePaid(data) {
        this.logger.info('Processing invoice paid event', {
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            appointmentId: data.appointmentId,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
        });
        try {
            // Find related medical record
            let medicalRecord = null;
            if (data.medicalRecordId) {
                const getMedicalRecordUseCase = new GetMedicalRecordUseCase_1.GetMedicalRecordUseCase(this.medicalRecordRepo);
                medicalRecord = await getMedicalRecordUseCase.execute(data.medicalRecordId);
            }
            else if (data.appointmentId) {
                const records = await this.medicalRecordRepo.findByPatientId(data.patientId);
                medicalRecord = records.find(record => record.appointmentId === data.appointmentId);
            }
            if (!medicalRecord) {
                this.logger.warn('No medical record found for paid invoice', {
                    invoiceId: data.invoiceId,
                    patientId: data.patientId,
                    appointmentId: data.appointmentId,
                    medicalRecordId: data.medicalRecordId,
                });
                return;
            }
            // Update medical record with billing information
            const updateMedicalRecordUseCase = new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(this.medicalRecordRepo);
            const billingInfo = {
                invoiceId: data.invoiceId,
                paymentStatus: 'paid',
                paymentMethod: data.paymentMethod,
                paidAt: data.paidAt,
                totalAmount: data.amount,
                currency: data.currency,
                paymentReference: data.paymentReference,
                items: data.items,
            };
            await updateMedicalRecordUseCase.execute(medicalRecord.id, {
                billingInfo,
                updatedAt: new Date(),
            });
            this.logger.info('Medical record updated with payment information', {
                medicalRecordId: medicalRecord.id,
                invoiceId: data.invoiceId,
                paymentMethod: data.paymentMethod,
            });
            // Create clinical note about payment
            const createClinicalNoteUseCase = new CreateClinicalNoteUseCase_1.CreateClinicalNoteUseCase(this.clinicalNoteRepo, this.medicalRecordRepo);
            const paymentNote = await createClinicalNoteUseCase.execute({
                recordId: medicalRecord.id,
                noteType: 'billing',
                content: `Payment received: ${data.currency} ${data.amount.toFixed(2)} via ${data.paymentMethod}`,
                assessment: 'Payment processed successfully',
                plan: 'Continue with treatment plan',
                createdBy: 'system',
            });
            this.logger.info('Billing clinical note created', {
                medicalRecordId: medicalRecord.id,
                noteId: paymentNote.id,
                invoiceId: data.invoiceId,
            });
        }
        catch (error) {
            this.logger.error('Failed to process invoice paid', {
                invoiceId: data.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle invoice finalized event
     */
    async handleInvoiceFinalized(data) {
        this.logger.info('Processing invoice finalized event', {
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            appointmentId: data.appointmentId,
            totalAmount: data.totalAmount,
            status: data.status,
        });
        try {
            // Find related medical record
            let medicalRecord = null;
            if (data.medicalRecordId) {
                const getMedicalRecordUseCase = new GetMedicalRecordUseCase_1.GetMedicalRecordUseCase(this.medicalRecordRepo);
                medicalRecord = await getMedicalRecordUseCase.execute(data.medicalRecordId);
            }
            else if (data.appointmentId) {
                const records = await this.medicalRecordRepo.findByPatientId(data.patientId);
                medicalRecord = records.find(record => record.appointmentId === data.appointmentId);
            }
            if (!medicalRecord) {
                this.logger.warn('No medical record found for finalized invoice', {
                    invoiceId: data.invoiceId,
                    patientId: data.patientId,
                    appointmentId: data.appointmentId,
                    medicalRecordId: data.medicalRecordId,
                });
                return;
            }
            // Update medical record with billing information
            const updateMedicalRecordUseCase = new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(this.medicalRecordRepo);
            const billingInfo = {
                invoiceId: data.invoiceId,
                billingStatus: data.status,
                totalAmount: data.totalAmount,
                currency: data.currency,
                finalizedAt: data.finalizedAt,
                insuranceCoverage: data.insuranceCoverage,
            };
            await updateMedicalRecordUseCase.execute(medicalRecord.id, {
                billingInfo,
                updatedAt: new Date(),
            });
            this.logger.info('Medical record updated with finalized billing information', {
                medicalRecordId: medicalRecord.id,
                invoiceId: data.invoiceId,
                billingStatus: data.status,
            });
            // Create clinical note about billing finalization if needed
            if (data.status === 'pending_payment' || data.status === 'overdue') {
                const createClinicalNoteUseCase = new CreateClinicalNoteUseCase_1.CreateClinicalNoteUseCase(this.clinicalNoteRepo, this.medicalRecordRepo);
                const billingNote = await createClinicalNoteUseCase.execute({
                    recordId: medicalRecord.id,
                    noteType: 'billing',
                    content: `Invoice finalized: ${data.currency} ${data.totalAmount.toFixed(2)} - Status: ${data.status}`,
                    assessment: data.status === 'overdue' ? 'Payment overdue - follow up required' : 'Payment pending',
                    plan: data.status === 'overdue' ? 'Contact patient regarding payment' : 'Await payment confirmation',
                    createdBy: 'system',
                });
                this.logger.info('Billing status clinical note created', {
                    medicalRecordId: medicalRecord.id,
                    noteId: billingNote.id,
                    invoiceId: data.invoiceId,
                    status: data.status,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to process invoice finalized', {
                invoiceId: data.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle insurance claim processed event
     */
    async handleInsuranceClaimProcessed(data) {
        this.logger.info('Processing insurance claim processed event', {
            claimId: data.claimId,
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            insuranceProvider: data.insuranceProvider,
            claimAmount: data.claimAmount,
            approvedAmount: data.approvedAmount,
            status: data.status,
        });
        try {
            // Find related medical record
            let medicalRecord = null;
            if (data.medicalRecordId) {
                const getMedicalRecordUseCase = new GetMedicalRecordUseCase_1.GetMedicalRecordUseCase(this.medicalRecordRepo);
                medicalRecord = await getMedicalRecordUseCase.execute(data.medicalRecordId);
            }
            else if (data.appointmentId) {
                const records = await this.medicalRecordRepo.findByPatientId(data.patientId);
                medicalRecord = records.find(record => record.appointmentId === data.appointmentId);
            }
            if (!medicalRecord) {
                this.logger.warn('No medical record found for insurance claim', {
                    claimId: data.claimId,
                    invoiceId: data.invoiceId,
                    patientId: data.patientId,
                    appointmentId: data.appointmentId,
                    medicalRecordId: data.medicalRecordId,
                });
                return;
            }
            // Update medical record with insurance claim information
            const updateMedicalRecordUseCase = new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(this.medicalRecordRepo);
            const insuranceClaimInfo = {
                claimId: data.claimId,
                invoiceId: data.invoiceId,
                insuranceProvider: data.insuranceProvider,
                policyNumber: data.policyNumber,
                claimAmount: data.claimAmount,
                approvedAmount: data.approvedAmount,
                patientResponsibility: data.patientResponsibility,
                processedAt: data.processedAt,
                status: data.status,
                denialReason: data.denialReason,
            };
            await updateMedicalRecordUseCase.execute(medicalRecord.id, {
                insuranceClaimInfo,
                updatedAt: new Date(),
            });
            this.logger.info('Medical record updated with insurance claim information', {
                medicalRecordId: medicalRecord.id,
                claimId: data.claimId,
                status: data.status,
            });
            // Create clinical note about insurance claim
            const createClinicalNoteUseCase = new CreateClinicalNoteUseCase_1.CreateClinicalNoteUseCase(this.clinicalNoteRepo, this.medicalRecordRepo);
            let claimNoteContent = `Insurance claim processed by ${data.insuranceProvider}: `;
            claimNoteContent += `Claim amount: $${data.claimAmount.toFixed(2)}, `;
            claimNoteContent += `Approved: $${data.approvedAmount.toFixed(2)}, `;
            claimNoteContent += `Patient responsibility: $${data.patientResponsibility.toFixed(2)}`;
            let assessment = '';
            let plan = '';
            switch (data.status) {
                case 'approved':
                    assessment = 'Insurance claim approved';
                    plan = 'Follow up on remaining patient responsibility';
                    break;
                case 'denied':
                    assessment = `Insurance claim denied: ${data.denialReason || 'No reason provided'}`;
                    plan = 'Contact patient regarding payment arrangements';
                    break;
                case 'partial':
                    assessment = 'Insurance claim partially approved';
                    plan = 'Follow up on partial payment and patient responsibility';
                    break;
                case 'pending':
                    assessment = 'Insurance claim processing';
                    plan = 'Await insurance provider decision';
                    break;
            }
            const claimNote = await createClinicalNoteUseCase.execute({
                recordId: medicalRecord.id,
                noteType: 'insurance',
                content: claimNoteContent,
                assessment,
                plan,
                createdBy: 'system',
            });
            this.logger.info('Insurance claim clinical note created', {
                medicalRecordId: medicalRecord.id,
                noteId: claimNote.id,
                claimId: data.claimId,
                status: data.status,
            });
        }
        catch (error) {
            this.logger.error('Failed to process insurance claim processed', {
                claimId: data.claimId,
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
            this.logger.info('Billing event consumer disconnected successfully');
        }
        catch (error) {
            this.logger.error('Error disconnecting billing event consumer', {
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
exports.BillingEventConsumer = BillingEventConsumer;
