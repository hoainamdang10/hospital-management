"use strict";
/**
 * Interface for Rescheduling Queue Repository
 * Handles appointment conflict resolution and rescheduling workflows
 * Follows medical compliance and audit trail requirements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReschedulingPriority = exports.PatientResponse = exports.ReschedulingStatus = void 0;
var ReschedulingStatus;
(function (ReschedulingStatus) {
    ReschedulingStatus["PENDING_RESCHEDULE"] = "PENDING_RESCHEDULE";
    ReschedulingStatus["SEARCHING_ALTERNATIVES"] = "SEARCHING_ALTERNATIVES";
    ReschedulingStatus["NOTIFIED"] = "NOTIFIED";
    ReschedulingStatus["ACCEPTED"] = "ACCEPTED";
    ReschedulingStatus["REJECTED"] = "REJECTED";
    ReschedulingStatus["COMPLETED"] = "COMPLETED";
    ReschedulingStatus["EXPIRED"] = "EXPIRED";
})(ReschedulingStatus || (exports.ReschedulingStatus = ReschedulingStatus = {}));
var PatientResponse;
(function (PatientResponse) {
    PatientResponse["ACCEPTED"] = "ACCEPTED";
    PatientResponse["REJECTED"] = "REJECTED";
    PatientResponse["PENDING"] = "PENDING";
    PatientResponse["NO_RESPONSE"] = "NO_RESPONSE";
})(PatientResponse || (exports.PatientResponse = PatientResponse = {}));
var ReschedulingPriority;
(function (ReschedulingPriority) {
    ReschedulingPriority["EMERGENCY"] = "EMERGENCY";
    ReschedulingPriority["URGENT"] = "URGENT";
    ReschedulingPriority["NORMAL"] = "NORMAL";
    ReschedulingPriority["LOW"] = "LOW";
})(ReschedulingPriority || (exports.ReschedulingPriority = ReschedulingPriority = {}));
//# sourceMappingURL=IReschedulingQueueRepository.js.map