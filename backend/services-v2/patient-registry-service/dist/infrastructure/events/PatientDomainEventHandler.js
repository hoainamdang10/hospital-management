"use strict";
/**
 * PatientDomainEventHandler - Domain Event Handler
 * V2 Clean Architecture + DDD Implementation
 * Handles domain events from Patient Aggregate with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientDomainEventHandler = void 0;
/**
 * Domain Event Handler for Patient Events
 * Follows pattern from other V2 services
 */
class PatientDomainEventHandler {
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
            this.logger.info('Processing patient domain event', {
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                eventId: event.eventId
            });
            switch (event.eventType) {
                case 'PatientRegistered':
                    await this.handlePatientRegistered(event);
                    break;
                case 'PatientUpdated':
                    await this.handlePatientUpdated(event);
                    break;
                case 'PatientConsentGranted':
                    await this.handlePatientConsentGranted(event);
                    break;
                default:
                    this.logger.warn('Unknown patient domain event type', {
                        eventType: event.eventType,
                        eventId: event.eventId
                    });
            }
        }
        catch (error) {
            this.logger.error('Error processing patient domain event', {
                eventType: event.eventType,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle PatientRegistered event
     */
    async handlePatientRegistered(event) {
        try {
            this.logger.info('Handling PatientRegistered event', {
                patientId: event.patientId,
                userId: event.userId,
                fullName: event.personalInfo.fullName
            });
            // 1. HIPAA audit logging
            await this.auditService.logUserAccess('CREATE', event.patientId, 'SYSTEM', 'Patient registered in system', {
                userId: event.userId,
                fullName: event.personalInfo.fullName,
                eventId: event.eventId
            });
            // 2. Publish integration event for other services
            const integrationEvent = {
                eventId: `patient-registered-${Date.now()}`,
                eventType: 'patient.registered',
                aggregateId: event.patientId,
                aggregateType: 'Patient',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    userId: event.userId,
                    fullName: event.personalInfo.fullName,
                    dateOfBirth: event.personalInfo.dateOfBirth,
                    gender: event.personalInfo.gender,
                    nationalId: event.personalInfo.nationalId,
                    phoneNumber: event.personalInfo.phoneNumber,
                    registrationDate: event.registrationDate
                },
                metadata: {
                    priority: 'normal',
                    complianceLevel: 'hipaa',
                    containsPHI: true,
                    eventCategory: 'patient_registry',
                    eventSubcategory: 'patient_registration',
                    vietnameseDescription: 'Bệnh nhân mới được đăng ký vào hệ thống'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Trigger follow-up actions
            // Notify identity service about patient registration
            const identityNotificationEvent = {
                eventId: `identity-patient-registered-${Date.now()}`,
                eventType: 'identity.patient-registered',
                aggregateId: event.userId,
                aggregateType: 'User',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    userId: event.userId,
                    patientId: event.patientId,
                    registrationComplete: true
                }
            };
            await this.eventBus.publish(identityNotificationEvent);
            // Notify notifications service for welcome message
            const welcomeNotificationEvent = {
                eventId: `welcome-notification-${Date.now()}`,
                eventType: 'notification.patient-welcome',
                aggregateId: event.patientId,
                aggregateType: 'Notification',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    userId: event.userId,
                    fullName: event.personalInfo.fullName,
                    phoneNumber: event.personalInfo.phoneNumber,
                    notificationType: 'welcome_patient',
                    priority: 'normal'
                }
            };
            await this.eventBus.publish(welcomeNotificationEvent);
            // Notify clinical EMR service for medical record initialization
            const medicalRecordInitEvent = {
                eventId: `medical-record-init-${Date.now()}`,
                eventType: 'clinical.patient-registered',
                aggregateId: event.patientId,
                aggregateType: 'MedicalRecord',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    userId: event.userId,
                    personalInfo: event.personalInfo,
                    requiresInitialization: true
                }
            };
            await this.eventBus.publish(medicalRecordInitEvent);
            this.logger.info('PatientRegistered event processed successfully', {
                patientId: event.patientId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling PatientRegistered event', {
                patientId: event.patientId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle PatientUpdated event
     */
    async handlePatientUpdated(event) {
        try {
            this.logger.info('Handling PatientUpdated event', {
                patientId: event.patientId,
                updatedFields: event.updatedFields,
                updatedBy: event.updatedBy
            });
            // 1. HIPAA audit logging
            await this.auditService.logUserAccess('UPDATE', event.patientId, event.updatedBy, 'Patient information updated', {
                updatedFields: event.updatedFields,
                updateReason: event.updateReason,
                eventId: event.eventId
            });
            // 2. Publish integration event
            const integrationEvent = {
                eventId: `patient-updated-${Date.now()}`,
                eventType: 'patient.updated',
                aggregateId: event.patientId,
                aggregateType: 'Patient',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    updatedFields: event.updatedFields,
                    updatedBy: event.updatedBy,
                    updateReason: event.updateReason,
                    updatedAt: event.updatedAt
                },
                metadata: {
                    priority: 'normal',
                    complianceLevel: 'hipaa',
                    containsPHI: true,
                    eventCategory: 'patient_registry',
                    eventSubcategory: 'patient_update',
                    vietnameseDescription: 'Thông tin bệnh nhân được cập nhật'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Notify other services if critical information changed
            if (this.hasCriticalInfoChanges(event.updatedFields)) {
                const criticalUpdateEvent = {
                    eventId: `patient-critical-update-${Date.now()}`,
                    eventType: 'patient.critical-info-updated',
                    aggregateId: event.patientId,
                    aggregateType: 'Patient',
                    occurredAt: new Date(),
                    serviceName: 'patient-registry-service',
                    eventData: {
                        patientId: event.patientId,
                        criticalFields: event.updatedFields.filter(field => ['personalInfo', 'contactInfo', 'emergencyContacts'].includes(field)),
                        updatedBy: event.updatedBy
                    },
                    metadata: {
                        priority: 'high',
                        eventCategory: 'patient_registry',
                        eventSubcategory: 'critical_update'
                    }
                };
                await this.eventBus.publish(criticalUpdateEvent);
            }
            this.logger.info('PatientUpdated event processed successfully', {
                patientId: event.patientId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling PatientUpdated event', {
                patientId: event.patientId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle PatientConsentGranted event
     */
    async handlePatientConsentGranted(event) {
        try {
            this.logger.info('Handling PatientConsentGranted event', {
                patientId: event.patientId,
                consentType: event.consentType,
                grantedBy: event.grantedBy
            });
            // 1. HIPAA audit logging
            await this.auditService.logUserAccess('CONSENT_GRANTED', event.patientId, event.grantedBy, 'Patient consent granted', {
                consentType: event.consentType,
                consentDetails: event.consentDetails,
                eventId: event.eventId
            });
            // 2. Publish integration event
            const integrationEvent = {
                eventId: `patient-consent-granted-${Date.now()}`,
                eventType: 'patient.consent-granted',
                aggregateId: event.patientId,
                aggregateType: 'Patient',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    consentType: event.consentType,
                    consentDetails: event.consentDetails,
                    grantedBy: event.grantedBy,
                    grantedAt: event.grantedAt,
                    expiresAt: event.expiresAt
                },
                metadata: {
                    priority: 'high',
                    complianceLevel: 'hipaa',
                    eventCategory: 'patient_registry',
                    eventSubcategory: 'consent_management',
                    vietnameseDescription: 'Bệnh nhân đã cấp phép sử dụng thông tin'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Enable services based on consent type
            if (event.consentType === 'data_sharing') {
                const dataAccessEnabledEvent = {
                    eventId: `data-access-enabled-${Date.now()}`,
                    eventType: 'patient.data-access-enabled',
                    aggregateId: event.patientId,
                    aggregateType: 'Patient',
                    occurredAt: new Date(),
                    serviceName: 'patient-registry-service',
                    eventData: {
                        patientId: event.patientId,
                        accessLevel: 'full',
                        enabledBy: event.grantedBy
                    }
                };
                await this.eventBus.publish(dataAccessEnabledEvent);
            }
            this.logger.info('PatientConsentGranted event processed successfully', {
                patientId: event.patientId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling PatientConsentGranted event', {
                patientId: event.patientId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Check if updated fields contain critical information
     */
    hasCriticalInfoChanges(updatedFields) {
        const criticalFields = ['personalInfo', 'contactInfo', 'emergencyContacts', 'medicalInfo'];
        return updatedFields.some(field => criticalFields.includes(field));
    }
    /**
     * Check if handler can handle the event type
     */
    canHandle(eventType) {
        return ['PatientRegistered', 'PatientUpdated', 'PatientConsentGranted'].includes(eventType);
    }
    /**
     * Get handler status
     */
    getStatus() {
        return {
            handlerName: 'PatientDomainEventHandler',
            supportedEvents: ['PatientRegistered', 'PatientUpdated', 'PatientConsentGranted'],
            isHealthy: true,
            lastProcessedAt: new Date().toISOString()
        };
    }
}
exports.PatientDomainEventHandler = PatientDomainEventHandler;
//# sourceMappingURL=PatientDomainEventHandler.js.map