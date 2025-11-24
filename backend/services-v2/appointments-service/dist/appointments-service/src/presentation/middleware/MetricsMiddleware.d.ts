/**
 * Metrics Middleware
 * Collects metrics from HTTP requests
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../infrastructure/metrics/MetricsService';
/**
 * Metrics collection middleware
 */
export declare function metricsMiddleware(metricsService: MetricsService): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Metrics endpoint handler
 */
export declare function createMetricsHandler(metricsService: MetricsService): (req: Request, res: Response) => void;
//# sourceMappingURL=MetricsMiddleware.d.ts.map