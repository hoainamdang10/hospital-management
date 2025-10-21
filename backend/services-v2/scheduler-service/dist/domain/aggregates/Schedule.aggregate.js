"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = exports.ScheduleStatus = void 0;
const ScheduleEvents_1 = require("../events/ScheduleEvents");
var ScheduleStatus;
(function (ScheduleStatus) {
    ScheduleStatus["ACTIVE"] = "ACTIVE";
    ScheduleStatus["PAUSED"] = "PAUSED";
    ScheduleStatus["CANCELLED"] = "CANCELLED";
})(ScheduleStatus || (exports.ScheduleStatus = ScheduleStatus = {}));
class Schedule {
    constructor(props) {
        this.props = props;
        this.domainEvents = [];
        this.validate();
    }
    static create(props) {
        const schedule = new Schedule({
            ...props,
            scheduleId: crypto.randomUUID(),
            status: ScheduleStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        schedule.addDomainEvent(new ScheduleEvents_1.ScheduleCreatedEvent(schedule.props.scheduleId, schedule.props.tenantId.getValue(), schedule.props.ownerService, schedule.props.topicOrCommand));
        return schedule;
    }
    static reconstitute(props) {
        return new Schedule(props);
    }
    validate() {
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
    getNextOccurrence(from = new Date()) {
        if (this.props.status !== ScheduleStatus.ACTIVE) {
            return null;
        }
        if (this.props.endAtUtc && from >= this.props.endAtUtc) {
            return null;
        }
        let nextOccurrence = null;
        if (this.props.scheduleType.isOnce()) {
            if (this.props.startAtUtc && this.props.startAtUtc > from) {
                nextOccurrence = this.props.startAtUtc;
            }
        }
        else if (this.props.scheduleType.isCron() && this.props.cronExpr) {
            nextOccurrence = this.props.cronExpr.getNextOccurrence(from);
        }
        else if (this.props.scheduleType.isRRule() && this.props.rrule) {
            nextOccurrence = this.props.rrule.getNextOccurrence(from);
        }
        if (nextOccurrence && this.props.endAtUtc && nextOccurrence > this.props.endAtUtc) {
            return null;
        }
        if (nextOccurrence && this.props.jitterMs > 0) {
            const jitter = Math.floor(Math.random() * this.props.jitterMs);
            nextOccurrence = new Date(nextOccurrence.getTime() + jitter);
        }
        return nextOccurrence;
    }
    getOccurrencesBetween(startDate, endDate) {
        if (this.props.status !== ScheduleStatus.ACTIVE) {
            return [];
        }
        let occurrences = [];
        if (this.props.scheduleType.isOnce()) {
            if (this.props.startAtUtc && this.props.startAtUtc >= startDate && this.props.startAtUtc <= endDate) {
                occurrences = [this.props.startAtUtc];
            }
        }
        else if (this.props.scheduleType.isCron() && this.props.cronExpr) {
            occurrences = this.props.cronExpr.getOccurrencesBetween(startDate, endDate);
        }
        else if (this.props.scheduleType.isRRule() && this.props.rrule) {
            occurrences = this.props.rrule.getOccurrencesBetween(startDate, endDate);
        }
        if (this.props.endAtUtc) {
            occurrences = occurrences.filter(occ => occ <= this.props.endAtUtc);
        }
        if (this.props.maxRuns !== undefined) {
            occurrences = occurrences.slice(0, this.props.maxRuns);
        }
        if (this.props.jitterMs > 0) {
            occurrences = occurrences.map(occ => {
                const jitter = Math.floor(Math.random() * this.props.jitterMs);
                return new Date(occ.getTime() + jitter);
            });
        }
        return occurrences;
    }
    pause() {
        if (this.props.status === ScheduleStatus.CANCELLED) {
            throw new Error('Cannot pause cancelled schedule');
        }
        if (this.props.status === ScheduleStatus.PAUSED) {
            return;
        }
        this.props.status = ScheduleStatus.PAUSED;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new ScheduleEvents_1.SchedulePausedEvent(this.props.scheduleId, this.props.tenantId.getValue()));
    }
    resume() {
        if (this.props.status === ScheduleStatus.CANCELLED) {
            throw new Error('Cannot resume cancelled schedule');
        }
        if (this.props.status === ScheduleStatus.ACTIVE) {
            return;
        }
        this.props.status = ScheduleStatus.ACTIVE;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new ScheduleEvents_1.ScheduleResumedEvent(this.props.scheduleId, this.props.tenantId.getValue()));
    }
    cancel(reason) {
        if (this.props.status === ScheduleStatus.CANCELLED) {
            return;
        }
        this.props.status = ScheduleStatus.CANCELLED;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new ScheduleEvents_1.ScheduleCancelledEvent(this.props.scheduleId, this.props.tenantId.getValue(), reason));
    }
    update(updates) {
        if (this.props.status === ScheduleStatus.CANCELLED) {
            throw new Error('Cannot update cancelled schedule');
        }
        const changes = {};
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
            this.addDomainEvent(new ScheduleEvents_1.ScheduleUpdatedEvent(this.props.scheduleId, this.props.tenantId.getValue(), changes));
        }
    }
    addDomainEvent(event) {
        this.domainEvents.push(event);
    }
    getDomainEvents() {
        return [...this.domainEvents];
    }
    clearDomainEvents() {
        this.domainEvents = [];
    }
    getScheduleId() {
        return this.props.scheduleId;
    }
    getTenantId() {
        return this.props.tenantId;
    }
    getDedupKey() {
        return this.props.dedupKey;
    }
    getStatus() {
        return this.props.status;
    }
    isActive() {
        return this.props.status === ScheduleStatus.ACTIVE;
    }
    getProps() {
        return { ...this.props };
    }
}
exports.Schedule = Schedule;
//# sourceMappingURL=Schedule.aggregate.js.map