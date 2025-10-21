/**
 * GetInsuranceInfoUseCase - Application Layer
 * Get insurance information for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '@shared/application/services/logger.interface';

export interface GetInsuranceInfoCommand {
  patientId: string;
  requestedBy: string;
}

export interface InsuranceInfoDTO {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validFrom: Date;
  validTo: Date;
  coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
  isActive: boolean;
  isPrimary: boolean;
  isVietnameseInsurance: boolean;
  bhytNumber?: string;
}

export interface GetInsuranceInfoResult {
  success: boolean;
  data?: InsuranceInfoDTO;
  message: string;
  errors?: string[];
}

export class GetInsuranceInfoUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private logger: ILogger
  ) {}

  async execute(command: GetInsuranceInfoCommand): Promise<GetInsuranceInfoResult> {
    this.logger.info('Getting insurance info', {
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

      const insuranceDTO: InsuranceInfoDTO = {
        provider: insuranceInfo.provider,
        policyNumber: insuranceInfo.policyNumber,
        groupNumber: insuranceInfo.groupNumber,
        validFrom: insuranceInfo.validFrom,
        validTo: insuranceInfo.validTo,
        coverageType: insuranceInfo.coverageType,
        isActive: insuranceInfo.isActive,
        isPrimary: insuranceInfo.isPrimary,
        isVietnameseInsurance: insuranceInfo.isVietnameseInsurance,
        bhytNumber: insuranceInfo.bhytNumber
      };

      return {
        success: true,
        data: insuranceDTO,
        message: 'Lấy thông tin bảo hiểm thành công'
      };
    } catch (error) {
      this.logger.error('Error getting insurance info', {
        patientId: command.patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi khi lấy thông tin bảo hiểm',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }
}

