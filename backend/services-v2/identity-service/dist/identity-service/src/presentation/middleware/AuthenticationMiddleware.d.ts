/**
 * Authentication Middleware
 * Express middleware for JWT token verification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
import { Request, Response, NextFunction } from 'express';
import { SupabaseAuthClient } from '../../infrastructure/auth/SupabaseAuthClient';
import { IPermissionService } from '../../application/services/IPermissionService';
/**
 * Extended Request with user info
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        roles: string[];
        permissions: string[];
    };
}
/**
 * Authentication Middleware
 */
export declare class AuthenticationMiddleware {
    private authClient;
    private permissionService;
    private logger;
    constructor(authClient: SupabaseAuthClient, permissionService: IPermissionService, logger: any);
    /**
     * Verify JWT token and attach user to request
     */
    authenticate(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Optional authentication - doesn't fail if no token
     */
    optionalAuthenticate(): (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require specific role
     */
    requireRole(...roles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Require admin role
     */
    requireAdmin(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Require doctor role
     */
    requireDoctor(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Require patient role
     */
    requirePatient(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=AuthenticationMiddleware.d.ts.map