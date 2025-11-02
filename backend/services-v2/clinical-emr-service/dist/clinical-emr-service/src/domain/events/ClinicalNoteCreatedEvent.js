"use strict";
/**
 * ClinicalNoteCreatedEvent - Domain Event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalNoteCreatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class ClinicalNoteCreatedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('ClinicalNoteCreated', aggregateId || payload.noteId, 'ClinicalNote', payload, eventVersion, correlationId, causationId, userId || payload.createdBy, { source: 'domain', priority: 'normal', retryable: true });
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
    get noteType() {
        return this.payload.noteType;
    }
    get noteTitle() {
        return this.payload.noteTitle;
    }
    get requiresCosign() {
        return this.payload.requiresCosign;
    }
    get createdBy() {
        return this.payload.createdBy;
    }
    get createdAtTime() {
        return this.payload.createdAt;
    }
}
exports.ClinicalNoteCreatedEvent = ClinicalNoteCreatedEvent;
//# sourceMappingURL=ClinicalNoteCreatedEvent.js.map