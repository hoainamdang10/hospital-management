/**
 * PatientUpdatedEventHandler - Event Handler
 * Provider/Staff Service V2
 * 
 * Handles PatientUpdated events from Patient Registry Service
 * Logs patient updates for audit purposes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { ILogger } from '../../application/interfaces/ILogger';

export interface PatientUpdatedEventData {
  patientId: string;
  updatedFields: Record<string, any>;
  updatedBy: string;
  updatedAt: string;
}

/**
 * Handler for PatientUpdated events
 * Logs patient updates for audit trail
 */
export class PatientUpdatedEventHandler {
  constructor(
    private logger: ILogger
  ) {}

  async handle(eventData: PatientUpdatedEventData): Promise<void> {
    try {
      this.logger.info('Handling PatientUpdated event', {
        patientId: eventData.patientId,
        updatedBy: eventData.updatedBy,
        updatedAt: eventData.updatedAt
      });

      // Log patient update for audit
      // Provider/Staff service doesn't need to take action on patient updates
      // This is just for audit trail and potential future use cases
      this.logger.info('Patient information updated', {
        patientId: eventData.patientId,
        updatedFields: Object.keys(eventData.updatedFields),
        updatedBy: eventData.updatedBy,
        updatedAt: eventData.updatedAt
      });

    } catch (error) {
      this.logger.error('Error handling PatientUpdated event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId: eventData.patientId
      });
      throw error;
    }
  }
}

