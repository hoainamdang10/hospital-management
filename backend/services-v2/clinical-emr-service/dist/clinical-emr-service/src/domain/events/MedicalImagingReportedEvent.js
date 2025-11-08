"use strict";
/**
 * MedicalImagingReportedEvent - Domain Event
 * Published when a medical imaging study is reported by radiologist
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalImagingReportedEvent = void 0;
const DomainEvent_1 = require("@shared/domain/DomainEvent");
class MedicalImagingReportedEvent extends DomainEvent_1.DomainEvent {
    constructor(payload) {
        super('clinical.medical-imaging.reported', payload);
    }
}
exports.MedicalImagingReportedEvent = MedicalImagingReportedEvent;
//# sourceMappingURL=MedicalImagingReportedEvent.js.map