/**
 * Metrics Middleware - Prometheus Instrumentation for API Layer
 * Records API request metrics for monitoring and observability
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability
 */

import { Request, Response, NextFunction } from 'express';
import { prometheusMetrics } from '../../infrastructure/monitoring/PrometheusMetrics';
import { ILogger } from '../../application/services/ILogger';

/**
 * Create metrics middleware with logger injection
 * 
 * @param logger - Logger instance for error handling
 * @returns Express middleware function
 */
export function createMetricsMiddleware(logger: ILogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Capture response finish event
    res.on('finish', () => {
      try {
        const duration = Date.now() - startTime;
        const durationSeconds = duration / 1000;

        // Normalize path to avoid high cardinality (remove IDs)
        const normalizedPath = normalizePath(req.path);

        // Record Prometheus metrics
        prometheusMetrics.recordApiRequest(
          req.method,
          normalizedPath,
          res.statusCode
        );

        prometheusMetrics.recordApiRequestDuration(
          req.method,
          normalizedPath,
          durationSeconds
        );

        // Log slow requests (> 1 second)
        if (durationSeconds > 1) {
          logger.warn('Slow API request detected', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            durationSeconds
          });
        }
      } catch (error) {
        // Don't fail the request if metrics recording fails
        logger.error('Failed to record API metrics', {
          error: error instanceof Error ? error.message : 'Unknown error',
          method: req.method,
          path: req.path
        });
      }
    });

    next();
  };
}

/**
 * Normalize path to reduce cardinality in Prometheus metrics
 * Replaces UUIDs and numeric IDs with placeholders
 * 
 * Examples:
 * - /api/users/123e4567-e89b-12d3-a456-426614174000 → /api/users/:id
 * - /api/sessions/abc123/terminate → /api/sessions/:id/terminate
 */
function normalizePath(path: string): string {
  return path
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Replace alphanumeric IDs (e.g., session tokens)
    .replace(/\/[a-zA-Z0-9]{20,}/g, '/:id');
}
