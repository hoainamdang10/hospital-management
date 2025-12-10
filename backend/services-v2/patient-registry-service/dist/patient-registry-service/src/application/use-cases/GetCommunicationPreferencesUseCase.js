"use strict";
/**
 * GetCommunicationPreferencesUseCase - Application Layer
 * Retrieves patient communication preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (communication field)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCommunicationPreferencesUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class GetCommunicationPreferencesUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(query) {
        // Validate input
        if (!query.patientId || query.patientId.trim() === '') {
            throw new Error('ID bệnh nhân không được để trống');
        }
        // Find patient
        const patientId = PatientId_1.PatientId.fromString(query.patientId);
        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new Error('Không tìm thấy bệnh nhân');
        }
        // Get communication preference
        const preference = patient.getCommunicationPreference();
        if (!preference) {
            return {
                hasPreference: false,
                preference: null,
            };
        }
        return {
            hasPreference: true,
            preference: preference.toDTO(),
        };
    }
}
exports.GetCommunicationPreferencesUseCase = GetCommunicationPreferencesUseCase;
//# sourceMappingURL=GetCommunicationPreferencesUseCase.js.map