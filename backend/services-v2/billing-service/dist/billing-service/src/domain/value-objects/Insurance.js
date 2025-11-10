"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Insurance = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
class Insurance extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(provider, policyNumber, coveragePercentage) {
        if (coveragePercentage < 0 || coveragePercentage > 100) {
            throw new Error('Coverage percentage must be between 0 and 100');
        }
        return new Insurance({ provider, policyNumber, coveragePercentage });
    }
    get provider() {
        return this.props.provider;
    }
    get policyNumber() {
        return this.props.policyNumber;
    }
    get coveragePercentage() {
        return this.props.coveragePercentage;
    }
    validateFormat() {
        if (!this.props.provider || this.props.provider.trim().length === 0) {
            throw new Error('Insurance provider cannot be empty');
        }
        if (!this.props.policyNumber || this.props.policyNumber.trim().length === 0) {
            throw new Error('Policy number cannot be empty');
        }
        if (this.props.coveragePercentage < 0 || this.props.coveragePercentage > 100) {
            throw new Error('Coverage percentage must be between 0 and 100');
        }
    }
}
exports.Insurance = Insurance;
//# sourceMappingURL=Insurance.js.map