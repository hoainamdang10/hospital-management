/**
 * authMiddleware - Authentication Middleware
 * JWT authentication middleware for notification service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, JWT Security
 */
import { Request, Response, NextFunction } from 'express';
interface JWTPayload {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    iat: number;
    exp: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Role-based authorization middleware
 */
export declare const requireRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Permission-based authorization middleware
 */
export declare const requirePermission: (requiredPermission: string) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=authMiddleware.d.ts.map