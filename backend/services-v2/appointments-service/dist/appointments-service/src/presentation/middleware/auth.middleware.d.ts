/**
 * Authentication Middleware - Presentation Layer
 * JWT-based authentication for API endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, JWT Security
 */
import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        tenantId: string;
    };
}
/**
 * JWT Authentication Middleware
 */
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Role-based access control middleware
 */
export declare function requireRole(requiredRole: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Tenant isolation middleware
 */
export declare function requireTenant(tenantId: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map