import { Router, Request, Response } from 'express';
import { ServiceRegistry } from '@infrastructure/proxy/ServiceRegistry';
import { ILogger } from '@application/services/ILogger';

export function createMetricsRoutes(
  serviceRegistry: ServiceRegistry,
  logger: ILogger
): Router {
  const router = Router();

  router.get('/circuit-breakers', (req: Request, res: Response) => {
    try {
      const stats = serviceRegistry.getCircuitBreakerStats();

      logger.info('Circuit breaker metrics requested', {
        requestId: (req as any).requestId,
        servicesCount: stats.length
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        circuitBreakers: stats
      });
    } catch (error) {
      logger.error('Failed to get circuit breaker metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve circuit breaker metrics'
      });
    }
  });

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
      const circuitBreakerStats = serviceRegistry.getCircuitBreakerStats();
      const cacheStats = serviceRegistry.getCacheStats();

      const metrics: string[] = [];

      metrics.push('# HELP circuit_breaker_state Current state of circuit breakers (0=CLOSED, 1=HALF_OPEN, 2=OPEN)');
      metrics.push('# TYPE circuit_breaker_state gauge');
      circuitBreakerStats.forEach(stat => {
        const stateValue = stat.state === 'CLOSED' ? 0 : stat.state === 'HALF_OPEN' ? 1 : 2;
        metrics.push(`circuit_breaker_state{service="${stat.serviceName}"} ${stateValue}`);
      });

      metrics.push('# HELP circuit_breaker_total_calls Total number of calls through circuit breaker');
      metrics.push('# TYPE circuit_breaker_total_calls counter');
      circuitBreakerStats.forEach(stat => {
        metrics.push(`circuit_breaker_total_calls{service="${stat.serviceName}"} ${stat.metrics.totalCalls}`);
      });

      metrics.push('# HELP circuit_breaker_successful_calls Number of successful calls');
      metrics.push('# TYPE circuit_breaker_successful_calls counter');
      circuitBreakerStats.forEach(stat => {
        metrics.push(`circuit_breaker_successful_calls{service="${stat.serviceName}"} ${stat.metrics.successfulCalls}`);
      });

      metrics.push('# HELP circuit_breaker_failed_calls Number of failed calls');
      metrics.push('# TYPE circuit_breaker_failed_calls counter');
      circuitBreakerStats.forEach(stat => {
        metrics.push(`circuit_breaker_failed_calls{service="${stat.serviceName}"} ${stat.metrics.failedCalls}`);
      });

      metrics.push('# HELP circuit_breaker_failure_count Current failure count');
      metrics.push('# TYPE circuit_breaker_failure_count gauge');
      circuitBreakerStats.forEach(stat => {
        metrics.push(`circuit_breaker_failure_count{service="${stat.serviceName}"} ${stat.failureCount}`);
      });

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
      const circuitBreakerStats = serviceRegistry.getCircuitBreakerStats();
      const cacheStats = serviceRegistry.getCacheStats();

      const openCircuits = circuitBreakerStats.filter(s => s.state === 'OPEN').length;
      const halfOpenCircuits = circuitBreakerStats.filter(s => s.state === 'HALF_OPEN').length;
      const closedCircuits = circuitBreakerStats.filter(s => s.state === 'CLOSED').length;

      const totalCalls = circuitBreakerStats.reduce((sum, s) => sum + s.metrics.totalCalls, 0);
      const totalFailures = circuitBreakerStats.reduce((sum, s) => sum + s.metrics.failedCalls, 0);
      const successRate = totalCalls > 0 ? ((totalCalls - totalFailures) / totalCalls * 100).toFixed(2) : '100.00';

      logger.info('Metrics summary requested', {
        requestId: (req as any).requestId
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          circuitBreakers: {
            total: circuitBreakerStats.length,
            open: openCircuits,
            halfOpen: halfOpenCircuits,
            closed: closedCircuits
          },
          calls: {
            total: totalCalls,
            failures: totalFailures,
            successRate: `${successRate}%`
          },
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

