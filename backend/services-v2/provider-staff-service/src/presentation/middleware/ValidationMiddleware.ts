/**
 * Validation Middleware
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Input Validation, Security Best Practices
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

// ==================== VALIDATION ERROR HANDLER ====================

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors: errors.array().map(err => ({
        field: 'param' in err ? err.param : 'unknown',
        message: err.msg
      }))
    });
    return;
  }
  
  next();
};

// ==================== REGISTER STAFF VALIDATION ====================

export const validateRegisterStaff: ValidationChain[] = [
  // User ID
  body('userId')
    .notEmpty().withMessage('User ID không được để trống')
    .isUUID().withMessage('User ID phải là UUID hợp lệ'),

  // Staff Type
  body('staffType')
    .notEmpty().withMessage('Loại nhân viên không được để trống')
    .isIn(['doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist'])
    .withMessage('Loại nhân viên không hợp lệ'),

  // Personal Info
  body('personalInfo.fullName')
    .notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 255 }).withMessage('Họ tên phải từ 2-255 ký tự'),

  body('personalInfo.dateOfBirth')
    .notEmpty().withMessage('Ngày sinh không được để trống')
    .isISO8601().withMessage('Ngày sinh phải là ngày hợp lệ (ISO 8601)'),

  body('personalInfo.gender')
    .notEmpty().withMessage('Giới tính không được để trống')
    .isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ'),

  body('personalInfo.nationalId')
    .notEmpty().withMessage('CMND/CCCD không được để trống')
    .matches(/^\d{9}$|^\d{12}$/).withMessage('CMND/CCCD phải là 9 hoặc 12 chữ số'),

  body('personalInfo.phoneNumber')
    .notEmpty().withMessage('Số điện thoại không được để trống')
    .matches(/^(0|\+84)[0-9]{9,10}$/).withMessage('Số điện thoại không đúng định dạng'),

  body('personalInfo.email')
    .optional()
    .isEmail().withMessage('Email không đúng định dạng'),

  // Professional Info
  body('professionalInfo.title')
    .notEmpty().withMessage('Chức danh không được để trống'),

  body('professionalInfo.department')
    .notEmpty().withMessage('Khoa không được để trống'),

  body('professionalInfo.position')
    .notEmpty().withMessage('Vị trí không được để trống'),

  body('professionalInfo.education')
    .isArray({ min: 1 }).withMessage('Phải có ít nhất một bằng cấp'),

  body('professionalInfo.languages')
    .isArray({ min: 1 }).withMessage('Phải có ít nhất một ngôn ngữ'),

  // Work Schedule
  body('workSchedule.workingDays')
    .isArray({ min: 1 }).withMessage('Phải có ít nhất một ngày làm việc'),

  body('workSchedule.workingHours.start')
    .notEmpty().withMessage('Giờ bắt đầu không được để trống')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Giờ bắt đầu không đúng định dạng (HH:mm)'),

  body('workSchedule.workingHours.end')
    .notEmpty().withMessage('Giờ kết thúc không được để trống')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Giờ kết thúc không đúng định dạng (HH:mm)'),

  // License & Employment
  body('licenseNumber')
    .notEmpty().withMessage('Số giấy phép hành nghề không được để trống'),

  body('employmentType')
    .notEmpty().withMessage('Loại hợp đồng không được để trống')
    .isIn(['full-time', 'part-time', 'contract', 'temporary', 'intern'])
    .withMessage('Loại hợp đồng không hợp lệ'),

  body('hireDate')
    .notEmpty().withMessage('Ngày tuyển dụng không được để trống')
    .isISO8601().withMessage('Ngày tuyển dụng phải là ngày hợp lệ'),

  body('yearsOfExperience')
    .notEmpty().withMessage('Số năm kinh nghiệm không được để trống')
    .isInt({ min: 0, max: 50 }).withMessage('Số năm kinh nghiệm phải từ 0-50'),

  handleValidationErrors
];

// ==================== UPDATE STAFF INFO VALIDATION ====================

export const validateUpdateStaffInfo: ValidationChain[] = [
  body('staffId')
    .notEmpty().withMessage('Staff ID không được để trống')
    .matches(/^STAFF-\d{6}-\d{3}$/).withMessage('Staff ID không đúng định dạng (STAFF-YYYYMM-XXX)'),

  body('personalInfo.phoneNumber')
    .optional()
    .matches(/^(0|\+84)[0-9]{9,10}$/).withMessage('Số điện thoại không đúng định dạng'),

  body('personalInfo.email')
    .optional()
    .isEmail().withMessage('Email không đúng định dạng'),

  body('consultationFee')
    .optional()
    .isInt({ min: 0 }).withMessage('Phí khám phải là số nguyên dương'),

  handleValidationErrors
];

// ==================== UPDATE STAFF STATUS VALIDATION ====================

export const validateUpdateStaffStatus: ValidationChain[] = [
  body('staffId')
    .notEmpty().withMessage('Staff ID không được để trống')
    .matches(/^STAFF-\d{6}-\d{3}$/).withMessage('Staff ID không đúng định dạng'),

  body('status')
    .notEmpty().withMessage('Trạng thái không được để trống')
    .isIn(['active', 'on-leave', 'suspended', 'terminated'])
    .withMessage('Trạng thái không hợp lệ'),

  handleValidationErrors
];

// ==================== PARAMETER VALIDATION ====================

export const validateStaffId: ValidationChain[] = [
  param('staffId')
    .notEmpty().withMessage('Staff ID không được để trống')
    .matches(/^STAFF-\d{6}-\d{3}$/).withMessage('Staff ID không đúng định dạng (STAFF-YYYYMM-XXX)'),

  handleValidationErrors
];

export const validateUserId: ValidationChain[] = [
  param('userId')
    .notEmpty().withMessage('User ID không được để trống')
    .isUUID().withMessage('User ID phải là UUID hợp lệ'),

  handleValidationErrors
];

export const validateLicenseNumber: ValidationChain[] = [
  param('licenseNumber')
    .notEmpty().withMessage('Số giấy phép không được để trống'),

  handleValidationErrors
];

// ==================== SEARCH VALIDATION ====================

export const validateSearchStaff: ValidationChain[] = [
  query('searchTerm')
    .optional()
    .isLength({ min: 2 }).withMessage('Từ khóa tìm kiếm phải có ít nhất 2 ký tự'),

  query('staffType')
    .optional()
    .isIn(['doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist'])
    .withMessage('Loại nhân viên không hợp lệ'),

  query('status')
    .optional()
    .isIn(['active', 'on-leave', 'suspended', 'terminated'])
    .withMessage('Trạng thái không hợp lệ'),

  query('isActive')
    .optional()
    .isBoolean().withMessage('isActive phải là boolean'),

  query('isAcceptingNewPatients')
    .optional()
    .isBoolean().withMessage('isAcceptingNewPatients phải là boolean'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Số trang phải là số nguyên dương'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Số lượng phải từ 1-100'),

  handleValidationErrors
];

// ==================== ADD CREDENTIAL VALIDATION ====================

export const validateAddCredential: ValidationChain[] = [
  body('staffId')
    .notEmpty().withMessage('Staff ID không được để trống')
    .matches(/^STAFF-\d{6}-\d{3}$/).withMessage('Staff ID không đúng định dạng'),

  body('credentialType')
    .notEmpty().withMessage('Loại chứng chỉ không được để trống'),

  body('credentialNumber')
    .notEmpty().withMessage('Số chứng chỉ không được để trống'),

  body('issuingAuthority')
    .notEmpty().withMessage('Cơ quan cấp không được để trống'),

  body('issueDate')
    .notEmpty().withMessage('Ngày cấp không được để trống')
    .isISO8601().withMessage('Ngày cấp phải là ngày hợp lệ'),

  body('expiryDate')
    .optional()
    .isISO8601().withMessage('Ngày hết hạn phải là ngày hợp lệ'),

  handleValidationErrors
];

// ==================== ASSIGN DEPARTMENT VALIDATION ====================

export const validateAssignDepartment: ValidationChain[] = [
  body('staffId')
    .notEmpty().withMessage('Staff ID không được để trống')
    .matches(/^STAFF-\d{6}-\d{3}$/).withMessage('Staff ID không đúng định dạng'),

  body('departmentId')
    .notEmpty().withMessage('Department ID không được để trống'),

  body('departmentName')
    .notEmpty().withMessage('Tên khoa không được để trống'),

  body('role')
    .notEmpty().withMessage('Vai trò không được để trống'),

  body('isPrimary')
    .isBoolean().withMessage('isPrimary phải là boolean'),

  body('startDate')
    .notEmpty().withMessage('Ngày bắt đầu không được để trống')
    .isISO8601().withMessage('Ngày bắt đầu phải là ngày hợp lệ'),

  handleValidationErrors
];

