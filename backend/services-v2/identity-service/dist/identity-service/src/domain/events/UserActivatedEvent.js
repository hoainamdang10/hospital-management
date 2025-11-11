"use strict";
/**
 * User Activated Event
 * Triggered when a user's email is verified and account is activated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActivatedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class UserActivatedEvent extends domain_event_1.DomainEvent {
    constructor(userIdValue, // Changed from UserId to string
    emailValue, // Changed from Email to string
    activatedAt) {
        super('UserActivated', userIdValue, 'User', { userIdValue, emailValue, activatedAt });
        this.userIdValue = userIdValue;
        this.emailValue = emailValue;
        this.activatedAt = activatedAt;
    }
    getEventData() {
        return {
            userId: this.userIdValue,
            email: this.emailValue,
            activatedAt: this.activatedAt
        };
    }
    containsPHI() {
        return true; // Email is considered PII
    }
    getPatientId() {
        return null; // Not necessarily a patient
    }
}
exports.UserActivatedEvent = UserActivatedEvent;
//# sourceMappingURL=UserActivatedEvent.js.map