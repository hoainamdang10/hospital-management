"use strict";
/**
 * ReactivatePatientUseCase - Application Layer
 * Reactivate inactive patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactivatePatientUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
/**
 * Use Case: Reactivate Patient
 */
class ReactivatePatientUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(command) {
        // 1. Validate input
        if (!command.patientId || command.patientId.trim().length === 0) {
            throw new Error("Patient ID không được để trống");
        }
        if (!command.reason || command.reason.trim().length === 0) {
            throw new Error("Lý do kích hoạt lại không được để trống");
        }
        if (!command.performedBy || command.performedBy.trim().length === 0) {
            throw new Error("Người thực hiện không được để trống");
        }
        // 2. Find patient
        const patientId = PatientId_1.PatientId.create(command.patientId);
        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new Error(`Không tìm thấy bệnh nhân với ID: ${command.patientId}`);
        }
        // 3. Reactivate patient
        patient.reactivate(command.reason, command.performedBy, {
            allowDeceased: command.allowDeceasedReactivate === true,
        });
        // 4. Save patient
        await this.patientRepository.save(patient);
        return {
            success: true,
            message: "Đã kích hoạt lại bệnh nhân thành công",
        };
    }
}
exports.ReactivatePatientUseCase = ReactivatePatientUseCase;
//# sourceMappingURL=ReactivatePatientUseCase.js.map