/**
 * validationMiddleware - Presentation Layer
 * Request validation middleware for billing service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Input Validation, Vietnamese Healthcare Standards, Security
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
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
export const validateGenerateInvoice = [
  body('patientId')
    .notEmpty()
    .withMessage('Mã bệnh nhân không được để trống')
    .isString()
    .withMessage('Mã bệnh nhân phải là chuỗi')
    .matches(/^PAT-\d{6}-\d{3}$/)
    .withMessage('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)'),

  body('doctorId')
    .optional()
    .isString()
    .withMessage('Mã bác sĩ phải là chuỗi')
    .matches(/^[A-Z]{4}-DOC-\d{6}-\d{3}$/)
    .withMessage('Mã bác sĩ không đúng định dạng (DEPT-DOC-YYYYMM-XXX)'),

  body('medicalRecordId')
    .optional()
    .isString()
    .withMessage('Mã hồ sơ y tế phải là chuỗi'),

  body('appointmentId')
    .optional()
    .isString()
    .withMessage('Mã cuộc hẹn phải là chuỗi'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Danh sách dịch vụ không được để trống'),

  body('items.*.serviceCode')
    .notEmpty()
    .withMessage('Mã dịch vụ không được để trống')
    .isString()
    .withMessage('Mã dịch vụ phải là chuỗi')
    .matches(/^[A-Z0-9]{3,10}$/)
    .withMessage('Mã dịch vụ không đúng định dạng'),

  body('items.*.serviceName')
    .notEmpty()
    .withMessage('Tên dịch vụ không được để trống')
    .isString()
    .withMessage('Tên dịch vụ phải là chuỗi')
    .isLength({ min: 3, max: 200 })
    .withMessage('Tên dịch vụ phải từ 3-200 ký tự'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng phải là số nguyên dương'),

  body('items.*.unitPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Đơn giá phải là số dương'),

  body('items.*.category')
    .notEmpty()
    .withMessage('Danh mục dịch vụ không được để trống')
    .isIn(['CONSULTATION', 'DIAGNOSTIC', 'TREATMENT', 'SURGERY', 'MEDICATION', 'ACCOMMODATION', 'OTHER'])
    .withMessage('Danh mục dịch vụ không hợp lệ'),

  body('items.*.description')
    .optional()
    .isString()
    .withMessage('Mô tả dịch vụ phải là chuỗi')
    .isLength({ max: 500 })
    .withMessage('Mô tả dịch vụ không được quá 500 ký tự'),

  body('insurance.type')
    .optional()
    .isIn(['BHYT', 'BHTN', 'PRIVATE'])
    .withMessage('Loại bảo hiểm không hợp lệ'),

  body('insurance.policyNumber')
    .if(body('insurance.type').exists())
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

  body('insurance.beneficiaryName')
    .if(body('insurance.type').exists())
    .notEmpty()
    .withMessage('Tên người thụ hưởng không được để trống')
    .isString()
    .withMessage('Tên người thụ hưởng phải là chuỗi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên người thụ hưởng phải từ 2-100 ký tự'),

  body('insurance.region')
    .optional()
    .isString()
    .withMessage('Mã vùng phải là chuỗi')
    .matches(/^\d{2}$/)
    .withMessage('Mã vùng phải là 2 chữ số'),

  body('insurance.coverageLevel')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Mức độ bao phủ phải từ 0-1'),

  body('notes')
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
export const validateProcessPayment = [
  body('invoiceId')
    .notEmpty()
    .withMessage('Mã hóa đơn không được để trống')
    .isString()
    .withMessage('Mã hóa đơn phải là chuỗi')
    .matches(/^INV-\d{6}-\d{6}$/)
    .withMessage('Mã hóa đơn không đúng định dạng (INV-YYYYMM-XXXXXX)'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Phương thức thanh toán không được để trống')
    .isIn(['CASH', 'CARD', 'BANK_TRANSFER', 'PAYOS', 'INSURANCE_DIRECT'])
    .withMessage('Phương thức thanh toán không hợp lệ'),

  body('amount')
    .isFloat({ min: 1000 })
    .withMessage('Số tiền thanh toán phải ít nhất 1,000 VND'),

  body('currency')
    .optional()
    .isIn(['VND', 'USD'])
    .withMessage('Đơn vị tiền tệ không hợp lệ'),

  body('paymentDetails')
    .optional()
    .isObject()
    .withMessage('Chi tiết thanh toán phải là object'),

  body('notes')
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
export const validateInsurance = [
  body('type')
    .notEmpty()
    .withMessage('Loại bảo hiểm không được để trống')
    .isIn(['BHYT', 'BHTN', 'PRIVATE'])
    .withMessage('Loại bảo hiểm không hợp lệ'),

  body('policyNumber')
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

  body('beneficiaryName')
    .notEmpty()
    .withMessage('Tên người thụ hưởng không được để trống')
    .isString()
    .withMessage('Tên người thụ hưởng phải là chuỗi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên người thụ hưởng phải từ 2-100 ký tự'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Ngày sinh không đúng định dạng ISO8601'),

  body('region')
    .optional()
    .isString()
    .withMessage('Mã vùng phải là chuỗi')
    .matches(/^\d{2}$/)
    .withMessage('Mã vùng phải là 2 chữ số'),

  body('serviceDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày dịch vụ không đúng định dạng ISO8601'),

  handleValidationErrors
];

/**
 * Validation middleware for invoice ID parameter
 */
export const validateInvoiceId = [
  param('invoiceId')
    .notEmpty()
    .withMessage('Mã hóa đơn không được để trống')
    .matches(/^INV-\d{6}-\d{6}$/)
    .withMessage('Mã hóa đơn không đúng định dạng (INV-YYYYMM-XXXXXX)'),

  handleValidationErrors
];

/**
 * Validation middleware for patient ID parameter
 */
export const validatePatientId = [
  param('patientId')
    .notEmpty()
    .withMessage('Mã bệnh nhân không được để trống')
    .matches(/^PAT-\d{6}-\d{3}$/)
    .withMessage('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)'),

  handleValidationErrors
];

/**
 * Validation middleware for insurance claim
 */
export const validateInsuranceClaim = [
  body('invoiceId')
    .notEmpty()
    .withMessage('Mã hóa đơn không được để trống')
    .matches(/^INV-\d{6}-\d{6}$/)
    .withMessage('Mã hóa đơn không đúng định dạng'),

  body('insuranceType')
    .notEmpty()
    .withMessage('Loại bảo hiểm không được để trống')
    .isIn(['BHYT', 'BHTN', 'PRIVATE'])
    .withMessage('Loại bảo hiểm không hợp lệ'),

  body('policyNumber')
    .notEmpty()
    .withMessage('Số thẻ bảo hiểm không được để trống'),

  body('claimAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Số tiền yêu cầu bồi thường phải lớn hơn 0'),

  body('supportingDocuments')
    .optional()
    .isArray()
    .withMessage('Tài liệu hỗ trợ phải là mảng'),

  body('notes')
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
export const validatePayOSWebhook = [
  body('orderCode')
    .notEmpty()
    .withMessage('Order code is required'),

  body('amount')
    .isNumeric()
    .withMessage('Amount must be numeric'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be string'),

  handleValidationErrors
];

/**
 * Validation middleware for BHYT webhook
 */
export const validateBHYTWebhook = [
  body('claimId')
    .notEmpty()
    .withMessage('Claim ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required'),

  handleValidationErrors
];

/**
 * Validation middleware for BHTN webhook
 */
export const validateBHTNWebhook = [
  body('claimId')
    .notEmpty()
    .withMessage('Claim ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required'),

  handleValidationErrors
];

export const validationMiddleware = {
  validateGenerateInvoice,
  validateProcessPayment,
  validateInsurance,
  validateInvoiceId,
  validatePatientId,
  validateInsuranceClaim,
  validatePayOSWebhook,
  validateBHYTWebhook,
  validateBHTNWebhook
};
