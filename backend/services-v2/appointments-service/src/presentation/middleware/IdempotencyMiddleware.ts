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
  const fullPath =
    `${req.baseUrl || ''}${req.path || ''}` || req.originalUrl || '';
  return fullPath.startsWith('/api/v1/appointments');
}

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let cacheKey: string | null = null;

  try {
    if (!shouldApplyIdempotency(req)) {
      return next();
    }

    const key = (req.headers['idempotency-key'] ||
      req.headers['Idempotency-Key']) as string | undefined;

    if (!key) {
      return next();
    }

    cacheKey = `${IDEMP_PREFIX}${key}`;

    if (!redisCacheService.isReady()) {
      await redisCacheService.connect().catch(() => undefined);
    }

    const existing = await redisCacheService.get<{
      status: 'in-progress' | 'completed';
    }>(cacheKey, { prefix: '' });

    if (existing?.status === 'in-progress' || existing?.status === 'completed') {
      res.status(409).json({
        success: false,
        message: 'Duplicate request detected (Idempotency-Key)'
      });
      return;
    }

    await redisCacheService.set(
      cacheKey,
      {
        status: 'in-progress',
        ts: Date.now(),
        method: req.method,
        path: req.path
      },
      { ttl: DEFAULT_TTL_SECONDS, prefix: '' }
    );

    res.on('finish', async () => {
      const status = res.statusCode;
      if (status >= 200 && status < 400) {
        await redisCacheService.set(
          cacheKey as string,
          {
            status: 'completed',
            ts: Date.now(),
            method: req.method,
            path: req.path
          },
          { ttl: DEFAULT_TTL_SECONDS, prefix: '' }
        );
      } else if (cacheKey) {
        await redisCacheService.delete(cacheKey, { prefix: '' });
      }
    });

    next();
  } catch (error) {
    if (cacheKey) {
      await redisCacheService.delete(cacheKey, { prefix: '' }).catch(() => undefined);
    }
    next();
  }
}
