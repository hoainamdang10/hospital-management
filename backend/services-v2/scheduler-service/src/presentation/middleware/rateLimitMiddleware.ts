import rateLimit from 'express-rate-limit';

// Read from environment variables or use defaults
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes default
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests default

console.log(`[RateLimit] Initialized: ${maxRequests} requests per ${windowMs}ms window`);

export const rateLimitMiddleware = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

