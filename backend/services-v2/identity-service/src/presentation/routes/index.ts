/**
 * Routes Index
 * Registers all route modules with the Express application
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Application } from "express";
import { RouteDependencies } from "./types";
import { createHealthRoutes } from "./health.routes";
import { createAuthRoutes } from "./auth.routes";
import { createUserRoutes } from "./user.routes";
import { createSessionRoutes } from "./session.routes";
import { createPasswordPolicyRoutes } from "./password-policy.routes";
import { createAccountRecoveryRoutes } from "./account-recovery.routes";
import { createPermissionRoutes } from "./permission.routes";
import { createAdminRoutes } from "./admin.routes";

/**
 * Register all routes with the Express application
 * @param app Express application instance
 * @param deps Route dependencies (use cases, middleware, services)
 */
export function registerRoutes(
  app: Application,
  deps: RouteDependencies,
): void {
  // Health & Monitoring routes
  app.use("/", createHealthRoutes(deps));

  // Authentication routes - mounted at /api/auth to match API Gateway
  app.use("/api/auth", createAuthRoutes(deps));

  // User management routes
  app.use("/api/v1/users", createUserRoutes(deps));

  // Session management routes (nested under users)
  app.use("/api/v1/users", createSessionRoutes(deps));

  // Password policy routes
  app.use("/api/v1/password-policy", createPasswordPolicyRoutes(deps));

  // Account recovery routes
  app.use("/api/v1/account-recovery", createAccountRecoveryRoutes(deps));

  // Permission routes
  app.use("/api/v1/permissions", createPermissionRoutes(deps));

  // Admin routes
  app.use("/admin", createAdminRoutes(deps));
}
