import { TenantId } from '../value-objects/TenantId';
import {
  ScheduleRunCreatedEvent,
  ScheduleRunStartedEvent,
  ScheduleRunCompletedEvent,
  ScheduleRunFailedEvent,
  ScheduleRunEmittedEvent
} from '../events/ScheduleRunEvents';
import { DomainEvent } from '../events/DomainEvent';

export enum ScheduleRunStatus {
  DUE = 'DUE',
  RUNNING = 'RUNNING',
  EMITTING = 'EMITTING',
  EMITTED = 'EMITTED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED'
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

export class ScheduleRun {
  private domainEvents: DomainEvent[] = [];

  private constructor(private props: ScheduleRunProps) {}

  public static create(
    scheduleId: string,
    tenantId: TenantId,
    dueAtUtc: Date,
    segment?: number
  ): ScheduleRun {
    const runId = crypto.randomUUID();

    const run = new ScheduleRun({
      runId,
      scheduleId,
      tenantId,
      dueAtUtc,
      status: ScheduleRunStatus.DUE,
      attempt: 0,
      segment,
      createdAt: new Date()
    });

    run.addDomainEvent(
      new ScheduleRunCreatedEvent(
        runId,
        scheduleId,
        tenantId.getValue(),
        dueAtUtc
      )
    );

    return run;
  }

  public static reconstitute(props: ScheduleRunProps): ScheduleRun {
    return new ScheduleRun(props);
  }

  public acquireLock(workerId: string): boolean {
    if (this.props.status !== ScheduleRunStatus.DUE) {
      return false;
    }

    if (this.props.lockedBy && this.props.lockedAtUtc) {
      const lockAge = Date.now() - this.props.lockedAtUtc.getTime();
      if (lockAge < 60000) {
        return false;
      }
    }

    this.props.lockedBy = workerId;
    this.props.lockedAtUtc = new Date();

    return true;
  }

  public start(workerId: string): void {
    if (this.props.status !== ScheduleRunStatus.DUE) {
      throw new Error(`Cannot start run in status: ${this.props.status}`);
    }

    if (this.props.lockedBy !== workerId) {
      throw new Error('Run is locked by another worker');
    }

    this.props.status = ScheduleRunStatus.RUNNING;
    this.props.startedAtUtc = new Date();

    this.addDomainEvent(
      new ScheduleRunStartedEvent(
        this.props.runId,
        this.props.scheduleId,
        this.props.tenantId.getValue(),
        workerId
      )
    );
  }

  public markAsEmitting(): void {
    if (this.props.status !== ScheduleRunStatus.RUNNING) {
      throw new Error(`Cannot mark as emitting from status: ${this.props.status}`);
    }

    this.props.status = ScheduleRunStatus.EMITTING;
  }

  public markAsEmitted(topicOrCommand: string): void {
    if (this.props.status !== ScheduleRunStatus.EMITTING) {
      throw new Error(`Cannot mark as emitted from status: ${this.props.status}`);
    }

    this.props.status = ScheduleRunStatus.EMITTED;

    this.addDomainEvent(
      new ScheduleRunEmittedEvent(
        this.props.runId,
        this.props.scheduleId,
        this.props.tenantId.getValue(),
        topicOrCommand
      )
    );
  }

  public markAsSucceeded(): void {
    if (this.props.status !== ScheduleRunStatus.EMITTED) {
      throw new Error(`Cannot mark as succeeded from status: ${this.props.status}`);
    }

    this.props.status = ScheduleRunStatus.SUCCEEDED;
    this.props.finishedAtUtc = new Date();

    this.addDomainEvent(
      new ScheduleRunCompletedEvent(
        this.props.runId,
        this.props.scheduleId,
        this.props.tenantId.getValue(),
        true
      )
    );
  }

  public markAsFailed(error: string): void {
    this.props.status = ScheduleRunStatus.FAILED;
    this.props.lastError = error;
    this.props.finishedAtUtc = new Date();
    this.props.attempt += 1;

    this.addDomainEvent(
      new ScheduleRunFailedEvent(
        this.props.runId,
        this.props.scheduleId,
        this.props.tenantId.getValue(),
        error,
        this.props.attempt
      )
    );
  }

  public retry(): void {
    if (this.props.status !== ScheduleRunStatus.FAILED) {
      throw new Error('Can only retry failed runs');
    }

    this.props.status = ScheduleRunStatus.DUE;
    this.props.lockedBy = undefined;
    this.props.lockedAtUtc = undefined;
    this.props.startedAtUtc = undefined;
    this.props.finishedAtUtc = undefined;
    this.props.lastError = undefined; // Clear error on retry
  }

  public isDue(now: Date = new Date()): boolean {
    return this.props.status === ScheduleRunStatus.DUE && this.props.dueAtUtc <= now;
  }

  public isOverdue(now: Date = new Date(), graceWindowMs: number = 60000): boolean {
    if (this.props.status !== ScheduleRunStatus.DUE) {
      return false;
    }

    const overdueThreshold = new Date(this.props.dueAtUtc.getTime() + graceWindowMs);
    return now > overdueThreshold;
  }

  public getQueueLag(now: Date = new Date()): number {
    if (this.props.status !== ScheduleRunStatus.DUE) {
      return 0;
    }

    return Math.max(0, now.getTime() - this.props.dueAtUtc.getTime()) / 1000;
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

  public getRunId(): string {
    return this.props.runId;
  }

  public getScheduleId(): string {
    return this.props.scheduleId;
  }

  public getTenantId(): TenantId {
    return this.props.tenantId;
  }

  public getStatus(): ScheduleRunStatus {
    return this.props.status;
  }

  public getAttempt(): number {
    return this.props.attempt;
  }

  public getProps(): Readonly<ScheduleRunProps> {
    return { ...this.props };
  }
}

