/**
 * App Factory for Integration Tests
 * Creates test application instances with proper setup
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Infrastructure
import { SupabaseStaffRepository } from '../../src/infrastructure/repositories/SupabaseStaffRepository';
import { RabbitMQEventPublisher } from '../../src/infrastructure/events/RabbitMQEventPublisher';
import { RabbitMQStaffEventHandler } from '../../src/infrastructure/events/RabbitMQStaffEventHandler';
import { WinstonLogger } from '../../src/infrastructure/logging/WinstonLogger';
import { SupabaseEventBus } from '../../src/infrastructure/events/SupabaseEventBus';

// Application
import { RegisterStaffUseCase } from '../../src/application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from '../../src/application/use-cases/GetStaffProfileUseCase';

// Presentation
import { StaffController } from '../../src/presentation/controllers/StaffController';
import { staffRoutes } from '../../src/presentation/routes/staffRoutes';

// Types
import { ILogger } from '../../src/domain/interfaces/ILogger';

/**
 * Test Logger - Silent logger for tests
 */
const createTestLogger = (): ILogger => ({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {}
});

/**
 * App Factory Configuration
 */
export interface AppFactoryConfig {
  supabaseUrl: string;
  supabaseKey: string;
  rabbitmqUrl?: string;
  enableRabbitMQ?: boolean;
  logger?: ILogger;
}

/**
 * App Factory Result
 */
export interface AppFactoryResult {
  app: Application;
  cleanup: () => Promise<void>;
  eventPublisher?: RabbitMQEventPublisher;
  staffRepository: SupabaseStaffRepository;
  supabaseClient: SupabaseClient;
}

/**
 * Create test application
 */
export async function createTestApp(config: AppFactoryConfig): Promise<AppFactoryResult> {
  const logger = config.logger || createTestLogger();

  // Create Supabase client
  const supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);

  // Create event publisher (optional)
  let eventPublisher: RabbitMQEventPublisher | undefined;
  let eventHandler: RabbitMQStaffEventHandler | undefined;

  if (config.enableRabbitMQ && config.rabbitmqUrl) {
    eventPublisher = new RabbitMQEventPublisher(
      {
        url: config.rabbitmqUrl,
        exchange: 'hospital.events.test',
        exchangeType: 'topic',
        durable: true,
        autoDelete: false
      },
      {
        enableRetry: true,
        maxRetries: 3,
        retryDelayMs: 1000,
        enableLogging: false
      },
      logger
    );

    await eventPublisher.connect();

    eventHandler = new RabbitMQStaffEventHandler(eventPublisher, logger);
  }

  // Create event bus (fallback)
  const eventBus = new SupabaseEventBus(logger);

  // Create repository
  const staffRepository = new SupabaseStaffRepository(
    supabaseClient,
    logger,
    eventBus
  );

  // Create use cases
  const registerStaffUseCase = new RegisterStaffUseCase(
    staffRepository,
    eventBus,
    logger
  );

  const getStaffProfileUseCase = new GetStaffProfileUseCase(
    staffRepository,
    logger
  );

  // Create controller
  const staffController = new StaffController(
    registerStaffUseCase,
    getStaffProfileUseCase,
    logger
  );

  // Create Express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      service: 'provider-staff-service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Routes
  app.use('/api/v1/staff', staffRoutes(staffController));

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Đã xảy ra lỗi không mong muốn'
    });
  });

  // Cleanup function
  const cleanup = async () => {
    if (eventPublisher) {
      await eventPublisher.disconnect();
    }
  };

  return {
    app,
    cleanup,
    eventPublisher,
    staffRepository,
    supabaseClient
  };
}

/**
 * Create minimal test app (without RabbitMQ)
 */
export async function createMinimalTestApp(): Promise<AppFactoryResult> {
  return createTestApp({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    enableRabbitMQ: false
  });
}

/**
 * Create full test app (with RabbitMQ)
 */
export async function createFullTestApp(): Promise<AppFactoryResult> {
  return createTestApp({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
    enableRabbitMQ: true
  });
}

