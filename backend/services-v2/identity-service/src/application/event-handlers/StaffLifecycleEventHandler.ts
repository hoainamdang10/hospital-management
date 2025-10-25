/**
 * StaffLifecycleEventHandler - Handle staff lifecycle events from Provider Staff Service
 * 
 * Handles:
 * - staff.registered → Activate user account when staff is registered
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, HIPAA
 */

import { ILogger } from '../services/ILogger';
import { ActivateUserUseCase } from '../use-cases/ActivateUserUseCase';
import { InboxService } from '../../infrastructure/inbox/InboxService';

export interface StaffRegisteredEvent {
  eventId: string;
  staffId: string;
  userId: string;
  staffType: string; // 'DOCTOR', 'NURSE', etc.
  licenseNumber: string;
  employmentType: string;
  hireDate: Date;
  occurredAt: Date;
}

export class StaffLifecycleEventHandler {
  constructor(
    private activateUserUseCase: ActivateUserUseCase,
    private inboxService: InboxService,
    private logger: ILogger
  ) {}

  /**
   * Handle staff.registered event
   * Activate user account when staff is successfully registered
   */
  async handleStaffRegistered(event: StaffRegisteredEvent): Promise<void> {
    try {
      // Idempotency check
      const processed = await this.inboxService.checkProcessed(event.eventId);
      if (processed) {
        this.logger.debug('Event already processed', { eventId: event.eventId });
        return;
      }

      // Store event in inbox
      await this.inboxService.storeEvent({
        eventId: event.eventId,
        eventType: 'StaffRegisteredEvent',
        aggregateId: event.staffId,
        aggregateType: 'Staff',
        payloadJson: event,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.registered',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing staff registered event', {
        eventId: event.eventId,
        staffId: event.staffId,
        userId: event.userId,
        staffType: event.staffType
      });

      // Activate user account
      await this.activateUserUseCase.execute({
        userId: event.userId,
        activatedBy: 'SYSTEM_AUTO',
        reason: `Staff registered: ${event.staffType} (License: ${event.licenseNumber})`
      });

      this.logger.info('User account activated after staff registration', {
        userId: event.userId,
        staffId: event.staffId,
        staffType: event.staffType,
        licenseNumber: event.licenseNumber
      });

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling staff registered event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error)
      });
      await this.inboxService.markFailed(
        event.eventId,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }
}
