"use strict";
/**
 * LabResultUpdatedEvent - Domain Event
 * Emitted when a lab result is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabResultUpdatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class LabResultUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(payload) {
        super('clinical.lab-result.updated', payload);
    }
}
exports.LabResultUpdatedEvent = LabResultUpdatedEvent;
//# sourceMappingURL=LabResultUpdatedEvent.js.map