"use strict";
/**
 * Middleware Exports - Presentation Layer
 * Central export point for all middleware
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Separation of Concerns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = exports.validateBHTNWebhook = exports.validateBHYTWebhook = exports.validatePayOSWebhook = exports.validateInsuranceClaim = exports.validatePatientId = exports.validateInvoiceId = exports.validateInsurance = exports.validateProcessPayment = exports.validateGenerateInvoice = exports.rateLimit = exports.cors = exports.loggingMiddleware = exports.authMiddleware = exports.rateLimitMiddleware = exports.requestLoggingMiddleware = exports.internalCors = exports.corsMiddleware = exports.validateDateRange = exports.validateVNDAmount = exports.validateField = exports.validateRequest = exports.hipaaAuditMiddleware = exports.createAuditMiddleware = exports.auditMiddleware = exports.InsuranceError = exports.PaymentError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.DomainError = exports.ApplicationError = exports.createErrorHandler = exports.errorHandler = void 0;
// Error Handling
var error_handler_middleware_1 = require("./error-handler.middleware");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return error_handler_middleware_1.errorHandler; } });
Object.defineProperty(exports, "createErrorHandler", { enumerable: true, get: function () { return error_handler_middleware_1.createErrorHandler; } });
Object.defineProperty(exports, "ApplicationError", { enumerable: true, get: function () { return error_handler_middleware_1.ApplicationError; } });
Object.defineProperty(exports, "DomainError", { enumerable: true, get: function () { return error_handler_middleware_1.DomainError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return error_handler_middleware_1.NotFoundError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return error_handler_middleware_1.ValidationError; } });
Object.defineProperty(exports, "UnauthorizedError", { enumerable: true, get: function () { return error_handler_middleware_1.UnauthorizedError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return error_handler_middleware_1.ForbiddenError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return error_handler_middleware_1.ConflictError; } });
Object.defineProperty(exports, "PaymentError", { enumerable: true, get: function () { return error_handler_middleware_1.PaymentError; } });
Object.defineProperty(exports, "InsuranceError", { enumerable: true, get: function () { return error_handler_middleware_1.InsuranceError; } });
// Audit Logging
var audit_middleware_1 = require("./audit.middleware");
Object.defineProperty(exports, "auditMiddleware", { enumerable: true, get: function () { return audit_middleware_1.auditMiddleware; } });
Object.defineProperty(exports, "createAuditMiddleware", { enumerable: true, get: function () { return audit_middleware_1.createAuditMiddleware; } });
Object.defineProperty(exports, "hipaaAuditMiddleware", { enumerable: true, get: function () { return audit_middleware_1.hipaaAuditMiddleware; } });
// Validation
var validation_middleware_1 = require("./validation.middleware");
Object.defineProperty(exports, "validateRequest", { enumerable: true, get: function () { return validation_middleware_1.validateRequest; } });
Object.defineProperty(exports, "validateField", { enumerable: true, get: function () { return validation_middleware_1.validateField; } });
Object.defineProperty(exports, "validateVNDAmount", { enumerable: true, get: function () { return validation_middleware_1.validateVNDAmount; } });
Object.defineProperty(exports, "validateDateRange", { enumerable: true, get: function () { return validation_middleware_1.validateDateRange; } });
// CORS
var cors_middleware_1 = require("./cors.middleware");
Object.defineProperty(exports, "corsMiddleware", { enumerable: true, get: function () { return cors_middleware_1.corsMiddleware; } });
Object.defineProperty(exports, "internalCors", { enumerable: true, get: function () { return cors_middleware_1.internalCors; } });
// Request Logging
var request_logging_middleware_1 = require("./request-logging.middleware");
Object.defineProperty(exports, "requestLoggingMiddleware", { enumerable: true, get: function () { return request_logging_middleware_1.requestLoggingMiddleware; } });
// Rate Limiting
var rate_limit_middleware_1 = require("./rate-limit.middleware");
Object.defineProperty(exports, "rateLimitMiddleware", { enumerable: true, get: function () { return rate_limit_middleware_1.rateLimitMiddleware; } });
// Authentication
var auth_middleware_1 = require("./auth.middleware");
Object.defineProperty(exports, "authMiddleware", { enumerable: true, get: function () { return auth_middleware_1.authMiddleware; } });
// Legacy exports for backward compatibility
var loggingMiddleware_1 = require("./loggingMiddleware");
Object.defineProperty(exports, "loggingMiddleware", { enumerable: true, get: function () { return loggingMiddleware_1.loggingMiddleware; } });
var corsMiddleware_1 = require("./corsMiddleware");
Object.defineProperty(exports, "cors", { enumerable: true, get: function () { return corsMiddleware_1.corsMiddleware; } });
var rateLimitMiddleware_1 = require("./rateLimitMiddleware");
Object.defineProperty(exports, "rateLimit", { enumerable: true, get: function () { return rateLimitMiddleware_1.rateLimitMiddleware; } });
var validationMiddleware_1 = require("./validationMiddleware");
Object.defineProperty(exports, "validateGenerateInvoice", { enumerable: true, get: function () { return validationMiddleware_1.validateGenerateInvoice; } });
Object.defineProperty(exports, "validateProcessPayment", { enumerable: true, get: function () { return validationMiddleware_1.validateProcessPayment; } });
Object.defineProperty(exports, "validateInsurance", { enumerable: true, get: function () { return validationMiddleware_1.validateInsurance; } });
Object.defineProperty(exports, "validateInvoiceId", { enumerable: true, get: function () { return validationMiddleware_1.validateInvoiceId; } });
Object.defineProperty(exports, "validatePatientId", { enumerable: true, get: function () { return validationMiddleware_1.validatePatientId; } });
Object.defineProperty(exports, "validateInsuranceClaim", { enumerable: true, get: function () { return validationMiddleware_1.validateInsuranceClaim; } });
Object.defineProperty(exports, "validatePayOSWebhook", { enumerable: true, get: function () { return validationMiddleware_1.validatePayOSWebhook; } });
Object.defineProperty(exports, "validateBHYTWebhook", { enumerable: true, get: function () { return validationMiddleware_1.validateBHYTWebhook; } });
Object.defineProperty(exports, "validateBHTNWebhook", { enumerable: true, get: function () { return validationMiddleware_1.validateBHTNWebhook; } });
Object.defineProperty(exports, "validationMiddleware", { enumerable: true, get: function () { return validationMiddleware_1.validationMiddleware; } });
//# sourceMappingURL=index.js.map