/**
 * IdentityUserCreatedEventHandler
 * Handles identity.user.created events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';

/**
 * Identity User Created Event Data
 * Matches payload structure from Identity Service DomainEventMapper
 */
export interface IdentityUserCreatedEventData {
  userId: string;
  email: string;
  role: string;
}

/**
 * Identity User Created Event Handler
 * Processes user creation events from Identity Service
 */
export class IdentityUserCreatedEventHandler {
  constructor(
    private logger: ILogger,
    private patientRepository: IPatientRepository
  ) {}

  /**
   * Handle identity.user.created event
   */
  async handle(eventData: IdentityUserCreatedEventData): Promise<void> {
    try {
      this.logger.info('Processing identity.user.created event', {
        userId: eventData.userId,
        role: eventData.role
      });

      // Only process if user role is PATIENT
      if (eventData.role !== 'PATIENT') {
        this.logger.debug('Skipping non-patient user creation', {
          userId: eventData.userId,
          role: eventData.role
        });
        return;
      }

      // Check if patient already exists for this user
      const existingPatient = await this.patientRepository.findByUserId(eventData.userId);
      
      if (existingPatient) {
        this.logger.warn('Patient already exists for user', {
          userId: eventData.userId,
          patientId: existingPatient.id
        });
        return;
      }

      // Log that patient registration is pending
      // Actual patient creation happens via RegisterPatientUseCase
      this.logger.info('User created with PATIENT role - awaiting patient registration', {
        userId: eventData.userId,
        email: eventData.email
      });

    } catch (error) {
      this.logger.error('Error handling identity.user.created event', {
        userId: eventData.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

