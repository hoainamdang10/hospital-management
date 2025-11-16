"use strict";
/**
 * GetPatientPhotoUseCase - Application Layer
 * Retrieves patient photo URL
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (photo field)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientPhotoUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class GetPatientPhotoUseCase {
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
        // Get photo URL
        const photoUrl = patient.getPhotoUrl();
        return {
            photoUrl: photoUrl || null,
            hasPhoto: !!photoUrl
        };
    }
}
exports.GetPatientPhotoUseCase = GetPatientPhotoUseCase;
//# sourceMappingURL=GetPatientPhotoUseCase.js.map