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
export function metricsMiddleware(metricsService: MetricsService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Capture response
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const endpoint = `${req.method} ${req.route?.path || req.path}`;

      metricsService.recordRequest(res.statusCode, endpoint, responseTime);
    });

    next();
  };
}

/**
 * Metrics endpoint handler
 */
export function createMetricsHandler(metricsService: MetricsService) {
  return (req: Request, res: Response): void => {
    const format = req.query.format as string;

    if (format === 'prometheus') {
      // Prometheus format
      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      res.send(metricsService.getPrometheusMetrics());
    } else {
      // JSON format
      res.json(metricsService.getMetrics());
    }
  };
}

