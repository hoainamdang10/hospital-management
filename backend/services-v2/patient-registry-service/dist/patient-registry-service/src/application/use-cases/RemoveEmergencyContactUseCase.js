"use strict";
/**
 * RemoveEmergencyContactUseCase - Application Layer
 * Remove emergency contact from patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveEmergencyContactUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
/**
 * Use Case: Remove Emergency Contact
 */
class RemoveEmergencyContactUseCase {
    constructor(patientRepository, eventBus, logger, auditService) {
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
        this.auditService = auditService;
    }
    async execute(command) {
        this.logger.info('Removing emergency contact', {
            patientId: command.patientId,
            contactId: command.contactId,
            performedBy: command.performedBy,
        });
        try {
            // 1. Validate input
            if (!command.patientId || command.patientId.trim().length === 0) {
                return {
                    success: false,
                    message: 'Patient ID không được để trống',
                    errors: ['INVALID_PATIENT_ID'],
                };
            }
            if (!command.contactId || command.contactId.trim().length === 0) {
                return {
                    success: false,
                    message: 'Contact ID không được để trống',
                    errors: ['INVALID_CONTACT_ID'],
                };
            }
            if (!command.performedBy || command.performedBy.trim().length === 0) {
                return {
                    success: false,
                    message: 'Người thực hiện không được để trống',
                    errors: ['INVALID_PERFORMED_BY'],
                };
            }
            // 2. Find patient
            const patientId = PatientId_1.PatientId.create(command.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
                    errors: ['PATIENT_NOT_FOUND'],
                };
            }
            // 3. Check if contact exists
            const contacts = patient.getEmergencyContacts();
            const contact = contacts.find((c) => c.getId() === command.contactId);
            if (!contact) {
                return {
                    success: false,
                    message: `Không tìm thấy người liên hệ khẩn cấp với ID: ${command.contactId}`,
                    errors: ['CONTACT_NOT_FOUND'],
                };
            }
            // 4. Remove contact from patient
            patient.removeEmergencyContact(command.contactId, command.performedBy);
            // 5. Save patient
            await this.patientRepository.save(patient);
            // 6. Publish domain events
            await this.publishDomainEvents(patient);
            // 7. HIPAA audit logging
            await this.auditEmergencyContactRemoved(patient, command, contact);
            this.logger.info('Emergency contact removed successfully', {
                patientId: command.patientId,
                contactId: command.contactId,
                performedBy: command.performedBy,
            });
            return {
                success: true,
                message: 'Xóa người liên hệ khẩn cấp thành công',
            };
        }
        catch (error) {
            this.logger.error('Error removing emergency contact', {
                patientId: command.patientId,
                contactId: command.contactId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                success: false,
                message: 'Lỗi khi xóa người liên hệ khẩn cấp',
                errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR'],
            };
        }
    }
    /**
     * Publish domain events
     */
    async publishDomainEvents(patient) {
        try {
            const events = patient.getUncommittedEvents();
            for (const event of events) {
                await this.eventBus.publish(event);
            }
            patient.markEventsAsCommitted();
        }
        catch (error) {
            this.logger.warn('Event publishing failed, but emergency contact was removed', {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * HIPAA audit logging for emergency contact removal
     */
    async auditEmergencyContactRemoved(patient, command, contact) {
        try {
            await this.auditService.log({
                userId: command.performedBy,
                action: 'EMERGENCY_CONTACT_REMOVED',
                resource: 'patient_emergency_contacts',
                resourceId: patient.getPatientId() || undefined,
                details: {
                    contactId: command.contactId,
                    contactName: contact.name,
                    relationship: contact.relationship,
                    complianceLevel: 'HIPAA',
                    timestamp: new Date().toISOString(),
                },
            });
            this.logger.info('HIPAA Audit: Emergency contact removed', {
                action: 'EMERGENCY_CONTACT_REMOVED',
                patientId: patient.getPatientId(),
                contactId: command.contactId,
                performedBy: command.performedBy,
            });
        }
        catch (error) {
            this.logger.error('Failed to log HIPAA audit', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId: patient.getPatientId(),
                action: 'EMERGENCY_CONTACT_REMOVED',
            });
        }
    }
}
exports.RemoveEmergencyContactUseCase = RemoveEmergencyContactUseCase;
//# sourceMappingURL=RemoveEmergencyContactUseCase.js.map