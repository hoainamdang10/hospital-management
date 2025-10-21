import { TenantId } from '../value-objects/TenantId';
import { DomainEvent } from '../events/DomainEvent';
export declare enum ScheduleRunStatus {
    DUE = "DUE",
    RUNNING = "RUNNING",
    EMITTING = "EMITTING",
    EMITTED = "EMITTED",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED"
}
export interface ScheduleRunProps {
    runId: string;
    scheduleId: string;
    tenantId: TenantId;
    dueAtUtc: Date;
    status: ScheduleRunStatus;
    attempt: number;
    lockedBy?: string;
    lockedAtUtc?: Date;
    startedAtUtc?: Date;
    finishedAtUtc?: Date;
    lastError?: string;
    segment?: number;
    createdAt: Date;
}
export declare class ScheduleRun {
    private props;
    private domainEvents;
    private constructor();
    static create(scheduleId: string, tenantId: TenantId, dueAtUtc: Date, segment?: number): ScheduleRun;
    static reconstitute(props: ScheduleRunProps): ScheduleRun;
    acquireLock(workerId: string): boolean;
    start(workerId: string): void;
    markAsEmitting(): void;
    markAsEmitted(topicOrCommand: string): void;
    markAsSucceeded(): void;
    markAsFailed(error: string): void;
    retry(): void;
    isDue(now?: Date): boolean;
    isOverdue(now?: Date, graceWindowMs?: number): boolean;
    getQueueLag(now?: Date): number;
    private addDomainEvent;
    getDomainEvents(): DomainEvent[];
    clearDomainEvents(): void;
    getRunId(): string;
    getScheduleId(): string;
    getTenantId(): TenantId;
    getStatus(): ScheduleRunStatus;
    getAttempt(): number;
    getProps(): Readonly<ScheduleRunProps>;
}
//# sourceMappingURL=ScheduleRun.entity.d.ts.map