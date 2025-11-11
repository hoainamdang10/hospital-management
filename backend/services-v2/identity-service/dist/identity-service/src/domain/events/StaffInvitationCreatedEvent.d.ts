/**
 * Staff Invitation Created Event
 * Triggered when admin creates a staff invitation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export declare class StaffInvitationCreatedEvent extends DomainEvent {
    readonly email: string;
    readonly role: string;
    readonly invitedBy: string;
    readonly invitationToken: string;
    readonly expiresAt: Date;
    constructor(email: string, role: string, invitedBy: string, invitationToken: string, expiresAt: Date);
    getEventData(): {
        email: string;
        role: string;
        invitedBy: string;
        invitationToken: string;
        expiresAt: Date;
    };
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=StaffInvitationCreatedEvent.d.ts.map