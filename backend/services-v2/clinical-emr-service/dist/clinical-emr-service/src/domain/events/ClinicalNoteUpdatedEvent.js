"use strict";
/**
 * ClinicalNoteUpdatedEvent - Domain Event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalNoteUpdatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class ClinicalNoteUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('ClinicalNoteUpdated', aggregateId || payload.noteId, 'ClinicalNote', payload, eventVersion, correlationId, causationId, userId);
        this.payload = payload;
    }
    get noteId() {
        return this.payload.noteId;
    }
    get medicalRecordId() {
        return this.payload.medicalRecordId;
    }
    get patientId() {
        return this.payload.patientId;
    }
    get updatedFields() {
        return this.payload.updatedFields;
    }
    get previousValues() {
        return this.payload.previousValues;
    }
    get newValues() {
        return this.payload.newValues;
    }
    get updatedBy() {
        return this.payload.updatedBy;
    }
    get updatedAtTime() {
        return this.payload.updatedAt;
    }
    get updateReason() {
        return this.payload.updateReason;
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
exports.ClinicalNoteUpdatedEvent = ClinicalNoteUpdatedEvent;
//# sourceMappingURL=ClinicalNoteUpdatedEvent.js.map