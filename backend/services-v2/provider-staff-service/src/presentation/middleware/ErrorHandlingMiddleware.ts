/**
 * Error Handling Middleware
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Error Handling Best Practices
 */

import { Request, Response, NextFunction } from "express";
import { ILogger } from "@shared/infrastructure/logging/logger.interface";

// ==================== ERROR CLASSES ====================

export class ApplicationError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "ApplicationError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DomainError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 400, "DOMAIN_ERROR", details);
    this.name = "DomainError";
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, identifier: string) {
    super(`${resource} với ID ${identifier} không tồn tại`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = "Không có quyền truy cập") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = "Không đủ quyền thực hiện thao tác này") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 409, "CONFLICT", details);
    this.name = "ConflictError";
  }
}

// ==================== ERROR HANDLING MIDDLEWARE ====================

export class ErrorHandlingMiddleware {
  constructor(private logger: ILogger) {}

  /**
   * Handle errors
   */
  handle() {
    return (
      err: Error,
      req: Request,
      res: Response,
      _next: NextFunction,
    ): void => {
      // Log error
      this.logger.error("Request error", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Handle known application errors
      if (err instanceof ApplicationError) {
        res.status(err.statusCode).json({
          success: false,
          error: err.code || "APPLICATION_ERROR",
          message: err.message,
          details: err.details,
        });
        return;
      }

      // Handle domain errors (from domain layer)
      if (err.name === "DomainError" || err.message.includes("không được")) {
        res.status(400).json({
          success: false,
          error: "DOMAIN_ERROR",
          message: err.message,
        });
        return;
      }

      // Handle validation errors
      if (err.name === "ValidationError") {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: err.message,
        });
        return;
      }

      // Default error response
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau",
      });
    };
  }

  /**
   * Async handler wrapper
   */
  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// ==================== RESPONSE HELPERS ====================

export class ResponseHelper {
  /**
   * Success response
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = "Thành công",
    statusCode: number = 200,
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Created response
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = "Tạo mới thành công",
  ): void {
    ResponseHelper.success(res, data, message, 201);
  }

  /**
   * Paginated response
   */
  static paginated<T>(
    res: Response,
    items: T[],
    page: number,
    limit: number,
    total: number,
    message: string = "Thành công",
  ): void {
    const safeLimit = limit > 0 ? limit : 1;
    res.status(200).json({
      success: true,
      message,
      data: {
        items,
        pagination: {
          page,
          limit: safeLimit,
          total,
          totalPages: total > 0 ? Math.ceil(total / safeLimit) : 0,
        },
      },
    });
  }

  /**
   * No content response
   */
  static noContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Bad request response (400)
   */
  static badRequest(res: Response, message: string, errors?: any): void {
    res.status(400).json({
      success: false,
      error: "BAD_REQUEST",
      message,
      errors,
    });
  }

  /**
   * Error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errorCode: string = "ERROR",
    details?: any,
  ): void {
    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message,
      details,
    });
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get user ID from request
 */
export function getUserId(req: any): string {
  return req.user?.userId || req.user?.id || "system";
}

/**
 * Get user role from request
 */
export function getUserRole(req: any): string {
  return req.user?.roles?.[0] || req.user?.role || "patient";
}

/**
 * Check if user has role
 */
export function hasRole(req: any, roles: string | string[]): boolean {
  const userRoles = req.user?.roles || [];
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Check if user has permission
 */
export function hasPermission(req: any, permission: string): boolean {
  const permissions = req.user?.permissions || [];
  return permissions.includes(permission);
}
