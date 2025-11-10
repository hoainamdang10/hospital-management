/**
 * Routes Setup - Presentation Layer
 * Central routing configuration for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Standards
 */
import { Express } from "express";
import { DIContainer } from "../../../../shared/infrastructure/di/container";
/**
 * Setup all application routes
 */
export declare function setupRoutes(app: Express, container: DIContainer): void;
/**
 * Setup routes with custom configuration
 */
export declare function setupRoutesWithConfig(app: Express, container: DIContainer, config?: {
    basePath?: string;
    enableDocs?: boolean;
    enableMetrics?: boolean;
    enableSwagger?: boolean;
}): void;
/**
 * Export default setup function
 */
export default setupRoutes;
//# sourceMappingURL=index.d.ts.map