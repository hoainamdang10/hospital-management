/**
 * RevokeConsentUseCase - Application Layer
 * Revoke patient consent (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';

export interface RevokeConsentCommand {
  patientId: string;
  consentId: string;
  performedBy: string;
}

export interface RevokeConsentResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Use Case: Revoke Consent
 */
export class RevokeConsentUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private eventBus: IEventBus,
    private logger: ILogger
  ) {}

  async execute(command: RevokeConsentCommand): Promise<RevokeConsentResult> {
    this.logger.info('Revoking consent', {
      patientId: command.patientId,
      consentId: command.consentId,
      performedBy: command.performedBy
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

      if (!command.consentId || command.consentId.trim().length === 0) {
        return {
          success: false,
          message: 'Consent ID không được để trống',
          errors: ['INVALID_CONSENT_ID']
        };
      }

      if (!command.performedBy || command.performedBy.trim().length === 0) {
        return {
          success: false,
          message: 'Người thực hiện không được để trống',
          errors: ['INVALID_PERFORMED_BY']
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

      // 3. Find consent
      const consents = patient.getConsents();
      const consent = consents.find(c => c.getId() === command.consentId);

      if (!consent) {
        return {
          success: false,
          message: `Không tìm thấy đồng ý với ID: ${command.consentId}`,
          errors: ['CONSENT_NOT_FOUND']
        };
      }

      // 4. Check if already withdrawn
      if (!consent.isActive) {
        return {
          success: false,
          message: 'Đồng ý đã được thu hồi trước đó',
          errors: ['CONSENT_ALREADY_WITHDRAWN']
        };
      }

      // 5. Withdraw consent
      consent.withdraw();

      // 6. Save patient
      await this.patientRepository.save(patient);

      // 7. Publish domain events
      await this.publishDomainEvents(patient);

      this.logger.info('Consent revoked successfully', {
        patientId: command.patientId,
        consentId: command.consentId
      });

      return {
        success: true,
        message: 'Thu hồi đồng ý thành công'
      };
    } catch (error) {
      this.logger.error('Error revoking consent', {
        patientId: command.patientId,
        consentId: command.consentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi khi thu hồi đồng ý',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  private async publishDomainEvents(patient: any): Promise<void> {
    try {
      const events = patient.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      patient.markEventsAsCommitted();
    } catch (error) {
      this.logger.warn('Event publishing failed, but consent was revoked', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

