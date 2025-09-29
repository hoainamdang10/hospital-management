"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonValidationSchemas = exports.validateEmail = exports.validateVietnameseLicense = exports.validateVietnamesePhone = void 0;
exports.validateRequest = validateRequest;
exports.sanitizeInput = sanitizeInput;
const response_helpers_1 = require("../utils/response-helpers");
/**
 * Vietnamese phone number validation
 */
const validateVietnamesePhone = (phone) => {
    // Vietnamese phone format: 0xxxxxxxxx (10 digits starting with 0)
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone);
};
exports.validateVietnamesePhone = validateVietnamesePhone;
/**
 * Vietnamese license number validation
 */
const validateVietnameseLicense = (license) => {
    // Format: VN-{2 letters}-{4 digits}
    const licenseRegex = /^VN-[A-Z]{2}-[0-9]{4}$/;
    return licenseRegex.test(license);
};
exports.validateVietnameseLicense = validateVietnameseLicense;
/**
 * Email validation
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
/**
 * Validate a single field
 */
function validateField(value, rule) {
    const fieldName = rule.vietnamese || rule.field;
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
        return `${fieldName} là bắt buộc`;
    }
    // If field is not required and empty, skip other validations
    if (!rule.required && (value === undefined || value === null || value === '')) {
        return null;
    }
    // Type validation
    if (rule.type) {
        switch (rule.type) {
            case 'string':
                if (typeof value !== 'string') {
                    return `${fieldName} phải là chuỗi`;
                }
                break;
            case 'number':
                if (typeof value !== 'number' && isNaN(Number(value))) {
                    return `${fieldName} phải là số`;
                }
                value = Number(value);
                break;
            case 'boolean':
                if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                    return `${fieldName} phải là true hoặc false`;
                }
                break;
            case 'email':
                if (!(0, exports.validateEmail)(value)) {
                    return `${fieldName} phải là email hợp lệ`;
                }
                break;
            case 'phone':
                if (!(0, exports.validateVietnamesePhone)(value)) {
                    return `${fieldName} phải là số điện thoại Việt Nam hợp lệ (10 số bắt đầu bằng 0)`;
                }
                break;
            case 'date':
                if (isNaN(Date.parse(value))) {
                    return `${fieldName} phải là ngày hợp lệ`;
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    return `${fieldName} phải là mảng`;
                }
                break;
            case 'object':
                if (typeof value !== 'object' || Array.isArray(value)) {
                    return `${fieldName} phải là đối tượng`;
                }
                break;
        }
    }
    // Length validation for strings
    if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
            return `${fieldName} phải có ít nhất ${rule.minLength} ký tự`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            return `${fieldName} không được vượt quá ${rule.maxLength} ký tự`;
        }
    }
    // Numeric range validation
    if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
            return `${fieldName} phải lớn hơn hoặc bằng ${rule.min}`;
        }
        if (rule.max !== undefined && value > rule.max) {
            return `${fieldName} phải nhỏ hơn hoặc bằng ${rule.max}`;
        }
    }
    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
            return `${fieldName} có định dạng không hợp lệ`;
        }
    }
    // Custom validation
    if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
            return typeof customResult === 'string' ? customResult : `${fieldName} không hợp lệ`;
        }
    }
    return null;
}
/**
 * Validate data against schema
 */
function validateData(data, rules) {
    const errors = [];
    for (const rule of rules) {
        const value = data[rule.field];
        const error = validateField(value, rule);
        if (error) {
            errors.push({
                field: rule.field,
                message: error
            });
        }
    }
    return errors;
}
/**
 * Express middleware for request validation
 */
function validateRequest(schema) {
    return (req, res, next) => {
        const errors = [];
        // Validate body
        if (schema.body) {
            const bodyErrors = validateData(req.body, schema.body);
            errors.push(...bodyErrors.map(err => ({ ...err, location: 'body' })));
        }
        // Validate query parameters
        if (schema.query) {
            const queryErrors = validateData(req.query, schema.query);
            errors.push(...queryErrors.map(err => ({ ...err, location: 'query' })));
        }
        // Validate URL parameters
        if (schema.params) {
            const paramErrors = validateData(req.params, schema.params);
            errors.push(...paramErrors.map(err => ({ ...err, location: 'params' })));
        }
        // If there are validation errors, return error response
        if (errors.length > 0) {
            const errorResponse = response_helpers_1.EnhancedResponseHelper.validationErrorVi(errors.map(err => ({
                field: `${err.location}.${err.field}`,
                message: err.message
            })));
            return res.status(400).json(errorResponse);
        }
        next();
    };
}
/**
 * Common validation schemas
 */
exports.CommonValidationSchemas = {
    // Doctor validation
    createDoctor: {
        body: [
            { field: 'full_name', required: true, type: 'string', minLength: 2, maxLength: 100, vietnamese: 'Họ tên' },
            { field: 'email', required: true, type: 'email', vietnamese: 'Email' },
            { field: 'phone_number', required: true, type: 'phone', vietnamese: 'Số điện thoại' },
            { field: 'specialization', required: true, type: 'string', minLength: 2, maxLength: 100, vietnamese: 'Chuyên khoa' },
            { field: 'license_number', required: true, type: 'string', pattern: /^VN-[A-Z]{2}-[0-9]{4}$/, vietnamese: 'Số giấy phép' },
            { field: 'years_of_experience', required: true, type: 'number', min: 0, max: 50, vietnamese: 'Số năm kinh nghiệm' },
            { field: 'department_id', required: true, type: 'string', vietnamese: 'Khoa' },
        ]
    },
    // Patient validation
    createPatient: {
        body: [
            { field: 'full_name', required: true, type: 'string', minLength: 2, maxLength: 100, vietnamese: 'Họ tên' },
            { field: 'email', required: true, type: 'email', vietnamese: 'Email' },
            { field: 'phone_number', required: true, type: 'phone', vietnamese: 'Số điện thoại' },
            { field: 'date_of_birth', required: true, type: 'date', vietnamese: 'Ngày sinh' },
            { field: 'gender', required: true, type: 'string', vietnamese: 'Giới tính' },
            { field: 'address', required: false, type: 'string', maxLength: 500, vietnamese: 'Địa chỉ' },
        ]
    },
    // Appointment validation
    createAppointment: {
        body: [
            { field: 'doctor_id', required: true, type: 'string', vietnamese: 'Bác sĩ' },
            { field: 'patient_id', required: true, type: 'string', vietnamese: 'Bệnh nhân' },
            { field: 'scheduled_date', required: true, type: 'date', vietnamese: 'Ngày hẹn' },
            { field: 'scheduled_time', required: true, type: 'string', vietnamese: 'Giờ hẹn' },
            { field: 'notes', required: false, type: 'string', maxLength: 1000, vietnamese: 'Ghi chú' },
        ]
    },
    // ID parameter validation
    idParam: {
        params: [
            { field: 'id', required: true, type: 'string', minLength: 1, vietnamese: 'ID' }
        ]
    },
    // Pagination validation
    pagination: {
        query: [
            { field: 'page', required: false, type: 'number', min: 1, vietnamese: 'Trang' },
            { field: 'limit', required: false, type: 'number', min: 1, max: 100, vietnamese: 'Số lượng' },
            { field: 'search', required: false, type: 'string', maxLength: 100, vietnamese: 'Tìm kiếm' },
        ]
    }
};
/**
 * Middleware to sanitize input data
 */
function sanitizeInput(req, res, next) {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    next();
}
/**
 * Sanitize object by trimming strings and removing null/undefined values
 */
function sanitizeObject(obj) {
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== null && value !== undefined) {
                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (trimmed !== '') {
                        sanitized[key] = trimmed;
                    }
                }
                else {
                    sanitized[key] = sanitizeObject(value);
                }
            }
        }
        return sanitized;
    }
    return obj;
}
//# sourceMappingURL=validation.middleware.js.map