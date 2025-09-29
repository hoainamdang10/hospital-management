"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateRoom = exports.validateCreateRoom = exports.validateRoomId = exports.validateUpdateSpecialty = exports.validateCreateSpecialty = exports.validateSpecialtyId = exports.validateDepartmentSearch = exports.validateUpdateDepartment = exports.validateCreateDepartment = exports.validateDepartmentId = void 0;
const express_validator_1 = require("express-validator");
exports.validateDepartmentId = [
    (0, express_validator_1.param)('departmentId')
        .notEmpty()
        .withMessage('ID khoa không được để trống')
        .isString()
        .withMessage('ID khoa phải là chuỗi')
        .matches(/^DEPT\d{3}$/)
        .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...')
];
exports.validateCreateDepartment = [
    (0, express_validator_1.body)('department_name')
        .notEmpty()
        .withMessage('Tên khoa không được để trống')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên khoa phải từ 2-100 ký tự')
        .trim(),
    (0, express_validator_1.body)('department_code')
        .notEmpty()
        .withMessage('Mã khoa không được để trống')
        .isLength({ min: 2, max: 10 })
        .withMessage('Mã khoa phải từ 2-10 ký tự')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Mã khoa chỉ được chứa chữ hoa và số')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự')
        .trim(),
    (0, express_validator_1.body)('parent_department_id')
        .optional()
        .matches(/^DEPT\d{3}$/)
        .withMessage('ID khoa cha phải có định dạng DEPT001, DEPT002, ...'),
    (0, express_validator_1.body)('head_doctor_id')
        .optional()
        .isString()
        .withMessage('ID trưởng khoa phải là chuỗi'),
    (0, express_validator_1.body)('location')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Địa điểm không được quá 200 ký tự')
        .trim(),
    (0, express_validator_1.body)('phone_number')
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail()
];
exports.validateUpdateDepartment = [
    (0, express_validator_1.body)('department_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên khoa phải từ 2-100 ký tự')
        .trim(),
    (0, express_validator_1.body)('department_code')
        .optional()
        .isLength({ min: 2, max: 10 })
        .withMessage('Mã khoa phải từ 2-10 ký tự')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Mã khoa chỉ được chứa chữ hoa và số')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự')
        .trim(),
    (0, express_validator_1.body)('parent_department_id')
        .optional()
        .matches(/^DEPT\d{3}$/)
        .withMessage('ID khoa cha phải có định dạng DEPT001, DEPT002, ...'),
    (0, express_validator_1.body)('head_doctor_id')
        .optional()
        .isString()
        .withMessage('ID trưởng khoa phải là chuỗi'),
    (0, express_validator_1.body)('location')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Địa điểm không được quá 200 ký tự')
        .trim(),
    (0, express_validator_1.body)('phone_number')
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail(),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái hoạt động phải là true hoặc false')
];
exports.validateDepartmentSearch = [
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Từ khóa tìm kiếm không được quá 100 ký tự')
        .trim(),
    (0, express_validator_1.query)('parent_department_id')
        .optional()
        .matches(/^DEPT\d{3}$/)
        .withMessage('ID khoa cha phải có định dạng DEPT001, DEPT002, ...'),
    (0, express_validator_1.query)('is_active')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('Trạng thái hoạt động phải là true hoặc false'),
    (0, express_validator_1.query)('head_doctor_id')
        .optional()
        .isString()
        .withMessage('ID trưởng khoa phải là chuỗi'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương')
        .toInt(),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Số lượng bản ghi phải từ 1-100')
        .toInt(),
    (0, express_validator_1.query)('sort_by')
        .optional()
        .isIn(['department_name', 'department_code', 'created_at', 'updated_at'])
        .withMessage('Trường sắp xếp không hợp lệ'),
    (0, express_validator_1.query)('sort_order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Thứ tự sắp xếp phải là asc hoặc desc')
];
exports.validateSpecialtyId = [
    (0, express_validator_1.param)('specialtyId')
        .notEmpty()
        .withMessage('ID chuyên khoa không được để trống')
        .isString()
        .withMessage('ID chuyên khoa phải là chuỗi')
];
exports.validateCreateSpecialty = [
    (0, express_validator_1.body)('specialty_name')
        .notEmpty()
        .withMessage('Tên chuyên khoa không được để trống')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên chuyên khoa phải từ 2-100 ký tự')
        .trim(),
    (0, express_validator_1.body)('specialty_code')
        .notEmpty()
        .withMessage('Mã chuyên khoa không được để trống')
        .isLength({ min: 2, max: 10 })
        .withMessage('Mã chuyên khoa phải từ 2-10 ký tự')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Mã chuyên khoa chỉ được chứa chữ hoa và số')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự')
        .trim(),
    (0, express_validator_1.body)('department_id')
        .optional()
        .matches(/^DEPT\d{3}$/)
        .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...')
];
exports.validateUpdateSpecialty = [
    (0, express_validator_1.body)('specialty_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên chuyên khoa phải từ 2-100 ký tự')
        .trim(),
    (0, express_validator_1.body)('specialty_code')
        .optional()
        .isLength({ min: 2, max: 10 })
        .withMessage('Mã chuyên khoa phải từ 2-10 ký tự')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Mã chuyên khoa chỉ được chứa chữ hoa và số')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự')
        .trim(),
    (0, express_validator_1.body)('department_id')
        .optional()
        .matches(/^DEPT\d{3}$/)
        .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái hoạt động phải là true hoặc false')
];
exports.validateRoomId = [
    (0, express_validator_1.param)('roomId')
        .notEmpty()
        .withMessage('ID phòng không được để trống')
        .isString()
        .withMessage('ID phòng phải là chuỗi')
];
exports.validateCreateRoom = [
    (0, express_validator_1.body)('room_number')
        .notEmpty()
        .withMessage('Số phòng không được để trống')
        .isLength({ min: 1, max: 20 })
        .withMessage('Số phòng phải từ 1-20 ký tự')
        .trim(),
    (0, express_validator_1.body)('room_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Tên phòng không được quá 100 ký tự')
        .trim(),
    (0, express_validator_1.body)('room_type')
        .notEmpty()
        .withMessage('Loại phòng không được để trống')
        .isIn(['consultation', 'examination', 'surgery', 'emergency', 'ward', 'icu', 'other'])
        .withMessage('Loại phòng không hợp lệ'),
    (0, express_validator_1.body)('department_id')
        .notEmpty()
        .withMessage('ID khoa không được để trống')
        .matches(/^DEPT\d{3}$/)
        .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...'),
    (0, express_validator_1.body)('floor')
        .optional()
        .isInt({ min: -5, max: 50 })
        .withMessage('Tầng phải là số nguyên từ -5 đến 50')
        .toInt(),
    (0, express_validator_1.body)('building')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Tòa nhà không được quá 50 ký tự')
        .trim(),
    (0, express_validator_1.body)('capacity')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Sức chứa phải là số nguyên từ 1 đến 100')
        .toInt(),
    (0, express_validator_1.body)('equipment')
        .optional()
        .isArray()
        .withMessage('Thiết bị phải là mảng')
];
exports.validateUpdateRoom = [
    (0, express_validator_1.body)('room_number')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Số phòng phải từ 1-20 ký tự')
        .trim(),
    (0, express_validator_1.body)('room_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Tên phòng không được quá 100 ký tự')
        .trim(),
    (0, express_validator_1.body)('room_type')
        .optional()
        .isIn(['consultation', 'examination', 'surgery', 'emergency', 'ward', 'icu', 'other'])
        .withMessage('Loại phòng không hợp lệ'),
    (0, express_validator_1.body)('department_id')
        .optional()
        .matches(/^DEPT\d{3}$/)
        .withMessage('ID khoa phải có định dạng DEPT001, DEPT002, ...'),
    (0, express_validator_1.body)('floor')
        .optional()
        .isInt({ min: -5, max: 50 })
        .withMessage('Tầng phải là số nguyên từ -5 đến 50')
        .toInt(),
    (0, express_validator_1.body)('building')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Tòa nhà không được quá 50 ký tự')
        .trim(),
    (0, express_validator_1.body)('capacity')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Sức chứa phải là số nguyên từ 1 đến 100')
        .toInt(),
    (0, express_validator_1.body)('equipment')
        .optional()
        .isArray()
        .withMessage('Thiết bị phải là mảng'),
    (0, express_validator_1.body)('is_available')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái sẵn sàng phải là true hoặc false'),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái hoạt động phải là true hoặc false')
];
//# sourceMappingURL=admin.validators.js.map