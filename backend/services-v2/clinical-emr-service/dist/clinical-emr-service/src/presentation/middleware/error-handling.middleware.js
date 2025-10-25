"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlingMiddleware = errorHandlingMiddleware;
function errorHandlingMiddleware(err, req, res, next) {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}
//# sourceMappingURL=error-handling.middleware.js.map