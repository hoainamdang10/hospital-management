"use strict";
/**
 * CommunicationPreference Value Object
 * Represents patient communication preferences (FHIR R6: communication field)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR R6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationPreference = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
class CommunicationPreference extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Validate format (required by ValueObject base class)
     */
    validateFormat() {
        // Validate language
        if (!['vi', 'en'].includes(this.props.language)) {
            throw new Error('Ngôn ngữ không hợp lệ. Chỉ chấp nhận: vi, en');
        }
        // Validate contact method
        if (!['email', 'sms', 'phone'].includes(this.props.contactMethod)) {
            throw new Error('Phương thức liên hệ không hợp lệ. Chỉ chấp nhận: email, sms, phone');
        }
        // Validate timezone
        if (!this.props.timezone || this.props.timezone.trim() === '') {
            throw new Error('Múi giờ không được để trống');
        }
    }
    static create(props) {
        return new CommunicationPreference(props);
    }
    get language() {
        return this.props.language;
    }
    get preferred() {
        return this.props.preferred;
    }
    get contactMethod() {
        return this.props.contactMethod;
    }
    get timezone() {
        return this.props.timezone;
    }
    /**
     * Convert to plain object for persistence
     */
    toDTO() {
        return {
            language: this.props.language,
            preferred: this.props.preferred,
            contactMethod: this.props.contactMethod,
            timezone: this.props.timezone
        };
    }
}
exports.CommunicationPreference = CommunicationPreference;
//# sourceMappingURL=CommunicationPreference.js.map