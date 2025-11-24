"use strict";
/**
 * Express Validator Middleware
 * Simple validation middleware using express-validator
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const express_validator_1 = require("express-validator");
/**
 * Validate request using express-validator
 */
function validateRequest(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: 'param' in err ? err.param : 'unknown',
                message: err.msg
            }))
        });
        return;
    }
    next();
}
//# sourceMappingURL=validateRequest.js.map