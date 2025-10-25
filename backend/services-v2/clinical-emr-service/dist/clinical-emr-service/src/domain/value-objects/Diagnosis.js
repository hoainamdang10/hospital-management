"use strict";
/**
 * Diagnosis Value Object - Clinical EMR Service
 * V2 Clean Architecture + DDD Implementation
 * Represents medical diagnosis with FHIR compliance and Vietnamese medical standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR, Vietnamese Medical Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diagnosis = exports.DiagnosisCategory = exports.DiagnosisStatus = exports.DiagnosisSeverity = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
/**
 * Diagnosis Severity Levels (Vietnamese Medical Standards)
 */
var DiagnosisSeverity;
(function (DiagnosisSeverity) {
    DiagnosisSeverity["MILD"] = "mild";
    DiagnosisSeverity["MODERATE"] = "moderate";
    DiagnosisSeverity["SEVERE"] = "severe";
    DiagnosisSeverity["CRITICAL"] = "critical"; // Nguy kịch
})(DiagnosisSeverity || (exports.DiagnosisSeverity = DiagnosisSeverity = {}));
/**
 * Diagnosis Status (FHIR Compliant)
 */
var DiagnosisStatus;
(function (DiagnosisStatus) {
    DiagnosisStatus["PROVISIONAL"] = "provisional";
    DiagnosisStatus["DIFFERENTIAL"] = "differential";
    DiagnosisStatus["CONFIRMED"] = "confirmed";
    DiagnosisStatus["REFUTED"] = "refuted";
    DiagnosisStatus["ENTERED_IN_ERROR"] = "entered-in-error"; // Nhập nhầm
})(DiagnosisStatus || (exports.DiagnosisStatus = DiagnosisStatus = {}));
/**
 * Diagnosis Category (Vietnamese Medical Classification)
 */
var DiagnosisCategory;
(function (DiagnosisCategory) {
    DiagnosisCategory["PRIMARY"] = "primary";
    DiagnosisCategory["SECONDARY"] = "secondary";
    DiagnosisCategory["COMPLICATION"] = "complication";
    DiagnosisCategory["COMORBIDITY"] = "comorbidity"; // Bệnh đi kèm
})(DiagnosisCategory || (exports.DiagnosisCategory = DiagnosisCategory = {}));
/**
 * Diagnosis Value Object
 * Represents a medical diagnosis with full FHIR compliance and Vietnamese standards
 */
class Diagnosis extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    validateFormat() {
        this.validate();
    }
    /**
     * Create new diagnosis
     */
    static create(code, display, category, severity, status, recordedBy, options = {}) {
        const props = {
            code: code.trim().toUpperCase(),
            display: display.trim(),
            description: options.description?.trim(),
            category,
            severity,
            status,
            onsetDate: options.onsetDate,
            recordedDate: options.recordedDate || new Date(),
            recordedBy: recordedBy.trim(),
            vietnameseClassification: options.vietnameseClassification?.trim(),
            specialtyCode: options.specialtyCode?.trim().toUpperCase(),
            fhirCodeSystem: options.fhirCodeSystem?.trim(),
            fhirVersion: options.fhirVersion?.trim() || '4.0.1',
            notes: options.notes?.trim(),
            confidence: options.confidence
        };
        return new Diagnosis(props);
    }
    /**
     * Create from ICD-10 code
     */
    static fromICD10(icd10Code, display, category, severity, recordedBy, options = {}) {
        return this.create(icd10Code, display, category, severity, options.status || DiagnosisStatus.PROVISIONAL, recordedBy, {
            ...options,
            fhirCodeSystem: 'http://hl7.org/fhir/sid/icd-10',
            vietnameseClassification: 'ICD-10-VN'
        });
    }
    /**
     * Create Vietnamese medical diagnosis
     */
    static createVietnamese(vietnameseCode, display, category, severity, specialtyCode, recordedBy, options = {}) {
        return this.create(vietnameseCode, display, category, severity, options.status || DiagnosisStatus.PROVISIONAL, recordedBy, {
            ...options,
            specialtyCode,
            vietnameseClassification: 'BYT-VN-2024',
            fhirCodeSystem: 'http://moh.gov.vn/fhir/CodeSystem/diagnosis'
        });
    }
    /**
     * Validate diagnosis properties
     */
    validate() {
        const { code, display, category, severity, status, recordedBy, recordedDate, confidence } = this.props;
        // Required fields validation
        if (!code || code.trim() === '') {
            throw new Error('Mã chẩn đoán là bắt buộc');
        }
        if (!display || display.trim() === '') {
            throw new Error('Tên chẩn đoán là bắt buộc');
        }
        if (!recordedBy || recordedBy.trim() === '') {
            throw new Error('Người ghi nhận chẩn đoán là bắt buộc');
        }
        // Enum validation
        if (!Object.values(DiagnosisCategory).includes(category)) {
            throw new Error('Loại chẩn đoán không hợp lệ');
        }
        if (!Object.values(DiagnosisSeverity).includes(severity)) {
            throw new Error('Mức độ nghiêm trọng không hợp lệ');
        }
        if (!Object.values(DiagnosisStatus).includes(status)) {
            throw new Error('Trạng thái chẩn đoán không hợp lệ');
        }
        // Date validation
        if (!recordedDate) {
            throw new Error('Ngày ghi nhận là bắt buộc');
        }
        const now = new Date();
        if (recordedDate > now) {
            throw new Error('Ngày ghi nhận không thể trong tương lai');
        }
        if (this.props.onsetDate && this.props.onsetDate > now) {
            throw new Error('Ngày khởi phát không thể trong tương lai');
        }
        if (this.props.onsetDate && recordedDate < this.props.onsetDate) {
            throw new Error('Ngày ghi nhận không thể trước ngày khởi phát');
        }
        // Code format validation
        if (code.length < 2 || code.length > 20) {
            throw new Error('Mã chẩn đoán phải có độ dài từ 2-20 ký tự');
        }
        // Display name validation
        if (display.length < 3 || display.length > 500) {
            throw new Error('Tên chẩn đoán phải có độ dài từ 3-500 ký tự');
        }
        // Confidence validation
        if (confidence !== undefined && (confidence < 0 || confidence > 100)) {
            throw new Error('Độ tin cậy phải từ 0-100');
        }
        // Vietnamese medical code validation
        if (this.props.vietnameseClassification === 'BYT-VN-2024') {
            this.validateVietnameseMedicalCode(code);
        }
        // ICD-10 code validation
        if (this.props.fhirCodeSystem?.includes('icd-10')) {
            this.validateICD10Code(code);
        }
        // Specialty code validation
        if (this.props.specialtyCode) {
            this.validateSpecialtyCode(this.props.specialtyCode);
        }
    }
    /**
     * Validate Vietnamese medical code format
     */
    validateVietnameseMedicalCode(code) {
        // Vietnamese medical code format: DEPT-XXX-YYYY
        const vietnameseCodeRegex = /^[A-Z]{2,4}-[A-Z0-9]{3}-[A-Z0-9]{4}$/;
        if (!vietnameseCodeRegex.test(code)) {
            throw new Error('Mã chẩn đoán Việt Nam phải có định dạng DEPT-XXX-YYYY');
        }
    }
    /**
     * Validate ICD-10 code format
     */
    validateICD10Code(code) {
        // ICD-10 code format: A00-Z99.999
        const icd10Regex = /^[A-Z][0-9]{2}(\.[0-9]{1,3})?$/;
        if (!icd10Regex.test(code)) {
            throw new Error('Mã ICD-10 phải có định dạng A00-Z99 hoặc A00.0-Z99.999');
        }
    }
    /**
     * Validate specialty code
     */
    validateSpecialtyCode(specialtyCode) {
        const validSpecialties = [
            'CARD', 'NEUR', 'ORTH', 'PEDI', 'OBGY', 'SURG', 'INTE', 'DERM',
            'OPHT', 'ENT', 'PSYC', 'RADI', 'PATH', 'ANES', 'EMRG', 'FAMI'
        ];
        if (!validSpecialties.includes(specialtyCode)) {
            throw new Error(`Mã chuyên khoa không hợp lệ. Các mã hợp lệ: ${validSpecialties.join(', ')}`);
        }
    }
    // Getters
    get code() {
        return this.props.code;
    }
    get display() {
        return this.props.display;
    }
    get description() {
        return this.props.description;
    }
    get category() {
        return this.props.category;
    }
    get severity() {
        return this.props.severity;
    }
    get status() {
        return this.props.status;
    }
    get onsetDate() {
        return this.props.onsetDate;
    }
    get recordedDate() {
        return this.props.recordedDate;
    }
    get recordedBy() {
        return this.props.recordedBy;
    }
    get vietnameseClassification() {
        return this.props.vietnameseClassification;
    }
    get specialtyCode() {
        return this.props.specialtyCode;
    }
    get confidence() {
        return this.props.confidence;
    }
    get notes() {
        return this.props.notes;
    }
    // Business logic methods
    isPrimary() {
        return this.props.category === DiagnosisCategory.PRIMARY;
    }
    isConfirmed() {
        return this.props.status === DiagnosisStatus.CONFIRMED;
    }
    isCritical() {
        return this.props.severity === DiagnosisSeverity.CRITICAL;
    }
    isHighConfidence() {
        return this.props.confidence !== undefined && this.props.confidence >= 80;
    }
    isRecentlyRecorded(days = 7) {
        const daysDiff = (new Date().getTime() - this.props.recordedDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= days;
    }
    hasOnsetDate() {
        return this.props.onsetDate !== undefined;
    }
    getDurationSinceOnset() {
        if (!this.props.onsetDate)
            return null;
        return new Date().getTime() - this.props.onsetDate.getTime();
    }
    /**
     * Get Vietnamese summary
     */
    getVietnameseSummary() {
        const parts = [];
        parts.push(`${this.props.display} (${this.props.code})`);
        const severityMap = {
            [DiagnosisSeverity.MILD]: 'Nhẹ',
            [DiagnosisSeverity.MODERATE]: 'Trung bình',
            [DiagnosisSeverity.SEVERE]: 'Nặng',
            [DiagnosisSeverity.CRITICAL]: 'Nguy kịch'
        };
        const statusMap = {
            [DiagnosisStatus.PROVISIONAL]: 'Sơ bộ',
            [DiagnosisStatus.DIFFERENTIAL]: 'Phân biệt',
            [DiagnosisStatus.CONFIRMED]: 'Xác định',
            [DiagnosisStatus.REFUTED]: 'Bác bỏ',
            [DiagnosisStatus.ENTERED_IN_ERROR]: 'Nhập nhầm'
        };
        parts.push(`Mức độ: ${severityMap[this.props.severity]}`);
        parts.push(`Trạng thái: ${statusMap[this.props.status]}`);
        if (this.props.confidence) {
            parts.push(`Độ tin cậy: ${this.props.confidence}%`);
        }
        return parts.join(' | ');
    }
    /**
     * Convert to FHIR format
     */
    toFHIR() {
        return {
            resourceType: 'Condition',
            code: {
                coding: [{
                        system: this.props.fhirCodeSystem || 'http://hl7.org/fhir/sid/icd-10',
                        code: this.props.code,
                        display: this.props.display
                    }],
                text: this.props.display
            },
            category: [{
                    coding: [{
                            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                            code: this.props.category,
                            display: this.props.category
                        }]
                }],
            severity: {
                coding: [{
                        system: 'http://snomed.info/sct',
                        code: this.getSeveritySnomedCode(),
                        display: this.props.severity
                    }]
            },
            clinicalStatus: {
                coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                        code: this.props.status === DiagnosisStatus.CONFIRMED ? 'active' : 'provisional'
                    }]
            },
            onsetDateTime: this.props.onsetDate?.toISOString(),
            recordedDate: this.props.recordedDate.toISOString(),
            note: this.props.notes ? [{
                    text: this.props.notes
                }] : undefined
        };
    }
    /**
     * Get SNOMED code for severity
     */
    getSeveritySnomedCode() {
        const severityMap = {
            [DiagnosisSeverity.MILD]: '255604002',
            [DiagnosisSeverity.MODERATE]: '6736007',
            [DiagnosisSeverity.SEVERE]: '24484000',
            [DiagnosisSeverity.CRITICAL]: '442452003'
        };
        return severityMap[this.props.severity];
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            ...this.props,
            onsetDate: this.props.onsetDate?.toISOString(),
            recordedDate: this.props.recordedDate.toISOString()
        };
    }
}
exports.Diagnosis = Diagnosis;
//# sourceMappingURL=Diagnosis.js.map