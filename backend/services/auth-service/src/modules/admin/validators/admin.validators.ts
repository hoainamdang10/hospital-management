import { body, param, query } from 'express-validator';

// =====================================================
// DEPARTMENT VALIDATORS
// =====================================================

export const validateDepartmentId = [
  param('departmentId')
    .notEmpty()
    .withMessage('ID khoa không được để trống')
    .isString()
    .withMessage('ID khoa phải là chuỗi')
    .matches(/^DEPT\d{3}$/)
    .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...')
];

export const validateCreateDepartment = [
  body('department_name')
    .notEmpty()
    .withMessage('Tên khoa không được để trống')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên khoa phải từ 2-100 ký tự')
    .trim(),

  body('department_code')
    .notEmpty()
    .withMessage('Mã khoa không được để trống')
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã khoa phải từ 2-10 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã khoa chỉ được chứa chữ hoa và số')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự')
    .trim(),

  body('parent_department_id')
    .optional()
    .matches(/^DEPT\d{3}$/)
    .withMessage('ID khoa cha phải có định dạng DEPT001, DEPT002, ...'),

  body('head_doctor_id')
    .optional()
    .isString()
    .withMessage('ID trưởng khoa phải là chuỗi'),

  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Địa điểm không được quá 200 ký tự')
    .trim(),

  body('phone_number')
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
];

export const validateUpdateDepartment = [
  body('department_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên khoa phải từ 2-100 ký tự')
    .trim(),

  body('department_code')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã khoa phải từ 2-10 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã khoa chỉ được chứa chữ hoa và số')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự')
    .trim(),

  body('parent_department_id')
    .optional()
    .matches(/^DEPT\d{3}$/)
    .withMessage('ID khoa cha phải có định dạng DEPT001, DEPT002, ...'),

  body('head_doctor_id')
    .optional()
    .isString()
    .withMessage('ID trưởng khoa phải là chuỗi'),

  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Địa điểm không được quá 200 ký tự')
    .trim(),

  body('phone_number')
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái hoạt động phải là true hoặc false')
];

export const validateDepartmentSearch = [
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Từ khóa tìm kiếm không được quá 100 ký tự')
    .trim(),

  query('parent_department_id')
    .optional()
    .matches(/^DEPT\d{3}$/)
    .withMessage('ID khoa cha phải có định dạng DEPT001, DEPT002, ...'),

  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Trạng thái hoạt động phải là true hoặc false'),

  query('head_doctor_id')
    .optional()
    .isString()
    .withMessage('ID trưởng khoa phải là chuỗi'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số trang phải là số nguyên dương')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng bản ghi phải từ 1-100')
    .toInt(),

  query('sort_by')
    .optional()
    .isIn(['department_name', 'department_code', 'created_at', 'updated_at'])
    .withMessage('Trường sắp xếp không hợp lệ'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là asc hoặc desc')
];

// =====================================================
// SPECIALTY VALIDATORS
// =====================================================

export const validateSpecialtyId = [
  param('specialtyId')
    .notEmpty()
    .withMessage('ID chuyên khoa không được để trống')
    .isString()
    .withMessage('ID chuyên khoa phải là chuỗi')
];

export const validateCreateSpecialty = [
  body('specialty_name')
    .notEmpty()
    .withMessage('Tên chuyên khoa không được để trống')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên chuyên khoa phải từ 2-100 ký tự')
    .trim(),

  body('specialty_code')
    .notEmpty()
    .withMessage('Mã chuyên khoa không được để trống')
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã chuyên khoa phải từ 2-10 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã chuyên khoa chỉ được chứa chữ hoa và số')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự')
    .trim(),

  body('department_id')
    .optional()
    .matches(/^DEPT\d{3}$/)
    .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...')
];

export const validateUpdateSpecialty = [
  body('specialty_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên chuyên khoa phải từ 2-100 ký tự')
    .trim(),

  body('specialty_code')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã chuyên khoa phải từ 2-10 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã chuyên khoa chỉ được chứa chữ hoa và số')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự')
    .trim(),

  body('department_id')
    .optional()
    .matches(/^DEPT\d{3}$/)
    .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái hoạt động phải là true hoặc false')
];

// =====================================================
// ROOM VALIDATORS
// =====================================================

export const validateRoomId = [
  param('roomId')
    .notEmpty()
    .withMessage('ID phòng không được để trống')
    .isString()
    .withMessage('ID phòng phải là chuỗi')
];

export const validateCreateRoom = [
  body('room_number')
    .notEmpty()
    .withMessage('Số phòng không được để trống')
    .isLength({ min: 1, max: 20 })
    .withMessage('Số phòng phải từ 1-20 ký tự')
    .trim(),

  body('room_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên phòng không được quá 100 ký tự')
    .trim(),

  body('room_type')
    .notEmpty()
    .withMessage('Loại phòng không được để trống')
    .isIn(['consultation', 'examination', 'surgery', 'emergency', 'ward', 'icu', 'other'])
    .withMessage('Loại phòng không hợp lệ'),

  body('department_id')
    .notEmpty()
    .withMessage('ID khoa không được để trống')
    .matches(/^DEPT\d{3}$/)
    .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...'),

  body('floor')
    .optional()
    .isInt({ min: -5, max: 50 })
    .withMessage('Tầng phải là số nguyên từ -5 đến 50')
    .toInt(),

  body('building')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tòa nhà không được quá 50 ký tự')
    .trim(),

  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Sức chứa phải là số nguyên từ 1 đến 100')
    .toInt(),

  body('equipment')
    .optional()
    .isArray()
    .withMessage('Thiết bị phải là mảng')
];

export const validateUpdateRoom = [
  body('room_number')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Số phòng phải từ 1-20 ký tự')
    .trim(),

  body('room_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên phòng không được quá 100 ký tự')
    .trim(),

  body('room_type')
    .optional()
    .isIn(['consultation', 'examination', 'surgery', 'emergency', 'ward', 'icu', 'other'])
    .withMessage('Loại phòng không hợp lệ'),

  body('department_id')
    .optional()
    .matches(/^DEPT\d{3}$/)
    .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...'),

  body('floor')
    .optional()
    .isInt({ min: -5, max: 50 })
    .withMessage('Tầng phải là số nguyên từ -5 đến 50')
    .toInt(),

  body('building')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tòa nhà không được quá 50 ký tự')
    .trim(),

  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Sức chứa phải là số nguyên từ 1 đến 100')
    .toInt(),

  body('equipment')
    .optional()
    .isArray()
    .withMessage('Thiết bị phải là mảng'),

  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái sẵn sàng phải là true hoặc false'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái hoạt động phải là true hoặc false')
];
