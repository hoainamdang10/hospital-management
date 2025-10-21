"use strict";
/**
 * MedicalRecordDomainEventHandler - Domain Event Handler
 * Handles domain events from Medical Record Aggregate
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordDomainEventHandler = void 0;
/**
 * Domain Event Handler for Medical Record Events
 * Follows pattern from SchedulingEventHandler
 */
class MedicalRecordDomainEventHandler {
    constructor(config) {
        this.logger = config.logger;
        this.auditService = config.auditService;
        this.eventBus = config.eventBus;
    }
    /**
     * Handle domain events
     */
    async handle(event) {
        try {
            this.logger.info('Processing medical record domain event', {
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                eventId: event.eventId
            });
            switch (event.eventType) {
                case 'MedicalRecordCreated':
                    await this.handleMedicalRecordCreated(event);
                    break;
                case 'MedicalRecordUpdated':
                    await this.handleMedicalRecordUpdated(event);
                    break;
                default:
                    this.logger.warn('Unknown domain event type', {
                        eventType: event.eventType,
                        eventId: event.eventId
                    });
            }
        }
        catch (error) {
            this.logger.error('Error processing medical record domain event', {
                eventType: event.eventType,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle MedicalRecordCreated event
     */
    async handleMedicalRecordCreated(event) {
        try {
            this.logger.info('Handling MedicalRecordCreated event', {
                recordId: event.recordId,
                patientId: event.patientId,
                doctorId: event.doctorId
            });
            // 1. HIPAA Audit Logging
            await this.auditService.logMedicalRecordAccess('CREATE', event.recordId, event.createdBy, 'Medical record created', {
                patientId: event.patientId,
                doctorId: event.doctorId,
                appointmentId: event.appointmentId,
                eventId: event.eventId
            });
            // 2. Publish integration event for other services
            const integrationEvent = {
                eventId: `medical-record-created-${Date.now()}`,
                eventType: 'medical-record.created',
                aggregateId: event.recordId,
                aggregateType: 'MedicalRecord',
                occurredAt: new Date(),
                serviceName: 'clinical-emr-service',
                eventData: {
                    recordId: event.recordId,
                    patientId: event.patientId,
                    doctorId: event.doctorId,
                    appointmentId: event.appointmentId,
                    visitDate: event.visitDate,
                    symptoms: event.symptoms,
                    diagnosis: event.diagnosis,
                    createdBy: event.createdBy,
                    createdAt: event.createdAt
                },
                metadata: {
                    priority: 'high',
                    complianceLevel: 'hipaa',
                    containsPHI: true,
                    patientId: event.patientId,
                    eventCategory: 'clinical',
                    eventSubcategory: 'medical_record',
                    vietnameseDescription: 'Hồ sơ bệnh án mới được tạo'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Trigger follow-up actions if needed
            if (event.appointmentId) {
                // Notify appointment service that medical record is created
                const appointmentNotificationEvent = {
                    eventId: `appointment-medical-record-${Date.now()}`,
                    eventType: 'appointment.medical-record-created',
                    aggregateId: event.appointmentId,
                    aggregateType: 'Appointment',
                    occurredAt: new Date(),
                    serviceName: 'clinical-emr-service',
                    eventData: {
                        appointmentId: event.appointmentId,
                        recordId: event.recordId,
                        patientId: event.patientId,
                        doctorId: event.doctorId
                    }
                };
                await this.eventBus.publish(appointmentNotificationEvent);
            }
            this.logger.info('MedicalRecordCreated event processed successfully', {
                recordId: event.recordId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling MedicalRecordCreated event', {
                recordId: event.recordId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle MedicalRecordUpdated event
     */
    async handleMedicalRecordUpdated(event) {
        try {
            this.logger.info('Handling MedicalRecordUpdated event', {
                recordId: event.recordId,
                patientId: event.patientId,
                updatedFields: event.updatedFields
            });
            // 1. HIPAA Audit Logging
            await this.auditService.logMedicalRecordAccess('UPDATE', event.recordId, event.updatedBy, 'Medical record updated', {
                patientId: event.patientId,
                doctorId: event.doctorId,
                updatedFields: event.updatedFields,
                updateReason: event.updateReason,
                eventId: event.eventId
            });
            // 2. Publish integration event for other services
            const integrationEvent = {
                eventId: `medical-record-updated-${Date.now()}`,
                eventType: 'medical-record.updated',
                aggregateId: event.recordId,
                aggregateType: 'MedicalRecord',
                occurredAt: new Date(),
                serviceName: 'clinical-emr-service',
                eventData: {
                    recordId: event.recordId,
                    patientId: event.patientId,
                    doctorId: event.doctorId,
                    updatedFields: event.updatedFields,
                    previousValues: event.previousValues,
                    newValues: event.newValues,
                    updatedBy: event.updatedBy,
                    updatedAt: event.updatedAt,
                    updateReason: event.updateReason
                },
                metadata: {
                    priority: 'normal',
                    complianceLevel: 'hipaa',
                    containsPHI: true,
                    patientId: event.patientId,
                    eventCategory: 'clinical',
                    eventSubcategory: 'medical_record_update',
                    vietnameseDescription: 'Hồ sơ bệnh án được cập nhật'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Check for critical updates that need immediate attention
            const criticalFields = ['diagnosis', 'medications', 'status'];
            const hasCriticalUpdate = event.updatedFields.some(field => criticalFields.includes(field));
            if (hasCriticalUpdate) {
                const criticalUpdateEvent = {
                    eventId: `medical-record-critical-update-${Date.now()}`,
                    eventType: 'medical-record.critical-update',
                    aggregateId: event.recordId,
                    aggregateType: 'MedicalRecord',
                    occurredAt: new Date(),
                    serviceName: 'clinical-emr-service',
                    eventData: {
                        recordId: event.recordId,
                        patientId: event.patientId,
                        doctorId: event.doctorId,
                        criticalFields: event.updatedFields.filter(field => criticalFields.includes(field)),
                        updatedBy: event.updatedBy
                    },
                    metadata: {
                        priority: 'urgent',
                        requiresNotification: true
                    }
                };
                await this.eventBus.publish(criticalUpdateEvent);
            }
            this.logger.info('MedicalRecordUpdated event processed successfully', {
                recordId: event.recordId,
                eventId: event.eventId,
                hasCriticalUpdate
            });
        }
        catch (error) {
            this.logger.error('Error handling MedicalRecordUpdated event', {
                recordId: event.recordId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Check if handler can handle the event type
     */
    canHandle(eventType) {
        return ['MedicalRecordCreated', 'MedicalRecordUpdated'].includes(eventType);
    }
    /**
     * Get handler status
     */
    getStatus() {
        return {
            handlerName: 'MedicalRecordDomainEventHandler',
            supportedEvents: ['MedicalRecordCreated', 'MedicalRecordUpdated'],
            isHealthy: true,
            lastProcessedAt: new Date().toISOString()
        };
    }
}
exports.MedicalRecordDomainEventHandler = MedicalRecordDomainEventHandler;
//# sourceMappingURL=MedicalRecordDomainEventHandler.js.map