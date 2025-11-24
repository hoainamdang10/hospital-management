/**
 * Availability Routes - Presentation Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * Routes for provider availability queries
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */
import { Router } from 'express';
/**
 * Create availability routes
 * Uses DI container for dependency injection
 *
 * Routes:
 * - GET /api/v1/appointments/providers/:providerId/available-slots
 * - GET /api/v1/appointments/providers/:providerId/schedule
 */
export declare function createAvailabilityRoutes(): Router;
//# sourceMappingURL=availability.routes.d.ts.map