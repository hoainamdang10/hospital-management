"use strict";
/**
 * GetInsuranceInfoUseCase - Application Layer
 * Get insurance information for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetInsuranceInfoUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class GetInsuranceInfoUseCase {
    constructor(patientRepository, logger) {
        this.patientRepository = patientRepository;
        this.logger = logger;
    }
    async execute(command) {
        this.logger.info('Getting insurance info', {
            patientId: command.patientId,
            requestedBy: command.requestedBy
        });
        try {
            if (!command.patientId || command.patientId.trim().length === 0) {
                return {
                    success: false,
                    message: 'Patient ID không được để trống',
                    errors: ['INVALID_PATIENT_ID']
                };
            }
            const patientId = PatientId_1.PatientId.create(command.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
                    errors: ['PATIENT_NOT_FOUND']
                };
            }
            const insuranceInfo = patient.getInsuranceInfo();
            if (!insuranceInfo) {
                return {
                    success: false,
                    message: 'Bệnh nhân chưa có thông tin bảo hiểm',
                    errors: ['NO_INSURANCE_INFO']
                };
            }
            const insuranceDTO = {
                provider: insuranceInfo.provider,
                policyNumber: insuranceInfo.policyNumber,
                groupNumber: insuranceInfo.groupNumber,
                validFrom: insuranceInfo.validFrom,
                validTo: insuranceInfo.validTo,
                coverageType: insuranceInfo.coverageType,
                isActive: insuranceInfo.isActive,
                isPrimary: insuranceInfo.isPrimary,
                isVietnameseInsurance: insuranceInfo.isVietnameseInsurance,
                bhytNumber: insuranceInfo.bhytNumber
            };
            return {
                success: true,
                data: insuranceDTO,
                message: 'Lấy thông tin bảo hiểm thành công'
            };
        }
        catch (error) {
            this.logger.error('Error getting insurance info', {
                patientId: command.patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi khi lấy thông tin bảo hiểm',
                errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
            };
        }
    }
}
exports.GetInsuranceInfoUseCase = GetInsuranceInfoUseCase;
//# sourceMappingURL=GetInsuranceInfoUseCase.js.map