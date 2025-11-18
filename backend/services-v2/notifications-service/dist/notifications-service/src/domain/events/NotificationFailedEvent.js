"use strict";
/**
 * Notification Failed Event
 * Emitted when a notification fails to send
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationFailedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class NotificationFailedEvent extends domain_event_1.DomainEvent {
    constructor(eventData, aggregateId) {
        super('notification.failed', aggregateId, 'Notification', eventData);
        this.eventData = eventData;
    }
    getEventData() {
        return this.eventData;
    }
    containsPHI() {
        return false; // Notification metadata doesn't contain PHI
    }
    getPatientId() {
        return null; // Not patient-specific
    }
}
exports.NotificationFailedEvent = NotificationFailedEvent;
//# sourceMappingURL=NotificationFailedEvent.js.map