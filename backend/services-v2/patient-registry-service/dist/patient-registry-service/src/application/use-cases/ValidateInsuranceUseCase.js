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
    constructor(patientRepository, insuranceValidationService, logger) {
        this.patientRepository = patientRepository;
        this.insuranceValidationService = insuranceValidationService;
        this.logger = logger;
    }
    async execute(request) {
        try {
            this.logger.info('Starting insurance validation', {
                patientId: request.patientId,
                requestedBy: request.requestedBy
            });
            // 1. Find patient
            const patientId = PatientId_1.PatientId.create(request.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                this.logger.warn('Insurance validation failed: patient not found', {
                    patientId: request.patientId
                });
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
            // 4. HIPAA audit logging
            this.auditInsuranceValidation(patient, request, isValid);
            this.logger.info('Insurance validation completed', {
                patientId: request.patientId,
                isValid,
                reasons: reasons.join(',')
            });
            // 5. Return validation result
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
                this.logger.error('Insurance validation failed', {
                    patientId: request.patientId,
                    error: error.message,
                    stack: error.stack
                });
                return {
                    success: false,
                    message: 'Xác thực bảo hiểm thất bại',
                    errors: ['VALIDATION_FAILED', error.message]
                };
            }
            // Handle unexpected errors
            this.logger.error('Unexpected error during insurance validation', {
                patientId: request.patientId,
                error: 'UNEXPECTED_ERROR'
            });
            return {
                success: false,
                message: 'Đã xảy ra lỗi không mong muốn',
                errors: ['UNEXPECTED_ERROR']
            };
        }
    }
    /**
     * HIPAA audit logging for insurance validation
     */
    auditInsuranceValidation(patient, request, isValid) {
        this.logger.info('HIPAA Audit: Insurance validation', {
            action: 'INSURANCE_VALIDATION',
            patientId: patient.getPatientId(),
            requestedBy: request.requestedBy,
            validationResult: isValid ? 'VALID' : 'INVALID',
            timestamp: new Date().toISOString(),
            dataAccessed: 'patient_insurance_info',
            complianceLevel: 'hipaa'
        });
    }
}
exports.ValidateInsuranceUseCase = ValidateInsuranceUseCase;
//# sourceMappingURL=ValidateInsuranceUseCase.js.map