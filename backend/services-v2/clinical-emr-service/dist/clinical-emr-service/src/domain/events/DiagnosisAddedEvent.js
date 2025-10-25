"use strict";
/**
 * DiagnosisAddedEvent - Domain Event
 * Published when a diagnosis is added to a medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosisAddedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class DiagnosisAddedEvent extends domain_event_1.DomainEvent {
    constructor(data) {
        super('DiagnosisAdded', data.recordId, 'MedicalRecord', {
            diagnosisCode: data.diagnosisCode,
            diagnosisDisplay: data.diagnosisDisplay,
            diagnosisCategory: data.diagnosisCategory,
            diagnosisSeverity: data.diagnosisSeverity,
            isCritical: data.isCritical,
            isPrimary: data.isPrimary
        }, 1, // eventVersion
        undefined, // correlationId
        undefined, // causationId
        data.addedBy // userId
        );
        this.recordId = data.recordId;
        this.patientId = data.patientId;
        this.doctorId = data.doctorId;
        this.diagnosisCode = data.diagnosisCode;
        this.diagnosisDisplay = data.diagnosisDisplay;
        this.diagnosisCategory = data.diagnosisCategory;
        this.diagnosisSeverity = data.diagnosisSeverity;
        this.diagnosisStatus = data.diagnosisStatus;
        this.isCritical = data.isCritical;
        this.isPrimary = data.isPrimary;
        this.addedBy = data.addedBy;
        this.addedAt = data.addedAt;
        this.specialtyCode = data.specialtyCode;
        this.vietnameseClassification = data.vietnameseClassification;
    }
    getEventData() {
        return {
            recordId: this.recordId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            diagnosisCode: this.diagnosisCode,
            diagnosisDisplay: this.diagnosisDisplay,
            diagnosisCategory: this.diagnosisCategory,
            diagnosisSeverity: this.diagnosisSeverity,
            diagnosisStatus: this.diagnosisStatus,
            isCritical: this.isCritical,
            isPrimary: this.isPrimary,
            addedBy: this.addedBy,
            addedAt: this.addedAt.toISOString(),
            specialtyCode: this.specialtyCode,
            vietnameseClassification: this.vietnameseClassification
        };
    }
    containsPHI() {
        return true; // Medical diagnosis is PHI
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.DiagnosisAddedEvent = DiagnosisAddedEvent;
//# sourceMappingURL=DiagnosisAddedEvent.js.map