"use strict";
/**
 * DiagnosticReportUpdatedEvent - Domain Event
 * Published when diagnostic report results are updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticReportUpdatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class DiagnosticReportUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('DiagnosticReportUpdated', aggregateId || payload.reportId, 'DiagnosticReport', payload, eventVersion, correlationId, causationId, userId || payload.updatedBy, { source: 'domain', priority: 'normal', retryable: true });
        this.payload = payload;
        this.reportId = payload.reportId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.updatedFields = payload.updatedFields;
        this.previousValues = payload.previousValues;
        this.newValues = payload.newValues;
        this.updatedBy = payload.updatedBy;
        this.updatedAt = payload.updatedAt;
        this.updateReason = payload.updateReason;
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
exports.DiagnosticReportUpdatedEvent = DiagnosticReportUpdatedEvent;
//# sourceMappingURL=DiagnosticReportUpdatedEvent.js.map