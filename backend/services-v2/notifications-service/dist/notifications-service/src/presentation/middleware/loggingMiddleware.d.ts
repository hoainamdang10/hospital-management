/**
 * loggingMiddleware - Request Logging Middleware
 * Comprehensive logging middleware for notification service with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, HIPAA Compliance, Audit Logging
 */
import { Request, Response, NextFunction } from 'express';
interface LogEntry {
    timestamp: string;
    requestId: string;
    method: string;
    url: string;
    userAgent: string;
    ip: string;
    userId?: string;
    userRole?: string;
    statusCode?: number;
    responseTime?: number;
    requestSize: number;
    responseSize?: number;
    error?: string;
    healthcareContext?: {
        patientId?: string;
        doctorId?: string;
        appointmentId?: string;
        medicalRecordId?: string;
        action?: string;
    };
    sensitiveDataAccessed?: boolean;
    complianceFlags?: string[];
}
declare class Logger {
    private logs;
    private maxLogs;
    log(entry: LogEntry): void;
    private formatLogEntry;
    getRecentLogs(limit?: number): LogEntry[];
    getLogsByUser(userId: string, limit?: number): LogEntry[];
    getHealthcareLogs(context: {
        patientId?: string;
        doctorId?: string;
    }, limit?: number): LogEntry[];
    getAuditLogs(limit?: number): LogEntry[];
}
declare const logger: Logger;
export declare const loggingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Healthcare audit logging middleware
 */
export declare const auditLoggingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Error logging middleware
 */
export declare const errorLoggingMiddleware: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export { logger };
//# sourceMappingURL=loggingMiddleware.d.ts.map