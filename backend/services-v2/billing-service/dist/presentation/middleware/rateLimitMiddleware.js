"use strict";
/**
 * rateLimitMiddleware - Presentation Layer
 * Rate limiting middleware for billing service API protection
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance API Security, DDoS Protection, Vietnamese Healthcare Standards
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitHeaders = exports.rateLimitMiddleware = exports.burstProtection = exports.roleBasedRateLimit = exports.speedLimiter = exports.webhookRateLimit = exports.insuranceRateLimit = exports.paymentRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
/**
 * General API rate limiting
 * 100 requests per 15 minutes per IP
 */
exports.generalRateLimit = (0, express_rate_limit_1.default)({
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
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise use IP
        const user = req.user;
        return user?.id || req.ip;
    },
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    }
});
/**
 * Strict rate limiting for payment operations
 * 10 requests per 5 minutes per user
 */
exports.paymentRateLimit = (0, express_rate_limit_1.default)({
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
    keyGenerator: (req) => {
        const user = req.user;
        return user?.id || req.ip;
    },
    skip: (req) => {
        // Only apply to payment endpoints
        return !req.path.includes('/payments');
    }
});
/**
 * Insurance validation rate limiting
 * 20 requests per 10 minutes per user
 */
exports.insuranceRateLimit = (0, express_rate_limit_1.default)({
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
    keyGenerator: (req) => {
        const user = req.user;
        return user?.id || req.ip;
    },
    skip: (req) => {
        // Only apply to insurance endpoints
        return !req.path.includes('/insurance');
    }
});
/**
 * Webhook rate limiting
 * 1000 requests per minute for webhooks (external services)
 */
exports.webhookRateLimit = (0, express_rate_limit_1.default)({
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
    keyGenerator: (req) => {
        // Use source IP for webhooks
        return req.ip;
    },
    skip: (req) => {
        // Only apply to webhook endpoints
        return !req.path.includes('/webhooks');
    }
});
/**
 * Speed limiting middleware
 * Progressively slow down requests as they approach the rate limit
 */
exports.speedLimiter = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per windowMs without delay
    delayMs: 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 5000, // Maximum delay of 5 seconds
    keyGenerator: (req) => {
        const user = req.user;
        return user?.id || req.ip;
    },
    skip: (req) => {
        // Skip for health checks and webhooks
        return req.path === '/health' || req.path.includes('/webhooks');
    }
});
/**
 * Custom rate limiting for different user roles
 */
const roleBasedRateLimit = (req, res, next) => {
    const user = req.user;
    if (!user) {
        // Apply general rate limit for unauthenticated requests
        return (0, exports.generalRateLimit)(req, res, next);
    }
    // Different limits based on user role
    const roleLimits = {
        admin: { windowMs: 15 * 60 * 1000, max: 500 }, // 500 requests per 15 minutes
        doctor: { windowMs: 15 * 60 * 1000, max: 200 }, // 200 requests per 15 minutes
        receptionist: { windowMs: 15 * 60 * 1000, max: 300 }, // 300 requests per 15 minutes
        patient: { windowMs: 15 * 60 * 1000, max: 50 } // 50 requests per 15 minutes
    };
    const userRole = user.role;
    const limits = roleLimits[userRole] || roleLimits.patient;
    const dynamicRateLimit = (0, express_rate_limit_1.default)({
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
exports.roleBasedRateLimit = roleBasedRateLimit;
/**
 * Burst protection middleware
 * Prevents rapid-fire requests
 */
exports.burstProtection = (0, express_rate_limit_1.default)({
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
    keyGenerator: (req) => {
        const user = req.user;
        return user?.id || req.ip;
    },
    skip: (req) => {
        return req.path === '/health' || req.path.includes('/webhooks');
    }
});
/**
 * Combined rate limiting middleware
 * Applies appropriate rate limits based on endpoint
 */
const rateLimitMiddleware = (req, res, next) => {
    // Apply specific rate limits based on endpoint
    if (req.path.includes('/payments')) {
        return (0, exports.paymentRateLimit)(req, res, () => {
            (0, exports.burstProtection)(req, res, next);
        });
    }
    if (req.path.includes('/insurance')) {
        return (0, exports.insuranceRateLimit)(req, res, () => {
            (0, exports.burstProtection)(req, res, next);
        });
    }
    if (req.path.includes('/webhooks')) {
        return (0, exports.webhookRateLimit)(req, res, next);
    }
    // Apply general rate limiting with role-based limits
    return (0, exports.roleBasedRateLimit)(req, res, () => {
        (0, exports.speedLimiter)(req, res, () => {
            (0, exports.burstProtection)(req, res, next);
        });
    });
};
exports.rateLimitMiddleware = rateLimitMiddleware;
/**
 * Rate limit headers middleware
 * Adds custom rate limit information to response headers
 */
const rateLimitHeaders = (req, res, next) => {
    const user = req.user;
    // Add custom headers with Vietnamese descriptions
    res.setHeader('X-RateLimit-Policy', 'Hospital Management System Rate Limiting');
    res.setHeader('X-RateLimit-Description', 'Giới hạn tốc độ yêu cầu API');
    if (user) {
        res.setHeader('X-RateLimit-User-Role', user.role);
        res.setHeader('X-RateLimit-User-ID', user.id);
    }
    next();
};
exports.rateLimitHeaders = rateLimitHeaders;
//# sourceMappingURL=rateLimitMiddleware.js.map