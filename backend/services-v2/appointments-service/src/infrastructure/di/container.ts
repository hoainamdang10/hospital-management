/**
 * Dependency Injection Container
 * Centralized DI setup for Scheduling Service
 * 
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, SOLID
 */

// Repositories
import { SupabaseAppointmentRepository } from '../persistence/SupabaseAppointmentRepository';
import { SupabaseAppointmentReadModelRepository } from '../persistence/SupabaseAppointmentReadModelRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAppointmentReadModelRepository } from '../../domain/repositories/IAppointmentReadModelRepository';

// Services
import { HttpPatientService } from '../services/HttpPatientService';
import { HttpProviderService } from '../services/HttpProviderService';
import { IPatientService } from '../../application/services/IPatientService';
import { IProviderService } from '../../application/services/IProviderService';

// Resilience & Cache
import { RedisCacheService } from '../cache/RedisCacheService';
import { circuitBreakerService } from '../resilience/CircuitBreakerService';

// Use Cases (Commands)
import { ScheduleAppointmentUseCase } from '../../application/use-cases/ScheduleAppointment.use-case';
import { CancelAppointmentUseCase } from '../../application/use-cases/CancelAppointment.use-case';
import { ConfirmAppointmentUseCase } from '../../application/use-cases/ConfirmAppointment.use-case';
import { CompleteAppointmentUseCase } from '../../application/use-cases/CompleteAppointment.use-case';
import { GetAppointmentUseCase } from '../../application/use-cases/GetAppointment.use-case';
import { ListAppointmentsUseCase } from '../../application/use-cases/ListAppointments.use-case';

// Queries
import { GetAppointmentDetailsQuery } from '../../application/queries/GetAppointmentDetailsQuery';
import { ListAppointmentsQuery } from '../../application/queries/ListAppointmentsQuery';

// Event Handlers
import { AppointmentReadModelEventHandler } from '../events/AppointmentReadModelEventHandler';
import { EventSubscriptions, createEventSubscriptions } from '../events/EventSubscriptions';

// Controllers
import { AppointmentController } from '../../presentation/controllers/AppointmentController';
import { AppointmentQueryController } from '../../presentation/controllers/AppointmentQueryController';

/**
 * DI Container
 */
export class DIContainer {
  // Repositories
  private appointmentRepository: IAppointmentRepository;
  private appointmentReadModelRepository: IAppointmentReadModelRepository;

  // Services
  private patientService: IPatientService;
  private providerService: IProviderService;

  // Resilience & Cache
  private cacheService: RedisCacheService;

  // Use Cases
  private scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  private cancelAppointmentUseCase: CancelAppointmentUseCase;
  private confirmAppointmentUseCase: ConfirmAppointmentUseCase;
  private completeAppointmentUseCase: CompleteAppointmentUseCase;
  private getAppointmentUseCase: GetAppointmentUseCase;
  private listAppointmentsUseCase: ListAppointmentsUseCase;

  // Queries
  private getAppointmentDetailsQuery: GetAppointmentDetailsQuery;
  private listAppointmentsQuery: ListAppointmentsQuery;

  // Event Handlers
  private appointmentReadModelEventHandler: AppointmentReadModelEventHandler;
  private eventSubscriptions: EventSubscriptions;

  // Controllers
  private appointmentController: AppointmentController;
  private appointmentQueryController: AppointmentQueryController;

  constructor() {
    // Validate environment variables
    this.validateEnvironment();

    // Initialize cache service
    this.initializeCacheService();

    // Initialize repositories
    this.initializeRepositories();

    // Initialize services
    this.initializeServices();

    // Initialize use cases
    this.initializeUseCases();

    // Initialize queries
    this.initializeQueries();

    // Initialize event handlers
    this.initializeEventHandlers();

    // Initialize event subscriptions
    this.initializeEventSubscriptions();

    // Initialize controllers
    this.initializeControllers();
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironment(): void {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Warn about optional variables
    if (!process.env.PATIENT_SERVICE_URL) {
      console.warn('[DI] PATIENT_SERVICE_URL not set - defaulting to http://localhost:3023');
    }

    if (!process.env.PROVIDER_SERVICE_URL) {
      console.warn('[DI] PROVIDER_SERVICE_URL not set - defaulting to http://localhost:3022');
    }
  }

  /**
   * Initialize cache service
   */
  private async initializeCacheService(): Promise<void> {
    this.cacheService = new RedisCacheService();

    try {
      await this.cacheService.connect();
      console.log('[DI] ✅ Cache service initialized');
    } catch (error) {
      console.warn('[DI] ⚠️ Cache service failed to connect - continuing without cache');
    }
  }

  /**
   * Initialize repositories
   */
  private initializeRepositories(): void {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    this.appointmentRepository = new SupabaseAppointmentRepository(
      supabaseUrl,
      supabaseKey
    );

    this.appointmentReadModelRepository = new SupabaseAppointmentReadModelRepository(
      supabaseUrl,
      supabaseKey
    );

    console.log('[DI] ✅ Repositories initialized');
  }

  /**
   * Initialize external services
   */
  private initializeServices(): void {
    const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3023';
    const providerServiceUrl = process.env.PROVIDER_SERVICE_URL || 'http://localhost:3022';

    this.patientService = new HttpPatientService(patientServiceUrl, this.cacheService);
    this.providerService = new HttpProviderService(providerServiceUrl, this.cacheService);

    console.log('[DI] ✅ External services initialized');
    console.log(`[DI]    - Patient Service: ${patientServiceUrl}`);
    console.log(`[DI]    - Provider Service: ${providerServiceUrl}`);
    console.log('[DI]    - Circuit breaker enabled');
    console.log('[DI]    - Retry logic enabled (3 attempts with exponential backoff)');
    console.log('[DI]    - Cache fallback enabled');
  }

  /**
   * Initialize use cases
   */
  private initializeUseCases(): void {
    this.scheduleAppointmentUseCase = new ScheduleAppointmentUseCase(
      this.appointmentRepository
    );

    this.cancelAppointmentUseCase = new CancelAppointmentUseCase(
      this.appointmentRepository
    );

    this.confirmAppointmentUseCase = new ConfirmAppointmentUseCase(
      this.appointmentRepository
    );

    this.completeAppointmentUseCase = new CompleteAppointmentUseCase(
      this.appointmentRepository
    );

    this.getAppointmentUseCase = new GetAppointmentUseCase(
      this.appointmentRepository
    );

    this.listAppointmentsUseCase = new ListAppointmentsUseCase(
      this.appointmentRepository
    );

    console.log('[DI] ✅ Use cases initialized');
  }

  /**
   * Initialize queries
   */
  private initializeQueries(): void {
    this.getAppointmentDetailsQuery = new GetAppointmentDetailsQuery(
      this.appointmentReadModelRepository
    );

    this.listAppointmentsQuery = new ListAppointmentsQuery(
      this.appointmentReadModelRepository
    );

    console.log('[DI] ✅ Queries initialized');
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    this.appointmentReadModelEventHandler = new AppointmentReadModelEventHandler(
      this.appointmentReadModelRepository,
      this.patientService,
      this.providerService
    );

    console.log('[DI] ✅ Event handlers initialized');
  }

  /**
   * Initialize event subscriptions
   */
  private initializeEventSubscriptions(): void {
    this.eventSubscriptions = createEventSubscriptions(
      this.appointmentReadModelEventHandler
    );

    console.log('[DI] ✅ Event subscriptions initialized');
  }

  /**
   * Initialize controllers
   */
  private initializeControllers(): void {
    this.appointmentController = new AppointmentController(
      this.scheduleAppointmentUseCase,
      this.cancelAppointmentUseCase,
      this.confirmAppointmentUseCase,
      this.completeAppointmentUseCase,
      this.getAppointmentUseCase,
      this.listAppointmentsUseCase
    );

    this.appointmentQueryController = new AppointmentQueryController(
      this.getAppointmentDetailsQuery,
      this.listAppointmentsQuery
    );

    console.log('[DI] ✅ Controllers initialized');
  }

  /**
   * Get appointment controller
   */
  public getAppointmentController(): AppointmentController {
    return this.appointmentController;
  }

  /**
   * Get appointment query controller
   */
  public getAppointmentQueryController(): AppointmentQueryController {
    return this.appointmentQueryController;
  }

  /**
   * Get appointment read model event handler
   */
  public getAppointmentReadModelEventHandler(): AppointmentReadModelEventHandler {
    return this.appointmentReadModelEventHandler;
  }

  /**
   * Get event subscriptions
   */
  public getEventSubscriptions(): EventSubscriptions {
    return this.eventSubscriptions;
  }

  /**
   * Get appointment repository
   */
  public getAppointmentRepository(): IAppointmentRepository {
    return this.appointmentRepository;
  }

  /**
   * Get appointment read model repository
   */
  public getAppointmentReadModelRepository(): IAppointmentReadModelRepository {
    return this.appointmentReadModelRepository;
  }
}

// Singleton instance
let containerInstance: DIContainer | null = null;

/**
 * Get DI container instance
 */
export function getContainer(): DIContainer {
  if (!containerInstance) {
    console.log('[DI] 🔧 Initializing DI Container...');
    containerInstance = new DIContainer();
    console.log('[DI] ✅ DI Container ready');
  }
  return containerInstance;
}

/**
 * Reset container (for testing)
 */
export function resetContainer(): void {
  containerInstance = null;
}

