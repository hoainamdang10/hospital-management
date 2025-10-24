"use strict";
/**
 * Validation Middleware - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Request validation middleware with Vietnamese healthcare rules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.sanitizeRequest = sanitizeRequest;
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.requestSizeLimitMiddleware = requestSizeLimitMiddleware;
exports.validateContentType = validateContentType;
const ErrorHandlingMiddleware_1 = require("./ErrorHandlingMiddleware");
/**
 * Validation Middleware Factory
 */
function validateRequest(schema, source = 'body') {
    return (req, res, next) => {
        const dataToValidate = req[source];
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true,
            context: {
                maxDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
            }
        });
        if (error) {
            const validationErrors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: translateValidationMessage(detail.message, detail.type),
                code: detail.type
            }));
            const validationError = new ErrorHandlingMiddleware_1.ValidationError('Dữ liệu đầu vào không hợp lệ', validationErrors);
            return next(validationError);
        }
        // Replace the original data with validated and sanitized data
        req[source] = value;
        next();
    };
}
/**
 * Translate Joi validation messages to Vietnamese
 */
function translateValidationMessage(message, type) {
    const translations = {
        // Required field errors
        '"{{#label}}" is required': '{{#label}} là bắt buộc',
        'any.required': 'Trường này là bắt buộc',
        // String validation errors
        'string.empty': 'Không được để trống',
        'string.min': 'Phải có ít nhất {{#limit}} ký tự',
        'string.max': 'Không được vượt quá {{#limit}} ký tự',
        'string.length': 'Phải có đúng {{#limit}} ký tự',
        'string.pattern.base': 'Định dạng không hợp lệ',
        'string.email': 'Email không đúng định dạng',
        // Number validation errors
        'number.base': 'Phải là số',
        'number.integer': 'Phải là số nguyên',
        'number.min': 'Phải lớn hơn hoặc bằng {{#limit}}',
        'number.max': 'Phải nhỏ hơn hoặc bằng {{#limit}}',
        'number.positive': 'Phải là số dương',
        'number.negative': 'Phải là số âm',
        // Date validation errors
        'date.base': 'Phải là ngày hợp lệ',
        'date.min': 'Phải sau ngày {{#limit}}',
        'date.max': 'Phải trước ngày {{#limit}}',
        'date.greater': 'Phải sau {{#limit}}',
        'date.less': 'Phải trước {{#limit}}',
        // Array validation errors
        'array.base': 'Phải là danh sách',
        'array.min': 'Phải có ít nhất {{#limit}} phần tử',
        'array.max': 'Không được vượt quá {{#limit}} phần tử',
        'array.length': 'Phải có đúng {{#limit}} phần tử',
        // Object validation errors
        'object.base': 'Phải là đối tượng hợp lệ',
        'object.unknown': 'Trường không được phép',
        // Boolean validation errors
        'boolean.base': 'Phải là true hoặc false',
        // Any validation errors
        'any.only': 'Phải là một trong các giá trị: {{#valids}}',
        'any.invalid': 'Giá trị không hợp lệ',
        // Custom validation errors (Vietnamese healthcare specific)
        'custom.noSunday': 'Không thể đặt lịch hẹn vào Chủ nhật',
        'custom.businessHours': 'Lịch hẹn phải trong giờ làm việc (8:00 - 17:00)',
        'custom.futureDate': 'Thời gian phải trong tương lai',
        'custom.dateRange': 'Không thể đặt lịch hẹn quá 60 ngày trong tương lai'
    };
    // Try to find exact match first
    if (translations[message]) {
        return translations[message];
    }
    // Try to find by type
    if (translations[type]) {
        return translations[type];
    }
    // Try to find partial matches and replace placeholders
    for (const [pattern, translation] of Object.entries(translations)) {
        if (message.includes(pattern.replace(/\{\{.*?\}\}/g, ''))) {
            return translation;
        }
    }
    // Return original message if no translation found
    return message;
}
/**
 * Sanitize Request Data
 */
function sanitizeRequest(req, res, next) {
    // Sanitize body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    // Sanitize params
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
}
/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeValue(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
}
/**
 * Sanitize individual value
 */
function sanitizeValue(value) {
    if (typeof value === 'string') {
        // Remove potentially dangerous characters
        return value
            .trim()
            .replace(/[<>]/g, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, ''); // Remove event handlers
    }
    return value;
}
/**
 * Rate Limiting Middleware
 */
function rateLimitMiddleware(windowMs = 15 * 60 * 1000, // 15 minutes
maxRequests = 100 // 100 requests per window
) {
    const requests = new Map();
    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        // Clean up expired entries
        for (const [key, data] of requests.entries()) {
            if (now > data.resetTime) {
                requests.delete(key);
            }
        }
        // Get or create client data
        let clientData = requests.get(clientId);
        if (!clientData || now > clientData.resetTime) {
            clientData = {
                count: 0,
                resetTime: now + windowMs
            };
            requests.set(clientId, clientData);
        }
        // Check rate limit
        if (clientData.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
                errorCode: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method,
                statusCode: 429
            });
        }
        // Increment counter
        clientData.count++;
        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
            'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
        });
        next();
    };
}
/**
 * Request Size Limit Middleware
 */
function requestSizeLimitMiddleware(maxSize = 1024 * 1024) {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0', 10);
        if (contentLength > maxSize) {
            return res.status(413).json({
                success: false,
                message: 'Kích thước yêu cầu quá lớn',
                errorCode: 'PAYLOAD_TOO_LARGE',
                maxSize: maxSize,
                receivedSize: contentLength,
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method,
                statusCode: 413
            });
        }
        next();
    };
}
/**
 * Content Type Validation Middleware
 */
function validateContentType(allowedTypes = ['application/json']) {
    return (req, res, next) => {
        if (req.method === 'GET' || req.method === 'DELETE') {
            return next(); // Skip for GET and DELETE requests
        }
        const contentType = req.get('content-type');
        if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
            return res.status(415).json({
                success: false,
                message: 'Loại nội dung không được hỗ trợ',
                errorCode: 'UNSUPPORTED_MEDIA_TYPE',
                allowedTypes: allowedTypes,
                receivedType: contentType,
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method,
                statusCode: 415
            });
        }
        next();
    };
}
//# sourceMappingURL=ValidationMiddleware.js.map