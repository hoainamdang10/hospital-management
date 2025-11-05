/**
 * GetLabResultUseCase - Application Use Case
 * Retrieves a lab result by ID with audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */

import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
import { LabResult } from '../../domain/aggregates/LabResult.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface GetLabResultQuery {
  resultId: string;
  accessedBy: string;
  accessPurpose?: string;
  ipAddress?: string;
}

export interface GetLabResultResult {
  success: boolean;
  labResult?: LabResultDTO;
  error?: string;
}

export interface LabResultDTO {
  resultId: string;
  medicalRecordId: string;
  patientId: string;
  testName: string;
  testType: string;
  testCode?: string;
  specimenType?: string;
  specimenCollectedAt?: Date;
  specimenCollectedBy?: string;
  resultValue?: string;
  referenceRange?: string;
  unit?: string;
  interpretation?: string;
  testPerformedAt?: Date;
  performedBy?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  orderedBy: string;
  orderedAt: Date;
  priority: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isCritical: boolean;
  isAbnormal: boolean;
}

export class GetLabResultUseCase {
  constructor(private readonly labResultRepository: ILabResultRepository) {}

  async execute(query: GetLabResultQuery): Promise<GetLabResultResult> {
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
      labResult.logAccess(
        query.accessedBy,
        query.accessPurpose || 'view',
        query.ipAddress
      );

      // Update with access log
      await this.labResultRepository.update(labResult);

      logger.info('Lab result accessed', {
        resultId: query.resultId,
        accessedBy: query.accessedBy,
        accessPurpose: query.accessPurpose,
      });

      return {
        success: true,
        labResult: this.toDTO(labResult),
      };
    } catch (error: any) {
      logger.error('Failed to get lab result', {
        error: error.message,
        query,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private toDTO(labResult: LabResult): LabResultDTO {
    const props = (labResult as any).props;
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

