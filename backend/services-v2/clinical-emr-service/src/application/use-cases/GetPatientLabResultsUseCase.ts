/**
 * GetPatientLabResultsUseCase - Application Use Case
 * Retrieves all lab results for a patient with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { ILabResultRepository, LabResultFilterCriteria } from '../../domain/repositories/ILabResultRepository';
import { LabResult, LabTestType, LabResultStatus } from '../../domain/aggregates/LabResult.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface GetPatientLabResultsQuery {
  patientId: string;
  testType?: LabTestType;
  status?: LabResultStatus;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GetPatientLabResultsResult {
  success: boolean;
  labResults?: LabResultSummaryDTO[];
  total?: number;
  limit?: number;
  offset?: number;
  error?: string;
}

export interface LabResultSummaryDTO {
  resultId: string;
  testName: string;
  testType: string;
  testCode?: string;
  resultValue?: string;
  referenceRange?: string;
  unit?: string;
  interpretation?: string;
  status: string;
  orderedBy: string;
  orderedAt: Date;
  testPerformedAt?: Date;
  verifiedAt?: Date;
  priority: string;
  isCritical: boolean;
  isAbnormal: boolean;
}

export class GetPatientLabResultsUseCase {
  constructor(private readonly labResultRepository: ILabResultRepository) {}

  async execute(query: GetPatientLabResultsQuery): Promise<GetPatientLabResultsResult> {
    try {
      // Validate input
      if (!query.patientId) {
        throw new Error('Patient ID is required');
      }

      // Build filter criteria
      const criteria: LabResultFilterCriteria = {
        patientId: query.patientId,
        testType: query.testType,
        status: query.status,
        fromDate: query.fromDate,
        toDate: query.toDate,
      };

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      // Get lab results
      const labResults = await this.labResultRepository.findWithFilters(
        criteria,
        limit,
        offset
      );

      // Get total count
      const total = await this.labResultRepository.count(criteria);

      logger.info('Patient lab results retrieved', {
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
    } catch (error: any) {
      logger.error('Failed to get patient lab results', {
        error: error.message,
        query,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private toSummaryDTO(labResult: LabResult): LabResultSummaryDTO {
    const props = (labResult as any).props;
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

