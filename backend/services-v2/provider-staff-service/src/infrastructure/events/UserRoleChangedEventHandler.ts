/**
 * UserRoleChangedEventHandler - Identity Service Event Consumer
 * Provider/Staff Service V2
 * 
 * Handles UserRoleChanged events from Identity Service to sync staff profile changes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { UserRoleChangedEvent } from '@shared/domain/events/domain-events';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../application/interfaces/ILogger';
import { IAuditService } from '../../application/interfaces/IAuditService';

/**
 * Handler for UserRoleChanged Event from Identity Service
 * Syncs staff profile when user role changes
 */
export class UserRoleChangedEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService: IAuditService
  ) {}

  /**
   * Handle UserRoleChanged event
   * Updates staff type or creates/terminates staff profile based on role change
   */
  async handle(event: UserRoleChangedEvent): Promise<void> {
    try {
      this.logger.info('Handling UserRoleChanged event from Identity Service', {
        userId: event.userId,
        oldRole: event.oldRole,
        newRole: event.newRole,
        changedBy: event.changedBy,
        reason: event.reason,
        eventId: event.eventId
      });

      const healthcareRoles = ['doctor', 'nurse', 'technician', 'pharmacist', 'therapist'];
      const wasHealthcareRole = healthcareRoles.includes(event.oldRole);
      const isHealthcareRole = healthcareRoles.includes(event.newRole);

      // Find existing staff profile
      const staff = await this.staffRepository.findByUserId(event.userId);

      // Case 1: Non-healthcare → Healthcare (Create staff profile)
      if (!wasHealthcareRole && isHealthcareRole) {
        if (staff) {
          this.logger.warn('Staff profile already exists, skipping creation', {
            userId: event.userId,
            staffId: staff.id
          });
          return;
        }

        this.logger.info('User role changed to healthcare role, staff profile should be created', {
          userId: event.userId,
          newRole: event.newRole
        });

        // Note: Staff profile creation will be handled by UserCreatedEventHandler
        // or manually by admin. We just log this for now.
        await this.auditService.logSecurityEvent({
          action: 'USER_ROLE_CHANGED_TO_HEALTHCARE',
          resourceType: 'User',
          resourceId: event.userId,
          userId: event.changedBy,
          timestamp: new Date(),
          details: {
            eventId: event.eventId,
            oldRole: event.oldRole,
            newRole: event.newRole,
            reason: event.reason,
            requiresStaffProfileCreation: true
          }
        });

        return;
      }

      // Case 2: Healthcare → Non-healthcare (Terminate staff profile)
      if (wasHealthcareRole && !isHealthcareRole) {
        if (!staff) {
          this.logger.warn('No staff profile found for user with healthcare role', {
            userId: event.userId,
            oldRole: event.oldRole
          });
          return;
        }

        // Terminate staff profile
        const terminationReason = `User role changed from ${event.oldRole} to ${event.newRole}: ${event.reason}`;
        staff.terminate(terminationReason, event.changedBy);

        await this.staffRepository.update(staff);

        this.logger.info('Staff profile terminated due to role change', {
          userId: event.userId,
          staffId: staff.id,
          oldRole: event.oldRole,
          newRole: event.newRole
        });

        await this.auditService.logDataModification({
          action: 'TERMINATE_STAFF_FROM_ROLE_CHANGE',
          resourceType: 'ProviderStaff',
          resourceId: staff.id,
          userId: event.changedBy,
          timestamp: new Date(),
          details: {
            eventId: event.eventId,
            eventType: 'UserRoleChanged',
            oldRole: event.oldRole,
            newRole: event.newRole,
            reason: terminationReason,
            source: 'identity-service'
          }
        });

        return;
      }

      // Case 3: Healthcare → Healthcare (Update staff type)
      if (wasHealthcareRole && isHealthcareRole && event.oldRole !== event.newRole) {
        if (!staff) {
          this.logger.warn('No staff profile found for healthcare user', {
            userId: event.userId,
            oldRole: event.oldRole,
            newRole: event.newRole
          });
          return;
        }

        // Update staff type
        const newStaffType = this.mapRoleToStaffType(event.newRole);
        
        // Note: ProviderStaff aggregate doesn't have updateStaffType method
        // This would require adding a new method to the aggregate
        // For now, we just log this event
        this.logger.warn('Staff type change detected but not implemented', {
          userId: event.userId,
          staffId: staff.id,
          oldRole: event.oldRole,
          newRole: event.newRole,
          currentStaffType: staff.staffType,
          newStaffType
        });

        await this.auditService.logSecurityEvent({
          action: 'STAFF_TYPE_CHANGE_REQUIRED',
          resourceType: 'ProviderStaff',
          resourceId: staff.id,
          userId: event.changedBy,
          timestamp: new Date(),
          details: {
            eventId: event.eventId,
            oldRole: event.oldRole,
            newRole: event.newRole,
            currentStaffType: staff.staffType,
            newStaffType,
            reason: event.reason,
            requiresManualUpdate: true
          }
        });

        return;
      }

      // Case 4: Non-healthcare → Non-healthcare (No action needed)
      this.logger.info('Role change does not affect staff profile', {
        userId: event.userId,
        oldRole: event.oldRole,
        newRole: event.newRole
      });

    } catch (error) {
      this.logger.error('Error handling UserRoleChanged event', {
        userId: event.userId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Map Identity Service role to Staff type
   */
  private mapRoleToStaffType(roleType: string): 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'therapist' {
    const roleMap: Record<string, 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'therapist'> = {
      'doctor': 'doctor',
      'nurse': 'nurse',
      'technician': 'technician',
      'pharmacist': 'pharmacist',
      'therapist': 'therapist'
    };

    return roleMap[roleType] || 'technician';
  }
}
