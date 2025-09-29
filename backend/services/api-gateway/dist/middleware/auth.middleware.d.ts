import { Request, Response, NextFunction } from 'express';
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional Auth Middleware - for GraphQL and public endpoints
 * Attempts to authenticate but doesn't fail if no token provided
 */
export declare const optionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
