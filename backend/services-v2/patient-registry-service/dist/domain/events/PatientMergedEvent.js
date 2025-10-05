"use strict";
/**
 * PatientMergedEvent
 *
 * Published when duplicate patients are merged
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientMergedEvent = void 0;
const domain_event_1 = require("../../shared/domain/base/domain-event");
class PatientMergedEvent extends domain_event_1.DomainEvent {
    constructor(duplicatePatient, masterPatientId, reason, performedBy) {
        super('PatientMerged', duplicatePatient.getPatientId().getValue());
        this.duplicatePatient = duplicatePatient;
        this.masterPatientId = masterPatientId;
        this.reason = reason;
        this.performedBy = performedBy;
    }
    getPayload() {
        return {
            duplicatePatientId: this.duplicatePatient.getPatientId().getValue(),
            masterPatientId: this.masterPatientId.getValue(),
            reason: this.reason,
            performedBy: this.performedBy,
            mergedAt: this.occurredAt
        };
    }
}
exports.PatientMergedEvent = PatientMergedEvent;
//# sourceMappingURL=PatientMergedEvent.js.map