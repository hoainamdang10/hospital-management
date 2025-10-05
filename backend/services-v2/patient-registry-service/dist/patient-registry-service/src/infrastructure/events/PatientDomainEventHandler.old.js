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
 * Simplified implementation - full event bus integration pending
 */
class PatientDomainEventHandler {
    constructor(config) {
        this.logger = config.logger;
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
                case 'PatientMerged':
                    await this.handlePatientMerged(event);
                    break;
                case 'PatientLinked':
                    await this.handlePatientLinked(event);
                    break;
                case 'PatientDeactivated':
                    await this.handlePatientDeactivated(event);
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
                patientId: event.patient.getPatientId(),
                userId: event.patient.getUserId(),
                fullName: event.patient.getPersonalInfo().fullName
            });
            // Event handling simplified - full audit/event bus integration pending
            const patientId = event.patient.getPatientId() || '';
            const personalInfo = event.patient.getPersonalInfo();
            this.logger.info('Patient registered event processed', {
                patientId,
                fullName: personalInfo.fullName
            });
            // TODO: Implement event bus integration when infrastructure is ready
            // 2. Publish integration event for other services
            // const integrationEvent = {
            //   eventId: `patient-registered-${Date.now()}`,
            //   eventType: 'patient.registered',
            //   aggregateId: patientId,
            //   aggregateType: 'Patient',
            //   occurredAt: new Date(),
            //   serviceName: 'patient-registry-service',
            //   eventData: {
            //     patientId,
            //     userId: event.patient.getUserId(),
            //     fullName: personalInfo.fullName,
            //     dateOfBirth: personalInfo.dateOfBirth,
            //     gender: personalInfo.gender,
            //     nationalId: personalInfo.nationalId
            //   },
            //   metadata: {
            //     priority: 'normal',
            //     complianceLevel: 'hipaa',
            //     containsPHI: true,
            //     eventCategory: 'patient_registry',
            //     eventSubcategory: 'patient_registration',
            //     vietnameseDescription: 'Bệnh nhân mới được đăng ký vào hệ thống'
            //   }
            // };
            // await this.eventBus.publish(integrationEvent);
            this.logger.info('PatientRegistered event processed successfully', {
                patientId,
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
     * Handle PatientMerged event
     */
    async handlePatientMerged(event) {
        try {
            this.logger.info('Handling PatientMerged event', {
                patientId: event.patientId,
                masterPatientId: event.masterPatientId,
                reason: event.reason,
                performedBy: event.performedBy
            });
            // 1. HIPAA audit logging
            await this.auditService.logUserAccess('MERGE', event.patientId, event.performedBy, 'Patient merged into master record', {
                masterPatientId: event.masterPatientId,
                reason: event.reason,
                eventId: event.eventId
            });
            // 2. Publish integration event
            const integrationEvent = {
                eventId: `patient-merged-${Date.now()}`,
                eventType: 'patient.merged',
                aggregateId: event.patientId,
                aggregateType: 'Patient',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    masterPatientId: event.masterPatientId,
                    reason: event.reason,
                    performedBy: event.performedBy,
                    mergedAt: event.mergedAt
                },
                metadata: {
                    priority: 'high',
                    complianceLevel: 'hipaa',
                    containsPHI: true,
                    eventCategory: 'patient_registry',
                    eventSubcategory: 'patient_merge',
                    vietnameseDescription: 'Bệnh nhân được gộp vào hồ sơ chính'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Notify Clinical EMR service to merge medical records
            const clinicalMergeEvent = {
                eventId: `clinical-merge-${Date.now()}`,
                eventType: 'clinical.patient-merged',
                aggregateId: event.masterPatientId,
                aggregateType: 'MedicalRecord',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    duplicatePatientId: event.patientId,
                    masterPatientId: event.masterPatientId,
                    requiresMerge: true,
                    reason: event.reason
                },
                metadata: {
                    priority: 'high',
                    eventCategory: 'clinical_emr',
                    eventSubcategory: 'record_merge'
                }
            };
            await this.eventBus.publish(clinicalMergeEvent);
            this.logger.info('PatientMerged event processed successfully', {
                patientId: event.patientId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling PatientMerged event', {
                patientId: event.patientId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle PatientLinked event
     */
    async handlePatientLinked(event) {
        try {
            this.logger.info('Handling PatientLinked event', {
                patientId: event.patientId,
                otherPatientId: event.otherPatientId,
                linkType: event.linkType,
                performedBy: event.performedBy
            });
            // 1. HIPAA audit logging
            await this.auditService.logUserAccess('LINK', event.patientId, event.performedBy, 'Patient linked to another patient', {
                otherPatientId: event.otherPatientId,
                linkType: event.linkType,
                eventId: event.eventId
            });
            // 2. Publish integration event
            const integrationEvent = {
                eventId: `patient-linked-${Date.now()}`,
                eventType: 'patient.linked',
                aggregateId: event.patientId,
                aggregateType: 'Patient',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    otherPatientId: event.otherPatientId,
                    linkType: event.linkType,
                    performedBy: event.performedBy,
                    linkedAt: event.linkedAt
                },
                metadata: {
                    priority: 'normal',
                    eventCategory: 'patient_registry',
                    eventSubcategory: 'patient_link',
                    vietnameseDescription: 'Bệnh nhân được liên kết với bệnh nhân khác'
                }
            };
            await this.eventBus.publish(integrationEvent);
            this.logger.info('PatientLinked event processed successfully', {
                patientId: event.patientId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling PatientLinked event', {
                patientId: event.patientId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle PatientDeactivated event
     */
    async handlePatientDeactivated(event) {
        try {
            this.logger.info('Handling PatientDeactivated event', {
                patientId: event.patientId,
                reason: event.reason,
                performedBy: event.performedBy
            });
            // 1. HIPAA audit logging
            await this.auditService.logUserAccess('DEACTIVATE', event.patientId, event.performedBy, 'Patient deactivated', {
                reason: event.reason,
                eventId: event.eventId
            });
            // 2. Publish integration event
            const integrationEvent = {
                eventId: `patient-deactivated-${Date.now()}`,
                eventType: 'patient.deactivated',
                aggregateId: event.patientId,
                aggregateType: 'Patient',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    reason: event.reason,
                    performedBy: event.performedBy,
                    deactivatedAt: event.deactivatedAt
                },
                metadata: {
                    priority: 'high',
                    complianceLevel: 'hipaa',
                    eventCategory: 'patient_registry',
                    eventSubcategory: 'patient_deactivation',
                    vietnameseDescription: 'Bệnh nhân bị vô hiệu hóa'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Notify other services to handle deactivation
            const servicesNotificationEvent = {
                eventId: `services-patient-deactivated-${Date.now()}`,
                eventType: 'services.patient-deactivated',
                aggregateId: event.patientId,
                aggregateType: 'Patient',
                occurredAt: new Date(),
                serviceName: 'patient-registry-service',
                eventData: {
                    patientId: event.patientId,
                    requiresCleanup: true,
                    reason: event.reason
                }
            };
            await this.eventBus.publish(servicesNotificationEvent);
            this.logger.info('PatientDeactivated event processed successfully', {
                patientId: event.patientId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling PatientDeactivated event', {
                patientId: event.patientId,
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
        return [
            'PatientRegistered',
            'PatientUpdated',
            'PatientConsentGranted',
            'PatientMerged',
            'PatientLinked',
            'PatientDeactivated'
        ].includes(eventType);
    }
    /**
     * Get handler status
     */
    getStatus() {
        return {
            handlerName: 'PatientDomainEventHandler',
            supportedEvents: [
                'PatientRegistered',
                'PatientUpdated',
                'PatientConsentGranted',
                'PatientMerged',
                'PatientLinked',
                'PatientDeactivated'
            ],
            isHealthy: true,
            lastProcessedAt: new Date().toISOString()
        };
    }
}
exports.PatientDomainEventHandler = PatientDomainEventHandler;
//# sourceMappingURL=PatientDomainEventHandler.old.js.map