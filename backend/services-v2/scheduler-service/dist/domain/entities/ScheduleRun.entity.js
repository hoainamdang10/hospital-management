"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleRun = exports.ScheduleRunStatus = void 0;
const ScheduleRunEvents_1 = require("../events/ScheduleRunEvents");
var ScheduleRunStatus;
(function (ScheduleRunStatus) {
    ScheduleRunStatus["DUE"] = "DUE";
    ScheduleRunStatus["RUNNING"] = "RUNNING";
    ScheduleRunStatus["EMITTING"] = "EMITTING";
    ScheduleRunStatus["EMITTED"] = "EMITTED";
    ScheduleRunStatus["SUCCEEDED"] = "SUCCEEDED";
    ScheduleRunStatus["FAILED"] = "FAILED";
})(ScheduleRunStatus || (exports.ScheduleRunStatus = ScheduleRunStatus = {}));
class ScheduleRun {
    constructor(props) {
        this.props = props;
        this.domainEvents = [];
    }
    static create(scheduleId, tenantId, dueAtUtc, segment) {
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
        run.addDomainEvent(new ScheduleRunEvents_1.ScheduleRunCreatedEvent(runId, scheduleId, tenantId.getValue(), dueAtUtc));
        return run;
    }
    static reconstitute(props) {
        return new ScheduleRun(props);
    }
    acquireLock(workerId) {
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
    start(workerId) {
        if (this.props.status !== ScheduleRunStatus.DUE) {
            throw new Error(`Cannot start run in status: ${this.props.status}`);
        }
        if (this.props.lockedBy !== workerId) {
            throw new Error('Run is locked by another worker');
        }
        this.props.status = ScheduleRunStatus.RUNNING;
        this.props.startedAtUtc = new Date();
        this.addDomainEvent(new ScheduleRunEvents_1.ScheduleRunStartedEvent(this.props.runId, this.props.scheduleId, this.props.tenantId.getValue(), workerId));
    }
    markAsEmitting() {
        if (this.props.status !== ScheduleRunStatus.RUNNING) {
            throw new Error(`Cannot mark as emitting from status: ${this.props.status}`);
        }
        this.props.status = ScheduleRunStatus.EMITTING;
    }
    markAsEmitted(topicOrCommand) {
        if (this.props.status !== ScheduleRunStatus.EMITTING) {
            throw new Error(`Cannot mark as emitted from status: ${this.props.status}`);
        }
        this.props.status = ScheduleRunStatus.EMITTED;
        this.addDomainEvent(new ScheduleRunEvents_1.ScheduleRunEmittedEvent(this.props.runId, this.props.scheduleId, this.props.tenantId.getValue(), topicOrCommand));
    }
    markAsSucceeded() {
        if (this.props.status !== ScheduleRunStatus.EMITTED) {
            throw new Error(`Cannot mark as succeeded from status: ${this.props.status}`);
        }
        this.props.status = ScheduleRunStatus.SUCCEEDED;
        this.props.finishedAtUtc = new Date();
        this.addDomainEvent(new ScheduleRunEvents_1.ScheduleRunCompletedEvent(this.props.runId, this.props.scheduleId, this.props.tenantId.getValue(), true));
    }
    markAsFailed(error) {
        this.props.status = ScheduleRunStatus.FAILED;
        this.props.lastError = error;
        this.props.finishedAtUtc = new Date();
        this.props.attempt += 1;
        this.addDomainEvent(new ScheduleRunEvents_1.ScheduleRunFailedEvent(this.props.runId, this.props.scheduleId, this.props.tenantId.getValue(), error, this.props.attempt));
    }
    retry() {
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
    isDue(now = new Date()) {
        return this.props.status === ScheduleRunStatus.DUE && this.props.dueAtUtc <= now;
    }
    isOverdue(now = new Date(), graceWindowMs = 60000) {
        if (this.props.status !== ScheduleRunStatus.DUE) {
            return false;
        }
        const overdueThreshold = new Date(this.props.dueAtUtc.getTime() + graceWindowMs);
        return now > overdueThreshold;
    }
    getQueueLag(now = new Date()) {
        if (this.props.status !== ScheduleRunStatus.DUE) {
            return 0;
        }
        return Math.max(0, now.getTime() - this.props.dueAtUtc.getTime()) / 1000;
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
    getRunId() {
        return this.props.runId;
    }
    getScheduleId() {
        return this.props.scheduleId;
    }
    getTenantId() {
        return this.props.tenantId;
    }
    getStatus() {
        return this.props.status;
    }
    getAttempt() {
        return this.props.attempt;
    }
    getProps() {
        return { ...this.props };
    }
}
exports.ScheduleRun = ScheduleRun;
//# sourceMappingURL=ScheduleRun.entity.js.map