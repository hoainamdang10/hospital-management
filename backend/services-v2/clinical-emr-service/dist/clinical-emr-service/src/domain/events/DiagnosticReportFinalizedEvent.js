"use strict";
/**
 * DiagnosticReportFinalizedEvent - Domain Event
 * Published when diagnostic report is finalized by verifying doctor
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticReportFinalizedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class DiagnosticReportFinalizedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('DiagnosticReportFinalized', aggregateId || payload.reportId, 'DiagnosticReport', payload, eventVersion, correlationId, causationId, userId || payload.verifiedBy, { source: 'domain', priority: 'normal', retryable: true });
        this.payload = payload;
        this.reportId = payload.reportId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.orderedBy = payload.orderedBy;
        this.verifiedBy = payload.verifiedBy;
        this.verifiedAt = payload.verifiedAt;
        this.verificationComment = payload.verificationComment;
    }
    getEventData() {
        return this.payload || {
            ...Object.keys(this).reduce((acc, key) => {
                if (!key.startsWith('event') && key !== 'metadata' && key !== 'payload') {
                    acc[key] = this[key];
                }
                return acc;
            }, {})
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId || this.payload?.patientId || null;
    }
}
exports.DiagnosticReportFinalizedEvent = DiagnosticReportFinalizedEvent;
//# sourceMappingURL=DiagnosticReportFinalizedEvent.js.map