/**
 * UserDeactivatedEventHandler - Identity Service Event Consumer
 * Provider/Staff Service V2
 * 
 * Handles UserDeactivated events from Identity Service to terminate staff profiles
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { UserDeactivatedEvent } from '@shared/domain/events/domain-events';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../application/interfaces/ILogger';
import { IAuditService } from '../../application/interfaces/IAuditService';

/**
 * Handler for UserDeactivated Event from Identity Service
 * Terminates staff profile when user is deactivated
 */
export class UserDeactivatedEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService: IAuditService
  ) {}

  /**
   * Handle UserDeactivated event
   * Terminates staff profile (soft delete)
   */
  async handle(event: UserDeactivatedEvent): Promise<void> {
    try {
      this.logger.info('Handling UserDeactivated event from Identity Service', {
        userId: event.userId,
        email: event.email,
        reason: event.reason,
        deactivatedBy: event.deactivatedBy,
        eventId: event.eventId
      });

      // Find staff profile by user ID
      const staff = await this.staffRepository.findByUserId(event.userId);
      
      if (!staff) {
        this.logger.warn('No staff profile found for deactivated user', {
          userId: event.userId,
          email: event.email
        });
        return;
      }

      // Check if already terminated
      if (staff.status === 'terminated') {
        this.logger.info('Staff profile already terminated', {
          userId: event.userId,
          staffId: staff.id,
          status: staff.status
        });
        return;
      }

      // Terminate staff profile
      const terminationReason = `User deactivated in Identity Service: ${event.reason}`;
      staff.terminate(terminationReason, event.deactivatedBy);

      // Save updated staff profile
      await this.staffRepository.update(staff);

      this.logger.info('Staff profile terminated successfully from UserDeactivated event', {
        userId: event.userId,
        staffId: staff.id,
        oldStatus: 'active',
        newStatus: 'terminated',
        reason: terminationReason
      });

      // HIPAA audit logging
      await this.auditService.logDataModification({
        action: 'TERMINATE_STAFF_FROM_USER_EVENT',
        resourceType: 'ProviderStaff',
        resourceId: staff.id,
        userId: event.userId,
        timestamp: new Date(),
        details: {
          eventId: event.eventId,
          eventType: 'UserDeactivated',
          oldStatus: 'active',
          newStatus: 'terminated',
          reason: terminationReason,
          deactivatedBy: event.deactivatedBy,
          source: 'identity-service',
          autoTerminated: true
        },
        ipAddress: undefined,
        userAgent: undefined,
        sessionId: undefined
      });

      // Domain events (StaffTerminated) will be published by aggregate
      // and handled by StaffDomainEventHandler

    } catch (error) {
      this.logger.error('Error handling UserDeactivated event', {
        userId: event.userId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
