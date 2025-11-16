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
const domain_events_1 = require("../../../../shared/domain/events/domain-events");
const UserRoleChangedEvent_1 = require("../../domain/events/UserRoleChangedEvent");
const UserActivatedEvent_1 = require("../../domain/events/UserActivatedEvent");
const UserUpdatedEvent_1 = require("../../domain/events/UserUpdatedEvent");
const UserDeactivatedEvent_1 = require("../../domain/events/UserDeactivatedEvent");
const StaffInvitationCreatedEvent_1 = require("../../domain/events/StaffInvitationCreatedEvent");
const PendingRegistrationCreatedEvent_1 = require("../../domain/events/PendingRegistrationCreatedEvent");
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
        if (domainEvent instanceof domain_events_1.UserCreatedEvent) {
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
        if (domainEvent instanceof UserUpdatedEvent_1.UserUpdatedEvent) {
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
        if (domainEvent instanceof UserDeactivatedEvent_1.UserDeactivatedEvent) {
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
        if (domainEvent instanceof PendingRegistrationCreatedEvent_1.PendingRegistrationCreatedEvent) {
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