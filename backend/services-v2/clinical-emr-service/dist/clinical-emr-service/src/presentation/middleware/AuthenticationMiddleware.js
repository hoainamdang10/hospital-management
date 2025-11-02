"use strict";
/**
 * Authentication Middleware
 * Express middleware for JWT token verification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationMiddleware = void 0;
const IAuditLogService_1 = require("../../application/services/IAuditLogService");
/**
 * Authentication Middleware
 */
class AuthenticationMiddleware {
    constructor(tokenVerifier, auditLog, logger) {
        this.tokenVerifier = tokenVerifier;
        this.auditLog = auditLog;
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
                    await this.auditLog.logFailure(IAuditLogService_1.AuditAction.AUTHENTICATION_FAILED, 'anonymous', 'authentication', 'Missing or invalid authorization header', {
                        path: req.path,
                        method: req.method,
                        ip: req.ip
                    });
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Missing or invalid authorization header'
                    });
                    return;
                }
                const token = authHeader.substring(7); // Remove 'Bearer ' prefix
                // Verify token
                const user = await this.tokenVerifier.verifyToken(token);
                if (!user) {
                    await this.auditLog.logFailure(IAuditLogService_1.AuditAction.AUTHENTICATION_FAILED, 'anonymous', 'authentication', 'Invalid or expired token', {
                        path: req.path,
                        method: req.method,
                        ip: req.ip
                    });
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Invalid or expired token'
                    });
                    return;
                }
                // Attach user info to request
                req.user = {
                    userId: user.id,
                    email: user.email || '',
                    role: user.role,
                    sessionId: user.sessionId
                };
                // Log successful authentication
                await this.auditLog.logSuccess(IAuditLogService_1.AuditAction.AUTHENTICATION_SUCCESS, user.id, 'authentication', undefined, {
                    email: user.email,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                this.logger.debug('User authenticated', {
                    userId: user.id,
                    email: user.email,
                    sessionId: user.sessionId,
                    path: req.path,
                    method: req.method
                });
                next();
            }
            catch (error) {
                this.logger.error('Authentication error', {
                    error: error instanceof Error ? error.message : String(error),
                    path: req.path,
                    method: req.method
                });
                await this.auditLog.logFailure(IAuditLogService_1.AuditAction.AUTHENTICATION_FAILED, 'anonymous', 'authentication', error instanceof Error ? error.message : 'Authentication failed', {
                    path: req.path,
                    method: req.method,
                    ip: req.ip
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
                    return next();
                }
                const token = authHeader.substring(7);
                const user = await this.tokenVerifier.verifyToken(token);
                if (user) {
                    req.user = {
                        userId: user.id,
                        email: user.email || '',
                        role: user.role,
                        sessionId: user.sessionId
                    };
                }
                next();
            }
            catch (error) {
                this.logger.warn('Optional authentication failed', {
                    error: error instanceof Error ? error.message : String(error),
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
        return async (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
                return;
            }
            const hasRole = req.user.role && roles.includes(req.user.role);
            if (!hasRole) {
                this.logger.warn('Role check failed', {
                    userId: req.user.userId,
                    requiredRoles: roles,
                    userRole: req.user.role,
                    path: req.path
                });
                await this.auditLog.logFailure(IAuditLogService_1.AuditAction.AUTHORIZATION_FAILED, req.user.userId, 'authorization', `Required role: ${roles.join(' or ')}`, {
                    requiredRoles: roles,
                    userRole: req.user.role,
                    path: req.path,
                    method: req.method
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
     * Require doctor role
     */
    requireDoctor() {
        return this.requireRole('DOCTOR', 'doctor');
    }
    /**
     * Require admin role
     */
    requireAdmin() {
        return this.requireRole('ADMIN', 'SUPER_ADMIN', 'admin');
    }
    /**
     * Require doctor or admin
     */
    requireDoctorOrAdmin() {
        return this.requireRole('DOCTOR', 'doctor', 'ADMIN', 'SUPER_ADMIN', 'admin');
    }
    /**
     * Require nurse role
     */
    requireNurse() {
        return this.requireRole('NURSE', 'nurse');
    }
    /**
     * Require healthcare staff (doctor or nurse)
     */
    requireHealthcareStaff() {
        return this.requireRole('DOCTOR', 'doctor', 'NURSE', 'nurse');
    }
}
exports.AuthenticationMiddleware = AuthenticationMiddleware;
//# sourceMappingURL=AuthenticationMiddleware.js.map