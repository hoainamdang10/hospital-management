/**
 * User Logged Out Event
 * Triggered when a user logs out
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export declare class UserLoggedOutEvent extends DomainEvent {
    readonly userIdValue: string;
    readonly sessionId: string;
    readonly loggedOutAt: Date;
    constructor(userIdValue: string, // Changed from UserId to string
    sessionId: string, loggedOutAt: Date);
    getEventData(): {
        userId: string;
        sessionId: string;
        loggedOutAt: Date;
    };
    containsPHI(): boolean;
    getPatientId(): string | undefined;
}
//# sourceMappingURL=UserLoggedOutEvent.d.ts.map