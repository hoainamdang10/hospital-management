"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = auditMiddleware;
function auditMiddleware(req, res, next) {
    // Log request for audit
    console.log(`[Audit] ${req.method} ${req.path} by ${req.headers['x-user-id']}`);
    next();
}
//# sourceMappingURL=audit.middleware.js.map