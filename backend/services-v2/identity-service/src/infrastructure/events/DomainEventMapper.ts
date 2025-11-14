/**
 * Domain Event Mapper
 * Converts domain events to RabbitMQ event format
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent as BaseDomainEvent } from '@shared/domain/base/domain-event';
import { IntegrationEventPayload } from '../../application/services/IEventPublisher';
import { UserCreatedEvent } from "@shared/domain/events/domain-events";
import { UserRoleChangedEvent } from '../../domain/events/UserRoleChangedEvent';
import { UserActivatedEvent } from '../../domain/events/UserActivatedEvent';
import { UserUpdatedEvent } from '../../domain/events/UserUpdatedEvent';
import { UserDeactivatedEvent } from '../../domain/events/UserDeactivatedEvent';
import { StaffInvitationCreatedEvent } from '../../domain/events/StaffInvitationCreatedEvent';
import { PendingRegistrationCreatedEvent } from '../../domain/events/PendingRegistrationCreatedEvent';

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
          userId: domainEvent.userId,
          email: domainEvent.email,
          fullName: domainEvent.fullName,
          roleType: domainEvent.roleType,
          citizenId: domainEvent.citizenId,
          phoneNumber: domainEvent.phoneNumber
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

