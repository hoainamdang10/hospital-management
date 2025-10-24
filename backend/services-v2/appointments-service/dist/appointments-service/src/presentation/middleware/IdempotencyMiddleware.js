"use strict";
/**
 * Idempotency Middleware for write endpoints
 * - Reads `Idempotency-Key` header
 * - Uses Redis to store keys with TTL to prevent duplicate processing
 * - Scope: POST requests under /api/v1/appointments*
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = idempotencyMiddleware;
const RedisCacheService_1 = require("../../infrastructure/cache/RedisCacheService");
const IDEMP_PREFIX = 'idemp:';
const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour
function shouldApplyIdempotency(req) {
    if (req.method !== 'POST')
        return false;
    // Only apply to write endpoints in v1 appointments
    return req.path.startsWith('/api/v1/appointments');
}
async function idempotencyMiddleware(req, res, next) {
    try {
        if (!shouldApplyIdempotency(req))
            return next();
        const key = (req.headers['idempotency-key'] || req.headers['Idempotency-Key']);
        if (!key)
            return next();
        // Build a cache key from header + method + path
        const cacheKey = `${IDEMP_PREFIX}${key}`;
        // Ensure redis connected (no-op if already)
        if (!RedisCacheService_1.redisCacheService.isReady()) {
            await RedisCacheService_1.redisCacheService.connect().catch(() => undefined);
        }
        const exists = await RedisCacheService_1.redisCacheService.exists(cacheKey);
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate request detected (Idempotency-Key)'
            });
        }
        // Store a marker; we do not cache response yet (future improvement)
        await RedisCacheService_1.redisCacheService.set(cacheKey, { ts: Date.now(), method: req.method, path: req.path }, { ttl: DEFAULT_TTL_SECONDS, prefix: '' });
        return next();
    }
    catch (err) {
        // Fail-open
        return next();
    }
}
//# sourceMappingURL=IdempotencyMiddleware.js.map