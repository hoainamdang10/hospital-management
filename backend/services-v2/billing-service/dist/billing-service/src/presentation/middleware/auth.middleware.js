"use strict";
/**
 * Authentication Middleware - Presentation Layer
 * JWT-based authentication for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, JWT, RBAC, Security Best Practices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.hasAnyRole = exports.hasRole = exports.getUserRole = exports.getUserId = exports.validateTenantIsolation = exports.canManageInsuranceClaims = exports.canProcessPayment = exports.canModifyInvoice = exports.canAccessPatientData = exports.requireMedicalStaffAccess = exports.requireFinanceAccess = exports.requireAdmin = exports.optionalAuth = exports.requirePermissions = exports.requireRoles = exports.authMiddleware = exports.UserRole = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["DOCTOR"] = "DOCTOR";
    UserRole["NURSE"] = "NURSE";
    UserRole["PATIENT"] = "PATIENT";
    UserRole["CASHIER"] = "CASHIER";
    UserRole["FINANCE_MANAGER"] = "FINANCE_MANAGER";
    UserRole["INSURANCE_OFFICER"] = "INSURANCE_OFFICER";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * Main authentication middleware
 */
const authMiddleware = (options = { required: true }) => {
    return async (req, res, next) => {
        try {
            // Extract token from Authorization header
            const authHeader = req.headers.authorization;
            // ✅ TRUST GATEWAY HEADERS FIRST (Gateway already authenticated the user)
            const gatewayUser = extractGatewayUser(req);
            if (gatewayUser) {
                req.user = gatewayUser;
                return next();
            }
            if (!authHeader) {
                if (options.required) {
                    return res.status(401).json({
                        success: false,
                        error: "Unauthorized",
                        message: "No authorization token provided",
                        code: "NO_TOKEN",
                        timestamp: new Date().toISOString(),
                    });
                }
                return next();
            }
            // Validate Bearer token format
            const parts = authHeader.split(" ");
            if (parts.length !== 2 || parts[0] !== "Bearer") {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                    message: "Invalid authorization header format. Expected: Bearer <token>",
                    code: "INVALID_TOKEN_FORMAT",
                    timestamp: new Date().toISOString(),
                });
            }
            const token = parts[1];
            req.token = token;
            // Initialize Supabase client
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (!supabaseUrl || !supabaseKey) {
                console.error("Supabase configuration missing");
                return res.status(500).json({
                    success: false,
                    error: "Internal Server Error",
                    message: "Authentication service not configured",
                    code: "AUTH_CONFIG_ERROR",
                    timestamp: new Date().toISOString(),
                });
            }
            const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
            // Verify token with Supabase
            const { data: { user }, error, } = await supabase.auth.getUser(token);
            if (error || !user) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                    message: "Invalid or expired token",
                    code: "INVALID_TOKEN",
                    timestamp: new Date().toISOString(),
                });
            }
            // Extract user metadata
            const userMetadata = user.user_metadata || {};
            const appMetadata = user.app_metadata || {};
            // Get user role from metadata or database
            let userRole = appMetadata.role;
            if (!userRole) {
                // Fallback: query database for user role
                const { data: userData, error: dbError } = await supabase
                    .from("auth_schema.users")
                    .select("role, tenant_id")
                    .eq("id", user.id)
                    .single();
                if (dbError || !userData) {
                    console.error("Failed to fetch user role:", dbError);
                    userRole = UserRole.PATIENT; // Default role
                }
                else {
                    userRole = userData.role;
                }
            }
            // Attach user information to request
            req.user = {
                id: user.id,
                email: user.email || "",
                role: userRole,
                tenantId: appMetadata.tenant_id || userMetadata.tenant_id,
                permissions: appMetadata.permissions || [],
            };
            // Check role requirements
            if (options.roles && options.roles.length > 0) {
                if (!options.roles.includes(req.user.role)) {
                    return res.status(403).json({
                        success: false,
                        error: "Forbidden",
                        message: "Insufficient permissions to access this resource",
                        code: "INSUFFICIENT_PERMISSIONS",
                        requiredRoles: options.roles,
                        userRole: req.user.role,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
            // Check permission requirements
            if (options.permissions && options.permissions.length > 0) {
                const hasPermission = options.permissions.some((permission) => req.user?.permissions?.includes(permission));
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        error: "Forbidden",
                        message: "Missing required permissions",
                        code: "MISSING_PERMISSIONS",
                        requiredPermissions: options.permissions,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
            next();
        }
        catch (error) {
            console.error("Authentication middleware error:", error);
            return res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: "Authentication failed",
                code: "AUTH_ERROR",
                timestamp: new Date().toISOString(),
            });
        }
    };
};
exports.authMiddleware = authMiddleware;
/**
 * Extract user context forwarded by API Gateway
 */
function extractGatewayUser(req) {
    const gatewayUserId = req.headers["x-user-id"]?.trim();
    const gatewayEmail = req.headers["x-user-email"]?.trim();
    const gatewayRolesRaw = req.headers["x-user-roles"];
    const gatewayPermissionsRaw = req.headers["x-user-permissions"];
    const patientIdHeader = req.headers["x-patient-id"]?.trim();
    if (!gatewayUserId) {
        return null;
    }
    const roles = parseHeaderArray(gatewayRolesRaw);
    const permissions = parseHeaderArray(gatewayPermissionsRaw);
    const normalizedRoles = roles
        .map((role) => role.toUpperCase())
        .filter((role) => role in UserRole);
    const primaryRole = normalizedRoles[0] ?? UserRole.PATIENT;
    return {
        id: gatewayUserId,
        email: gatewayEmail || "unknown@patient.local",
        role: primaryRole,
        tenantId: undefined,
        permissions,
        patientId: patientIdHeader,
    };
}
function parseHeaderArray(headerValue) {
    if (!headerValue)
        return [];
    try {
        const parsed = JSON.parse(headerValue);
        if (Array.isArray(parsed)) {
            return parsed.map((value) => String(value));
        }
    }
    catch {
        // Fall back to comma-separated values
    }
    return headerValue
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
}
/**
 * Require specific roles
 */
const requireRoles = (...roles) => {
    return (0, exports.authMiddleware)({ required: true, roles });
};
exports.requireRoles = requireRoles;
/**
 * Require specific permissions
 */
const requirePermissions = (...permissions) => {
    return (0, exports.authMiddleware)({ required: true, permissions });
};
exports.requirePermissions = requirePermissions;
/**
 * Optional authentication (allows unauthenticated requests)
 */
const optionalAuth = () => {
    return (0, exports.authMiddleware)({ required: false });
};
exports.optionalAuth = optionalAuth;
/**
 * Admin only access
 */
const requireAdmin = () => {
    return (0, exports.requireRoles)(UserRole.SUPER_ADMIN, UserRole.ADMIN);
};
exports.requireAdmin = requireAdmin;
/**
 * Finance staff access
 */
const requireFinanceAccess = () => {
    return (0, exports.requireRoles)(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.CASHIER);
};
exports.requireFinanceAccess = requireFinanceAccess;
/**
 * Medical staff access
 */
const requireMedicalStaffAccess = () => {
    return (0, exports.requireRoles)(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE);
};
exports.requireMedicalStaffAccess = requireMedicalStaffAccess;
/**
 * Check if user can access patient data
 */
const canAccessPatientData = (patientId) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required",
                code: "NO_AUTH",
                timestamp: new Date().toISOString(),
            });
        }
        // Admin and medical staff can access all patient data
        if (req.user.role === UserRole.SUPER_ADMIN ||
            req.user.role === UserRole.ADMIN ||
            req.user.role === UserRole.DOCTOR ||
            req.user.role === UserRole.NURSE ||
            req.user.role === UserRole.FINANCE_MANAGER) {
            return next();
        }
        // Patients can only access their own data
        if (req.user.role === UserRole.PATIENT &&
            (req.user.id === patientId || req.user.patientId === patientId)) {
            return next();
        }
        return res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "You do not have permission to access this patient data",
            code: "PATIENT_ACCESS_DENIED",
            timestamp: new Date().toISOString(),
        });
    };
};
exports.canAccessPatientData = canAccessPatientData;
/**
 * Check if user can modify invoice
 */
const canModifyInvoice = () => {
    return (0, exports.requireRoles)(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.FINANCE_MANAGER, UserRole.CASHIER);
};
exports.canModifyInvoice = canModifyInvoice;
/**
 * Check if user can process payments
 */
const canProcessPayment = () => {
    return (0, exports.requireRoles)(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.CASHIER);
};
exports.canProcessPayment = canProcessPayment;
/**
 * Check if user can manage insurance claims
 */
const canManageInsuranceClaims = () => {
    return (0, exports.requireRoles)(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INSURANCE_OFFICER);
};
exports.canManageInsuranceClaims = canManageInsuranceClaims;
/**
 * Validate tenant isolation
 */
const validateTenantIsolation = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required",
                code: "NO_AUTH",
                timestamp: new Date().toISOString(),
            });
        }
        // Super admin can access all tenants
        if (req.user.role === UserRole.SUPER_ADMIN) {
            return next();
        }
        // For other users, ensure tenant isolation
        const requestedTenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;
        if (requestedTenantId && req.user.tenantId !== requestedTenantId) {
            return res.status(403).json({
                success: false,
                error: "Forbidden",
                message: "Access denied to this tenant",
                code: "TENANT_ACCESS_DENIED",
                timestamp: new Date().toISOString(),
            });
        }
        next();
    };
};
exports.validateTenantIsolation = validateTenantIsolation;
/**
 * Extract user ID from request
 */
const getUserId = (req) => {
    return req.user?.id || null;
};
exports.getUserId = getUserId;
/**
 * Extract user role from request
 */
const getUserRole = (req) => {
    return req.user?.role || null;
};
exports.getUserRole = getUserRole;
/**
 * Check if user has role
 */
const hasRole = (req, role) => {
    return req.user?.role === role;
};
exports.hasRole = hasRole;
/**
 * Check if user has any of the roles
 */
const hasAnyRole = (req, roles) => {
    return req.user ? roles.includes(req.user.role) : false;
};
exports.hasAnyRole = hasAnyRole;
/**
 * Check if user has permission
 */
const hasPermission = (req, permission) => {
    return req.user?.permissions?.includes(permission) || false;
};
exports.hasPermission = hasPermission;
/**
 * Export default middleware
 */
exports.default = exports.authMiddleware;
//# sourceMappingURL=auth.middleware.js.map