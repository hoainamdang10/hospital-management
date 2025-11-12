/**
 * Health & Monitoring Routes for Patient Registry Service
 * Handles health checks, metrics, and service info
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Router } from 'express';
import { PatientRegistryHealthCheck } from '../../infrastructure/monitoring/HealthChecks';
import { ILogger } from '../../../../shared/application/services/logger.interface';
interface HealthRouteDependencies {
    healthCheck: PatientRegistryHealthCheck;
    logger: ILogger;
}
export declare function createHealthRoutes(deps: HealthRouteDependencies): Router;
export {};
//# sourceMappingURL=healthRoutes.d.ts.map