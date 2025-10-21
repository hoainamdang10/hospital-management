"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleResumedEvent = exports.SchedulePausedEvent = exports.ScheduleCancelledEvent = exports.ScheduleUpdatedEvent = exports.ScheduleCreatedEvent = void 0;
const DomainEvent_1 = require("./DomainEvent");
class ScheduleCreatedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(scheduleId, tenantId, ownerService, topicOrCommand) {
        super(scheduleId, 'Schedule', 'ScheduleCreated', {
            scheduleId,
            tenantId,
            ownerService,
            topicOrCommand
        });
    }
}
exports.ScheduleCreatedEvent = ScheduleCreatedEvent;
class ScheduleUpdatedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(scheduleId, tenantId, changes) {
        super(scheduleId, 'Schedule', 'ScheduleUpdated', {
            scheduleId,
            tenantId,
            changes
        });
    }
}
exports.ScheduleUpdatedEvent = ScheduleUpdatedEvent;
class ScheduleCancelledEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(scheduleId, tenantId, reason) {
        super(scheduleId, 'Schedule', 'ScheduleCancelled', {
            scheduleId,
            tenantId,
            reason
        });
    }
}
exports.ScheduleCancelledEvent = ScheduleCancelledEvent;
class SchedulePausedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(scheduleId, tenantId) {
        super(scheduleId, 'Schedule', 'SchedulePaused', {
            scheduleId,
            tenantId
        });
    }
}
exports.SchedulePausedEvent = SchedulePausedEvent;
class ScheduleResumedEvent extends DomainEvent_1.BaseDomainEvent {
    constructor(scheduleId, tenantId) {
        super(scheduleId, 'Schedule', 'ScheduleResumed', {
            scheduleId,
            tenantId
        });
    }
}
exports.ScheduleResumedEvent = ScheduleResumedEvent;
//# sourceMappingURL=ScheduleEvents.js.map