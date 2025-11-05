/**
 * Middleware Exports - Presentation Layer
 * Central export point for all middleware
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Separation of Concerns
 */

// Error Handling
export {
  errorHandler,
  createErrorHandler,
  ApplicationError,
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  PaymentError,
  InsuranceError
} from './error-handler.middleware';

// Audit Logging
export {
  auditMiddleware,
  createAuditMiddleware,
  hipaaAuditMiddleware
} from './audit.middleware';
export type { AuditLogEntry, AuditRequest } from './audit.middleware';

// Validation
export {
  validateRequest,
  validateField,
  validateVNDAmount,
  validateDateRange
} from './validation.middleware';

// CORS
export { corsMiddleware, internalCors } from './cors.middleware';

// Request Logging
export { requestLoggingMiddleware } from './request-logging.middleware';
export type { LogContext, LoggedRequest } from './request-logging.middleware';

// Rate Limiting
export { rateLimitMiddleware } from './rate-limit.middleware';

// Authentication
export { authMiddleware } from './auth.middleware';

// Legacy exports for backward compatibility
export { loggingMiddleware } from './loggingMiddleware';
export { corsMiddleware as cors } from './corsMiddleware';
export { rateLimitMiddleware as rateLimit } from './rateLimitMiddleware';
export {
  validateGenerateInvoice,
  validateProcessPayment,
  validateInsurance,
  validateInvoiceId,
  validatePatientId,
  validateInsuranceClaim,
  validatePayOSWebhook,
  validateBHYTWebhook,
  validateBHTNWebhook,
  validationMiddleware
} from './validationMiddleware';

