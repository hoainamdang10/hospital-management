"use strict";
/**
 * Base Controller - Presentation Layer
 * Common controller functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
class BaseController {
    /**
     * Extract user ID from request
     */
    extractUserId(req) {
        return req.headers['x-user-id'] || 'unknown';
    }
    /**
     * Extract user roles from request
     */
    extractUserRoles(req) {
        const rolesHeader = req.headers['x-user-roles'];
        return rolesHeader ? rolesHeader.split(',').map(r => r.trim()) : [];
    }
    /**
     * Send success response
     */
    sendSuccessResponse(res, data, message = 'Success', statusCode = 200) {
        res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Send error response
     */
    sendErrorResponse(res, message, statusCode = 400, errors) {
        res.status(statusCode).json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Handle controller errors
     */
    handleControllerError(res, error, defaultMessage = 'Internal server error') {
        console.error('Controller error:', error);
        const message = error instanceof Error ? error.message : defaultMessage;
        const statusCode = 500;
        this.sendErrorResponse(res, message, statusCode);
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=BaseController.js.map