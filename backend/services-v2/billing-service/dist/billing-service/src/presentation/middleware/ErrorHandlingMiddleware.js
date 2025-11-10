"use strict";
/**
 * Error Handling Middleware
 * Copy from patient-registry-service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlingMiddleware = exports.ResponseHelper = exports.ValidationError = exports.NotFoundError = exports.DomainError = void 0;
class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = "DomainError";
    }
}
exports.DomainError = DomainError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class ResponseHelper {
    static success(data, message) {
        return {
            success: true,
            data,
            message,
        };
    }
    static error(message, details) {
        return {
            success: false,
            error: message,
            details,
        };
    }
}
exports.ResponseHelper = ResponseHelper;
class ErrorHandlingMiddleware {
    constructor(logger) {
        this.logger = logger;
    }
    handle() {
        return (err, req, res, next) => {
            this.logger.error("Error occurred", {
                error: err.message,
                stack: err.stack,
                path: req.path,
            });
            if (err instanceof NotFoundError) {
                res.status(404).json(ResponseHelper.error(err.message));
                return;
            }
            if (err instanceof ValidationError) {
                res.status(400).json(ResponseHelper.error(err.message));
                return;
            }
            if (err instanceof DomainError) {
                res.status(400).json(ResponseHelper.error(err.message));
                return;
            }
            res.status(500).json(ResponseHelper.error("Internal server error"));
        };
    }
    notFound() {
        return (req, res) => {
            res.status(404).json(ResponseHelper.error("Route not found"));
        };
    }
}
exports.ErrorHandlingMiddleware = ErrorHandlingMiddleware;
//# sourceMappingURL=ErrorHandlingMiddleware.js.map