"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Read from environment variables or use defaults
const isRateLimitDisabled = process.env.DISABLE_RATE_LIMIT === 'true';
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes default
const maxRequests = isRateLimitDisabled ? 999999 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests default
console.log(`[RateLimit] ${isRateLimitDisabled ? 'DISABLED' : 'Initialized'}: ${maxRequests} requests per ${windowMs}ms window`);
exports.rateLimitMiddleware = (0, express_rate_limit_1.default)({
    windowMs,
    max: maxRequests,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isRateLimitDisabled // Skip rate limiting if disabled
});
//# sourceMappingURL=rateLimitMiddleware.js.map