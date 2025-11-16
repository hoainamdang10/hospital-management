"use strict";
/**
 * MergePatientsUseCase - Application Use Case
 *
 * Merges duplicate patient into master patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR, PMI Best Practices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergePatientsUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class MergePatientsUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(request) {
        try {
            // 1. Validate input
            if (request.duplicatePatientId === request.masterPatientId) {
                return {
                    success: false,
                    message: 'Không thể merge bệnh nhân với chính nó',
                    errors: ['SAME_PATIENT']
                };
            }
            // 2. Find duplicate patient
            const duplicatePatientId = PatientId_1.PatientId.create(request.duplicatePatientId);
            const duplicatePatient = await this.patientRepository.findById(duplicatePatientId);
            if (!duplicatePatient) {
                return {
                    success: false,
                    message: 'Không tìm thấy bệnh nhân trùng lặp',
                    errors: ['DUPLICATE_PATIENT_NOT_FOUND']
                };
            }
            // 3. Find master patient
            const masterPatientId = PatientId_1.PatientId.create(request.masterPatientId);
            const masterPatient = await this.patientRepository.findById(masterPatientId);
            if (!masterPatient) {
                return {
                    success: false,
                    message: 'Không tìm thấy bệnh nhân chính',
                    errors: ['MASTER_PATIENT_NOT_FOUND']
                };
            }
            // 4. Check if duplicate patient is already merged (check before isActive)
            if (duplicatePatient.isMerged()) {
                return {
                    success: false,
                    message: 'Bệnh nhân trùng lặp đã được merge trước đó',
                    errors: ['SOURCE_ALREADY_MERGED']
                };
            }
            // 5. Check if duplicate patient is deceased
            if (duplicatePatient.isDeceased()) {
                return {
                    success: false,
                    message: 'Bệnh nhân trùng lặp đã qua đời',
                    errors: ['SOURCE_DECEASED']
                };
            }
            // 6. Validate patients are active
            if (!duplicatePatient.isActive()) {
                return {
                    success: false,
                    message: 'Bệnh nhân trùng lặp không hoạt động',
                    errors: ['PATIENT_INACTIVE']
                };
            }
            if (!masterPatient.isActive()) {
                return {
                    success: false,
                    message: 'Bệnh nhân chính không hoạt động',
                    errors: ['MASTER_PATIENT_NOT_ACTIVE']
                };
            }
            // 7. Merge duplicate patient into master patient
            duplicatePatient.mergeInto(masterPatientId, request.reason, request.performedBy);
            // 8. Save duplicate patient (now marked as 'merged')
            await this.patientRepository.save(duplicatePatient);
            // 9. Return success response
            return {
                success: true,
                message: 'Đã merge bệnh nhân thành công',
                data: {
                    duplicatePatientId: request.duplicatePatientId,
                    masterPatientId: request.masterPatientId,
                    mergedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                return {
                    success: false,
                    message: 'Merge bệnh nhân thất bại',
                    errors: ['MERGE_FAILED', error.message]
                };
            }
            // Handle unexpected errors
            return {
                success: false,
                message: 'Đã xảy ra lỗi không mong muốn',
                errors: ['UNEXPECTED_ERROR']
            };
        }
    }
}
exports.MergePatientsUseCase = MergePatientsUseCase;
//# sourceMappingURL=MergePatientsUseCase.js.map