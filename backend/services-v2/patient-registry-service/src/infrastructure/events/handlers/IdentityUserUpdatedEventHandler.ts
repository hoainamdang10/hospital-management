/**
 * IdentityUserUpdatedEventHandler
 * Handles identity.user.updated events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';

/**
 * Identity User Updated Event Data
 */
export interface IdentityUserUpdatedEventData {
  userId: string;
  email?: string;
  role?: string;
  fullName?: string;
  phoneNumber?: string;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Identity User Updated Event Handler
 * Processes user update events from Identity Service
 */
export class IdentityUserUpdatedEventHandler {
  constructor(
    private logger: ILogger,
    private patientRepository: IPatientRepository
  ) {}

  /**
   * Handle identity.user.updated event
   */
  async handle(eventData: IdentityUserUpdatedEventData): Promise<void> {
    try {
      this.logger.info('Processing identity.user.updated event', {
        userId: eventData.userId
      });

      // Find patient by user ID
      const patient = await this.patientRepository.findByUserId(eventData.userId);
      
      if (!patient) {
        this.logger.debug('No patient found for updated user', {
          userId: eventData.userId
        });
        return;
      }

      // Log the update - actual patient data sync can be implemented later
      // For now, we just track that the user was updated
      this.logger.info('User updated - patient record exists', {
        userId: eventData.userId,
        patientId: patient.id,
        hasEmailUpdate: !!eventData.email,
        hasPhoneUpdate: !!eventData.phoneNumber
      });

      // TODO: Implement patient data sync if needed
      // For example, update contact information if changed in Identity Service

    } catch (error) {
      this.logger.error('Error handling identity.user.updated event', {
        userId: eventData.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

