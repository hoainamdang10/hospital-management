/**
 * UploadPatientPhotoUseCase - Application Layer
 * Handles patient photo upload
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (photo field)
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { SupabaseStorageService } from '../../infrastructure/storage/SupabaseStorageService';

export interface UploadPatientPhotoCommand {
  patientId: string;
  fileBuffer: Buffer;
  fileName: string;
  contentType: string;
  uploadedBy: string;
}

export interface UploadPatientPhotoResponse {
  photoUrl: string;
  message: string;
}

export class UploadPatientPhotoUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private storageService: SupabaseStorageService
  ) {}

  async execute(command: UploadPatientPhotoCommand): Promise<UploadPatientPhotoResponse> {
    // Validate input
    if (!command.patientId || command.patientId.trim() === '') {
      throw new Error('ID bệnh nhân không được để trống');
    }

    if (!command.fileBuffer || command.fileBuffer.length === 0) {
      throw new Error('File ảnh không được để trống');
    }

    if (!command.fileName || command.fileName.trim() === '') {
      throw new Error('Tên file không được để trống');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(command.contentType)) {
      throw new Error('Chỉ chấp nhận file ảnh định dạng JPEG, PNG, JPG, WEBP');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (command.fileBuffer.length > maxSize) {
      throw new Error('Kích thước file không được vượt quá 5MB');
    }

    // Find patient
    const patientId = PatientId.fromString(command.patientId);
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new Error('Không tìm thấy bệnh nhân');
    }

    // Delete old photo if exists
    const oldPhotoUrl = patient.getPhotoUrl();
    if (oldPhotoUrl) {
      try {
        // Extract file path from URL
        const urlParts = oldPhotoUrl.split('/');
        const bucketIndex = urlParts.indexOf('patient-photos');
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await this.storageService.deletePatientPhoto(filePath);
        }
      } catch (error) {
        // Log but don't fail - old photo might already be deleted
        console.warn('Failed to delete old photo:', error);
      }
    }

    // Upload new photo
    const uploadResult = await this.storageService.uploadPatientPhoto(
      command.patientId,
      command.fileBuffer,
      command.fileName,
      command.contentType
    );

    // Update patient with new photo URL
    patient.updatePhoto(uploadResult.url, command.uploadedBy);

    // Save patient
    await this.patientRepository.save(patient);

    return {
      photoUrl: uploadResult.url,
      message: 'Tải ảnh lên thành công'
    };
  }
}

