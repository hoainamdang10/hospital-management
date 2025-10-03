/**
 * LinkPatientsUseCase - Application Use Case
 * 
 * Links related patients (FHIR-style linking)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR R5
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';

export interface LinkPatientsRequest {
  patientId: string;  // Patient to link from
  otherPatientId: string;  // Patient to link to
  linkType: 'refer' | 'seealso';  // Link type (FHIR R5)
  performedBy: string;  // User who performed the link
}

export interface LinkPatientsResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    patientId: string;
    otherPatientId: string;
    linkType: string;
    linkedAt: string;
  };
}

export class LinkPatientsUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: LinkPatientsRequest): Promise<LinkPatientsResponse> {
    try {
      // 1. Validate input
      if (request.patientId === request.otherPatientId) {
        return {
          success: false,
          message: 'Không thể link bệnh nhân với chính nó',
          errors: ['SAME_PATIENT']
        };
      }

      // 2. Find patient
      const patientId = PatientId.create(request.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        return {
          success: false,
          message: 'Không tìm thấy bệnh nhân',
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      // 3. Find other patient
      const otherPatientId = PatientId.create(request.otherPatientId);
      const otherPatient = await this.patientRepository.findById(otherPatientId);

      if (!otherPatient) {
        return {
          success: false,
          message: 'Không tìm thấy bệnh nhân liên kết',
          errors: ['OTHER_PATIENT_NOT_FOUND']
        };
      }

      // 4. Validate patients are active
      if (!patient.isActive()) {
        return {
          success: false,
          message: 'Bệnh nhân không hoạt động',
          errors: ['PATIENT_NOT_ACTIVE']
        };
      }

      if (!otherPatient.isActive()) {
        return {
          success: false,
          message: 'Bệnh nhân liên kết không hoạt động',
          errors: ['OTHER_PATIENT_NOT_ACTIVE']
        };
      }

      // 5. Link patients
      patient.linkTo(otherPatientId, request.linkType, request.performedBy);

      // 6. Save patient
      await this.patientRepository.save(patient);

      // 7. Return success response
      return {
        success: true,
        message: 'Link bệnh nhân thành công',
        data: {
          patientId: request.patientId,
          otherPatientId: request.otherPatientId,
          linkType: request.linkType,
          linkedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Link bệnh nhân thất bại',
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

