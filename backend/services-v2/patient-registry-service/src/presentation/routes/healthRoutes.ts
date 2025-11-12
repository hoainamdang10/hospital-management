/**
 * Health & Monitoring Routes for Patient Registry Service
 * Handles health checks, metrics, and service info
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router, Request, Response } from 'express';
import { PatientRegistryHealthCheck } from '../../infrastructure/monitoring/HealthChecks';
import { ILogger } from '@shared/application/services/logger.interface';

interface HealthRouteDependencies {
  healthCheck: PatientRegistryHealthCheck;
  logger: ILogger;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
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
      // DEGRADED still returns 200 as service is operational, just slower
      // Only UNHEALTHY returns 503 (Service Unavailable)
      let statusCode: number;
      switch (health.overall) {
        case 'HEALTHY':
          statusCode = 200;
          break;
        case 'DEGRADED':
          statusCode = 200; // Service still operational, just degraded performance
          break;
        case 'UNHEALTHY':
          statusCode = 503; // Service unavailable
          break;
        default:
          statusCode = 500; // Unknown status
      }

      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check failed', { error: getErrorMessage(error) });
      res.status(503).json({
        overall: 'UNHEALTHY',
        service: 'patient-registry-service',
        version: '2.0.0',
        error: getErrorMessage(error),
        timestamp: new Date()
      });
    }
  });

  // Service info endpoint
  router.get('/info', (_req: Request, res: Response) => {
    res.json({
      service: 'patient-registry-service',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      schema: 'patient_schema',
      timestamp: new Date(),
      uptime: process.uptime()
    });
  });

  // Metrics endpoint (Prometheus-compatible)
  router.get('/metrics', async (_req: Request, res: Response) => {
    try {
      const health = await healthCheck.checkHealth();

      // Prometheus text format
      const metrics = [
        '# HELP patient_registry_health_status Health status of the service (1=healthy, 0.5=degraded, 0=unhealthy)',
        '# TYPE patient_registry_health_status gauge',
        `patient_registry_health_status{service="patient-registry"} ${health.overall === 'HEALTHY' ? 1 : health.overall === 'DEGRADED' ? 0.5 : 0}`,
        '',
        '# HELP patient_registry_uptime_seconds Service uptime in seconds',
        '# TYPE patient_registry_uptime_seconds counter',
        `patient_registry_uptime_seconds{service="patient-registry"} ${process.uptime()}`,
        '',
        '# HELP patient_registry_memory_usage_bytes Memory usage in bytes',
        '# TYPE patient_registry_memory_usage_bytes gauge',
        `patient_registry_memory_usage_bytes{type="rss",service="patient-registry"} ${process.memoryUsage().rss}`,
        `patient_registry_memory_usage_bytes{type="heapTotal",service="patient-registry"} ${process.memoryUsage().heapTotal}`,
        `patient_registry_memory_usage_bytes{type="heapUsed",service="patient-registry"} ${process.memoryUsage().heapUsed}`,
        '',
        '# HELP patient_registry_component_health Component health status (1=healthy, 0=unhealthy)',
        '# TYPE patient_registry_component_health gauge',
        `patient_registry_component_health{component="database",service="patient-registry"} ${health.components?.database?.status === 'HEALTHY' ? 1 : 0}`,
        `patient_registry_component_health{component="eventPublisher",service="patient-registry"} ${health.components?.eventPublisher?.status === 'HEALTHY' ? 1 : 0}`,
        `patient_registry_component_health{component="patientMatching",service="patient-registry"} ${health.components?.patientMatching?.status === 'HEALTHY' ? 1 : 0}`,
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

