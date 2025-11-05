/**
 * Request Logging Middleware - Presentation Layer
 * Export wrapper for logging middleware
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Audit Logging, HIPAA Compliance
 */

export { loggingMiddleware as requestLoggingMiddleware } from './loggingMiddleware';
export type { LogContext, LoggedRequest } from './loggingMiddleware';

