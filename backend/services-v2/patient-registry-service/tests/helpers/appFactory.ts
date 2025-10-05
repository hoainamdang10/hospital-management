/**
 * App Factory for Integration Tests
 * 
 * Creates and configures Express app instance for testing
 * without starting the actual server
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Infrastructure imports
import { SupabasePatientRepository } from '../../src/infrastructure/repositories/SupabasePatientRepository';
import { RabbitMQEventPublisher } from '../../src/infrastructure/events/RabbitMQEventPublisher';

// Application Services
import { PatientMatchingService } from '../../src/application/services/PatientMatchingService';
import { InsuranceValidationService } from '../../src/application/services/InsuranceValidationService';

// Use Cases
import { RegisterPatientUseCase } from '../../src/application/use-cases/RegisterPatientUseCase';
import { UpdatePatientInfoUseCase } from '../../src/application/use-cases/UpdatePatientInfoUseCase';
import { GetPatientProfileUseCase } from '../../src/application/use-cases/GetPatientProfileUseCase';
import { SearchPatientsUseCase } from '../../src/application/use-cases/SearchPatientsUseCase';
import { MatchPatientsUseCase } from '../../src/application/use-cases/MatchPatientsUseCase';
import { MergePatientsUseCase } from '../../src/application/use-cases/MergePatientsUseCase';
import { LinkPatientsUseCase } from '../../src/application/use-cases/LinkPatientsUseCase';
import { DeactivatePatientUseCase } from '../../src/application/use-cases/DeactivatePatientUseCase';
import { ValidateInsuranceUseCase } from '../../src/application/use-cases/ValidateInsuranceUseCase';
import { AddEmergencyContactUseCase } from '../../src/application/use-cases/AddEmergencyContactUseCase';
import { GrantConsentUseCase } from '../../src/application/use-cases/GrantConsentUseCase';
import { MarkAsDeceasedUseCase } from '../../src/application/use-cases/MarkAsDeceasedUseCase';
import { ReactivatePatientUseCase } from '../../src/application/use-cases/ReactivatePatientUseCase';
import { PatientCommandHandlers } from '../../src/application/handlers/PatientCommandHandlers';

// Presentation
import { PatientController } from '../../src/presentation/controllers/PatientController';
import { CommandController } from '../../src/presentation/controllers/CommandController';
import { createPatientRoutes } from '../../src/presentation/routes/patientRoutes';
import { createCommandRoutes } from '../../src/presentation/routes/commandRoutes';
import { ErrorHandlingMiddleware } from '../../src/presentation/middleware/ErrorHandlingMiddleware';

// Logger
import { ILogger, LogMetadata } from '@shared/application/services/logger.interface';

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
  patientRepository: SupabasePatientRepository;
}

/**
 * Create Express app for testing
 */
export async function createTestApp(config: AppFactoryConfig): Promise<AppFactoryResult> {
  const app = express();
  const logger = config.logger || createTestLogger();

  // Initialize Event Publisher (optional for tests)
  let eventPublisher: RabbitMQEventPublisher | undefined;
  
  if (config.enableRabbitMQ && config.rabbitmqUrl) {
    eventPublisher = new RabbitMQEventPublisher(
      {
        url: config.rabbitmqUrl,
        exchange: 'patient-registry-events-test',
        exchangeType: 'topic',
        durable: false,
        autoDelete: true
      },
      {
        enableRetry: false,
        maxRetries: 1,
        retryDelayMs: 100,
        enableLogging: false
      },
      logger
    );

    try {
      await eventPublisher.connect();
    } catch (error) {
      console.warn('⚠️  RabbitMQ not available for tests, continuing without event publishing');
      eventPublisher = undefined;
    }
  }

  // Initialize Application Services
  const matchingService = new PatientMatchingService(logger);
  const insuranceValidationService = new InsuranceValidationService(logger);

  // Initialize Repository
  const patientRepository = new SupabasePatientRepository(
    config.supabaseUrl,
    config.supabaseKey,
    logger,
    matchingService,
    eventPublisher
  );

  // Initialize Use Cases
  const registerPatientUseCase = new RegisterPatientUseCase(patientRepository);
  const updatePatientInfoUseCase = new UpdatePatientInfoUseCase(patientRepository);
  const getPatientProfileUseCase = new GetPatientProfileUseCase(patientRepository);
  const searchPatientsUseCase = new SearchPatientsUseCase(patientRepository);
  const matchPatientsUseCase = new MatchPatientsUseCase(patientRepository);
  const mergePatientsUseCase = new MergePatientsUseCase(patientRepository);
  const linkPatientsUseCase = new LinkPatientsUseCase(patientRepository);
  const deactivatePatientUseCase = new DeactivatePatientUseCase(patientRepository);
  const validateInsuranceUseCase = new ValidateInsuranceUseCase(patientRepository, insuranceValidationService);
  const addEmergencyContactUseCase = new AddEmergencyContactUseCase(patientRepository);
  const grantConsentUseCase = new GrantConsentUseCase(patientRepository);
  const markAsDeceasedUseCase = new MarkAsDeceasedUseCase(patientRepository);
  const reactivatePatientUseCase = new ReactivatePatientUseCase(patientRepository);

  // Initialize Command Handlers
  const patientCommandHandlers = new PatientCommandHandlers(
    registerPatientUseCase,
    updatePatientInfoUseCase,
    deactivatePatientUseCase,
    grantConsentUseCase,
    addEmergencyContactUseCase,
    logger
  );

  // Initialize Controllers
  const patientController = new PatientController(
    logger,
    registerPatientUseCase,
    updatePatientInfoUseCase,
    getPatientProfileUseCase,
    searchPatientsUseCase,
    matchPatientsUseCase,
    mergePatientsUseCase,
    linkPatientsUseCase,
    deactivatePatientUseCase,
    validateInsuranceUseCase,
    addEmergencyContactUseCase,
    grantConsentUseCase,
    markAsDeceasedUseCase,
    reactivatePatientUseCase
  );

  const commandController = new CommandController(logger, patientCommandHandlers);
  const errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);

  // Setup Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: '*', credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Setup Routes
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'patient-registry-service-test',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  });

  const patientRoutes = createPatientRoutes(patientController);
  app.use('/api/v1/patients', patientRoutes);

  const commandRoutes = createCommandRoutes(commandController);
  app.use('/api/v1/commands', commandRoutes);

  // Error handling
  app.use(errorHandlingMiddleware.notFound());
  app.use(errorHandlingMiddleware.handle());

  // Cleanup function
  const cleanup = async () => {
    if (eventPublisher) {
      await eventPublisher.close();
    }
  };

  return {
    app,
    cleanup,
    eventPublisher,
    patientRepository
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
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
    enableRabbitMQ: true
  });
}

