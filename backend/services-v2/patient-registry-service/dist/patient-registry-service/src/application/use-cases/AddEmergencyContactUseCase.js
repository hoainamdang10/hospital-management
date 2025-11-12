"use strict";
/**
 * AddEmergencyContactUseCase - Application Layer
 * Add emergency contact to existing patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEmergencyContactUseCase = void 0;
const EmergencyContact_1 = require("../../domain/entities/EmergencyContact");
const PatientId_1 = require("../../domain/value-objects/PatientId");
/**
 * Use Case: Add Emergency Contact
 */
class AddEmergencyContactUseCase {
    constructor(patientRepository, eventBus, logger, auditService) {
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
        this.auditService = auditService;
    }
    async execute(command) {
        this.logger.info('Starting add emergency contact', {
            patientId: command.patientId,
            performedBy: command.performedBy,
        });
        // 1. Validate input
        if (!command.patientId || command.patientId.trim().length === 0) {
            throw new Error('Patient ID không được để trống');
        }
        if (!command.name || command.name.trim().length === 0) {
            throw new Error('Tên người liên hệ không được để trống');
        }
        if (!command.relationship || command.relationship.trim().length === 0) {
            throw new Error('Mối quan hệ không được để trống');
        }
        if (!command.primaryPhone || command.primaryPhone.trim().length === 0) {
            throw new Error('Số điện thoại không được để trống');
        }
        if (!command.performedBy || command.performedBy.trim().length === 0) {
            throw new Error('Người thực hiện không được để trống');
        }
        // 2. Find patient
        const patientId = PatientId_1.PatientId.create(command.patientId);
        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new Error(`Không tìm thấy bệnh nhân với ID: ${command.patientId}`);
        }
        // 3. Create emergency contact
        const contact = EmergencyContact_1.EmergencyContact.create(command.name, command.relationship, command.primaryPhone, command.secondaryPhone, command.email, command.address, command.isPrimary || false);
        // 4. Add to patient
        patient.addEmergencyContact(contact, command.performedBy);
        // 5. Save patient
        await this.patientRepository.save(patient);
        // 6. Publish domain events
        await this.publishDomainEvents(patient);
        // 7. HIPAA audit logging
        await this.auditEmergencyContactAdded(patient, command, contact);
        this.logger.info('Emergency contact added successfully', {
            patientId: command.patientId,
            contactId: contact.getId(),
            performedBy: command.performedBy,
        });
        return {
            success: true,
            contactId: contact.getId(),
            message: 'Đã thêm người liên hệ khẩn cấp thành công',
        };
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
            this.logger.warn('Event publishing failed, but emergency contact was added', {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    /**
     * HIPAA audit logging for emergency contact addition
     */
    async auditEmergencyContactAdded(patient, command, contact) {
        try {
            await this.auditService.log({
                userId: command.performedBy,
                action: 'EMERGENCY_CONTACT_ADDED',
                resource: 'patient_emergency_contacts',
                resourceId: patient.getPatientId() || undefined,
                details: {
                    contactId: contact.getId(),
                    contactName: contact.name,
                    relationship: contact.relationship,
                    complianceLevel: 'HIPAA',
                    timestamp: new Date().toISOString(),
                },
            });
            this.logger.info('HIPAA Audit: Emergency contact added', {
                action: 'EMERGENCY_CONTACT_ADDED',
                patientId: patient.getPatientId(),
                contactId: contact.getId(),
                performedBy: command.performedBy,
            });
        }
        catch (error) {
            this.logger.error('Failed to log HIPAA audit', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId: patient.getPatientId(),
                action: 'EMERGENCY_CONTACT_ADDED',
            });
        }
    }
}
exports.AddEmergencyContactUseCase = AddEmergencyContactUseCase;
//# sourceMappingURL=AddEmergencyContactUseCase.js.map