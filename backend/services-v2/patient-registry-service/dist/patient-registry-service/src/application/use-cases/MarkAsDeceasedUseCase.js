"use strict";
/**
 * MarkAsDeceasedUseCase - Application Layer
 * Mark patient as deceased
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkAsDeceasedUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
/**
 * Use Case: Mark Patient as Deceased
 */
class MarkAsDeceasedUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute(command) {
        // 1. Validate input
        if (!command.patientId || command.patientId.trim().length === 0) {
            throw new Error('Patient ID không được để trống');
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
        // 3. Mark as deceased
        patient.markAsDeceased(command.performedBy);
        // 4. Save patient
        await this.patientRepository.save(patient);
        return {
            success: true,
            message: 'Đã đánh dấu bệnh nhân qua đời'
        };
    }
}
exports.MarkAsDeceasedUseCase = MarkAsDeceasedUseCase;
//# sourceMappingURL=MarkAsDeceasedUseCase.js.map