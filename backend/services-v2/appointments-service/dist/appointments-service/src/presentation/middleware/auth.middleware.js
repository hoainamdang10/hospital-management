"use strict";
/**
 * Authentication Middleware - Presentation Layer
 * JWT-based authentication for API endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, JWT Security
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
exports.requireTenant = requireTenant;
const jwt = __importStar(require("jsonwebtoken"));
/**
 * JWT Authentication Middleware
 */
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Please provide a valid JWT token'
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Token missing',
                message: 'JWT token is required'
            });
            return;
        }
        try {
            const decoded = jwt.verify(token, jwtSecret);
            req.user = {
                id: decoded.userId || decoded.id,
                email: decoded.email,
                role: decoded.role || 'user',
                tenantId: decoded.tenantId || 'hospital-1'
            };
            next();
        }
        catch (jwtError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'JWT token is invalid or expired'
            });
            return;
        }
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: 'An error occurred during authentication'
        });
    }
}
/**
 * Role-based access control middleware
 */
function requireRole(requiredRole) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Please authenticate first'
            });
            return;
        }
        if (req.user.role !== requiredRole && req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `Role '${requiredRole}' is required`
            });
            return;
        }
        next();
    };
}
/**
 * Tenant isolation middleware
 */
function requireTenant(tenantId) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Please authenticate first'
            });
            return;
        }
        if (req.user.tenantId !== tenantId && req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Tenant access denied',
                message: 'Access to this tenant is not permitted'
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map