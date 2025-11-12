"use strict";
/**
 * Validation Middleware
 * Request validation using express-validator
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRemoveEmergencyContact = exports.validateUpdateEmergencyContact = exports.validateRevokeConsent = exports.validateAddInsuranceInfo = exports.validateGrantConsent = exports.validateAddEmergencyContact = exports.validateLinkPatients = exports.validateMergePatients = exports.validateMatchPatients = exports.validateFilterPatients = exports.validateSearchPatients = exports.validateBHYTNumber = exports.validateNationalId = exports.validateUserId = exports.validatePatientId = exports.validateUpdatePatient = exports.validateGetPatientList = exports.validateRegisterPatient = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((err) => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg,
        }));
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors: formattedErrors,
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
/**
 * Validate register patient request
 */
exports.validateRegisterPatient = [
    // User ID
    (0, express_validator_1.body)('userId')
        .notEmpty()
        .withMessage('User ID không được để trống')
        .isUUID()
        .withMessage('User ID phải là UUID hợp lệ'),
    // Personal Info
    (0, express_validator_1.body)('fullName')
        .notEmpty()
        .withMessage('Họ tên không được để trống')
        .isLength({ min: 2, max: 255 })
        .withMessage('Họ tên phải từ 2-255 ký tự'),
    (0, express_validator_1.body)('dateOfBirth')
        .notEmpty()
        .withMessage('Ngày sinh không được để trống')
        .isISO8601()
        .withMessage('Ngày sinh phải là ngày hợp lệ (ISO 8601)'),
    (0, express_validator_1.body)('gender')
        .notEmpty()
        .withMessage('Giới tính không được để trống')
        .isIn(['male', 'female', 'other'])
        .withMessage('Giới tính không hợp lệ'),
    (0, express_validator_1.body)('nationalId')
        .notEmpty()
        .withMessage('CMND/CCCD không được để trống')
        .matches(/^\d{9}$|^\d{12}$/)
        .withMessage('CMND/CCCD phải là 9 hoặc 12 chữ số'),
    (0, express_validator_1.body)('nationality')
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage('Quốc tịch phải hợp lệ nếu được cung cấp'),
    // Contact Info
    (0, express_validator_1.body)('primaryPhone')
        .notEmpty()
        .withMessage('Số điện thoại chính không được để trống')
        .matches(/^(0|\+84)[0-9]{9,10}$/)
        .withMessage('Số điện thoại không đúng định dạng Việt Nam'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email không đúng định dạng'),
    (0, express_validator_1.body)('address.street')
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage('Địa chỉ đường/phố phải hợp lệ nếu được cung cấp'),
    (0, express_validator_1.body)('address.ward')
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage('Phường/xã phải hợp lệ nếu được cung cấp'),
    (0, express_validator_1.body)('address.district')
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage('Quận/huyện phải hợp lệ nếu được cung cấp'),
    (0, express_validator_1.body)('address.city')
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage('Thành phố không hợp lệ'),
    (0, express_validator_1.body)('address.province')
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage('Tỉnh/thành phố phải hợp lệ nếu được cung cấp'),
    (0, express_validator_1.body)('preferredContactMethod')
        .optional()
        .isIn(['phone', 'email', 'sms'])
        .withMessage('Phương thức liên hệ không hợp lệ'),
    // Blood Type (optional)
    (0, express_validator_1.body)('bloodType')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Nhóm máu không hợp lệ'),
    // Insurance (optional)
    (0, express_validator_1.body)('insurance.coverageType')
        .optional()
        .isIn(['BHYT', 'BHTN', 'private', 'self_pay'])
        .withMessage('Loại bảo hiểm không hợp lệ'),
    (0, express_validator_1.body)('insurance.validFrom')
        .optional()
        .isISO8601()
        .withMessage('Ngày bắt đầu bảo hiểm phải là ngày hợp lệ'),
    (0, express_validator_1.body)('insurance.validTo')
        .optional()
        .isISO8601()
        .withMessage('Ngày kết thúc bảo hiểm phải là ngày hợp lệ'),
    exports.handleValidationErrors,
];
/**
 * Validate get patient list request
 */
exports.validateGetPatientList = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page phải là số nguyên dương'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit phải từ 1-100'),
    (0, express_validator_1.query)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive phải là boolean'),
    (0, express_validator_1.query)('hasInsurance')
        .optional()
        .isBoolean()
        .withMessage('hasInsurance phải là boolean'),
    (0, express_validator_1.query)('city').optional().isString().withMessage('City phải là chuỗi'),
    (0, express_validator_1.query)('province').optional().isString().withMessage('Province phải là chuỗi'),
    (0, express_validator_1.query)('sortField')
        .optional()
        .isIn(['created_at', 'full_name', 'date_of_birth'])
        .withMessage('sortField không hợp lệ'),
    (0, express_validator_1.query)('sortDirection')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortDirection phải là asc hoặc desc'),
    exports.handleValidationErrors,
];
/**
 * Validate update patient request
 */
exports.validateUpdatePatient = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng (PAT-YYYYMM-XXX)'),
    (0, express_validator_1.body)('fullName')
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage('Họ tên phải từ 2-255 ký tự'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Ngày sinh phải là ngày hợp lệ'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Giới tính không hợp lệ'),
    (0, express_validator_1.body)('primaryPhone')
        .optional()
        .matches(/^(0|\+84)[0-9]{9,10}$/)
        .withMessage('Số điện thoại không đúng định dạng'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email không đúng định dạng'),
    exports.handleValidationErrors,
];
/**
 * Validate patient ID parameter
 */
exports.validatePatientId = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng (PAT-YYYYMM-XXX)'),
    exports.handleValidationErrors,
];
/**
 * Validate user ID parameter
 */
exports.validateUserId = [
    (0, express_validator_1.param)('userId')
        .notEmpty()
        .withMessage('User ID không được để trống')
        .isUUID()
        .withMessage('User ID phải là UUID hợp lệ'),
    exports.handleValidationErrors,
];
/**
 * Validate national ID parameter
 */
exports.validateNationalId = [
    (0, express_validator_1.param)('nationalId')
        .notEmpty()
        .withMessage('CMND/CCCD không được để trống')
        .matches(/^\d{9}$|^\d{12}$/)
        .withMessage('CMND/CCCD phải là 9 hoặc 12 chữ số'),
    exports.handleValidationErrors,
];
/**
 * Validate BHYT number parameter
 */
exports.validateBHYTNumber = [
    (0, express_validator_1.param)('bhytNumber')
        .notEmpty()
        .withMessage('Số BHYT không được để trống')
        .matches(/^[A-Z]{2}-\d-\d{2}-\d{4}-\d{5}-\d{5}$/)
        .withMessage('Số BHYT không đúng định dạng'),
    exports.handleValidationErrors,
];
/**
 * Validate search patients request
 */
exports.validateSearchPatients = [
    (0, express_validator_1.query)('searchTerm')
        .notEmpty()
        .withMessage('Từ khóa tìm kiếm không được để trống')
        .isLength({ min: 2 })
        .withMessage('Từ khóa tìm kiếm phải có ít nhất 2 ký tự'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Số lượng kết quả phải từ 1-100'),
    exports.handleValidationErrors,
];
/**
 * Validate filter patients request
 */
exports.validateFilterPatients = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Số lượng kết quả phải từ 1-100'),
    (0, express_validator_1.query)('sortDirection')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Hướng sắp xếp phải là asc hoặc desc'),
    exports.handleValidationErrors,
];
/**
 * Validate match patients request
 */
exports.validateMatchPatients = [
    (0, express_validator_1.body)('fullName')
        .optional()
        .isLength({ min: 2 })
        .withMessage('Họ tên phải có ít nhất 2 ký tự'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Ngày sinh phải là ngày hợp lệ'),
    (0, express_validator_1.body)('nationalId')
        .optional()
        .matches(/^\d{9}$|^\d{12}$/)
        .withMessage('CMND/CCCD phải là 9 hoặc 12 chữ số'),
    (0, express_validator_1.body)('primaryPhone')
        .optional()
        .matches(/^(0|\+84)[0-9]{9,10}$/)
        .withMessage('Số điện thoại không đúng định dạng'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email không đúng định dạng'),
    (0, express_validator_1.body)('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Số lượng kết quả phải từ 1-50'),
    exports.handleValidationErrors,
];
/**
 * Validate merge patients request
 */
exports.validateMergePatients = [
    (0, express_validator_1.body)('duplicatePatientId')
        .notEmpty()
        .withMessage('Duplicate Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Duplicate Patient ID không đúng định dạng'),
    (0, express_validator_1.body)('masterPatientId')
        .notEmpty()
        .withMessage('Master Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Master Patient ID không đúng định dạng'),
    (0, express_validator_1.body)('reason')
        .notEmpty()
        .withMessage('Lý do gộp không được để trống')
        .isLength({ min: 10 })
        .withMessage('Lý do gộp phải có ít nhất 10 ký tự'),
    exports.handleValidationErrors,
];
/**
 * Validate link patients request
 */
exports.validateLinkPatients = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng'),
    (0, express_validator_1.body)('otherPatientId')
        .notEmpty()
        .withMessage('Other Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Other Patient ID không đúng định dạng'),
    (0, express_validator_1.body)('linkType')
        .notEmpty()
        .withMessage('Link type không được để trống')
        .isIn(['refer', 'seealso'])
        .withMessage('Link type phải là refer hoặc seealso'),
    exports.handleValidationErrors,
];
/**
 * Validate add emergency contact request
 */
exports.validateAddEmergencyContact = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng'),
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Tên người liên hệ không được để trống')
        .isLength({ min: 2, max: 255 })
        .withMessage('Tên người liên hệ phải từ 2-255 ký tự'),
    (0, express_validator_1.body)('relationship')
        .notEmpty()
        .withMessage('Mối quan hệ không được để trống'),
    (0, express_validator_1.body)('primaryPhone')
        .notEmpty()
        .withMessage('Số điện thoại chính không được để trống')
        .matches(/^(0|\+84)[0-9]{9,10}$/)
        .withMessage('Số điện thoại không đúng định dạng'),
    exports.handleValidationErrors,
];
/**
 * Validate grant consent request
 */
exports.validateGrantConsent = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng'),
    (0, express_validator_1.body)('consentType').notEmpty().withMessage('Loại đồng ý không được để trống'),
    (0, express_validator_1.body)('expiresAt')
        .optional()
        .isISO8601()
        .withMessage('Ngày hết hạn phải là ngày hợp lệ'),
    exports.handleValidationErrors,
];
exports.validateAddInsuranceInfo = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng'),
    (0, express_validator_1.body)('provider')
        .notEmpty()
        .withMessage('Tên nhà cung cấp bảo hiểm không được để trống'),
    (0, express_validator_1.body)('policyNumber')
        .notEmpty()
        .withMessage('Số hợp đồng bảo hiểm không được để trống'),
    (0, express_validator_1.body)('coverageType')
        .isIn(['BHYT', 'BHTN', 'private', 'self_pay'])
        .withMessage('Loại bảo hiểm không hợp lệ'),
    (0, express_validator_1.body)('validFrom')
        .isISO8601()
        .withMessage('Ngày bắt đầu bảo hiểm phải là ngày hợp lệ'),
    (0, express_validator_1.body)('validTo')
        .isISO8601()
        .withMessage('Ngày kết thúc bảo hiểm phải là ngày hợp lệ'),
    (0, express_validator_1.body)('isVietnameseInsurance')
        .isBoolean()
        .withMessage('Trường isVietnameseInsurance phải là boolean'),
    exports.handleValidationErrors,
];
/**
 * Validate revoke consent request
 */
exports.validateRevokeConsent = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng'),
    (0, express_validator_1.param)('consentId')
        .notEmpty()
        .withMessage('Consent ID không được để trống')
        .isUUID()
        .withMessage('Consent ID phải là UUID hợp lệ'),
    exports.handleValidationErrors,
];
/**
 * Validate update emergency contact request
 */
exports.validateUpdateEmergencyContact = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng'),
    (0, express_validator_1.param)('contactId')
        .notEmpty()
        .withMessage('Contact ID không được để trống')
        .isUUID()
        .withMessage('Contact ID phải là UUID hợp lệ'),
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Tên người liên hệ không được để trống')
        .isLength({ min: 2, max: 255 })
        .withMessage('Tên phải từ 2-255 ký tự'),
    (0, express_validator_1.body)('relationship')
        .notEmpty()
        .withMessage('Mối quan hệ không được để trống'),
    (0, express_validator_1.body)('primaryPhone')
        .notEmpty()
        .withMessage('Số điện thoại chính không được để trống')
        .matches(/^(0|\+84)[0-9]{9,10}$/)
        .withMessage('Số điện thoại không hợp lệ'),
    (0, express_validator_1.body)('secondaryPhone')
        .optional()
        .matches(/^(0|\+84)[0-9]{9,10}$/)
        .withMessage('Số điện thoại phụ không hợp lệ'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email không hợp lệ'),
    exports.handleValidationErrors,
];
/**
 * Validate remove emergency contact request
 */
exports.validateRemoveEmergencyContact = [
    (0, express_validator_1.param)('patientId')
        .notEmpty()
        .withMessage('Patient ID không được để trống')
        .matches(/^PAT-\d{6}-\d{3}$/)
        .withMessage('Patient ID không đúng định dạng'),
    (0, express_validator_1.param)('contactId')
        .notEmpty()
        .withMessage('Contact ID không được để trống')
        .isUUID()
        .withMessage('Contact ID phải là UUID hợp lệ'),
    exports.handleValidationErrors,
];
//# sourceMappingURL=ValidationMiddleware.js.map