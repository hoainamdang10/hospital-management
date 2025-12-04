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
                        permissions: ["*"],
                    };
                    return next();
                }
                // Allow trusted internal calls (service-to-service) using internal token
                if (this.isInternalCall(req)) {
                    req.authenticatedUser = {
                        userId: "internal-service",
                        email: "internal@billing.local",
                        roles: ["SERVICE"],
                        permissions: ["*"],
                    };
                    return next();
                }
                // Trust API Gateway forwarded headers first (already authenticated)
                const gatewayUser = this.extractGatewayUser(req);
                if (gatewayUser) {
                    req.authenticatedUser = gatewayUser;
                    return next();
                }
                // Extract token from Authorization header
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    res
                        .status(401)
                        .json({ error: "Missing or invalid authorization header" });
                    return;
                }
                const token = authHeader.substring(7);
                // Verify token with Identity Service
                const response = await axios_1.default.post(`${this.identityServiceUrl}/api/auth/verify`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000,
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
                    sessionId: response.data.sessionId,
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
        this.internalToken =
            process.env.INTERNAL_SERVICE_TOKEN ||
                process.env.BILLING_INTERNAL_TOKEN ||
                process.env.INTERNAL_TOKEN;
    }
    shouldSkipAuth(path) {
        return this.skipPaths.some((skipPath) => path.startsWith(skipPath));
    }
    extractGatewayUser(req) {
        const gatewayUserId = this.getHeaderValue(req, "x-user-id");
        if (!gatewayUserId) {
            return null;
        }
        const gatewayEmail = this.getHeaderValue(req, "x-user-email") || "unknown@patient.local";
        const roles = this.parseHeaderArray(this.getHeaderValue(req, "x-user-roles"));
        const permissions = this.parseHeaderArray(this.getHeaderValue(req, "x-user-permissions"));
        const patientId = this.getHeaderValue(req, "x-patient-id");
        return {
            userId: gatewayUserId,
            email: gatewayEmail,
            roles,
            permissions,
            sessionId: this.getHeaderValue(req, "x-session-id") || undefined,
            patientId: patientId || undefined,
        };
    }
    getHeaderValue(req, headerName) {
        const value = req.headers[headerName];
        if (Array.isArray(value)) {
            return value[0];
        }
        return value;
    }
    parseHeaderArray(raw) {
        if (!raw)
            return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item));
            }
        }
        catch {
            // Fallback to comma-separated values
        }
        return raw
            .split(",")
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
    }
    /**
     * Internal service-to-service access via shared token.
     * Accepted headers: x-internal-token
     */
    isInternalCall(req) {
        if (!this.internalToken) {
            return false;
        }
        const token = this.getHeaderValue(req, "x-internal-token") ||
            this.getHeaderValue(req, "x-service-token");
        return token === this.internalToken;
    }
}
exports.AuthenticationMiddleware = AuthenticationMiddleware;
//# sourceMappingURL=AuthenticationMiddleware.js.map