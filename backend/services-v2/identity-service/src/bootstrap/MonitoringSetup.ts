/**
 * Monitoring Setup
 * Configures health checks, metrics, and monitoring endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Application, Request, Response } from 'express';
import { ILogger } from '../application/services/ILogger';
import { IdentityServiceHealthCheck } from '../infrastructure/monitoring/HealthChecks';
import { prometheusMetrics } from '../infrastructure/monitoring/PrometheusMetrics';

/**
 * Monitoring Setup
 * Configures monitoring endpoints and health checks
 */
export class MonitoringSetup {
  constructor(
    private app: Application,
    private healthCheck: IdentityServiceHealthCheck,
    private logger: ILogger,
    private metricsAuthMiddleware?: (req: Request, res: Response, next: () => void) => void
  ) {}

  /**
   * Setup all monitoring endpoints
   */
  public setup(): void {
    this.setupHealthEndpoint();
    this.setupMetricsEndpoint();
    this.setupReadinessEndpoint();
    this.setupLivenessEndpoint();
    
    this.logger.info('Monitoring endpoints configured');
  }

  /**
   * Setup health check endpoint
   */
  private setupHealthEndpoint(): void {
    this.app.get('/health', async (_req: Request, res: Response) => {
      try {
        const health = await this.healthCheck.checkHealth();
        const statusCode = health.overall === 'HEALTHY' ? 200 : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        this.logger.error('Health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        res.status(503).json({
          overall: 'UNHEALTHY',
          timestamp: new Date(),
          error: 'Health check failed'
        });
      }
    });
  }

  /**
   * Setup Prometheus metrics endpoint (protected)
   */
  private setupMetricsEndpoint(): void {
    const handlers = this.metricsAuthMiddleware 
      ? [this.metricsAuthMiddleware, this.metricsHandler.bind(this)]
      : [this.metricsHandler.bind(this)];
    
    this.app.get('/metrics', ...handlers);
  }

  /**
   * Metrics handler
   */
  private async metricsHandler(_req: Request, res: Response): Promise<void> {
    try {
      res.set('Content-Type', prometheusMetrics.getRegistry().contentType);
      const metrics = await prometheusMetrics.getMetrics();
      res.send(metrics);
    } catch (error) {
      this.logger.error('Failed to generate metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).send('Failed to generate metrics');
    }
  }

  /**
   * Setup readiness probe (Kubernetes)
   */
  private setupReadinessEndpoint(): void {
    this.app.get('/ready', async (_req: Request, res: Response) => {
      try {
        const health = await this.healthCheck.checkHealth();

        // Service is ready if database and critical services are healthy
        const isReady = health.overall === 'HEALTHY' || health.overall === 'DEGRADED';

        if (isReady) {
          res.status(200).json({ status: 'ready' });
        } else {
          res.status(503).json({ status: 'not ready', health });
        }
      } catch (error) {
        res.status(503).json({ status: 'not ready', error: 'Health check failed' });
      }
    });
  }

  /**
   * Setup liveness probe (Kubernetes)
   */
  private setupLivenessEndpoint(): void {
    this.app.get('/live', (_req: Request, res: Response) => {
      // Simple liveness check - service is running
      res.status(200).json({ status: 'alive' });
    });
  }
}

