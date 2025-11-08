"use strict";
/**
 * GetPatientLabResultsUseCase - Application Use Case
 * Retrieves all lab results for a patient with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientLabResultsUseCase = void 0;
const logger_1 = require("@shared/infrastructure/logging/logger");
class GetPatientLabResultsUseCase {
    constructor(labResultRepository) {
        this.labResultRepository = labResultRepository;
    }
    async execute(query) {
        try {
            // Validate input
            if (!query.patientId) {
                throw new Error('Patient ID is required');
            }
            // Build filter criteria
            const criteria = {
                patientId: query.patientId,
                testType: query.testType,
                status: query.status,
                fromDate: query.fromDate,
                toDate: query.toDate,
            };
            const limit = query.limit || 50;
            const offset = query.offset || 0;
            // Get lab results
            const labResults = await this.labResultRepository.findWithFilters(criteria, limit, offset);
            // Get total count
            const total = await this.labResultRepository.count(criteria);
            logger_1.logger.info('Patient lab results retrieved', {
                patientId: query.patientId,
                count: labResults.length,
                total,
            });
            return {
                success: true,
                labResults: labResults.map(lr => this.toSummaryDTO(lr)),
                total,
                limit,
                offset,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get patient lab results', {
                error: error.message,
                query,
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }
    toSummaryDTO(labResult) {
        const props = labResult.props;
        return {
            resultId: props.resultId.value,
            testName: props.testName,
            testType: props.testType,
            testCode: props.testCode,
            resultValue: props.resultValue,
            referenceRange: props.referenceRange,
            unit: props.unit,
            interpretation: props.interpretation,
            status: props.status,
            orderedBy: props.orderedBy,
            orderedAt: props.orderedAt,
            testPerformedAt: props.testPerformedAt,
            verifiedAt: props.verifiedAt,
            priority: props.priority,
            isCritical: labResult.isCritical(),
            isAbnormal: labResult.isAbnormal(),
        };
    }
}
exports.GetPatientLabResultsUseCase = GetPatientLabResultsUseCase;
//# sourceMappingURL=GetPatientLabResultsUseCase.js.map