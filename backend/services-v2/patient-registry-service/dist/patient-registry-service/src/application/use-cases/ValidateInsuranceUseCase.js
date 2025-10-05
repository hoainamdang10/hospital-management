"use strict";
/**
 * ValidateInsuranceUseCase - Application Use Case
 *
 * Validates patient insurance (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateInsuranceUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
class ValidateInsuranceUseCase {
    constructor(patientRepository, insuranceValidationService) {
        this.patientRepository = patientRepository;
        this.insuranceValidationService = insuranceValidationService;
    }
    async execute(request) {
        try {
            // 1. Find patient
            const patientId = PatientId_1.PatientId.create(request.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: 'Không tìm thấy bệnh nhân',
                    errors: ['PATIENT_NOT_FOUND']
                };
            }
            // 2. Check if patient has insurance
            const insuranceInfo = patient.getInsuranceInfo();
            if (!insuranceInfo) {
                return {
                    success: true,
                    message: 'Bệnh nhân không có bảo hiểm',
                    data: {
                        patientId: request.patientId,
                        hasInsurance: false,
                        validationResult: {
                            isValid: false,
                            reasons: ['NO_INSURANCE']
                        }
                    }
                };
            }
            // 3. Validate insurance using service
            const validFrom = insuranceInfo.validFrom;
            const validTo = insuranceInfo.validTo;
            // Use insurance validation service
            const validationResult = await this.insuranceValidationService.validateInsurance(insuranceInfo.coverageType, insuranceInfo.policyNumber, validFrom, validTo);
            // Check expiration
            const expirationCheck = this.insuranceValidationService.checkExpiration(validFrom, validTo);
            const isNotExpired = !expirationCheck.isExpired;
            const daysUntilExpiration = expirationCheck.daysUntilExpiration;
            // Build reasons list
            const reasons = [];
            let isValid = validationResult.isValid;
            // Check if insurance is active
            if (!insuranceInfo.isActive) {
                isValid = false;
                reasons.push('INSURANCE_NOT_ACTIVE');
            }
            // Add validation errors as reasons
            if (validationResult.errors.length > 0) {
                isValid = false;
                reasons.push(...validationResult.errors);
            }
            // Add expiration warnings
            if (expirationCheck.isExpired) {
                isValid = false;
                reasons.push('INSURANCE_EXPIRED');
            }
            else if (expirationCheck.isExpiringSoon) {
                reasons.push('INSURANCE_EXPIRING_SOON');
            }
            // If no issues found
            if (reasons.length === 0) {
                reasons.push('VALID');
            }
            // 4. Return validation result
            return {
                success: true,
                message: isValid ? 'Bảo hiểm hợp lệ' : 'Bảo hiểm không hợp lệ',
                data: {
                    patientId: request.patientId,
                    hasInsurance: true,
                    insuranceInfo: {
                        provider: insuranceInfo.provider,
                        policyNumber: insuranceInfo.policyNumber,
                        coverageType: insuranceInfo.coverageType,
                        isVietnameseInsurance: insuranceInfo.isVietnameseInsurance,
                        bhytNumber: insuranceInfo.bhytNumber,
                        validFrom: insuranceInfo.validFrom.toISOString(),
                        validTo: insuranceInfo.validTo.toISOString(),
                        isActive: insuranceInfo.isActive,
                        isValid: isNotExpired,
                        daysUntilExpiration: daysUntilExpiration > 0 ? daysUntilExpiration : undefined
                    },
                    validationResult: {
                        isValid,
                        reasons
                    }
                }
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                return {
                    success: false,
                    message: 'Xác thực bảo hiểm thất bại',
                    errors: [error.message]
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
exports.ValidateInsuranceUseCase = ValidateInsuranceUseCase;
//# sourceMappingURL=ValidateInsuranceUseCase.js.map