/**
 * Idempotency Middleware for Identity Service write endpoints
 * - Reads `Idempotency-Key` header
 * - Uses Redis to store keys with TTL to prevent duplicate processing
 * - Scope: POST, PUT, DELETE requests under /api/v1/*
 * - Prevents duplicate user registrations, password changes, role assignments, etc.
 */

import { Request, Response, NextFunction } from 'express';
import { RedisCacheService } from '../../infrastructure/cache/RedisCacheService';

const IDEMP_PREFIX = 'idemp:identity:';
const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Determine if idempotency check should be applied
 * Apply to all write operations (POST, PUT, DELETE) except:
 * - Login/logout (stateless operations)
 * - Token refresh (idempotent by nature)
 */
function shouldApplyIdempotency(req: Request): boolean {
  // Only apply to write operations
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return false;
  }

  // Exclude stateless/idempotent operations
  const excludedPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/logout',
    '/api/v1/auth/refresh',
    '/api/v1/auth/verify-email', // Verification is idempotent
  ];

  return !excludedPaths.some(path => req.path === path);
}

/**
 * Create idempotency middleware with injected cache service
 * @param cacheService - Cache service instance (injected via DI)
 */
export function createIdempotencyMiddleware(cacheService: RedisCacheService | null) {
  /**
   * Idempotency middleware
   * - Checks for Idempotency-Key header
   * - Returns 409 Conflict if duplicate request detected
   * - Stores key in Redis with TTL
   * - Fails open (allows request) if Redis is unavailable
   */
  return async function idempotencyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // Skip if not applicable
      if (!shouldApplyIdempotency(req)) {
        return next();
      }

      // Get idempotency key from header (case-insensitive)
      const key = (req.headers['idempotency-key'] || req.headers['Idempotency-Key']) as
        | string
        | undefined;

      // If no key provided, skip idempotency check
      if (!key) {
        return next();
      }

      // If cache service not available, fail open (allow request)
      if (!cacheService) {
        return next();
      }

      const redisKey = `${IDEMP_PREFIX}${key}`;

      // Check if key exists
      const existing = await cacheService.get(redisKey);

      if (existing) {
        // Duplicate request detected
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_REQUEST',
          message: 'Yêu cầu đã được xử lý trước đó. Vui lòng không gửi lại.',
          idempotencyKey: key
        });
      }

      // Store key with TTL
      await cacheService.set(redisKey, {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      }, { ttl: DEFAULT_TTL_SECONDS });

      // Continue to next middleware
      next();
    } catch (error) {
      // Fail open: if Redis error, allow request to proceed
      // Log error but don't block the request
      console.error('Idempotency middleware error (failing open):', error);
      next();
    }
  };
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use createIdempotencyMiddleware instead
 */
export async function idempotencyMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<any> {
  // This is a placeholder - actual middleware should be created via factory
  console.warn('Using legacy idempotencyMiddleware - please use createIdempotencyMiddleware factory');
  next();
}
