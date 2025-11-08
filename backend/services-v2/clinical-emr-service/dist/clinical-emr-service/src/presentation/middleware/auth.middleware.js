"use strict";
/**
 * Auth Middleware - Re-export for compatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = exports.validateRequest = exports.authenticationMiddleware = exports.authenticateJWT = void 0;
var authentication_middleware_1 = require("./authentication.middleware");
Object.defineProperty(exports, "authenticateJWT", { enumerable: true, get: function () { return authentication_middleware_1.authenticateJWT; } });
Object.defineProperty(exports, "authenticationMiddleware", { enumerable: true, get: function () { return authentication_middleware_1.authenticationMiddleware; } });
var validation_middleware_1 = require("./validation.middleware");
Object.defineProperty(exports, "validateRequest", { enumerable: true, get: function () { return validation_middleware_1.validateRequest; } });
Object.defineProperty(exports, "validationMiddleware", { enumerable: true, get: function () { return validation_middleware_1.validationMiddleware; } });
//# sourceMappingURL=auth.middleware.js.map