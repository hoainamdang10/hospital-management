"use strict";
/**
 * MedicalRecordArchivedEvent - Domain Event
 * Published when a medical record is archived
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordArchivedEvent = void 0;
const domain_event_1 = require("../../../shared/domain/base/domain-event");
class MedicalRecordArchivedEvent extends domain_event_1.DomainEvent {
    constructor(data) {
        super('MedicalRecordArchived', data.recordId);
        this.recordId = data.recordId;
        this.patientId = data.patientId;
        this.doctorId = data.doctorId;
        this.appointmentId = data.appointmentId;
        this.previousStatus = data.previousStatus;
        this.archivedBy = data.archivedBy;
        this.archivedAt = data.archivedAt;
        this.archiveReason = data.archiveReason;
    }
    toPrimitives() {
        return {
            recordId: this.recordId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            appointmentId: this.appointmentId,
            previousStatus: this.previousStatus,
            archivedBy: this.archivedBy,
            archivedAt: this.archivedAt,
            archiveReason: this.archiveReason
        };
    }
}
exports.MedicalRecordArchivedEvent = MedicalRecordArchivedEvent;
//# sourceMappingURL=MedicalRecordArchivedEvent.js.map