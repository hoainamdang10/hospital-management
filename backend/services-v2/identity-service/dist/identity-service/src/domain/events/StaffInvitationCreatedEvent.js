"use strict";
/**
 * Staff Invitation Created Event
 * Triggered when admin creates a staff invitation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffInvitationCreatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class StaffInvitationCreatedEvent extends domain_event_1.DomainEvent {
    constructor(email, role, invitedBy, invitationToken, expiresAt) {
        super('StaffInvitationCreated', email, // Use email as aggregate ID
        'StaffInvitation', { email, role, invitedBy, invitationToken, expiresAt });
        this.email = email;
        this.role = role;
        this.invitedBy = invitedBy;
        this.invitationToken = invitationToken;
        this.expiresAt = expiresAt;
    }
    getEventData() {
        return {
            email: this.email,
            role: this.role,
            invitedBy: this.invitedBy,
            invitationToken: this.invitationToken,
            expiresAt: this.expiresAt
        };
    }
    containsPHI() {
        return true; // Email is PII
    }
    getPatientId() {
        return null; // Not a patient event
    }
}
exports.StaffInvitationCreatedEvent = StaffInvitationCreatedEvent;
//# sourceMappingURL=StaffInvitationCreatedEvent.js.map