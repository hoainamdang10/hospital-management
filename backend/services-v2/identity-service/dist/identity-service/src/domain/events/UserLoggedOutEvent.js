"use strict";
/**
 * User Logged Out Event
 * Triggered when a user logs out
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLoggedOutEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class UserLoggedOutEvent extends domain_event_1.DomainEvent {
    constructor(userIdValue, // Changed from UserId to string
    sessionId, loggedOutAt) {
        super('UserLoggedOut', userIdValue, 'User', { userIdValue, sessionId, loggedOutAt });
        this.userIdValue = userIdValue;
        this.sessionId = sessionId;
        this.loggedOutAt = loggedOutAt;
    }
    getEventData() {
        return {
            userId: this.userIdValue,
            sessionId: this.sessionId,
            loggedOutAt: this.loggedOutAt
        };
    }
    containsPHI() {
        return false; // No PHI in logout event
    }
    getPatientId() {
        return null; // Not a patient-specific event
    }
}
exports.UserLoggedOutEvent = UserLoggedOutEvent;
//# sourceMappingURL=UserLoggedOutEvent.js.map