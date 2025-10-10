"use strict";
/**
 * Domain Event Mapper
 * Converts domain events to RabbitMQ event format
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEventMapper = void 0;
const UserCreatedEvent_1 = require("../../domain/events/UserCreatedEvent");
const UserAuthenticatedEvent_1 = require("../../domain/events/UserAuthenticatedEvent");
const UserRoleChangedEvent_1 = require("../../domain/events/UserRoleChangedEvent");
const UserLoggedOutEvent_1 = require("../../domain/events/UserLoggedOutEvent");
const UserActivatedEvent_1 = require("../../domain/events/UserActivatedEvent");
const StaffInvitationCreatedEvent_1 = require("../../domain/events/StaffInvitationCreatedEvent");
class DomainEventMapper {
    /**
     * Convert domain event to RabbitMQ event format
     */
    static toRabbitMQEvent(domainEvent) {
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
        if (domainEvent instanceof UserCreatedEvent_1.UserCreatedEvent) {
            return {
                ...baseEvent,
                payload: {
                    userId: domainEvent.userIdVO.value,
                    email: domainEvent.userEmail.value,
                    role: domainEvent.userRole.type
                }
            };
        }
        if (domainEvent instanceof UserAuthenticatedEvent_1.UserAuthenticatedEvent) {
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
        if (domainEvent instanceof UserRoleChangedEvent_1.UserRoleChangedEvent) {
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
        if (domainEvent instanceof UserLoggedOutEvent_1.UserLoggedOutEvent) {
            return {
                ...baseEvent,
                payload: {
                    userId: domainEvent.userIdValue,
                    sessionId: domainEvent.sessionId,
                    loggedOutAt: domainEvent.loggedOutAt
                }
            };
        }
        if (domainEvent instanceof UserActivatedEvent_1.UserActivatedEvent) {
            return {
                ...baseEvent,
                payload: {
                    userId: domainEvent.userIdValue,
                    email: domainEvent.emailValue,
                    activatedAt: domainEvent.activatedAt
                }
            };
        }
        if (domainEvent instanceof StaffInvitationCreatedEvent_1.StaffInvitationCreatedEvent) {
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
    static toRabbitMQEvents(domainEvents) {
        return domainEvents.map(event => this.toRabbitMQEvent(event));
    }
}
exports.DomainEventMapper = DomainEventMapper;
//# sourceMappingURL=DomainEventMapper.js.map