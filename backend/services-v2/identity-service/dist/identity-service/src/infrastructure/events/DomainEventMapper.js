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
const UserDeletedEvent_1 = require("../../domain/events/UserDeletedEvent");
const UserUpdatedEvent_1 = require("../../domain/events/UserUpdatedEvent");
const UserDeactivatedEvent_1 = require("../../domain/events/UserDeactivatedEvent");
const StaffInvitationCreatedEvent_1 = require("../../domain/events/StaffInvitationCreatedEvent");
const PasswordChangedEvent_1 = require("../../domain/events/PasswordChangedEvent");
const UserAccountLockedEvent_1 = require("../../domain/events/UserAccountLockedEvent");
const UserAccountUnlockedEvent_1 = require("../../domain/events/UserAccountUnlockedEvent");
const MFAEnabledEvent_1 = require("../../domain/events/MFAEnabledEvent");
const MFADisabledEvent_1 = require("../../domain/events/MFADisabledEvent");
const PendingRegistrationCreatedEvent_1 = require("../../domain/events/PendingRegistrationCreatedEvent");
const PasswordResetEvent_1 = require("../../domain/events/PasswordResetEvent");
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
                    role: domainEvent.userRole.type,
                    personalInfo: domainEvent.personalInfo ? {
                        fullName: domainEvent.personalInfo.fullName,
                        phoneNumber: domainEvent.personalInfo.phoneNumber,
                        address: domainEvent.personalInfo.address,
                        dateOfBirth: domainEvent.personalInfo.dateOfBirth,
                        gender: domainEvent.personalInfo.gender,
                        citizenId: domainEvent.personalInfo.citizenId
                    } : undefined
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
        if (domainEvent instanceof UserDeletedEvent_1.UserDeletedEvent) {
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
        if (domainEvent instanceof PasswordChangedEvent_1.PasswordChangedEvent) {
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
        if (domainEvent instanceof UserAccountLockedEvent_1.UserAccountLockedEvent) {
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
        if (domainEvent instanceof UserAccountUnlockedEvent_1.UserAccountUnlockedEvent) {
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
        if (domainEvent instanceof MFAEnabledEvent_1.MFAEnabledEvent) {
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
        if (domainEvent instanceof MFADisabledEvent_1.MFADisabledEvent) {
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
        if (domainEvent instanceof PasswordResetEvent_1.PasswordResetEvent) {
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