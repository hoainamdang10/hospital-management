"use strict";
/**
 * Reminder Service Interface - Application Layer
 * Manages appointment reminders across multiple channels
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderStatus = exports.ReminderChannel = exports.ReminderType = void 0;
var ReminderType;
(function (ReminderType) {
    ReminderType["BEFORE_24H"] = "24h";
    ReminderType["BEFORE_2H"] = "2h";
    ReminderType["BEFORE_30MIN"] = "30min";
})(ReminderType || (exports.ReminderType = ReminderType = {}));
var ReminderChannel;
(function (ReminderChannel) {
    ReminderChannel["EMAIL"] = "email";
    ReminderChannel["SMS"] = "sms";
    ReminderChannel["PUSH"] = "push";
    ReminderChannel["IN_APP"] = "in_app";
})(ReminderChannel || (exports.ReminderChannel = ReminderChannel = {}));
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["SCHEDULED"] = "scheduled";
    ReminderStatus["SENT"] = "sent";
    ReminderStatus["FAILED"] = "failed";
    ReminderStatus["CANCELLED"] = "cancelled";
})(ReminderStatus || (exports.ReminderStatus = ReminderStatus = {}));
//# sourceMappingURL=IReminderService.js.map