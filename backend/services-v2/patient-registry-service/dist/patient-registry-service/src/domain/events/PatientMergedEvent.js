"use strict";
/**
 * PatientMergedEvent
 *
 * Published when duplicate patients are merged
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientMergedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PatientMergedEvent extends domain_event_1.DomainEvent {
    constructor(duplicatePatient, masterPatientId, reason, performedBy) {
        const patientId = duplicatePatient.getPatientId() || '';
        const eventData = {
            duplicatePatientId: patientId,
            masterPatientId: masterPatientId.value,
            reason,
            performedBy
        };
        super('PatientMerged', patientId, 'Patient', eventData, 1);
        this.duplicatePatient = duplicatePatient;
        this.masterPatientId = masterPatientId;
        this.reason = reason;
        this.performedBy = performedBy;
    }
    getEventData() {
        const patientId = this.duplicatePatient.getPatientId() || '';
        return {
            duplicatePatientId: patientId,
            masterPatientId: this.masterPatientId.value,
            reason: this.reason,
            performedBy: this.performedBy,
            mergedAt: this.occurredAt
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.duplicatePatient.getPatientId();
    }
    getPayload() {
        return this.getEventData();
    }
}
exports.PatientMergedEvent = PatientMergedEvent;
//# sourceMappingURL=PatientMergedEvent.js.map