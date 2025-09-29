import {
  StandardApiResponse,
  StandardHealthCheck,
} from "../types/common.types";

/**
 * Helper functions to create standardized API responses across all microservices
 */

export class ResponseHelper {
  private static serviceName: string = "Unknown Service";
  private static serviceVersion: string = "1.0.0";

  /**
   * Initialize the response helper with service information
   */
  static initialize(serviceName: string, version: string = "1.0.0") {
    this.serviceName = serviceName;
    this.serviceVersion = version;
  }

  /**
   * Create a successful response
   */
  static success<T>(
    data: T,
    pagination?: StandardApiResponse["pagination"]
  ): StandardApiResponse<T> {
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
  static error(
    message: string,
    code?: string,
    details?: any,
    statusCode?: number
  ): StandardApiResponse<null> {
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
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): StandardApiResponse<T[]> {
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
  static healthCheck(
    status: "healthy" | "unhealthy" | "degraded",
    dependencies?: StandardHealthCheck["dependencies"],
    features?: StandardHealthCheck["features"]
  ): StandardHealthCheck {
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
        percentage: Math.round(
          (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        ),
      },
    };
  }

  /**
   * Create validation error response
   */
  static validationError(errors: any[]): StandardApiResponse<null> {
    return this.error("Validation failed", "VALIDATION_ERROR", errors);
  }

  /**
   * Create not found error response
   */
  static notFound(resource: string, id?: string): StandardApiResponse<null> {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;

    return this.error(message, "NOT_FOUND");
  }

  /**
   * Create unauthorized error response
   */
  static unauthorized(
    message: string = "Authentication required"
  ): StandardApiResponse<null> {
    return this.error(message, "UNAUTHORIZED");
  }

  /**
   * Create forbidden error response
   */
  static forbidden(
    message: string = "Access denied"
  ): StandardApiResponse<null> {
    return this.error(message, "FORBIDDEN");
  }

  /**
   * Create internal server error response
   */
  static internalError(
    message: string = "Internal server error"
  ): StandardApiResponse<null> {
    return this.error(message, "INTERNAL_ERROR");
  }

  /**
   * Create service unavailable error response
   */
  static serviceUnavailable(service: string): StandardApiResponse<null> {
    return this.error(
      `${service} is currently unavailable`,
      "SERVICE_UNAVAILABLE"
    );
  }

  /**
   * Create bad request error response
   */
  static badRequest(
    message: string = "Bad request"
  ): StandardApiResponse<null> {
    return this.error(message, "BAD_REQUEST");
  }
}

/**
 * Middleware to add request ID to responses
 */
export function addRequestId(req: any, res: any, next: any) {
  const requestId =
    req.headers["x-request-id"] ||
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  // Override the original json method to add requestId to meta
  const originalJson = res.json;
  res.json = function (body: any) {
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
export const VietnameseErrorMessages = {
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
export class EnhancedResponseHelper extends ResponseHelper {
  /**
   * Create error response with Vietnamese message
   */
  static errorVi(
    messageKey: keyof typeof VietnameseErrorMessages,
    code?: string,
    details?: any,
    customMessage?: string
  ): StandardApiResponse<null> {
    const message =
      customMessage || VietnameseErrorMessages[messageKey] || messageKey;
    return this.error(message, code || messageKey, details);
  }

  /**
   * Create validation error with Vietnamese messages
   */
  static validationErrorVi(
    errors: Array<{ field: string; message: string }>
  ): StandardApiResponse<null> {
    const vietnameseErrors = errors.map((error) => ({
      field: error.field,
      message: error.message,
      vietnamese: this.translateValidationMessage(error.message),
    }));

    return this.error(
      "Dữ liệu không hợp lệ",
      "VALIDATION_ERROR",
      vietnameseErrors
    );
  }

  /**
   * Translate common validation messages to Vietnamese
   */
  private static translateValidationMessage(message: string): string {
    const translations: Record<string, string> = {
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
      translatedMessage = translatedMessage.replace(
        new RegExp(english, "gi"),
        vietnamese
      );
    });

    return translatedMessage;
  }
}

/**
 * Express middleware to handle async errors and convert them to standardized responses
 */
export function asyncErrorHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Async error:", error);

      // Check if response was already sent
      if (res.headersSent) {
        return next(error);
      }

      // Send standardized error response with Vietnamese message
      const errorResponse = EnhancedResponseHelper.errorVi(
        "INTERNAL_ERROR",
        "INTERNAL_ERROR",
        process.env.NODE_ENV === "development"
          ? { stack: error.stack }
          : undefined,
        process.env.NODE_ENV === "production" ? undefined : error.message
      );

      res.status(500).json(errorResponse);
    });
  };
}

/**
 * Global error handling middleware for Express
 */
export function globalErrorHandler(error: any, req: any, res: any, next: any) {
  console.error("Global error handler:", error);

  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Handle different types of errors
  let statusCode = 500;
  let errorResponse: StandardApiResponse<null>;

  if (error.name === "ValidationError") {
    statusCode = 400;
    errorResponse = EnhancedResponseHelper.errorVi(
      "VALIDATION_ERROR",
      "VALIDATION_ERROR",
      error.details
    );
  } else if (error.name === "UnauthorizedError" || error.status === 401) {
    statusCode = 401;
    errorResponse = EnhancedResponseHelper.errorVi("UNAUTHORIZED");
  } else if (error.name === "ForbiddenError" || error.status === 403) {
    statusCode = 403;
    errorResponse = EnhancedResponseHelper.errorVi("FORBIDDEN");
  } else if (error.name === "NotFoundError" || error.status === 404) {
    statusCode = 404;
    errorResponse = EnhancedResponseHelper.errorVi("NOT_FOUND");
  } else if (error.code === "ECONNREFUSED") {
    statusCode = 503;
    errorResponse = EnhancedResponseHelper.errorVi("SERVICE_UNAVAILABLE");
  } else if (error.code === "23505") {
    // PostgreSQL unique violation
    statusCode = 409;
    errorResponse = EnhancedResponseHelper.errorVi("DUPLICATE_ENTRY");
  } else if (error.code === "23503") {
    // PostgreSQL foreign key violation
    statusCode = 400;
    errorResponse = EnhancedResponseHelper.errorVi(
      "VALIDATION_ERROR",
      "FOREIGN_KEY_VIOLATION",
      {
        message: "Dữ liệu tham chiếu không tồn tại",
      }
    );
  } else {
    // Default internal server error
    errorResponse = EnhancedResponseHelper.errorVi(
      "INTERNAL_ERROR",
      "INTERNAL_ERROR",
      process.env.NODE_ENV === "development"
        ? {
            message: error.message,
            stack: error.stack,
          }
        : undefined
    );
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Validation helper to check required fields
 */
export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): string[] {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
    ) {
      errors.push(`${field} is required`);
    }
  }

  return errors;
}

/**
 * Helper to create consistent pagination info
 */
export function createPaginationInfo(
  page: number,
  limit: number,
  total: number
) {
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
