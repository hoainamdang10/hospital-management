"use strict";
/**
 * LabResultId Value Object
 * Unique identifier for lab results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabResultId = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
const uuid_1 = require("uuid");
class LabResultId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(id) {
        return new LabResultId({
            value: id || `LAB-${(0, uuid_1.v4)()}`,
        });
    }
    static fromString(id) {
        if (!id || id.trim().length === 0) {
            throw new Error('LabResultId cannot be empty');
        }
        return new LabResultId({ value: id });
    }
    get value() {
        return this.props.value;
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.value === other.props.value;
    }
    toString() {
        return this.props.value;
    }
}
exports.LabResultId = LabResultId;
//# sourceMappingURL=LabResultId.js.map