/**
 * Error Handler Middleware - Presentation Layer
 * Centralized error handling for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security Best Practices
 */

import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

/**
 * Custom application error base class
 */
export class ApplicationError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
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
  constructor(message: string = 'Chưa xác thực') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Không có quyền truy cập') {
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
 * Payment error
 */
export class PaymentError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(402, message, 'PAYMENT_ERROR', details);
    this.name = 'PaymentError';
  }
}

/**
 * Insurance error
 */
export class InsuranceError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'INSURANCE_ERROR', details);
    this.name = 'InsuranceError';
  }
}

/**
 * Error handler middleware factory
 */
export function createErrorHandler(logger?: ILogger) {
  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    // Log error
    if (logger) {
      logger.error('Request error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
        userId: (req as any).user?.id,
        correlationId: req.headers['x-correlation-id']
      });
    } else {
      console.error('Request error:', {
        error: err.message,
        path: req.path,
        method: req.method
      });
    }

    // Handle known application errors
    if (err instanceof ApplicationError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code || 'APPLICATION_ERROR',
          message: err.message,
          details: err.details
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle domain errors (from domain layer)
    if (err.name === 'DomainError' || err.message.includes('không được') || err.message.includes('không thể')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DOMAIN_ERROR',
          message: err.message
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.message
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle database errors
    if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: 'Tài nguyên đã tồn tại'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle Supabase errors
    if (err.message.includes('JWT') || err.message.includes('token')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Token không hợp lệ hoặc đã hết hạn'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle network/timeout errors
    if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
      res.status(504).json({
        success: false,
        error: {
          code: 'GATEWAY_TIMEOUT',
          message: 'Yêu cầu hết thời gian chờ'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Default internal server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'Lỗi hệ thống, vui lòng thử lại sau'
          : err.message
      },
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * Default error handler (without logger)
 */
export const errorHandler = createErrorHandler();

