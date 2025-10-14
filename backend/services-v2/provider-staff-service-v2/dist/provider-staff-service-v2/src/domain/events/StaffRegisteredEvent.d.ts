/**
 * StaffRegisteredEvent
 * Domain event fired when a new staff member is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
export declare class StaffRegisteredEvent extends DomainEvent {
    readonly staffIdVO: StaffId;
    readonly staffType: string;
    readonly fullName: string;
    constructor(staffIdVO: StaffId, staffType: string, fullName: string);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=StaffRegisteredEvent.d.ts.map