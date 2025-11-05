/**
 * Health & Monitoring Routes for Billing Service
 * Handles health checks, metrics, and service info
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router, Request, Response } from 'express';
import { DIContainer } from '../../../../shared/infrastructure/di/container';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createHealthRoutes(container: DIContainer): Router {
  const router = Router();

  // Health check endpoint
  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const healthStatus = await container.getServiceHealth();

      res.status(200).json({
        service: 'billing-service',
        status: 'healthy',
        overall: 'HEALTHY',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 3029,
        version: '2.0.0',
        components: healthStatus
      });
    } catch (error) {
      res.status(503).json({
        service: 'billing-service',
        status: 'unhealthy',
        overall: 'UNHEALTHY',
        error: getErrorMessage(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Service info endpoint
  router.get('/info', (_req: Request, res: Response) => {
    res.json({
      service: 'billing-service',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      schema: 'billing_schema',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      features: ['Invoices', 'Payments', 'Insurance Claims', 'PayOS Integration'],
      patterns: ['Strategy', 'Outbox', 'Payment Gateway']
    });
  });

  // Metrics endpoint (Prometheus-compatible)
  router.get('/metrics', async (_req: Request, res: Response) => {
    try {
      const healthStatus = await container.getServiceHealth();
      const isHealthy = healthStatus && Object.keys(healthStatus).length > 0;
      
      // Prometheus text format
      const metrics = [
        '# HELP billing_health_status Health status of the service (1=healthy, 0=unhealthy)',
        '# TYPE billing_health_status gauge',
        `billing_health_status{service="billing"} ${isHealthy ? 1 : 0}`,
        '',
        '# HELP billing_uptime_seconds Service uptime in seconds',
        '# TYPE billing_uptime_seconds counter',
        `billing_uptime_seconds{service="billing"} ${process.uptime()}`,
        '',
        '# HELP billing_memory_usage_bytes Memory usage in bytes',
        '# TYPE billing_memory_usage_bytes gauge',
        `billing_memory_usage_bytes{type="rss",service="billing"} ${process.memoryUsage().rss}`,
        `billing_memory_usage_bytes{type="heapTotal",service="billing"} ${process.memoryUsage().heapTotal}`,
        `billing_memory_usage_bytes{type="heapUsed",service="billing"} ${process.memoryUsage().heapUsed}`,
        '',
        '# HELP billing_component_health Component health status (1=healthy, 0=unhealthy)',
        '# TYPE billing_component_health gauge',
        `billing_component_health{component="database",service="billing"} ${isHealthy ? 1 : 0}`,
        `billing_component_health{component="eventBus",service="billing"} ${isHealthy ? 1 : 0}`,
        `billing_component_health{component="payos",service="billing"} ${isHealthy ? 1 : 0}`,
        ''
      ].join('\n');

      res.set('Content-Type', 'text/plain; version=0.0.4');
      res.send(metrics);
    } catch (error) {
      res.status(500).send('# Error collecting metrics\n');
    }
  });

  return router;
}

