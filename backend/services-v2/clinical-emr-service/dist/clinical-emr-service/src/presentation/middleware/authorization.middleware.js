"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationMiddleware = authorizationMiddleware;
function authorizationMiddleware(allowedRoles) {
    return (req, res, next) => {
        const userRoles = req.headers['x-user-roles'];
        const roles = userRoles ? userRoles.split(',').map(r => r.trim()) : [];
        const hasPermission = allowedRoles.some(role => roles.includes(role));
        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: 'Forbidden - Insufficient permissions'
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=authorization.middleware.js.map