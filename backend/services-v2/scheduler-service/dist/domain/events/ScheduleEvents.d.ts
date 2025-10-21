import { BaseDomainEvent } from './DomainEvent';
export declare class ScheduleCreatedEvent extends BaseDomainEvent {
    constructor(scheduleId: string, tenantId: string, ownerService: string, topicOrCommand: string);
}
export declare class ScheduleUpdatedEvent extends BaseDomainEvent {
    constructor(scheduleId: string, tenantId: string, changes: Record<string, any>);
}
export declare class ScheduleCancelledEvent extends BaseDomainEvent {
    constructor(scheduleId: string, tenantId: string, reason?: string);
}
export declare class SchedulePausedEvent extends BaseDomainEvent {
    constructor(scheduleId: string, tenantId: string);
}
export declare class ScheduleResumedEvent extends BaseDomainEvent {
    constructor(scheduleId: string, tenantId: string);
}
//# sourceMappingURL=ScheduleEvents.d.ts.map