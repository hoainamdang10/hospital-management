/**
 * billingRoutes - Presentation Layer
 * Express routes for billing service API endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance REST API Standards, Vietnamese Healthcare, Clean Architecture
 */
import { Router } from 'express';
import { BillingController } from '../controllers/BillingController';
export interface BillingRoutesConfig {
    billingController: BillingController;
}
/**
 * Create billing routes
 */
export declare function createBillingRoutes(config: BillingRoutesConfig): Router;
//# sourceMappingURL=billingRoutes.d.ts.map