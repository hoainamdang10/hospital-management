/**
 * GetConsentsUseCase - Application Layer
 * Get all consents for a patient (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '@shared/application/services/logger.interface';

export interface GetConsentsCommand {
  patientId: string;
  requestedBy: string;
}

export interface ConsentDTO {
  id: string;
  consentType: string;
  isActive: boolean;
  grantedAt: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  witnessId?: string;
  notes?: string;
  isExpired: boolean;
  isValid: boolean;
  daysUntilExpiry: number | null;
}

export interface GetConsentsResult {
  success: boolean;
  data?: {
    patientId: string;
    consents: ConsentDTO[];
    totalCount: number;
  };
  message: string;
  errors?: string[];
}

/**
 * Use Case: Get All Consents
 */
export class GetConsentsUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private logger: ILogger
  ) {}

  async execute(command: GetConsentsCommand): Promise<GetConsentsResult> {
    this.logger.info('Getting consents', {
      patientId: command.patientId,
      requestedBy: command.requestedBy
    });

    try {
      // 1. Validate input
      if (!command.patientId || command.patientId.trim().length === 0) {
        return {
          success: false,
          message: 'Patient ID không được để trống',
          errors: ['INVALID_PATIENT_ID']
        };
      }

      if (!command.requestedBy || command.requestedBy.trim().length === 0) {
        return {
          success: false,
          message: 'Người yêu cầu không được để trống',
          errors: ['INVALID_REQUESTED_BY']
        };
      }

      // 2. Find patient
      const patientId = PatientId.create(command.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        return {
          success: false,
          message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      // 3. Get consents
      const consents = patient.getConsents();

      // 4. Map to DTOs
      const consentDTOs: ConsentDTO[] = consents.map(consent => ({
        id: consent.getId(),
        consentType: consent.consentType,
        isActive: consent.isActive,
        grantedAt: consent.grantedAt,
        withdrawnAt: consent.withdrawnAt,
        expiresAt: consent.expiresAt,
        witnessId: consent.witnessId,
        notes: consent.notes,
        isExpired: consent.isExpired(),
        isValid: consent.isValid(),
        daysUntilExpiry: consent.getDaysUntilExpiry()
      }));

      this.logger.info('Consents retrieved successfully', {
        patientId: command.patientId,
        totalCount: consentDTOs.length
      });

      return {
        success: true,
        data: {
          patientId: command.patientId,
          consents: consentDTOs,
          totalCount: consentDTOs.length
        },
        message: 'Lấy danh sách đồng ý thành công'
      };
    } catch (error) {
      this.logger.error('Error getting consents', {
        patientId: command.patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi khi lấy danh sách đồng ý',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }
}

