"use strict";
/**
 * Custom Jest Matchers for Vietnamese Healthcare Testing
 * Custom matchers for billing service testing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest Custom Matchers, Vietnamese Healthcare Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Extend Jest matchers
globals_1.expect.extend({
    /**
     * Check if string is a valid Vietnamese phone number
     */
    toBeValidVietnamesePhoneNumber(received) {
        const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
        const pass = phoneRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid Vietnamese phone number`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid Vietnamese phone number (format: 0xxxxxxxxx or +84xxxxxxxxx)`,
                pass: false
            };
        }
    },
    /**
     * Check if string is a valid BHYT number
     */
    toBeValidBHYTNumber(received) {
        const bhytRegex = /^HS\d{13}$/;
        const pass = bhytRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid BHYT number`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid BHYT number (format: HS + 13 digits)`,
                pass: false
            };
        }
    },
    /**
     * Check if string is a valid BHTN number
     */
    toBeValidBHTNNumber(received) {
        const bhtnRegex = /^TN\d{13}$/;
        const pass = bhtnRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid BHTN number`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid BHTN number (format: TN + 13 digits)`,
                pass: false
            };
        }
    },
    /**
     * Check if string is a valid invoice ID
     */
    toBeValidInvoiceId(received) {
        const invoiceRegex = /^INV-\d{6}-\d{6}$/;
        const pass = invoiceRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid invoice ID`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid invoice ID (format: INV-YYYYMM-XXXXXX)`,
                pass: false
            };
        }
    },
    /**
     * Check if string is a valid patient ID
     */
    toBeValidPatientId(received) {
        const patientRegex = /^PAT-\d{6}-\d{3}$/;
        const pass = patientRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid patient ID`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid patient ID (format: PAT-YYYYMM-XXX)`,
                pass: false
            };
        }
    },
    /**
     * Check if string is a valid doctor ID
     */
    toBeValidDoctorId(received) {
        const doctorRegex = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;
        const pass = doctorRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid doctor ID`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid doctor ID (format: DEPT-DOC-YYYYMM-XXX)`,
                pass: false
            };
        }
    },
    /**
     * Check if number is a valid VND amount
     */
    toBeValidVNDAmount(received) {
        const isNumber = typeof received === 'number';
        const isPositive = received > 0;
        const isInteger = Number.isInteger(received);
        const isReasonable = received <= 1000000000; // Max 1 billion VND
        const pass = isNumber && isPositive && isInteger && isReasonable;
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid VND amount`,
                pass: true
            };
        }
        else {
            const issues = [];
            if (!isNumber)
                issues.push('must be a number');
            if (!isPositive)
                issues.push('must be positive');
            if (!isInteger)
                issues.push('must be an integer');
            if (!isReasonable)
                issues.push('must be <= 1,000,000,000 VND');
            return {
                message: () => `expected ${received} to be a valid VND amount (${issues.join(', ')})`,
                pass: false
            };
        }
    },
    /**
     * Check if string contains Vietnamese text
     */
    toContainVietnameseText(received) {
        // Vietnamese characters with diacritics
        const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        const pass = vietnameseRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to contain Vietnamese text`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received} to contain Vietnamese text (characters with diacritics)`,
                pass: false
            };
        }
    },
    /**
     * Check if object has required billing fields
     */
    toHaveRequiredBillingFields(received) {
        const requiredFields = [
            'invoiceId',
            'patientId',
            'status',
            'items',
            'subtotal',
            'taxAmount',
            'totalAmount',
            'createdAt'
        ];
        const missingFields = requiredFields.filter(field => !(field in received));
        const pass = missingFields.length === 0;
        if (pass) {
            return {
                message: () => `expected object not to have all required billing fields`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected object to have required billing fields. Missing: ${missingFields.join(', ')}`,
                pass: false
            };
        }
    },
    /**
     * Check if object has valid insurance structure
     */
    toHaveValidInsuranceStructure(received) {
        if (!received) {
            return {
                message: () => `expected insurance object to be defined`,
                pass: false
            };
        }
        const requiredFields = ['type', 'policyNumber', 'beneficiaryName', 'coverageLevel'];
        const missingFields = requiredFields.filter(field => !(field in received));
        const validTypes = ['BHYT', 'BHTN', 'PRIVATE'];
        const hasValidType = validTypes.includes(received.type);
        const hasValidCoverage = typeof received.coverageLevel === 'number' &&
            received.coverageLevel >= 0 &&
            received.coverageLevel <= 1;
        const pass = missingFields.length === 0 && hasValidType && hasValidCoverage;
        if (pass) {
            return {
                message: () => `expected insurance object not to have valid structure`,
                pass: true
            };
        }
        else {
            const issues = [];
            if (missingFields.length > 0)
                issues.push(`missing fields: ${missingFields.join(', ')}`);
            if (!hasValidType)
                issues.push(`invalid type: ${received.type}`);
            if (!hasValidCoverage)
                issues.push(`invalid coverage level: ${received.coverageLevel}`);
            return {
                message: () => `expected insurance object to have valid structure. Issues: ${issues.join('; ')}`,
                pass: false
            };
        }
    },
    /**
     * Check if payment object has valid structure
     */
    toHaveValidPaymentStructure(received) {
        if (!received) {
            return {
                message: () => `expected payment object to be defined`,
                pass: false
            };
        }
        const requiredFields = ['paymentMethod', 'amount', 'currency', 'processedAt'];
        const missingFields = requiredFields.filter(field => !(field in received));
        const validMethods = ['CASH', 'CARD', 'BANK_TRANSFER', 'PAYOS', 'INSURANCE_DIRECT'];
        const hasValidMethod = validMethods.includes(received.paymentMethod);
        const validCurrencies = ['VND', 'USD'];
        const hasValidCurrency = validCurrencies.includes(received.currency);
        const hasValidAmount = typeof received.amount === 'number' && received.amount > 0;
        const pass = missingFields.length === 0 && hasValidMethod && hasValidCurrency && hasValidAmount;
        if (pass) {
            return {
                message: () => `expected payment object not to have valid structure`,
                pass: true
            };
        }
        else {
            const issues = [];
            if (missingFields.length > 0)
                issues.push(`missing fields: ${missingFields.join(', ')}`);
            if (!hasValidMethod)
                issues.push(`invalid payment method: ${received.paymentMethod}`);
            if (!hasValidCurrency)
                issues.push(`invalid currency: ${received.currency}`);
            if (!hasValidAmount)
                issues.push(`invalid amount: ${received.amount}`);
            return {
                message: () => `expected payment object to have valid structure. Issues: ${issues.join('; ')}`,
                pass: false
            };
        }
    },
    /**
     * Check if array contains Vietnamese healthcare service categories
     */
    toContainValidServiceCategories(received) {
        const validCategories = [
            'CONSULTATION',
            'DIAGNOSTIC',
            'TREATMENT',
            'SURGERY',
            'MEDICATION',
            'ACCOMMODATION',
            'OTHER'
        ];
        const invalidCategories = received.filter(category => !validCategories.includes(category));
        const pass = invalidCategories.length === 0;
        if (pass) {
            return {
                message: () => `expected array not to contain only valid service categories`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected array to contain only valid service categories. Invalid: ${invalidCategories.join(', ')}`,
                pass: false
            };
        }
    },
    /**
     * Check if date is within Vietnamese business hours
     */
    toBeWithinVietnameseBusinessHours(received) {
        const hour = received.getHours();
        const isWeekday = received.getDay() >= 1 && received.getDay() <= 5; // Monday to Friday
        const isBusinessHour = hour >= 8 && hour <= 17; // 8 AM to 5 PM
        const pass = isWeekday && isBusinessHour;
        if (pass) {
            return {
                message: () => `expected ${received.toISOString()} not to be within Vietnamese business hours`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received.toISOString()} to be within Vietnamese business hours (Monday-Friday, 8 AM-5 PM)`,
                pass: false
            };
        }
    },
    /**
     * Check if error object has Vietnamese message
     */
    toHaveVietnameseErrorMessage(received) {
        if (!received || !received.error || !received.error.message) {
            return {
                message: () => `expected object to have error.message field`,
                pass: false
            };
        }
        const message = received.error.message;
        const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(message);
        if (hasVietnamese) {
            return {
                message: () => `expected error message not to be in Vietnamese`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected error message to be in Vietnamese, got: ${message}`,
                pass: false
            };
        }
    }
});
//# sourceMappingURL=custom-matchers.js.map