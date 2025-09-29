"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRoleMiddleware = void 0;
const checkRoleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role'];
        if (userRole !== requiredRole) {
            res.status(403).json({
                success: false,
                error: `Access denied. ${requiredRole} role required.`
            });
            return;
        }
        next();
    };
};
exports.checkRoleMiddleware = checkRoleMiddleware;
