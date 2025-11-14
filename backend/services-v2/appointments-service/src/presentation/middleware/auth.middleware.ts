/**
 * Authentication Middleware - Presentation Layer
 * JWT-based authentication for API endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, JWT Security
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

/**
 * JWT Authentication Middleware
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid JWT token'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token missing',
        message: 'JWT token is required'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      req.user = {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
        tenantId: decoded.tenantId || 'hospital-1'
      };
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'JWT token is invalid or expired'
      });
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(requiredRole: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Role '${requiredRole}' is required`
      });
      return;
    }

    next();
  };
}

/**
 * Tenant isolation middleware
 */
export function requireTenant(tenantId: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
      return;
    }

    if (req.user.tenantId !== tenantId && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Tenant access denied',
        message: 'Access to this tenant is not permitted'
      });
      return;
    }

    next();
  };
}
