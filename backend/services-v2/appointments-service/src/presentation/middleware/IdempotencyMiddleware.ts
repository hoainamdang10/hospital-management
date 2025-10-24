/**
 * Idempotency Middleware for write endpoints
 * - Reads `Idempotency-Key` header
 * - Uses Redis to store keys with TTL to prevent duplicate processing
 * - Scope: POST requests under /api/v1/appointments*
 */

import { Request, Response, NextFunction } from 'express';
import { redisCacheService } from '../../infrastructure/cache/RedisCacheService';

const IDEMP_PREFIX = 'idemp:';
const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

function shouldApplyIdempotency(req: Request): boolean {
  if (req.method !== 'POST') return false;
  // Only apply to write endpoints in v1 appointments
  return req.path.startsWith('/api/v1/appointments');
}

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!shouldApplyIdempotency(req)) return next();

    const key = (req.headers['idempotency-key'] || req.headers['Idempotency-Key']) as string | undefined;
    if (!key) return next();

    // Build a cache key from header + method + path
    const cacheKey = `${IDEMP_PREFIX}${key}`;

    // Ensure redis connected (no-op if already)
    if (!redisCacheService.isReady()) {
      await redisCacheService.connect().catch(() => undefined);
    }

    const exists = await redisCacheService.exists(cacheKey);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate request detected (Idempotency-Key)'
      });
    }

    // Store a marker; we do not cache response yet (future improvement)
    await redisCacheService.set(cacheKey, { ts: Date.now(), method: req.method, path: req.path }, { ttl: DEFAULT_TTL_SECONDS, prefix: '' });

    return next();
  } catch (err) {
    // Fail-open
    return next();
  }
}

