"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedResponseHelper = exports.VietnameseErrorMessages = exports.ResponseHelper = void 0;
exports.addRequestId = addRequestId;
exports.asyncErrorHandler = asyncErrorHandler;
exports.globalErrorHandler = globalErrorHandler;
exports.validateRequiredFields = validateRequiredFields;
exports.createPaginationInfo = createPaginationInfo;
/**
 * Helper functions to create standardized API responses across all microservices
 */
class ResponseHelper {
    /**
     * Initialize the response helper with service information
     */
    static initialize(serviceName, version = "1.0.0") {
        this.serviceName = serviceName;
        this.serviceVersion = version;
    }
    /**
     * Create a successful response
     */
    static success(data, pagination) {
        return {
            success: true,
            data,
            pagination,
            meta: {
                timestamp: new Date().toISOString(),
                version: this.serviceVersion,
                service: this.serviceName,
            },
        };
    }
    /**
     * Create an error response
     */
    static error(message, code, details, statusCode) {
        return {
            success: false,
            data: null,
            error: {
                message,
                code,
                details,
            },
            meta: {
                timestamp: new Date().toISOString(),
                version: this.serviceVersion,
                service: this.serviceName,
            },
        };
    }
    /**
     * Create a paginated response
     */
    static paginated(data, page, limit, total) {
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext,
                hasPrev,
            },
            meta: {
                timestamp: new Date().toISOString(),
                version: this.serviceVersion,
                service: this.serviceName,
            },
        };
    }
    /**
     * Create a standardized health check response
     */
    static healthCheck(status, dependencies, features) {
        const memoryUsage = process.memoryUsage();
        return {
            service: this.serviceName,
            status,
            version: this.serviceVersion,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            dependencies,
            features,
            memory: {
                used: memoryUsage.heapUsed,
                total: memoryUsage.heapTotal,
                percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
            },
        };
    }
    /**
     * Create validation error response
     */
    static validationError(errors) {
        return this.error("Validation failed", "VALIDATION_ERROR", errors);
    }
    /**
     * Create not found error response
     */
    static notFound(resource, id) {
        const message = id
            ? `${resource} with ID ${id} not found`
            : `${resource} not found`;
        return this.error(message, "NOT_FOUND");
    }
    /**
     * Create unauthorized error response
     */
    static unauthorized(message = "Authentication required") {
        return this.error(message, "UNAUTHORIZED");
    }
    /**
     * Create forbidden error response
     */
    static forbidden(message = "Access denied") {
        return this.error(message, "FORBIDDEN");
    }
    /**
     * Create internal server error response
     */
    static internalError(message = "Internal server error") {
        return this.error(message, "INTERNAL_ERROR");
    }
    /**
     * Create service unavailable error response
     */
    static serviceUnavailable(service) {
        return this.error(`${service} is currently unavailable`, "SERVICE_UNAVAILABLE");
    }
    /**
     * Create bad request error response
     */
    static badRequest(message = "Bad request") {
        return this.error(message, "BAD_REQUEST");
    }
}
exports.ResponseHelper = ResponseHelper;
ResponseHelper.serviceName = "Unknown Service";
ResponseHelper.serviceVersion = "1.0.0";
/**
 * Middleware to add request ID to responses
 */
function addRequestId(req, res, next) {
    const requestId = req.headers["x-request-id"] ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    // Override the original json method to add requestId to meta
    const originalJson = res.json;
    res.json = function (body) {
        if (body && typeof body === "object" && body.meta) {
            body.meta.requestId = requestId;
        }
        return originalJson.call(this, body);
    };
    next();
}
/**
 * Vietnamese error messages mapping
 */
exports.VietnameseErrorMessages = {
    // Authentication errors
    UNAUTHORIZED: "Yêu cầu xác thực",
    FORBIDDEN: "Không có quyền truy cập",
    INVALID_TOKEN: "Token không hợp lệ",
    TOKEN_EXPIRED: "Token đã hết hạn",
    // Validation errors
    VALIDATION_ERROR: "Dữ liệu không hợp lệ",
    REQUIRED_FIELD: "Trường bắt buộc",
    INVALID_FORMAT: "Định dạng không hợp lệ",
    INVALID_EMAIL: "Email không hợp lệ",
    INVALID_PHONE: "Số điện thoại không hợp lệ",
    INVALID_LICENSE: "Số giấy phép không hợp lệ",
    // Resource errors
    NOT_FOUND: "Không tìm thấy",
    ALREADY_EXISTS: "Đã tồn tại",
    DUPLICATE_ENTRY: "Dữ liệu trùng lặp",
    // Server errors
    INTERNAL_ERROR: "Lỗi hệ thống",
    SERVICE_UNAVAILABLE: "Dịch vụ không khả dụng",
    DATABASE_ERROR: "Lỗi cơ sở dữ liệu",
    NETWORK_ERROR: "Lỗi kết nối mạng",
    // Business logic errors
    APPOINTMENT_CONFLICT: "Xung đột lịch hẹn",
    DOCTOR_NOT_AVAILABLE: "Bác sĩ không có lịch",
    PATIENT_NOT_FOUND: "Không tìm thấy bệnh nhân",
    DOCTOR_NOT_FOUND: "Không tìm thấy bác sĩ",
    DEPARTMENT_NOT_FOUND: "Không tìm thấy khoa",
    // Payment errors
    PAYMENT_FAILED: "Thanh toán thất bại",
    PAYMENT_CANCELLED: "Thanh toán bị hủy",
    INVALID_PAYMENT_METHOD: "Phương thức thanh toán không hợp lệ",
    INSUFFICIENT_FUNDS: "Số dư không đủ",
    // File upload errors
    FILE_TOO_LARGE: "File quá lớn",
    INVALID_FILE_TYPE: "Loại file không hợp lệ",
    UPLOAD_FAILED: "Tải file thất bại",
    // Rate limiting
    RATE_LIMIT_EXCEEDED: "Vượt quá giới hạn yêu cầu",
    TOO_MANY_REQUESTS: "Quá nhiều yêu cầu",
};
/**
 * Enhanced ResponseHelper with Vietnamese error messages
 */
class EnhancedResponseHelper extends ResponseHelper {
    /**
     * Create error response with Vietnamese message
     */
    static errorVi(messageKey, code, details, customMessage) {
        const message = customMessage || exports.VietnameseErrorMessages[messageKey] || messageKey;
        return this.error(message, code || messageKey, details);
    }
    /**
     * Create validation error with Vietnamese messages
     */
    static validationErrorVi(errors) {
        const vietnameseErrors = errors.map((error) => ({
            field: error.field,
            message: error.message,
            vietnamese: this.translateValidationMessage(error.message),
        }));
        return this.error("Dữ liệu không hợp lệ", "VALIDATION_ERROR", vietnameseErrors);
    }
    /**
     * Translate common validation messages to Vietnamese
     */
    static translateValidationMessage(message) {
        const translations = {
            "is required": "là bắt buộc",
            "must be a valid email": "phải là email hợp lệ",
            "must be at least": "phải có ít nhất",
            "must be at most": "không được vượt quá",
            "must be a number": "phải là số",
            "must be a string": "phải là chuỗi",
            "must be a boolean": "phải là true/false",
            "must be a valid date": "phải là ngày hợp lệ",
            "must be unique": "phải là duy nhất",
            "invalid format": "định dạng không hợp lệ",
        };
        let translatedMessage = message;
        Object.entries(translations).forEach(([english, vietnamese]) => {
            translatedMessage = translatedMessage.replace(new RegExp(english, "gi"), vietnamese);
        });
        return translatedMessage;
    }
}
exports.EnhancedResponseHelper = EnhancedResponseHelper;
/**
 * Express middleware to handle async errors and convert them to standardized responses
 */
function asyncErrorHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error("Async error:", error);
            // Check if response was already sent
            if (res.headersSent) {
                return next(error);
            }
            // Send standardized error response with Vietnamese message
            const errorResponse = EnhancedResponseHelper.errorVi("INTERNAL_ERROR", "INTERNAL_ERROR", process.env.NODE_ENV === "development"
                ? { stack: error.stack }
                : undefined, process.env.NODE_ENV === "production" ? undefined : error.message);
            res.status(500).json(errorResponse);
        });
    };
}
/**
 * Global error handling middleware for Express
 */
function globalErrorHandler(error, req, res, next) {
    console.error("Global error handler:", error);
    // If response was already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(error);
    }
    // Handle different types of errors
    let statusCode = 500;
    let errorResponse;
    if (error.name === "ValidationError") {
        statusCode = 400;
        errorResponse = EnhancedResponseHelper.errorVi("VALIDATION_ERROR", "VALIDATION_ERROR", error.details);
    }
    else if (error.name === "UnauthorizedError" || error.status === 401) {
        statusCode = 401;
        errorResponse = EnhancedResponseHelper.errorVi("UNAUTHORIZED");
    }
    else if (error.name === "ForbiddenError" || error.status === 403) {
        statusCode = 403;
        errorResponse = EnhancedResponseHelper.errorVi("FORBIDDEN");
    }
    else if (error.name === "NotFoundError" || error.status === 404) {
        statusCode = 404;
        errorResponse = EnhancedResponseHelper.errorVi("NOT_FOUND");
    }
    else if (error.code === "ECONNREFUSED") {
        statusCode = 503;
        errorResponse = EnhancedResponseHelper.errorVi("SERVICE_UNAVAILABLE");
    }
    else if (error.code === "23505") {
        // PostgreSQL unique violation
        statusCode = 409;
        errorResponse = EnhancedResponseHelper.errorVi("DUPLICATE_ENTRY");
    }
    else if (error.code === "23503") {
        // PostgreSQL foreign key violation
        statusCode = 400;
        errorResponse = EnhancedResponseHelper.errorVi("VALIDATION_ERROR", "FOREIGN_KEY_VIOLATION", {
            message: "Dữ liệu tham chiếu không tồn tại",
        });
    }
    else {
        // Default internal server error
        errorResponse = EnhancedResponseHelper.errorVi("INTERNAL_ERROR", "INTERNAL_ERROR", process.env.NODE_ENV === "development"
            ? {
                message: error.message,
                stack: error.stack,
            }
            : undefined);
    }
    res.status(statusCode).json(errorResponse);
}
/**
 * Validation helper to check required fields
 */
function validateRequiredFields(data, requiredFields) {
    const errors = [];
    for (const field of requiredFields) {
        if (!data[field] ||
            (typeof data[field] === "string" && data[field].trim() === "")) {
            errors.push(`${field} is required`);
        }
    }
    return errors;
}
/**
 * Helper to create consistent pagination info
 */
function createPaginationInfo(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
//# sourceMappingURL=response-helpers.js.map