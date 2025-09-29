/**
 * Scheduling Service Container - Infrastructure Layer
 * Dependency injection container with complete service registration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Dependency Injection, Clean Architecture, Production Configuration
 */

import { Container } from 'inversify';
import { createClient } from '@supabase/supabase-js';
import { Server as SocketIOServer } from 'socket.io';

// Domain
import { IAppointmentRepository } from '../../domain/repositories/appointment.repository';

// Application
import { ScheduleAppointmentUseCase, IPatientRegistryService, IProviderStaffService } from '../../application/use-cases/schedule-appointment.use-case';
import { GetAppointmentUseCase, SearchAppointmentsUseCase } from '../../application/use-cases/get-appointment.use-case';

// Infrastructure
import { SupabaseAppointmentRepository } from '../repositories/supabase-appointment.repository';
import { PatientRegistryServiceClient } from '../external-services/patient-registry.service-client';
import { ProviderStaffServiceClient } from '../external-services/provider-staff.service-client';
import { EventPublisherFactory, EventPublisherConfig } from '../events/event-publisher';

// Presentation
import { AppointmentController } from '../../presentation/controllers/appointment.controller';
import { AppointmentWebSocketHandler } from '../../presentation/websocket/appointment-websocket.handler';

// Shared
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { ConsoleLogger } from '../../../shared/infrastructure/logging/console.logger';
import { IEventPublisher } from '../../../shared/domain/events/event-publisher.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';
import { ICacheService } from '../../../shared/infrastructure/caching/cache.service.interface';
import { AuthorizationService } from '../../../shared/infrastructure/services/authorization.service';
import { AuditService } from '../../../shared/infrastructure/services/audit.service';
import { RedisCacheService } from '../../../shared/infrastructure/caching/redis-cache.service';

// Health Checks
import { IHealthCheck } from '../../../shared/infrastructure/health/health-check.interface';
import { DatabaseHealthCheck } from '../health/database.health-check';
import { ExternalServiceHealthCheck } from '../health/external-service.health-check';
import { EventPublisherHealthCheck } from '../health/event-publisher.health-check';

export interface SchedulingServiceConfig {
  // Database
  supabase: {
    url: string;
    serviceRoleKey: string;
    schema: string;
  };

  // External Services
  externalServices: {
    patientRegistryService: {
      baseUrl: string;
      timeout: number;
    };
    providerStaffService: {
      baseUrl: string;
      timeout: number;
    };
  };

  // Event Publishing
  eventPublisher: EventPublisherConfig;

  // Cache
  redis: {
    url: string;
    keyPrefix: string;
    defaultTtl: number;
  };

  // WebSocket
  websocket: {
    namespace: string;
    corsOrigins: string[];
    maxConnections: number;
    heartbeatInterval: number;
    connectionTimeout: number;
  };

  // Security
  security: {
    jwtSecret: string;
    corsOrigins: string[];
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
    };
  };

  // Monitoring
  monitoring: {
    enableMetrics: boolean;
    metricsPort: number;
    healthCheckInterval: number;
  };
}

/**
 * Scheduling Service Container
 * Configures and manages all service dependencies
 */
export class SchedulingContainer {
  private readonly container: Container;
  private readonly config: SchedulingServiceConfig;
  private readonly logger: ILogger;
  private isInitialized: boolean = false;

  constructor(config: SchedulingServiceConfig) {
    this.container = new Container();
    this.config = config;
    this.logger = new ConsoleLogger('SchedulingContainer');
  }

  /**
   * Initialize container with all dependencies
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Container already initialized');
      return;
    }

    try {
      this.logger.info('Initializing Scheduling Service Container');

      // Register core services
      await this.registerCoreServices();

      // Register infrastructure services
      await this.registerInfrastructureServices();

      // Register external service clients
      await this.registerExternalServiceClients();

      // Register application services
      await this.registerApplicationServices();

      // Register presentation services
      await this.registerPresentationServices();

      // Register health checks
      await this.registerHealthChecks();

      // Initialize services that require initialization
      await this.initializeServices();

      this.isInitialized = true;
      this.logger.info('Scheduling Service Container initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Scheduling Service Container', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Register core services
   */
  private async registerCoreServices(): Promise<void> {
    this.logger.debug('Registering core services');

    // Logger
    this.container.bind<ILogger>('Logger').toConstantValue(
      new ConsoleLogger('SchedulingService')
    );

    // Supabase Client
    const supabaseClient = createClient(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: this.config.supabase.schema
        }
      }
    );

    this.container.bind('SupabaseClient').toConstantValue(supabaseClient);

    this.logger.debug('Core services registered');
  }

  /**
   * Register infrastructure services
   */
  private async registerInfrastructureServices(): Promise<void> {
    this.logger.debug('Registering infrastructure services');

    // Repository
    this.container.bind<IAppointmentRepository>('AppointmentRepository').toDynamicValue((context) => {
      const supabaseClient = context.container.get('SupabaseClient');
      const logger = context.container.get<ILogger>('Logger');
      const auditService = context.container.get<IAuditService>('AuditService');

      return new SupabaseAppointmentRepository({
        supabase: supabaseClient,
        logger,
        auditService,
        schema: this.config.supabase.schema,
        tableName: 'appointments'
      });
    }).inSingletonScope();

    // Event Publisher
    this.container.bind<IEventPublisher>('EventPublisher').toDynamicValue((context) => {
      const logger = context.container.get<ILogger>('Logger');
      return EventPublisherFactory.create(this.config.eventPublisher, logger);
    }).inSingletonScope();

    // Cache Service
    this.container.bind<ICacheService>('CacheService').toDynamicValue((context) => {
      const logger = context.container.get<ILogger>('Logger');
      return new RedisCacheService({
        url: this.config.redis.url,
        keyPrefix: this.config.redis.keyPrefix,
        defaultTtl: this.config.redis.defaultTtl
      }, logger);
    }).inSingletonScope();

    // Authorization Service
    this.container.bind<IAuthorizationService>('AuthorizationService').toDynamicValue((context) => {
      const logger = context.container.get<ILogger>('Logger');
      return new AuthorizationService({
        jwtSecret: this.config.security.jwtSecret,
        defaultPermissions: {
          'patient': ['appointment:read:own', 'appointment:create:own'],
          'provider': ['appointment:read:assigned', 'appointment:update:assigned'],
          'receptionist': ['appointment:read', 'appointment:create', 'appointment:update'],
          'admin': ['appointment:*']
        }
      }, logger);
    }).inSingletonScope();

    // Audit Service
    this.container.bind<IAuditService>('AuditService').toDynamicValue((context) => {
      const supabaseClient = context.container.get('SupabaseClient');
      const logger = context.container.get<ILogger>('Logger');
      return new AuditService({
        supabase: supabaseClient,
        schema: this.config.supabase.schema,
        tableName: 'audit_logs'
      }, logger);
    }).inSingletonScope();

    this.logger.debug('Infrastructure services registered');
  }

  /**
   * Register external service clients
   */
  private async registerExternalServiceClients(): Promise<void> {
    this.logger.debug('Registering external service clients');

    // Patient Registry Service Client
    this.container.bind<IPatientRegistryService>('PatientRegistryService').toDynamicValue((context) => {
      const logger = context.container.get<ILogger>('Logger');
      return new PatientRegistryServiceClient(
        this.config.externalServices.patientRegistryService.baseUrl,
        logger,
        {
          timeout: this.config.externalServices.patientRegistryService.timeout,
          retryConfig: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 5000,
            backoffMultiplier: 2
          },
          circuitBreakerConfig: {
            failureThreshold: 5,
            resetTimeout: 30000,
            monitoringPeriod: 60000
          }
        }
      );
    }).inSingletonScope();

    // Provider/Staff Service Client
    this.container.bind<IProviderStaffService>('ProviderStaffService').toDynamicValue((context) => {
      const logger = context.container.get<ILogger>('Logger');
      return new ProviderStaffServiceClient(
        this.config.externalServices.providerStaffService.baseUrl,
        logger,
        {
          timeout: this.config.externalServices.providerStaffService.timeout,
          retryConfig: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 5000,
            backoffMultiplier: 2
          },
          circuitBreakerConfig: {
            failureThreshold: 5,
            resetTimeout: 30000,
            monitoringPeriod: 60000
          }
        }
      );
    }).inSingletonScope();

    this.logger.debug('External service clients registered');
  }

  /**
   * Register application services
   */
  private async registerApplicationServices(): Promise<void> {
    this.logger.debug('Registering application services');

    // Schedule Appointment Use Case
    this.container.bind<ScheduleAppointmentUseCase>('ScheduleAppointmentUseCase').toDynamicValue((context) => {
      return new ScheduleAppointmentUseCase({
        appointmentRepository: context.container.get<IAppointmentRepository>('AppointmentRepository'),
        patientRegistryService: context.container.get<IPatientRegistryService>('PatientRegistryService'),
        providerStaffService: context.container.get<IProviderStaffService>('ProviderStaffService'),
        eventPublisher: context.container.get<IEventPublisher>('EventPublisher'),
        logger: context.container.get<ILogger>('Logger'),
        authorizationService: context.container.get<IAuthorizationService>('AuthorizationService'),
        auditService: context.container.get<IAuditService>('AuditService')
      });
    }).inSingletonScope();

    // Get Appointment Use Case
    this.container.bind<GetAppointmentUseCase>('GetAppointmentUseCase').toDynamicValue((context) => {
      return new GetAppointmentUseCase({
        appointmentRepository: context.container.get<IAppointmentRepository>('AppointmentRepository'),
        logger: context.container.get<ILogger>('Logger'),
        authorizationService: context.container.get<IAuthorizationService>('AuthorizationService'),
        auditService: context.container.get<IAuditService>('AuditService'),
        cacheService: context.container.get<ICacheService>('CacheService')
      });
    }).inSingletonScope();

    // Search Appointments Use Case
    this.container.bind<SearchAppointmentsUseCase>('SearchAppointmentsUseCase').toDynamicValue((context) => {
      return new SearchAppointmentsUseCase({
        appointmentRepository: context.container.get<IAppointmentRepository>('AppointmentRepository'),
        logger: context.container.get<ILogger>('Logger'),
        authorizationService: context.container.get<IAuthorizationService>('AuthorizationService'),
        auditService: context.container.get<IAuditService>('AuditService'),
        cacheService: context.container.get<ICacheService>('CacheService')
      });
    }).inSingletonScope();

    this.logger.debug('Application services registered');
  }

  /**
   * Register presentation services
   */
  private async registerPresentationServices(): Promise<void> {
    this.logger.debug('Registering presentation services');

    // Appointment Controller
    this.container.bind<AppointmentController>('AppointmentController').toDynamicValue((context) => {
      return new AppointmentController({
        scheduleAppointmentUseCase: context.container.get<ScheduleAppointmentUseCase>('ScheduleAppointmentUseCase'),
        getAppointmentUseCase: context.container.get<GetAppointmentUseCase>('GetAppointmentUseCase'),
        searchAppointmentsUseCase: context.container.get<SearchAppointmentsUseCase>('SearchAppointmentsUseCase'),
        logger: context.container.get<ILogger>('Logger')
      });
    }).inSingletonScope();

    this.logger.debug('Presentation services registered');
  }

  /**
   * Register health checks
   */
  private async registerHealthChecks(): Promise<void> {
    this.logger.debug('Registering health checks');

    // Database Health Check
    this.container.bind<IHealthCheck>('DatabaseHealthCheck').toDynamicValue((context) => {
      const supabaseClient = context.container.get('SupabaseClient');
      const logger = context.container.get<ILogger>('Logger');
      return new DatabaseHealthCheck(supabaseClient, logger);
    }).inSingletonScope();

    // External Service Health Check
    this.container.bind<IHealthCheck>('ExternalServiceHealthCheck').toDynamicValue((context) => {
      const patientRegistryService = context.container.get<PatientRegistryServiceClient>('PatientRegistryService');
      const providerStaffService = context.container.get<ProviderStaffServiceClient>('ProviderStaffService');
      const logger = context.container.get<ILogger>('Logger');
      return new ExternalServiceHealthCheck({
        patientRegistryService,
        providerStaffService
      }, logger);
    }).inSingletonScope();

    // Event Publisher Health Check
    this.container.bind<IHealthCheck>('EventPublisherHealthCheck').toDynamicValue((context) => {
      const eventPublisher = context.container.get<IEventPublisher>('EventPublisher');
      const logger = context.container.get<ILogger>('Logger');
      return new EventPublisherHealthCheck(eventPublisher, logger);
    }).inSingletonScope();

    this.logger.debug('Health checks registered');
  }

  /**
   * Initialize services that require initialization
   */
  private async initializeServices(): Promise<void> {
    this.logger.debug('Initializing services');

    // Initialize Event Publisher
    const eventPublisher = this.container.get<IEventPublisher>('EventPublisher');
    if (eventPublisher && typeof eventPublisher.initialize === 'function') {
      await eventPublisher.initialize();
    }

    // Initialize Cache Service
    const cacheService = this.container.get<ICacheService>('CacheService');
    if (cacheService && typeof cacheService.initialize === 'function') {
      await cacheService.initialize();
    }

    this.logger.debug('Services initialized');
  }

  /**
   * Register WebSocket handler
   */
  registerWebSocketHandler(io: SocketIOServer): AppointmentWebSocketHandler {
    if (!this.isInitialized) {
      throw new Error('Container must be initialized before registering WebSocket handler');
    }

    const logger = this.container.get<ILogger>('Logger');
    const webSocketHandler = new AppointmentWebSocketHandler(
      io,
      this.config.websocket,
      logger
    );

    this.container.bind<AppointmentWebSocketHandler>('WebSocketHandler')
      .toConstantValue(webSocketHandler);

    // Subscribe to domain events
    const eventPublisher = this.container.get<IEventPublisher>('EventPublisher');
    if (eventPublisher && typeof eventPublisher.subscribe === 'function') {
      eventPublisher.subscribe({
        eventType: 'appointment.scheduled',
        handler: async (event) => await webSocketHandler.handleDomainEvent(event)
      });

      eventPublisher.subscribe({
        eventType: 'appointment.cancelled',
        handler: async (event) => await webSocketHandler.handleDomainEvent(event)
      });

      eventPublisher.subscribe({
        eventType: 'appointment.rescheduled',
        handler: async (event) => await webSocketHandler.handleDomainEvent(event)
      });
    }

    this.logger.info('WebSocket handler registered and subscribed to domain events');
    return webSocketHandler;
  }

  /**
   * Get service instance
   */
  get<T>(serviceIdentifier: string): T {
    if (!this.isInitialized) {
      throw new Error('Container must be initialized before getting services');
    }

    return this.container.get<T>(serviceIdentifier);
  }

  /**
   * Get all health checks
   */
  getHealthChecks(): IHealthCheck[] {
    if (!this.isInitialized) {
      throw new Error('Container must be initialized before getting health checks');
    }

    return [
      this.container.get<IHealthCheck>('DatabaseHealthCheck'),
      this.container.get<IHealthCheck>('ExternalServiceHealthCheck'),
      this.container.get<IHealthCheck>('EventPublisherHealthCheck')
    ];
  }

  /**
   * Get container statistics
   */
  getStatistics(): any {
    return {
      isInitialized: this.isInitialized,
      registeredServices: this.container.isBound('AppointmentController') ? 'All services registered' : 'Services not registered',
      healthChecks: this.isInitialized ? this.getHealthChecks().length : 0,
      config: {
        supabaseSchema: this.config.supabase.schema,
        eventPublisherType: this.config.eventPublisher.type,
        websocketNamespace: this.config.websocket.namespace,
        maxConnections: this.config.websocket.maxConnections
      }
    };
  }

  /**
   * Cleanup container resources
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Cleaning up Scheduling Service Container');

      // Cleanup WebSocket handler
      if (this.container.isBound('WebSocketHandler')) {
        const webSocketHandler = this.container.get<AppointmentWebSocketHandler>('WebSocketHandler');
        await webSocketHandler.cleanup();
      }

      // Cleanup Event Publisher
      if (this.container.isBound('EventPublisher')) {
        const eventPublisher = this.container.get<IEventPublisher>('EventPublisher');
        if (eventPublisher && typeof eventPublisher.close === 'function') {
          await eventPublisher.close();
        }
      }

      // Cleanup Cache Service
      if (this.container.isBound('CacheService')) {
        const cacheService = this.container.get<ICacheService>('CacheService');
        if (cacheService && typeof cacheService.disconnect === 'function') {
          await cacheService.disconnect();
        }
      }

      this.container.unbindAll();
      this.isInitialized = false;

      this.logger.info('Scheduling Service Container cleanup completed');

    } catch (error) {
      this.logger.error('Error during container cleanup', {
        error: error.message,
        stack: error.stack
      });
    }
  }
}
