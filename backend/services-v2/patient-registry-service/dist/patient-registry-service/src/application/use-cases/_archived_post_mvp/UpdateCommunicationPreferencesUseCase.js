"use strict";
/**
 * UpdateCommunicationPreferencesUseCase - Application Layer
 * Updates patient communication preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (communication field)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCommunicationPreferencesUseCase = void 0;
const PatientId_1 = require("../../../domain/value-objects/PatientId");
const CommunicationPreference_1 = require("../../../domain/value-objects/CommunicationPreference");
class UpdateCommunicationPreferencesUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(command) {
        // Validate input
        if (!command.patientId || command.patientId.trim() === "") {
            throw new Error("ID bệnh nhân không được để trống");
        }
        // Find patient
        const patientId = PatientId_1.PatientId.fromString(command.patientId);
        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new Error("Không tìm thấy bệnh nhân");
        }
        // Create communication preference
        const preference = CommunicationPreference_1.CommunicationPreference.create({
            language: command.language,
            preferred: command.preferred,
            contactMethod: command.contactMethod,
            timezone: command.timezone,
        });
        // Update patient
        patient.updateCommunicationPreference(preference, command.updatedBy);
        // Save patient
        await this.patientRepository.save(patient);
        return {
            success: true,
            message: "Cập nhật tùy chọn liên hệ thành công",
            preference: preference.toDTO(),
        };
    }
}
exports.UpdateCommunicationPreferencesUseCase = UpdateCommunicationPreferencesUseCase;
//# sourceMappingURL=UpdateCommunicationPreferencesUseCase.js.map