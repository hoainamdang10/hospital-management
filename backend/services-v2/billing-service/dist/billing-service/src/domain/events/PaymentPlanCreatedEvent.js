"use strict";
/**
 * PaymentPlanCreatedEvent - Domain Event
 * Published when a new payment plan is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentPlanCreatedEvent = void 0;
const DomainEvent_1 = require("../../../../shared/domain/DomainEvent");
class PaymentPlanCreatedEvent extends DomainEvent_1.DomainEvent {
    constructor(payload) {
        super('billing.payment-plan.created', payload);
    }
}
exports.PaymentPlanCreatedEvent = PaymentPlanCreatedEvent;
//# sourceMappingURL=PaymentPlanCreatedEvent.js.map