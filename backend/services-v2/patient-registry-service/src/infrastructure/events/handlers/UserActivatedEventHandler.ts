/**
 * UserActivatedEventHandler
 * Handles user.activated events from Identity Service
 * Creates patient records or reactivates existing ones
 */

import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientRepository } from '../../../domain/repositories/IPatientRepository';
import { PatientStatus } from '../../../domain/value-objects/PatientStatus';

export interface UserActivatedEventData {
  userId?: string;
  email?: string;
  fullName?: string;
  activatedAt?: Date | string;
  eventData?: UserActivatedEventData; // Some publishers wrap payload
}

export class UserActivatedEventHandler {
  constructor(
    private logger: ILogger,
    private patientRepository: IPatientRepository,
  ) {}

  async handle(rawEventData: UserActivatedEventData): Promise<void> {
    try {
      const eventData = this.normalizeEventData(rawEventData);

      if (!eventData) {
        this.logger.warn('user.activated event missing userId, skipping', {
          raw: rawEventData,
        });
        return;
      }

      this.logger.info('Processing user.activated event', {
        userId: eventData.userId,
        email: eventData.email,
        activatedAt: eventData.activatedAt,
      });

      const existingPatient = await this.patientRepository.findByUserId(
        eventData.userId,
      );

      if (existingPatient) {
        if (existingPatient.isActive()) {
          this.logger.warn('Patient already active for activated user', {
            userId: eventData.userId,
            patientId: existingPatient.id,
            note: 'Skipping duplicate activation event',
          });
          return;
        }

        const updateResult = await this.patientRepository.updateStatusByUserId(
          eventData.userId,
          PatientStatus.ACTIVE,
          {
            updatedBy: eventData.userId,
            reason: 'Identity user activated',
            source: 'identity.user.activated',
          },
        );

        if (updateResult.updated) {
          this.logger.info('Patient status reactivated from identity event', {
            userId: eventData.userId,
            patientId: updateResult.patientId,
            previousStatus: updateResult.previousStatus,
          });
        } else {
          this.logger.debug(
            'Patient status already active when processing identity event',
            {
              userId: eventData.userId,
              patientId: updateResult.patientId,
              previousStatus: updateResult.previousStatus,
            },
          );
        }

        return;
      }

      this.logger.info('Creating patient record for activated user', {
        userId: eventData.userId,
        email: eventData.email,
        fullName: eventData.fullName,
        activatedAt: eventData.activatedAt,
      });

      const patient = await this.patientRepository.createFromUserEvent({
        userId: eventData.userId,
        email: eventData.email || '',
        fullName: eventData.fullName,
        phoneNumber: 'Chưa cập nhật',
        address: 'Chưa cập nhật',
        ward: 'Chưa cập nhật',
        district: 'Chưa cập nhật',
        city: 'Chưa cập nhật',
        province: 'Chưa cập nhật',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'other',
        citizenId: 'Chưa cập nhật',
      });

      this.logger.info(
        'Patient record created successfully from user activation',
        {
          userId: eventData.userId,
          patientId: patient.id,
          email: eventData.email,
          activatedAt: eventData.activatedAt,
        },
      );
    } catch (error) {
      this.logger.error('Error handling user.activated event', {
        userId:
          rawEventData.userId ?? rawEventData?.eventData?.userId ?? 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private normalizeEventData(
    raw: UserActivatedEventData,
  ): { userId: string; email?: string; fullName: string; activatedAt?: Date } | null {
    const payload = (raw?.eventData as UserActivatedEventData) ?? raw ?? {};
    const userId =
      payload.userId ??
      (payload as any)?.aggregateId ??
      (payload as any)?.id ??
      null;

    if (!userId || typeof userId !== 'string') {
      return null;
    }

    const email =
      payload.email ??
      (payload as any)?.contactEmail ??
      (payload as any)?.emailAddress;

    const activatedAtValue = payload.activatedAt;
    const activatedAt =
      activatedAtValue instanceof Date
        ? activatedAtValue
        : activatedAtValue
        ? new Date(activatedAtValue)
        : undefined;

    const fallbackName =
      email && email.includes('@')
        ? email.split('@')[0]
        : `User-${userId.substring(0, 8)}`;

    return {
      userId,
      email,
      fullName: payload.fullName ?? fallbackName,
      activatedAt,
    };
  }
}
