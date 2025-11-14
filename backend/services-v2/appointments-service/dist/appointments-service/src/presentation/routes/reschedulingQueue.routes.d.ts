/**
 * Rescheduling Queue Routes - Presentation Layer
 * Express routes for rescheduling queue management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Design
 */
import { Router } from 'express';
import { ReschedulingQueueController } from '../controllers/ReschedulingQueueController';
declare const router: import("express-serve-static-core").Router;
/**
 * Initialize routes with controller
 */
export declare function initializeReschedulingQueueRoutes(controller: ReschedulingQueueController): Router;
export default router;
//# sourceMappingURL=reschedulingQueue.routes.d.ts.map