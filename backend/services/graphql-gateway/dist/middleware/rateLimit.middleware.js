"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
exports.rateLimit = rateLimit;
exports.getRateLimitStatus = getRateLimitStatus;
exports.resetRateLimit = resetRateLimit;
const context_1 = require("../context");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
/**
 * In-memory rate limit store
 */
class MemoryRateLimitStore {
    constructor() {
        this.store = new Map();
    }
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        // Check if entry has expired
        if (Date.now() > entry.resetTime) {
            this.store.delete(key);
            return null;
        }
        return entry;
    }
    async set(key, value) {
        this.store.set(key, value);
    }
    async increment(key) {
        const existing = await this.get(key);
        if (existing) {
            existing.count++;
            await this.set(key, existing);
            return existing;
        }
        else {
            const newEntry = {
                count: 1,
                resetTime: Date.now() + (15 * 60 * 1000) // 15 minutes default
            };
            await this.set(key, newEntry);
            return newEntry;
        }
    }
}
/**
 * Rate limiting configurations for different user types
 */
const rateLimitConfigs = {
    // Anonymous users (no authentication)
    anonymous: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // 100 requests per 15 minutes
        keyGenerator: (context) => `anon:${context.ipAddress}`
    },
    // Authenticated patients
    patient: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 500, // 500 requests per 15 minutes
        keyGenerator: (context) => `patient:${context.user?.id}`
    },
    // Authenticated doctors
    doctor: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000, // 1000 requests per 15 minutes
        keyGenerator: (context) => `doctor:${context.user?.id}`
    },
    // Admin users
    admin: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 2000, // 2000 requests per 15 minutes
        keyGenerator: (context) => `admin:${context.user?.id}`
    },
    // Subscription rate limits (per connection)
    subscription: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 subscriptions per minute
        keyGenerator: (context) => `sub:${context.user?.id || context.ipAddress}`
    }
};
/**
 * Rate limiting store instance
 */
const rateLimitStore = new MemoryRateLimitStore();
/**
 * Rate limiting middleware for GraphQL
 */
exports.rateLimitMiddleware = {
    async requestDidStart() {
        return {
            async didResolveOperation(requestContext) {
                const context = requestContext.contextValue;
                const { request } = requestContext;
                // Skip rate limiting for introspection queries
                if (request.operationName === 'IntrospectionQuery') {
                    return;
                }
                // Get operation info
                const operation = requestContext.document?.definitions[0];
                if (!operation || operation.kind !== 'OperationDefinition') {
                    return;
                }
                const operationType = operation.operation;
                const operationName = operation.name?.value || 'Anonymous';
                // Determine rate limit config based on user role and operation type
                let config;
                if (operationType === 'subscription') {
                    config = rateLimitConfigs.subscription;
                }
                else if (!context.user) {
                    config = rateLimitConfigs.anonymous;
                }
                else {
                    switch (context.user.role) {
                        case context_1.UserRole.ADMIN:
                            config = rateLimitConfigs.admin;
                            break;
                        case context_1.UserRole.DOCTOR:
                            config = rateLimitConfigs.doctor;
                            break;
                        case context_1.UserRole.PATIENT:
                            config = rateLimitConfigs.patient;
                            break;
                        default:
                            config = rateLimitConfigs.patient;
                    }
                }
                // Generate rate limit key
                const key = config.keyGenerator(context);
                try {
                    // Check and increment rate limit
                    const result = await rateLimitStore.increment(key);
                    // Check if rate limit exceeded
                    if (result.count > config.maxRequests) {
                        const resetTime = new Date(result.resetTime);
                        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
                        logger_1.default.warn('Rate limit exceeded:', {
                            key,
                            count: result.count,
                            limit: config.maxRequests,
                            resetTime: resetTime.toISOString(),
                            operationType,
                            operationName,
                            userId: context.user?.id,
                            ipAddress: context.ipAddress
                        });
                        // Add rate limit info to context for response headers
                        context.rateLimitInfo = {
                            limit: config.maxRequests,
                            remaining: 0,
                            resetTime
                        };
                        throw new Error(`Vượt quá giới hạn yêu cầu. Thử lại sau ${retryAfter} giây. ` +
                            `Giới hạn: ${config.maxRequests} yêu cầu/${Math.floor(config.windowMs / 60000)} phút.`);
                    }
                    // Add rate limit info to context
                    context.rateLimitInfo = {
                        limit: config.maxRequests,
                        remaining: config.maxRequests - result.count,
                        resetTime: new Date(result.resetTime)
                    };
                    logger_1.default.debug('Rate limit check passed:', {
                        key,
                        count: result.count,
                        limit: config.maxRequests,
                        remaining: config.maxRequests - result.count,
                        operationType,
                        operationName
                    });
                }
                catch (error) {
                    if (error instanceof Error && error.message.includes('Vượt quá giới hạn')) {
                        throw error;
                    }
                    logger_1.default.error('Rate limit check error:', error);
                    // Don't block request on rate limit store errors
                }
            },
            async willSendResponse(requestContext) {
                const context = requestContext.contextValue;
                const { response } = requestContext;
                // Add rate limit headers to response
                if (context.rateLimitInfo && response?.http) {
                    response.http.headers.set('X-RateLimit-Limit', context.rateLimitInfo.limit.toString());
                    response.http.headers.set('X-RateLimit-Remaining', context.rateLimitInfo.remaining.toString());
                    response.http.headers.set('X-RateLimit-Reset', context.rateLimitInfo.resetTime.toISOString());
                    if (context.rateLimitInfo.remaining === 0) {
                        const retryAfter = Math.ceil((context.rateLimitInfo.resetTime.getTime() - Date.now()) / 1000);
                        response.http.headers.set('Retry-After', retryAfter.toString());
                    }
                }
            }
        };
    }
};
/**
 * Custom rate limit decorator for specific resolvers
 */
function rateLimit(maxRequests, windowMs = 15 * 60 * 1000) {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = async function (parent, args, context, info) {
            const key = `custom:${info.fieldName}:${context.user?.id || context.ipAddress}`;
            try {
                const result = await rateLimitStore.increment(key);
                if (result.count > maxRequests) {
                    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
                    throw new Error(`Vượt quá giới hạn cho ${info.fieldName}. Thử lại sau ${retryAfter} giây. ` +
                        `Giới hạn: ${maxRequests} yêu cầu/${Math.floor(windowMs / 60000)} phút.`);
                }
                return originalMethod.call(this, parent, args, context, info);
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('Vượt quá giới hạn')) {
                    throw error;
                }
                logger_1.default.error(`Rate limit error for ${info.fieldName}:`, error);
                return originalMethod.call(this, parent, args, context, info);
            }
        };
        return descriptor;
    };
}
/**
 * Get rate limit status for a key
 */
async function getRateLimitStatus(key) {
    try {
        const result = await rateLimitStore.get(key);
        if (!result)
            return null;
        // Determine limit based on key prefix
        let limit = 100; // default
        if (key.startsWith('admin:'))
            limit = 2000;
        else if (key.startsWith('doctor:'))
            limit = 1000;
        else if (key.startsWith('patient:'))
            limit = 500;
        return {
            count: result.count,
            limit,
            remaining: Math.max(0, limit - result.count),
            resetTime: new Date(result.resetTime)
        };
    }
    catch (error) {
        logger_1.default.error('Get rate limit status error:', error);
        return null;
    }
}
/**
 * Reset rate limit for a key (admin function)
 */
async function resetRateLimit(key) {
    try {
        await rateLimitStore.set(key, { count: 0, resetTime: Date.now() + (15 * 60 * 1000) });
        return true;
    }
    catch (error) {
        logger_1.default.error('Reset rate limit error:', error);
        return false;
    }
}
exports.default = exports.rateLimitMiddleware;
//# sourceMappingURL=rateLimit.middleware.js.map