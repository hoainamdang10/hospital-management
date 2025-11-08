"use strict";
/**
 * LabResultCreatedEvent - Domain Event
 * Emitted when a new lab result is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabResultCreatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class LabResultCreatedEvent extends domain_event_1.DomainEvent {
    constructor(payload) {
        super('clinical.lab-result.created', payload);
    }
}
exports.LabResultCreatedEvent = LabResultCreatedEvent;
//# sourceMappingURL=LabResultCreatedEvent.js.map