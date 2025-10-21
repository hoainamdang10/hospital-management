import { Router, Request, Response } from 'express';
import { MetricsCollector } from '../../infrastructure/observability/MetricsCollector';

const metrics = MetricsCollector.getInstance();

export function createMetricsRoutes(): Router {
  const router = Router();

  // Prometheus metrics endpoint
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', metrics.getRegistry().contentType);
      const metricsData = await metrics.getMetrics();
      res.send(metricsData);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to collect metrics'
      });
    }
  });

  return router;
}

