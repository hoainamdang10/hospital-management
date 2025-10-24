/**
 * Rate Limit Middleware
 * Protects API endpoints from abuse and DDoS attacks
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Security Best Practices, HIPAA
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limit configuration for different endpoint types
 */
export class RateLimitMiddleware {
  /**
   * General API rate limiter
   * 100 requests per 15 minutes per IP
   */
  static general = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId || 'unknown'
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/info';
    }
  });

  /**
   * Authentication endpoints rate limiter
   * 5 requests per 15 minutes per IP (stricter for security)
   */
  static authentication = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
      success: false,
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Quá nhiều lần đăng nhập thất bại. Tài khoản tạm thời bị khóa.',
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId || 'unknown',
        retryAfter: 900 // 15 minutes in seconds
      });
    }
  });

  /**
   * Search endpoints rate limiter
   * 30 requests per 1 minute per IP
   */
  static search = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per windowMs
    message: {
      success: false,
      error: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau 1 phút.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'SEARCH_RATE_LIMIT_EXCEEDED',
        message: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId || 'unknown',
        retryAfter: 60 // 1 minute in seconds
      });
    }
  });

  /**
   * Write operations rate limiter (POST, PUT, PATCH, DELETE)
   * 20 requests per 5 minutes per IP
   */
  static writeOperations = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: {
      success: false,
      error: 'WRITE_RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều thao tác ghi dữ liệu. Vui lòng thử lại sau 5 phút.',
      retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'WRITE_RATE_LIMIT_EXCEEDED',
        message: 'Quá nhiều thao tác ghi dữ liệu. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId || 'unknown',
        retryAfter: 300 // 5 minutes in seconds
      });
    },
    skip: (req: Request) => {
      // Only apply to write operations
      return !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    }
  });

  /**
   * Credential management rate limiter
   * 10 requests per 10 minutes per IP (sensitive operations)
   */
  static credentialManagement = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
      success: false,
      error: 'CREDENTIAL_RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều thao tác quản lý chứng chỉ. Vui lòng thử lại sau 10 phút.',
      retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'CREDENTIAL_RATE_LIMIT_EXCEEDED',
        message: 'Quá nhiều thao tác quản lý chứng chỉ. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId || 'unknown',
        retryAfter: 600 // 10 minutes in seconds
      });
    }
  });

  /**
   * Status change rate limiter
   * 5 requests per 10 minutes per IP (critical operations)
   */
  static statusChange = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
      success: false,
      error: 'STATUS_CHANGE_RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều thao tác thay đổi trạng thái. Vui lòng thử lại sau 10 phút.',
      retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'STATUS_CHANGE_RATE_LIMIT_EXCEEDED',
        message: 'Quá nhiều thao tác thay đổi trạng thái nhân viên. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId || 'unknown',
        retryAfter: 600 // 10 minutes in seconds
      });
    }
  });
}

