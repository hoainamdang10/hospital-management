/**
 * UserCreatedEvent Domain Event
 * Fired when a new user is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { HealthcareRole } from '../entities/HealthcareRole';
export declare class UserCreatedEvent extends DomainEvent {
    readonly userIdVO: UserId;
    readonly userEmail: Email;
    readonly userRole: HealthcareRole;
    constructor(userIdVO: UserId, userEmail: Email, userRole: HealthcareRole);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=UserCreatedEvent.d.ts.map