"use strict";
/**
 * Authentication Middleware
 * Express middleware for JWT token verification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationMiddleware = void 0;
const error_helper_1 = require("../../utils/error-helper");
/**
 * Authentication Middleware
 */
class AuthenticationMiddleware {
    constructor(authClient, permissionService, logger) {
        this.authClient = authClient;
        this.permissionService = permissionService;
        this.logger = logger;
    }
    /**
     * Verify JWT token and attach user to request
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                // Extract token from Authorization header
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Missing or invalid authorization header'
                    });
                    return;
                }
                const token = authHeader.substring(7); // Remove 'Bearer ' prefix
                // Verify token with Supabase
                const user = await this.authClient.verifyToken(token);
                if (!user) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Invalid or expired token'
                    });
                    return;
                }
                // Load user permissions
                const permissions = await this.permissionService.getUserPermissions(user.id);
                // Extract roles from user metadata or default
                const roles = user.user_metadata?.roles || ['patient'];
                // Attach user info to request
                req.user = {
                    userId: user.id,
                    email: user.email,
                    roles,
                    permissions
                };
                // Log authentication for audit
                this.logger.debug('User authenticated', {
                    userId: user.id,
                    email: user.email,
                    path: req.path,
                    method: req.method
                });
                next();
            }
            catch (error) {
                this.logger.error('Authentication error', {
                    error: (0, error_helper_1.getErrorMessage)(error),
                    path: req.path,
                    method: req.method
                });
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication failed'
                });
            }
        };
    }
    /**
     * Optional authentication - doesn't fail if no token
     */
    optionalAuthenticate() {
        return async (req, _res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    // No token provided - continue without user
                    return next();
                }
                const token = authHeader.substring(7);
                const user = await this.authClient.verifyToken(token);
                if (user) {
                    const permissions = await this.permissionService.getUserPermissions(user.id);
                    const roles = user.user_metadata?.roles || ['patient'];
                    req.user = {
                        userId: user.id,
                        email: user.email,
                        roles,
                        permissions
                    };
                }
                next();
            }
            catch (error) {
                // Log error but don't fail request
                this.logger.warn('Optional authentication failed', {
                    error: (0, error_helper_1.getErrorMessage)(error),
                    path: req.path
                });
                next();
            }
        };
    }
    /**
     * Require specific role
     */
    requireRole(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
                return;
            }
            const hasRole = roles.some(role => req.user.roles.includes(role));
            if (!hasRole) {
                this.logger.warn('Role check failed', {
                    userId: req.user.userId,
                    requiredRoles: roles,
                    userRoles: req.user.roles,
                    path: req.path
                });
                res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: `Required role: ${roles.join(' or ')}`,
                    requiredRoles: roles
                });
                return;
            }
            next();
        };
    }
    /**
     * Require admin role
     */
    requireAdmin() {
        return this.requireRole('admin');
    }
    /**
     * Require doctor role
     */
    requireDoctor() {
        return this.requireRole('doctor');
    }
    /**
     * Require patient role
     */
    requirePatient() {
        return this.requireRole('patient');
    }
}
exports.AuthenticationMiddleware = AuthenticationMiddleware;
//# sourceMappingURL=AuthenticationMiddleware.js.map