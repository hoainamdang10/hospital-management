/**
 * GrantConsentUseCase - Application Layer
 * Grant consent for patient data usage (HIPAA compliance)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientConsent } from '../../domain/entities/PatientConsent';
import { PatientId } from '../../domain/value-objects/PatientId';
import { IAuditService } from '@shared/application/services/audit.service.interface';
import { ILogger } from '@shared/application/services/logger.interface';

export interface GrantConsentCommand {
  patientId: string;
  consentType: string; // e.g., 'data_sharing', 'treatment', 'research'
  grantedBy: string; // User ID who granted consent
  expiresAt?: Date;
  notes?: string;
  performedBy: string;
}

export interface GrantConsentResult {
  success: boolean;
  consentId: string;
  message: string;
}

/**
 * Use Case: Grant Patient Consent
 */
export class GrantConsentUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private auditService: IAuditService,
    private logger: ILogger,
  ) {}

  async execute(command: GrantConsentCommand): Promise<GrantConsentResult> {
    // 1. Validate input
    if (!command.patientId || command.patientId.trim().length === 0) {
      throw new Error('Patient ID không được để trống');
    }

    if (!command.consentType || command.consentType.trim().length === 0) {
      throw new Error('Loại đồng ý không được để trống');
    }

    if (!command.grantedBy || command.grantedBy.trim().length === 0) {
      throw new Error('Người cấp đồng ý không được để trống');
    }

    if (!command.performedBy || command.performedBy.trim().length === 0) {
      throw new Error('Người thực hiện không được để trống');
    }

    // 2. Find patient
    const patientId = PatientId.create(command.patientId);
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new Error(`Không tìm thấy bệnh nhân với ID: ${command.patientId}`);
    }

    // 3. Grant consent
    const consent = PatientConsent.grant(
      patientId,
      command.consentType,
      command.grantedBy,
      command.expiresAt,
      command.notes
    );

    // 4. Grant consent to patient
    patient.grantConsent(consent, command.performedBy);

    // 5. Save patient
    await this.patientRepository.save(patient);

    // 6. HIPAA audit logging
    await this.auditConsentGranted(patient, command, consent);

    return {
      success: true,
      consentId: consent.getId(),
      message: 'Đã cấp đồng ý thành công'
    };
  }

  /**
   * HIPAA audit logging for consent granted
   */
  private async auditConsentGranted(
    patient: any,
    command: GrantConsentCommand,
    consent: PatientConsent,
  ): Promise<void> {
    try {
      await this.auditService.log({
        userId: command.performedBy,
        action: 'CONSENT_GRANTED',
        resource: 'patient_consents',
        resourceId: patient.getPatientId() || undefined,
        details: {
          consentId: consent.getId(),
          consentType: command.consentType,
          grantedBy: command.grantedBy,
          expiresAt: command.expiresAt?.toISOString(),
          complianceLevel: 'HIPAA',
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.info('HIPAA Audit: Consent granted', {
        action: 'CONSENT_GRANTED',
        patientId: patient.getPatientId(),
        consentId: consent.getId(),
        performedBy: command.performedBy,
      });
    } catch (error) {
      this.logger.error('Failed to log HIPAA audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId: patient.getPatientId(),
        action: 'CONSENT_GRANTED',
      });
    }
  }
}

