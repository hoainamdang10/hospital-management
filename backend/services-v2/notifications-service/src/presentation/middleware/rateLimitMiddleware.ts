/**
 * rateLimitMiddleware - Rate Limiting Middleware
 * Rate limiting middleware for notification service with Vietnamese healthcare context
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, API Security
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message: string; // Error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  public isAllowed(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store[key];

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: this.store[key].resetTime
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}

// Different rate limiters for different endpoints
const generalLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
});

const sendNotificationLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 notifications per minute
  message: 'Quá nhiều yêu cầu gửi thông báo, vui lòng thử lại sau'
});

const bulkNotificationLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 bulk operations per hour
  message: 'Quá nhiều yêu cầu gửi thông báo hàng loạt, vui lòng thử lại sau'
});

const searchLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
  message: 'Quá nhiều yêu cầu tìm kiếm, vui lòng thử lại sau'
});

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Skip rate limiting for health checks
    if (req.path === '/health') {
      return next();
    }

    // Get client identifier (IP + User ID if available)
    const clientId = getClientId(req);
    
    // Choose appropriate limiter based on endpoint
    const limiter = getLimiterForEndpoint(req.path, req.method);
    
    const result = limiter.isAllowed(clientId);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        message: limiter['config'].message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();

  } catch (error) {
    // If rate limiting fails, allow the request to proceed
    console.error('Rate limiting error:', error);
    next();
  }
};

function getClientId(req: Request): string {
  // Use user ID if authenticated, otherwise use IP
  const userId = req.user?.id;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  return userId ? `user:${userId}` : `ip:${ip}`;
}

function getLimiterForEndpoint(path: string, method: string): RateLimiter {
  // Bulk operations have stricter limits
  if (path.includes('/bulk')) {
    return bulkNotificationLimiter;
  }

  // Send notification endpoints
  if ((path.includes('/send') || path.includes('/schedule')) && method === 'POST') {
    return sendNotificationLimiter;
  }

  // Search endpoints
  if (path.includes('/search') || path.includes('/analytics')) {
    return searchLimiter;
  }

  // Default limiter for other endpoints
  return generalLimiter;
}

/**
 * Healthcare-specific rate limiting
 */
export const healthcareRateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Emergency notifications bypass rate limiting
    if (req.body.priority === 'URGENT' || req.body.templateType === 'EMERGENCY_ALERT') {
      return next();
    }

    // Different limits for different user roles
    const userRole = req.user?.role;
    const limiter = getHealthcareLimiter(userRole);
    
    const clientId = `${userRole}:${req.user?.id || req.ip}`;
    const result = limiter.isAllowed(clientId);

    res.set({
      'X-Healthcare-RateLimit-Limit': limiter['config'].maxRequests.toString(),
      'X-Healthcare-RateLimit-Remaining': result.remaining.toString(),
      'X-Healthcare-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        message: getHealthcareRateLimitMessage(userRole),
        error: 'HEALTHCARE_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();

  } catch (error) {
    console.error('Healthcare rate limiting error:', error);
    next();
  }
};

function getHealthcareLimiter(userRole?: string): RateLimiter {
  switch (userRole) {
    case 'DOCTOR':
      return new RateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20, // Doctors can send more notifications
        message: 'Bác sĩ đã vượt quá giới hạn gửi thông báo'
      });

    case 'NURSE':
      return new RateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 15,
        message: 'Y tá đã vượt quá giới hạn gửi thông báo'
      });

    case 'RECEPTIONIST':
      return new RateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 25, // Receptionists send many appointment reminders
        message: 'Lễ tân đã vượt quá giới hạn gửi thông báo'
      });

    case 'ADMIN':
      return new RateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 50, // Admins have higher limits
        message: 'Quản trị viên đã vượt quá giới hạn gửi thông báo'
      });

    default:
      return new RateLimiter({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5, // Default low limit for unknown roles
        message: 'Người dùng đã vượt quá giới hạn gửi thông báo'
      });
  }
}

function getHealthcareRateLimitMessage(userRole?: string): string {
  const roleMessages: Record<string, string> = {
    'DOCTOR': 'Bác sĩ đã gửi quá nhiều thông báo trong thời gian ngắn. Vui lòng chờ trước khi gửi tiếp.',
    'NURSE': 'Y tá đã gửi quá nhiều thông báo trong thời gian ngắn. Vui lòng chờ trước khi gửi tiếp.',
    'RECEPTIONIST': 'Lễ tân đã gửi quá nhiều thông báo trong thời gian ngắn. Vui lòng chờ trước khi gửi tiếp.',
    'ADMIN': 'Quản trị viên đã gửi quá nhiều thông báo trong thời gian ngắn. Vui lòng chờ trước khi gửi tiếp.',
    'PATIENT': 'Bệnh nhân không được phép gửi thông báo trực tiếp.',
    'FAMILY': 'Thành viên gia đình không được phép gửi thông báo trực tiếp.'
  };

  return roleMessages[userRole || 'UNKNOWN'] || 'Người dùng đã vượt quá giới hạn gửi thông báo. Vui lòng thử lại sau.';
}

/**
 * IP-based rate limiting for public endpoints
 */
export const ipRateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    const ipLimiter = new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 200, // 200 requests per 15 minutes per IP
      message: 'Quá nhiều yêu cầu từ địa chỉ IP này'
    });

    const result = ipLimiter.isAllowed(`ip:${ip}`);

    res.set({
      'X-IP-RateLimit-Limit': '200',
      'X-IP-RateLimit-Remaining': result.remaining.toString(),
      'X-IP-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.',
        error: 'IP_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();

  } catch (error) {
    console.error('IP rate limiting error:', error);
    next();
  }
};
