"use strict";
/**
 * CORS Middleware - Presentation Layer
 * Export wrapper for CORS middleware
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance CORS Security, Healthcare Data Protection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalCors = exports.corsMiddleware = void 0;
var corsMiddleware_1 = require("./corsMiddleware");
Object.defineProperty(exports, "corsMiddleware", { enumerable: true, get: function () { return corsMiddleware_1.corsMiddleware; } });
Object.defineProperty(exports, "internalCors", { enumerable: true, get: function () { return corsMiddleware_1.internalCors; } });
//# sourceMappingURL=cors.middleware.js.map