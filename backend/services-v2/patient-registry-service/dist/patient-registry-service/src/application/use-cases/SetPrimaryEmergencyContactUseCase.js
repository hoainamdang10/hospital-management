"use strict";
/**
 * SetPrimaryEmergencyContactUseCase - Application Layer
 * Set emergency contact as primary
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetPrimaryEmergencyContactUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
/**
 * Use Case: Set Primary Emergency Contact
 */
class SetPrimaryEmergencyContactUseCase {
    constructor(patientRepository, eventBus, logger) {
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async execute(command) {
        this.logger.info('Setting primary emergency contact', {
            patientId: command.patientId,
            contactId: command.contactId,
            performedBy: command.performedBy
        });
        try {
            // 1. Validate input
            if (!command.patientId || command.patientId.trim().length === 0) {
                return {
                    success: false,
                    message: 'Patient ID không được để trống',
                    errors: ['INVALID_PATIENT_ID']
                };
            }
            if (!command.contactId || command.contactId.trim().length === 0) {
                return {
                    success: false,
                    message: 'Contact ID không được để trống',
                    errors: ['INVALID_CONTACT_ID']
                };
            }
            if (!command.performedBy || command.performedBy.trim().length === 0) {
                return {
                    success: false,
                    message: 'Người thực hiện không được để trống',
                    errors: ['INVALID_PERFORMED_BY']
                };
            }
            // 2. Find patient
            const patientId = PatientId_1.PatientId.create(command.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
                    errors: ['PATIENT_NOT_FOUND']
                };
            }
            // 3. Get all emergency contacts
            const contacts = patient.getEmergencyContacts();
            const targetContact = contacts.find(c => c.getId() === command.contactId);
            if (!targetContact) {
                return {
                    success: false,
                    message: `Không tìm thấy người liên hệ khẩn cấp với ID: ${command.contactId}`,
                    errors: ['CONTACT_NOT_FOUND']
                };
            }
            // 4. Remove primary flag from all contacts
            contacts.forEach(contact => {
                if (contact.isPrimary) {
                    contact.removePrimary();
                }
            });
            // 5. Set target contact as primary
            targetContact.setPrimary();
            // 6. Save patient (emergency contact is part of patient aggregate)
            await this.patientRepository.save(patient);
            // 7. Publish domain events
            await this.publishDomainEvents(patient);
            this.logger.info('Primary emergency contact set successfully', {
                patientId: command.patientId,
                contactId: command.contactId,
                performedBy: command.performedBy
            });
            return {
                success: true,
                message: 'Đặt người liên hệ khẩn cấp chính thành công'
            };
        }
        catch (error) {
            this.logger.error('Error setting primary emergency contact', {
                patientId: command.patientId,
                contactId: command.contactId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi khi đặt người liên hệ khẩn cấp chính',
                errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
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
            this.logger.warn('Event publishing failed, but primary contact was set', {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.SetPrimaryEmergencyContactUseCase = SetPrimaryEmergencyContactUseCase;
//# sourceMappingURL=SetPrimaryEmergencyContactUseCase.js.map