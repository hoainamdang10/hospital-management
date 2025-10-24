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
import { SupabaseProviderStaffRepository } from '../../src/infrastructure/repositories/SupabaseProviderStaffRepository';
import { RabbitMQEventPublisher } from '../../src/infrastructure/events/RabbitMQEventPublisher';
import { SupabaseEventBus } from '../../src/infrastructure/messaging/SupabaseEventBus';

// Application
import { RegisterStaffUseCase } from '../../src/application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from '../../src/application/use-cases/GetStaffProfileUseCase';
import { AssignStaffToDepartmentUseCase } from '../../src/application/use-cases/AssignStaffToDepartmentUseCase';
import { AddStaffCredentialUseCase } from '../../src/application/use-cases/AddStaffCredentialUseCase';
import { RemoveStaffCredentialUseCase } from '../../src/application/use-cases/RemoveStaffCredentialUseCase';
import { RenewStaffCredentialUseCase } from '../../src/application/use-cases/RenewStaffCredentialUseCase';
import { GetExpiringCredentialsUseCase } from '../../src/application/use-cases/GetExpiringCredentialsUseCase';
import { ActivateStaffUseCase } from '../../src/application/use-cases/ActivateStaffUseCase';
import { SuspendStaffUseCase } from '../../src/application/use-cases/SuspendStaffUseCase';
import { ReactivateStaffUseCase } from '../../src/application/use-cases/ReactivateStaffUseCase';
import { TerminateStaffUseCase } from '../../src/application/use-cases/TerminateStaffUseCase';
import { UpdateEmploymentStatusUseCase } from '../../src/application/use-cases/UpdateEmploymentStatusUseCase';
import { UpdateStaffProfileUseCase } from '../../src/application/use-cases/UpdateStaffProfileUseCase';
import { UpdateStaffScheduleUseCase } from '../../src/application/use-cases/UpdateStaffScheduleUseCase';
import { GetStaffSpecializationsUseCase } from '../../src/application/use-cases/GetStaffSpecializationsUseCase';
import { AddStaffSpecializationUseCase } from '../../src/application/use-cases/AddStaffSpecializationUseCase';
import { RemoveStaffSpecializationUseCase } from '../../src/application/use-cases/RemoveStaffSpecializationUseCase';
import { StaffCommandHandlers } from '../../src/application/handlers/StaffCommandHandlers';
import { StaffQueryHandlers } from '../../src/application/handlers/StaffQueryHandlers';
import { SearchStaffUseCase } from '../../src/application/use-cases/SearchStaffUseCase';

// Presentation
import { StaffController } from '../../src/presentation/controllers/StaffController';
import { createStaffRoutes } from '../../src/presentation/routes/staffRoutes';

// Types
import { ILogger } from '../../src/application/interfaces/ILogger';

/**
 * Test Logger - Silent logger for tests
 */
const createTestLogger = (): ILogger => ({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  log: () => {}
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
  useMockSupabase?: boolean;
  useMockRabbitMQ?: boolean;
}

/**
 * App Factory Result
 */
export interface AppFactoryResult {
  app: Application;
  cleanup: () => Promise<void>;
  eventPublisher?: RabbitMQEventPublisher;
  staffRepository: SupabaseProviderStaffRepository;
  supabaseClient: SupabaseClient;
}

/**
 * Create test application
 */
export async function createTestApp(config: AppFactoryConfig): Promise<AppFactoryResult> {
  const logger = config.logger || createTestLogger();

  // Create Supabase client (mock or real)
  let supabaseClient: SupabaseClient;
  if (config.useMockSupabase) {
    // Mock Supabase client for unit tests
    supabaseClient = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    } as any;
  } else {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
  }

  // Create event publisher (optional)
  let eventPublisher: RabbitMQEventPublisher | undefined;

  if (config.enableRabbitMQ && config.rabbitmqUrl && !config.useMockRabbitMQ) {
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
  }

  // Create event bus (fallback)
  const eventBus = new SupabaseEventBus(
    config.supabaseUrl,
    config.supabaseKey,
    logger,
    'provider_schema'
  );

  // Create repository
  const staffRepository = new SupabaseProviderStaffRepository(
    config.supabaseUrl,
    config.supabaseKey,
    logger,
    {
      logDataAccess: async (entry: any) => logger.info('AUDIT: Data Access', entry),
      logDataModification: async (entry: any) => logger.info('AUDIT: Data Modification', entry),
      logSecurityEvent: async (entry: any) => logger.warn('AUDIT: Security Event', entry)
    },
    'provider_schema',
    'staff_profiles'
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

  const searchStaffUseCase = new SearchStaffUseCase(
    staffRepository,
    logger
  );

  const assignStaffToDepartmentUseCase = new AssignStaffToDepartmentUseCase(
    staffRepository,
    logger
  );

  const addStaffCredentialUseCase = new AddStaffCredentialUseCase(staffRepository, logger);
  const removeStaffCredentialUseCase = new RemoveStaffCredentialUseCase(staffRepository, logger);
  const renewStaffCredentialUseCase = new RenewStaffCredentialUseCase(staffRepository, logger);
  const getExpiringCredentialsUseCase = new GetExpiringCredentialsUseCase(staffRepository, logger);
  const activateStaffUseCase = new ActivateStaffUseCase(staffRepository, logger);
  const suspendStaffUseCase = new SuspendStaffUseCase(staffRepository, logger);
  const reactivateStaffUseCase = new ReactivateStaffUseCase(staffRepository, logger);
  const terminateStaffUseCase = new TerminateStaffUseCase(staffRepository, logger);
  const updateEmploymentStatusUseCase = new UpdateEmploymentStatusUseCase(staffRepository, logger);
  const updateStaffProfileUseCase = new UpdateStaffProfileUseCase(staffRepository, logger);
  const updateStaffScheduleUseCase = new UpdateStaffScheduleUseCase(staffRepository, logger);
  const getStaffSpecializationsUseCase = new GetStaffSpecializationsUseCase(staffRepository, logger);
  const addStaffSpecializationUseCase = new AddStaffSpecializationUseCase(staffRepository, logger);
  const removeStaffSpecializationUseCase = new RemoveStaffSpecializationUseCase(staffRepository, logger);

  // Create handlers
  const staffCommandHandlers = new StaffCommandHandlers(
    registerStaffUseCase,
    updateStaffProfileUseCase,
    activateStaffUseCase,
    suspendStaffUseCase,
    terminateStaffUseCase,
    addStaffCredentialUseCase,
    assignStaffToDepartmentUseCase,
    updateStaffScheduleUseCase,
    logger
  );

  const staffQueryHandlers = new StaffQueryHandlers(
    getStaffProfileUseCase,
    searchStaffUseCase,
    staffRepository,
    logger
  );

  // Create controller
  const staffController = new StaffController(
    logger,
    registerStaffUseCase,
    getStaffProfileUseCase,
    assignStaffToDepartmentUseCase,
    staffCommandHandlers,
    staffQueryHandlers,
    addStaffCredentialUseCase,
    removeStaffCredentialUseCase,
    renewStaffCredentialUseCase,
    getExpiringCredentialsUseCase,
    activateStaffUseCase,
    suspendStaffUseCase,
    reactivateStaffUseCase,
    terminateStaffUseCase,
    updateEmploymentStatusUseCase,
    updateStaffScheduleUseCase,
    // REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service
    getStaffSpecializationsUseCase,
    addStaffSpecializationUseCase,
    removeStaffSpecializationUseCase
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
  app.get('/health', (_req, res) => {
    res.json({
      service: 'provider-staff-service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Routes
  app.use('/api/v1/staff', createStaffRoutes(staffController));

  // Error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
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

