"use strict";
/**
 * NotificationSentEvent - Domain Event
 * Fired when a notification is successfully sent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSentEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class NotificationSentEvent extends domain_event_1.DomainEvent {
    constructor(notificationId, recipientId, channels, patientId, correlationId, userId) {
        const eventData = {
            notificationId,
            recipientId,
            channels,
            sentAt: new Date(),
            patientId
        };
        super('NotificationSent', notificationId, 'Notification', eventData, 1, correlationId, undefined, userId, {
            source: 'domain',
            priority: 'normal',
            retryable: false
        });
        this.notificationId = notificationId;
        this.recipientId = recipientId;
        this.channels = channels;
        this.patientId = patientId;
    }
    getEventData() {
        return {
            notificationId: this.notificationId,
            recipientId: this.recipientId,
            channels: this.channels,
            sentAt: this.occurredAt,
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
exports.NotificationSentEvent = NotificationSentEvent;
//# sourceMappingURL=NotificationSentEvent.js.map