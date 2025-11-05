/**
 * IMedicalImagingRepository - Repository Interface
 * Defines persistence operations for medical imaging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Repository Pattern
 */

import { MedicalImaging, ImagingType, ImagingModality, ImagingStatus } from '../aggregates/MedicalImaging.aggregate';

export interface MedicalImagingFilterCriteria {
  patientId?: string;
  medicalRecordId?: string;
  imagingType?: ImagingType;
  modality?: ImagingModality;
  status?: ImagingStatus;
  radiologistId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface IMedicalImagingRepository {
  /**
   * Save new medical imaging
   */
  save(imaging: MedicalImaging): Promise<void>;

  /**
   * Update existing medical imaging
   */
  update(imaging: MedicalImaging): Promise<void>;

  /**
   * Find medical imaging by ID
   */
  findById(imagingId: string): Promise<MedicalImaging | null>;

  /**
   * Find all medical imaging for a patient
   */
  findByPatientId(patientId: string, limit?: number, offset?: number): Promise<MedicalImaging[]>;

  /**
   * Find all medical imaging for a medical record
   */
  findByMedicalRecordId(medicalRecordId: string): Promise<MedicalImaging[]>;

  /**
   * Find medical imaging with filters
   */
  findWithFilters(
    criteria: MedicalImagingFilterCriteria,
    limit?: number,
    offset?: number
  ): Promise<MedicalImaging[]>;

  /**
   * Count medical imaging with filters
   */
  count(criteria: MedicalImagingFilterCriteria): Promise<number>;

  /**
   * Delete medical imaging
   */
  delete(imagingId: string): Promise<void>;

  /**
   * Check if medical imaging exists
   */
  exists(imagingId: string): Promise<boolean>;
}

