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
const admin_routes_1 = require("./admin.routes");
/**
 * Register all routes with the Express application
 * @param app Express application instance
 * @param deps Route dependencies (use cases, middleware, services)
 */
function registerRoutes(app, deps) {
    // Health & Monitoring routes
    app.use("/", (0, health_routes_1.createHealthRoutes)(deps));
    // Authentication routes - mounted at /api/auth to match API Gateway
    app.use("/api/auth", (0, auth_routes_1.createAuthRoutes)(deps));
    // User management routes
    app.use("/api/v1/users", (0, user_routes_1.createUserRoutes)(deps));
    // Admin routes
    app.use("/admin", (0, admin_routes_1.createAdminRoutes)(deps));
}
//# sourceMappingURL=index.js.map