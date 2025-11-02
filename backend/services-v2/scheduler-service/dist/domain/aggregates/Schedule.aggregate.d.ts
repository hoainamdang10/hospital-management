import { ScheduleTypeVO } from '../value-objects/ScheduleType';
import { CronExpression } from '../value-objects/CronExpression';
import { RRuleExpression } from '../value-objects/RRuleExpression';
import { Timezone } from '../value-objects/Timezone';
import { TenantId } from '../value-objects/TenantId';
import { DedupKey } from '../value-objects/DedupKey';
import { RetryPolicy } from '../value-objects/RetryPolicy';
import { DomainEvent } from '../events/DomainEvent';
export declare enum ScheduleStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    CANCELLED = "CANCELLED"
}
export interface ScheduleProps {
    scheduleId: string;
    tenantId: TenantId;
    ownerService: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
    policyTag?: string;
    scheduleType: ScheduleTypeVO;
    timezone: Timezone;
    startAtUtc?: Date;
    endAtUtc?: Date;
    cronExpr?: CronExpression;
    rrule?: RRuleExpression;
    topicOrCommand: string;
    payloadJson: any;
    maxRuns?: number;
    jitterMs: number;
    retryPolicy: RetryPolicy;
    dedupKey: DedupKey;
    status: ScheduleStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}
export declare class Schedule {
    private props;
    private domainEvents;
    private constructor();
    static create(props: Omit<ScheduleProps, 'scheduleId' | 'createdAt' | 'updatedAt' | 'status'>): Schedule;
    static reconstitute(props: ScheduleProps): Schedule;
    private validate;
    getNextOccurrence(from?: Date): Date | null;
    getOccurrencesBetween(startDate: Date, endDate: Date): Date[];
    pause(): void;
    resume(): void;
    cancel(reason?: string): void;
    update(updates: Partial<Pick<ScheduleProps, 'payloadJson' | 'endAtUtc' | 'maxRuns'>>): void;
    private addDomainEvent;
    getDomainEvents(): DomainEvent[];
    clearDomainEvents(): void;
    getScheduleId(): string;
    getTenantId(): TenantId;
    getDedupKey(): DedupKey;
    getStatus(): ScheduleStatus;
    isActive(): boolean;
    getCreatedAt(): Date;
    getUpdatedAt(): Date;
    getPayloadJson(): any;
    getEndAtUtc(): Date | undefined;
    getMaxRuns(): number | undefined;
    getProps(): Readonly<ScheduleProps>;
}
//# sourceMappingURL=Schedule.aggregate.d.ts.map