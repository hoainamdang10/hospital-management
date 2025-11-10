"use strict";
/**
 * Authentication Middleware
 * Express middleware for JWT token verification
 *
 * @author Hospital Management Team
 * @version 3.1.0 - Fixed session_id extraction from JWT
 * @compliance Clean Architecture, HIPAA
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserId_1 = require("../../domain/value-objects/UserId");
const error_helper_1 = require("../../utils/error-helper");
/**
 * Authentication Middleware
 */
class AuthenticationMiddleware {
    constructor(tokenVerifier, permissionService, logger) {
        this.tokenVerifier = tokenVerifier;
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
                const user = await this.tokenVerifier.verifyToken(token);
                if (!user) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Invalid or expired token'
                    });
                    return;
                }
                // Load user permissions and roles from database (Single Source of Truth)
                const userId = UserId_1.UserId.fromString(user.id);
                const permissionsArray = await this.permissionService.getEffectivePermissions(userId);
                // Get roles from database (user_roles table), NOT from user_metadata
                // This ensures roles are always up-to-date and consistent
                const roles = await this.permissionService.getUserRoles(userId);
                // Extract session ID from JWT token payload (not user_metadata)
                // Supabase JWT contains session_id at top-level, not in user_metadata
                let sessionId;
                try {
                    const decoded = jsonwebtoken_1.default.decode(token);
                    sessionId = decoded?.session_id || decoded?.sid || decoded?.sessionId;
                    if (sessionId) {
                        this.logger.debug('Session ID extracted from JWT', {
                            userId: user.id,
                            sessionId
                        });
                    }
                    else {
                        this.logger.warn('Session ID not found in JWT token', {
                            userId: user.id,
                            decodedKeys: Object.keys(decoded || {})
                        });
                    }
                }
                catch (error) {
                    this.logger.warn('Failed to decode JWT for session_id extraction', {
                        userId: user.id,
                        error: (0, error_helper_1.getErrorMessage)(error)
                    });
                    // Continue without session_id - not critical for authentication
                }
                // Extract fullName from user metadata
                const fullName = user.user_metadata?.full_name ||
                    user.user_metadata?.fullName ||
                    user.email?.split('@')[0];
                // Attach user info to request
                req.user = {
                    userId: user.id,
                    email: user.email,
                    fullName,
                    roles,
                    permissions: permissionsArray,
                    sessionId
                };
                // Log authentication for audit
                this.logger.debug('User authenticated', {
                    userId: user.id,
                    email: user.email,
                    sessionId,
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
                const user = await this.tokenVerifier.verifyToken(token);
                if (user) {
                    const userId = UserId_1.UserId.fromString(user.id);
                    const permissionsArray = await this.permissionService.getEffectivePermissions(userId);
                    // Get roles from database (user_roles table), NOT from user_metadata
                    const roles = await this.permissionService.getUserRoles(userId);
                    // Extract session ID from JWT token
                    let sessionId;
                    try {
                        const decoded = jsonwebtoken_1.default.decode(token);
                        sessionId = decoded?.session_id;
                    }
                    catch (error) {
                        this.logger.warn('Failed to decode JWT for session_id in optional auth', {
                            error: (0, error_helper_1.getErrorMessage)(error)
                        });
                    }
                    // Extract fullName from user metadata
                    const fullName = user.user_metadata?.full_name ||
                        user.user_metadata?.fullName ||
                        user.email?.split('@')[0];
                    req.user = {
                        userId: user.id,
                        email: user.email,
                        fullName,
                        roles,
                        permissions: permissionsArray,
                        sessionId
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