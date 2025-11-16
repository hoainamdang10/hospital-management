/**
 * DeletePatientPhotoUseCase - Application Layer
 * Deletes patient photo
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (photo field)
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { SupabaseStorageService } from '../../infrastructure/storage/SupabaseStorageService';

export interface DeletePatientPhotoCommand {
  patientId: string;
  deletedBy: string;
}

export interface DeletePatientPhotoResponse {
  success: boolean;
  message: string;
}

export class DeletePatientPhotoUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private storageService: SupabaseStorageService
  ) {}

  async execute(command: DeletePatientPhotoCommand): Promise<DeletePatientPhotoResponse> {
    // Validate input
    if (!command.patientId || command.patientId.trim() === '') {
      throw new Error('ID bệnh nhân không được để trống');
    }

    // Find patient
    const patientId = PatientId.fromString(command.patientId);
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new Error('Không tìm thấy bệnh nhân');
    }

    // Get current photo URL
    const photoUrl = patient.getPhotoUrl();

    if (!photoUrl) {
      return {
        success: true,
        message: 'Bệnh nhân không có ảnh'
      };
    }

    // Delete photo from storage
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const bucketIndex = urlParts.indexOf('patient-photos');
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        await this.storageService.deletePatientPhoto(filePath);
      }
    } catch (error) {
      // Log but continue - photo might already be deleted
      console.warn('Failed to delete photo from storage:', error);
    }

    // Remove photo from patient
    patient.removePhoto(command.deletedBy);

    // Save patient
    await this.patientRepository.save(patient);

    return {
      success: true,
      message: 'Xóa ảnh thành công'
    };
  }
}

