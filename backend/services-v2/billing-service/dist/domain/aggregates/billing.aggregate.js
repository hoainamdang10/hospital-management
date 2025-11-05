"use strict";
/**
 * Billing Aggregate - Domain Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingAggregate = void 0;
const aggregate_root_1 = require("../../../shared/domain/base/aggregate-root");
class BillingAggregate extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    static create( /* parameters */) {
        const props = {
            // Initialize properties
            id: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const aggregate = new BillingAggregate(props);
        // Add domain event
        // aggregate.addDomainEvent(new SomethingCreatedEvent(...));
        return aggregate;
    }
    validateBusinessInvariants() {
        // Implement business rule validations
    }
    applyEvent(event) {
        // Implement event application logic
    }
    getPatientId() {
        // Return patient ID if applicable
        return null;
    }
    toPersistence() {
        return {
            id: this.id,
            ...this.props
        };
    }
}
exports.BillingAggregate = BillingAggregate;
//# sourceMappingURL=billing.aggregate.js.map