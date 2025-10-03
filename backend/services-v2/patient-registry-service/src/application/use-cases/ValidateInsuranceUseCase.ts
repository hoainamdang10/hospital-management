/**
 * ValidateInsuranceUseCase - Application Use Case
 * 
 * Validates patient insurance (BHYT/BHTN)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';

export interface ValidateInsuranceRequest {
  patientId: string;
  requestedBy: string;
}

export interface ValidateInsuranceResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    patientId: string;
    hasInsurance: boolean;
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      coverageType: string;
      isVietnameseInsurance: boolean;
      bhytNumber?: string;
      validFrom: string;
      validTo: string;
      isActive: boolean;
      isValid: boolean;  // Not expired
      daysUntilExpiration?: number;
    };
    validationResult: {
      isValid: boolean;
      reasons: string[];
    };
  };
}

export class ValidateInsuranceUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: ValidateInsuranceRequest): Promise<ValidateInsuranceResponse> {
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

      // 2. Check if patient has insurance
      const insuranceInfo = patient.getInsuranceInfo();

      if (!insuranceInfo) {
        return {
          success: true,
          message: 'Bệnh nhân không có bảo hiểm',
          data: {
            patientId: request.patientId,
            hasInsurance: false,
            validationResult: {
              isValid: false,
              reasons: ['NO_INSURANCE']
            }
          }
        };
      }

      // 3. Validate insurance
      const now = new Date();
      const validFrom = insuranceInfo.validFrom;
      const validTo = insuranceInfo.validTo;
      const isNotExpired = now >= validFrom && now <= validTo;
      const daysUntilExpiration = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const reasons: string[] = [];
      let isValid = true;

      // Check if insurance is active
      if (!insuranceInfo.isActive) {
        isValid = false;
        reasons.push('INSURANCE_NOT_ACTIVE');
      }

      // Check if insurance is expired
      if (!isNotExpired) {
        isValid = false;
        if (now < validFrom) {
          reasons.push('INSURANCE_NOT_YET_VALID');
        } else {
          reasons.push('INSURANCE_EXPIRED');
        }
      }

      // Check if insurance is expiring soon (within 30 days)
      if (isNotExpired && daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
        reasons.push('INSURANCE_EXPIRING_SOON');
      }

      // Check BHYT number format (if Vietnamese insurance)
      if (insuranceInfo.isVietnameseInsurance && insuranceInfo.bhytNumber) {
        const bhytRegex = /^[A-Z]{2}-\d{1}-\d{2}-\d{4}-\d{5}-\d{5}$/;
        if (!bhytRegex.test(insuranceInfo.bhytNumber)) {
          isValid = false;
          reasons.push('INVALID_BHYT_NUMBER_FORMAT');
        }
      }

      // If no issues found
      if (reasons.length === 0) {
        reasons.push('VALID');
      }

      // 4. Return validation result
      return {
        success: true,
        message: isValid ? 'Bảo hiểm hợp lệ' : 'Bảo hiểm không hợp lệ',
        data: {
          patientId: request.patientId,
          hasInsurance: true,
          insuranceInfo: {
            provider: insuranceInfo.provider,
            policyNumber: insuranceInfo.policyNumber,
            coverageType: insuranceInfo.coverageType,
            isVietnameseInsurance: insuranceInfo.isVietnameseInsurance,
            bhytNumber: insuranceInfo.bhytNumber,
            validFrom: insuranceInfo.validFrom.toISOString(),
            validTo: insuranceInfo.validTo.toISOString(),
            isActive: insuranceInfo.isActive,
            isValid: isNotExpired,
            daysUntilExpiration: daysUntilExpiration > 0 ? daysUntilExpiration : undefined
          },
          validationResult: {
            isValid,
            reasons
          }
        }
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Xác thực bảo hiểm thất bại',
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

