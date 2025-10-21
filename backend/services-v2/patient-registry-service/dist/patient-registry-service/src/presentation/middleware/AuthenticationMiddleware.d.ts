/**
 * Authentication Middleware
 * Verifies JWT tokens by calling Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface AuthenticatedUser {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    sessionId?: string;
}
export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
    correlationId?: string;
}
export interface AuthenticationMiddlewareConfig {
    identityServiceUrl: string;
    logger: ILogger;
    skipPaths?: string[];
}
export declare class AuthenticationMiddleware {
    private readonly identityServiceUrl;
    private readonly logger;
    private readonly skipPaths;
    constructor(config: AuthenticationMiddlewareConfig);
    /**
     * Authenticate request by verifying JWT with Identity Service
     */
    authenticate(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Verify JWT token with Identity Service
     */
    private verifyTokenWithIdentityService;
    /**
     * Check if path should skip authentication
     */
    private shouldSkipAuthentication;
    /**
     * Require specific role(s)
     */
    requireRole(allowedRoles: string | string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Require specific permission(s)
     */
    requirePermission(requiredPermissions: string | string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=AuthenticationMiddleware.d.ts.map