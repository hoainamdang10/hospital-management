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
import { createClient } from '@supabase/supabase-js';
import { DIContainer } from '../../shared/infrastructure/di/container';
import { setupDependencies } from './infrastructure/di/setup';
import { setupRoutes } from './presentation/routes';
import { logger } from './infrastructure/logging/logger';
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
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup routes
setupRoutes(app, container);

// Health check
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await container.getServiceHealth();
    const workerStatus = outboxWorker.getStatus();

    res.json({
      service: 'billing-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      features: ["Invoices","Payments","Insurance Claims","PayOS Integration"],
      patterns: ["Strategy","Outbox","Payment Gateway"],
      services: healthStatus,
      outboxWorker: {
        enabled: workerStatus.isRunning,
        workerId: workerStatus.workerId,
        pollingInterval: workerStatus.config.pollingIntervalMs,
        batchSize: workerStatus.config.batchSize,
      }
    });
  } catch (error) {
    res.status(503).json({
      service: 'billing-service',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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
