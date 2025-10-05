"use strict";
/**
 * InsuranceValidationService - Infrastructure Layer
 * Validates Vietnamese health insurance numbers (BHYT, BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceValidationService = void 0;
/**
 * Insurance Validation Service
 * Validates BHYT and BHTN numbers according to Vietnamese standards
 */
class InsuranceValidationService {
    constructor(logger) {
        this.logger = logger;
        // BHYT province codes (2 letters)
        this.BHYT_PROVINCE_CODES = [
            'HN', 'HP', 'HB', 'QB', 'BN', 'HD', 'HY', 'NĐ', 'TN', 'YB', 'TB', 'LS', 'SL', 'ĐB', 'LC',
            'LĐ', 'BK', 'BG', 'CB', 'TQ', 'LĐ', 'PT', 'VL', 'BĐ', 'NT', 'NB', 'HG', 'VT', 'VP', 'BT',
            'HM', 'TG', 'TV', 'VL', 'BL', 'CM', 'ĐN', 'QN', 'QT', 'QB', 'KH', 'PY', 'GL', 'ĐL', 'LA',
            'BP', 'TN', 'BT', 'ĐT', 'KG', 'AG', 'BL', 'TV', 'VL', 'CM', 'ST', 'HG', 'KT', 'VT', 'CT',
            'SG', 'BD', 'BT', 'ĐN', 'TG', 'VL', 'BL', 'CM'
        ];
        // BHYT priority levels (1 digit)
        this.BHYT_PRIORITY_LEVELS = ['1', '2', '3', '4', '5'];
        // BHYT group codes (2 digits)
        this.BHYT_GROUP_CODES = [
            '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
            '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'
        ];
    }
    /**
     * Validate BHYT number
     * Format: XX-Y-ZZ-YYYY-NNNNN-CCCCC
     * Example: HN-1-01-2024-12345-67890
     *
     * XX: Province code (2 letters)
     * Y: Priority level (1 digit)
     * ZZ: Group code (2 digits)
     * YYYY: Year (4 digits)
     * NNNNN: ID number (5 digits)
     * CCCCC: Check digit (5 digits)
     */
    validateBHYTNumber(bhytNumber) {
        const errors = [];
        const warnings = [];
        const metadata = {};
        try {
            // Remove spaces and convert to uppercase
            const normalized = bhytNumber.trim().toUpperCase();
            // Check format
            const bhytPattern = /^([A-Z]{2})-(\d)-(\d{2})-(\d{4})-(\d{5})-(\d{5})$/;
            const match = normalized.match(bhytPattern);
            if (!match) {
                errors.push('Số BHYT không đúng định dạng. Định dạng đúng: XX-Y-ZZ-YYYY-NNNNN-CCCCC');
                return { isValid: false, errors, warnings };
            }
            const [, provinceCode, priorityLevel, groupCode, year, idNumber, checkDigit] = match;
            // Validate province code
            if (!this.BHYT_PROVINCE_CODES.includes(provinceCode)) {
                errors.push(`Mã tỉnh/thành không hợp lệ: ${provinceCode}`);
            }
            metadata.provinceCode = provinceCode;
            // Validate priority level
            if (!this.BHYT_PRIORITY_LEVELS.includes(priorityLevel)) {
                errors.push(`Mức ưu tiên không hợp lệ: ${priorityLevel}`);
            }
            metadata.priorityLevel = priorityLevel;
            // Validate group code
            if (!this.BHYT_GROUP_CODES.includes(groupCode)) {
                warnings.push(`Mã nhóm không phổ biến: ${groupCode}`);
            }
            metadata.groupCode = groupCode;
            // Validate year
            const currentYear = new Date().getFullYear();
            const yearNum = parseInt(year, 10);
            if (yearNum < 2000 || yearNum > currentYear + 1) {
                errors.push(`Năm không hợp lệ: ${year}`);
            }
            metadata.year = year;
            // Validate ID number (5 digits)
            if (!/^\d{5}$/.test(idNumber)) {
                errors.push('Số ID phải là 5 chữ số');
            }
            // Validate check digit (5 digits)
            if (!/^\d{5}$/.test(checkDigit)) {
                errors.push('Số kiểm tra phải là 5 chữ số');
            }
            // Check expiration warning
            if (yearNum < currentYear) {
                warnings.push(`Thẻ BHYT có thể đã hết hạn (năm ${year})`);
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                metadata
            };
        }
        catch (error) {
            this.logger.error('Error validating BHYT number', {
                bhytNumber,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                isValid: false,
                errors: ['Lỗi khi kiểm tra số BHYT'],
                warnings
            };
        }
    }
    /**
     * Validate BHTN number
     * Format: BHTN-YYYY-NNNNNNNN
     * Example: BHTN-2024-12345678
     *
     * YYYY: Year (4 digits)
     * NNNNNNNN: Policy number (8 digits)
     */
    validateBHTNNumber(bhtnNumber) {
        const errors = [];
        const warnings = [];
        const metadata = {};
        try {
            // Remove spaces and convert to uppercase
            const normalized = bhtnNumber.trim().toUpperCase();
            // Check format
            const bhtnPattern = /^BHTN-(\d{4})-(\d{8})$/;
            const match = normalized.match(bhtnPattern);
            if (!match) {
                errors.push('Số BHTN không đúng định dạng. Định dạng đúng: BHTN-YYYY-NNNNNNNN');
                return { isValid: false, errors, warnings };
            }
            const [, year, policyNumber] = match;
            // Validate year
            const currentYear = new Date().getFullYear();
            const yearNum = parseInt(year, 10);
            if (yearNum < 2000 || yearNum > currentYear + 1) {
                errors.push(`Năm không hợp lệ: ${year}`);
            }
            metadata.year = year;
            // Validate policy number (8 digits)
            if (!/^\d{8}$/.test(policyNumber)) {
                errors.push('Số hợp đồng phải là 8 chữ số');
            }
            metadata.policyNumber = policyNumber;
            // Check expiration warning
            if (yearNum < currentYear) {
                warnings.push(`Hợp đồng BHTN có thể đã hết hạn (năm ${year})`);
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                metadata
            };
        }
        catch (error) {
            this.logger.error('Error validating BHTN number', {
                bhtnNumber,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                isValid: false,
                errors: ['Lỗi khi kiểm tra số BHTN'],
                warnings
            };
        }
    }
    /**
     * Check if insurance is expired
     */
    checkExpiration(validFrom, validTo) {
        const now = new Date();
        const daysUntilExpiration = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
            isExpired: now > validTo,
            isExpiringSoon: daysUntilExpiration <= 30 && daysUntilExpiration > 0,
            daysUntilExpiration
        };
    }
    /**
     * Validate insurance dates
     */
    validateInsuranceDates(validFrom, validTo) {
        const errors = [];
        const warnings = [];
        // Check if validFrom is before validTo
        if (validFrom >= validTo) {
            errors.push('Ngày bắt đầu phải trước ngày kết thúc');
        }
        // Check if validFrom is not too far in the past
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (validFrom < oneYearAgo) {
            warnings.push('Ngày bắt đầu quá xa trong quá khứ');
        }
        // Check if validTo is not too far in the future
        const twoYearsFromNow = new Date();
        twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
        if (validTo > twoYearsFromNow) {
            warnings.push('Ngày kết thúc quá xa trong tương lai');
        }
        // Check expiration
        const expirationCheck = this.checkExpiration(validFrom, validTo);
        if (expirationCheck.isExpired) {
            errors.push('Bảo hiểm đã hết hạn');
        }
        else if (expirationCheck.isExpiringSoon) {
            warnings.push(`Bảo hiểm sắp hết hạn (còn ${expirationCheck.daysUntilExpiration} ngày)`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Get service status
     */
    getStatus() {
        return {
            serviceName: 'InsuranceValidationService',
            supportedTypes: ['BHYT', 'BHTN'],
            provinceCodes: this.BHYT_PROVINCE_CODES.length,
            isHealthy: true,
            timestamp: new Date().toISOString()
        };
    }
}
exports.InsuranceValidationService = InsuranceValidationService;
//# sourceMappingURL=InsuranceValidationService.js.map