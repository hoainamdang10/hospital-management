/**
 * Audit Middleware - Presentation Layer
 * HIPAA-compliant audit logging for sensitive operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards, Security Audit
 */
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
    timestamp: string;
    userId: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    method: string;
    path: string;
    ipAddress: string;
    userAgent: string;
    requestId: string;
    correlationId: string;
    statusCode?: number;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
    healthcareContext?: {
        patientId?: string;
        invoiceId?: string;
        paymentId?: string;
        claimId?: string;
        accessType?: 'read' | 'write' | 'delete' | 'update';
        dataClassification?: 'PHI' | 'PII' | 'Financial' | 'Public';
    };
}
/**
 * Enhanced request interface with user info
 */
export interface AuditRequest extends Request {
    user?: {
        id: string;
        role: string;
        email?: string;
    };
    auditLog?: AuditLogEntry;
}
/**
 * Audit middleware factory
 */
export declare function createAuditMiddleware(logger?: ILogger): (req: AuditRequest, res: Response, next: NextFunction) => void;
/**
 * Default audit middleware (without logger)
 */
export declare const auditMiddleware: (req: AuditRequest, res: Response, next: NextFunction) => void;
/**
 * HIPAA compliance audit middleware
 * Stricter logging for PHI access
 */
export declare function hipaaAuditMiddleware(req: AuditRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=audit.middleware.d.ts.map