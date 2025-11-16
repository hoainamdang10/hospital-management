"use strict";
/**
 * GetConsentDetailsUseCase - Application Layer
 * Get details of a specific consent (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetConsentDetailsUseCase = void 0;
const PatientId_1 = require("../../domain/value-objects/PatientId");
/**
 * Use Case: Get Consent Details
 */
class GetConsentDetailsUseCase {
    constructor(patientRepository, logger) {
        this.patientRepository = patientRepository;
        this.logger = logger;
    }
    async execute(command) {
        this.logger.info('Getting consent details', {
            patientId: command.patientId,
            consentId: command.consentId,
            requestedBy: command.requestedBy
        });
        try {
            // 1. Validate input
            if (!command.patientId || command.patientId.trim().length === 0) {
                return {
                    success: false,
                    message: 'Patient ID không được để trống',
                    errors: ['INVALID_PATIENT_ID']
                };
            }
            if (!command.consentId || command.consentId.trim().length === 0) {
                return {
                    success: false,
                    message: 'Consent ID không được để trống',
                    errors: ['INVALID_CONSENT_ID']
                };
            }
            if (!command.requestedBy || command.requestedBy.trim().length === 0) {
                return {
                    success: false,
                    message: 'Người yêu cầu không được để trống',
                    errors: ['INVALID_REQUESTED_BY']
                };
            }
            // 2. Find patient
            const patientId = PatientId_1.PatientId.create(command.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                return {
                    success: false,
                    message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
                    errors: ['PATIENT_NOT_FOUND']
                };
            }
            // 3. Find consent
            const consents = patient.getConsents();
            const consent = consents.find(c => c.getId() === command.consentId);
            if (!consent) {
                return {
                    success: false,
                    message: `Không tìm thấy đồng ý với ID: ${command.consentId}`,
                    errors: ['CONSENT_NOT_FOUND']
                };
            }
            // 4. Map to DTO
            const consentDTO = {
                id: consent.getId(),
                patientId: command.patientId,
                consentType: consent.consentType,
                isActive: consent.isActive,
                grantedAt: consent.grantedAt,
                withdrawnAt: consent.withdrawnAt,
                expiresAt: consent.expiresAt,
                witnessId: consent.witnessId,
                notes: consent.notes,
                isExpired: consent.isExpired(),
                isValid: consent.isValid(),
                daysUntilExpiry: consent.getDaysUntilExpiry(),
                createdAt: consent.createdAt,
                updatedAt: consent.updatedAt
            };
            this.logger.info('Consent details retrieved successfully', {
                patientId: command.patientId,
                consentId: command.consentId
            });
            return {
                success: true,
                data: consentDTO,
                message: 'Lấy chi tiết đồng ý thành công'
            };
        }
        catch (error) {
            this.logger.error('Error getting consent details', {
                patientId: command.patientId,
                consentId: command.consentId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi khi lấy chi tiết đồng ý',
                errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
            };
        }
    }
}
exports.GetConsentDetailsUseCase = GetConsentDetailsUseCase;
//# sourceMappingURL=GetConsentDetailsUseCase.js.map