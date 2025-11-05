/**
 * Health & Monitoring Routes for Provider/Staff Service
 * Handles health checks, metrics, and service info
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router, Request, Response } from 'express';
import { ProviderStaffHealthCheck } from '../../infrastructure/monitoring/HealthChecks';
import { ILogger } from '@shared/application/services/logger.interface';

interface HealthRouteDependencies {
  healthCheck: ProviderStaffHealthCheck;
  logger: ILogger;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createHealthRoutes(deps: HealthRouteDependencies): Router {
  const router = Router();
  const { healthCheck, logger } = deps;

  // Health check endpoint
  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const health = await healthCheck.checkHealth();

      // Return appropriate HTTP status code based on health status
      let statusCode: number;
      switch (health.overall) {
        case 'HEALTHY':
          statusCode = 200;
          break;
        case 'DEGRADED':
          statusCode = 200; // Service still operational
          break;
        case 'UNHEALTHY':
          statusCode = 503; // Service unavailable
          break;
        default:
          statusCode = 500;
      }

      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check failed', { error: getErrorMessage(error) });
      res.status(503).json({
        overall: 'UNHEALTHY',
        service: 'provider-staff-service',
        version: '2.0.0',
        error: getErrorMessage(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Service info endpoint
  router.get('/info', (_req: Request, res: Response) => {
    res.json({
      service: 'provider-staff-service',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      schema: 'provider_schema',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Metrics endpoint (Prometheus-compatible)
  router.get('/metrics', async (_req: Request, res: Response) => {
    try {
      const health = await healthCheck.checkHealth();
      
      // Prometheus text format
      const metrics = [
        '# HELP provider_staff_health_status Health status of the service (1=healthy, 0.5=degraded, 0=unhealthy)',
        '# TYPE provider_staff_health_status gauge',
        `provider_staff_health_status{service="provider-staff"} ${health.overall === 'HEALTHY' ? 1 : health.overall === 'DEGRADED' ? 0.5 : 0}`,
        '',
        '# HELP provider_staff_uptime_seconds Service uptime in seconds',
        '# TYPE provider_staff_uptime_seconds counter',
        `provider_staff_uptime_seconds{service="provider-staff"} ${process.uptime()}`,
        '',
        '# HELP provider_staff_memory_usage_bytes Memory usage in bytes',
        '# TYPE provider_staff_memory_usage_bytes gauge',
        `provider_staff_memory_usage_bytes{type="rss",service="provider-staff"} ${process.memoryUsage().rss}`,
        `provider_staff_memory_usage_bytes{type="heapTotal",service="provider-staff"} ${process.memoryUsage().heapTotal}`,
        `provider_staff_memory_usage_bytes{type="heapUsed",service="provider-staff"} ${process.memoryUsage().heapUsed}`,
        '',
        '# HELP provider_staff_component_health Component health status (1=healthy, 0=unhealthy)',
        '# TYPE provider_staff_component_health gauge',
        `provider_staff_component_health{component="database",service="provider-staff"} ${health.components?.database?.status === 'HEALTHY' ? 1 : 0}`,
        `provider_staff_component_health{component="eventBus",service="provider-staff"} ${health.components?.eventBus?.status === 'HEALTHY' ? 1 : 0}`,
        ''
      ].join('\n');

      res.set('Content-Type', 'text/plain; version=0.0.4');
      res.send(metrics);
    } catch (error) {
      logger.error('Metrics collection failed', { error: getErrorMessage(error) });
      res.status(500).send('# Error collecting metrics\n');
    }
  });

  return router;
}

