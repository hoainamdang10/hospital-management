/**
 * UserAuthenticatedEvent Domain Event
 * Fired when a user successfully authenticates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';
export declare class UserAuthenticatedEvent extends DomainEvent {
    readonly userIdVO: UserId;
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly timestamp: Date;
    constructor(userIdVO: UserId, ipAddress: string, userAgent: string, timestamp: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=UserAuthenticatedEvent.d.ts.map