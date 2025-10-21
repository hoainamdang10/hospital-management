"use strict";
/**
 * GetEmergencyContactsUseCase - Application Layer
 * Get all emergency contacts for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmergencyContactsUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
/**
 * Use Case: Get Emergency Contacts
 */
class GetEmergencyContactsUseCase {
    constructor(patientRepository, logger) {
        this.patientRepository = patientRepository;
        this.logger = logger;
    }
    async execute(command) {
        this.logger.info('Getting emergency contacts', {
            patientId: command.patientId,
            requestedBy: command.requestedBy
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
            if (!command.requestedBy || command.requestedBy.trim().length === 0) {
                return {
                    success: false,
                    message: 'Người yêu cầu không được để trống',
                    errors: ['INVALID_REQUESTED_BY']
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
            // 3. Get emergency contacts
            const contacts = patient.getEmergencyContacts();
            // 4. Map to DTOs
            const contactDTOs = contacts.map(contact => ({
                id: contact.getId(),
                name: contact.name,
                relationship: contact.relationship,
                primaryPhone: contact.primaryPhone,
                secondaryPhone: contact.secondaryPhone,
                email: contact.email,
                address: contact.address,
                isPrimary: contact.isPrimary,
                isActive: contact.isActive,
                createdAt: contact.createdAt,
                updatedAt: contact.updatedAt
            }));
            this.logger.info('Emergency contacts retrieved successfully', {
                patientId: command.patientId,
                contactCount: contactDTOs.length
            });
            return {
                success: true,
                data: {
                    patientId: command.patientId,
                    contacts: contactDTOs,
                    totalCount: contactDTOs.length
                },
                message: 'Lấy danh sách người liên hệ khẩn cấp thành công'
            };
        }
        catch (error) {
            this.logger.error('Error getting emergency contacts', {
                patientId: command.patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách người liên hệ khẩn cấp',
                errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
            };
        }
    }
}
exports.GetEmergencyContactsUseCase = GetEmergencyContactsUseCase;
//# sourceMappingURL=GetEmergencyContactsUseCase.js.map