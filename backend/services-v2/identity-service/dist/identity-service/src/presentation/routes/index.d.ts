/**
 * Routes Index
 * Registers all route modules with the Express application
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Application } from 'express';
import { RouteDependencies } from './types';
/**
 * Register all routes with the Express application
 * @param app Express application instance
 * @param deps Route dependencies (use cases, middleware, services)
 */
export declare function registerRoutes(app: Application, deps: RouteDependencies): void;
//# sourceMappingURL=index.d.ts.map