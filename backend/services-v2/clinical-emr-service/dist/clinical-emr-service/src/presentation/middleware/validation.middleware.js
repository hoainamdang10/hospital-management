"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = validationMiddleware;
exports.validateRequest = validateRequest;
const express_validator_1 = require("express-validator");
function validationMiddleware(schema) {
    return (req, res, next) => {
        // Simple validation - can enhance with Joi
        next();
    };
}
/**
 * Validate request using express-validator
 */
function validateRequest(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.type === 'field' ? err.path : 'unknown',
                message: err.msg,
                code: 'VALIDATION_ERROR'
            }))
        });
        return;
    }
    next();
}
//# sourceMappingURL=validation.middleware.js.map