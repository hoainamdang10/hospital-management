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

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Bootstrap modules
import {
  loadConfig,
  createLogger,
  buildExpressApp,
  buildContainer,
  startServer,
  setupGracefulShutdown,
  createCleanupFunction
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
  // Step 1: Load and validate configuration
  const config = loadConfig();

  // Step 2: Create logger
  const logger = createLogger(config);
  logger.info('Starting Identity Service...', {
    version: '2.0.0',
    nodeEnv: config.nodeEnv,
    port: config.port
  });

  try {
    // Step 3: Build dependency container
    logger.info('Building dependency container...');
    const container = await buildContainer(config, logger);
    logger.info('Dependency container built successfully');

    // Step 4: Build Express application
    logger.info('Building Express application...');
    const app = buildExpressApp(config, logger, container.cache);
    logger.info('Express application built successfully');

    // Step 5: Register API routes
    logger.info('Registering API routes...');
    const routeDependencies = container.getRouteDependencies();
    registerRoutes(app, routeDependencies);
    logger.info('API routes registered successfully');

    // Step 6: Register Swagger documentation
    try {
      const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      logger.info('Swagger documentation registered at /api-docs');
    } catch (error) {
      logger.warn('Failed to load Swagger documentation', { error });
    }

    // Step 7: Register Prometheus metrics endpoint
    app.get('/metrics', async (_req, res) => {
      try {
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        const metrics = await prometheusMetrics.getMetrics();
        res.send(metrics);
      } catch (error) {
        logger.error('Failed to generate metrics', { error });
        res.status(500).send('Failed to generate metrics');
      }
    });
    logger.info('Prometheus metrics endpoint registered at /metrics');

    // Step 8: Start HTTP server
    logger.info('Starting HTTP server...');
    const server = await startServer(app, config.port, logger);
    logger.info(`Identity Service started successfully on port ${config.port}`);

    // Step 9: Start event consumers
    logger.info('Starting event consumers...');
    await container.startEventConsumers();
    logger.info('Event consumers started successfully');

    // Step 10: Setup graceful shutdown
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
      apiDocs: `http://localhost:${config.port}/api-docs`,
      metrics: `http://localhost:${config.port}/metrics`
    });

  } catch (error) {
    logger.error('Failed to start Identity Service', { error });
    process.exit(1);
  }
}

// Start application
bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
