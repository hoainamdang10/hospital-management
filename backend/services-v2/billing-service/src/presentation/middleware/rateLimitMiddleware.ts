/**
 * rateLimitMiddleware - Presentation Layer
 * Rate limiting middleware for billing service API protection
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance API Security, DDoS Protection, Vietnamese Healthcare Standards
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

/**
 * General API rate limiting
 * 100 requests per 15 minutes per IP
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    const user = (req as any).user;
    return user?.id || req.ip;
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

/**
 * Strict rate limiting for payment operations
 * 10 requests per 5 minutes per user
 */
export const paymentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each user to 10 payment requests per windowMs
  message: {
    success: false,
    error: {
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều yêu cầu thanh toán. Vui lòng thử lại sau 5 phút.',
      retryAfter: '5 minutes'
    }
  },
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id || req.ip;
  },
  skip: (req: Request) => {
    // Only apply to payment endpoints
    return !req.path.includes('/payments');
  }
});

/**
 * Insurance validation rate limiting
 * 20 requests per 10 minutes per user
 */
export const insuranceRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each user to 20 insurance validation requests per windowMs
  message: {
    success: false,
    error: {
      code: 'INSURANCE_RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều yêu cầu xác thực bảo hiểm. Vui lòng thử lại sau 10 phút.',
      retryAfter: '10 minutes'
    }
  },
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id || req.ip;
  },
  skip: (req: Request) => {
    // Only apply to insurance endpoints
    return !req.path.includes('/insurance');
  }
});

/**
 * Webhook rate limiting
 * 1000 requests per minute for webhooks (external services)
 */
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // High limit for webhook endpoints
  message: {
    success: false,
    error: {
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      message: 'Webhook rate limit exceeded',
      retryAfter: '1 minute'
    }
  },
  keyGenerator: (req: Request) => {
    // Use source IP for webhooks
    return req.ip;
  },
  skip: (req: Request) => {
    // Only apply to webhook endpoints
    return !req.path.includes('/webhooks');
  }
});

/**
 * Speed limiting middleware
 * Progressively slow down requests as they approach the rate limit
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id || req.ip;
  },
  skip: (req: Request) => {
    // Skip for health checks and webhooks
    return req.path === '/health' || req.path.includes('/webhooks');
  }
});

/**
 * Custom rate limiting for different user roles
 */
export const roleBasedRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    // Apply general rate limit for unauthenticated requests
    return generalRateLimit(req, res, next);
  }

  // Different limits based on user role
  const roleLimits = {
    admin: { windowMs: 15 * 60 * 1000, max: 500 }, // 500 requests per 15 minutes
    doctor: { windowMs: 15 * 60 * 1000, max: 200 }, // 200 requests per 15 minutes
    receptionist: { windowMs: 15 * 60 * 1000, max: 300 }, // 300 requests per 15 minutes
    patient: { windowMs: 15 * 60 * 1000, max: 50 } // 50 requests per 15 minutes
  };

  const userRole = user.role as keyof typeof roleLimits;
  const limits = roleLimits[userRole] || roleLimits.patient;

  const dynamicRateLimit = rateLimit({
    windowMs: limits.windowMs,
    max: limits.max,
    message: {
      success: false,
      error: {
        code: 'ROLE_RATE_LIMIT_EXCEEDED',
        message: `Quá nhiều yêu cầu cho vai trò ${userRole}. Vui lòng thử lại sau.`,
        retryAfter: `${limits.windowMs / 60000} minutes`
      }
    },
    keyGenerator: () => user.id,
    standardHeaders: true,
    legacyHeaders: false
  });

  return dynamicRateLimit(req, res, next);
};

/**
 * Burst protection middleware
 * Prevents rapid-fire requests
 */
export const burstProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Maximum 30 requests per minute
  message: {
    success: false,
    error: {
      code: 'BURST_LIMIT_EXCEEDED',
      message: 'Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng chậm lại.',
      retryAfter: '1 minute'
    }
  },
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id || req.ip;
  },
  skip: (req: Request) => {
    return req.path === '/health' || req.path.includes('/webhooks');
  }
});

/**
 * Combined rate limiting middleware
 * Applies appropriate rate limits based on endpoint
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Apply specific rate limits based on endpoint
  if (req.path.includes('/payments')) {
    return paymentRateLimit(req, res, () => {
      burstProtection(req, res, next);
    });
  }

  if (req.path.includes('/insurance')) {
    return insuranceRateLimit(req, res, () => {
      burstProtection(req, res, next);
    });
  }

  if (req.path.includes('/webhooks')) {
    return webhookRateLimit(req, res, next);
  }

  // Apply general rate limiting with role-based limits
  return roleBasedRateLimit(req, res, () => {
    speedLimiter(req, res, () => {
      burstProtection(req, res, next);
    });
  });
};

/**
 * Rate limit headers middleware
 * Adds custom rate limit information to response headers
 */
export const rateLimitHeaders = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  // Add custom headers with Vietnamese descriptions
  res.setHeader('X-RateLimit-Policy', 'Hospital Management System Rate Limiting');
  res.setHeader('X-RateLimit-Description', 'Giới hạn tốc độ yêu cầu API');
  
  if (user) {
    res.setHeader('X-RateLimit-User-Role', user.role);
    res.setHeader('X-RateLimit-User-ID', user.id);
  }

  next();
};

export {
  generalRateLimit,
  paymentRateLimit,
  insuranceRateLimit,
  webhookRateLimit,
  speedLimiter,
  roleBasedRateLimit,
  burstProtection,
  rateLimitHeaders
};
