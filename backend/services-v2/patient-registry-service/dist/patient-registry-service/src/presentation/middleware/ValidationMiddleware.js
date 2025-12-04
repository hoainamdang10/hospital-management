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
const PATIENT_ID_REGEX = /^PAT-\d{6}-\d{3}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FLEXIBLE_PHONE_REGEX = /^\+?[0-9]{6,15}$/;
const assertFlexiblePatientId = (value) => {
    if (!PATIENT_ID_REGEX.test(value) &&
        !UUID_REGEX.test(value) &&
        (value.length < 6 || value.length > 50)) {
        throw new Error("Patient ID phải hợp lệ (PAT-YYYYMM-XXX, UUID hoặc chuỗi 6-50 ký tự)");
    }
    return true;
};
const assertFlexiblePhone = (value) => {
    const normalized = value.replace(/[\s-]/g, "");
    if (!FLEXIBLE_PHONE_REGEX.test(normalized)) {
        throw new Error("Số điện thoại phải có 6-15 chữ số");
    }
    return true;
};
/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((err) => ({
            field: err.type === "field" ? err.path : "unknown",
            message: err.msg,
        }));
        res.status(400).json({
            success: false,
            error: "Validation failed",
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
    (0, express_validator_1.body)("userId")
        .notEmpty()
        .withMessage("User ID không được để trống")
        .isUUID()
        .withMessage("User ID phải là UUID hợp lệ"),
    // Personal Info
    (0, express_validator_1.body)("fullName")
        .notEmpty()
        .withMessage("Họ tên không được để trống")
        .isLength({ min: 2, max: 255 })
        .withMessage("Họ tên phải từ 2-255 ký tự"),
    (0, express_validator_1.body)("dateOfBirth")
        .notEmpty()
        .withMessage("Ngày sinh không được để trống")
        .isISO8601()
        .withMessage("Ngày sinh phải là ngày hợp lệ (ISO 8601)"),
    (0, express_validator_1.body)("gender")
        .notEmpty()
        .withMessage("Giới tính không được để trống")
        .isIn(["male", "female", "other"])
        .withMessage("Giới tính không hợp lệ"),
    (0, express_validator_1.body)("nationalId")
        .notEmpty()
        .withMessage("CMND/CCCD không được để trống")
        .isLength({ min: 6, max: 20 })
        .withMessage("CMND/CCCD phải từ 6-20 ký tự")
        .matches(/^[0-9A-Za-z]+$/)
        .withMessage("CMND/CCCD chỉ được chứa chữ hoặc số"),
    (0, express_validator_1.body)("nationality")
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage("Quốc tịch phải hợp lệ nếu được cung cấp"),
    // Contact Info
    (0, express_validator_1.body)("primaryPhone")
        .notEmpty()
        .withMessage("Số điện thoại chính không được để trống")
        .custom(assertFlexiblePhone),
    (0, express_validator_1.body)("email").optional().isEmail().withMessage("Email không đúng định dạng"),
    (0, express_validator_1.body)("address.street")
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage("Địa chỉ đường/phố phải hợp lệ nếu được cung cấp"),
    (0, express_validator_1.body)("address.ward")
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage("Phường/xã phải hợp lệ nếu được cung cấp"),
    (0, express_validator_1.body)("address.district")
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage("Quận/huyện phải hợp lệ nếu được cung cấp"),
    (0, express_validator_1.body)("address.city")
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage("Thành phố không hợp lệ"),
    (0, express_validator_1.body)("address.province")
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage("Tỉnh/thành phố phải hợp lệ nếu được cung cấp"),
    (0, express_validator_1.body)("preferredContactMethod")
        .optional()
        .isIn(["phone", "email", "sms"])
        .withMessage("Phương thức liên hệ không hợp lệ"),
    // Blood Type (optional)
    (0, express_validator_1.body)("bloodType")
        .optional()
        .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        .withMessage("Nhóm máu không hợp lệ"),
    // Insurance (optional)
    (0, express_validator_1.body)("insurance.coverageType")
        .optional()
        .isIn(["BHYT", "BHTN", "private", "self_pay", "other"])
        .withMessage("Loại bảo hiểm không hợp lệ"),
    (0, express_validator_1.body)("insurance.validFrom")
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage("Ngày bắt đầu bảo hiểm phải là ngày hợp lệ"),
    (0, express_validator_1.body)("insurance.validTo")
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage("Ngày kết thúc bảo hiểm phải là ngày hợp lệ"),
    exports.handleValidationErrors,
];
/**
 * Validate get patient list request
 */
exports.validateGetPatientList = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page phải là số nguyên dương"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit phải từ 1-100"),
    (0, express_validator_1.query)("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive phải là boolean"),
    (0, express_validator_1.query)("hasInsurance")
        .optional()
        .isBoolean()
        .withMessage("hasInsurance phải là boolean"),
    (0, express_validator_1.query)("city").optional().isString().withMessage("City phải là chuỗi"),
    (0, express_validator_1.query)("province").optional().isString().withMessage("Province phải là chuỗi"),
    (0, express_validator_1.query)("sortField")
        .optional()
        .isIn(["created_at", "full_name", "date_of_birth"])
        .withMessage("sortField không hợp lệ"),
    (0, express_validator_1.query)("sortDirection")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("sortDirection phải là asc hoặc desc"),
    exports.handleValidationErrors,
];
/**
 * Validate update patient request
 */
exports.validateUpdatePatient = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    // Personal Info fields - all optional for partial update
    (0, express_validator_1.body)("fullName")
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage("Họ tên phải từ 2-255 ký tự"),
    (0, express_validator_1.body)("dateOfBirth")
        .optional()
        .isISO8601()
        .withMessage("Ngày sinh phải là ngày hợp lệ"),
    (0, express_validator_1.body)("gender")
        .optional()
        .isIn(["male", "female", "other"])
        .withMessage("Giới tính không hợp lệ"),
    (0, express_validator_1.body)("nationalId")
        .optional()
        .isLength({ min: 6, max: 20 })
        .withMessage("Số CMND/CCCD phải từ 6-20 ký tự")
        .matches(/^[0-9A-Za-z]+$/)
        .withMessage("CMND/CCCD chỉ được chứa chữ hoặc số"),
    (0, express_validator_1.body)("nationality")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Quốc tịch phải từ 2-100 ký tự"),
    (0, express_validator_1.body)("ethnicity")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Dân tộc phải từ 2-100 ký tự"),
    (0, express_validator_1.body)("occupation")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Nghề nghiệp phải từ 2-100 ký tự"),
    (0, express_validator_1.body)("maritalStatus")
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage("Tình trạng hôn nhân phải từ 2-50 ký tự"),
    // Contact Info fields
    (0, express_validator_1.body)("primaryPhone").optional().custom(assertFlexiblePhone),
    (0, express_validator_1.body)("secondaryPhone").optional().custom(assertFlexiblePhone),
    (0, express_validator_1.body)("email").optional().isEmail().withMessage("Email không đúng định dạng"),
    (0, express_validator_1.body)("preferredContactMethod")
        .optional()
        .isIn(["phone", "email", "sms"])
        .withMessage("Phương thức liên hệ không hợp lệ"),
    // Address fields
    (0, express_validator_1.body)("address.street")
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage("Địa chỉ đường phải từ 2-255 ký tự"),
    (0, express_validator_1.body)("address.ward")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Phường/Xã phải từ 2-100 ký tự"),
    (0, express_validator_1.body)("address.district")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Quận/Huyện phải từ 2-100 ký tự"),
    (0, express_validator_1.body)("address.city")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Thành phố phải từ 2-100 ký tự"),
    (0, express_validator_1.body)("address.province")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Tỉnh phải từ 2-100 ký tự"),
    (0, express_validator_1.body)("address.postalCode")
        .optional()
        .matches(/^[0-9A-Za-z-]{4,10}$/)
        .withMessage("Mã bưu điện phải từ 4-10 ký tự"),
    (0, express_validator_1.body)("address.country")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Quốc gia phải từ 2-100 ký tự"),
    // Basic Medical Info
    (0, express_validator_1.body)("bloodType")
        .optional()
        .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        .withMessage("Nhóm máu không hợp lệ"),
    (0, express_validator_1.body)("knownAllergies")
        .optional()
        .isArray()
        .withMessage("Dị ứng đã biết phải là mảng"),
    (0, express_validator_1.body)("knownAllergies.*")
        .optional()
        .isString()
        .withMessage("Dị ứng phải là chuỗi ký tự"),
    (0, express_validator_1.body)("emergencyMedicalInfo")
        .optional()
        .isString()
        .withMessage("Thông tin y tế khẩn cấp phải là chuỗi ký tự"),
    // Custom validation: at least one field must be provided
    (req, res, next) => {
        const fields = [
            "fullName",
            "dateOfBirth",
            "gender",
            "nationalId",
            "nationality",
            "ethnicity",
            "occupation",
            "maritalStatus",
            "primaryPhone",
            "secondaryPhone",
            "email",
            "preferredContactMethod",
            "bloodType",
            "knownAllergies",
            "emergencyMedicalInfo",
            "address",
        ];
        const hasAny = fields.some((field) => {
            if (field === "address") {
                return req.body.address && Object.keys(req.body.address).length > 0;
            }
            return Object.prototype.hasOwnProperty.call(req.body, field);
        });
        if (!hasAny) {
            res.status(400).json({
                message: "Ít nhất một trường phải được cung cấp để cập nhật",
            });
            return;
        }
        next();
    },
    exports.handleValidationErrors,
];
/**
 * Validate patient ID parameter
 */
exports.validatePatientId = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    exports.handleValidationErrors,
];
/**
 * Validate user ID parameter
 */
exports.validateUserId = [
    (0, express_validator_1.param)("userId")
        .notEmpty()
        .withMessage("User ID không được để trống")
        .isUUID()
        .withMessage("User ID phải là UUID hợp lệ"),
    exports.handleValidationErrors,
];
/**
 * Validate national ID parameter
 */
exports.validateNationalId = [
    (0, express_validator_1.param)("nationalId")
        .notEmpty()
        .withMessage("CMND/CCCD không được để trống")
        .isLength({ min: 6, max: 20 })
        .withMessage("CMND/CCCD phải từ 6-20 ký tự")
        .matches(/^[0-9A-Za-z]+$/)
        .withMessage("CMND/CCCD chỉ được chứa chữ hoặc số"),
    exports.handleValidationErrors,
];
/**
 * Validate BHYT number parameter
 */
exports.validateBHYTNumber = [
    (0, express_validator_1.param)("bhytNumber")
        .notEmpty()
        .withMessage("Số BHYT không được để trống")
        .isLength({ min: 5, max: 30 })
        .withMessage("Số BHYT phải từ 5-30 ký tự")
        .matches(/^[0-9A-Za-z-]+$/)
        .withMessage("Số BHYT chỉ được chứa chữ, số hoặc dấu gạch ngang"),
    exports.handleValidationErrors,
];
/**
 * Validate search patients request
 */
exports.validateSearchPatients = [
    (0, express_validator_1.query)("searchTerm")
        .notEmpty()
        .withMessage("Từ khóa tìm kiếm không được để trống")
        .isLength({ min: 2 })
        .withMessage("Từ khóa tìm kiếm phải có ít nhất 2 ký tự"),
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Số trang phải là số nguyên dương"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Số lượng kết quả phải từ 1-100"),
    exports.handleValidationErrors,
];
/**
 * Validate filter patients request
 */
exports.validateFilterPatients = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Số trang phải là số nguyên dương"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Số lượng kết quả phải từ 1-100"),
    (0, express_validator_1.query)("sortDirection")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("Hướng sắp xếp phải là asc hoặc desc"),
    exports.handleValidationErrors,
];
/**
 * Validate match patients request
 */
exports.validateMatchPatients = [
    (0, express_validator_1.body)("fullName")
        .optional()
        .isLength({ min: 2 })
        .withMessage("Họ tên phải có ít nhất 2 ký tự"),
    (0, express_validator_1.body)("dateOfBirth")
        .optional()
        .isISO8601()
        .withMessage("Ngày sinh phải là ngày hợp lệ"),
    (0, express_validator_1.body)("nationalId")
        .optional()
        .isLength({ min: 6, max: 20 })
        .withMessage("CMND/CCCD phải từ 6-20 ký tự")
        .matches(/^[0-9A-Za-z]+$/)
        .withMessage("CMND/CCCD chỉ được chứa chữ hoặc số"),
    (0, express_validator_1.body)("primaryPhone").optional().custom(assertFlexiblePhone),
    (0, express_validator_1.body)("email").optional().isEmail().withMessage("Email không đúng định dạng"),
    (0, express_validator_1.body)("limit")
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage("Số lượng kết quả phải từ 1-50"),
    exports.handleValidationErrors,
];
/**
 * Validate merge patients request
 */
exports.validateMergePatients = [
    (0, express_validator_1.body)("duplicatePatientId")
        .notEmpty()
        .withMessage("Duplicate Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.body)("masterPatientId")
        .notEmpty()
        .withMessage("Master Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.body)("reason")
        .notEmpty()
        .withMessage("Lý do gộp không được để trống")
        .isLength({ min: 10 })
        .withMessage("Lý do gộp phải có ít nhất 10 ký tự"),
    exports.handleValidationErrors,
];
/**
 * Validate link patients request
 */
exports.validateLinkPatients = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.body)("otherPatientId")
        .notEmpty()
        .withMessage("Other Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.body)("linkType")
        .notEmpty()
        .withMessage("Link type không được để trống")
        .isIn(["refer", "seealso"])
        .withMessage("Link type phải là refer hoặc seealso"),
    exports.handleValidationErrors,
];
/**
 * Validate add emergency contact request
 */
exports.validateAddEmergencyContact = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage("Tên người liên hệ không được để trống")
        .isLength({ min: 2, max: 255 })
        .withMessage("Tên người liên hệ phải từ 2-255 ký tự"),
    (0, express_validator_1.body)("relationship")
        .notEmpty()
        .withMessage("Mối quan hệ không được để trống"),
    (0, express_validator_1.body)("primaryPhone")
        .notEmpty()
        .withMessage("Số điện thoại chính không được để trống")
        .custom(assertFlexiblePhone),
    (0, express_validator_1.body)("secondaryPhone")
        .optional({ checkFalsy: true })
        .custom(assertFlexiblePhone),
    (0, express_validator_1.body)("email")
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage("Email không đúng định dạng"),
    exports.handleValidationErrors,
];
/**
 * Validate grant consent request
 */
exports.validateGrantConsent = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.body)("consentType").notEmpty().withMessage("Loại đồng ý không được để trống"),
    (0, express_validator_1.body)("expiresAt")
        .optional()
        .isISO8601()
        .withMessage("Ngày hết hạn phải là ngày hợp lệ"),
    exports.handleValidationErrors,
];
exports.validateAddInsuranceInfo = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.body)("provider")
        .notEmpty()
        .withMessage("Tên nhà cung cấp bảo hiểm không được để trống")
        .isLength({ min: 2, max: 255 })
        .withMessage("Tên nhà cung cấp bảo hiểm phải từ 2-255 ký tự"),
    (0, express_validator_1.body)("policyNumber")
        .optional({ checkFalsy: true })
        .isLength({ min: 3, max: 50 })
        .withMessage("Số hợp đồng bảo hiểm phải từ 3-50 ký tự"),
    (0, express_validator_1.body)("coverageType")
        .optional({ checkFalsy: true })
        .isIn(["BHYT", "BHTN", "private", "self_pay", "other"])
        .withMessage("Loại bảo hiểm không hợp lệ"),
    (0, express_validator_1.body)("validFrom")
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage("Ngày bắt đầu bảo hiểm phải là ngày hợp lệ"),
    (0, express_validator_1.body)("validTo")
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage("Ngày kết thúc bảo hiểm phải là ngày hợp lệ"),
    (0, express_validator_1.body)("isVietnameseInsurance")
        .optional()
        .isBoolean()
        .withMessage("Trường isVietnameseInsurance phải là boolean"),
    exports.handleValidationErrors,
];
/**
 * Validate revoke consent request
 */
exports.validateRevokeConsent = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.param)("consentId")
        .notEmpty()
        .withMessage("Consent ID không được để trống")
        .isUUID()
        .withMessage("Consent ID phải là UUID hợp lệ"),
    exports.handleValidationErrors,
];
/**
 * Validate update emergency contact request
 */
exports.validateUpdateEmergencyContact = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.param)("contactId")
        .notEmpty()
        .withMessage("Contact ID không được để trống")
        .isUUID()
        .withMessage("Contact ID phải là UUID hợp lệ"),
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage("Tên người liên hệ không được để trống")
        .isLength({ min: 2, max: 255 })
        .withMessage("Tên phải từ 2-255 ký tự"),
    (0, express_validator_1.body)("relationship")
        .notEmpty()
        .withMessage("Mối quan hệ không được để trống")
        .isLength({ min: 2, max: 100 })
        .withMessage("Mối quan hệ phải từ 2-100 ký tự"),
    (0, express_validator_1.body)("primaryPhone")
        .notEmpty()
        .withMessage("Số điện thoại chính không được để trống")
        .custom(assertFlexiblePhone),
    (0, express_validator_1.body)("secondaryPhone").optional().custom(assertFlexiblePhone),
    (0, express_validator_1.body)("email").optional().isEmail().withMessage("Email không hợp lệ"),
    exports.handleValidationErrors,
];
/**
 * Validate remove emergency contact request
 */
exports.validateRemoveEmergencyContact = [
    (0, express_validator_1.param)("patientId")
        .notEmpty()
        .withMessage("Patient ID không được để trống")
        .custom(assertFlexiblePatientId),
    (0, express_validator_1.param)("contactId")
        .notEmpty()
        .withMessage("Contact ID không được để trống")
        .isUUID()
        .withMessage("Contact ID phải là UUID hợp lệ"),
    exports.handleValidationErrors,
];
//# sourceMappingURL=ValidationMiddleware.js.map