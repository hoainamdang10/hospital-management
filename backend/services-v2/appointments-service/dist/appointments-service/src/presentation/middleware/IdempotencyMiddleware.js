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
    const fullPath = `${req.baseUrl || ''}${req.path || ''}` || req.originalUrl || '';
    return fullPath.startsWith('/api/v1/appointments');
}
async function idempotencyMiddleware(req, res, next) {
    let cacheKey = null;
    try {
        if (!shouldApplyIdempotency(req)) {
            return next();
        }
        const key = (req.headers['idempotency-key'] ||
            req.headers['Idempotency-Key']);
        if (!key) {
            return next();
        }
        cacheKey = `${IDEMP_PREFIX}${key}`;
        if (!RedisCacheService_1.redisCacheService.isReady()) {
            await RedisCacheService_1.redisCacheService.connect().catch(() => undefined);
        }
        const existing = await RedisCacheService_1.redisCacheService.get(cacheKey, { prefix: '' });
        if (existing?.status === 'in-progress' || existing?.status === 'completed') {
            res.status(409).json({
                success: false,
                message: 'Duplicate request detected (Idempotency-Key)'
            });
            return;
        }
        await RedisCacheService_1.redisCacheService.set(cacheKey, {
            status: 'in-progress',
            ts: Date.now(),
            method: req.method,
            path: req.path
        }, { ttl: DEFAULT_TTL_SECONDS, prefix: '' });
        res.on('finish', async () => {
            const status = res.statusCode;
            if (status >= 200 && status < 400) {
                await RedisCacheService_1.redisCacheService.set(cacheKey, {
                    status: 'completed',
                    ts: Date.now(),
                    method: req.method,
                    path: req.path
                }, { ttl: DEFAULT_TTL_SECONDS, prefix: '' });
            }
            else if (cacheKey) {
                await RedisCacheService_1.redisCacheService.delete(cacheKey, { prefix: '' });
            }
        });
        next();
    }
    catch (error) {
        if (cacheKey) {
            await RedisCacheService_1.redisCacheService.delete(cacheKey, { prefix: '' }).catch(() => undefined);
        }
        next();
    }
}
//# sourceMappingURL=IdempotencyMiddleware.js.map