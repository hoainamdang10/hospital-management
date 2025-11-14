/**
 * User Activated Event
 * Triggered when a user's email is verified and account is activated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export declare class UserActivatedEvent extends DomainEvent {
    readonly userIdValue: string;
    readonly emailValue: string;
    readonly fullNameValue: string;
    readonly activatedAt: Date;
    constructor(userIdValue: string, // Changed from UserId to string
    emailValue: string, // Changed from Email to string
    fullNameValue: string, // Full name from user registration
    activatedAt: Date);
    getEventData(): {
        userId: string;
        email: string;
        fullName: string;
        activatedAt: Date;
    };
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=UserActivatedEvent.d.ts.map