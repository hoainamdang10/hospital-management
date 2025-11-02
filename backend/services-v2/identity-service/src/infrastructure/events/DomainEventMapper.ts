/**
 * Domain Event Mapper
 * Converts domain events to RabbitMQ event format
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent as BaseDomainEvent } from '@shared/domain/base/domain-event';
import { IntegrationEventPayload } from '../../application/services/IEventPublisher';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '../../domain/events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '../../domain/events/UserRoleChangedEvent';
import { UserLoggedOutEvent } from '../../domain/events/UserLoggedOutEvent';
import { UserActivatedEvent } from '../../domain/events/UserActivatedEvent';
import { UserDeletedEvent } from '../../domain/events/UserDeletedEvent';
import { UserUpdatedEvent } from '../../domain/events/UserUpdatedEvent';
import { UserDeactivatedEvent } from '../../domain/events/UserDeactivatedEvent';
import { StaffInvitationCreatedEvent } from '../../domain/events/StaffInvitationCreatedEvent';
import { PasswordChangedEvent } from '../../domain/events/PasswordChangedEvent';
import { UserAccountLockedEvent } from '../../domain/events/UserAccountLockedEvent';
import { UserAccountUnlockedEvent } from '../../domain/events/UserAccountUnlockedEvent';
import { MFAEnabledEvent } from '../../domain/events/MFAEnabledEvent';
import { MFADisabledEvent } from '../../domain/events/MFADisabledEvent';
import { PendingRegistrationCreatedEvent } from '../../domain/events/PendingRegistrationCreatedEvent';
import { PasswordResetEvent } from '../../domain/events/PasswordResetEvent';

export class DomainEventMapper {
  /**
   * Convert domain event to RabbitMQ event format
   */
  static toRabbitMQEvent(domainEvent: BaseDomainEvent): IntegrationEventPayload {
    const baseEvent = {
      eventType: domainEvent.constructor.name,
      aggregateId: domainEvent.aggregateId,
      aggregateType: 'User',
      occurredAt: domainEvent.occurredAt,
      metadata: {
        correlationId: domainEvent.eventId
      }
    };

    // Map specific event types
    if (domainEvent instanceof UserCreatedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          email: domainEvent.userEmail.value,
          role: domainEvent.userRole.type
        }
      };
    }

    if (domainEvent instanceof UserAuthenticatedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          ipAddress: domainEvent.ipAddress,
          userAgent: domainEvent.userAgent,
          timestamp: domainEvent.timestamp
        }
      };
    }

    if (domainEvent instanceof UserRoleChangedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          oldRole: domainEvent.oldRole.type,
          newRole: domainEvent.newRole.type,
          changedBy: domainEvent.changedBy
        }
      };
    }

    if (domainEvent instanceof UserLoggedOutEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdValue,
          sessionId: domainEvent.sessionId,
          loggedOutAt: domainEvent.loggedOutAt
        }
      };
    }

    if (domainEvent instanceof UserActivatedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdValue,
          email: domainEvent.emailValue,
          activatedAt: domainEvent.activatedAt
        }
      };
    }

    if (domainEvent instanceof UserDeletedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          deletedBy: domainEvent.deletedBy,
          deletionType: domainEvent.deletionType,
          reason: domainEvent.reason,
          email: domainEvent.userEmail,
          role: domainEvent.userRole,
          deletedAt: domainEvent.occurredAt
        }
      };
    }

    if (domainEvent instanceof UserUpdatedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          updatedBy: domainEvent.updatedBy,
          updatedFields: domainEvent.updatedFields,
          changes: domainEvent.changes,
          updatedAt: domainEvent.occurredAt
        }
      };
    }

    if (domainEvent instanceof UserDeactivatedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          deactivatedBy: domainEvent.deactivatedBy,
          reason: domainEvent.reason,
          email: domainEvent.userEmail,
          role: domainEvent.userRole,
          deactivatedAt: domainEvent.occurredAt
        }
      };
    }

    if (domainEvent instanceof StaffInvitationCreatedEvent) {
      return {
        ...baseEvent,
        aggregateType: 'StaffInvitation',
        payload: {
          email: domainEvent.email,
          role: domainEvent.role,
          invitedBy: domainEvent.invitedBy,
          invitationToken: domainEvent.invitationToken,
          expiresAt: domainEvent.expiresAt
        }
      };
    }

    if (domainEvent instanceof PasswordChangedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          changedBy: domainEvent.changedBy,
          invalidatedSessions: domainEvent.invalidatedSessions,
          email: domainEvent.userEmail,
          role: domainEvent.userRole,
          changedAt: domainEvent.occurredAt
        }
      };
    }

    if (domainEvent instanceof UserAccountLockedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          lockedBy: domainEvent.lockedBy,
          reason: domainEvent.reason,
          terminatedSessions: domainEvent.terminatedSessions,
          email: domainEvent.userEmail,
          role: domainEvent.userRole,
          lockedAt: domainEvent.occurredAt
        }
      };
    }

    if (domainEvent instanceof UserAccountUnlockedEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          unlockedBy: domainEvent.unlockedBy,
          reason: domainEvent.reason,
          email: domainEvent.userEmail,
          role: domainEvent.userRole,
          unlockedAt: domainEvent.occurredAt
        }
      };
    }

    if (domainEvent instanceof MFAEnabledEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          method: domainEvent.method,
          enabledBy: domainEvent.enabledBy,
          email: domainEvent.userEmail,
          role: domainEvent.userRole,
          enabledAt: domainEvent.occurredAt
        }
      };
    }

    if (domainEvent instanceof MFADisabledEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          disabledBy: domainEvent.disabledBy,
          email: domainEvent.userEmail,
          role: domainEvent.userRole,
          disabledAt: domainEvent.occurredAt
        }
      };
    }

    if (domainEvent instanceof PendingRegistrationCreatedEvent) {
      return {
        ...baseEvent,
        aggregateType: 'PendingRegistration',
        payload: {
          pendingRegistrationId: domainEvent.data.pendingRegistrationId,
          email: domainEvent.data.email,
          fullName: domainEvent.data.fullName,
          roleType: domainEvent.data.roleType,
          expiresAt: domainEvent.data.expiresAt
        }
      };
    }

    if (domainEvent instanceof PasswordResetEvent) {
      return {
        ...baseEvent,
        payload: {
          userId: domainEvent.userIdVO.value,
          email: domainEvent.userEmail,
          role: domainEvent.userRole,
          resetMethod: domainEvent.resetMethod,
          invalidatedSessions: domainEvent.invalidatedSessions,
          resetAt: domainEvent.occurredAt
        }
      };
    }

    // Default mapping for unknown events
    return {
      ...baseEvent,
      payload: domainEvent as unknown as Record<string, unknown>
    };
  }

  /**
   * Convert multiple domain events
   */
  static toRabbitMQEvents(domainEvents: BaseDomainEvent[]): IntegrationEventPayload[] {
    return domainEvents.map(event => this.toRabbitMQEvent(event));
  }
}

