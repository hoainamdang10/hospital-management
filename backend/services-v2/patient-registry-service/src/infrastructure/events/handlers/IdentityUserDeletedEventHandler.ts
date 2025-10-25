/**
 * IdentityUserDeletedEventHandler
 * Handles identity.user.deleted events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';

/**
 * Identity User Deleted Event Data
 */
export interface IdentityUserDeletedEventData {
  userId: string;
  email: string;
  role: string;
  deletedAt: string;
  deletedBy: string;
}

/**
 * Identity User Deleted Event Handler
 * Processes user deletion events from Identity Service
 */
export class IdentityUserDeletedEventHandler {
  constructor(
    private logger: ILogger,
    private patientRepository: IPatientRepository
  ) {}

  /**
   * Handle identity.user.deleted event
   */
  async handle(eventData: IdentityUserDeletedEventData): Promise<void> {
    try {
      this.logger.info('Processing identity.user.deleted event', {
        userId: eventData.userId,
        role: eventData.role
      });

      // Only process if user role is PATIENT
      if (eventData.role !== 'PATIENT') {
        this.logger.debug('Skipping non-patient user deletion', {
          userId: eventData.userId,
          role: eventData.role
        });
        return;
      }

      // Find patient by user ID
      const patient = await this.patientRepository.findByUserId(eventData.userId);
      
      if (!patient) {
        this.logger.warn('No patient found for deleted user', {
          userId: eventData.userId
        });
        return;
      }

      // Deactivate patient (soft delete)
      // Note: We don't hard delete patient records for compliance/audit reasons
      if (patient.isActive()) {
        patient.deactivate('User account deleted', eventData.deletedBy);
        await this.patientRepository.save(patient);

        this.logger.info('Patient deactivated due to user deletion', {
          userId: eventData.userId,
          patientId: patient.id
        });
      } else {
        this.logger.debug('Patient already inactive', {
          userId: eventData.userId,
          patientId: patient.id
        });
      }

    } catch (error) {
      this.logger.error('Error handling identity.user.deleted event', {
        userId: eventData.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

