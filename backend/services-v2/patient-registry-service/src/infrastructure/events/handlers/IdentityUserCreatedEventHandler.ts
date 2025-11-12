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

      // Auto-create patient record from user information
      // Use fullName from personalInfo, fallback to email prefix only if no personalInfo
      const fullName = eventData.personalInfo?.fullName || eventData.email.split('@')[0];

      this.logger.info('Auto-creating patient record from user creation event', {
        userId: eventData.userId,
        email: eventData.email,
        fullName: fullName,
        hasPersonalInfo: !!eventData.personalInfo
      });

      // Create patient using repository with minimal required data
      const patient = await this.patientRepository.createFromUserEvent({
        userId: eventData.userId,
        email: eventData.email,
        fullName: fullName,
        phoneNumber: eventData.personalInfo?.phoneNumber,
        address: eventData.personalInfo?.address,
        ward: undefined, // Will use fallback
        district: undefined, // Will use fallback
        city: undefined, // Will use fallback
        province: undefined, // Will use fallback
        dateOfBirth: eventData.personalInfo?.dateOfBirth,
        gender: eventData.personalInfo?.gender,
        citizenId: eventData.personalInfo?.citizenId
      });

      this.logger.info('Patient record created successfully', {
        userId: eventData.userId,
        patientId: patient.id,
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

