"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextUtils = exports.UserRole = void 0;
exports.createContext = createContext;
exports.hasRole = hasRole;
exports.hasPermission = hasPermission;
exports.getUserEntityId = getUserEntityId;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_config_1 = require("./config/database.config");
const dataloaders_1 = require("./dataloaders");
const i18n_middleware_1 = require("./middleware/i18n.middleware");
const rest_api_service_1 = require("./services/rest-api.service");
/**
 * User Roles
 */
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["DOCTOR"] = "doctor";
    UserRole["PATIENT"] = "patient";
    UserRole["RECEPTIONIST"] = "receptionist";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * Create GraphQL Context
 * Sets up all services, authentication, and utilities needed by resolvers
 */
async function createContext({ req, res, connectionParams, }) {
    // Extract request metadata
    const requestId = req.headers["x-request-id"] || generateRequestId();
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.connection.remoteAddress;
    // Determine language preference
    const acceptLanguage = req.headers["accept-language"];
    const language = acceptLanguage?.includes("vi") ? "vi" : "en";
    // Extract authentication token
    let token;
    let user;
    try {
        // Get token from Authorization header or connection params (for subscriptions)
        const authHeader = req.headers.authorization || connectionParams?.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            user = await authenticateUser(token);
        }
    }
    catch (error) {
        logger_1.default.warn("Authentication failed:", {
            error: error.message,
            requestId,
        });
        // Don't throw error here - let resolvers handle unauthorized access
    }
    // Create REST API service
    const restApi = new rest_api_service_1.RestApiService({
        baseURL: process.env.API_GATEWAY_URL || "http://localhost:3100",
        token,
        requestId,
        language,
    });
    // Create DataLoaders for N+1 optimization
    const dataloaders = (0, dataloaders_1.createDataLoaders)(restApi);
    // Create context object
    const context = {
        req,
        res,
        user,
        token,
        restApi,
        supabase: database_config_1.supabaseAdmin,
        dataloaders,
        requestId,
        userAgent,
        ipAddress,
        language,
        startTime: Date.now(),
    };
    // Add Vietnamese i18n support
    const contextWithI18n = (0, i18n_middleware_1.addVietnameseContext)(context);
    logger_1.default.debug("GraphQL context created:", {
        requestId,
        userId: user?.id,
        role: user?.role,
        language,
        hasToken: !!token,
    });
    return contextWithI18n;
}
/**
 * Authenticate user from JWT token
 * Updated to use only JWT_SECRET (Auth Service tokens)
 */
async function authenticateUser(token) {
    try {
        // Use only JWT_SECRET for Auth Service tokens
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET not configured");
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        logger_1.default.debug("Verified Auth Service JWT token");
        // Extract user information from Auth Service JWT token
        const user = {
            id: decoded.id || decoded.sub || decoded.userId,
            profileId: decoded.profileId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || [],
            doctor_id: decoded.doctor_id,
            patient_id: decoded.patient_id,
            fullName: decoded.fullName || decoded.full_name || decoded.name,
            is_active: decoded.is_active !== false,
            lastLoginAt: decoded.lastLoginAt
                ? new Date(decoded.lastLoginAt)
                : undefined,
            sessionId: decoded.sessionId,
            tokenIssuedAt: new Date(decoded.iat * 1000),
            tokenExpiresAt: new Date(decoded.exp * 1000),
        };
        // Validate token expiration
        if (user.tokenExpiresAt < new Date()) {
            throw new Error("Token expired");
        }
        // Validate user is active
        if (!user.is_active) {
            throw new Error("User account is inactive");
        }
        return user;
    }
    catch (error) {
        logger_1.default.error("Token authentication failed:", error);
        throw new Error("Invalid or expired token");
    }
}
/**
 * Generate unique request ID
 */
function generateRequestId() {
    return `gql-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Check if user has required role
 */
function hasRole(user, requiredRoles) {
    if (!user)
        return false;
    return requiredRoles.includes(user.role);
}
/**
 * Check if user has required permission
 */
function hasPermission(user, requiredPermission) {
    if (!user)
        return false;
    return (user.permissions.includes(requiredPermission) ||
        user.role === UserRole.ADMIN);
}
/**
 * Get user's entity ID based on role
 */
function getUserEntityId(user) {
    switch (user.role) {
        case UserRole.DOCTOR:
            return user.doctor_id;
        case UserRole.PATIENT:
            return user.patient_id;
        default:
            return user.id;
    }
}
/**
 * Context utilities for resolvers
 */
exports.contextUtils = {
    /**
     * Require authentication
     */
    requireAuth(context) {
        if (!context.user) {
            throw new Error("Yêu cầu xác thực");
        }
        return context.user;
    },
    /**
     * Require specific role
     */
    requireRole(context, roles) {
        const user = this.requireAuth(context);
        if (!hasRole(user, roles)) {
            throw new Error("Không có quyền truy cập");
        }
        return user;
    },
    /**
     * Require specific permission
     */
    requirePermission(context, permission) {
        const user = this.requireAuth(context);
        if (!hasPermission(user, permission)) {
            throw new Error("Không có quyền thực hiện hành động này");
        }
        return user;
    },
    /**
     * Check if user can access entity
     */
    canAccessEntity(context, entityUserId) {
        if (!context.user)
            return false;
        // Admin can access everything
        if (context.user.role === UserRole.ADMIN)
            return true;
        // Users can access their own data
        if (context.user.id === entityUserId)
            return true;
        // Doctors can access their patients' data (implement business logic)
        if (context.user.role === UserRole.DOCTOR) {
            // TODO: Check if patient is assigned to this doctor
            return true;
        }
        return false;
    },
    /**
     * Get Vietnamese error message
     */
    getVietnameseError(englishMessage) {
        const translations = {
            "Authentication required": "Yêu cầu xác thực",
            "Access denied": "Không có quyền truy cập",
            "Not found": "Không tìm thấy",
            "Invalid input": "Dữ liệu không hợp lệ",
            "Internal error": "Lỗi hệ thống",
        };
        return translations[englishMessage] || englishMessage;
    },
    /**
     * Safe i18n translate function
     */
    translate(context, key, params) {
        if (context.i18n?.translate) {
            return context.i18n.translate(key, params);
        }
        // Fallback Vietnamese translations
        const fallbackTranslations = {
            "appointment.errors.missing_identifier": "Cần cung cấp ID hoặc mã cuộc hẹn",
            "appointment.errors.fetch_failed": "Không thể lấy thông tin cuộc hẹn",
            "appointment.errors.today_failed": "Không thể lấy danh sách cuộc hẹn hôm nay",
            "appointment.errors.upcoming_failed": "Không thể lấy danh sách cuộc hẹn sắp tới",
            "appointment.errors.stats_failed": "Không thể lấy thống kê cuộc hẹn",
            "appointment.errors.create_failed": "Không thể tạo cuộc hẹn",
            "appointment.errors.update_failed": "Không thể cập nhật cuộc hẹn",
            "appointment.errors.cancel_failed": "Không thể hủy cuộc hẹn",
            "appointment.errors.confirm_failed": "Không thể xác nhận cuộc hẹn",
            "appointment.errors.reschedule_failed": "Không thể đổi lịch cuộc hẹn",
            "appointment.errors.checkin_failed": "Không thể check-in cuộc hẹn",
            "appointment.errors.complete_failed": "Không thể hoàn thành cuộc hẹn",
            "medical_record.errors.missing_id": "Cần cung cấp ID hồ sơ y tế",
            "medical_record.errors.fetch_failed": "Không thể lấy thông tin hồ sơ y tế",
            "medical_record.errors.search_failed": "Không thể tìm kiếm hồ sơ y tế",
            "medical_record.errors.create_failed": "Không thể tạo hồ sơ y tế",
            "medical_record.errors.update_failed": "Không thể cập nhật hồ sơ y tế",
            "medical_record.errors.delete_failed": "Không thể xóa hồ sơ y tế",
            "patient.errors.missing_identifier": "Cần cung cấp ID hoặc mã bệnh nhân",
            "patient.errors.fetch_failed": "Không thể lấy thông tin bệnh nhân",
            "patient.errors.search_failed": "Không thể tìm kiếm bệnh nhân",
            "patient.errors.medical_summary_failed": "Không thể lấy tóm tắt y tế",
            "patient.errors.stats_failed": "Không thể lấy thống kê bệnh nhân",
            "patient.errors.history_failed": "Không thể lấy lịch sử bệnh nhân",
            "patient.errors.create_failed": "Không thể tạo bệnh nhân",
            "patient.errors.update_failed": "Không thể cập nhật bệnh nhân",
            "patient.errors.delete_failed": "Không thể xóa bệnh nhân",
            "patient.errors.activate_failed": "Không thể kích hoạt bệnh nhân",
            "patient.errors.deactivate_failed": "Không thể vô hiệu hóa bệnh nhân",
            "patient.errors.medical_update_failed": "Không thể cập nhật thông tin y tế",
            "patient.errors.insurance_update_failed": "Không thể cập nhật thông tin bảo hiểm",
        };
        return fallbackTranslations[key] || key;
    },
};
exports.default = createContext;
//# sourceMappingURL=context.js.map