import { Router, Request, Response } from 'express';
import { PerformanceMonitor } from '@infrastructure/monitoring/PerformanceMonitor';
import { ILogger } from '@application/services/ILogger';

/**
 * Performance Metrics Routes
 * Provides performance monitoring endpoints
 */
export function createPerformanceRoutes(
  performanceMonitor: PerformanceMonitor,
  logger: ILogger
): Router {
  const router = Router();

  /**
   * GET /api/metrics - Get overall performance metrics
   */
  router.get('/', (_req: Request, res: Response) => {
    try {
      const stats = performanceMonitor.getStats();

      logger.debug('Performance metrics requested', {
        totalRequests: stats.totalRequests,
        avgResponseTime: stats.avgResponseTime
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        metrics: stats
      });
    } catch (error) {
      logger.error('Failed to get performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Không thể lấy metrics'
      });
    }
  });

  /**
   * GET /api/metrics/endpoint/:path - Get metrics for specific endpoint
   */
  router.get('/endpoint/*', (req: Request, res: Response): void => {
    try {
      const path = '/' + req.params[0];
      const stats = performanceMonitor.getEndpointStats(path);

      if (!stats.totalRequests) {
        res.status(404).json({
          success: false,
          error: 'Không tìm thấy metrics cho endpoint này'
        });
        return;
      }

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        endpoint: path,
        metrics: stats
      });
    } catch (error) {
      logger.error('Failed to get endpoint metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Không thể lấy metrics'
      });
    }
  });

  /**
   * POST /api/metrics/reset - Reset all metrics (admin only)
   */
  router.post('/reset', (req: Request, res: Response) => {
    try {
      performanceMonitor.reset();

      logger.info('Performance metrics reset', {
        requestId: (req as any).requestId
      });

      res.json({
        success: true,
        message: 'Metrics đã được reset'
      });
    } catch (error) {
      logger.error('Failed to reset metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Không thể reset metrics'
      });
    }
  });

  /**
   * GET /api/metrics/summary - Get summary metrics
   */
  router.get('/summary', (_req: Request, res: Response) => {
    try {
      const stats = performanceMonitor.getStats();

      const summary = {
        overview: {
          totalRequests: stats.totalRequests,
          successRate: ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2) + '%',
          errorRate: stats.errorRate.toFixed(2) + '%',
          avgResponseTime: stats.avgResponseTime + 'ms'
        },
        performance: {
          requestsPerMinute: stats.requestsPerMinute,
          minResponseTime: stats.minResponseTime + 'ms',
          maxResponseTime: stats.maxResponseTime + 'ms'
        },
        topSlowestEndpoints: stats.slowestEndpoints.slice(0, 5),
        errorDistribution: stats.errorsByStatusCode
      };

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary
      });
    } catch (error) {
      logger.error('Failed to get metrics summary', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Không thể lấy summary'
      });
    }
  });

  return router;
}

