"use strict";
/**
 * PaymentPlanCompletedEvent - Domain Event
 * Published when a payment plan is completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentPlanCompletedEvent = void 0;
const DomainEvent_1 = require("../../../../shared/domain/DomainEvent");
class PaymentPlanCompletedEvent extends DomainEvent_1.DomainEvent {
    constructor(payload) {
        super('billing.payment-plan.completed', payload);
    }
}
exports.PaymentPlanCompletedEvent = PaymentPlanCompletedEvent;
//# sourceMappingURL=PaymentPlanCompletedEvent.js.map