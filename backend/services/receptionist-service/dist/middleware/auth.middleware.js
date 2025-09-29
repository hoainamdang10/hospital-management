"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.requireReceptionistOrAdmin = exports.requireAdmin = exports.requireReceptionist = exports.requireRole = exports.authMiddleware = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_config_1 = require("../config/database.config");
const authMiddleware = async (req, res, next) => {
    try {
        logger_1.default.info("🔍 AUTH MIDDLEWARE CALLED", {
            url: req.url,
            method: req.method,
            headers: {
                authorization: req.headers.authorization ? "Bearer ***" : "none",
                "user-agent": req.headers["user-agent"],
            },
        });
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Authorization token required",
            });
            return;
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.default.error("JWT_SECRET is not configured");
            res.status(500).json({
                success: false,
                message: "Server configuration error",
            });
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        }
        catch (jwtError) {
            logger_1.default.warn("Invalid JWT token:", { error: jwtError.message });
            res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
            return;
        }
        if (!decoded || !decoded.id) {
            logger_1.default.warn("Invalid token payload");
            res.status(401).json({
                success: false,
                message: "Invalid token payload",
            });
            return;
        }
        logger_1.default.info("🔍 DEBUG Auth Middleware - User from token:", {
            userId: decoded.id,
            email: decoded.email,
            role: decoded.role,
        });
        const { data: profile, error: profileError } = await database_config_1.supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", decoded.id)
            .single();
        logger_1.default.info("🔍 DEBUG Auth Middleware - Profile from database:", {
            profileFound: !!profile,
            profileRole: profile?.role,
            profileActive: profile?.is_active,
            profileEmail: profile?.email,
            error: profileError?.message,
        });
        if (profileError || !profile) {
            logger_1.default.error("Error fetching user profile:", {
                error: profileError,
                userId: decoded.id,
            });
            res.status(401).json({
                success: false,
                message: "User profile not found",
            });
            return;
        }
        if (!profile.is_active) {
            res.status(401).json({
                success: false,
                message: "User account is inactive",
            });
            return;
        }
        let receptionistId = null;
        if (profile.role === "receptionist") {
            const { data: receptionist, error: receptionistError } = await database_config_1.supabaseAdmin
                .from("receptionist")
                .select("receptionist_id")
                .eq("profile_id", decoded.id)
                .single();
            if (!receptionistError && receptionist) {
                receptionistId = receptionist.receptionist_id;
            }
        }
        req.user = {
            id: decoded.id,
            userId: decoded.id,
            email: decoded.email || profile.email,
            role: profile.role,
            full_name: profile.full_name,
            phone_number: profile.phone_number,
            is_active: profile.is_active,
            receptionist_id: receptionistId,
        };
        logger_1.default.info("🔍 DEBUG Auth Middleware - Final req.user:", {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email,
        });
        next();
    }
    catch (error) {
        logger_1.default.error("Auth middleware error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during authentication",
        });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireReceptionist = (0, exports.requireRole)(["receptionist"]);
exports.requireAdmin = (0, exports.requireRole)(["admin"]);
exports.requireReceptionistOrAdmin = (0, exports.requireRole)([
    "receptionist",
    "admin",
]);
exports.authenticateToken = exports.authMiddleware;
//# sourceMappingURL=auth.middleware.js.map