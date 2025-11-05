/**
 * UpdateLabResultUseCase - Application Use Case
 * Updates lab result with test results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
import { logger } from '@shared/infrastructure/logging/logger';

export interface UpdateLabResultCommand {
  resultId: string;
  resultValue?: string;
  referenceRange?: string;
  unit?: string;
  interpretation?: string;
  performedBy?: string;
  verifiedBy?: string;
  status?: string;
  notes?: string;
  updatedBy: string;
}

export interface UpdateLabResultResult {
  success: boolean;
  resultId?: string;
  status?: string;
  error?: string;
}

export class UpdateLabResultUseCase {
  constructor(private readonly labResultRepository: ILabResultRepository) {}

  async execute(command: UpdateLabResultCommand): Promise<UpdateLabResultResult> {
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
        labResult.updateResults(
          command.resultValue,
          command.referenceRange,
          command.unit,
          command.interpretation,
          command.performedBy,
          command.updatedBy
        );
      }

      // Verify if verifiedBy is provided
      if (command.verifiedBy) {
        labResult.verify(command.verifiedBy);
      }

      // Update notes if provided
      if (command.notes) {
        (labResult as any).props.notes = command.notes;
        (labResult as any).props.updatedAt = new Date();
        (labResult as any).props.updatedBy = command.updatedBy;
      }

      // Save changes
      await this.labResultRepository.update(labResult);

      logger.info('Lab result updated successfully', {
        resultId: command.resultId,
        status: labResult.status,
        updatedBy: command.updatedBy,
      });

      return {
        success: true,
        resultId: labResult.resultId.value,
        status: labResult.status,
      };
    } catch (error: any) {
      logger.error('Failed to update lab result', {
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

