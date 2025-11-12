/**
 * Authorization Middleware
 * Smart ownership-based authorization for patient data
 *
 * AUTHORIZATION RULES:
 * 1. Patients can access their OWN data without special permissions
 * 2. Admin/Doctor need "patient:read" permission to access OTHER patients' data
 * 3. System/Service accounts with appropriate permissions can access all
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Response, NextFunction } from 'express';
import { ILogger } from '@shared/application/services/logger.interface';
import { AuthenticatedRequest } from './AuthenticationMiddleware';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface AuthorizationMiddlewareConfig {
    logger: ILogger;
    patientRepository: IPatientRepository;
}
export declare class AuthorizationMiddleware {
    private readonly logger;
    private readonly patientRepository;
    constructor(config: AuthorizationMiddlewareConfig);
    /**
     * Check if user can access patient data
     *
     * SMART AUTHORIZATION LOGIC:
     * - If requesting own data (patient.userId === req.user.userId) → ALLOW
     * - If has "patient:read" permission → ALLOW (admin/doctor)
     * - Otherwise → DENY (403)
     */
    canAccessPatientData(paramName?: 'patientId' | 'userId'): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require specific permission(s)
     * Fallback to permission-only check (no ownership logic)
     */
    requirePermission(requiredPermissions: string | string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Require specific role(s)
     */
    requireRole(allowedRoles: string | string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=AuthorizationMiddleware.d.ts.map