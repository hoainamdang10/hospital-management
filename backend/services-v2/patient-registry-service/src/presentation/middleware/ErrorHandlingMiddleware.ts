/**
 * Error Handling Middleware
 * Centralized error handling for Express
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */

import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@shared/application/services/logger.interface';

/**
 * Custom application error
 */
export class ApplicationError extends Error {
  public statusCode: number;

  constructor(
    statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApplicationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Domain error (business rule violation)
 */
export class DomainError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'DOMAIN_ERROR', details);
    this.name = 'DomainError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} với ID ${identifier} không tồn tại`
      : `${resource} không tồn tại`;
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, errors?: Array<{ field: string; message: string }>) {
    super(400, message, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict error (duplicate resource)
 */
export class ConflictError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(409, message, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * Error handling middleware with PHI/PII redaction
 */
export class ErrorHandlingMiddleware {
  constructor(private logger: ILogger) {}

  /**
   * Redact sensitive data from request before logging
   * HIPAA compliance - remove PHI/PII from logs
   */
  private redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const redacted = { ...data };
    const sensitiveFields = [
      'password', 'token', 'nationalId', 'phoneNumber', 'email',
      'address', 'dateOfBirth', 'bhytNumber', 'bhtnNumber',
      'personalInfo', 'contactInfo', 'insuranceInfo', 'medicalHistory'
    ];

    for (const field of sensitiveFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  /**
   * Handle errors with PHI/PII redaction
   */
  handle() {
    return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
      // Log error WITHOUT sensitive data (HIPAA compliance)
      this.logger.error('Request error', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        // DO NOT log body, query, params - they may contain PHI
      });

      // Handle known application errors
      if (err instanceof ApplicationError) {
        res.status(err.statusCode).json({
          success: false,
          error: err.code || 'APPLICATION_ERROR',
          message: err.message,
          details: err.details
        });
        return;
      }

      // Handle domain errors (from domain layer)
      if (err.name === 'DomainError' || err.message.includes('không được')) {
        res.status(400).json({
          success: false,
          error: 'DOMAIN_ERROR',
          message: err.message
        });
        return;
      }

      // Handle validation errors
      if (err.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: err.message
        });
        return;
      }

      // Handle database errors
      if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
        res.status(409).json({
          success: false,
          error: 'DUPLICATE_RESOURCE',
          message: 'Tài nguyên đã tồn tại'
        });
        return;
      }

      // Handle Supabase errors
      if (err.message.includes('PGRST')) {
        res.status(500).json({
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Lỗi cơ sở dữ liệu'
        });
        return;
      }

      // Handle circuit breaker errors
      if (err.message.includes('Circuit breaker')) {
        res.status(503).json({
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau'
        });
        return;
      }

      // Default error response
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    };
  }

  /**
   * Handle 404 Not Found
   */
  notFound() {
    return (req: Request, res: Response): void => {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} không tồn tại`
      });
    };
  }

  /**
   * Async handler wrapper
   * Catches async errors and passes to error middleware
   */
  static asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

/**
 * Success response helper
 */
export class ResponseHelper {
  /**
   * Send success response
   */
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }

  /**
   * Send created response
   */
  static created<T>(res: Response, data: T, message?: string): void {
    ResponseHelper.success(res, data, message, 201);
  }

  /**
   * Send no content response
   */
  static noContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): void {
    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message
    });
  }
}

