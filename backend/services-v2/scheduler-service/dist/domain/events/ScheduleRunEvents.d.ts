import { BaseDomainEvent } from './DomainEvent';
export declare class ScheduleRunCreatedEvent extends BaseDomainEvent {
    constructor(runId: string, scheduleId: string, tenantId: string, dueAtUtc: Date);
}
export declare class ScheduleRunStartedEvent extends BaseDomainEvent {
    constructor(runId: string, scheduleId: string, tenantId: string, workerId: string);
}
export declare class ScheduleRunCompletedEvent extends BaseDomainEvent {
    constructor(runId: string, scheduleId: string, tenantId: string, success: boolean, error?: string);
}
export declare class ScheduleRunFailedEvent extends BaseDomainEvent {
    constructor(runId: string, scheduleId: string, tenantId: string, error: string, attempt: number);
}
export declare class ScheduleRunEmittedEvent extends BaseDomainEvent {
    constructor(runId: string, scheduleId: string, tenantId: string, topicOrCommand: string);
}
//# sourceMappingURL=ScheduleRunEvents.d.ts.map