/**
 * DeactivatePatientUseCase - Application Use Case
 *
 * Deactivates a patient (soft delete)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';

export interface DeactivatePatientRequest {
  patientId: string;
  reason: string;  // Reason for deactivation
  performedBy: string;  // User who performed the deactivation
}

export interface DeactivatePatientResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    patientId: string;
    deactivatedAt: string;
  };
}

export class DeactivatePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: DeactivatePatientRequest): Promise<DeactivatePatientResponse> {
    try {
      // 1. Find patient
      const patientId = PatientId.create(request.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        return {
          success: false,
          message: 'Không tìm thấy bệnh nhân',
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      // 2. Check if patient is already inactive
      if (patient.isInactive()) {
        return {
          success: false,
          message: 'Bệnh nhân đã bị vô hiệu hóa trước đó',
          errors: ['PATIENT_ALREADY_INACTIVE']
        };
      }

      // 3. Check if patient is merged
      if (patient.isMerged()) {
        return {
          success: false,
          message: 'Không thể vô hiệu hóa bệnh nhân đã được merge',
          errors: ['PATIENT_ALREADY_MERGED']
        };
      }

      // 4. Check if patient is deceased
      if (patient.isDeceased()) {
        return {
          success: false,
          message: 'Không thể vô hiệu hóa bệnh nhân đã qua đời',
          errors: ['PATIENT_ALREADY_DECEASED']
        };
      }

      // 5. Deactivate patient
      patient.deactivate(request.reason, request.performedBy);

      // 6. Save patient
      await this.patientRepository.save(patient);

      // 7. Return success response
      return {
        success: true,
        message: 'Vô hiệu hóa bệnh nhân thành công',
        data: {
          patientId: request.patientId,
          deactivatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Vô hiệu hóa bệnh nhân thất bại',
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

