/**
 * VerifyInsuranceUseCase - Application Layer
 * Verify insurance with external system (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '@shared/application/services/logger.interface';

export interface VerifyInsuranceCommand {
  patientId: string;
  requestedBy: string;
}

export interface VerifyInsuranceResult {
  success: boolean;
  data?: {
    isValid: boolean;
    coverageType: string;
    validFrom: Date;
    validTo: Date;
    provider: string;
    verificationStatus: 'verified' | 'expired' | 'invalid' | 'not_found';
    verifiedAt: Date;
  };
  message: string;
  errors?: string[];
}

export class VerifyInsuranceUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private logger: ILogger
  ) {}

  async execute(command: VerifyInsuranceCommand): Promise<VerifyInsuranceResult> {
    this.logger.info('Verifying insurance', {
      patientId: command.patientId,
      requestedBy: command.requestedBy
    });

    try {
      if (!command.patientId || command.patientId.trim().length === 0) {
        return {
          success: false,
          message: 'Patient ID không được để trống',
          errors: ['INVALID_PATIENT_ID']
        };
      }

      const patientId = PatientId.create(command.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        return {
          success: false,
          message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      const insuranceInfo = patient.getInsuranceInfo();

      if (!insuranceInfo) {
        return {
          success: false,
          message: 'Bệnh nhân chưa có thông tin bảo hiểm',
          errors: ['NO_INSURANCE_INFO']
        };
      }

      // Verify insurance validity
      const now = new Date();
      const isValid = insuranceInfo.isActive && 
                     insuranceInfo.validFrom <= now && 
                     insuranceInfo.validTo >= now;

      let verificationStatus: 'verified' | 'expired' | 'invalid' | 'not_found';
      
      if (!insuranceInfo.isActive) {
        verificationStatus = 'invalid';
      } else if (insuranceInfo.validTo < now) {
        verificationStatus = 'expired';
      } else if (isValid) {
        verificationStatus = 'verified';
      } else {
        verificationStatus = 'not_found';
      }

      // TODO: Integrate with external BHYT/BHTN verification API
      // For now, we just verify based on local data

      this.logger.info('Insurance verified', {
        patientId: command.patientId,
        verificationStatus
      });

      return {
        success: true,
        data: {
          isValid,
          coverageType: insuranceInfo.coverageType,
          validFrom: insuranceInfo.validFrom,
          validTo: insuranceInfo.validTo,
          provider: insuranceInfo.provider,
          verificationStatus,
          verifiedAt: new Date()
        },
        message: 'Xác thực bảo hiểm thành công'
      };
    } catch (error) {
      this.logger.error('Error verifying insurance', {
        patientId: command.patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi khi xác thực bảo hiểm',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }
}

