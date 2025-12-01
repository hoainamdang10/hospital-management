/**
 * Validation Middleware
 * Request validation using express-validator
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */

import {
  body,
  param,
  query,
  validationResult,
  ValidationError,
} from "express-validator";
import { Request, Response, NextFunction } from "express";

const PATIENT_ID_REGEX = /^PAT-\d{6}-\d{3}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FLEXIBLE_PHONE_REGEX = /^\+?[0-9]{6,15}$/;

const assertFlexiblePatientId = (value: string): true => {
  if (
    !PATIENT_ID_REGEX.test(value) &&
    !UUID_REGEX.test(value) &&
    (value.length < 6 || value.length > 50)
  ) {
    throw new Error(
      "Patient ID phải hợp lệ (PAT-YYYYMM-XXX, UUID hoặc chuỗi 6-50 ký tự)",
    );
  }
  return true;
};

const assertFlexiblePhone = (value: string): true => {
  const normalized = value.replace(/[\s-]/g, "");
  if (!FLEXIBLE_PHONE_REGEX.test(normalized)) {
    throw new Error("Số điện thoại phải có 6-15 chữ số");
  }
  return true;
};

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err: ValidationError) => ({
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

/**
 * Validate register patient request
 */
export const validateRegisterPatient = [
  // User ID
  body("userId")
    .notEmpty()
    .withMessage("User ID không được để trống")
    .isUUID()
    .withMessage("User ID phải là UUID hợp lệ"),

  // Personal Info
  body("fullName")
    .notEmpty()
    .withMessage("Họ tên không được để trống")
    .isLength({ min: 2, max: 255 })
    .withMessage("Họ tên phải từ 2-255 ký tự"),

  body("dateOfBirth")
    .notEmpty()
    .withMessage("Ngày sinh không được để trống")
    .isISO8601()
    .withMessage("Ngày sinh phải là ngày hợp lệ (ISO 8601)"),

  body("gender")
    .notEmpty()
    .withMessage("Giới tính không được để trống")
    .isIn(["male", "female", "other"])
    .withMessage("Giới tính không hợp lệ"),

  body("nationalId")
    .notEmpty()
    .withMessage("CMND/CCCD không được để trống")
    .isLength({ min: 6, max: 20 })
    .withMessage("CMND/CCCD phải từ 6-20 ký tự")
    .matches(/^[0-9A-Za-z]+$/)
    .withMessage("CMND/CCCD chỉ được chứa chữ hoặc số"),

  body("nationality")
    .optional({ checkFalsy: true })
    .isLength({ min: 2 })
    .withMessage("Quốc tịch phải hợp lệ nếu được cung cấp"),

  // Contact Info
  body("primaryPhone")
    .notEmpty()
    .withMessage("Số điện thoại chính không được để trống")
    .custom(assertFlexiblePhone),

  body("email").optional().isEmail().withMessage("Email không đúng định dạng"),

  body("address.street")
    .optional({ checkFalsy: true })
    .isLength({ min: 2 })
    .withMessage("Địa chỉ đường/phố phải hợp lệ nếu được cung cấp"),

  body("address.ward")
    .optional({ checkFalsy: true })
    .isLength({ min: 2 })
    .withMessage("Phường/xã phải hợp lệ nếu được cung cấp"),

  body("address.district")
    .optional({ checkFalsy: true })
    .isLength({ min: 2 })
    .withMessage("Quận/huyện phải hợp lệ nếu được cung cấp"),

  body("address.city")
    .optional({ checkFalsy: true })
    .isLength({ min: 2 })
    .withMessage("Thành phố không hợp lệ"),

  body("address.province")
    .optional({ checkFalsy: true })
    .isLength({ min: 2 })
    .withMessage("Tỉnh/thành phố phải hợp lệ nếu được cung cấp"),

  body("preferredContactMethod")
    .optional()
    .isIn(["phone", "email", "sms"])
    .withMessage("Phương thức liên hệ không hợp lệ"),

  // Blood Type (optional)
  body("bloodType")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Nhóm máu không hợp lệ"),

  // Insurance (optional)
  body("insurance.coverageType")
    .optional()
    .isIn(["BHYT", "BHTN", "private", "self_pay", "other"])
    .withMessage("Loại bảo hiểm không hợp lệ"),

  body("insurance.validFrom")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Ngày bắt đầu bảo hiểm phải là ngày hợp lệ"),

  body("insurance.validTo")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Ngày kết thúc bảo hiểm phải là ngày hợp lệ"),

  handleValidationErrors,
];

/**
 * Validate get patient list request
 */
export const validateGetPatientList = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit phải từ 1-100"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive phải là boolean"),

  query("hasInsurance")
    .optional()
    .isBoolean()
    .withMessage("hasInsurance phải là boolean"),

  query("city").optional().isString().withMessage("City phải là chuỗi"),

  query("province").optional().isString().withMessage("Province phải là chuỗi"),

  query("sortField")
    .optional()
    .isIn(["created_at", "full_name", "date_of_birth"])
    .withMessage("sortField không hợp lệ"),

  query("sortDirection")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortDirection phải là asc hoặc desc"),

  handleValidationErrors,
];

/**
 * Validate update patient request
 */
export const validateUpdatePatient = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  // Personal Info fields - all optional for partial update
  body("fullName")
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage("Họ tên phải từ 2-255 ký tự"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Ngày sinh phải là ngày hợp lệ"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Giới tính không hợp lệ"),

  body("nationalId")
    .optional()
    .isLength({ min: 6, max: 20 })
    .withMessage("Số CMND/CCCD phải từ 6-20 ký tự")
    .matches(/^[0-9A-Za-z]+$/)
    .withMessage("CMND/CCCD chỉ được chứa chữ hoặc số"),

  body("nationality")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Quốc tịch phải từ 2-100 ký tự"),

  body("ethnicity")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Dân tộc phải từ 2-100 ký tự"),

  body("occupation")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nghề nghiệp phải từ 2-100 ký tự"),

  body("maritalStatus")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Tình trạng hôn nhân phải từ 2-50 ký tự"),

  // Contact Info fields
  body("primaryPhone").optional().custom(assertFlexiblePhone),

  body("secondaryPhone").optional().custom(assertFlexiblePhone),

  body("email").optional().isEmail().withMessage("Email không đúng định dạng"),

  body("preferredContactMethod")
    .optional()
    .isIn(["phone", "email", "sms"])
    .withMessage("Phương thức liên hệ không hợp lệ"),

  // Address fields
  body("address.street")
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage("Địa chỉ đường phải từ 2-255 ký tự"),

  body("address.ward")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Phường/Xã phải từ 2-100 ký tự"),

  body("address.district")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Quận/Huyện phải từ 2-100 ký tự"),

  body("address.city")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Thành phố phải từ 2-100 ký tự"),

  body("address.province")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tỉnh phải từ 2-100 ký tự"),

  body("address.postalCode")
    .optional()
    .matches(/^[0-9A-Za-z-]{4,10}$/)
    .withMessage("Mã bưu điện phải từ 4-10 ký tự"),

  body("address.country")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Quốc gia phải từ 2-100 ký tự"),

  // Basic Medical Info
  body("bloodType")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Nhóm máu không hợp lệ"),

  body("knownAllergies")
    .optional()
    .isArray()
    .withMessage("Dị ứng đã biết phải là mảng"),

  body("knownAllergies.*")
    .optional()
    .isString()
    .withMessage("Dị ứng phải là chuỗi ký tự"),

  body("emergencyMedicalInfo")
    .optional()
    .isString()
    .withMessage("Thông tin y tế khẩn cấp phải là chuỗi ký tự"),

  // Custom validation: at least one field must be provided
  (req: Request, res: Response, next: NextFunction): void => {
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

  handleValidationErrors,
];

/**
 * Validate patient ID parameter
 */
export const validatePatientId = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  handleValidationErrors,
];

/**
 * Validate user ID parameter
 */
export const validateUserId = [
  param("userId")
    .notEmpty()
    .withMessage("User ID không được để trống")
    .isUUID()
    .withMessage("User ID phải là UUID hợp lệ"),

  handleValidationErrors,
];

/**
 * Validate national ID parameter
 */
export const validateNationalId = [
  param("nationalId")
    .notEmpty()
    .withMessage("CMND/CCCD không được để trống")
    .isLength({ min: 6, max: 20 })
    .withMessage("CMND/CCCD phải từ 6-20 ký tự")
    .matches(/^[0-9A-Za-z]+$/)
    .withMessage("CMND/CCCD chỉ được chứa chữ hoặc số"),

  handleValidationErrors,
];

/**
 * Validate BHYT number parameter
 */
export const validateBHYTNumber = [
  param("bhytNumber")
    .notEmpty()
    .withMessage("Số BHYT không được để trống")
    .isLength({ min: 5, max: 30 })
    .withMessage("Số BHYT phải từ 5-30 ký tự")
    .matches(/^[0-9A-Za-z-]+$/)
    .withMessage("Số BHYT chỉ được chứa chữ, số hoặc dấu gạch ngang"),

  handleValidationErrors,
];

/**
 * Validate search patients request
 */
export const validateSearchPatients = [
  query("searchTerm")
    .notEmpty()
    .withMessage("Từ khóa tìm kiếm không được để trống")
    .isLength({ min: 2 })
    .withMessage("Từ khóa tìm kiếm phải có ít nhất 2 ký tự"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng kết quả phải từ 1-100"),

  handleValidationErrors,
];

/**
 * Validate filter patients request
 */
export const validateFilterPatients = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng kết quả phải từ 1-100"),

  query("sortDirection")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Hướng sắp xếp phải là asc hoặc desc"),

  handleValidationErrors,
];

/**
 * Validate match patients request
 */
export const validateMatchPatients = [
  body("fullName")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Họ tên phải có ít nhất 2 ký tự"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Ngày sinh phải là ngày hợp lệ"),

  body("nationalId")
    .optional()
    .isLength({ min: 6, max: 20 })
    .withMessage("CMND/CCCD phải từ 6-20 ký tự")
    .matches(/^[0-9A-Za-z]+$/)
    .withMessage("CMND/CCCD chỉ được chứa chữ hoặc số"),

  body("primaryPhone").optional().custom(assertFlexiblePhone),

  body("email").optional().isEmail().withMessage("Email không đúng định dạng"),

  body("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Số lượng kết quả phải từ 1-50"),

  handleValidationErrors,
];

/**
 * Validate merge patients request
 */
export const validateMergePatients = [
  body("duplicatePatientId")
    .notEmpty()
    .withMessage("Duplicate Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  body("masterPatientId")
    .notEmpty()
    .withMessage("Master Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  body("reason")
    .notEmpty()
    .withMessage("Lý do gộp không được để trống")
    .isLength({ min: 10 })
    .withMessage("Lý do gộp phải có ít nhất 10 ký tự"),

  handleValidationErrors,
];

/**
 * Validate link patients request
 */
export const validateLinkPatients = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  body("otherPatientId")
    .notEmpty()
    .withMessage("Other Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  body("linkType")
    .notEmpty()
    .withMessage("Link type không được để trống")
    .isIn(["refer", "seealso"])
    .withMessage("Link type phải là refer hoặc seealso"),

  handleValidationErrors,
];

/**
 * Validate add emergency contact request
 */
export const validateAddEmergencyContact = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  body("name")
    .notEmpty()
    .withMessage("Tên người liên hệ không được để trống")
    .isLength({ min: 2, max: 255 })
    .withMessage("Tên người liên hệ phải từ 2-255 ký tự"),

  body("relationship")
    .notEmpty()
    .withMessage("Mối quan hệ không được để trống"),

  body("primaryPhone")
    .notEmpty()
    .withMessage("Số điện thoại chính không được để trống")
    .custom(assertFlexiblePhone),

  body("secondaryPhone")
    .optional({ checkFalsy: true })
    .custom(assertFlexiblePhone),

  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Email không đúng định dạng"),

  handleValidationErrors,
];

/**
 * Validate grant consent request
 */
export const validateGrantConsent = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  body("consentType").notEmpty().withMessage("Loại đồng ý không được để trống"),

  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Ngày hết hạn phải là ngày hợp lệ"),

  handleValidationErrors,
];

export const validateAddInsuranceInfo = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  body("provider")
    .notEmpty()
    .withMessage("Tên nhà cung cấp bảo hiểm không được để trống")
    .isLength({ min: 2, max: 255 })
    .withMessage("Tên nhà cung cấp bảo hiểm phải từ 2-255 ký tự"),

  body("policyNumber")
    .optional({ checkFalsy: true })
    .isLength({ min: 3, max: 50 })
    .withMessage("Số hợp đồng bảo hiểm phải từ 3-50 ký tự"),

  body("coverageType")
    .optional({ checkFalsy: true })
    .isIn(["BHYT", "BHTN", "private", "self_pay", "other"])
    .withMessage("Loại bảo hiểm không hợp lệ"),

  body("validFrom")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Ngày bắt đầu bảo hiểm phải là ngày hợp lệ"),

  body("validTo")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Ngày kết thúc bảo hiểm phải là ngày hợp lệ"),

  body("isVietnameseInsurance")
    .optional()
    .isBoolean()
    .withMessage("Trường isVietnameseInsurance phải là boolean"),

  handleValidationErrors,
];

/**
 * Validate revoke consent request
 */
export const validateRevokeConsent = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  param("consentId")
    .notEmpty()
    .withMessage("Consent ID không được để trống")
    .isUUID()
    .withMessage("Consent ID phải là UUID hợp lệ"),

  handleValidationErrors,
];

/**
 * Validate update emergency contact request
 */
export const validateUpdateEmergencyContact = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  param("contactId")
    .notEmpty()
    .withMessage("Contact ID không được để trống")
    .isUUID()
    .withMessage("Contact ID phải là UUID hợp lệ"),

  body("name")
    .notEmpty()
    .withMessage("Tên người liên hệ không được để trống")
    .isLength({ min: 2, max: 255 })
    .withMessage("Tên phải từ 2-255 ký tự"),

  body("relationship")
    .notEmpty()
    .withMessage("Mối quan hệ không được để trống")
    .isLength({ min: 2, max: 100 })
    .withMessage("Mối quan hệ phải từ 2-100 ký tự"),

  body("primaryPhone")
    .notEmpty()
    .withMessage("Số điện thoại chính không được để trống")
    .custom(assertFlexiblePhone),

  body("secondaryPhone").optional().custom(assertFlexiblePhone),

  body("email").optional().isEmail().withMessage("Email không hợp lệ"),

  handleValidationErrors,
];

/**
 * Validate remove emergency contact request
 */
export const validateRemoveEmergencyContact = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID không được để trống")
    .custom(assertFlexiblePatientId),

  param("contactId")
    .notEmpty()
    .withMessage("Contact ID không được để trống")
    .isUUID()
    .withMessage("Contact ID phải là UUID hợp lệ"),

  handleValidationErrors,
];
