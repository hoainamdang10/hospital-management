import { Router, Request, Response } from 'express';
import { ServiceRegistry } from '@infrastructure/proxy/ServiceRegistry';
import { ILogger } from '@application/services/ILogger';

export function createMetricsRoutes(
  serviceRegistry: ServiceRegistry,
  logger: ILogger
): Router {
  const router = Router();



  router.get('/cache', (req: Request, res: Response) => {
    try {
      const stats = serviceRegistry.getCacheStats();

      logger.info('Cache metrics requested', {
        requestId: (req as any).requestId,
        cacheSize: stats.size
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        cache: stats
      });
    } catch (error) {
      logger.error('Failed to get cache metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cache metrics'
      });
    }
  });

  router.get('/prometheus', (req: Request, res: Response) => {
    try {
      const cacheStats = serviceRegistry.getCacheStats();

      const metrics: string[] = [];

      metrics.push('# HELP cache_size Current number of cached entries');
      metrics.push('# TYPE cache_size gauge');
      metrics.push(`cache_size ${cacheStats.size}`);

      metrics.push('# HELP cache_max_size Maximum cache size');
      metrics.push('# TYPE cache_max_size gauge');
      metrics.push(`cache_max_size ${cacheStats.maxSize}`);

      logger.debug('Prometheus metrics requested', {
        requestId: (req as any).requestId
      });

      res.set('Content-Type', 'text/plain; version=0.0.4');
      res.send(metrics.join('\n') + '\n');
    } catch (error) {
      logger.error('Failed to generate Prometheus metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).send('# Error generating metrics\n');
    }
  });

  router.get('/summary', (req: Request, res: Response) => {
    try {
      const cacheStats = serviceRegistry.getCacheStats();

      logger.info('Metrics summary requested', {
        requestId: (req as any).requestId
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          cache: {
            size: cacheStats.size,
            maxSize: cacheStats.maxSize,
            utilizationPercent: ((cacheStats.size / cacheStats.maxSize) * 100).toFixed(2)
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get metrics summary', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics summary'
      });
    }
  });

  return router;
}

