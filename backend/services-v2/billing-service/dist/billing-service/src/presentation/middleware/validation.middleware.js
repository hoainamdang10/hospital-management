"use strict";
/**
 * Validation Middleware - Presentation Layer
 * Request validation wrapper for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Input Validation, Security, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.validateField = validateField;
exports.validateVNDAmount = validateVNDAmount;
exports.validateDateRange = validateDateRange;
const validationMiddleware_1 = require("./validationMiddleware");
/**
 * Validation middleware map
 */
const validationMap = {
    // Invoice validations
    'createInvoice': validationMiddleware_1.validateGenerateInvoice,
    'generateInvoice': validationMiddleware_1.validateGenerateInvoice,
    'invoiceId': validationMiddleware_1.validateInvoiceId,
    // Payment validations
    'processPayment': validationMiddleware_1.validateProcessPayment,
    'payment': validationMiddleware_1.validateProcessPayment,
    // Insurance validations
    'validateInsurance': validationMiddleware_1.validateInsurance,
    'insurance': validationMiddleware_1.validateInsurance,
    'insuranceClaim': validationMiddleware_1.validateInsuranceClaim,
    'submitClaim': validationMiddleware_1.validateInsuranceClaim,
    // Patient validations
    'patientId': validationMiddleware_1.validatePatientId,
    // Webhook validations
    'payosWebhook': validationMiddleware_1.validatePayOSWebhook,
    'bhytWebhook': validationMiddleware_1.validateBHYTWebhook,
    'bhtnWebhook': validationMiddleware_1.validateBHTNWebhook
};
/**
 * Validate request wrapper
 * Usage: validateRequest('createInvoice')
 */
function validateRequest(validationType) {
    const validators = validationMap[validationType];
    if (!validators) {
        console.warn(`No validators found for type: ${validationType}`);
        return (req, res, next) => next();
    }
    return validators;
}
/**
 * Custom validation middleware for specific fields
 */
function validateField(field, validator, errorMessage) {
    return (req, res, next) => {
        const value = req.body[field] || req.params[field] || req.query[field];
        if (!validator(value)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: errorMessage,
                    field
                }
            });
            return;
        }
        next();
    };
}
/**
 * Validate Vietnamese currency amount
 */
function validateVNDAmount(req, res, next) {
    const amount = req.body.amount;
    if (!amount || typeof amount !== 'number') {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Số tiền không hợp lệ',
                field: 'amount'
            }
        });
        return;
    }
    if (amount < 1000) {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Số tiền phải ít nhất 1,000 VND',
                field: 'amount'
            }
        });
        return;
    }
    if (amount > 1000000000) { // 1 billion VND
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Số tiền vượt quá giới hạn cho phép',
                field: 'amount'
            }
        });
        return;
    }
    next();
}
/**
 * Validate date range
 */
function validateDateRange(req, res, next) {
    const { fromDate, toDate } = req.query;
    if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Định dạng ngày không hợp lệ'
                }
            });
            return;
        }
        if (from > to) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
                }
            });
            return;
        }
    }
    next();
}
//# sourceMappingURL=validation.middleware.js.map