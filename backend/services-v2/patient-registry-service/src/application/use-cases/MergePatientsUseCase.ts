/**
 * MergePatientsUseCase - Application Use Case
 * 
 * Merges duplicate patient into master patient
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR, PMI Best Practices
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';

export interface MergePatientsRequest {
  duplicatePatientId: string;  // Patient to be merged (will be marked as 'merged')
  masterPatientId: string;  // Master patient (will remain active)
  reason: string;  // Reason for merging
  performedBy: string;  // User who performed the merge
}

export interface MergePatientsResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    duplicatePatientId: string;
    masterPatientId: string;
    mergedAt: string;
  };
}

export class MergePatientsUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: MergePatientsRequest): Promise<MergePatientsResponse> {
    try {
      // 1. Validate input
      if (request.duplicatePatientId === request.masterPatientId) {
        return {
          success: false,
          message: 'Không thể merge bệnh nhân với chính nó',
          errors: ['SAME_PATIENT']
        };
      }

      // 2. Find duplicate patient
      const duplicatePatientId = PatientId.create(request.duplicatePatientId);
      const duplicatePatient = await this.patientRepository.findById(duplicatePatientId);

      if (!duplicatePatient) {
        return {
          success: false,
          message: 'Không tìm thấy bệnh nhân trùng lặp',
          errors: ['DUPLICATE_PATIENT_NOT_FOUND']
        };
      }

      // 3. Find master patient
      const masterPatientId = PatientId.create(request.masterPatientId);
      const masterPatient = await this.patientRepository.findById(masterPatientId);

      if (!masterPatient) {
        return {
          success: false,
          message: 'Không tìm thấy bệnh nhân chính',
          errors: ['MASTER_PATIENT_NOT_FOUND']
        };
      }

      // 4. Validate patients are active
      if (!duplicatePatient.isActive()) {
        return {
          success: false,
          message: 'Bệnh nhân trùng lặp không hoạt động',
          errors: ['DUPLICATE_PATIENT_NOT_ACTIVE']
        };
      }

      if (!masterPatient.isActive()) {
        return {
          success: false,
          message: 'Bệnh nhân chính không hoạt động',
          errors: ['MASTER_PATIENT_NOT_ACTIVE']
        };
      }

      // 5. Check if duplicate patient is already merged
      if (duplicatePatient.isMerged()) {
        return {
          success: false,
          message: 'Bệnh nhân trùng lặp đã được merge trước đó',
          errors: ['DUPLICATE_PATIENT_ALREADY_MERGED']
        };
      }

      // 6. Merge duplicate patient into master patient
      duplicatePatient.mergeInto(masterPatientId, request.reason, request.performedBy);

      // 7. Save duplicate patient (now marked as 'merged')
      await this.patientRepository.save(duplicatePatient);

      // 8. Return success response
      return {
        success: true,
        message: 'Merge bệnh nhân thành công',
        data: {
          duplicatePatientId: request.duplicatePatientId,
          masterPatientId: request.masterPatientId,
          mergedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Merge bệnh nhân thất bại',
          errors: [error.message]
        };
      }

      // Handle unexpected errors
      return {
        success: false,
        message: 'Đã xảy ra lỗi không mong muốn',
        errors: ['UNEXPECTED_ERROR']
        };
    }
  }
}

