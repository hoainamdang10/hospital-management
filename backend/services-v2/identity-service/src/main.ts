/**
 * Identity Service - Main Application (Refactored)
 * Production-ready service with modular bootstrap architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Production-Ready, HIPAA-Compliant
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Bootstrap modules
import {
  loadConfig,
  validateConfig,
  ValidationMode,
  createLogger,
  buildExpressApp,
  buildContainer,
  startServer,
  setupGracefulShutdown,
  createCleanupFunction,
  createMetricsAuth,
  registerErrorHandlers
} from './bootstrap';

// Routes
import { registerRoutes } from './presentation/routes';

// Monitoring
import { prometheusMetrics } from './infrastructure/monitoring/PrometheusMetrics';

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

/**
 * Bootstrap application
 * Orchestrates service initialization using modular bootstrap architecture
 */
async function bootstrap() {
  // Step 1: Load configuration
  const config = loadConfig();

  // Step 2: Create logger
  const logger = createLogger(config);
  logger.info('Starting Identity Service...', {
    version: '2.0.0',
    nodeEnv: config.nodeEnv,
    port: config.port
  });

  try {
    // Step 3: Validate configuration (fail-fast)
    logger.info('Validating configuration...');
    const validationMode = config.nodeEnv === 'production'
      ? ValidationMode.STRICT
      : ValidationMode.DEVELOPMENT;
    validateConfig(logger, validationMode);
    logger.info('Configuration validated successfully', { mode: validationMode });
    // Step 4: Build dependency container
    logger.info('Building dependency container...');
    const container = await buildContainer(config, logger);
    logger.info('Dependency container built successfully');

    // Step 5: Build Express application
    logger.info('Building Express application...');
    const app = buildExpressApp(config, logger);
    logger.info('Express application built successfully');

    // Step 6: Register API routes
    logger.info('Registering API routes...');
    const routeDependencies = container.getRouteDependencies();
    registerRoutes(app, routeDependencies);
    logger.info('API routes registered successfully');

    // Step 7: Register protected endpoints (metrics & docs)
    const metricsAuth = createMetricsAuth(config, logger);

    // Prometheus metrics endpoint (protected)
    app.get('/metrics', metricsAuth, async (_req, res) => {
      try {
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        const metrics = await prometheusMetrics.getMetrics();
        res.send(metrics);
      } catch (error) {
        logger.error('Failed to generate metrics', { error });
        res.status(500).send('Failed to generate metrics');
      }
    });
    logger.info('Prometheus metrics endpoint registered at /metrics (protected)');

    // Swagger documentation (protected)
    try {
      const swaggerCandidates = [
        path.join(__dirname, '../docs/api/openapi.yaml'),
        path.join(__dirname, '../../docs/api/openapi.yaml')
      ];

      const swaggerPath = swaggerCandidates.find((candidate) => fs.existsSync(candidate));

      if (!swaggerPath) {
        throw new Error('openapi.yaml not found in expected locations');
      }

      const swaggerDocument = YAML.load(swaggerPath);
      app.use('/api-docs', metricsAuth, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      logger.info('Swagger documentation registered at /api-docs (protected)', { swaggerPath });
    } catch (error) {
      logger.warn('Failed to load Swagger documentation', { error });
    }

    // Step 8: Register error handlers (MUST be last)
    logger.info('Registering error handlers...');
    registerErrorHandlers(app, logger);

    // Step 9: Start HTTP server
    logger.info('Starting HTTP server...');
    const server = await startServer(app, config.port, logger);
    logger.info(`Identity Service started successfully on port ${config.port}`);

    // Step 10: Start event consumers
    logger.info('Starting event consumers...');
    await container.startEventConsumers();
    logger.info('Event consumers started successfully');

    // Step 11: Setup graceful shutdown
    logger.info('Setting up graceful shutdown...');
    const cleanup = createCleanupFunction([
      {
        name: 'Event Consumers',
        cleanup: async () => {
          await container.stopEventConsumers();
        }
      },
      {
        name: 'Dependency Container',
        cleanup: async () => {
          await container.cleanup();
        }
      }
    ], logger);

    setupGracefulShutdown(server, cleanup, logger);
    logger.info('Graceful shutdown configured');

    logger.info('Identity Service is ready to accept requests', {
      port: config.port,
      environment: config.nodeEnv,
      healthCheck: `http://localhost:${config.port}/health`,
      apiDocs: `http://localhost:${config.port}/api-docs (protected)`,
      metrics: `http://localhost:${config.port}/metrics (protected)`
    });

  } catch (error) {
    logger.error('Failed to start Identity Service', { error });
    throw error;
  }
}

export { bootstrap };
export default bootstrap;

if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('Fatal error during bootstrap:', error);
    process.exit(1);
  });
}
