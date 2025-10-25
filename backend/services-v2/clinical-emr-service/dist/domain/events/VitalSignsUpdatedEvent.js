"use strict";
/**
 * VitalSignsUpdatedEvent - Domain Event
 * Published when vital signs are updated in a medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitalSignsUpdatedEvent = void 0;
const domain_event_1 = require("../../../shared/domain/base/domain-event");
class VitalSignsUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(data) {
        super('VitalSignsUpdated', data.recordId);
        this.recordId = data.recordId;
        this.patientId = data.patientId;
        this.doctorId = data.doctorId;
        this.vitalSigns = data.vitalSigns;
        this.hasCompleteVitalSigns = data.hasCompleteVitalSigns;
        this.hasAbnormalVitals = data.hasAbnormalVitals;
        this.criticalVitals = data.criticalVitals;
        this.updatedBy = data.updatedBy;
        this.updatedAt = data.updatedAt;
    }
    toPrimitives() {
        return {
            recordId: this.recordId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            vitalSigns: this.vitalSigns,
            hasCompleteVitalSigns: this.hasCompleteVitalSigns,
            hasAbnormalVitals: this.hasAbnormalVitals,
            criticalVitals: this.criticalVitals,
            updatedBy: this.updatedBy,
            updatedAt: this.updatedAt
        };
    }
}
exports.VitalSignsUpdatedEvent = VitalSignsUpdatedEvent;
//# sourceMappingURL=VitalSignsUpdatedEvent.js.map