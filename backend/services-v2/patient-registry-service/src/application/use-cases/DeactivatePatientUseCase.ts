/**
 * DeactivatePatientUseCase - Application Use Case
 *
 * Deactivates a patient (soft delete)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { Patient } from '../../domain/aggregates/Patient';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';

export interface DeactivatePatientRequest {
  patientId: string;
  reason: string;  // Reason for deactivation
  performedBy: string;  // User who performed the deactivation
}

export interface DeactivatePatientResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    patientId: string;
    deactivatedAt: string;
  };
}

export class DeactivatePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(request: DeactivatePatientRequest): Promise<DeactivatePatientResponse> {
    try {
      this.logger.info('Starting patient deactivation', {
        patientId: request.patientId,
        performedBy: request.performedBy,
        reason: request.reason
      });

      // 1. Find patient
      const patientId = PatientId.create(request.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        this.logger.warn('Patient deactivation failed: patient not found', {
          patientId: request.patientId
        });
        return {
          success: false,
          message: 'Không tìm thấy bệnh nhân',
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      // 2. Check if patient is already inactive
      if (patient.isInactive()) {
        return {
          success: false,
          message: 'Bệnh nhân đã bị vô hiệu hóa trước đó',
          errors: ['PATIENT_ALREADY_INACTIVE']
        };
      }

      // 3. Check if patient is merged
      if (patient.isMerged()) {
        return {
          success: false,
          message: 'Không thể vô hiệu hóa bệnh nhân đã được merge',
          errors: ['PATIENT_ALREADY_MERGED']
        };
      }

      // 4. Check if patient is deceased
      if (patient.isDeceased()) {
        return {
          success: false,
          message: 'Không thể vô hiệu hóa bệnh nhân đã qua đời',
          errors: ['PATIENT_ALREADY_DECEASED']
        };
      }

      // 5. Deactivate patient
      patient.deactivate(request.reason, request.performedBy);

      // 6. Save patient
      await this.patientRepository.save(patient);

      // 7. Publish domain events
      await this.publishDomainEvents(patient);

      // 8. HIPAA audit logging
      await this.auditPatientDeactivation(patient, request);

      this.logger.info('Patient deactivation completed successfully', {
        patientId: request.patientId,
        performedBy: request.performedBy
      });

      // 9. Return success response
      return {
        success: true,
        message: 'Vô hiệu hóa bệnh nhân thành công',
        data: {
          patientId: request.patientId,
          deactivatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        this.logger.error('Patient deactivation failed', {
          patientId: request.patientId,
          error: error.message,
          stack: error.stack
        });
        return {
          success: false,
          message: 'Vô hiệu hóa bệnh nhân thất bại',
          errors: [error.message]
        };
      }

      // Handle unexpected errors
      this.logger.error('Unexpected error during patient deactivation', {
        patientId: request.patientId,
        error: 'UNEXPECTED_ERROR'
      });
      return {
        success: false,
        message: 'Đã xảy ra lỗi không mong muốn',
        errors: ['UNEXPECTED_ERROR']
      };
    }
  }

  /**
   * Publish domain events
   */
  private async publishDomainEvents(patient: Patient): Promise<void> {
    try {
      const events = patient.getUncommittedEvents();

      for (const event of events) {
        await this.eventBus.publish(event);
      }

      patient.markEventsAsCommitted();
    } catch (error) {
      this.logger.warn('Event publishing failed, but patient was deactivated', {
        patientId: patient.getPatientId(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * HIPAA audit logging for patient deactivation
   */
  private async auditPatientDeactivation(
    patient: Patient,
    request: DeactivatePatientRequest
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Patient deactivation', {
      action: 'PATIENT_DEACTIVATION',
      patientId: patient.getPatientId(),
      performedBy: request.performedBy,
      reason: request.reason,
      timestamp: new Date().toISOString(),
      dataAccessed: 'patient_status',
      complianceLevel: 'hipaa'
    });
  }
}

