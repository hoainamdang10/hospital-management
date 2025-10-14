/**
 * Provider/Staff Service - Hospital Management System
 * Clean Architecture + DDD + CQRS + Event-Driven Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3002
 * @schema provider_schema
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupDependencies, ServiceTokens } from './infrastructure/di/setup';
import { setupRoutes } from './presentation/routes';
import { logger } from './infrastructure/logging/logger';
import { ErrorHandlingMiddleware } from './presentation/middleware/ErrorHandlingMiddleware';
import { RegisterStaffUseCase } from './application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from './application/use-cases/GetStaffProfileUseCase';
import { StaffCommandHandlers } from './application/handlers/StaffCommandHandlers';
import { StaffQueryHandlers } from './application/handlers/StaffQueryHandlers';
import { RabbitMQEventPublisher } from './infrastructure/events/RabbitMQEventPublisher';
// import { RabbitMQStaffEventHandler } from './infrastructure/events/RabbitMQStaffEventHandler';

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = 'provider-staff-service';
const SERVICE_VERSION = '2.0.0';
const SERVICE_FEATURES = ['Doctor Management', 'Staff Management', 'Schedules', 'Departments'];
const SERVICE_PATTERNS = ['Aggregate', 'Event Sourcing', 'Saga'];

// Setup dependencies
const container = setupDependencies();

// Initialize RabbitMQ Event Publisher
let eventPublisher: RabbitMQEventPublisher | null = null;
// Event handler will be used when domain event subscription is implemented
// let _eventHandler: RabbitMQStaffEventHandler | null = null;

async function initializeEventPublisher() {
  try {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673';
    const rabbitmqExchange = process.env.RABBITMQ_EXCHANGE || 'hospital.events';
    const rabbitmqExchangeType = (process.env.RABBITMQ_EXCHANGE_TYPE || 'topic') as 'topic' | 'direct' | 'fanout';

    eventPublisher = new RabbitMQEventPublisher(
      {
        url: rabbitmqUrl,
        exchange: rabbitmqExchange,
        exchangeType: rabbitmqExchangeType,
        durable: process.env.RABBITMQ_DURABLE === 'true' || true,
        autoDelete: process.env.RABBITMQ_AUTO_DELETE === 'true' || false
      },
      {
        enableRetry: process.env.RABBITMQ_ENABLE_RETRY === 'true' || true,
        maxRetries: parseInt(process.env.RABBITMQ_MAX_RETRIES || '3'),
        retryDelayMs: parseInt(process.env.RABBITMQ_RETRY_DELAY_MS || '1000'),
        enableLogging: process.env.RABBITMQ_ENABLE_LOGGING === 'true' || true
      },
      logger
    );

    await eventPublisher.connect();

    // Event handler will be initialized when domain event subscription is implemented
    // _eventHandler = new RabbitMQStaffEventHandler(eventPublisher, logger);

    logger.info('RabbitMQ Event Publisher initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ Event Publisher', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    logger.warn('Continuing without event publishing');
  }
}

// Initialize event publisher (non-blocking)
initializeEventPublisher();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Get use cases and handlers from container
const registerStaffUseCase = container.resolve<RegisterStaffUseCase>(ServiceTokens.REGISTER_STAFF_USE_CASE);
const getStaffProfileUseCase = container.resolve<GetStaffProfileUseCase>(ServiceTokens.GET_STAFF_PROFILE_USE_CASE);
const staffCommandHandlers = container.resolve<StaffCommandHandlers>(ServiceTokens.STAFF_COMMAND_HANDLERS);
const staffQueryHandlers = container.resolve<StaffQueryHandlers>(ServiceTokens.STAFF_QUERY_HANDLERS);

// Setup routes
setupRoutes(
  app,
  registerStaffUseCase,
  getStaffProfileUseCase,
  staffCommandHandlers,
  staffQueryHandlers
);

// Health check
app.get('/health', async (_req, res) => {
  try {
    const healthStatus = await container.getServiceHealth();
    const rabbitmqStatus = eventPublisher?.isReady() ? 'connected' : 'disconnected';

    res.json({
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      features: SERVICE_FEATURES,
      patterns: SERVICE_PATTERNS,
      services: healthStatus,
      rabbitmq: {
        status: rabbitmqStatus,
        exchange: process.env.RABBITMQ_EXCHANGE || 'hospital.events'
      }
    });
  } catch (error) {
    res.status(503).json({
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
const errorHandler = new ErrorHandlingMiddleware(logger);
app.use(errorHandler.handle());

// Start server
const server = app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} started on port ${PORT}`);
  logger.info(`Features: ${SERVICE_FEATURES.join(', ')}`);
  logger.info(`Patterns: ${SERVICE_PATTERNS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  // Disconnect RabbitMQ
  if (eventPublisher) {
    await eventPublisher.disconnect();
    logger.info('RabbitMQ disconnected');
  }

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');

  // Disconnect RabbitMQ
  if (eventPublisher) {
    await eventPublisher.disconnect();
    logger.info('RabbitMQ disconnected');
  }

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
