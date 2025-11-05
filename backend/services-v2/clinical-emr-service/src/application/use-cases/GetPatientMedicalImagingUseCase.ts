/**
 * GetPatientMedicalImagingUseCase - Application Use Case
 * Retrieves all medical imaging studies for a patient with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IMedicalImagingRepository, MedicalImagingFilterCriteria } from '../../domain/repositories/IMedicalImagingRepository';
import { MedicalImaging, ImagingType, ImagingModality, ImagingStatus } from '../../domain/aggregates/MedicalImaging.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface GetPatientMedicalImagingQuery {
  patientId: string;
  imagingType?: ImagingType;
  modality?: ImagingModality;
  status?: ImagingStatus;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GetPatientMedicalImagingResult {
  success: boolean;
  imaging?: MedicalImagingSummaryDTO[];
  total?: number;
  limit?: number;
  offset?: number;
  error?: string;
}

export interface MedicalImagingSummaryDTO {
  imagingId: string;
  imagingType: string;
  modality: string;
  bodyPart: string;
  laterality?: string;
  studyDate: Date;
  studyDescription?: string;
  clinicalIndication?: string;
  orderedBy: string;
  priority: string;
  findings?: string;
  impression?: string;
  radiologistId?: string;
  reportedAt?: Date;
  verifiedAt?: Date;
  status: string;
  imageUrls?: string[];
  dicomStudyUid?: string;
  usesContrast: boolean;
  isUrgent: boolean;
}

export class GetPatientMedicalImagingUseCase {
  constructor(private readonly imagingRepository: IMedicalImagingRepository) {}

  async execute(query: GetPatientMedicalImagingQuery): Promise<GetPatientMedicalImagingResult> {
    try {
      // Validate input
      if (!query.patientId) {
        throw new Error('Patient ID is required');
      }

      // Build filter criteria
      const criteria: MedicalImagingFilterCriteria = {
        patientId: query.patientId,
        imagingType: query.imagingType,
        modality: query.modality,
        status: query.status,
        fromDate: query.fromDate,
        toDate: query.toDate,
      };

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      // Get medical imaging
      const imaging = await this.imagingRepository.findWithFilters(
        criteria,
        limit,
        offset
      );

      // Get total count
      const total = await this.imagingRepository.count(criteria);

      logger.info('Patient medical imaging retrieved', {
        patientId: query.patientId,
        count: imaging.length,
        total,
      });

      return {
        success: true,
        imaging: imaging.map(img => this.toSummaryDTO(img)),
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      logger.error('Failed to get patient medical imaging', {
        error: error.message,
        query,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private toSummaryDTO(imaging: MedicalImaging): MedicalImagingSummaryDTO {
    const props = (imaging as any).props;
    return {
      imagingId: props.imagingId.value,
      imagingType: props.imagingType,
      modality: props.modality,
      bodyPart: props.bodyPart,
      laterality: props.laterality,
      studyDate: props.studyDate,
      studyDescription: props.studyDescription,
      clinicalIndication: props.clinicalIndication,
      orderedBy: props.orderedBy,
      priority: props.priority,
      findings: props.findings,
      impression: props.impression,
      radiologistId: props.radiologistId,
      reportedAt: props.reportedAt,
      verifiedAt: props.verifiedAt,
      status: props.status,
      imageUrls: props.imageUrls,
      dicomStudyUid: props.dicomStudyUid,
      usesContrast: imaging.usesContrast(),
      isUrgent: imaging.isUrgent(),
    };
  }
}

