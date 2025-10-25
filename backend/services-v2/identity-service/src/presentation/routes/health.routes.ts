/**
 * Health & Monitoring Routes
 * Handles health checks, service info, and circuit breaker status
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { RouteDependencies } from './types';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';
import { loadConfig } from '../../bootstrap/config';

const config = loadConfig();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createHealthRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const { logger } = deps;

  // Health check endpoint
  router.get('/health', async (_req, res) => {
    try {
      const health = await deps.healthCheck.checkHealth();

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
        error: getErrorMessage(error),
        timestamp: new Date()
      });
    }
  });

  // Service info endpoint
  router.get('/info', (_req, res) => {
    res.json({
      service: config.serviceName,
      version: config.version,
      environment: config.nodeEnv,
      timestamp: new Date(),
      uptime: process.uptime(),
      mode: deps.degradationService.getStatus().mode
    });
  });

  // Circuit breaker status endpoint
  router.get('/circuit-breakers', (_req, res) => {
    try {
      const status = CircuitBreakerFactory.getHealthStatus();
      res.json(status);
    } catch (error) {
      logger.error('Failed to get circuit breaker status', { error: getErrorMessage(error) });
      res.status(500).json({ error: 'Failed to get circuit breaker status' });
    }
  });

  return router;
}

