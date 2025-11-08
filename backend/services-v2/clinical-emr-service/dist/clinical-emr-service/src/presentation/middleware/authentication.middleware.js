"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
exports.authenticationMiddleware = authenticationMiddleware;
function authenticationMiddleware(req, res, next) {
    // Simple JWT check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized - No token provided'
        });
        return;
    }
    // For now, just pass through
    // TODO: Validate JWT
    next();
}
// Alias for compatibility
exports.authenticateJWT = authenticationMiddleware;
//# sourceMappingURL=authentication.middleware.js.map