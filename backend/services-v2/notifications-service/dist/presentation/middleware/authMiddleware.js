"use strict";
/**
 * authMiddleware - Authentication Middleware
 * JWT authentication middleware for notification service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, JWT Security
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        // Skip authentication for health check
        if (req.path === '/health') {
            return next();
        }
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                message: 'Thiếu token xác thực',
                error: 'MISSING_AUTH_TOKEN',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token xác thực không hợp lệ',
                error: 'INVALID_AUTH_TOKEN',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                message: 'Lỗi cấu hình server',
                error: 'MISSING_JWT_SECRET',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Check if token is expired
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            res.status(401).json({
                success: false,
                message: 'Token đã hết hạn',
                error: 'TOKEN_EXPIRED',
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Attach user info to request
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Token xác thực không hợp lệ',
                error: 'INVALID_JWT_TOKEN',
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token đã hết hạn',
                error: 'TOKEN_EXPIRED',
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi xác thực',
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
            timestamp: new Date().toISOString()
        });
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Role-based authorization middleware
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Chưa xác thực',
                error: 'NOT_AUTHENTICATED',
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập',
                error: 'INSUFFICIENT_PERMISSIONS',
                timestamp: new Date().toISOString()
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Permission-based authorization middleware
 */
const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Chưa xác thực',
                error: 'NOT_AUTHENTICATED',
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (!req.user.permissions.includes(requiredPermission)) {
            res.status(403).json({
                success: false,
                message: 'Không có quyền thực hiện hành động này',
                error: 'INSUFFICIENT_PERMISSIONS',
                timestamp: new Date().toISOString()
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=authMiddleware.js.map