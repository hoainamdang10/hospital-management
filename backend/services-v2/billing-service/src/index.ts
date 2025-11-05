/**
 * Billing Service - Hospital Management System
 * Clean Architecture + DDD + CQRS + Event-Driven Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3029
 * @schema billing_schema
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { createClient } from '@supabase/supabase-js';
import { DIContainer } from '../../shared/infrastructure/di/container';
import { setupDependencies } from './infrastructure/di/setup';
import { setupRoutes } from './presentation/routes';
import { createHealthRoutes } from './presentation/routes/healthRoutes';
import { logger } from './infrastructure/logging/logger';
import { prometheusMetrics } from './infrastructure/monitoring/PrometheusMetrics';
import { swaggerSpec } from './infrastructure/swagger/swagger.config';
import { SupabaseOutboxRepository } from './infrastructure/outbox/SupabaseOutboxRepository';
import { OutboxPublisherWorker } from './infrastructure/outbox/OutboxPublisherWorker';
import { RabbitMQPublisher } from './infrastructure/messaging/RabbitMQPublisher';

const app = express();
const PORT = process.env.PORT || 3029;

// Create DI container
const container = new DIContainer({
  enableHealthcareCompliance: true,
  enableHealthChecks: true,
  enableMetrics: true
});

// Setup dependencies
setupDependencies(container);

// =====================================================
// OUTBOX PATTERN SETUP
// =====================================================

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'billing_schema' },
});

// Initialize Outbox Repository
const outboxRepository = new SupabaseOutboxRepository(supabaseClient, logger);

// Initialize RabbitMQ Publisher
const rabbitmqPublisher = new RabbitMQPublisher(
  {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
    exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
    routingKeyPrefix: 'billing',
  },
  logger
);

// Initialize Outbox Worker
const outboxWorker = new OutboxPublisherWorker(
  outboxRepository,
  supabaseClient,
  logger,
  (event) => rabbitmqPublisher.publish(event),
  {
    enabled: process.env.OUTBOX_WORKER_ENABLED !== 'false',
    pollingIntervalMs: parseInt(process.env.OUTBOX_POLLING_INTERVAL || '5000'),
    batchSize: parseInt(process.env.OUTBOX_BATCH_SIZE || '50'),
  }
);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "cdn.jsdelivr.net"],
      fontSrc: ["'self'", "data:", "cdn.jsdelivr.net"]
    }
  }
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health & Metrics routes
const healthRoutes = createHealthRoutes(container);
app.use('/', healthRoutes);

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    const metrics = await prometheusMetrics.getMetrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to generate Prometheus metrics', { error });
    res.status(500).send('Failed to generate metrics');
  }
});
logger.info('Prometheus metrics endpoint registered at /metrics');

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Billing Service API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// OpenAPI JSON spec
app.get('/api-docs/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

logger.info('Swagger UI available at http://localhost:' + PORT + '/api-docs');

// Setup routes
setupRoutes(app, container);

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const serviceName = 'Billing Service';
const features = ["Invoices", "Payments", "Insurance Claims", "PayOS Integration"];
const patterns = ["Strategy", "Outbox", "Payment Gateway"];

const server = app.listen(PORT, async () => {
  logger.info(`🏥 ${serviceName} started on port ${PORT}`);
  logger.info(`📋 Features: ${features.join(', ')}`);
  logger.info(`🎯 Patterns: ${patterns.join(', ')}`);

  // Start Outbox Worker
  try {
    await rabbitmqPublisher.connect();
    await outboxWorker.start();
    logger.info('✅ Outbox Worker started successfully');
  } catch (error) {
    logger.error('❌ Failed to start Outbox Worker', { error });
  }
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new requests
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Stop Outbox Worker
      await outboxWorker.stop();
      logger.info('Outbox Worker stopped');

      // Disconnect RabbitMQ
      await rabbitmqPublisher.disconnect();
      logger.info('RabbitMQ disconnected');

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;
