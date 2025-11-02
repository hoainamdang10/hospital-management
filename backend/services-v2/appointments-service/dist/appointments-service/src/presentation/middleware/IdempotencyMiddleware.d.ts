/**
 * Idempotency Middleware for write endpoints
 * - Reads `Idempotency-Key` header
 * - Uses Redis to store keys with TTL to prevent duplicate processing
 * - Scope: POST requests under /api/v1/appointments*
 */
import { Request, Response, NextFunction } from 'express';
export declare function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=IdempotencyMiddleware.d.ts.map