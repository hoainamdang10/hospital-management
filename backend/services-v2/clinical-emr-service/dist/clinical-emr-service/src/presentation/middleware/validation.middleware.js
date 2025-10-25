"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = validationMiddleware;
function validationMiddleware(schema) {
    return (req, res, next) => {
        // Simple validation - can enhance with Joi
        next();
    };
}
//# sourceMappingURL=validation.middleware.js.map