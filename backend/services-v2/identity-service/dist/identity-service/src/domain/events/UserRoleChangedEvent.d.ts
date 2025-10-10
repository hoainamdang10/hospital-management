/**
 * UserRoleChangedEvent Domain Event
 * Fired when a user's role is changed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';
import { HealthcareRole } from '../entities/HealthcareRole';
export declare class UserRoleChangedEvent extends DomainEvent {
    readonly userIdVO: UserId;
    readonly oldRole: HealthcareRole;
    readonly newRole: HealthcareRole;
    readonly changedBy: string;
    constructor(userIdVO: UserId, oldRole: HealthcareRole, newRole: HealthcareRole, changedBy: string);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=UserRoleChangedEvent.d.ts.map