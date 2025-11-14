"use strict";
/**
 * Auth Middleware - Re-export for compatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = exports.validateRequest = exports.authenticateJWT = void 0;
var authMiddleware_1 = require("./authMiddleware");
Object.defineProperty(exports, "authenticateJWT", { enumerable: true, get: function () { return authMiddleware_1.authMiddleware; } });
var validationMiddleware_1 = require("./validationMiddleware");
Object.defineProperty(exports, "validateRequest", { enumerable: true, get: function () { return validationMiddleware_1.validateRequest; } });
Object.defineProperty(exports, "validationMiddleware", { enumerable: true, get: function () { return validationMiddleware_1.validationMiddleware; } });
//# sourceMappingURL=auth.middleware.js.map