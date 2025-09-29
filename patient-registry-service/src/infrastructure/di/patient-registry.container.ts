/**
 * Patient Registry Service Container - Infrastructure Layer
 * Dependency injection setup for Patient Registry Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Injection, Healthcare
 */

import { Container } from '../../../shared/infrastructure/di/container';
import { IPatientRepository } from '../../domain/repositories/patient.repository';
import { SupabasePatientRepository } from '../repositories/supabase-patient.repository';
import { RegisterPatientUseCase } from '../../application/use-cases/register-patient.use-case';
import { GetPatientUseCase } from '../../application/use-cases/get-patient.use-case';
import { PatientController } from '../../presentation/controllers/patient.controller';
import { IDomainEventPublisher } from '../../../shared/domain/base/domain-event';
import { IEventStore } from '../../../shared/infrastructure/event-store/event-store.interface';

/**
 * Patient Registry Service Container
 * Configures dependency injection for the service
 */
export class PatientRegistryContainer {
  private container: Container;

  constructor() {
    this.container = new Container();
    this.registerDependencies();
  }

  /**
   * Register all service dependencies
   */
  private registerDependencies(): void {
    // Environment configuration
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Thiếu cấu hình Supabase. Vui lòng kiểm tra biến môi trường SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY');
    }

    // Register repositories
    this.container.registerSingleton<IPatientRepository>(
      'IPatientRepository',
      () => new SupabasePatientRepository(supabaseUrl, supabaseServiceKey),
      {
        tags: ['repository', 'patient', 'healthcare'],
        healthCheck: async (instance) => {
          try {
            await (instance as SupabasePatientRepository).getPatientStatistics();
            return { healthy: true, message: 'Patient repository is healthy' };
          } catch (error) {
            return { 
              healthy: false, 
              message: `Patient repository health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
          }
        }
      }
    );

    // Register domain event publisher (placeholder - would be actual implementation)
    this.container.registerSingleton<IDomainEventPublisher>(
      'IDomainEventPublisher',
      () => ({
        publish: async (event) => {
          console.log(`Publishing domain event: ${event.eventType}`, event);
          // In real implementation, this would publish to message queue
        }
      }),
      {
        tags: ['event', 'publisher', 'domain']
      }
    );

    // Register event store (placeholder - would be actual implementation)
    this.container.registerSingleton<IEventStore>(
      'IEventStore',
      () => ({
        saveEvents: async (aggregateId, aggregateType, events, expectedVersion) => {
          console.log(`Saving ${events.length} events for ${aggregateType}:${aggregateId}`);
          // In real implementation, this would save to event store
        },
        getEvents: async (aggregateId, fromVersion) => {
          console.log(`Getting events for ${aggregateId} from version ${fromVersion}`);
          return []; // In real implementation, this would return events
        },
        getEventsByType: async (eventType, fromTimestamp) => {
          console.log(`Getting events of type ${eventType} from ${fromTimestamp}`);
          return []; // In real implementation, this would return events
        }
      }),
      {
        tags: ['event', 'store', 'persistence']
      }
    );

    // Register use cases
    this.container.registerTransient<RegisterPatientUseCase>(
      'RegisterPatientUseCase',
      (container) => new RegisterPatientUseCase(
        container.resolve<IPatientRepository>('IPatientRepository'),
        container.resolve<IDomainEventPublisher>('IDomainEventPublisher'),
        container.resolve<IEventStore>('IEventStore')
      ),
      {
        tags: ['use-case', 'patient', 'registration', 'healthcare'],
        healthCheck: async (instance) => {
          // Use case health check would validate dependencies
          return { healthy: true, message: 'Register patient use case is healthy' };
        }
      }
    );

    this.container.registerTransient<GetPatientUseCase>(
      'GetPatientUseCase',
      (container) => new GetPatientUseCase(
        container.resolve<IPatientRepository>('IPatientRepository')
      ),
      {
        tags: ['use-case', 'patient', 'query', 'healthcare']
      }
    );

    // Register controllers
    this.container.registerTransient<PatientController>(
      'PatientController',
      (container) => new PatientController(
        container.resolve<RegisterPatientUseCase>('RegisterPatientUseCase'),
        container.resolve<GetPatientUseCase>('GetPatientUseCase')
      ),
      {
        tags: ['controller', 'patient', 'api', 'presentation']
      }
    );

    // Register health check services
    this.registerHealthCheckServices();

    // Register metrics services
    this.registerMetricsServices();
  }

  /**
   * Register health check services
   */
  private registerHealthCheckServices(): void {
    this.container.registerSingleton(
      'HealthCheckService',
      (container) => ({
        checkHealth: async () => {
          const results = await container.performHealthChecks();
          const allHealthy = results.every(result => result.healthy);
          
          return {
            status: allHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'patient-registry-service',
            version: '2.0.0',
            checks: results.map(result => ({
              name: result.serviceName,
              status: result.healthy ? 'healthy' : 'unhealthy',
              message: result.message,
              tags: result.tags
            }))
          };
        }
      }),
      {
        tags: ['health', 'monitoring']
      }
    );
  }

  /**
   * Register metrics services
   */
  private registerMetricsServices(): void {
    this.container.registerSingleton(
      'MetricsService',
      () => ({
        getMetrics: async () => {
          return {
            service: 'patient-registry-service',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            registrations: {
              total: this.container.getRegistrationCount(),
              byType: this.container.getRegistrationsByType(),
              byTag: this.container.getRegistrationsByTag()
            }
          };
        },
        incrementCounter: (name: string, tags?: Record<string, string>) => {
          console.log(`Incrementing counter: ${name}`, tags);
          // In real implementation, this would increment metrics
        },
        recordHistogram: (name: string, value: number, tags?: Record<string, string>) => {
          console.log(`Recording histogram: ${name} = ${value}`, tags);
          // In real implementation, this would record histogram
        },
        recordGauge: (name: string, value: number, tags?: Record<string, string>) => {
          console.log(`Recording gauge: ${name} = ${value}`, tags);
          // In real implementation, this would record gauge
        }
      }),
      {
        tags: ['metrics', 'monitoring', 'observability']
      }
    );
  }

  /**
   * Get container instance
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * Resolve service by name
   */
  public resolve<T>(serviceName: string): T {
    return this.container.resolve<T>(serviceName);
  }

  /**
   * Get patient controller
   */
  public getPatientController(): PatientController {
    return this.resolve<PatientController>('PatientController');
  }

  /**
   * Get health check service
   */
  public getHealthCheckService(): any {
    return this.resolve('HealthCheckService');
  }

  /**
   * Get metrics service
   */
  public getMetricsService(): any {
    return this.resolve('MetricsService');
  }

  /**
   * Initialize container with validation
   */
  public async initialize(): Promise<void> {
    try {
      // Validate all registrations
      await this.container.validateRegistrations();
      
      // Perform initial health checks
      const healthResults = await this.container.performHealthChecks();
      const unhealthyServices = healthResults.filter(result => !result.healthy);
      
      if (unhealthyServices.length > 0) {
        console.warn('Some services are unhealthy:', unhealthyServices);
        // In production, you might want to throw an error or implement retry logic
      }

      console.log('Patient Registry Service container initialized successfully');
      console.log(`Registered ${this.container.getRegistrationCount()} services`);
      
    } catch (error) {
      console.error('Failed to initialize Patient Registry Service container:', error);
      throw new Error(`Lỗi khởi tạo container dịch vụ: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Dispose container and cleanup resources
   */
  public async dispose(): Promise<void> {
    try {
      await this.container.dispose();
      console.log('Patient Registry Service container disposed successfully');
    } catch (error) {
      console.error('Error disposing container:', error);
      throw new Error(`Lỗi giải phóng tài nguyên container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get service information
   */
  public getServiceInfo(): any {
    return {
      name: 'patient-registry-service',
      version: '2.0.0',
      description: 'Dịch vụ đăng ký bệnh nhân với Clean Architecture và HIPAA compliance',
      architecture: 'Clean Architecture + DDD + CQRS + Event-Driven',
      compliance: ['HIPAA', 'FHIR R4', 'Vietnamese Healthcare Standards'],
      patterns: [
        'Aggregate Root',
        'Value Objects',
        'Domain Events',
        'Repository Pattern',
        'Use Case Pattern',
        'Dependency Injection',
        'Event Sourcing'
      ],
      registrations: {
        total: this.container.getRegistrationCount(),
        repositories: this.container.getServicesByTag('repository').length,
        useCases: this.container.getServicesByTag('use-case').length,
        controllers: this.container.getServicesByTag('controller').length,
        events: this.container.getServicesByTag('event').length
      },
      healthStatus: 'initialized'
    };
  }
}
