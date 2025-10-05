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
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(command) {
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
        return {
            success: true,
            contactId: contact.getId(),
            message: 'Đã thêm người liên hệ khẩn cấp thành công'
        };
    }
}
exports.AddEmergencyContactUseCase = AddEmergencyContactUseCase;
//# sourceMappingURL=AddEmergencyContactUseCase.js.map