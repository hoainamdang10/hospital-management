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
    constructor(duplicatePatientId, masterPatientId, reason, performedBy, correlationId, causationId, userIdForAudit) {
        const eventData = {
            duplicatePatientId,
            masterPatientId,
            reason,
            performedBy
        };
        super('PatientMerged', duplicatePatientId, 'Patient', eventData, 1, correlationId, causationId, userIdForAudit);
        this.duplicatePatientId = duplicatePatientId;
        this.masterPatientId = masterPatientId;
        this.reason = reason;
        this.performedBy = performedBy;
    }
    getEventData() {
        return {
            duplicatePatientId: this.duplicatePatientId,
            masterPatientId: this.masterPatientId,
            reason: this.reason,
            performedBy: this.performedBy,
            mergedAt: this.occurredAt
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.duplicatePatientId;
    }
    getPayload() {
        return this.getEventData();
    }
}
exports.PatientMergedEvent = PatientMergedEvent;
//# sourceMappingURL=PatientMergedEvent.js.map