"use strict";
/**
 * DiagnosticReportCreatedEvent - Domain Event
 * Published when a new diagnostic report is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticReportCreatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class DiagnosticReportCreatedEvent extends domain_event_1.DomainEvent {
    constructor(payload, eventVersion = 1, correlationId, causationId, userId) {
        super('DiagnosticReportCreated', payload.reportId, 'DiagnosticReport', payload, eventVersion, correlationId, causationId, userId || payload.createdBy, { source: 'domain', priority: 'normal', retryable: true });
        this.reportId = payload.reportId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.orderedBy = payload.orderedBy;
        this.reportType = payload.reportType;
        this.testName = payload.testName;
        this.createdBy = payload.createdBy;
        this.createdAt = payload.createdAt;
        this.payload = payload;
    }
    getEventData() {
        return this.payload;
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.DiagnosticReportCreatedEvent = DiagnosticReportCreatedEvent;
//# sourceMappingURL=DiagnosticReportCreatedEvent.js.map