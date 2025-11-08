"use strict";
/**
 * GetLabResultUseCase - Application Use Case
 * Retrieves a lab result by ID with audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLabResultUseCase = void 0;
const logger_1 = require("@shared/infrastructure/logging/logger");
class GetLabResultUseCase {
    constructor(labResultRepository) {
        this.labResultRepository = labResultRepository;
    }
    async execute(query) {
        try {
            // Validate input
            if (!query.resultId) {
                throw new Error('Result ID is required');
            }
            if (!query.accessedBy) {
                throw new Error('Accessed by is required');
            }
            // Find lab result
            const labResult = await this.labResultRepository.findById(query.resultId);
            if (!labResult) {
                return {
                    success: false,
                    error: 'Lab result not found',
                };
            }
            // Log access for HIPAA compliance
            labResult.logAccess(query.accessedBy, query.accessPurpose || 'view', query.ipAddress);
            // Update with access log
            await this.labResultRepository.update(labResult);
            logger_1.logger.info('Lab result accessed', {
                resultId: query.resultId,
                accessedBy: query.accessedBy,
                accessPurpose: query.accessPurpose,
            });
            return {
                success: true,
                labResult: this.toDTO(labResult),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get lab result', {
                error: error.message,
                query,
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }
    toDTO(labResult) {
        const props = labResult.props;
        return {
            resultId: props.resultId.value,
            medicalRecordId: props.medicalRecordId,
            patientId: props.patientId,
            testName: props.testName,
            testType: props.testType,
            testCode: props.testCode,
            specimenType: props.specimenType,
            specimenCollectedAt: props.specimenCollectedAt,
            specimenCollectedBy: props.specimenCollectedBy,
            resultValue: props.resultValue,
            referenceRange: props.referenceRange,
            unit: props.unit,
            interpretation: props.interpretation,
            testPerformedAt: props.testPerformedAt,
            performedBy: props.performedBy,
            verifiedBy: props.verifiedBy,
            verifiedAt: props.verifiedAt,
            orderedBy: props.orderedBy,
            orderedAt: props.orderedAt,
            priority: props.priority,
            status: props.status,
            notes: props.notes,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
            isCritical: labResult.isCritical(),
            isAbnormal: labResult.isAbnormal(),
        };
    }
}
exports.GetLabResultUseCase = GetLabResultUseCase;
//# sourceMappingURL=GetLabResultUseCase.js.map