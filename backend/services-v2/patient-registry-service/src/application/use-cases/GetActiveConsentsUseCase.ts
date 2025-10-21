/**
 * GetActiveConsentsUseCase - Application Layer
 * Get only active (valid) consents for a patient (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '@shared/application/services/logger.interface';

export interface GetActiveConsentsCommand {
  patientId: string;
  requestedBy: string;
}

export interface ActiveConsentDTO {
  id: string;
  consentType: string;
  grantedAt: Date;
  expiresAt?: Date;
  witnessId?: string;
  notes?: string;
  daysUntilExpiry: number | null;
}

export interface GetActiveConsentsResult {
  success: boolean;
  data?: {
    patientId: string;
    activeConsents: ActiveConsentDTO[];
    totalCount: number;
  };
  message: string;
  errors?: string[];
}

/**
 * Use Case: Get Active Consents Only
 */
export class GetActiveConsentsUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private logger: ILogger
  ) {}

  async execute(command: GetActiveConsentsCommand): Promise<GetActiveConsentsResult> {
    this.logger.info('Getting active consents', {
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

      // 3. Get all consents and filter active ones
      const allConsents = patient.getConsents();
      const activeConsents = allConsents.filter(consent => consent.isValid());

      // 4. Map to DTOs
      const activeConsentDTOs: ActiveConsentDTO[] = activeConsents.map(consent => ({
        id: consent.getId(),
        consentType: consent.consentType,
        grantedAt: consent.grantedAt,
        expiresAt: consent.expiresAt,
        witnessId: consent.witnessId,
        notes: consent.notes,
        daysUntilExpiry: consent.getDaysUntilExpiry()
      }));

      this.logger.info('Active consents retrieved successfully', {
        patientId: command.patientId,
        totalCount: activeConsentDTOs.length
      });

      return {
        success: true,
        data: {
          patientId: command.patientId,
          activeConsents: activeConsentDTOs,
          totalCount: activeConsentDTOs.length
        },
        message: 'Lấy danh sách đồng ý đang hoạt động thành công'
      };
    } catch (error) {
      this.logger.error('Error getting active consents', {
        patientId: command.patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi khi lấy danh sách đồng ý đang hoạt động',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }
}

