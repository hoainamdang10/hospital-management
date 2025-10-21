import { BaseDomainEvent } from './DomainEvent';

export class ScheduleCreatedEvent extends BaseDomainEvent {
  constructor(
    scheduleId: string,
    tenantId: string,
    ownerService: string,
    topicOrCommand: string
  ) {
    super(scheduleId, 'Schedule', 'ScheduleCreated', {
      scheduleId,
      tenantId,
      ownerService,
      topicOrCommand
    });
  }
}

export class ScheduleUpdatedEvent extends BaseDomainEvent {
  constructor(
    scheduleId: string,
    tenantId: string,
    changes: Record<string, any>
  ) {
    super(scheduleId, 'Schedule', 'ScheduleUpdated', {
      scheduleId,
      tenantId,
      changes
    });
  }
}

export class ScheduleCancelledEvent extends BaseDomainEvent {
  constructor(
    scheduleId: string,
    tenantId: string,
    reason?: string
  ) {
    super(scheduleId, 'Schedule', 'ScheduleCancelled', {
      scheduleId,
      tenantId,
      reason
    });
  }
}

export class SchedulePausedEvent extends BaseDomainEvent {
  constructor(
    scheduleId: string,
    tenantId: string
  ) {
    super(scheduleId, 'Schedule', 'SchedulePaused', {
      scheduleId,
      tenantId
    });
  }
}

export class ScheduleResumedEvent extends BaseDomainEvent {
  constructor(
    scheduleId: string,
    tenantId: string
  ) {
    super(scheduleId, 'Schedule', 'ScheduleResumed', {
      scheduleId,
      tenantId
    });
  }
}

