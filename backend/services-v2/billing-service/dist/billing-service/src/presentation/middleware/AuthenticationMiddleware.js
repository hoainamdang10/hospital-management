"use strict";
/**
 * Authentication Middleware
 * Verifies JWT tokens by calling Identity Service
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationMiddleware = void 0;
const axios_1 = __importDefault(require("axios"));
class AuthenticationMiddleware {
    constructor(config) {
        this.authenticate = async (req, res, next) => {
            try {
                // Skip authentication for certain paths
                if (this.shouldSkipAuth(req.path)) {
                    return next();
                }
                // Bypass authentication in development
                if (this.bypassAuth) {
                    req.authenticatedUser = {
                        userId: "dev-user-id",
                        email: "dev@example.com",
                        roles: ["ADMIN"],
                        permissions: ["*"]
                    };
                    return next();
                }
                // Extract token from Authorization header
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    res.status(401).json({ error: "Missing or invalid authorization header" });
                    return;
                }
                const token = authHeader.substring(7);
                // Verify token with Identity Service
                const response = await axios_1.default.post(`${this.identityServiceUrl}/api/auth/verify`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                });
                if (!response.data || !response.data.userId) {
                    res.status(401).json({ error: "Invalid token" });
                    return;
                }
                // Attach user to request
                req.authenticatedUser = {
                    userId: response.data.userId,
                    email: response.data.email,
                    roles: response.data.roles || [],
                    permissions: response.data.permissions || [],
                    sessionId: response.data.sessionId
                };
                next();
            }
            catch (error) {
                this.logger.error("Authentication failed", { error: error.message });
                res.status(401).json({ error: "Authentication failed" });
            }
        };
        this.identityServiceUrl = config.identityServiceUrl;
        this.logger = config.logger;
        this.skipPaths = config.skipPaths || ["/health", "/api-docs"];
        this.bypassAuth = process.env.BYPASS_AUTH === "true";
    }
    shouldSkipAuth(path) {
        return this.skipPaths.some(skipPath => path.startsWith(skipPath));
    }
}
exports.AuthenticationMiddleware = AuthenticationMiddleware;
//# sourceMappingURL=AuthenticationMiddleware.js.map