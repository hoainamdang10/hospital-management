"use strict";
/**
 * Authentication Middleware - Presentation Layer
 * JWT Token Validation using Supabase
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireRole = exports.authenticate = exports.authMiddleware = exports.AuthMiddleware = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const Logger_1 = require("../../infrastructure/logging/Logger");
const logger = (0, Logger_1.createLogger)("AuthMiddleware");
/**
 * Authentication Middleware
 * Validates JWT token from Authorization header
 */
class AuthMiddleware {
    constructor() {
        /**
         * Middleware function to authenticate requests
         */
        this.authenticate = async (req, res, next) => {
            try {
                // 1. Extract token from Authorization header
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized - No token provided",
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                const token = authHeader.replace("Bearer ", "");
                // 2. Verify JWT token with Supabase
                const { data, error } = await this.supabase.auth.getUser(token);
                if (error || !data.user) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized - Invalid token",
                        error: error?.message,
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                // 3. Attach user info to request (include mapped patientId if present in metadata)
                const rawRole = data.user.user_metadata?.role || data.user.app_metadata?.role;
                const patientId = data.user.user_metadata?.patientId ||
                    data.user.user_metadata?.patient_id ||
                    data.user.app_metadata?.patientId ||
                    data.user.app_metadata?.patient_id;
                req.user = {
                    id: data.user.id,
                    email: data.user.email,
                    role: rawRole ? rawRole.toUpperCase() : undefined, // Normalize to uppercase
                    sub: data.user.id,
                    patientId: typeof patientId === "string" ? patientId : undefined,
                };
                // 4. Log authentication (optional, for audit)
                logger.info("User authenticated", {
                    userId: req.user.id,
                    email: req.user.email,
                });
                next();
            }
            catch (error) {
                console.error("[Auth] Authentication error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error during authentication",
                    timestamp: new Date().toISOString(),
                });
            }
        };
        /**
         * Optional middleware for role-based access control
         */
        this.requireRole = (allowedRoles) => {
            return (req, res, next) => {
                if (!req.user) {
                    res.status(401).json({
                        success: false,
                        message: "Unauthorized - Authentication required",
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                const userRole = req.user.role;
                if (!userRole || !allowedRoles.includes(userRole)) {
                    res.status(403).json({
                        success: false,
                        message: `Forbidden - Required roles: ${allowedRoles.join(", ")}`,
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                next();
            };
        };
        /**
         * Optional middleware to allow optional authentication
         * Attaches user if token is valid, but doesn't reject if missing
         */
        this.optionalAuth = async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    // No token - continue without user
                    next();
                    return;
                }
                const token = authHeader.replace("Bearer ", "");
                const { data, error } = await this.supabase.auth.getUser(token);
                if (!error && data.user) {
                    const rawRole = data.user.user_metadata?.role || data.user.app_metadata?.role;
                    req.user = {
                        id: data.user.id,
                        email: data.user.email,
                        role: rawRole ? rawRole.toUpperCase() : undefined, // Normalize to uppercase
                        sub: data.user.id,
                    };
                }
                next();
            }
            catch (error) {
                console.error("[Auth] Optional auth error:", error);
                next();
            }
        };
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
}
exports.AuthMiddleware = AuthMiddleware;
// Export singleton instance
exports.authMiddleware = new AuthMiddleware();
/**
 * Quick helper functions for use in routes
 */
exports.authenticate = exports.authMiddleware.authenticate;
const requireRole = (roles) => exports.authMiddleware.requireRole(roles);
exports.requireRole = requireRole;
exports.optionalAuth = exports.authMiddleware.optionalAuth;
//# sourceMappingURL=AuthMiddleware.js.map