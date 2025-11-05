/**
 * CreateLabResultUseCase - Application Use Case
 * Creates a new lab result order
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
import { LabResult, LabTestType, LabTestPriority } from '../../domain/aggregates/LabResult.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface CreateLabResultCommand {
  medicalRecordId: string;
  patientId: string;
  testName: string;
  testType: LabTestType;
  testCode?: string;
  specimenType?: string;
  orderedBy: string;
  orderedAt?: Date;
  priority?: LabTestPriority;
  notes?: string;
  createdBy: string;
}

export interface CreateLabResultResult {
  success: boolean;
  resultId?: string;
  error?: string;
}

export class CreateLabResultUseCase {
  constructor(private readonly labResultRepository: ILabResultRepository) {}

  async execute(command: CreateLabResultCommand): Promise<CreateLabResultResult> {
    try {
      // Validate input
      this.validateCommand(command);

      // Create lab result aggregate
      const labResult = LabResult.create({
        medicalRecordId: command.medicalRecordId,
        patientId: command.patientId,
        testName: command.testName,
        testType: command.testType,
        testCode: command.testCode,
        specimenType: command.specimenType,
        orderedBy: command.orderedBy,
        orderedAt: command.orderedAt || new Date(),
        priority: command.priority || LabTestPriority.ROUTINE,
        notes: command.notes,
        createdBy: command.createdBy,
      });

      // Validate business rules
      labResult.validate();

      // Save to repository
      await this.labResultRepository.save(labResult);

      logger.info('Lab result created successfully', {
        resultId: labResult.resultId.value,
        patientId: command.patientId,
        testType: command.testType,
      });

      return {
        success: true,
        resultId: labResult.resultId.value,
      };
    } catch (error: any) {
      logger.error('Failed to create lab result', {
        error: error.message,
        command,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private validateCommand(command: CreateLabResultCommand): void {
    if (!command.medicalRecordId) {
      throw new Error('Medical record ID is required');
    }

    if (!command.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!command.testName || command.testName.trim().length === 0) {
      throw new Error('Test name is required');
    }

    if (!command.testType) {
      throw new Error('Test type is required');
    }

    if (!command.orderedBy) {
      throw new Error('Ordered by is required');
    }

    if (!command.createdBy) {
      throw new Error('Created by is required');
    }

    // Validate test type
    const validTestTypes = Object.values(LabTestType);
    if (!validTestTypes.includes(command.testType)) {
      throw new Error(`Invalid test type. Must be one of: ${validTestTypes.join(', ')}`);
    }

    // Validate priority if provided
    if (command.priority) {
      const validPriorities = Object.values(LabTestPriority);
      if (!validPriorities.includes(command.priority)) {
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }
    }
  }
}

