"use strict";
/**
 * InstallmentPaidEvent - Domain Event
 * Published when an installment is paid
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentPaidEvent = void 0;
const DomainEvent_1 = require("../../../../shared/domain/DomainEvent");
class InstallmentPaidEvent extends DomainEvent_1.DomainEvent {
    constructor(payload) {
        super('billing.installment.paid', payload);
    }
}
exports.InstallmentPaidEvent = InstallmentPaidEvent;
//# sourceMappingURL=InstallmentPaidEvent.js.map