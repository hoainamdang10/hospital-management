"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireReceptionistOrAdmin = exports.requireReceptionist = exports.requireDoctorOrAdmin = exports.requirePatient = exports.requireDoctor = exports.requireAdmin = exports.requireRole = exports.authMiddleware = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabase_1 = require("../config/supabase");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "No token provided",
                message: "Authorization header with Bearer token is required",
            });
            return;
        }
        const token = authHeader.substring(7);
        if (!token) {
            res.status(401).json({
                success: false,
                error: "No token provided",
                message: "Token is required",
            });
            return;
        }
        const { data: { user }, error, } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            logger_1.default.warn("Invalid token attempt", { error: error?.message });
            res.status(401).json({
                success: false,
                error: "Invalid or expired token",
                message: "Please sign in again",
            });
            return;
        }
        const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        if (profileError || !profile) {
            logger_1.default.error("Profile fetch error:", profileError);
            res.status(401).json({
                success: false,
                error: "User profile not found",
                message: "User profile is missing or invalid",
            });
            return;
        }
        if (!profile.is_active) {
            res.status(401).json({
                success: false,
                error: "Account is inactive",
                message: "Your account has been deactivated",
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            full_name: profile.full_name,
            role: profile.role,
            phone_number: profile.phone_number,
            is_active: profile.is_active,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
        };
        req.headers["x-user-id"] = user.id;
        req.headers["x-user-email"] = user.email || "";
        req.headers["x-user-role"] = profile.role;
        req.headers["x-user-name"] = profile.full_name || "";
        logger_1.default.debug("Request authenticated", {
            userId: user.id,
            email: user.email,
            role: profile.role,
            path: req.path,
            method: req.method,
        });
        next();
    }
    catch (error) {
        logger_1.default.error("Auth middleware error:", error);
        res.status(500).json({
            success: false,
            error: "Authentication failed",
            message: "Internal server error during authentication",
        });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Authentication required",
                message: "Please sign in to access this resource",
            });
            return;
        }
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(req.user.role)) {
            logger_1.default.warn("Access denied - insufficient role", {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: allowedRoles,
                path: req.path,
            });
            res.status(403).json({
                success: false,
                error: "Insufficient permissions",
                message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)("admin");
exports.requireDoctor = (0, exports.requireRole)("doctor");
exports.requirePatient = (0, exports.requireRole)("patient");
exports.requireDoctorOrAdmin = (0, exports.requireRole)(["doctor", "admin"]);
exports.requireReceptionist = (0, exports.requireRole)("receptionist");
exports.requireReceptionistOrAdmin = (0, exports.requireRole)([
    "receptionist",
    "admin",
]);
//# sourceMappingURL=auth.middleware.js.map