"use strict";
/**
 * Authentication Middleware
 * Verifies JWT tokens by calling Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationMiddleware = void 0;
const axios_1 = __importDefault(require("axios"));
class AuthenticationMiddleware {
    constructor(config) {
        this.identityServiceUrl = config.identityServiceUrl;
        this.logger = config.logger;
        this.skipPaths = config.skipPaths || ['/health', '/api-docs'];
        this.bypassAuth = process.env.BYPASS_AUTH === 'true';
        this.bypassToken = process.env.BYPASS_AUTH_TOKEN;
        this.bypassUserId =
            process.env.BYPASS_AUTH_USER_ID || '00000000-0000-0000-0000-000000000000';
    }
    /**
     * Authenticate request by verifying JWT with Identity Service
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                // Skip authentication for certain paths
                if (this.shouldSkipAuthentication(req.path)) {
                    return next();
                }
                // Allow bypass for local testing when explicitly enabled
                if (this.shouldBypassAuthentication(req)) {
                    req.user = this.createBypassUser();
                    this.logger.warn('Authentication bypassed for request', {
                        path: req.path,
                        bypassMode: 'BYPASS_AUTH_FLAG',
                    });
                    return next();
                }
                // Extract token from Authorization header
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Missing or invalid authorization header',
                    });
                    return;
                }
                const token = authHeader.substring(7); // Remove 'Bearer ' prefix
                // Verify token with Identity Service
                const user = await this.verifyTokenWithIdentityService(token);
                if (!user) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Invalid or expired token',
                    });
                    return;
                }
                // Attach user to request
                req.user = user;
                next();
            }
            catch (error) {
                // Redact path if it contains patient IDs (HIPAA compliance)
                const redactedPath = req.path.replace(/PAT-\d{6}-\d{3}/g, 'PAT-***-***');
                this.logger.error('Authentication middleware error', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    path: redactedPath,
                    // DO NOT log authorization header
                });
                res.status(500).json({
                    success: false,
                    error: 'Internal Server Error',
                    message: 'Authentication failed',
                });
            }
        };
    }
    /**
     * Determine if authentication should be bypassed for this request.
     * This is useful for local development when Identity Service is unavailable.
     */
    shouldBypassAuthentication(req) {
        if (this.bypassAuth) {
            return true;
        }
        if (this.bypassToken) {
            const tokenHeader = (req.headers['x-bypass-auth-token'] ||
                req.headers['x-auth-bypass-token'])?.toString() || '';
            return tokenHeader === this.bypassToken;
        }
        return false;
    }
    /**
     * Create a mock authenticated user for bypass mode.
     */
    createBypassUser() {
        return {
            userId: this.bypassUserId,
            email: 'bypass@patient-registry.local',
            roles: ['ADMIN', 'SYSTEM'],
            permissions: [
                'patients:read',
                'patients:create',
                'patients:update',
                'patients:delete',
            ],
        };
    }
    /**
     * Verify JWT token with Identity Service
     */
    async verifyTokenWithIdentityService(token) {
        try {
            const response = await axios_1.default.get(`${this.identityServiceUrl}/api/v1/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                timeout: 5000,
            });
            if (response.status === 200 &&
                response.data?.success &&
                response.data?.user) {
                const user = response.data.user;
                return {
                    userId: user.userId || user.id,
                    email: user.email,
                    roles: user.roles || [],
                    permissions: user.permissions || [],
                    sessionId: user.sessionId,
                };
            }
            return null;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    // Invalid token
                    return null;
                }
                this.logger.error('Identity Service verification failed', {
                    error: error.message,
                    status: error.response?.status,
                });
            }
            return null;
        }
    }
    /**
     * Check if path should skip authentication
     */
    shouldSkipAuthentication(path) {
        return this.skipPaths.some((skipPath) => path.startsWith(skipPath));
    }
    /**
     * Require specific role(s)
     */
    requireRole(allowedRoles) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required',
                });
                return;
            }
            const hasRole = req.user.roles.some((role) => roles.includes(role));
            if (!hasRole) {
                res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                });
                return;
            }
            next();
        };
    }
    /**
     * Require specific permission(s)
     */
    requirePermission(requiredPermissions) {
        const permissions = Array.isArray(requiredPermissions)
            ? requiredPermissions
            : [requiredPermissions];
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required',
                });
                return;
            }
            const hasPermission = permissions.every((permission) => req.user.permissions.includes(permission));
            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                });
                return;
            }
            next();
        };
    }
}
exports.AuthenticationMiddleware = AuthenticationMiddleware;
//# sourceMappingURL=AuthenticationMiddleware.js.map