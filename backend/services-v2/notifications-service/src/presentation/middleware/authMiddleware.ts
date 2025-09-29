/**
 * authMiddleware - Authentication Middleware
 * JWT authentication middleware for notification service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, JWT Security
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Skip authentication for health check
    if (req.path === '/health') {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Thiếu token xác thực',
        error: 'MISSING_AUTH_TOKEN',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token xác thực không hợp lệ',
        error: 'INVALID_AUTH_TOKEN',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: 'Lỗi cấu hình server',
        error: 'MISSING_JWT_SECRET',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        error: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Attach user info to request
    req.user = decoded;
    
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token xác thực không hợp lệ',
        error: 'INVALID_JWT_TOKEN',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        error: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực',
      error: error instanceof Error ? error.message : 'Lỗi không xác định',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Chưa xác thực',
        error: 'NOT_AUTHENTICATED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
        error: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Chưa xác thực',
        error: 'NOT_AUTHENTICATED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện hành động này',
        error: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};
