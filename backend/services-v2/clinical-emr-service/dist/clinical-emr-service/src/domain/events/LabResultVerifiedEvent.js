"use strict";
/**
 * LabResultVerifiedEvent - Domain Event
 * Emitted when a lab result is verified by a doctor
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabResultVerifiedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class LabResultVerifiedEvent extends domain_event_1.DomainEvent {
    constructor(payload) {
        super('clinical.lab-result.verified', payload);
    }
}
exports.LabResultVerifiedEvent = LabResultVerifiedEvent;
//# sourceMappingURL=LabResultVerifiedEvent.js.map