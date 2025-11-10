/**
 * Authentication Middleware - Presentation Layer
 * JWT-based authentication for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, JWT, RBAC, Security Best Practices
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: UserRole;
                tenantId?: string;
                permissions?: string[];
            };
            token?: string;
        }
    }
}
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    DOCTOR = "DOCTOR",
    NURSE = "NURSE",
    PATIENT = "PATIENT",
    CASHIER = "CASHIER",
    FINANCE_MANAGER = "FINANCE_MANAGER",
    INSURANCE_OFFICER = "INSURANCE_OFFICER"
}
interface AuthOptions {
    required?: boolean;
    roles?: UserRole[];
    permissions?: string[];
}
/**
 * Main authentication middleware
 */
export declare const authMiddleware: (options?: AuthOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Require specific roles
 */
export declare const requireRoles: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Require specific permissions
 */
export declare const requirePermissions: (...permissions: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Optional authentication (allows unauthenticated requests)
 */
export declare const optionalAuth: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Admin only access
 */
export declare const requireAdmin: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Finance staff access
 */
export declare const requireFinanceAccess: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Medical staff access
 */
export declare const requireMedicalStaffAccess: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Check if user can access patient data
 */
export declare const canAccessPatientData: (patientId: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Check if user can modify invoice
 */
export declare const canModifyInvoice: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Check if user can process payments
 */
export declare const canProcessPayment: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Check if user can manage insurance claims
 */
export declare const canManageInsuranceClaims: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Validate tenant isolation
 */
export declare const validateTenantIsolation: () => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Extract user ID from request
 */
export declare const getUserId: (req: Request) => string | null;
/**
 * Extract user role from request
 */
export declare const getUserRole: (req: Request) => UserRole | null;
/**
 * Check if user has role
 */
export declare const hasRole: (req: Request, role: UserRole) => boolean;
/**
 * Check if user has any of the roles
 */
export declare const hasAnyRole: (req: Request, roles: UserRole[]) => boolean;
/**
 * Check if user has permission
 */
export declare const hasPermission: (req: Request, permission: string) => boolean;
/**
 * Export default middleware
 */
export default authMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map