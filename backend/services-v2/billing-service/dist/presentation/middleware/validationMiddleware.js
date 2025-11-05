"use strict";
/**
 * validationMiddleware - Presentation Layer
 * Request validation middleware for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Input Validation, Vietnamese Healthcare Standards, Security
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = exports.validateBHTNWebhook = exports.validateBHYTWebhook = exports.validatePayOSWebhook = exports.validateInsuranceClaim = exports.validatePatientId = exports.validateInvoiceId = exports.validateInsurance = exports.validateProcessPayment = exports.validateGenerateInvoice = void 0;
const express_validator_1 = require("express-validator");
/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined
        }));
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Dữ liệu đầu vào không hợp lệ',
                details: errorMessages
            }
        });
    }
    next();
};
/**
 * Validation middleware for generate invoice
 */
exports.validateGenerateInvoice = [
    (0, express_validator_1.body)('patientId')
        .notEmpty()
        .withMessage('Mã bệnh nhân không được để trống')
        .isString()
        .withMessage('Mã bệnh nhân phải là chuỗi')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)'),
    (0, express_validator_1.body)('doctorId')
        .optional()
        .isString()
        .withMessage('Mã bác sĩ phải là chuỗi')
        .matches(/^[A-Z]{4}-DOC-\d{6}-\d{3}$/)
        .withMessage('Mã bác sĩ không đúng định dạng (DEPT-DOC-YYYYMM-XXX)'),
    (0, express_validator_1.body)('medicalRecordId')
        .optional()
        .isString()
        .withMessage('Mã hồ sơ y tế phải là chuỗi'),
    (0, express_validator_1.body)('appointmentId')
        .optional()
        .isString()
        .withMessage('Mã cuộc hẹn phải là chuỗi'),
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('Danh sách dịch vụ không được để trống'),
    (0, express_validator_1.body)('items.*.serviceCode')
        .notEmpty()
        .withMessage('Mã dịch vụ không được để trống')
        .isString()
        .withMessage('Mã dịch vụ phải là chuỗi')
        .matches(/^[A-Z0-9]{3,10}$/)
        .withMessage('Mã dịch vụ không đúng định dạng'),
    (0, express_validator_1.body)('items.*.serviceName')
        .notEmpty()
        .withMessage('Tên dịch vụ không được để trống')
        .isString()
        .withMessage('Tên dịch vụ phải là chuỗi')
        .isLength({ min: 3, max: 200 })
        .withMessage('Tên dịch vụ phải từ 3-200 ký tự'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Số lượng phải là số nguyên dương'),
    (0, express_validator_1.body)('items.*.unitPrice')
        .isFloat({ min: 0.01 })
        .withMessage('Đơn giá phải là số dương'),
    (0, express_validator_1.body)('items.*.category')
        .notEmpty()
        .withMessage('Danh mục dịch vụ không được để trống')
        .isIn(['CONSULTATION', 'DIAGNOSTIC', 'TREATMENT', 'SURGERY', 'MEDICATION', 'ACCOMMODATION', 'OTHER'])
        .withMessage('Danh mục dịch vụ không hợp lệ'),
    (0, express_validator_1.body)('items.*.description')
        .optional()
        .isString()
        .withMessage('Mô tả dịch vụ phải là chuỗi')
        .isLength({ max: 500 })
        .withMessage('Mô tả dịch vụ không được quá 500 ký tự'),
    (0, express_validator_1.body)('insurance.type')
        .optional()
        .isIn(['BHYT', 'BHTN', 'PRIVATE'])
        .withMessage('Loại bảo hiểm không hợp lệ'),
    (0, express_validator_1.body)('insurance.policyNumber')
        .if((0, express_validator_1.body)('insurance.type').exists())
        .notEmpty()
        .withMessage('Số thẻ bảo hiểm không được để trống')
        .custom((value, { req }) => {
        const insuranceType = req.body.insurance?.type;
        if (insuranceType === 'BHYT' && !/^HS\d{13}$/.test(value)) {
            throw new Error('Số thẻ BHYT không đúng định dạng (HS + 13 chữ số)');
        }
        if (insuranceType === 'BHTN' && !/^TN\d{13}$/.test(value)) {
            throw new Error('Số thẻ BHTN không đúng định dạng (TN + 13 chữ số)');
        }
        return true;
    }),
    (0, express_validator_1.body)('insurance.beneficiaryName')
        .if((0, express_validator_1.body)('insurance.type').exists())
        .notEmpty()
        .withMessage('Tên người thụ hưởng không được để trống')
        .isString()
        .withMessage('Tên người thụ hưởng phải là chuỗi')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên người thụ hưởng phải từ 2-100 ký tự'),
    (0, express_validator_1.body)('insurance.region')
        .optional()
        .isString()
        .withMessage('Mã vùng phải là chuỗi')
        .matches(/^\d{2}$/)
        .withMessage('Mã vùng phải là 2 chữ số'),
    (0, express_validator_1.body)('insurance.coverageLevel')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('Mức độ bao phủ phải từ 0-1'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .withMessage('Ghi chú phải là chuỗi')
        .isLength({ max: 1000 })
        .withMessage('Ghi chú không được quá 1000 ký tự'),
    handleValidationErrors
];
/**
 * Validation middleware for process payment
 */
exports.validateProcessPayment = [
    (0, express_validator_1.body)('invoiceId')
        .notEmpty()
        .withMessage('Mã hóa đơn không được để trống')
        .isString()
        .withMessage('Mã hóa đơn phải là chuỗi')
        .matches(/^INV-\d{6}-\d{6}$/)
        .withMessage('Mã hóa đơn không đúng định dạng (INV-YYYYMM-XXXXXX)'),
    (0, express_validator_1.body)('paymentMethod')
        .notEmpty()
        .withMessage('Phương thức thanh toán không được để trống')
        .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'PAYOS', 'INSURANCE_DIRECT'])
        .withMessage('Phương thức thanh toán không hợp lệ'),
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 1000 })
        .withMessage('Số tiền thanh toán phải ít nhất 1,000 VND'),
    (0, express_validator_1.body)('currency')
        .optional()
        .isIn(['VND', 'USD'])
        .withMessage('Đơn vị tiền tệ không hợp lệ'),
    (0, express_validator_1.body)('paymentDetails')
        .optional()
        .isObject()
        .withMessage('Chi tiết thanh toán phải là object'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .withMessage('Ghi chú phải là chuỗi')
        .isLength({ max: 500 })
        .withMessage('Ghi chú không được quá 500 ký tự'),
    handleValidationErrors
];
/**
 * Validation middleware for validate insurance
 */
exports.validateInsurance = [
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('Loại bảo hiểm không được để trống')
        .isIn(['BHYT', 'BHTN', 'PRIVATE'])
        .withMessage('Loại bảo hiểm không hợp lệ'),
    (0, express_validator_1.body)('policyNumber')
        .notEmpty()
        .withMessage('Số thẻ bảo hiểm không được để trống')
        .isString()
        .withMessage('Số thẻ bảo hiểm phải là chuỗi')
        .custom((value, { req }) => {
        const insuranceType = req.body.type;
        if (insuranceType === 'BHYT' && !/^HS\d{13}$/.test(value)) {
            throw new Error('Số thẻ BHYT không đúng định dạng (HS + 13 chữ số)');
        }
        if (insuranceType === 'BHTN' && !/^TN\d{13}$/.test(value)) {
            throw new Error('Số thẻ BHTN không đúng định dạng (TN + 13 chữ số)');
        }
        return true;
    }),
    (0, express_validator_1.body)('beneficiaryName')
        .notEmpty()
        .withMessage('Tên người thụ hưởng không được để trống')
        .isString()
        .withMessage('Tên người thụ hưởng phải là chuỗi')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên người thụ hưởng phải từ 2-100 ký tự'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Ngày sinh không đúng định dạng ISO8601'),
    (0, express_validator_1.body)('region')
        .optional()
        .isString()
        .withMessage('Mã vùng phải là chuỗi')
        .matches(/^\d{2}$/)
        .withMessage('Mã vùng phải là 2 chữ số'),
    (0, express_validator_1.body)('serviceDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày dịch vụ không đúng định dạng ISO8601'),
    handleValidationErrors
];
/**
 * Validation middleware for invoice ID parameter
 */
exports.validateInvoiceId = [
    (0, express_validator_1.param)('invoiceId')
        .notEmpty()
        .withMessage('Mã hóa đơn không được để trống')
        .matches(/^INV-\d{6}-\d{6}$/)
        .withMessage('Mã hóa đơn không đúng định dạng (INV-YYYYMM-XXXXXX)'),
    handleValidationErrors
];
/**
 * Validation middleware for patient ID parameter
 */
exports.validatePatientId = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Mã bệnh nhân không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)'),
    handleValidationErrors
];
/**
 * Validation middleware for insurance claim
 */
exports.validateInsuranceClaim = [
    (0, express_validator_1.body)('invoiceId')
        .notEmpty()
        .withMessage('Mã hóa đơn không được để trống')
        .matches(/^INV-\d{6}-\d{6}$/)
        .withMessage('Mã hóa đơn không đúng định dạng'),
    (0, express_validator_1.body)('insuranceType')
        .notEmpty()
        .withMessage('Loại bảo hiểm không được để trống')
        .isIn(['BHYT', 'BHTN', 'PRIVATE'])
        .withMessage('Loại bảo hiểm không hợp lệ'),
    (0, express_validator_1.body)('policyNumber')
        .notEmpty()
        .withMessage('Số thẻ bảo hiểm không được để trống'),
    (0, express_validator_1.body)('claimAmount')
        .isFloat({ min: 0.01 })
        .withMessage('Số tiền yêu cầu bồi thường phải lớn hơn 0'),
    (0, express_validator_1.body)('supportingDocuments')
        .optional()
        .isArray()
        .withMessage('Tài liệu hỗ trợ phải là mảng'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .withMessage('Ghi chú phải là chuỗi')
        .isLength({ max: 1000 })
        .withMessage('Ghi chú không được quá 1000 ký tự'),
    handleValidationErrors
];
/**
 * Validation middleware for PayOS webhook
 */
exports.validatePayOSWebhook = [
    (0, express_validator_1.body)('orderCode')
        .notEmpty()
        .withMessage('Order code is required'),
    (0, express_validator_1.body)('amount')
        .isNumeric()
        .withMessage('Amount must be numeric'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be string'),
    handleValidationErrors
];
/**
 * Validation middleware for BHYT webhook
 */
exports.validateBHYTWebhook = [
    (0, express_validator_1.body)('claimId')
        .notEmpty()
        .withMessage('Claim ID is required'),
    (0, express_validator_1.body)('status')
        .notEmpty()
        .withMessage('Status is required'),
    handleValidationErrors
];
/**
 * Validation middleware for BHTN webhook
 */
exports.validateBHTNWebhook = [
    (0, express_validator_1.body)('claimId')
        .notEmpty()
        .withMessage('Claim ID is required'),
    (0, express_validator_1.body)('status')
        .notEmpty()
        .withMessage('Status is required'),
    handleValidationErrors
];
exports.validationMiddleware = {
    validateGenerateInvoice: exports.validateGenerateInvoice,
    validateProcessPayment: exports.validateProcessPayment,
    validateInsurance: exports.validateInsurance,
    validateInvoiceId: exports.validateInvoiceId,
    validatePatientId: exports.validatePatientId,
    validateInsuranceClaim: exports.validateInsuranceClaim,
    validatePayOSWebhook: exports.validatePayOSWebhook,
    validateBHYTWebhook: exports.validateBHYTWebhook,
    validateBHTNWebhook: exports.validateBHTNWebhook
};
//# sourceMappingURL=validationMiddleware.js.map