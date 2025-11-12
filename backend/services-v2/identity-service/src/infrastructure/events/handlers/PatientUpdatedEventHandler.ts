/**
 * PatientUpdatedEventHandler
 * Handles patient.updated events from Patient Registry Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ILogger } from '@shared/application/services/logger.interface';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

/**
 * Patient Updated Event Data
 */
export interface PatientUpdatedEventData {
  patientId: string;
  userId: string;
  updateType: string;
  updatedBy: string;
  updatedAt: Date;
  personalInfo?: {
    fullName?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    citizenId?: string;
  };
  contactInfo?: {
    phoneNumber?: string;
    email?: string;
    address?: {
      street?: string;
      ward?: string;
      district?: string;
      city?: string;
      province?: string;
      country?: string;
    };
  };
}

/**
 * Patient Updated Event Handler
 * Processes patient update events from Patient Registry Service
 */
export class PatientUpdatedEventHandler {
  constructor(
    private logger: ILogger,
    private userRepository: IUserRepository
  ) {}

  /**
   * Handle patient.updated event
   */
  async handle(eventData: PatientUpdatedEventData): Promise<void> {
    try {
      this.logger.info('Processing patient.updated event', {
        userId: eventData.userId,
        patientId: eventData.patientId,
        updateType: eventData.updateType
      });

      // Find user by ID
      const user = await this.userRepository.findById(eventData.userId);
      
      if (!user) {
        this.logger.warn('User not found for patient update', {
          userId: eventData.userId,
          patientId: eventData.patientId
        });
        return;
      }

      // Prepare update data for user profile
      const profileUpdates: any = {};

      // Sync personal info if provided
      if (eventData.personalInfo) {
        if (eventData.personalInfo.fullName) {
          profileUpdates.full_name = eventData.personalInfo.fullName;
        }
        if (eventData.personalInfo.dateOfBirth) {
          profileUpdates.date_of_birth = eventData.personalInfo.dateOfBirth;
        }
        if (eventData.personalInfo.gender) {
          profileUpdates.gender = eventData.personalInfo.gender;
        }
        if (eventData.personalInfo.citizenId) {
          profileUpdates.citizen_id = eventData.personalInfo.citizenId;
        }
      }

      // Sync contact info if provided
      if (eventData.contactInfo) {
        if (eventData.contactInfo.phoneNumber) {
          profileUpdates.phone_number = eventData.contactInfo.phoneNumber;
        }
        if (eventData.contactInfo.address) {
          profileUpdates.address = eventData.contactInfo.address.street;
          profileUpdates.ward = eventData.contactInfo.address.ward;
          profileUpdates.district = eventData.contactInfo.address.district;
          profileUpdates.city = eventData.contactInfo.address.city;
          profileUpdates.province = eventData.contactInfo.address.province;
          profileUpdates.country = eventData.contactInfo.address.country || 'Vietnam';
        }
      }

      // Only update if there are changes
      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date();
        profileUpdates.updated_by = eventData.updatedBy;

        await this.userRepository.updateProfile(eventData.userId, profileUpdates);

        this.logger.info('User profile synced from patient update', {
          userId: eventData.userId,
          patientId: eventData.patientId,
          updateType: eventData.updateType,
          fields: Object.keys(profileUpdates)
        });
      } else {
        this.logger.debug('No syncable data in patient update', {
          userId: eventData.userId,
          patientId: eventData.patientId,
          updateType: eventData.updateType
        });
      }

    } catch (error) {
      this.logger.error('Error handling patient.updated event', {
        userId: eventData.userId,
        patientId: eventData.patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
