"use strict";
/**
 * MedicalImagingCreatedEvent - Domain Event
 * Published when a new medical imaging study is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalImagingCreatedEvent = void 0;
const DomainEvent_1 = require("@shared/domain/DomainEvent");
class MedicalImagingCreatedEvent extends DomainEvent_1.DomainEvent {
    constructor(payload) {
        super('clinical.medical-imaging.created', payload);
    }
}
exports.MedicalImagingCreatedEvent = MedicalImagingCreatedEvent;
//# sourceMappingURL=MedicalImagingCreatedEvent.js.map