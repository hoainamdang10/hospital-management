"use strict";
/**
 * ClinicalNoteCosignedEvent - Domain Event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalNoteCosignedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class ClinicalNoteCosignedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('ClinicalNoteCosigned', aggregateId || payload.noteId, 'ClinicalNote', payload, eventVersion, correlationId, causationId, userId || payload.cosignedBy, { source: 'domain', priority: 'normal', retryable: true });
        this.payload = payload;
    }
    getEventData() {
        return this.payload;
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.payload.patientId;
    }
    get noteId() {
        return this.payload.noteId;
    }
    get medicalRecordId() {
        return this.payload.medicalRecordId;
    }
    get patientIdValue() {
        return this.payload.patientId;
    }
    get authorId() {
        return this.payload.authorId;
    }
    get cosignedBy() {
        return this.payload.cosignedBy;
    }
    get cosignedAtTime() {
        return this.payload.cosignedAt;
    }
    get cosignComment() {
        return this.payload.cosignComment;
    }
}
exports.ClinicalNoteCosignedEvent = ClinicalNoteCosignedEvent;
//# sourceMappingURL=ClinicalNoteCosignedEvent.js.map