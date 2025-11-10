/**
 * Billing Routes - Simplified for Academic Project
 * RESTful API endpoints for Billing Service
 * Reduced from 60+ endpoints to ~20 core endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0 (Simplified)
 * @compliance Clean Architecture, REST, CQRS, Vietnamese Healthcare Standards
 */
import { Router } from "express";
import { BillingController } from "../controllers/BillingController";
export declare function createBillingRoutes(controller: BillingController): Router;
/**
 * Export configured router
 */
export default createBillingRoutes;
//# sourceMappingURL=billingRoutes.d.ts.map