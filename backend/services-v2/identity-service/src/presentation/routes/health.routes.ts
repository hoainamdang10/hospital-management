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
import { logger } from '../../infrastructure/logging/Logger';
import { config } from '../../infrastructure/config';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createHealthRoutes(deps: RouteDependencies): Router {
  const router = Router();

  // Health check endpoint
  router.get('/health', async (_req, res) => {
    try {
      const health = await deps.healthCheck.checkHealth();
      const statusCode = health.overall === 'HEALTHY' ? 200 : 503;
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

