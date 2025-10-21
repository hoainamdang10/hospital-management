import { BaseDomainEvent } from './DomainEvent';

export class ScheduleRunCreatedEvent extends BaseDomainEvent {
  constructor(
    runId: string,
    scheduleId: string,
    tenantId: string,
    dueAtUtc: Date
  ) {
    super(runId, 'ScheduleRun', 'ScheduleRunCreated', {
      runId,
      scheduleId,
      tenantId,
      dueAtUtc: dueAtUtc.toISOString()
    });
  }
}

export class ScheduleRunStartedEvent extends BaseDomainEvent {
  constructor(
    runId: string,
    scheduleId: string,
    tenantId: string,
    workerId: string
  ) {
    super(runId, 'ScheduleRun', 'ScheduleRunStarted', {
      runId,
      scheduleId,
      tenantId,
      workerId
    });
  }
}

export class ScheduleRunCompletedEvent extends BaseDomainEvent {
  constructor(
    runId: string,
    scheduleId: string,
    tenantId: string,
    success: boolean,
    error?: string
  ) {
    super(runId, 'ScheduleRun', 'ScheduleRunCompleted', {
      runId,
      scheduleId,
      tenantId,
      success,
      error
    });
  }
}

export class ScheduleRunFailedEvent extends BaseDomainEvent {
  constructor(
    runId: string,
    scheduleId: string,
    tenantId: string,
    error: string,
    attempt: number
  ) {
    super(runId, 'ScheduleRun', 'ScheduleRunFailed', {
      runId,
      scheduleId,
      tenantId,
      error,
      attempt
    });
  }
}

export class ScheduleRunEmittedEvent extends BaseDomainEvent {
  constructor(
    runId: string,
    scheduleId: string,
    tenantId: string,
    topicOrCommand: string
  ) {
    super(runId, 'ScheduleRun', 'ScheduleRunEmitted', {
      runId,
      scheduleId,
      tenantId,
      topicOrCommand
    });
  }
}

