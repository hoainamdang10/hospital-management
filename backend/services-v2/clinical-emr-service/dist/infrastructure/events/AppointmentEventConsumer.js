"use strict";
/**
 * Appointment Event Consumer - Infrastructure Layer
 * Consumes appointment events from Appointments Service
 * Handles automatic medical record creation and visit workflow
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentEventConsumer = void 0;
const CreateMedicalRecordUseCase_1 = require("../../application/use-cases/CreateMedicalRecordUseCase");
const UpdateMedicalRecordUseCase_1 = require("../../application/use-cases/UpdateMedicalRecordUseCase");
const CreateClinicalNoteUseCase_1 = require("../../application/use-cases/CreateClinicalNoteUseCase");
/**
 * AppointmentEventConsumer - Handles appointment events for clinical workflow
 */
class AppointmentEventConsumer {
    constructor(config, logger, medicalRecordRepo, clinicalNoteRepo, patientSnapshotRepo, providerSnapshotRepo, integrationSyncService) {
        this.config = config;
        this.logger = logger;
        this.medicalRecordRepo = medicalRecordRepo;
        this.clinicalNoteRepo = clinicalNoteRepo;
        this.patientSnapshotRepo = patientSnapshotRepo;
        this.providerSnapshotRepo = providerSnapshotRepo;
        this.integrationSyncService = integrationSyncService;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            this.logger.info('Connecting to RabbitMQ for Appointment events', {
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
            this.logger.info('Appointment event consumer connected successfully');
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
            this.logger.debug('Received appointment event', {
                routingKey,
                eventId: event.eventId,
            });
            // Route to appropriate handler
            switch (routingKey) {
                case 'appointment.completed':
                    await this.handleAppointmentCompleted(event.payload);
                    break;
                case 'appointment.checked_in':
                    await this.handleAppointmentCheckedIn(event.payload);
                    break;
                case 'appointment.cancelled':
                    await this.handleAppointmentCancelled(event.payload);
                    break;
                default:
                    this.logger.warn('Unhandled routing key', { routingKey });
                    break;
            }
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            this.logger.error('Error processing appointment event', {
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
     * Handle appointment completed event
     */
    async handleAppointmentCompleted(data) {
        this.logger.info('Processing appointment completed for medical record creation', {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            staffId: data.staffId,
            serviceType: data.serviceType,
        });
        try {
            // Get patient and provider snapshots
            const patientSnapshot = await this.patientSnapshotRepo.getByPatientId(data.patientId);
            const providerSnapshot = await this.providerSnapshotRepo.getByProviderId(data.staffId);
            if (!patientSnapshot) {
                this.logger.error('Patient snapshot not found', {
                    patientId: data.patientId,
                    appointmentId: data.appointmentId,
                });
                return;
            }
            if (!providerSnapshot) {
                this.logger.error('Provider snapshot not found', {
                    providerId: data.staffId,
                    appointmentId: data.appointmentId,
                });
                return;
            }
            // Check if medical record already exists for this appointment
            const existingRecords = await this.medicalRecordRepo.findByPatientId(data.patientId);
            const appointmentRecord = existingRecords.find(record => record.appointmentId === data.appointmentId);
            if (appointmentRecord) {
                this.logger.info('Medical record already exists for appointment', {
                    appointmentId: data.appointmentId,
                    recordId: appointmentRecord.id,
                });
                return;
            }
            // Create medical record for completed appointment
            const createMedicalRecordUseCase = new CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase(this.medicalRecordRepo);
            const medicalRecord = await createMedicalRecordUseCase.execute({
                patientId: data.patientId,
                providerId: data.staffId,
                departmentId: data.departmentId,
                appointmentId: data.appointmentId,
                recordType: this.mapServiceTypeToRecordType(data.serviceType),
                chiefComplaint: data.notes || 'Follow-up visit',
                historyOfPresentIllness: `Patient completed ${data.serviceType} appointment`,
                vitals: data.vitals,
                serviceDate: data.completedAt,
                status: 'completed',
            });
            this.logger.info('Medical record created for completed appointment', {
                appointmentId: data.appointmentId,
                recordId: medicalRecord.id,
                patientId: data.patientId,
            });
            // Create initial clinical note
            const createClinicalNoteUseCase = new CreateClinicalNoteUseCase_1.CreateClinicalNoteUseCase(this.clinicalNoteRepo, this.medicalRecordRepo);
            const clinicalNote = await createClinicalNoteUseCase.execute({
                recordId: medicalRecord.id,
                noteType: 'progress',
                content: `Appointment completed successfully. ${data.notes || 'No additional notes provided.'}`,
                assessment: 'Visit completed as scheduled',
                plan: 'Follow-up as needed',
                createdBy: data.staffId,
            });
            this.logger.info('Clinical note created for completed appointment', {
                appointmentId: data.appointmentId,
                recordId: medicalRecord.id,
                noteId: clinicalNote.id,
            });
        }
        catch (error) {
            this.logger.error('Failed to process appointment completed', {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle appointment checked in event
     */
    async handleAppointmentCheckedIn(data) {
        this.logger.info('Processing appointment checked in', {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            staffId: data.staffId,
            checkedInAt: data.checkedInAt,
        });
        try {
            // Get patient and provider snapshots
            const patientSnapshot = await this.patientSnapshotRepo.getByPatientId(data.patientId);
            const providerSnapshot = await this.providerSnapshotRepo.getByProviderId(data.staffId);
            if (!patientSnapshot || !providerSnapshot) {
                this.logger.warn('Patient or provider snapshot not found, skipping check-in processing', {
                    patientId: data.patientId,
                    staffId: data.staffId,
                    appointmentId: data.appointmentId,
                });
                return;
            }
            // Check if medical record already exists
            const existingRecords = await this.medicalRecordRepo.findByPatientId(data.patientId);
            const appointmentRecord = existingRecords.find(record => record.appointmentId === data.appointmentId);
            if (appointmentRecord) {
                this.logger.info('Medical record already exists for checked-in appointment', {
                    appointmentId: data.appointmentId,
                    recordId: appointmentRecord.id,
                });
                return;
            }
            // Create preliminary medical record for check-in
            const createMedicalRecordUseCase = new CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase(this.medicalRecordRepo);
            const medicalRecord = await createMedicalRecordUseCase.execute({
                patientId: data.patientId,
                providerId: data.staffId,
                departmentId: data.departmentId,
                appointmentId: data.appointmentId,
                recordType: 'outpatient',
                chiefComplaint: 'Patient checked in for appointment',
                historyOfPresentIllness: 'Patient arrived and checked in for scheduled appointment',
                vitals: data.vitals,
                serviceDate: data.checkedInAt,
                status: 'in_progress',
            });
            this.logger.info('Medical record created for checked-in appointment', {
                appointmentId: data.appointmentId,
                recordId: medicalRecord.id,
                patientId: data.patientId,
            });
        }
        catch (error) {
            this.logger.error('Failed to process appointment checked in', {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Handle appointment cancelled event
     */
    async handleAppointmentCancelled(data) {
        this.logger.info('Processing appointment cancelled', {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            staffId: data.staffId,
            cancellationType: data.cancellationType,
            reason: data.reason,
        });
        try {
            // Find and update any existing medical records for this appointment
            const existingRecords = await this.medicalRecordRepo.findByPatientId(data.patientId);
            const appointmentRecord = existingRecords.find(record => record.appointmentId === data.appointmentId);
            if (appointmentRecord) {
                const updateMedicalRecordUseCase = new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(this.medicalRecordRepo);
                // Update medical record status to cancelled
                await updateMedicalRecordUseCase.execute(appointmentRecord.id, {
                    status: 'cancelled',
                    notes: `Appointment cancelled: ${data.reason}`,
                    updatedAt: new Date(),
                });
                this.logger.info('Medical record updated for cancelled appointment', {
                    appointmentId: data.appointmentId,
                    recordId: appointmentRecord.id,
                    cancellationType: data.cancellationType,
                });
            }
            else {
                this.logger.debug('No medical record found for cancelled appointment', {
                    appointmentId: data.appointmentId,
                    patientId: data.patientId,
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to process appointment cancelled', {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Map service type to medical record type
     */
    mapServiceTypeToRecordType(serviceType) {
        switch (serviceType) {
            case 'consultation':
                return 'outpatient';
            case 'procedure':
                return 'procedure';
            case 'follow_up':
                return 'follow_up';
            default:
                return 'outpatient';
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
            this.logger.info('Appointment event consumer disconnected successfully');
        }
        catch (error) {
            this.logger.error('Error disconnecting appointment event consumer', {
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
exports.AppointmentEventConsumer = AppointmentEventConsumer;
