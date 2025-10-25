/**
 * StaffCredentialEventHandler - Handle events from Provider Staff Service
 * 
 * Handles:
 * - staff.credential_verified → Activate staff user account
 * - staff.status_changed → Lock/Unlock account when suspended/terminated
 * - staff.credential_expired → Lock account when credential expires (PHASE 2)
 * - staff.license_revoked → Lock account + terminate sessions when license revoked (PHASE 2)
 * - staff.performance_flagged → Lock account if severity is CRITICAL (PHASE 3)
 * - staff.department_changed → Update user metadata with new department (PHASE 4)
 * - staff.schedule_updated → Update user metadata with availability info (PHASE 4)
 * 
 * @author Hospital Management Team
 * @version 2.0.0 (PHASE 4 - FINAL)
 * @compliance Event-Driven Architecture, HIPAA
 */

import { ILogger } from '../services/ILogger';
import { LockAccountUseCase } from '../use-cases/LockAccountUseCase';
import { UnlockAccountUseCase } from '../use-cases/UnlockAccountUseCase';
import { TerminateAllSessionsUseCase } from '../use-cases/TerminateAllSessionsUseCase';
import { InboxService } from '../../infrastructure/inbox/InboxService';
import { SupabaseClient } from '@supabase/supabase-js';

export interface StaffCredentialVerifiedEvent {
  eventId: string;
  staffId: string;
  credentialNumber: string;
  credentialType: string;
  issuingAuthority: string;
  verifiedAt: Date;
}

export interface StaffStatusChangedEvent {
  eventId: string;
  staffId: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  changedBy: string;
}

export interface StaffCredentialExpiredEvent {
  eventId: string;
  staffId: string;
  credentialNumber: string;
  credentialType: string;
  expirationDate: Date;
  occurredAt: Date;
}

export interface StaffLicenseRevokedEvent {
  eventId: string;
  staffId: string;
  licenseNumber: string;
  revocationReason: string;
  revokedBy: string;
  revocationDate: Date;
  occurredAt: Date;
}

export interface StaffPerformanceFlaggedEvent {
  eventId: string;
  staffId: string;
  flagReason: string;
  severity: string; // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  performanceMetrics?: any;
  flaggedBy: string;
  occurredAt: Date;
}

export interface StaffDepartmentChangedEvent {
  eventId: string;
  staffId: string;
  userId: string;
  oldDepartmentId: string;
  newDepartmentId: string;
  oldDepartmentName: string;
  newDepartmentName: string;
  effectiveDate: Date;
  changedBy: string;
  occurredAt: Date;
}

export interface StaffScheduleUpdatedEvent {
  eventId: string;
  staffId: string;
  userId: string;
  scheduleType: string; // 'WEEKLY' | 'MONTHLY' | 'ON_CALL'
  workingDays: string[]; // ['MONDAY', 'TUESDAY', ...]
  workingHours: {
    start: string; // '08:00'
    end: string; // '17:00'
  };
  isAvailable: boolean;
  updatedBy: string;
  occurredAt: Date;
}

export class StaffCredentialEventHandler {
  constructor(
    private lockAccountUseCase: LockAccountUseCase,
    private unlockAccountUseCase: UnlockAccountUseCase,
    private terminateAllSessionsUseCase: TerminateAllSessionsUseCase,
    private inboxService: InboxService,
    private supabaseClient: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Handle staff.credential_verified event
   */
  async handleStaffCredentialVerified(event: StaffCredentialVerifiedEvent): Promise<void> {
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
        eventType: 'StaffCredentialVerifiedEvent',
        aggregateId: event.staffId,
        aggregateType: 'Staff',
        payloadJson: event,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.credential_verified',
        occurredAt: event.verifiedAt
      });

      this.logger.info('Processing staff credential verified event', {
        eventId: event.eventId,
        staffId: event.staffId
      });

      // Find user by staff ID (assuming staff ID is stored in user metadata or citizen_id)
      // For now, we'll skip activation logic as it requires staff-user mapping
      // This would be implemented when staff provisioning is complete

      this.logger.info('Staff credential verified - user activation skipped (requires staff-user mapping)', {
        staffId: event.staffId,
        credentialType: event.credentialType
      });

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling staff credential verified event', {
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

  /**
   * Handle staff.status_changed event
   */
  async handleStaffStatusChanged(event: StaffStatusChangedEvent): Promise<void> {
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
        eventType: 'StaffStatusChangedEvent',
        aggregateId: event.staffId,
        aggregateType: 'Staff',
        payloadJson: event,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.status_changed',
        occurredAt: new Date()
      });

      this.logger.info('Processing staff status changed event', {
        eventId: event.eventId,
        staffId: event.staffId,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus
      });

      // Find user by staff ID
      // For now, we'll use staffId as userId (this needs proper mapping)
      const userId = event.staffId;

      // Lock account if suspended/terminated
      if (event.newStatus === 'suspended' || event.newStatus === 'terminated') {
        await this.lockAccountUseCase.execute({
          userId,
          lockedBy: event.changedBy,
          reason: event.reason || `Staff status changed to ${event.newStatus}`,
          terminateSessions: true
        });

        this.logger.info('User account locked due to staff status change', {
          userId,
          newStatus: event.newStatus
        });
      }

      // Unlock account if reactivated
      if (event.oldStatus === 'suspended' && event.newStatus === 'active') {
        await this.unlockAccountUseCase.execute({
          userId,
          unlockedBy: event.changedBy,
          reason: event.reason || 'Staff reactivated'
        });

        this.logger.info('User account unlocked due to staff reactivation', {
          userId
        });
      }

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling staff status changed event', {
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

  /**
   * Handle staff.credential_expired event (PHASE 2)
   * Lock account immediately when credential expires
   */
  async handleStaffCredentialExpired(event: StaffCredentialExpiredEvent): Promise<void> {
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
        eventType: 'StaffCredentialExpiredEvent',
        aggregateId: event.staffId,
        aggregateType: 'Staff',
        payloadJson: event,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.credential_expired',
        occurredAt: event.occurredAt
      });

      this.logger.warn('Processing staff credential expired event', {
        eventId: event.eventId,
        staffId: event.staffId,
        credentialType: event.credentialType,
        expirationDate: event.expirationDate
      });

      // Lock account immediately
      const userId = event.staffId;
      await this.lockAccountUseCase.execute({
        userId,
        lockedBy: 'SYSTEM_AUTO',
        reason: `Credential expired: ${event.credentialType} (${event.credentialNumber})`,
        terminateSessions: true
      });

      // Flag account
      await this.flagUserAccount(
        userId,
        'CREDENTIAL_EXPIRED',
        'CRITICAL',
        {
          credentialNumber: event.credentialNumber,
          credentialType: event.credentialType,
          expirationDate: event.expirationDate.toISOString()
        },
        event.eventId
      );

      // Audit log
      await this.auditLog({
        action: 'USER_ACCOUNT_LOCKED',
        userId,
        severity: 'CRITICAL',
        details: {
          reason: 'CREDENTIAL_EXPIRED',
          credentialType: event.credentialType,
          credentialNumber: event.credentialNumber,
          expirationDate: event.expirationDate.toISOString(),
          eventId: event.eventId
        }
      });

      this.logger.error('User account locked due to credential expiration', {
        userId,
        credentialType: event.credentialType,
        expirationDate: event.expirationDate
      });

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling staff credential expired event', {
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

  /**
   * Handle staff.license_revoked event (PHASE 2)
   * Lock account + terminate all sessions when license is revoked
   */
  async handleStaffLicenseRevoked(event: StaffLicenseRevokedEvent): Promise<void> {
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
        eventType: 'StaffLicenseRevokedEvent',
        aggregateId: event.staffId,
        aggregateType: 'Staff',
        payloadJson: event,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.license_revoked',
        occurredAt: event.occurredAt
      });

      this.logger.error('Processing staff license revoked event', {
        eventId: event.eventId,
        staffId: event.staffId,
        licenseNumber: event.licenseNumber,
        revocationReason: event.revocationReason
      });

      // Lock account immediately
      const userId = event.staffId;
      await this.lockAccountUseCase.execute({
        userId,
        lockedBy: 'SYSTEM_AUTO',
        reason: `License revoked: ${event.revocationReason}`,
        terminateSessions: true
      });

      // Terminate all sessions
      await this.terminateAllSessionsUseCase.execute({
        userId
      });

      // Flag account with CRITICAL severity
      await this.flagUserAccount(
        userId,
        'LICENSE_REVOKED',
        'CRITICAL',
        {
          licenseNumber: event.licenseNumber,
          revocationReason: event.revocationReason,
          revokedBy: event.revokedBy,
          revocationDate: event.revocationDate.toISOString()
        },
        event.eventId
      );

      // Audit log for legal compliance
      await this.auditLog({
        action: 'LICENSE_REVOKED',
        userId,
        severity: 'CRITICAL',
        details: {
          licenseNumber: event.licenseNumber,
          revocationReason: event.revocationReason,
          revokedBy: event.revokedBy,
          revocationDate: event.revocationDate.toISOString(),
          eventId: event.eventId,
          legalCompliance: 'LICENSE_REVOCATION_RECORDED'
        }
      });

      this.logger.error('User account locked and sessions terminated due to license revocation', {
        userId,
        licenseNumber: event.licenseNumber,
        revocationReason: event.revocationReason
      });

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling staff license revoked event', {
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

  /**
   * Flag user account
   */
  private async flagUserAccount(
    userId: string,
    flagType: string,
    severity: string,
    metadata: any,
    sourceEventId: string
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('user_flags')
      .insert({
        user_id: userId,
        flag_type: flagType,
        severity,
        is_active: true,
        flagged_by: 'SYSTEM_AUTO',
        metadata,
        source_event_id: sourceEventId,
        source_service: 'provider-staff-service'
      });

    if (error) {
      throw new Error(`Failed to flag user account: ${error.message}`);
    }
  }

  /**
   * Audit log
   */
  private async auditLog(log: {
    action: string;
    userId: string;
    severity: string;
    details: any;
  }): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('audit_logs')
      .insert({
        actor_id: log.userId,
        action: log.action,
        resource_type: 'USER_ACCOUNT',
        resource_id: log.userId,
        details: log.details,
        severity: log.severity.toLowerCase(),
        success: true
      });

    if (error) {
      this.logger.error('Error writing audit log', { error: error.message });
    }
  }

  /**
   * Handle staff.performance_flagged event (PHASE 3)
   * Lock account if severity is CRITICAL
   */
  async handleStaffPerformanceFlagged(event: StaffPerformanceFlaggedEvent): Promise<void> {
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
        eventType: 'StaffPerformanceFlaggedEvent',
        aggregateId: event.staffId,
        aggregateType: 'StaffPerformance',
        payloadJson: event,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.performance_flagged',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing staff.performance_flagged event', {
        eventId: event.eventId,
        staffId: event.staffId,
        severity: event.severity
      });

      // Lock account only if severity is CRITICAL
      if (event.severity === 'CRITICAL') {
        this.logger.warn('Locking account due to CRITICAL performance issue', {
          staffId: event.staffId,
          flagReason: event.flagReason
        });

        await this.lockAccountUseCase.execute({
          userId: event.staffId,
          lockedBy: 'SYSTEM_AUTO',
          reason: `Account locked due to CRITICAL performance issue: ${event.flagReason}`
        });

        // Flag user account
        await this.flagUserAccount(
          event.staffId,
          'PERFORMANCE_CRITICAL',
          'CRITICAL',
          {
            flagReason: event.flagReason,
            performanceMetrics: event.performanceMetrics,
            flaggedBy: event.flaggedBy
          },
          event.eventId
        );

        // Audit log (CRITICAL severity)
        await this.auditLog({
          action: 'ACCOUNT_LOCKED_PERFORMANCE',
          userId: event.staffId,
          severity: 'CRITICAL',
          details: {
            flagReason: event.flagReason,
            performanceMetrics: event.performanceMetrics,
            eventId: event.eventId
          }
        });
      } else {
        // For non-CRITICAL severity, just flag the account
        this.logger.info('Flagging account for performance issue', {
          staffId: event.staffId,
          severity: event.severity
        });

        await this.flagUserAccount(
          event.staffId,
          `PERFORMANCE_${event.severity}`,
          event.severity,
          {
            flagReason: event.flagReason,
            performanceMetrics: event.performanceMetrics,
            flaggedBy: event.flaggedBy
          },
          event.eventId
        );
      }

      this.logger.info('Successfully processed staff.performance_flagged event', {
        eventId: event.eventId,
        staffId: event.staffId,
        actionTaken: event.severity === 'CRITICAL' ? 'ACCOUNT_LOCKED' : 'FLAGGED'
      });

    } catch (error) {
      this.logger.error('Failed to process staff.performance_flagged event', {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Handle staff.department_changed event (PHASE 4)
   * Update user metadata with new department information
   */
  async handleStaffDepartmentChanged(event: StaffDepartmentChangedEvent): Promise<void> {
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
        eventType: 'StaffDepartmentChangedEvent',
        aggregateId: event.staffId,
        aggregateType: 'StaffDepartment',
        payloadJson: event,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.department_changed',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing staff.department_changed event', {
        eventId: event.eventId,
        staffId: event.staffId,
        userId: event.userId,
        oldDepartment: event.oldDepartmentName,
        newDepartment: event.newDepartmentName
      });

      // Update user metadata with new department info
      await this.updateUserMetadata(
        event.userId,
        {
          department_id: event.newDepartmentId,
          department_name: event.newDepartmentName,
          department_changed_at: event.effectiveDate.toISOString(),
          previous_department: event.oldDepartmentName
        },
        event.eventId
      );

      this.logger.info('Successfully processed staff.department_changed event', {
        eventId: event.eventId,
        userId: event.userId,
        newDepartment: event.newDepartmentName
      });

    } catch (error) {
      this.logger.error('Failed to process staff.department_changed event', {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Handle staff.schedule_updated event (PHASE 4)
   * Update user metadata with availability information
   */
  async handleStaffScheduleUpdated(event: StaffScheduleUpdatedEvent): Promise<void> {
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
        eventType: 'StaffScheduleUpdatedEvent',
        aggregateId: event.staffId,
        aggregateType: 'StaffSchedule',
        payloadJson: event,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.schedule_updated',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing staff.schedule_updated event', {
        eventId: event.eventId,
        staffId: event.staffId,
        userId: event.userId,
        scheduleType: event.scheduleType,
        isAvailable: event.isAvailable
      });

      // Update user metadata with schedule info
      await this.updateUserMetadata(
        event.userId,
        {
          schedule_type: event.scheduleType,
          working_days: event.workingDays,
          working_hours: event.workingHours,
          is_available: event.isAvailable,
          schedule_updated_at: event.occurredAt.toISOString()
        },
        event.eventId
      );

      this.logger.info('Successfully processed staff.schedule_updated event', {
        eventId: event.eventId,
        userId: event.userId,
        scheduleType: event.scheduleType,
        isAvailable: event.isAvailable
      });

    } catch (error) {
      this.logger.error('Failed to process staff.schedule_updated event', {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update user metadata in auth.users table
   */
  private async updateUserMetadata(
    userId: string,
    metadata: Record<string, any>,
    sourceEventId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabaseClient.auth.admin.updateUserById(
        userId,
        {
          user_metadata: metadata
        }
      );

      if (error) {
        throw new Error(`Failed to update user metadata: ${error.message}`);
      }

      this.logger.debug('User metadata updated', {
        userId,
        metadata,
        sourceEventId
      });
    } catch (error) {
      this.logger.error('Error updating user metadata', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
