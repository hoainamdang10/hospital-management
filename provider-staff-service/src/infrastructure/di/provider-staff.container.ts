/**
 * Provider Staff Service Container - Infrastructure Layer
 * Dependency injection container for provider staff service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Dependency Injection, Clean Architecture, Healthcare Services
 */

import { Container } from '../../../shared/infrastructure/di/container';
import { createClient } from '@supabase/supabase-js';

// Domain
import { IDoctorRepository } from '../../domain/repositories/doctor.repository';

// Application
import { RegisterDoctorUseCase } from '../../application/use-cases/register-doctor.use-case';
import { GetDoctorUseCase, SearchDoctorsUseCase } from '../../application/use-cases/get-doctor.use-case';

// Infrastructure
import { SupabaseDoctorRepository } from '../repositories/supabase-doctor.repository';

// Presentation
import { DoctorController } from '../../presentation/controllers/doctor.controller';

// Shared services
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IEventPublisher } from '../../../shared/domain/events/event-publisher.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';
import { ICacheService } from '../../../shared/infrastructure/caching/cache.service.interface';

export interface ProviderStaffContainerConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  schema: string;
  logger: ILogger;
  eventPublisher: IEventPublisher;
  authorizationService: IAuthorizationService;
  auditService: IAuditService;
  cacheService: ICacheService;
}

export class ProviderStaffContainer extends Container {
  private config: ProviderStaffContainerConfig;

  constructor(config: ProviderStaffContainerConfig) {
    super('ProviderStaffService');
    this.config = config;
    this.registerDependencies();
  }

  private registerDependencies(): void {
    // Register Supabase client
    this.registerSingleton('SupabaseClient', () => {
      return createClient(this.config.supabaseUrl, this.config.supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: this.config.schema
        }
      });
    });

    // Register shared services
    this.registerSingleton('Logger', () => this.config.logger);
    this.registerSingleton('EventPublisher', () => this.config.eventPublisher);
    this.registerSingleton('AuthorizationService', () => this.config.authorizationService);
    this.registerSingleton('AuditService', () => this.config.auditService);
    this.registerSingleton('CacheService', () => this.config.cacheService);

    // Register repositories
    this.registerSingleton<IDoctorRepository>('DoctorRepository', () => {
      return new SupabaseDoctorRepository({
        supabase: this.resolve('SupabaseClient'),
        logger: this.resolve('Logger'),
        auditService: this.resolve('AuditService'),
        schema: this.config.schema,
        tableName: 'doctors'
      });
    });

    // Register use cases
    this.registerTransient('RegisterDoctorUseCase', () => {
      return new RegisterDoctorUseCase({
        doctorRepository: this.resolve('DoctorRepository'),
        eventPublisher: this.resolve('EventPublisher'),
        logger: this.resolve('Logger'),
        authorizationService: this.resolve('AuthorizationService'),
        auditService: this.resolve('AuditService')
      });
    });

    this.registerTransient('GetDoctorUseCase', () => {
      return new GetDoctorUseCase({
        doctorRepository: this.resolve('DoctorRepository'),
        logger: this.resolve('Logger'),
        authorizationService: this.resolve('AuthorizationService'),
        auditService: this.resolve('AuditService'),
        cacheService: this.resolve('CacheService')
      });
    });

    this.registerTransient('SearchDoctorsUseCase', () => {
      return new SearchDoctorsUseCase({
        doctorRepository: this.resolve('DoctorRepository'),
        logger: this.resolve('Logger'),
        authorizationService: this.resolve('AuthorizationService'),
        auditService: this.resolve('AuditService'),
        cacheService: this.resolve('CacheService')
      });
    });

    // Register controllers
    this.registerTransient('DoctorController', () => {
      return new DoctorController({
        registerDoctorUseCase: this.resolve('RegisterDoctorUseCase'),
        getDoctorUseCase: this.resolve('GetDoctorUseCase'),
        searchDoctorsUseCase: this.resolve('SearchDoctorsUseCase'),
        logger: this.resolve('Logger')
      });
    });
  }

  /**
   * Get doctor controller
   */
  public getDoctorController(): DoctorController {
    return this.resolve('DoctorController');
  }

  /**
   * Get doctor repository
   */
  public getDoctorRepository(): IDoctorRepository {
    return this.resolve('DoctorRepository');
  }

  /**
   * Get register doctor use case
   */
  public getRegisterDoctorUseCase(): RegisterDoctorUseCase {
    return this.resolve('RegisterDoctorUseCase');
  }

  /**
   * Get doctor use case
   */
  public getGetDoctorUseCase(): GetDoctorUseCase {
    return this.resolve('GetDoctorUseCase');
  }

  /**
   * Get search doctors use case
   */
  public getSearchDoctorsUseCase(): SearchDoctorsUseCase {
    return this.resolve('SearchDoctorsUseCase');
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const supabase = this.resolve('SupabaseClient');
      const logger = this.resolve('Logger');

      // Test database connection
      const { data, error } = await supabase
        .schema(this.config.schema)
        .from('doctors')
        .select('count(*)')
        .limit(1);

      if (error) {
        logger.error('Health check failed - database error', { error: error.message });
        return {
          status: 'unhealthy',
          details: {
            database: 'error',
            error: error.message
          }
        };
      }

      logger.info('Health check passed');
      return {
        status: 'healthy',
        details: {
          database: 'connected',
          schema: this.config.schema,
          services: {
            doctorRepository: 'registered',
            useCases: 'registered',
            controllers: 'registered'
          }
        }
      };

    } catch (error) {
      this.config.logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * Initialize service
   */
  public async initialize(): Promise<void> {
    try {
      this.config.logger.info('Initializing Provider Staff Service');

      // Test all critical dependencies
      const doctorRepository = this.getDoctorRepository();
      const registerUseCase = this.getRegisterDoctorUseCase();
      const getUseCase = this.getGetDoctorUseCase();
      const searchUseCase = this.getSearchDoctorsUseCase();
      const controller = this.getDoctorController();

      // Verify database schema
      const supabase = this.resolve('SupabaseClient');
      const { error } = await supabase
        .schema(this.config.schema)
        .from('doctors')
        .select('id')
        .limit(1);

      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw new Error(`Database schema verification failed: ${error.message}`);
      }

      this.config.logger.info('Provider Staff Service initialized successfully', {
        schema: this.config.schema,
        services: {
          repository: !!doctorRepository,
          useCases: !!(registerUseCase && getUseCase && searchUseCase),
          controller: !!controller
        }
      });

    } catch (error) {
      this.config.logger.error('Failed to initialize Provider Staff Service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Shutdown service
   */
  public async shutdown(): Promise<void> {
    try {
      this.config.logger.info('Shutting down Provider Staff Service');

      // Close any open connections
      const supabase = this.resolve('SupabaseClient');
      // Supabase client doesn't have explicit close method

      this.config.logger.info('Provider Staff Service shutdown completed');

    } catch (error) {
      this.config.logger.error('Error during Provider Staff Service shutdown', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get service metrics
   */
  public getMetrics(): any {
    return {
      serviceName: 'ProviderStaffService',
      registeredServices: this.getRegisteredServiceNames(),
      schema: this.config.schema,
      dependencies: {
        supabase: 'connected',
        logger: 'active',
        eventPublisher: 'active',
        authorizationService: 'active',
        auditService: 'active',
        cacheService: 'active'
      }
    };
  }
}
