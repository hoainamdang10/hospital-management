"use strict";
/**
 * Medication Value Object - Clinical EMR Service
 * V2 Clean Architecture + DDD Implementation
 * Represents medication prescription with FHIR compliance and Vietnamese pharmaceutical standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR, Vietnamese Pharmaceutical Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Medication = exports.FrequencyUnit = exports.RouteOfAdministration = exports.DosageForm = exports.MedicationStatus = void 0;
const value_object_1 = require("../../../shared/domain/base/value-object");
/**
 * Medication Status (FHIR Compliant)
 */
var MedicationStatus;
(function (MedicationStatus) {
    MedicationStatus["ACTIVE"] = "active";
    MedicationStatus["INACTIVE"] = "inactive";
    MedicationStatus["ENTERED_IN_ERROR"] = "entered-in-error";
    MedicationStatus["STOPPED"] = "stopped";
    MedicationStatus["ON_HOLD"] = "on-hold";
    MedicationStatus["COMPLETED"] = "completed";
    MedicationStatus["CANCELLED"] = "cancelled"; // Hủy bỏ
})(MedicationStatus || (exports.MedicationStatus = MedicationStatus = {}));
/**
 * Dosage Form (Vietnamese Pharmaceutical Standards)
 */
var DosageForm;
(function (DosageForm) {
    DosageForm["TABLET"] = "tablet";
    DosageForm["CAPSULE"] = "capsule";
    DosageForm["SYRUP"] = "syrup";
    DosageForm["INJECTION"] = "injection";
    DosageForm["CREAM"] = "cream";
    DosageForm["OINTMENT"] = "ointment";
    DosageForm["DROPS"] = "drops";
    DosageForm["SPRAY"] = "spray";
    DosageForm["POWDER"] = "powder";
    DosageForm["SOLUTION"] = "solution"; // Dung dịch
})(DosageForm || (exports.DosageForm = DosageForm = {}));
/**
 * Route of Administration (FHIR Compliant)
 */
var RouteOfAdministration;
(function (RouteOfAdministration) {
    RouteOfAdministration["ORAL"] = "oral";
    RouteOfAdministration["TOPICAL"] = "topical";
    RouteOfAdministration["INTRAVENOUS"] = "intravenous";
    RouteOfAdministration["INTRAMUSCULAR"] = "intramuscular";
    RouteOfAdministration["SUBCUTANEOUS"] = "subcutaneous";
    RouteOfAdministration["INHALATION"] = "inhalation";
    RouteOfAdministration["NASAL"] = "nasal";
    RouteOfAdministration["OPHTHALMIC"] = "ophthalmic";
    RouteOfAdministration["OTIC"] = "otic";
    RouteOfAdministration["RECTAL"] = "rectal";
    RouteOfAdministration["VAGINAL"] = "vaginal"; // Đặt âm đạo
})(RouteOfAdministration || (exports.RouteOfAdministration = RouteOfAdministration = {}));
/**
 * Frequency Unit
 */
var FrequencyUnit;
(function (FrequencyUnit) {
    FrequencyUnit["TIMES_PER_DAY"] = "times-per-day";
    FrequencyUnit["TIMES_PER_WEEK"] = "times-per-week";
    FrequencyUnit["TIMES_PER_MONTH"] = "times-per-month";
    FrequencyUnit["AS_NEEDED"] = "as-needed";
    FrequencyUnit["ONCE_DAILY"] = "once-daily";
    FrequencyUnit["TWICE_DAILY"] = "twice-daily";
    FrequencyUnit["THREE_TIMES_DAILY"] = "three-times-daily";
    FrequencyUnit["FOUR_TIMES_DAILY"] = "four-times-daily"; // Bốn lần/ngày
})(FrequencyUnit || (exports.FrequencyUnit = FrequencyUnit = {}));
/**
 * Medication Value Object
 * Represents a medication prescription with full FHIR compliance and Vietnamese standards
 */
class Medication extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
        this.validate();
    }
    /**
     * Create new medication
     */
    static create(code, name, strength, dosageForm, route, dosage, frequency, frequencyUnit, instructions, prescribedBy, options = {}) {
        const props = {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            genericName: options.genericName?.trim(),
            brandName: options.brandName?.trim(),
            strength: strength.trim(),
            dosageForm,
            route,
            dosage: dosage.trim(),
            frequency: frequency.trim(),
            frequencyUnit,
            duration: options.duration?.trim(),
            instructions: instructions.trim(),
            specialInstructions: options.specialInstructions?.trim(),
            status: options.status || MedicationStatus.ACTIVE,
            prescribedDate: options.prescribedDate || new Date(),
            startDate: options.startDate,
            endDate: options.endDate,
            prescribedBy: prescribedBy.trim(),
            pharmacistNotes: options.pharmacistNotes?.trim(),
            vietnameseDrugCode: options.vietnameseDrugCode?.trim().toUpperCase(),
            registrationNumber: options.registrationNumber?.trim(),
            manufacturer: options.manufacturer?.trim(),
            fhirCodeSystem: options.fhirCodeSystem?.trim(),
            fhirVersion: options.fhirVersion?.trim() || '4.0.1',
            contraindications: options.contraindications?.map(c => c.trim()),
            sideEffects: options.sideEffects?.map(s => s.trim()),
            interactions: options.interactions?.map(i => i.trim()),
            allergies: options.allergies?.map(a => a.trim()),
            notes: options.notes?.trim(),
            priority: options.priority || 'routine'
        };
        return new Medication(props);
    }
    /**
     * Create Vietnamese medication
     */
    static createVietnamese(vietnameseDrugCode, name, strength, dosageForm, route, dosage, frequency, frequencyUnit, instructions, prescribedBy, registrationNumber, options = {}) {
        return this.create(vietnameseDrugCode, name, strength, dosageForm, route, dosage, frequency, frequencyUnit, instructions, prescribedBy, {
            ...options,
            vietnameseDrugCode,
            registrationNumber,
            fhirCodeSystem: 'http://moh.gov.vn/fhir/CodeSystem/medication'
        });
    }
    /**
     * Validate medication properties
     */
    validate() {
        const { code, name, strength, dosage, frequency, instructions, prescribedBy, prescribedDate } = this.props;
        // Required fields validation
        if (!code || code.trim() === '') {
            throw new Error('Mã thuốc là bắt buộc');
        }
        if (!name || name.trim() === '') {
            throw new Error('Tên thuốc là bắt buộc');
        }
        if (!strength || strength.trim() === '') {
            throw new Error('Hàm lượng thuốc là bắt buộc');
        }
        if (!dosage || dosage.trim() === '') {
            throw new Error('Liều dùng là bắt buộc');
        }
        if (!frequency || frequency.trim() === '') {
            throw new Error('Tần suất dùng là bắt buộc');
        }
        if (!instructions || instructions.trim() === '') {
            throw new Error('Hướng dẫn sử dụng là bắt buộc');
        }
        if (!prescribedBy || prescribedBy.trim() === '') {
            throw new Error('Người kê đơn là bắt buộc');
        }
        // Enum validation
        if (!Object.values(DosageForm).includes(this.props.dosageForm)) {
            throw new Error('Dạng bào chế không hợp lệ');
        }
        if (!Object.values(RouteOfAdministration).includes(this.props.route)) {
            throw new Error('Đường dùng thuốc không hợp lệ');
        }
        if (!Object.values(FrequencyUnit).includes(this.props.frequencyUnit)) {
            throw new Error('Đơn vị tần suất không hợp lệ');
        }
        if (!Object.values(MedicationStatus).includes(this.props.status)) {
            throw new Error('Trạng thái thuốc không hợp lệ');
        }
        // Date validation
        if (!prescribedDate) {
            throw new Error('Ngày kê đơn là bắt buộc');
        }
        const now = new Date();
        if (prescribedDate > now) {
            throw new Error('Ngày kê đơn không thể trong tương lai');
        }
        if (this.props.startDate && this.props.endDate) {
            if (this.props.startDate >= this.props.endDate) {
                throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
            }
        }
        // Length validation
        if (code.length < 2 || code.length > 50) {
            throw new Error('Mã thuốc phải có độ dài từ 2-50 ký tự');
        }
        if (name.length < 2 || name.length > 200) {
            throw new Error('Tên thuốc phải có độ dài từ 2-200 ký tự');
        }
        if (instructions.length < 5 || instructions.length > 1000) {
            throw new Error('Hướng dẫn sử dụng phải có độ dài từ 5-1000 ký tự');
        }
        // Vietnamese drug code validation
        if (this.props.vietnameseDrugCode) {
            this.validateVietnameseDrugCode(this.props.vietnameseDrugCode);
        }
        // Registration number validation
        if (this.props.registrationNumber) {
            this.validateRegistrationNumber(this.props.registrationNumber);
        }
        // Strength format validation
        this.validateStrengthFormat(strength);
        // Dosage format validation
        this.validateDosageFormat(dosage);
    }
    /**
     * Validate Vietnamese drug code format
     */
    validateVietnameseDrugCode(code) {
        // Vietnamese drug code format: VN-XXXXX-XX
        const vietnameseCodeRegex = /^VN-[A-Z0-9]{5}-[A-Z0-9]{2}$/;
        if (!vietnameseCodeRegex.test(code)) {
            throw new Error('Mã thuốc Việt Nam phải có định dạng VN-XXXXX-XX');
        }
    }
    /**
     * Validate registration number format
     */
    validateRegistrationNumber(regNumber) {
        // Vietnamese registration number format: VD-XXXXX-XX
        const regNumberRegex = /^VD-[0-9]{5}-[0-9]{2}$/;
        if (!regNumberRegex.test(regNumber)) {
            throw new Error('Số đăng ký lưu hành phải có định dạng VD-XXXXX-XX');
        }
    }
    /**
     * Validate strength format
     */
    validateStrengthFormat(strength) {
        // Strength format: number + unit (e.g., "500mg", "5ml", "10%")
        const strengthRegex = /^[0-9]+(\.[0-9]+)?(mg|g|ml|l|%|IU|mcg|units?)$/i;
        if (!strengthRegex.test(strength)) {
            throw new Error('Hàm lượng phải có định dạng số + đơn vị (ví dụ: 500mg, 5ml, 10%)');
        }
    }
    /**
     * Validate dosage format
     */
    validateDosageFormat(dosage) {
        // Dosage format: number + unit (e.g., "1 viên", "5ml", "2 gói")
        const dosageRegex = /^[0-9]+(\.[0-9]+)?\s*(viên|ml|gói|thìa|giọt|lần xịt|ống|vỉ)$/i;
        if (!dosageRegex.test(dosage)) {
            throw new Error('Liều dùng phải có định dạng số + đơn vị (ví dụ: 1 viên, 5ml, 2 gói)');
        }
    }
    // Getters
    get code() {
        return this.props.code;
    }
    get name() {
        return this.props.name;
    }
    get genericName() {
        return this.props.genericName;
    }
    get brandName() {
        return this.props.brandName;
    }
    get strength() {
        return this.props.strength;
    }
    get dosageForm() {
        return this.props.dosageForm;
    }
    get route() {
        return this.props.route;
    }
    get dosage() {
        return this.props.dosage;
    }
    get frequency() {
        return this.props.frequency;
    }
    get frequencyUnit() {
        return this.props.frequencyUnit;
    }
    get duration() {
        return this.props.duration;
    }
    get instructions() {
        return this.props.instructions;
    }
    get status() {
        return this.props.status;
    }
    get prescribedDate() {
        return this.props.prescribedDate;
    }
    get prescribedBy() {
        return this.props.prescribedBy;
    }
    get vietnameseDrugCode() {
        return this.props.vietnameseDrugCode;
    }
    get registrationNumber() {
        return this.props.registrationNumber;
    }
    get contraindications() {
        return this.props.contraindications;
    }
    get sideEffects() {
        return this.props.sideEffects;
    }
    get interactions() {
        return this.props.interactions;
    }
    // Business logic methods
    isActive() {
        return this.props.status === MedicationStatus.ACTIVE;
    }
    isCompleted() {
        return this.props.status === MedicationStatus.COMPLETED;
    }
    isOralMedication() {
        return this.props.route === RouteOfAdministration.ORAL;
    }
    isInjection() {
        return [
            RouteOfAdministration.INTRAVENOUS,
            RouteOfAdministration.INTRAMUSCULAR,
            RouteOfAdministration.SUBCUTANEOUS
        ].includes(this.props.route);
    }
    hasContraindications() {
        return !!this.props.contraindications && this.props.contraindications.length > 0;
    }
    hasSideEffects() {
        return !!this.props.sideEffects && this.props.sideEffects.length > 0;
    }
    hasInteractions() {
        return !!this.props.interactions && this.props.interactions.length > 0;
    }
    isHighPriority() {
        return this.props.priority === 'urgent' || this.props.priority === 'stat';
    }
    isExpired() {
        if (!this.props.endDate)
            return false;
        return new Date() > this.props.endDate;
    }
    getDurationInDays() {
        if (!this.props.startDate || !this.props.endDate)
            return null;
        const diffTime = this.props.endDate.getTime() - this.props.startDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    /**
     * Get Vietnamese summary
     */
    getVietnameseSummary() {
        const parts = [];
        parts.push(`${this.props.name} ${this.props.strength}`);
        const dosageFormMap = {
            [DosageForm.TABLET]: 'viên nén',
            [DosageForm.CAPSULE]: 'viên nang',
            [DosageForm.SYRUP]: 'siro',
            [DosageForm.INJECTION]: 'tiêm',
            [DosageForm.CREAM]: 'kem',
            [DosageForm.OINTMENT]: 'thuốc mỡ',
            [DosageForm.DROPS]: 'thuốc nhỏ',
            [DosageForm.SPRAY]: 'xịt',
            [DosageForm.POWDER]: 'bột',
            [DosageForm.SOLUTION]: 'dung dịch'
        };
        parts.push(`(${dosageFormMap[this.props.dosageForm]})`);
        parts.push(`${this.props.dosage}, ${this.props.frequency}`);
        if (this.props.duration) {
            parts.push(`trong ${this.props.duration}`);
        }
        return parts.join(' ');
    }
    /**
     * Convert to FHIR format
     */
    toFHIR() {
        return {
            resourceType: 'MedicationRequest',
            medicationCodeableConcept: {
                coding: [{
                        system: this.props.fhirCodeSystem || 'http://moh.gov.vn/fhir/CodeSystem/medication',
                        code: this.props.code,
                        display: this.props.name
                    }],
                text: this.props.name
            },
            status: this.props.status,
            intent: 'order',
            authoredOn: this.props.prescribedDate.toISOString(),
            dosageInstruction: [{
                    text: this.props.instructions,
                    route: {
                        coding: [{
                                system: 'http://snomed.info/sct',
                                code: this.getRouteSnomedCode(),
                                display: this.props.route
                            }]
                    },
                    doseAndRate: [{
                            doseQuantity: {
                                value: this.extractDoseValue(),
                                unit: this.extractDoseUnit()
                            }
                        }],
                    timing: {
                        repeat: {
                            frequency: this.extractFrequencyValue(),
                            period: 1,
                            periodUnit: this.getTimingUnit()
                        }
                    }
                }],
            note: this.props.notes ? [{
                    text: this.props.notes
                }] : undefined
        };
    }
    /**
     * Get SNOMED code for route
     */
    getRouteSnomedCode() {
        const routeMap = {
            [RouteOfAdministration.ORAL]: '26643006',
            [RouteOfAdministration.TOPICAL]: '6064005',
            [RouteOfAdministration.INTRAVENOUS]: '47625008',
            [RouteOfAdministration.INTRAMUSCULAR]: '78421000',
            [RouteOfAdministration.SUBCUTANEOUS]: '34206005'
        };
        return routeMap[this.props.route] || '26643006';
    }
    /**
     * Extract dose value from dosage string
     */
    extractDoseValue() {
        const match = this.props.dosage.match(/^([0-9]+(?:\.[0-9]+)?)/);
        return match ? parseFloat(match[1]) : 1;
    }
    /**
     * Extract dose unit from dosage string
     */
    extractDoseUnit() {
        const match = this.props.dosage.match(/[0-9]+(?:\.[0-9]+)?\s*(.+)$/);
        return match ? match[1] : 'viên';
    }
    /**
     * Extract frequency value
     */
    extractFrequencyValue() {
        const match = this.props.frequency.match(/^([0-9]+)/);
        return match ? parseInt(match[1]) : 1;
    }
    /**
     * Get timing unit for FHIR
     */
    getTimingUnit() {
        if (this.props.frequency.includes('ngày'))
            return 'd';
        if (this.props.frequency.includes('tuần'))
            return 'wk';
        if (this.props.frequency.includes('tháng'))
            return 'mo';
        return 'd';
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            ...this.props,
            prescribedDate: this.props.prescribedDate.toISOString(),
            startDate: this.props.startDate?.toISOString(),
            endDate: this.props.endDate?.toISOString()
        };
    }
}
exports.Medication = Medication;
//# sourceMappingURL=Medication.js.map