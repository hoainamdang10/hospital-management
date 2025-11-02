/**
 * Authentication Middleware
 * Express middleware for JWT token verification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security
 */
import { Request, Response, NextFunction } from 'express';
import { ITokenVerifier } from '../../application/services/ITokenVerifier';
import { ILogger } from '../../infrastructure/logging/logger';
import { IAuditLogService } from '../../application/services/IAuditLogService';
/**
 * Extended Request with user info
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role?: string;
        sessionId?: string;
    };
}
/**
 * Authentication Middleware
 */
export declare class AuthenticationMiddleware {
    private tokenVerifier;
    private auditLog;
    private logger;
    constructor(tokenVerifier: ITokenVerifier, auditLog: IAuditLogService, logger: ILogger);
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
    requireRole(...roles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require doctor role
     */
    requireDoctor(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require admin role
     */
    requireAdmin(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require doctor or admin
     */
    requireDoctorOrAdmin(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require nurse role
     */
    requireNurse(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require healthcare staff (doctor or nurse)
     */
    requireHealthcareStaff(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=AuthenticationMiddleware.d.ts.map