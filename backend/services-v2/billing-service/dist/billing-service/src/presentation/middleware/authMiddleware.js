"use strict";
/**
 * authMiddleware - Presentation Layer
 * Authentication and authorization middleware for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance JWT Authentication, Role-Based Access Control, Security
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = exports.optionalAuth = exports.authMiddleware = exports.requirePermissions = exports.validateResourceOwnership = exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * JWT Authentication Middleware
 */
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Token xác thực không được cung cấp'
                }
            });
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not configured');
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SERVER_CONFIGURATION_ERROR',
                    message: 'Lỗi cấu hình máy chủ'
                }
            });
        }
        jsonwebtoken_1.default.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                let errorMessage = 'Token xác thực không hợp lệ';
                let errorCode = 'INVALID_TOKEN';
                if (err.name === 'TokenExpiredError') {
                    errorMessage = 'Token xác thực đã hết hạn';
                    errorCode = 'TOKEN_EXPIRED';
                }
                else if (err.name === 'JsonWebTokenError') {
                    errorMessage = 'Token xác thực không đúng định dạng';
                    errorCode = 'MALFORMED_TOKEN';
                }
                return res.status(401).json({
                    success: false,
                    error: {
                        code: errorCode,
                        message: errorMessage
                    }
                });
            }
            // Attach user information to request
            req.user = decoded;
            next();
        });
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUTHENTICATION_ERROR',
                message: 'Lỗi hệ thống xác thực'
            }
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Role-based authorization middleware factory
 */
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHENTICATED',
                        message: 'Người dùng chưa được xác thực'
                    }
                });
            }
            const userRole = req.user.role;
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Không có quyền truy cập tài nguyên này',
                        details: {
                            requiredRoles: allowedRoles,
                            userRole: userRole
                        }
                    }
                });
            }
            next();
        }
        catch (error) {
            console.error('Authorization middleware error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'AUTHORIZATION_ERROR',
                    message: 'Lỗi hệ thống phân quyền'
                }
            });
        }
    };
};
exports.authorizeRoles = authorizeRoles;
/**
 * Resource ownership validation middleware
 * Ensures patients can only access their own data
 */
const validateResourceOwnership = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'Người dùng chưa được xác thực'
                }
            });
        }
        const userRole = req.user.role;
        const userId = req.user.id;
        // Admin and staff can access all resources
        if (['admin', 'doctor', 'receptionist'].includes(userRole)) {
            return next();
        }
        // Patients can only access their own data
        if (userRole === 'patient') {
            const patientId = req.params.patientId || req.body.patientId;
            if (patientId && patientId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ACCESS_DENIED',
                        message: 'Không thể truy cập dữ liệu của bệnh nhân khác'
                    }
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Resource ownership validation error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'OWNERSHIP_VALIDATION_ERROR',
                message: 'Lỗi hệ thống xác thực quyền sở hữu'
            }
        });
    }
};
exports.validateResourceOwnership = validateResourceOwnership;
/**
 * Permission-based authorization middleware
 */
const requirePermissions = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHENTICATED',
                        message: 'Người dùng chưa được xác thực'
                    }
                });
            }
            const userPermissions = req.user.permissions || [];
            // Check if user has all required permissions
            const hasAllPermissions = requiredPermissions.every(permission => userPermissions.includes(permission));
            if (!hasAllPermissions) {
                const missingPermissions = requiredPermissions.filter(permission => !userPermissions.includes(permission));
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Không có đủ quyền để thực hiện hành động này',
                        details: {
                            requiredPermissions,
                            missingPermissions,
                            userPermissions
                        }
                    }
                });
            }
            next();
        }
        catch (error) {
            console.error('Permission validation error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'PERMISSION_VALIDATION_ERROR',
                    message: 'Lỗi hệ thống xác thực quyền hạn'
                }
            });
        }
    };
};
exports.requirePermissions = requirePermissions;
/**
 * Combined authentication and authorization middleware
 */
const authMiddleware = (allowedRoles = []) => {
    return [
        exports.authenticateToken,
        ...(allowedRoles.length > 0 ? [(0, exports.authorizeRoles)(allowedRoles)] : []),
        exports.validateResourceOwnership
    ];
};
exports.authMiddleware = authMiddleware;
/**
 * Optional authentication middleware
 * Authenticates if token is present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next(); // No token, continue without authentication
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return next(); // No JWT secret configured, continue without authentication
    }
    jsonwebtoken_1.default.verify(token, jwtSecret, (err, decoded) => {
        if (!err && decoded) {
            req.user = decoded;
        }
        // Continue regardless of token validity for optional auth
        next();
    });
};
exports.optionalAuth = optionalAuth;
/**
 * API Key authentication for external services
 */
const authenticateApiKey = (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'MISSING_API_KEY',
                    message: 'API key không được cung cấp'
                }
            });
        }
        const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
        if (!validApiKeys.includes(apiKey)) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'API key không hợp lệ'
                }
            });
        }
        next();
    }
    catch (error) {
        console.error('API key authentication error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'API_KEY_AUTHENTICATION_ERROR',
                message: 'Lỗi hệ thống xác thực API key'
            }
        });
    }
};
exports.authenticateApiKey = authenticateApiKey;
//# sourceMappingURL=authMiddleware.js.map