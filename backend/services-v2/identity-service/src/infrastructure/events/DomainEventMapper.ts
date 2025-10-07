/**
 * Domain Event Mapper
 * Converts domain events to RabbitMQ event format
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent as BaseDomainEvent } from '@shared/domain/base/domain-event';
import { DomainEvent as RabbitMQEvent } from './RabbitMQEventPublisher';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '../../domain/events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '../../domain/events/UserRoleChangedEvent';
import { UserLoggedOutEvent } from '../../domain/events/UserLoggedOutEvent';
import { UserActivatedEvent } from '../../domain/events/UserActivatedEvent';
import { StaffInvitationCreatedEvent } from '../../domain/events/StaffInvitationCreatedEvent';

export class DomainEventMapper {
  /**
   * Convert domain event to RabbitMQ event format
   */
  static toRabbitMQEvent(domainEvent: BaseDomainEvent): RabbitMQEvent {
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

    // Default mapping for unknown events
    return {
      ...baseEvent,
      payload: domainEvent
    };
  }

  /**
   * Convert multiple domain events
   */
  static toRabbitMQEvents(domainEvents: BaseDomainEvent[]): RabbitMQEvent[] {
    return domainEvents.map(event => this.toRabbitMQEvent(event));
  }
}

