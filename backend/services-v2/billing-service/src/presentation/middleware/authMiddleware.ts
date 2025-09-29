/**
 * authMiddleware - Presentation Layer
 * Authentication and authorization middleware for billing service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance JWT Authentication, Role-Based Access Control, Security
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'receptionist' | 'admin';
  permissions: string[];
  hospitalId?: string;
  departmentId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * JWT Authentication Middleware
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Token xác thực không được cung cấp'
        }
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_CONFIGURATION_ERROR',
          message: 'Lỗi cấu hình máy chủ'
        }
      });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        let errorMessage = 'Token xác thực không hợp lệ';
        let errorCode = 'INVALID_TOKEN';

        if (err.name === 'TokenExpiredError') {
          errorMessage = 'Token xác thực đã hết hạn';
          errorCode = 'TOKEN_EXPIRED';
        } else if (err.name === 'JsonWebTokenError') {
          errorMessage = 'Token xác thực không đúng định dạng';
          errorCode = 'MALFORMED_TOKEN';
        }

        return res.status(401).json({
          success: false,
          error: {
            code: errorCode,
            message: errorMessage
          }
        });
      }

      // Attach user information to request
      req.user = decoded as AuthenticatedUser;
      next();
    });

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Lỗi hệ thống xác thực'
      }
    });
  }
};

/**
 * Role-based authorization middleware factory
 */
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Người dùng chưa được xác thực'
          }
        });
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Không có quyền truy cập tài nguyên này',
            details: {
              requiredRoles: allowedRoles,
              userRole: userRole
            }
          }
        });
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Lỗi hệ thống phân quyền'
        }
      });
    }
  };
};

/**
 * Resource ownership validation middleware
 * Ensures patients can only access their own data
 */
export const validateResourceOwnership = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Người dùng chưa được xác thực'
        }
      });
    }

    const userRole = req.user.role;
    const userId = req.user.id;

    // Admin and staff can access all resources
    if (['admin', 'doctor', 'receptionist'].includes(userRole)) {
      return next();
    }

    // Patients can only access their own data
    if (userRole === 'patient') {
      const patientId = req.params.patientId || req.body.patientId;
      
      if (patientId && patientId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Không thể truy cập dữ liệu của bệnh nhân khác'
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Resource ownership validation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VALIDATION_ERROR',
        message: 'Lỗi hệ thống xác thực quyền sở hữu'
      }
    });
  }
};

/**
 * Permission-based authorization middleware
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Người dùng chưa được xác thực'
          }
        });
      }

      const userPermissions = req.user.permissions || [];
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(permission => 
          !userPermissions.includes(permission)
        );

        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Không có đủ quyền để thực hiện hành động này',
            details: {
              requiredPermissions,
              missingPermissions,
              userPermissions
            }
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission validation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_VALIDATION_ERROR',
          message: 'Lỗi hệ thống xác thực quyền hạn'
        }
      });
    }
  };
};

/**
 * Combined authentication and authorization middleware
 */
export const authMiddleware = (allowedRoles: string[] = []) => {
  return [
    authenticateToken,
    ...(allowedRoles.length > 0 ? [authorizeRoles(allowedRoles)] : []),
    validateResourceOwnership
  ];
};

/**
 * Optional authentication middleware
 * Authenticates if token is present, but doesn't require it
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // No token, continue without authentication
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next(); // No JWT secret configured, continue without authentication
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded as AuthenticatedUser;
    }
    // Continue regardless of token validity for optional auth
    next();
  });
};

/**
 * API Key authentication for external services
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key không được cung cấp'
        }
      });
    }

    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key không hợp lệ'
        }
      });
    }

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'API_KEY_AUTHENTICATION_ERROR',
        message: 'Lỗi hệ thống xác thực API key'
      }
    });
  }
};

export {
  authenticateToken,
  authorizeRoles,
  validateResourceOwnership,
  requirePermissions,
  optionalAuth,
  authenticateApiKey
};
