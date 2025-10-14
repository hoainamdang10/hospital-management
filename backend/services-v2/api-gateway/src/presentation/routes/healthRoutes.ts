import { Router, Request, Response } from 'express';
import { IServiceRegistry } from '@application/services/IServiceRegistry';
import { ILogger } from '@application/services/ILogger';

export function createHealthRoutes(
  serviceRegistry: IServiceRegistry,
  logger: ILogger
): Router {
  const router = Router();

  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const routes = serviceRegistry.getAllRoutes();
      const healthChecks = await Promise.all(
        routes.map(async (route) => ({
          service: route.serviceName,
          healthy: await serviceRegistry.isHealthy(route.serviceName),
          url: route.baseUrl
        }))
      );

      const allHealthy = healthChecks.every(check => check.healthy);

      res.status(allHealthy ? 200 : 503).json({
        success: true,
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: healthChecks
      });

    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: 'Health check failed'
      });
    }
  });

  router.get('/health/ready', async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  router.get('/health/live', async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

