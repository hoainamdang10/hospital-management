"use strict";
/**
 * Routes Index
 * Registers all route modules with the Express application
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const health_routes_1 = require("./health.routes");
const auth_routes_1 = require("./auth.routes");
const user_routes_1 = require("./user.routes");
const session_routes_1 = require("./session.routes");
const password_policy_routes_1 = require("./password-policy.routes");
const account_recovery_routes_1 = require("./account-recovery.routes");
const permission_routes_1 = require("./permission.routes");
const admin_routes_1 = require("./admin.routes");
/**
 * Register all routes with the Express application
 * @param app Express application instance
 * @param deps Route dependencies (use cases, middleware, services)
 */
function registerRoutes(app, deps) {
    // Health & Monitoring routes
    app.use("/", (0, health_routes_1.createHealthRoutes)(deps));
    // Authentication routes
    app.use("/auth", (0, auth_routes_1.createAuthRoutes)(deps));
    // User management routes
    app.use("/api/v1/users", (0, user_routes_1.createUserRoutes)(deps));
    // Session management routes (nested under users)
    app.use("/api/v1/users", (0, session_routes_1.createSessionRoutes)(deps));
    // Password policy routes
    app.use("/api/v1/password-policy", (0, password_policy_routes_1.createPasswordPolicyRoutes)(deps));
    // Account recovery routes
    app.use("/api/v1/account-recovery", (0, account_recovery_routes_1.createAccountRecoveryRoutes)(deps));
    // Permission routes
    app.use("/api/v1/permissions", (0, permission_routes_1.createPermissionRoutes)(deps));
    // Admin routes
    app.use("/admin", (0, admin_routes_1.createAdminRoutes)(deps));
    // 404 handler
    app.use("*", (req, res) => {
        res.status(404).json({
            error: "Endpoint không tồn tại",
            path: req.originalUrl,
            method: req.method,
        });
    });
}
//# sourceMappingURL=index.js.map