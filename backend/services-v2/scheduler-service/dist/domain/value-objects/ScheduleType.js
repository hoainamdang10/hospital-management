"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleTypeVO = exports.ScheduleType = void 0;
var ScheduleType;
(function (ScheduleType) {
    ScheduleType["ONCE"] = "ONCE";
    ScheduleType["CRON"] = "CRON";
    ScheduleType["RRULE"] = "RRULE";
})(ScheduleType || (exports.ScheduleType = ScheduleType = {}));
class ScheduleTypeVO {
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        const upperValue = value.toUpperCase();
        if (!Object.values(ScheduleType).includes(upperValue)) {
            throw new Error(`Invalid schedule type: ${value}. Must be ONCE, CRON, or RRULE`);
        }
        return new ScheduleTypeVO(upperValue);
    }
    static once() {
        return new ScheduleTypeVO(ScheduleType.ONCE);
    }
    static cron() {
        return new ScheduleTypeVO(ScheduleType.CRON);
    }
    static rrule() {
        return new ScheduleTypeVO(ScheduleType.RRULE);
    }
    getValue() {
        return this.value;
    }
    isOnce() {
        return this.value === ScheduleType.ONCE;
    }
    isCron() {
        return this.value === ScheduleType.CRON;
    }
    isRRule() {
        return this.value === ScheduleType.RRULE;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.ScheduleTypeVO = ScheduleTypeVO;
//# sourceMappingURL=ScheduleType.js.map