/**
 * Authentication Middleware - Presentation Layer
 * JWT Token Validation using Supabase
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { Request, Response, NextFunction } from "express";
/**
 * Extended Express Request with user info
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role?: string;
        sub?: string;
        patientId?: string;
    };
}
/**
 * Authentication Middleware
 * Validates JWT token from Authorization header
 */
export declare class AuthMiddleware {
    private supabase;
    constructor();
    /**
     * Middleware function to authenticate requests
     */
    authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Optional middleware for role-based access control
     */
    requireRole: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Optional middleware to allow optional authentication
     * Attaches user if token is valid, but doesn't reject if missing
     */
    optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Resolve canonical role for user. Falls back to user_profiles when JWT
     * metadata does not include role info (common for legacy tokens).
     */
    private resolveUserRole;
}
export declare const authMiddleware: AuthMiddleware;
/**
 * Quick helper functions for use in routes
 */
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=AuthMiddleware.d.ts.map