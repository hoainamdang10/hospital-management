"use strict";
/**
 * UpdateLabResultUseCase - Application Use Case
 * Updates lab result with test results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLabResultUseCase = void 0;
const logger_1 = require("@shared/infrastructure/logging/logger");
class UpdateLabResultUseCase {
    constructor(labResultRepository) {
        this.labResultRepository = labResultRepository;
    }
    async execute(command) {
        try {
            // Validate input
            if (!command.resultId) {
                throw new Error('Result ID is required');
            }
            if (!command.updatedBy) {
                throw new Error('Updated by is required');
            }
            // Find lab result
            const labResult = await this.labResultRepository.findById(command.resultId);
            if (!labResult) {
                return {
                    success: false,
                    error: 'Lab result not found',
                };
            }
            // Update results if provided
            if (command.resultValue) {
                labResult.updateResults(command.resultValue, command.referenceRange, command.unit, command.interpretation, command.performedBy, command.updatedBy);
            }
            // Verify if verifiedBy is provided
            if (command.verifiedBy) {
                labResult.verify(command.verifiedBy);
            }
            // Update notes if provided
            if (command.notes) {
                labResult.props.notes = command.notes;
                labResult.props.updatedAt = new Date();
                labResult.props.updatedBy = command.updatedBy;
            }
            // Save changes
            await this.labResultRepository.update(labResult);
            logger_1.logger.info('Lab result updated successfully', {
                resultId: command.resultId,
                status: labResult.status,
                updatedBy: command.updatedBy,
            });
            return {
                success: true,
                resultId: labResult.resultId.value,
                status: labResult.status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update lab result', {
                error: error.message,
                command,
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
exports.UpdateLabResultUseCase = UpdateLabResultUseCase;
//# sourceMappingURL=UpdateLabResultUseCase.js.map