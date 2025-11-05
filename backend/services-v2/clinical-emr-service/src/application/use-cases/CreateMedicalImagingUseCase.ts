/**
 * CreateMedicalImagingUseCase - Application Use Case
 * Creates a new medical imaging study order
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IMedicalImagingRepository } from '../../domain/repositories/IMedicalImagingRepository';
import { MedicalImaging, ImagingType, ImagingModality, ImagingPriority } from '../../domain/aggregates/MedicalImaging.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface CreateMedicalImagingCommand {
  medicalRecordId: string;
  patientId: string;
  imagingType: ImagingType;
  modality: ImagingModality;
  bodyPart: string;
  laterality?: string;
  studyDate?: Date;
  studyDescription?: string;
  clinicalIndication?: string;
  orderedBy: string;
  orderedAt?: Date;
  priority?: ImagingPriority;
  technique?: string;
  contrastUsed?: boolean;
  contrastType?: string;
  notes?: string;
  createdBy: string;
}

export interface CreateMedicalImagingResult {
  success: boolean;
  imagingId?: string;
  error?: string;
}

export class CreateMedicalImagingUseCase {
  constructor(private readonly imagingRepository: IMedicalImagingRepository) {}

  async execute(command: CreateMedicalImagingCommand): Promise<CreateMedicalImagingResult> {
    try {
      // Validate input
      this.validateCommand(command);

      // Create medical imaging aggregate
      const imaging = MedicalImaging.create({
        medicalRecordId: command.medicalRecordId,
        patientId: command.patientId,
        imagingType: command.imagingType,
        modality: command.modality,
        bodyPart: command.bodyPart,
        laterality: command.laterality,
        studyDate: command.studyDate || new Date(),
        studyDescription: command.studyDescription,
        clinicalIndication: command.clinicalIndication,
        orderedBy: command.orderedBy,
        orderedAt: command.orderedAt || new Date(),
        priority: command.priority || ImagingPriority.ROUTINE,
        technique: command.technique,
        contrastUsed: command.contrastUsed,
        contrastType: command.contrastType,
        notes: command.notes,
        createdBy: command.createdBy,
      });

      // Validate business rules
      imaging.validate();

      // Save to repository
      await this.imagingRepository.save(imaging);

      logger.info('Medical imaging created successfully', {
        imagingId: imaging.imagingId.value,
        patientId: command.patientId,
        imagingType: command.imagingType,
      });

      return {
        success: true,
        imagingId: imaging.imagingId.value,
      };
    } catch (error: any) {
      logger.error('Failed to create medical imaging', {
        error: error.message,
        command,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private validateCommand(command: CreateMedicalImagingCommand): void {
    if (!command.medicalRecordId) {
      throw new Error('Medical record ID is required');
    }

    if (!command.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!command.imagingType) {
      throw new Error('Imaging type is required');
    }

    if (!command.modality) {
      throw new Error('Modality is required');
    }

    if (!command.bodyPart || command.bodyPart.trim().length === 0) {
      throw new Error('Body part is required');
    }

    if (!command.orderedBy) {
      throw new Error('Ordered by is required');
    }

    if (!command.createdBy) {
      throw new Error('Created by is required');
    }

    // Validate imaging type
    const validImagingTypes = Object.values(ImagingType);
    if (!validImagingTypes.includes(command.imagingType)) {
      throw new Error(`Invalid imaging type. Must be one of: ${validImagingTypes.join(', ')}`);
    }

    // Validate modality
    const validModalities = Object.values(ImagingModality);
    if (!validModalities.includes(command.modality)) {
      throw new Error(`Invalid modality. Must be one of: ${validModalities.join(', ')}`);
    }

    // Validate priority if provided
    if (command.priority) {
      const validPriorities = Object.values(ImagingPriority);
      if (!validPriorities.includes(command.priority)) {
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }
    }
  }
}

