"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleRunEmittedEvent = exports.ScheduleRunFailedEvent = exports.ScheduleRunCompletedEvent = exports.ScheduleRunStartedEvent = exports.ScheduleRunCreatedEvent = void 0;
const DomainEvent_1 = require("./DomainEvent");
class ScheduleRunCreatedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(runId, scheduleId, tenantId, dueAtUtc) {
        super(runId, 'ScheduleRun', 'ScheduleRunCreated', {
            runId,
            scheduleId,
            tenantId,
            dueAtUtc: dueAtUtc.toISOString()
        });
    }
}
exports.ScheduleRunCreatedEvent = ScheduleRunCreatedEvent;
class ScheduleRunStartedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(runId, scheduleId, tenantId, workerId) {
        super(runId, 'ScheduleRun', 'ScheduleRunStarted', {
            runId,
            scheduleId,
            tenantId,
            workerId
        });
    }
}
exports.ScheduleRunStartedEvent = ScheduleRunStartedEvent;
class ScheduleRunCompletedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(runId, scheduleId, tenantId, success, error) {
        super(runId, 'ScheduleRun', 'ScheduleRunCompleted', {
            runId,
            scheduleId,
            tenantId,
            success,
            error
        });
    }
}
exports.ScheduleRunCompletedEvent = ScheduleRunCompletedEvent;
class ScheduleRunFailedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(runId, scheduleId, tenantId, error, attempt) {
        super(runId, 'ScheduleRun', 'ScheduleRunFailed', {
            runId,
            scheduleId,
            tenantId,
            error,
            attempt
        });
    }
}
exports.ScheduleRunFailedEvent = ScheduleRunFailedEvent;
class ScheduleRunEmittedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(runId, scheduleId, tenantId, topicOrCommand) {
        super(runId, 'ScheduleRun', 'ScheduleRunEmitted', {
            runId,
            scheduleId,
            tenantId,
            topicOrCommand
        });
    }
}
exports.ScheduleRunEmittedEvent = ScheduleRunEmittedEvent;
//# sourceMappingURL=ScheduleRunEvents.js.map