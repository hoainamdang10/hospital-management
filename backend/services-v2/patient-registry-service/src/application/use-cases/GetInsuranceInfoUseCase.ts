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

export interface GetInsuranceInfoResponseData {
  patientId: string;
  insuranceInfo: InsuranceInfoDTO | null;
  hasInsurance: boolean;
}

export interface GetInsuranceInfoResult {
  success: boolean;
  data?: GetInsuranceInfoResponseData;
  message: string;
  errors?: string[];
}

export class GetInsuranceInfoUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private logger: ILogger
  ) { }

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

      //  FIX: Handle both UUID and PAT-YYYYMM-XXX formats
      let patient: any = null;
      const inputId = command.patientId.trim();

      // Check if input is UUID format
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

      if (uuidRegex.test(inputId)) {
        // Try to find by userId (UUID)
        patient = await this.patientRepository.findByUserId(inputId);
      } else {
        // Assume it's PAT-YYYYMM-XXX format
        try {
          const patientId = PatientId.create(inputId);
          patient = await this.patientRepository.findById(patientId);
        } catch (error) {
          // If not valid PAT format, try to find by userId as fallback
          patient = await this.patientRepository.findByUserId(inputId);
        }
      }

      if (!patient) {
        return {
          success: false,
          message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      const insuranceInfo = patient.getInsuranceInfo();

      //  ALWAYS return success with structured data (even if no insurance)
      // This matches the pattern used by Emergency Contacts API
      if (!insuranceInfo) {
        return {
          success: true,
          data: {
            patientId: command.patientId,
            insuranceInfo: null,
            hasInsurance: false
          },
          message: 'Bệnh nhân chưa có thông tin bảo hiểm'
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
        data: {
          patientId: command.patientId,
          insuranceInfo: insuranceDTO,
          hasInsurance: true
        },
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

