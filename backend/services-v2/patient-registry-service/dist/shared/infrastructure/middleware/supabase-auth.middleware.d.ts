/**
 * Supabase Authentication Middleware - Shared Infrastructure
 * JWT token validation middleware for all microservices
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Supabase Auth, Healthcare Security, Service Integration
 */
import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { HealthcareRole, HealthcareRoleType } from '../../../identity-access-service/src/domain/value-objects/healthcare-role';
import { ILogger } from '../logging/logger.interface';
import { IAuditService } from '../../application/services/audit.service.interface';
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
            permissions?: string[];
            correlationId?: string;
        }
    }
}
export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
    roles: HealthcareRole[];
    permissions: string[];
    profile: {
        phone?: string;
        department?: string;
        licenseNumber?: string;
    };
    lastLogin: Date;
    isActive: boolean;
}
export interface SupabaseAuthMiddlewareConfig {
    supabaseClient: SupabaseClient;
    logger: ILogger;
    auditService?: IAuditService;
    skipPaths?: string[];
    requireEmailVerification?: boolean;
    enableAuditLogging?: boolean;
}
/**
 * Supabase Authentication Middleware
 * Validates JWT tokens and loads user context for all services
 */
export declare class SupabaseAuthMiddleware {
    private readonly supabaseClient;
    private readonly logger;
    private readonly auditService?;
    private readonly skipPaths;
    private readonly requireEmailVerification;
    private readonly enableAuditLogging;
    constructor(config: SupabaseAuthMiddlewareConfig);
    /**
     * Authentication middleware function
     */
    authenticate(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Role-based authorization middleware
     */
    requireRole(allowedRoles: HealthcareRoleType | HealthcareRoleType[]): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Permission-based authorization middleware
     */
    requirePermission(requiredPermission: string): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Resource ownership authorization middleware
     */
    requireOwnership(resourceIdParam?: string, allowedRoles?: HealthcareRoleType[]): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Load user context from Supabase user
     */
    private loadUserContext;
    /**
     * Check if authentication should be skipped for this path
     */
    private shouldSkipAuthentication;
    /**
     * Handle authentication errors
     */
    private handleAuthenticationError;
    /**
     * Log security events
     */
    private logSecurityEvent;
    /**
     * Get role hierarchy for ordering
     */
    private getRoleHierarchy;
    /**
     * Create middleware factory for easy integration
     */
    static create(config: SupabaseAuthMiddlewareConfig): SupabaseAuthMiddleware;
    /**
     * Get middleware functions for easy use
     */
    getMiddleware(): {
        authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
        requireRole: (allowedRoles: HealthcareRoleType | HealthcareRoleType[]) => (req: Request, res: Response, next: NextFunction) => void;
        requirePermission: (requiredPermission: string) => (req: Request, res: Response, next: NextFunction) => void;
        requireOwnership: (resourceIdParam?: string, allowedRoles?: HealthcareRoleType[]) => (req: Request, res: Response, next: NextFunction) => void;
    };
}
//# sourceMappingURL=supabase-auth.middleware.d.ts.map