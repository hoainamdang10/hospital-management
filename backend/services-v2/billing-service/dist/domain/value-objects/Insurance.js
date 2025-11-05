"use strict";
/**
 * Insurance Value Object - Domain Layer
 * Represents Vietnamese insurance information (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Insurance Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Insurance = exports.BHTNAccidentType = exports.BHYTBeneficiaryType = exports.InsuranceType = void 0;
const ValueObject_1 = require("../../../../shared/domain/ValueObject");
const Money_1 = require("./Money");
var InsuranceType;
(function (InsuranceType) {
    InsuranceType["BHYT"] = "BHYT";
    InsuranceType["BHTN"] = "BHTN";
    InsuranceType["PRIVATE"] = "Private";
    InsuranceType["SELF_PAY"] = "Self-pay";
})(InsuranceType || (exports.InsuranceType = InsuranceType = {}));
var BHYTBeneficiaryType;
(function (BHYTBeneficiaryType) {
    BHYTBeneficiaryType["EMPLOYEE"] = "Ng\u01B0\u1EDDi lao \u0111\u1ED9ng";
    BHYTBeneficiaryType["RETIREE"] = "Ng\u01B0\u1EDDi v\u1EC1 h\u01B0u";
    BHYTBeneficiaryType["STUDENT"] = "H\u1ECDc sinh, sinh vi\u00EAn";
    BHYTBeneficiaryType["CHILD"] = "Tr\u1EBB em d\u01B0\u1EDBi 6 tu\u1ED5i";
    BHYTBeneficiaryType["ELDERLY"] = "Ng\u01B0\u1EDDi cao tu\u1ED5i";
    BHYTBeneficiaryType["POOR"] = "H\u1ED9 ngh\u00E8o";
    BHYTBeneficiaryType["ETHNIC_MINORITY"] = "D\u00E2n t\u1ED9c thi\u1EC3u s\u1ED1";
    BHYTBeneficiaryType["DISABLED"] = "Ng\u01B0\u1EDDi khuy\u1EBFt t\u1EADt";
    BHYTBeneficiaryType["OTHER"] = "Kh\u00E1c";
})(BHYTBeneficiaryType || (exports.BHYTBeneficiaryType = BHYTBeneficiaryType = {}));
var BHTNAccidentType;
(function (BHTNAccidentType) {
    BHTNAccidentType["WORK_ACCIDENT"] = "Tai n\u1EA1n lao \u0111\u1ED9ng";
    BHTNAccidentType["TRAFFIC_ACCIDENT"] = "Tai n\u1EA1n giao th\u00F4ng";
    BHTNAccidentType["OCCUPATIONAL_DISEASE"] = "B\u1EC7nh ngh\u1EC1 nghi\u1EC7p";
    BHTNAccidentType["OTHER_ACCIDENT"] = "Tai n\u1EA1n kh\u00E1c";
})(BHTNAccidentType || (exports.BHTNAccidentType = BHTNAccidentType = {}));
/**
 * Insurance Value Object
 * Handles Vietnamese insurance types with proper validation
 */
class Insurance extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create BHYT insurance
     */
    static createBHYT(number, validUntil, coverageLevel, beneficiaryType, issuedBy) {
        if (!this.isValidBHYTNumber(number)) {
            throw new Error("Số thẻ BHYT không đúng định dạng. Định dạng hợp lệ: HS + 13 chữ số");
        }
        if (coverageLevel < 0 || coverageLevel > 100) {
            throw new Error("Mức bảo hiểm phải từ 0% đến 100%");
        }
        return new Insurance({
            type: InsuranceType.BHYT,
            number: number.toUpperCase(),
            validUntil,
            coverageLevel,
            issuedBy,
            beneficiaryType,
        });
    }
    /**
     * Create BHTN insurance
     */
    static createBHTN(number, validUntil, accidentType, accidentDate, employerInfo) {
        if (!this.isValidBHTNNumber(number)) {
            throw new Error("Số bảo hiểm BHTN không đúng định dạng. Định dạng hợp lệ: TN + năm + 9 chữ số");
        }
        if (accidentDate > new Date()) {
            throw new Error("Ngày tai nạn không được trong tương lai");
        }
        return new Insurance({
            type: InsuranceType.BHTN,
            number: number.toUpperCase(),
            validUntil,
            coverageLevel: 100, // BHTN usually covers 100%
            accidentType,
            accidentDate,
            employerInfo,
        });
    }
    /**
     * Create private insurance
     */
    static createPrivate(number, validUntil, coverageLevel, insuranceCompany, policyType) {
        if (coverageLevel < 0 || coverageLevel > 100) {
            throw new Error("Mức bảo hiểm phải từ 0% đến 100%");
        }
        return new Insurance({
            type: InsuranceType.PRIVATE,
            number,
            validUntil,
            coverageLevel,
            insuranceCompany,
            policyType,
        });
    }
    /**
     * Create self-pay (no insurance)
     */
    static createSelfPay() {
        return new Insurance({
            type: InsuranceType.SELF_PAY,
            number: "SELF-PAY",
            validUntil: new Date(2099, 11, 31), // Far future date
            coverageLevel: 0,
        });
    }
    /**
     * Get insurance type
     */
    get type() {
        return this.props.type;
    }
    /**
     * Get insurance number
     */
    get number() {
        return this.props.number;
    }
    /**
     * Get valid until date
     */
    get validUntil() {
        return this.props.validUntil;
    }
    /**
     * Get coverage level (percentage)
     */
    get coverageLevel() {
        return this.props.coverageLevel;
    }
    /**
     * Get issued by
     */
    get issuedBy() {
        return this.props.issuedBy;
    }
    /**
     * Get beneficiary type (for BHYT)
     */
    get beneficiaryType() {
        return this.props.beneficiaryType;
    }
    /**
     * Get accident type (for BHTN)
     */
    get accidentType() {
        return this.props.accidentType;
    }
    /**
     * Get accident date (for BHTN)
     */
    get accidentDate() {
        return this.props.accidentDate;
    }
    /**
     * Check if insurance is valid (not expired)
     */
    isValid() {
        return new Date() <= this.props.validUntil;
    }
    /**
     * Check if insurance is expired
     */
    isExpired() {
        return !this.isValid();
    }
    /**
     * Get days until expiry
     */
    getDaysUntilExpiry() {
        const now = new Date();
        const diffTime = this.props.validUntil.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    /**
     * Check if expiring soon (within 30 days)
     */
    isExpiringSoon() {
        return this.getDaysUntilExpiry() <= 30 && this.getDaysUntilExpiry() > 0;
    }
    /**
     * Check if BHYT
     */
    isBHYT() {
        return this.props.type === InsuranceType.BHYT;
    }
    /**
     * Check if BHTN
     */
    isBHTN() {
        return this.props.type === InsuranceType.BHTN;
    }
    /**
     * Check if private insurance
     */
    isPrivate() {
        return this.props.type === InsuranceType.PRIVATE;
    }
    /**
     * Check if self-pay
     */
    isSelfPay() {
        return this.props.type === InsuranceType.SELF_PAY;
    }
    /**
     * Calculate coverage amount
     */
    calculateCoverage(totalAmount) {
        if (this.isSelfPay() || !this.isValid()) {
            return Money_1.Money.zero(totalAmount.currency);
        }
        return totalAmount.percentage(this.props.coverageLevel);
    }
    /**
     * Calculate patient payment (co-payment)
     */
    calculatePatientPayment(totalAmount) {
        const coverage = this.calculateCoverage(totalAmount);
        return totalAmount.subtract(coverage);
    }
    /**
     * Get Vietnamese insurance type display
     */
    getVietnameseTypeDisplay() {
        switch (this.props.type) {
            case InsuranceType.BHYT:
                return "Bảo hiểm Y tế";
            case InsuranceType.BHTN:
                return "Bảo hiểm Tai nạn";
            case InsuranceType.PRIVATE:
                return "Bảo hiểm tư nhân";
            case InsuranceType.SELF_PAY:
                return "Tự chi trả";
            default:
                return "Không xác định";
        }
    }
    /**
     * Get coverage level display
     */
    getCoverageLevelDisplay() {
        if (this.isSelfPay()) {
            return "Không có bảo hiểm";
        }
        return `${this.props.coverageLevel}%`;
    }
    /**
     * Get validity status display
     */
    getValidityStatusDisplay() {
        if (this.isSelfPay()) {
            return "Không áp dụng";
        }
        if (this.isExpired()) {
            return "Đã hết hạn";
        }
        if (this.isExpiringSoon()) {
            return `Sắp hết hạn (${this.getDaysUntilExpiry()} ngày)`;
        }
        return "Còn hiệu lực";
    }
    /**
     * Get BHYT region code
     */
    getBHYTRegionCode() {
        if (!this.isBHYT())
            return null;
        // BHYT number format: HS + 2 digit region + 11 digits
        return this.props.number.substring(2, 4);
    }
    /**
     * Get BHYT region name
     */
    getBHYTRegionName() {
        const regionCode = this.getBHYTRegionCode();
        if (!regionCode)
            return null;
        // Simplified mapping - in real app would have complete mapping
        const regionMap = {
            "01": "Hà Nội",
            "02": "Hồ Chí Minh",
            "03": "Hải Phòng",
            "04": "Đà Nẵng",
            "40": "Toàn quốc",
        };
        return regionMap[regionCode] || `Vùng ${regionCode}`;
    }
    /**
     * Check if requires additional documentation
     */
    requiresAdditionalDocumentation() {
        if (this.isBHTN()) {
            return (this.props.accidentType === BHTNAccidentType.TRAFFIC_ACCIDENT ||
                this.props.accidentType === BHTNAccidentType.WORK_ACCIDENT);
        }
        return false;
    }
    /**
     * Get required documents
     */
    getRequiredDocuments() {
        const documents = [];
        if (this.isBHYT()) {
            documents.push("Thẻ BHYT");
            documents.push("CMND/CCCD");
        }
        if (this.isBHTN()) {
            documents.push("Giấy chứng nhận BHTN");
            if (this.props.accidentType === BHTNAccidentType.TRAFFIC_ACCIDENT) {
                documents.push("Biên bản tai nạn giao thông");
                documents.push("Giấy chứng nhận của CSGT");
            }
            if (this.props.accidentType === BHTNAccidentType.WORK_ACCIDENT) {
                documents.push("Biên bản tai nạn lao động");
                documents.push("Xác nhận của công ty");
            }
        }
        if (this.isPrivate()) {
            documents.push("Hợp đồng bảo hiểm");
            documents.push("Thẻ bảo hiểm");
        }
        return documents;
    }
    /**
     * Validate BHYT number format
     */
    static isValidBHYTNumber(number) {
        // Format: HS + 13 digits (e.g., HS4010123456789)
        const pattern = /^HS\d{13}$/;
        return pattern.test(number.toUpperCase());
    }
    /**
     * Validate BHTN number format
     */
    static isValidBHTNNumber(number) {
        // Format: TN + year + 9 digits (e.g., TN2024123456789)
        const pattern = /^TN\d{13}$/;
        return pattern.test(number.toUpperCase());
    }
    /**
     * Get insurance summary for billing
     */
    getBillingSummary(totalAmount) {
        return {
            insuranceType: this.getVietnameseTypeDisplay(),
            insuranceNumber: this.props.number,
            coverageLevel: this.getCoverageLevelDisplay(),
            coverageAmount: this.calculateCoverage(totalAmount),
            patientPayment: this.calculatePatientPayment(totalAmount),
            validityStatus: this.getValidityStatusDisplay(),
            requiresVerification: this.isExpired() || this.isExpiringSoon(),
        };
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            type: this.props.type,
            number: this.props.number,
            validUntil: this.props.validUntil.toISOString(),
            coverageLevel: this.props.coverageLevel,
            issuedBy: this.props.issuedBy,
            beneficiaryType: this.props.beneficiaryType,
            accidentType: this.props.accidentType,
            accidentDate: this.props.accidentDate?.toISOString(),
            employerInfo: this.props.employerInfo,
            insuranceCompany: this.props.insuranceCompany,
            policyType: this.props.policyType,
            vietnameseTypeDisplay: this.getVietnameseTypeDisplay(),
            coverageLevelDisplay: this.getCoverageLevelDisplay(),
            validityStatusDisplay: this.getValidityStatusDisplay(),
            isValid: this.isValid(),
            isExpired: this.isExpired(),
            isExpiringSoon: this.isExpiringSoon(),
            daysUntilExpiry: this.getDaysUntilExpiry(),
            bhytRegionCode: this.getBHYTRegionCode(),
            bhytRegionName: this.getBHYTRegionName(),
            requiresAdditionalDocumentation: this.requiresAdditionalDocumentation(),
            requiredDocuments: this.getRequiredDocuments(),
            additionalInfo: this.props.additionalInfo,
        };
    }
    /**
     * String representation
     */
    toString() {
        return `${this.getVietnameseTypeDisplay()} - ${this.props.number} (${this.getCoverageLevelDisplay()})`;
    }
}
exports.Insurance = Insurance;
//# sourceMappingURL=Insurance.js.map