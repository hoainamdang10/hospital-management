/**
 * Validation Middleware
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Input Validation, Security Best Practices
 */

import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

// ==================== VALIDATION ERROR HANDLER ====================

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: errors.array().map((err: any) => ({
        field: "param" in err ? err.param : "unknown",
        message: err.msg,
      })),
    });
    return;
  }

  next();
};

// ==================== REGISTER STAFF VALIDATION ====================

export const validateRegisterStaff = [
  // User ID
  body("userId")
    .notEmpty()
    .withMessage("User ID không được để trống")
    .isUUID()
    .withMessage("User ID phải là UUID hợp lệ"),

  // Staff Type
  body("staffType")
    .notEmpty()
    .withMessage("Loại nhân viên không được để trống")
    .isIn([
      "doctor",
      "nurse",
      "technician",
      "pharmacist",
      "therapist",
      "admin",
      "receptionist",
    ])
    .withMessage("Loại nhân viên không hợp lệ"),

  // Personal Info
  body("personalInfo.fullName")
    .notEmpty()
    .withMessage("Họ tên không được để trống")
    .isLength({ min: 2, max: 255 })
    .withMessage("Họ tên phải từ 2-255 ký tự"),

  body("personalInfo.dateOfBirth")
    .notEmpty()
    .withMessage("Ngày sinh không được để trống")
    .isISO8601()
    .withMessage("Ngày sinh phải là ngày hợp lệ (ISO 8601)"),

  body("personalInfo.gender")
    .notEmpty()
    .withMessage("Giới tính không được để trống")
    .isIn(["male", "female", "other"])
    .withMessage("Giới tính không hợp lệ"),

  body("personalInfo.nationalId")
    .notEmpty()
    .withMessage("CMND/CCCD không được để trống")
    .matches(/^\d{9}$|^\d{12}$/)
    .withMessage("CMND/CCCD phải là 9 hoặc 12 chữ số"),

  body("personalInfo.phoneNumber")
    .notEmpty()
    .withMessage("Số điện thoại không được để trống")
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage("Số điện thoại không đúng định dạng"),

  body("personalInfo.email")
    .optional()
    .isEmail()
    .withMessage("Email không đúng định dạng"),

  // Professional Info
  body("professionalInfo.title")
    .notEmpty()
    .withMessage("Chức danh không được để trống"),

  body("professionalInfo.department")
    .notEmpty()
    .withMessage("Khoa không được để trống"),

  body("professionalInfo.position")
    .notEmpty()
    .withMessage("Vị trí không được để trống"),

  body("professionalInfo.education")
    .optional({ checkFalsy: true })
    .isArray({ min: 1 })
    .withMessage("Bằng cấp phải là mảng nếu được cung cấp"),

  body("professionalInfo.languages")
    .optional({ checkFalsy: true })
    .isArray({ min: 1 })
    .withMessage("Ngôn ngữ phải là mảng nếu được cung cấp"),

  // Work Schedule
  body("workSchedule.workingDays")
    .optional({ checkFalsy: true })
    .isArray({ min: 1 })
    .withMessage("Ngày làm việc phải là mảng hợp lệ nếu được cung cấp"),

  body("workSchedule.workingHours.start")
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Giờ bắt đầu phải có định dạng HH:mm"),

  body("workSchedule.workingHours.end")
    .optional({ checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Giờ kết thúc phải có định dạng HH:mm"),

  body("workSchedule.timeZone")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Múi giờ phải hợp lệ nếu được cung cấp"),

  body("workSchedule.isFlexible")
    .optional()
    .isBoolean()
    .withMessage("isFlexible phải là boolean nếu được cung cấp"),

  // License & Employment
  body("licenseNumber")
    .notEmpty()
    .withMessage("Số giấy phép hành nghề không được để trống"),

  body("employmentType")
    .notEmpty()
    .withMessage("Loại hợp đồng không được để trống")
    .isIn(["full_time", "part_time", "contract", "intern", "volunteer"])
    .withMessage("Loại hợp đồng không hợp lệ"),

  body("hireDate")
    .notEmpty()
    .withMessage("Ngày tuyển dụng không được để trống")
    .isISO8601()
    .withMessage("Ngày tuyển dụng phải là ngày hợp lệ"),

  body("yearsOfExperience")
    .notEmpty()
    .withMessage("Số năm kinh nghiệm không được để trống")
    .isInt({ min: 0, max: 50 })
    .withMessage("Số năm kinh nghiệm phải từ 0-50"),

  handleValidationErrors,
];

// ==================== CREDENTIAL MANAGEMENT VALIDATION ====================

export const validateAddCredential = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage(
      "Staff ID phải có định dạng {TYPE}-{DEPT}-YYYYMM-XXX (ví dụ: DOC-CARD-202501-001)",
    ),

  body("credentialNumber")
    .notEmpty()
    .withMessage("Số chứng chỉ không được để trống")
    .isString()
    .withMessage("Số chứng chỉ phải là chuỗi"),

  body("credentialType")
    .notEmpty()
    .withMessage("Loại chứng chỉ không được để trống")
    .isIn(["license", "certificate", "registration"])
    .withMessage(
      "Loại chứng chỉ không hợp lệ (license, certificate, registration)",
    ),

  body("issuingAuthority")
    .notEmpty()
    .withMessage("Cơ quan cấp không được để trống")
    .isString()
    .withMessage("Cơ quan cấp phải là chuỗi"),

  body("issueDate")
    .notEmpty()
    .withMessage("Ngày cấp không được để trống")
    .isISO8601()
    .withMessage("Ngày cấp phải là ngày hợp lệ"),

  body("expiryDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày hết hạn phải là ngày hợp lệ"),

  handleValidationErrors,
];

export const validateRemoveCredential = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID phải có định dạng {TYPE}-{DEPT}-YYYYMM-XXX"),

  param("credentialNumber")
    .notEmpty()
    .withMessage("Số chứng chỉ không được để trống")
    .isString()
    .withMessage("Số chứng chỉ phải là chuỗi"),

  body("reason").optional().isString().withMessage("Lý do phải là chuỗi"),

  handleValidationErrors,
];

export const validateRenewCredential = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID phải có định dạng {TYPE}-{DEPT}-YYYYMM-XXX"),

  param("credentialNumber")
    .notEmpty()
    .withMessage("Số chứng chỉ không được để trống")
    .isString()
    .withMessage("Số chứng chỉ phải là chuỗi"),

  body("newExpiryDate")
    .notEmpty()
    .withMessage("Ngày hết hạn mới không được để trống")
    .isISO8601()
    .withMessage("Ngày hết hạn mới phải là ngày hợp lệ"),

  handleValidationErrors,
];

export const validateGetExpiringCredentials = [
  query("daysThreshold")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Ngưỡng số ngày phải từ 1 đến 365"),

  query("staffType")
    .optional()
    .isIn([
      "doctor",
      "nurse",
      "technician",
      "pharmacist",
      "therapist",
      "admin",
      "receptionist",
    ])
    .withMessage("Loại nhân viên không hợp lệ"),

  query("departmentId")
    .optional()
    .isString()
    .withMessage("Department ID phải là chuỗi"),

  handleValidationErrors,
];

// ==================== STATUS MANAGEMENT VALIDATION ====================

export const validateActivateStaff = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID phải có định dạng {TYPE}-{DEPT}-YYYYMM-XXX"),

  handleValidationErrors,
];

export const validateSuspendStaff = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID phải có định dạng {TYPE}-{DEPT}-YYYYMM-XXX"),

  body("reason")
    .notEmpty()
    .withMessage("Lý do tạm ngưng không được để trống")
    .isString()
    .withMessage("Lý do phải là chuỗi")
    .isLength({ min: 10 })
    .withMessage("Lý do phải có ít nhất 10 ký tự"),

  body("suspensionStartDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày bắt đầu tạm ngưng phải là ngày hợp lệ"),

  body("suspensionEndDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày kết thúc tạm ngưng phải là ngày hợp lệ"),

  handleValidationErrors,
];

export const validateReactivateStaff = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID phải có định dạng {TYPE}-{DEPT}-YYYYMM-XXX"),

  handleValidationErrors,
];

export const validateTerminateStaff = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID phải có định dạng {TYPE}-{DEPT}-YYYYMM-XXX"),

  body("reason")
    .notEmpty()
    .withMessage("Lý do chấm dứt hợp đồng không được để trống")
    .isString()
    .withMessage("Lý do phải là chuỗi")
    .isLength({ min: 10 })
    .withMessage("Lý do phải có ít nhất 10 ký tự"),

  body("terminationDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày chấm dứt hợp đồng phải là ngày hợp lệ"),

  handleValidationErrors,
];

export const validateUpdateEmploymentStatus = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID phải có định dạng {TYPE}-{DEPT}-YYYYMM-XXX"),

  body("employmentType")
    .notEmpty()
    .withMessage("Loại hình làm việc không được để trống")
    .isIn(["full_time", "part_time", "contract", "intern", "volunteer"])
    .withMessage("Loại hình làm việc không hợp lệ"),

  body("contractEndDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày kết thúc hợp đồng phải là ngày hợp lệ"),

  handleValidationErrors,
];

// ==================== UPDATE STAFF INFO VALIDATION ====================

export const validateUpdateStaffInfo = [
  body("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID không đúng định dạng ({TYPE}-{DEPT}-YYYYMM-XXX)"),

  body("personalInfo.phoneNumber")
    .optional()
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage("Số điện thoại không đúng định dạng"),

  body("personalInfo.email")
    .optional()
    .isEmail()
    .withMessage("Email không đúng định dạng"),

  body("consultationFee")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Phí khám phải là số nguyên dương"),

  handleValidationErrors,
];

// ==================== UPDATE STAFF STATUS VALIDATION ====================

export const validateUpdateStaffStatus = [
  body("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID không đúng định dạng"),

  body("status")
    .notEmpty()
    .withMessage("Trạng thái không được để trống")
    .isIn(["active", "on-leave", "suspended", "terminated"])
    .withMessage("Trạng thái không hợp lệ"),

  handleValidationErrors,
];

// ==================== PARAMETER VALIDATION ====================

export const validateStaffId = [
  param("staffId")
    .notEmpty()
    .withMessage("Staff ID không được để trống")
    .matches(/^[A-Z]{3,5}-[A-Z]{3,5}-\d{6}-\d{2,3}$/)
    .withMessage("Staff ID không đúng định dạng ({TYPE}-{DEPT}-YYYYMM-XXX)"),

  handleValidationErrors,
];

export const validateUserId = [
  param("userId")
    .notEmpty()
    .withMessage("User ID không được để trống")
    .isUUID()
    .withMessage("User ID phải là UUID hợp lệ"),

  handleValidationErrors,
];

export const validateLicenseNumber = [
  param("licenseNumber")
    .notEmpty()
    .withMessage("Số giấy phép không được để trống"),

  handleValidationErrors,
];

// ==================== SEARCH VALIDATION ====================

export const validateSearchStaff = [
  query("searchTerm")
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 120 })
    .withMessage("Từ khóa tìm kiếm phải từ 2-120 ký tự"),

  query("staffType")
    .optional()
    .isIn([
      "doctor",
      "nurse",
      "technician",
      "pharmacist",
      "therapist",
      "admin",
      "receptionist",
    ])
    .withMessage("Loại nhân viên không hợp lệ"),

  query("status")
    .optional()
    .isIn(["active", "inactive", "on-leave", "suspended", "terminated"])
    .withMessage("Trạng thái không hợp lệ"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive phải là boolean"),

  query("isAcceptingNewPatients")
    .optional()
    .isBoolean()
    .withMessage("isAcceptingNewPatients phải là boolean"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng phải từ 1-100"),

  handleValidationErrors,
];

// ==================== GET STAFF LIST VALIDATION ====================

export const validateGetStaffList = [
  query("staffType")
    .optional()
    .isIn([
      "doctor",
      "nurse",
      "technician",
      "pharmacist",
      "therapist",
      "admin",
      "receptionist",
    ])
    .withMessage("Loại nhân viên không hợp lệ"),

  query("departmentId")
    .optional()
    .isUUID()
    .withMessage("Department ID phải là UUID hợp lệ"),

  query("status")
    .optional()
    .isIn(["active", "inactive", "on-leave", "suspended", "terminated"])
    .withMessage("Trạng thái không hợp lệ"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive phải là boolean"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Số trang phải là số nguyên dương"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Số lượng phải từ 1-100"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "lastName", "staffId"])
    .withMessage("Trường sắp xếp không hợp lệ"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Thứ tự sắp xếp phải là asc hoặc desc"),

  handleValidationErrors,
];

// ==================== ASSIGN DEPARTMENT VALIDATION ====================

export const validateAssignDepartment = [
  body("staffId")
    .optional()
    .matches(/^[A-Z]{3}-[A-Z]{3,5}-\d{6}-\d{3}$/)
    .withMessage("Staff ID không đúng định dạng"),

  body("departmentId")
    .notEmpty()
    .withMessage("Department ID không được để trống"),

  body("departmentName").notEmpty().withMessage("Tên khoa không được để trống"),

  body("role").notEmpty().withMessage("Vai trò không được để trống"),

  body("isPrimary").isBoolean().withMessage("isPrimary phải là boolean"),

  body("startDate")
    .notEmpty()
    .withMessage("Ngày bắt đầu không được để trống")
    .isISO8601()
    .withMessage("Ngày bắt đầu phải là ngày hợp lệ"),

  handleValidationErrors,
];

// ==================== UPDATE SCHEDULE VALIDATION ====================

export const validateUpdateSchedule = [
  body("workSchedule")
    .notEmpty()
    .withMessage("Lịch làm việc không được để trống")
    .isObject()
    .withMessage("Lịch làm việc phải là object"),

  body("workSchedule.workingDays")
    .isArray({ min: 1 })
    .withMessage("Ngày làm việc phải là mảng và có ít nhất 1 ngày")
    .custom((value: string[]) => {
      const validDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      return value.every((day) => validDays.includes(day.toLowerCase()));
    })
    .withMessage("Ngày làm việc không hợp lệ"),

  body("workSchedule.workingHours")
    .notEmpty()
    .withMessage("Giờ làm việc không được để trống")
    .isObject()
    .withMessage("Giờ làm việc phải là object"),

  body("workSchedule.workingHours.start")
    .notEmpty()
    .withMessage("Giờ bắt đầu không được để trống")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Giờ bắt đầu phải có định dạng HH:mm"),

  body("workSchedule.workingHours.end")
    .notEmpty()
    .withMessage("Giờ kết thúc không được để trống")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Giờ kết thúc phải có định dạng HH:mm"),

  body("workSchedule.timeZone")
    .notEmpty()
    .withMessage("Múi giờ không được để trống")
    .isString()
    .withMessage("Múi giờ phải là chuỗi"),

  body("workSchedule.isFlexible")
    .isBoolean()
    .withMessage("isFlexible phải là boolean"),

  body("effectiveDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày hiệu lực phải là ngày hợp lệ"),

  handleValidationErrors,
];

// ==================== SELF UPDATE STAFF INFO (DOCTOR) ====================
// Cho phép bác sĩ tự cập nhật một số trường an toàn trên hồ sơ của mình
export const validateSelfUpdateStaffInfo = [
  body("personalInfo")
    .optional()
    .isObject()
    .withMessage("personalInfo phải là object"),
  body("personalInfo.fullName")
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage("Họ tên phải từ 2-255 ký tự"),
  body("personalInfo.phoneNumber")
    .optional()
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage("Số điện thoại không đúng định dạng"),
  body("personalInfo.address")
    .optional()
    .isObject()
    .withMessage("Địa chỉ phải là object nếu được cung cấp"),

  body("professionalInfo")
    .optional()
    .isObject()
    .withMessage("professionalInfo phải là object"),
  body("professionalInfo.title")
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage("Chức danh phải từ 2-255 ký tự"),
  body("professionalInfo.position")
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage("Vị trí phải từ 2-255 ký tự"),
  body("professionalInfo.education")
    .optional({ checkFalsy: true })
    .isArray({ min: 1 })
    .withMessage("Bằng cấp phải là mảng nếu được cung cấp"),
  body("professionalInfo.languages")
    .optional({ checkFalsy: true })
    .isArray({ min: 1 })
    .withMessage("Ngôn ngữ phải là mảng nếu được cung cấp"),

  handleValidationErrors,
];
