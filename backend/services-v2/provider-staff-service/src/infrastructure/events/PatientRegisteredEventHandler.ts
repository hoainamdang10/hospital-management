/**
 * PatientRegisteredEventHandler - Event Handler
 * Provider/Staff Service V2
 * 
 * Handles PatientRegistered events from Patient Registry Service
 * Logs patient registration for audit purposes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { ILogger } from '../../application/interfaces/ILogger';

export interface PatientRegisteredEventData {
  patientId: string;
  fullName: string;
  dateOfBirth?: string;
  gender: string;
  phoneNumber?: string;
  email?: string;
  registeredAt: string;
}

/**
 * Handler for PatientRegistered events
 * Logs patient registration for audit trail
 */
export class PatientRegisteredEventHandler {
  constructor(
    private logger: ILogger
  ) {}

  async handle(eventData: PatientRegisteredEventData): Promise<void> {
    try {
      this.logger.info('Handling PatientRegistered event', {
        patientId: eventData.patientId,
        fullName: eventData.fullName,
        registeredAt: eventData.registeredAt
      });

      // Log patient registration for audit
      // Provider/Staff service doesn't need to take action on patient registration
      // This is just for audit trail and potential future use cases
      this.logger.info('New patient registered in system', {
        patientId: eventData.patientId,
        fullName: eventData.fullName,
        gender: eventData.gender,
        registeredAt: eventData.registeredAt
      });

    } catch (error) {
      this.logger.error('Error handling PatientRegistered event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId: eventData.patientId
      });
      throw error;
    }
  }
}

