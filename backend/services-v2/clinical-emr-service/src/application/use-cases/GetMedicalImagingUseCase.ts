/**
 * GetMedicalImagingUseCase - Application Use Case
 * Retrieves a medical imaging study by ID with audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */

import { IMedicalImagingRepository } from '../../domain/repositories/IMedicalImagingRepository';
import { MedicalImaging } from '../../domain/aggregates/MedicalImaging.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface GetMedicalImagingQuery {
  imagingId: string;
  accessedBy: string;
  accessPurpose?: string;
  ipAddress?: string;
}

export interface GetMedicalImagingResult {
  success: boolean;
  imaging?: MedicalImagingDTO;
  error?: string;
}

export interface MedicalImagingDTO {
  imagingId: string;
  medicalRecordId: string;
  patientId: string;
  imagingType: string;
  modality: string;
  bodyPart: string;
  laterality?: string;
  studyDate: Date;
  studyDescription?: string;
  clinicalIndication?: string;
  orderedBy: string;
  orderedAt: Date;
  priority: string;
  findings?: string;
  impression?: string;
  radiologistId?: string;
  reportedAt?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  imageUrls?: string[];
  dicomStudyUid?: string;
  seriesCount?: number;
  instanceCount?: number;
  status: string;
  technique?: string;
  contrastUsed?: boolean;
  contrastType?: string;
  radiationDose?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  usesContrast: boolean;
  isUrgent: boolean;
}

export class GetMedicalImagingUseCase {
  constructor(private readonly imagingRepository: IMedicalImagingRepository) {}

  async execute(query: GetMedicalImagingQuery): Promise<GetMedicalImagingResult> {
    try {
      // Validate input
      if (!query.imagingId) {
        throw new Error('Imaging ID is required');
      }

      if (!query.accessedBy) {
        throw new Error('Accessed by is required');
      }

      // Find medical imaging
      const imaging = await this.imagingRepository.findById(query.imagingId);

      if (!imaging) {
        return {
          success: false,
          error: 'Medical imaging not found',
        };
      }

      // Log access for HIPAA compliance
      imaging.logAccess(
        query.accessedBy,
        query.accessPurpose || 'view',
        query.ipAddress
      );

      // Update with access log
      await this.imagingRepository.update(imaging);

      logger.info('Medical imaging accessed', {
        imagingId: query.imagingId,
        accessedBy: query.accessedBy,
        accessPurpose: query.accessPurpose,
      });

      return {
        success: true,
        imaging: this.toDTO(imaging),
      };
    } catch (error: any) {
      logger.error('Failed to get medical imaging', {
        error: error.message,
        query,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private toDTO(imaging: MedicalImaging): MedicalImagingDTO {
    const props = (imaging as any).props;
    return {
      imagingId: props.imagingId.value,
      medicalRecordId: props.medicalRecordId,
      patientId: props.patientId,
      imagingType: props.imagingType,
      modality: props.modality,
      bodyPart: props.bodyPart,
      laterality: props.laterality,
      studyDate: props.studyDate,
      studyDescription: props.studyDescription,
      clinicalIndication: props.clinicalIndication,
      orderedBy: props.orderedBy,
      orderedAt: props.orderedAt,
      priority: props.priority,
      findings: props.findings,
      impression: props.impression,
      radiologistId: props.radiologistId,
      reportedAt: props.reportedAt,
      verifiedBy: props.verifiedBy,
      verifiedAt: props.verifiedAt,
      imageUrls: props.imageUrls,
      dicomStudyUid: props.dicomStudyUid,
      seriesCount: props.seriesCount,
      instanceCount: props.instanceCount,
      status: props.status,
      technique: props.technique,
      contrastUsed: props.contrastUsed,
      contrastType: props.contrastType,
      radiationDose: props.radiationDose,
      notes: props.notes,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      usesContrast: imaging.usesContrast(),
      isUrgent: imaging.isUrgent(),
    };
  }
}

