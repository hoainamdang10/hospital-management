"use strict";
/**
 * PatientId Value Object
 * Vietnamese Healthcare Patient ID Format: PAT-YYYYMM-XXX
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientId = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
class PatientId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    validateFormat() {
        if (!PatientId.isValidPatientId(this.props.value)) {
            throw new Error('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)');
        }
    }
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Mã bệnh nhân không được để trống');
        }
        const normalizedValue = value.trim().toUpperCase();
        if (!this.isValidPatientId(normalizedValue)) {
            throw new Error('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)');
        }
        return new PatientId({ value: normalizedValue });
    }
    /**
     * Generate new PatientId using database sequence
     * Note: This method requires database access and should be called from repository layer
     * For testing or when DB is not available, use generateLocal() instead
     */
    static async generateFromDB(supabaseClient) {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const yearMonth = `${year}${month}`;
        try {
            // Call database RPC function to get next sequence
            const { data, error } = await supabaseClient.rpc('get_next_patient_sequence', {
                year_month: yearMonth
            });
            if (error) {
                throw new Error(`Failed to generate patient ID from database: ${error.message}`);
            }
            const sequence = data;
            const sequenceStr = sequence.toString().padStart(3, '0');
            const patientId = `PAT-${yearMonth}-${sequenceStr}`;
            return new PatientId({ value: patientId });
        }
        catch (error) {
            throw new Error(`Failed to generate patient ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate PatientId locally (for testing or fallback)
     * WARNING: This uses Math.random() and may cause collisions under high load
     * Use generateFromDB() in production
     */
    static generateLocal() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const sequence = Math.floor(Math.random() * 999) + 1;
        const sequenceStr = sequence.toString().padStart(3, '0');
        const patientId = `PAT-${year}${month}-${sequenceStr}`;
        return new PatientId({ value: patientId });
    }
    /**
     * @deprecated Use generateFromDB() instead for production
     * This method is kept for backward compatibility
     */
    static generate() {
        console.warn('PatientId.generate() is deprecated. Use generateFromDB() for production or generateLocal() for testing.');
        return PatientId.generateLocal();
    }
    /**
     * Create from string value (alias for create)
     */
    static fromString(value) {
        return PatientId.create(value);
    }
    get value() {
        return this.props.value;
    }
    getValue() {
        return this.props.value;
    }
    getYear() {
        const yearMonth = this.props.value.split('-')[1];
        return parseInt(yearMonth.substring(0, 4));
    }
    getMonth() {
        const yearMonth = this.props.value.split('-')[1];
        return parseInt(yearMonth.substring(4, 6));
    }
    getSequence() {
        const sequence = this.props.value.split('-')[2];
        return parseInt(sequence);
    }
    getRegistrationPeriod() {
        return `${this.getMonth()}/${this.getYear()}`;
    }
    static isValidPatientId(value) {
        // Format: PAT-YYYYMM-XXX
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        if (!patientIdRegex.test(value)) {
            return false;
        }
        // Validate year and month
        const yearMonth = value.split('-')[1];
        const year = parseInt(yearMonth.substring(0, 4));
        const month = parseInt(yearMonth.substring(4, 6));
        const currentYear = new Date().getFullYear();
        // Year should be reasonable (not too far in past or future)
        if (year < 2000 || year > currentYear + 1) {
            return false;
        }
        // Month should be valid
        if (month < 1 || month > 12) {
            return false;
        }
        return true;
    }
    equals(other) {
        return this.props.value === other.props.value;
    }
    toString() {
        return this.props.value;
    }
}
exports.PatientId = PatientId;
//# sourceMappingURL=PatientId.js.map