import { ScheduleType, ScheduleTypeVO } from '../value-objects/ScheduleType';
import { CronExpression } from '../value-objects/CronExpression';
import { RRuleExpression } from '../value-objects/RRuleExpression';
import { Timezone } from '../value-objects/Timezone';
import { TenantId } from '../value-objects/TenantId';
import { DedupKey } from '../value-objects/DedupKey';
import { RetryPolicy } from '../value-objects/RetryPolicy';
import {
  ScheduleCreatedEvent,
  ScheduleUpdatedEvent,
  ScheduleCancelledEvent,
  SchedulePausedEvent,
  ScheduleResumedEvent
} from '../events/ScheduleEvents';
import { DomainEvent } from '../events/DomainEvent';

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
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

export class Schedule {
  private domainEvents: DomainEvent[] = [];

  private constructor(private props: ScheduleProps) {
    this.validate();
  }

  public static create(props: Omit<ScheduleProps, 'scheduleId' | 'createdAt' | 'updatedAt' | 'status'>): Schedule {
    const schedule = new Schedule({
      ...props,
      scheduleId: crypto.randomUUID(),
      status: ScheduleStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    schedule.addDomainEvent(
      new ScheduleCreatedEvent(
        schedule.props.scheduleId,
        schedule.props.tenantId.getValue(),
        schedule.props.ownerService,
        schedule.props.topicOrCommand
      )
    );

    return schedule;
  }

  public static reconstitute(props: ScheduleProps): Schedule {
    return new Schedule(props);
  }

  private validate(): void {
    if (this.props.scheduleType.isOnce() && !this.props.startAtUtc) {
      throw new Error('ONCE schedule must have startAtUtc');
    }

    if (this.props.scheduleType.isCron() && !this.props.cronExpr) {
      throw new Error('CRON schedule must have cronExpr');
    }

    if (this.props.scheduleType.isRRule() && !this.props.rrule) {
      throw new Error('RRULE schedule must have rrule');
    }

    if (this.props.jitterMs < 0) {
      throw new Error('Jitter must be non-negative');
    }

    if (this.props.maxRuns !== undefined && this.props.maxRuns < 1) {
      throw new Error('Max runs must be at least 1');
    }
  }

  public getNextOccurrence(from: Date = new Date()): Date | null {
    if (this.props.status !== ScheduleStatus.ACTIVE) {
      return null;
    }

    if (this.props.endAtUtc && from >= this.props.endAtUtc) {
      return null;
    }

    let nextOccurrence: Date | null = null;

    if (this.props.scheduleType.isOnce()) {
      if (this.props.startAtUtc && this.props.startAtUtc > from) {
        nextOccurrence = this.props.startAtUtc;
      }
    } else if (this.props.scheduleType.isCron() && this.props.cronExpr) {
      nextOccurrence = this.props.cronExpr.getNextOccurrence(from);
    } else if (this.props.scheduleType.isRRule() && this.props.rrule) {
      nextOccurrence = this.props.rrule.getNextOccurrence(from);
    }

    if (nextOccurrence && this.props.endAtUtc && nextOccurrence > this.props.endAtUtc) {
      return null;
    }

    // REMOVED: Jitter logic moved to MaterializerWorker
    // Jitter must be calculated ONCE when creating ScheduleRun, not every time getNextOccurrence() is called
    // This ensures deterministic scheduling and prevents the same run from having different due times

    return nextOccurrence;
  }

  public getOccurrencesBetween(startDate: Date, endDate: Date): Date[] {
    if (this.props.status !== ScheduleStatus.ACTIVE) {
      return [];
    }

    let occurrences: Date[] = [];

    if (this.props.scheduleType.isOnce()) {
      if (this.props.startAtUtc && this.props.startAtUtc >= startDate && this.props.startAtUtc <= endDate) {
        occurrences = [this.props.startAtUtc];
      }
    } else if (this.props.scheduleType.isCron() && this.props.cronExpr) {
      occurrences = this.props.cronExpr.getOccurrencesBetween(startDate, endDate);
    } else if (this.props.scheduleType.isRRule() && this.props.rrule) {
      occurrences = this.props.rrule.getOccurrencesBetween(startDate, endDate);
    }

    if (this.props.endAtUtc) {
      occurrences = occurrences.filter(occ => occ <= this.props.endAtUtc!);
    }

    if (this.props.maxRuns !== undefined) {
      occurrences = occurrences.slice(0, this.props.maxRuns);
    }

    // REMOVED: Jitter logic moved to MaterializerWorker
    // Jitter must be calculated ONCE when creating ScheduleRun, not every time getOccurrencesBetween() is called
    // This ensures deterministic scheduling and prevents the same run from having different due times

    return occurrences;
  }

  public pause(): void {
    if (this.props.status === ScheduleStatus.CANCELLED) {
      throw new Error('Cannot pause cancelled schedule');
    }

    if (this.props.status === ScheduleStatus.PAUSED) {
      return;
    }

    this.props.status = ScheduleStatus.PAUSED;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new SchedulePausedEvent(
        this.props.scheduleId,
        this.props.tenantId.getValue()
      )
    );
  }

  public resume(): void {
    if (this.props.status === ScheduleStatus.CANCELLED) {
      throw new Error('Cannot resume cancelled schedule');
    }

    if (this.props.status === ScheduleStatus.ACTIVE) {
      return;
    }

    this.props.status = ScheduleStatus.ACTIVE;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduleResumedEvent(
        this.props.scheduleId,
        this.props.tenantId.getValue()
      )
    );
  }

  public cancel(reason?: string): void {
    if (this.props.status === ScheduleStatus.CANCELLED) {
      return;
    }

    this.props.status = ScheduleStatus.CANCELLED;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduleCancelledEvent(
        this.props.scheduleId,
        this.props.tenantId.getValue(),
        reason
      )
    );
  }

  public update(updates: Partial<Pick<ScheduleProps, 'payloadJson' | 'endAtUtc' | 'maxRuns'>>): void {
    if (this.props.status === ScheduleStatus.CANCELLED) {
      throw new Error('Cannot update cancelled schedule');
    }

    const changes: Record<string, any> = {};

    if (updates.payloadJson !== undefined) {
      this.props.payloadJson = updates.payloadJson;
      changes.payloadJson = updates.payloadJson;
    }

    if (updates.endAtUtc !== undefined) {
      this.props.endAtUtc = updates.endAtUtc;
      changes.endAtUtc = updates.endAtUtc;
    }

    if (updates.maxRuns !== undefined) {
      this.props.maxRuns = updates.maxRuns;
      changes.maxRuns = updates.maxRuns;
    }

    if (Object.keys(changes).length > 0) {
      this.props.updatedAt = new Date();

      this.addDomainEvent(
        new ScheduleUpdatedEvent(
          this.props.scheduleId,
          this.props.tenantId.getValue(),
          changes
        )
      );
    }
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }

  public getScheduleId(): string {
    return this.props.scheduleId;
  }

  public getTenantId(): TenantId {
    return this.props.tenantId;
  }

  public getDedupKey(): DedupKey {
    return this.props.dedupKey;
  }

  public getStatus(): ScheduleStatus {
    return this.props.status;
  }

  public isActive(): boolean {
    return this.props.status === ScheduleStatus.ACTIVE;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public getPayloadJson(): any {
    return this.props.payloadJson;
  }

  public getEndAtUtc(): Date | undefined {
    return this.props.endAtUtc;
  }

  public getMaxRuns(): number | undefined {
    return this.props.maxRuns;
  }

  public getProps(): Readonly<ScheduleProps> {
    return { ...this.props };
  }
}

