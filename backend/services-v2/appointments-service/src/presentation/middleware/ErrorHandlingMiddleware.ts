/**
 * Error Handling Middleware - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Centralized error handling with Vietnamese messages and proper HTTP status codes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Error Handling, Vietnamese Healthcare Standards
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorResponseDto } from '../dto/ScheduleAppointmentDto';

/**
 * Application Error Types
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  public readonly validationErrors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;

  constructor(
    message: string,
    validationErrors: Array<{ field: string; message: string; code?: string }> = []
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.validationErrors = validationErrors;
  }
}

/**
 * Business Logic Error
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, errorCode: string = 'BUSINESS_LOGIC_ERROR') {
    super(message, 422, errorCode);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} không tìm thấy`, 404, 'NOT_FOUND');
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Không có quyền truy cập') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Không đủ quyền thực hiện thao tác này') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Xung đột dữ liệu') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Quá nhiều yêu cầu, vui lòng thử lại sau') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Vietnamese Error Messages Mapping
 */
const vietnameseErrorMessages: { [key: string]: string } = {
  // Common errors
  'INTERNAL_ERROR': 'Lỗi hệ thống nội bộ',
  'VALIDATION_ERROR': 'Dữ liệu đầu vào không hợp lệ',
  'BUSINESS_LOGIC_ERROR': 'Lỗi logic nghiệp vụ',
  'NOT_FOUND': 'Không tìm thấy',
  'UNAUTHORIZED': 'Không có quyền truy cập',
  'FORBIDDEN': 'Không đủ quyền thực hiện',
  'CONFLICT': 'Xung đột dữ liệu',
  'RATE_LIMIT_EXCEEDED': 'Quá nhiều yêu cầu',

  // Appointment specific errors
  'APPOINTMENT_NOT_FOUND': 'Không tìm thấy cuộc hẹn',
  'APPOINTMENT_CONFLICT': 'Xung đột lịch hẹn',
  'TIME_SLOT_NOT_AVAILABLE': 'Khung thời gian không khả dụng',
  'PROVIDER_NOT_AVAILABLE': 'Bác sĩ không có lịch trống',
  'PATIENT_NOT_FOUND': 'Không tìm thấy bệnh nhân',
  'PROVIDER_NOT_FOUND': 'Không tìm thấy bác sĩ',
  'INVALID_TIME_SLOT': 'Khung thời gian không hợp lệ',
  'APPOINTMENT_CANNOT_BE_RESCHEDULED': 'Cuộc hẹn không thể thay đổi lịch',
  'RESCHEDULE_TOO_LATE': 'Không thể thay đổi lịch hẹn trong vòng 2 giờ trước giờ hẹn',
  'NEW_APPOINTMENT_TOO_SOON': 'Lịch hẹn mới phải cách ít nhất 1 giờ từ bây giờ',
  'NEW_APPOINTMENT_TOO_FAR': 'Không thể đặt lịch hẹn quá 30 ngày trong tương lai',
  'OUTSIDE_BUSINESS_HOURS': 'Lịch hẹn phải trong giờ làm việc (8:00 - 17:00)',
  'NO_SUNDAY_APPOINTMENTS': 'Không thể đặt lịch hẹn vào Chủ nhật',
  'PAST_DATE_NOT_ALLOWED': 'Không thể kiểm tra lịch trống cho ngày trong quá khứ',
  'TOO_FAR_IN_FUTURE': 'Không thể kiểm tra lịch trống quá 60 ngày trong tương lai',

  // Database errors
  'DATABASE_ERROR': 'Lỗi cơ sở dữ liệu',
  'CONNECTION_ERROR': 'Lỗi kết nối',
  'TIMEOUT_ERROR': 'Hết thời gian chờ',
  'OPTIMISTIC_CONCURRENCY_ERROR': 'Dữ liệu đã được cập nhật bởi người khác'
};

/**
 * Get Vietnamese error message
 */
function getVietnameseErrorMessage(errorCode: string, defaultMessage: string): string {
  return vietnameseErrorMessages[errorCode] || defaultMessage;
}

/**
 * Error Handling Middleware
 */
export function errorHandlingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error for monitoring
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Đã xảy ra lỗi không mong muốn';
  let validationErrors: Array<{ field: string; message: string; code?: string }> = [];

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.errorCode;
    message = getVietnameseErrorMessage(error.errorCode, error.message);

    if (error instanceof ValidationError) {
      validationErrors = error.validationErrors;
    }
  } else if (error.name === 'ValidationError') {
    // Joi validation error
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Dữ liệu đầu vào không hợp lệ';
    
    const joiError = error as any;
    if (joiError.details) {
      validationErrors = joiError.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }));
    }
  } else if (error.name === 'CastError') {
    // Database cast error
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'ID không hợp lệ';
  } else if (error.name === 'MongoError' || error.name === 'PostgresError') {
    // Database error
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    message = 'Lỗi cơ sở dữ liệu';
  } else if (error.name === 'TimeoutError') {
    // Timeout error
    statusCode = 408;
    errorCode = 'TIMEOUT_ERROR';
    message = 'Hết thời gian chờ';
  } else if (error.message.includes('duplicate key')) {
    // Duplicate key error
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Dữ liệu đã tồn tại';
  } else if (error.message.includes('foreign key')) {
    // Foreign key constraint error
    statusCode = 400;
    errorCode = 'INVALID_REFERENCE';
    message = 'Tham chiếu dữ liệu không hợp lệ';
  }

  // Create error response
  const errorResponse: ErrorResponseDto = {
    success: false,
    message,
    errorCode,
    errors: [error.message],
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async Error Handler Wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not Found Handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Endpoint ${req.method} ${req.path} không tồn tại`);
  next(error);
}

/**
 * Validation Error Handler
 */
export function handleValidationError(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error.isJoi) {
    const validationErrors = error.details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type
    }));

    const validationError = new ValidationError(
      'Dữ liệu đầu vào không hợp lệ',
      validationErrors
    );

    return next(validationError);
  }

  next(error);
}

/**
 * Request Timeout Handler
 */
export function requestTimeoutHandler(timeout: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      const error = new AppError(
        'Yêu cầu hết thời gian chờ',
        408,
        'REQUEST_TIMEOUT'
      );
      next(error);
    }, timeout);

    res.on('finish', () => {
      clearTimeout(timer);
    });

    res.on('close', () => {
      clearTimeout(timer);
    });

    next();
  };
}
