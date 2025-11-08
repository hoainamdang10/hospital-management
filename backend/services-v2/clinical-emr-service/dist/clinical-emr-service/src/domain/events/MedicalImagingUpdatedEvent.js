"use strict";
/**
 * MedicalImagingUpdatedEvent - Domain Event
 * Published when a medical imaging study is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalImagingUpdatedEvent = void 0;
const DomainEvent_1 = require("@shared/domain/DomainEvent");
class MedicalImagingUpdatedEvent extends DomainEvent_1.DomainEvent {
    constructor(payload) {
        super('clinical.medical-imaging.updated', payload);
    }
}
exports.MedicalImagingUpdatedEvent = MedicalImagingUpdatedEvent;
//# sourceMappingURL=MedicalImagingUpdatedEvent.js.map