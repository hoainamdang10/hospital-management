/**
 * authMiddleware - Presentation Layer
 * Authentication and authorization middleware for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance JWT Authentication, Role-Based Access Control, Security
 */
import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: 'patient' | 'doctor' | 'receptionist' | 'admin';
    permissions: string[];
    hospitalId?: string;
    departmentId?: string;
}
export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}
/**
 * JWT Authentication Middleware
 */
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Role-based authorization middleware factory
 */
export declare const authorizeRoles: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Resource ownership validation middleware
 * Ensures patients can only access their own data
 */
export declare const validateResourceOwnership: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Permission-based authorization middleware
 */
export declare const requirePermissions: (requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Combined authentication and authorization middleware
 */
export declare const authMiddleware: (allowedRoles?: string[]) => ((req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>)[];
/**
 * Optional authentication middleware
 * Authenticates if token is present, but doesn't require it
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * API Key authentication for external services
 */
export declare const authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export { authenticateToken, authorizeRoles, validateResourceOwnership, requirePermissions, optionalAuth, authenticateApiKey };
//# sourceMappingURL=authMiddleware.d.ts.map