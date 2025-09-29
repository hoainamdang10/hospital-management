import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header with Bearer token is required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Token is required'
      });
      return;
    }

    try {
      // Verify token with Auth Service
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      });

      const responseData = response.data as any;

      if (!responseData.success || !responseData.user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          message: 'Please sign in again'
        });
        return;
      }

      const user = responseData.user;

      // Add user info to request headers for downstream services
      // Use Buffer.from to properly encode Vietnamese characters
      req.headers['x-user-id'] = user.id;
      req.headers['x-user-email'] = user.email || '';
      req.headers['x-user-role'] = user.role;
      req.headers['x-user-name'] = user.full_name ?
        Buffer.from(user.full_name, 'utf8').toString('base64') : '';

      console.log('Request authenticated via Auth Service', {
        userId: user.id,
        email: user.email,
        role: user.role,
        path: req.path,
        method: req.method
      });

      next();

    } catch (authServiceError: any) {
      console.error('Auth service error:', authServiceError.message);

      if (authServiceError.response?.status === 401) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          message: 'Please sign in again'
        });
      } else if (authServiceError.code === 'ECONNREFUSED') {
        res.status(503).json({
          success: false,
          error: 'Auth service unavailable',
          message: 'Authentication service is temporarily unavailable'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Authentication failed',
          message: 'Internal authentication error'
        });
      }
      return;
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional Auth Middleware - for GraphQL and public endpoints
 * Attempts to authenticate but doesn't fail if no token provided
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header provided, continuing without authentication');
      next();
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      console.log('Empty token provided, continuing without authentication');
      next();
      return;
    }

    try {
      // Verify token with Auth Service
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      });

      const responseData = response.data as any;

      if (responseData.success && responseData.user) {
        const user = responseData.user;

        // Add user info to request for downstream services
        (req as any).user = user;
        req.headers['x-user-id'] = user.id;
        req.headers['x-user-email'] = user.email || '';
        req.headers['x-user-role'] = user.role;
        req.headers['x-user-name'] = user.full_name ?
          Buffer.from(user.full_name, 'utf8').toString('base64') : '';

        console.log('Optional auth successful', {
          userId: user.id,
          email: user.email,
          role: user.role,
          path: req.path,
          method: req.method
        });
      } else {
        console.log('Invalid token provided, continuing without authentication');
      }

    } catch (authServiceError: any) {
      console.warn('Optional auth failed, continuing without authentication:', authServiceError.message);
      // Don't fail the request, just continue without auth
    }

    next();

  } catch (error) {
    console.warn('Optional auth middleware error, continuing without authentication:', error);
    next();
  }
};
