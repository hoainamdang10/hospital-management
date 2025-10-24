"use strict";
/**
 * NotificationFailedEvent - Domain Event
 * Fired when a notification fails to send
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationFailedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class NotificationFailedEvent extends domain_event_1.DomainEvent {
    constructor(notificationId, recipientId, failureReason, patientId, correlationId, userId) {
        const eventData = {
            notificationId,
            recipientId,
            failureReason,
            failedAt: new Date(),
            patientId
        };
        super('NotificationFailed', notificationId, 'Notification', eventData, 1, correlationId, undefined, userId, {
            source: 'domain',
            priority: 'high',
            retryable: true
        });
        this.notificationId = notificationId;
        this.recipientId = recipientId;
        this.failureReason = failureReason;
        this.patientId = patientId;
    }
    getEventData() {
        return {
            notificationId: this.notificationId,
            recipientId: this.recipientId,
            failureReason: this.failureReason,
            failedAt: this.occurredAt,
            patientId: this.patientId
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId || null;
    }
}
exports.NotificationFailedEvent = NotificationFailedEvent;
//# sourceMappingURL=NotificationFailedEvent.js.map