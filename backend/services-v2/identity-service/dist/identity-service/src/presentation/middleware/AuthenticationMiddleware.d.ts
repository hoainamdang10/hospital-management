/**
 * Authentication Middleware
 * Express middleware for JWT token verification
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 * @compliance Clean Architecture, HIPAA
 */
import { Request, Response, NextFunction } from 'express';
import { IPermissionService } from '../../domain/services/IPermissionService';
import { ILogger } from '../../application/services/ILogger';
import { ITokenVerifier } from '../../application/services/ITokenVerifier';
/**
 * Extended Request with user info
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        roles: string[];
        permissions: string[];
        sessionId?: string;
    };
}
/**
 * Authentication Middleware
 */
export declare class AuthenticationMiddleware {
    private tokenVerifier;
    private permissionService;
    private logger;
    constructor(tokenVerifier: ITokenVerifier, permissionService: IPermissionService, logger: ILogger);
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