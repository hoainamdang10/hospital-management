/**
 * AddInsuranceInfoUseCase - Application Layer
 * Allows adding insurance information after patient registration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { InsuranceInfo } from '../../domain/entities/InsuranceInfo';
import { ILogger } from '@shared/application/services/logger.interface';

export interface AddInsuranceInfoCommand {
  patientId: string;
  performedBy: string;
  payload: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: string;
    validTo: string;
    coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    isVietnameseInsurance: boolean;
    bhytNumber?: string;
    isPrimary?: boolean;
    isActive?: boolean;
  };
}

export interface AddInsuranceInfoResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export class AddInsuranceInfoUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly logger: ILogger,
  ) {}

  async execute(
    command: AddInsuranceInfoCommand,
  ): Promise<AddInsuranceInfoResult> {
    this.logger.info('Adding insurance info', {
      patientId: command.patientId,
      performedBy: command.performedBy,
    });

    try {
      if (!command.patientId?.trim()) {
        return {
          success: false,
          message: 'Patient ID không được để trống',
          errors: ['INVALID_PATIENT_ID'],
        };
      }

      const patientId = PatientId.create(command.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        return {
          success: false,
          message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
          errors: ['PATIENT_NOT_FOUND'],
        };
      }

      if (patient.getInsuranceInfo()) {
        return {
          success: false,
          message: 'Bệnh nhân đã có thông tin bảo hiểm, vui lòng sử dụng endpoint cập nhật',
          errors: ['INSURANCE_ALREADY_EXISTS'],
        };
      }

      const validFrom = new Date(command.payload.validFrom);
      const validTo = new Date(command.payload.validTo);

      if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validTo.getTime())) {
        return {
          success: false,
          message: 'Ngày hiệu lực bảo hiểm không hợp lệ',
          errors: ['INVALID_INSURANCE_DATES'],
        };
      }

      const insuranceInfo = InsuranceInfo.create({
        provider: command.payload.provider,
        policyNumber: command.payload.policyNumber,
        groupNumber: command.payload.groupNumber,
        validFrom,
        validTo,
        coverageType: command.payload.coverageType,
        isActive: command.payload.isActive ?? true,
        isPrimary: command.payload.isPrimary ?? true,
        isVietnameseInsurance: command.payload.isVietnameseInsurance,
        bhytNumber: command.payload.bhytNumber,
      });

      patient.updateInsuranceInfo(insuranceInfo, command.performedBy);
      await this.patientRepository.save(patient);

      return {
        success: true,
        message: 'Đã thêm thông tin bảo hiểm thành công',
      };
    } catch (error) {
      this.logger.error('Failed to add insurance info', {
        patientId: command.patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        message: 'Không thể thêm thông tin bảo hiểm',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR'],
      };
    }
  }
}
