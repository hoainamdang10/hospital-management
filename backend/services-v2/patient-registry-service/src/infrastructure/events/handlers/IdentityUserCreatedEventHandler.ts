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
  personalInfo?: {
    fullName: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    citizenId?: string;
  };
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
   * Note: This event is now handled for tracking purposes only.
   * Patient records are created when UserActivatedEvent is received (after email verification).
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

      // Check if patient already exists for this user (should not happen in correct flow)
      const existingPatient = await this.patientRepository.findByUserId(eventData.userId);

      if (existingPatient) {
        this.logger.warn('Patient already exists for user (unexpected state)', {
          userId: eventData.userId,
          patientId: existingPatient.id,
          note: 'This may indicate a duplicate event or incorrect flow'
        });
        return;
      }

      // Log user creation for tracking - patient will be created on UserActivatedEvent
      this.logger.info('User created - waiting for email verification to create patient record', {
        userId: eventData.userId,
        email: eventData.email,
        role: eventData.role,
        hasPersonalInfo: !!eventData.personalInfo,
        nextStep: 'UserActivatedEvent will trigger patient record creation'
      });

      // TODO: Optionally store pending patient creation request in a temporary table
      // for better tracking and recovery if email verification fails

    } catch (error) {
      this.logger.error('Error handling identity.user.created event', {
        userId: eventData.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

