/**
 * Dependency Injection Container - Clinical EMR Service
 * Container setup for all dependencies
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DI Pattern, IoC
 */

import { Container } from 'inversify';
import { TYPES } from './types';

// Domain
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';

// Application
import { CreateMedicalRecordUseCase } from '../../application/use-cases/CreateMedicalRecordUseCase';
import { GetMedicalRecordUseCase } from '../../application/use-cases/GetMedicalRecordUseCase';
import { GetPatientMedicalRecordsUseCase } from '../../application/use-cases/GetPatientMedicalRecordsUseCase';
import { UpdateMedicalRecordUseCase } from '../../application/use-cases/UpdateMedicalRecordUseCase';

// Infrastructure
import { SupabaseMedicalRecordRepository } from '../persistence/SupabaseMedicalRecordRepository';
import { OptimizedSupabaseClient } from '@shared/infrastructure/database/optimized-supabase-client';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
import { InMemoryDomainEventPublisher } from '@shared/infrastructure/events/InMemoryDomainEventPublisher';

// Configuration
import { ClinicalEMRConfig } from '../config/clinical-emr-config';

/**
 * Create and configure the DI container
 */
export function createContainer(): Container {
  const container = new Container();

  // =====================================================
  // CONFIGURATION
  // =====================================================
  
  container.bind<ClinicalEMRConfig>(TYPES.Config).to(ClinicalEMRConfig).inSingletonScope();

  // =====================================================
  // INFRASTRUCTURE - DATABASE
  // =====================================================
  
  container.bind<OptimizedSupabaseClient>(TYPES.SupabaseClient)
    .toDynamicValue((context) => {
      const config = context.container.get<ClinicalEMRConfig>(TYPES.Config);
      return new OptimizedSupabaseClient({
        supabaseUrl: config.supabaseUrl,
        supabaseServiceKey: config.supabaseServiceRoleKey,
        serviceName: 'clinical-emr-service',
        schemaName: 'medical_records_schema',
        enableOptimizations: process.env.NODE_ENV !== 'test'
      });
    })
    .inSingletonScope();

  // =====================================================
  // INFRASTRUCTURE - EVENTS
  // =====================================================
  
  container.bind<IDomainEventPublisher>(TYPES.DomainEventPublisher)
    .to(InMemoryDomainEventPublisher)
    .inSingletonScope();

  // =====================================================
  // INFRASTRUCTURE - REPOSITORIES
  // =====================================================
  
  container.bind<IMedicalRecordRepository>(TYPES.MedicalRecordRepository)
    .to(SupabaseMedicalRecordRepository)
    .inSingletonScope();

  // =====================================================
  // APPLICATION - USE CASES
  // =====================================================
  
  container.bind<CreateMedicalRecordUseCase>(TYPES.CreateMedicalRecordUseCase)
    .toDynamicValue((context) => {
      const repository = context.container.get<IMedicalRecordRepository>(TYPES.MedicalRecordRepository);
      const eventPublisher = context.container.get<IDomainEventPublisher>(TYPES.DomainEventPublisher);
      return new CreateMedicalRecordUseCase(repository, eventPublisher);
    })
    .inTransientScope();

  container.bind<GetMedicalRecordUseCase>(TYPES.GetMedicalRecordUseCase)
    .toDynamicValue((context) => {
      const repository = context.container.get<IMedicalRecordRepository>(TYPES.MedicalRecordRepository);
      return new GetMedicalRecordUseCase(repository);
    })
    .inTransientScope();

  container.bind<GetPatientMedicalRecordsUseCase>(TYPES.GetPatientMedicalRecordsUseCase)
    .toDynamicValue((context) => {
      const repository = context.container.get<IMedicalRecordRepository>(TYPES.MedicalRecordRepository);
      return new GetPatientMedicalRecordsUseCase(repository);
    })
    .inTransientScope();

  container.bind<UpdateMedicalRecordUseCase>(TYPES.UpdateMedicalRecordUseCase)
    .toDynamicValue((context) => {
      const repository = context.container.get<IMedicalRecordRepository>(TYPES.MedicalRecordRepository);
      const eventPublisher = context.container.get<IDomainEventPublisher>(TYPES.DomainEventPublisher);
      return new UpdateMedicalRecordUseCase(repository, eventPublisher);
    })
    .inTransientScope();

  return container;
}

/**
 * Global container instance
 */
export const container = createContainer();

/**
 * Helper functions to get services from container
 */
export const getService = <T>(serviceIdentifier: symbol): T => {
  return container.get<T>(serviceIdentifier);
};

export const getServices = <T>(serviceIdentifier: symbol): T[] => {
  return container.getAll<T>(serviceIdentifier);
};

/**
 * Container health check
 */
export const checkContainerHealth = (): { healthy: boolean; errors: string[] } => {
  const errors: string[] = [];
  let healthy = true;

  try {
    // Test critical dependencies
    const config = container.get<ClinicalEMRConfig>(TYPES.Config);
    if (!config) {
      errors.push('Configuration not available');
      healthy = false;
    }

    const supabaseClient = container.get<OptimizedSupabaseClient>(TYPES.SupabaseClient);
    if (!supabaseClient) {
      errors.push('Supabase client not available');
      healthy = false;
    }

    const repository = container.get<IMedicalRecordRepository>(TYPES.MedicalRecordRepository);
    if (!repository) {
      errors.push('Medical record repository not available');
      healthy = false;
    }

    const eventPublisher = container.get<IDomainEventPublisher>(TYPES.DomainEventPublisher);
    if (!eventPublisher) {
      errors.push('Domain event publisher not available');
      healthy = false;
    }

    // Test use cases
    const createUseCase = container.get<CreateMedicalRecordUseCase>(TYPES.CreateMedicalRecordUseCase);
    if (!createUseCase) {
      errors.push('Create medical record use case not available');
      healthy = false;
    }

    const getUseCase = container.get<GetMedicalRecordUseCase>(TYPES.GetMedicalRecordUseCase);
    if (!getUseCase) {
      errors.push('Get medical record use case not available');
      healthy = false;
    }

    const getPatientUseCase = container.get<GetPatientMedicalRecordsUseCase>(TYPES.GetPatientMedicalRecordsUseCase);
    if (!getPatientUseCase) {
      errors.push('Get patient medical records use case not available');
      healthy = false;
    }

    const updateUseCase = container.get<UpdateMedicalRecordUseCase>(TYPES.UpdateMedicalRecordUseCase);
    if (!updateUseCase) {
      errors.push('Update medical record use case not available');
      healthy = false;
    }

  } catch (error) {
    errors.push(`Container error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    healthy = false;
  }

  return { healthy, errors };
};

/**
 * Container cleanup
 */
export const cleanupContainer = async (): Promise<void> => {
  try {
    // Cleanup Supabase client connections
    const supabaseClient = container.get<OptimizedSupabaseClient>(TYPES.SupabaseClient);
    if (supabaseClient && typeof supabaseClient.cleanup === 'function') {
      await supabaseClient.cleanup();
    }

    // Cleanup event publisher
    const eventPublisher = container.get<IDomainEventPublisher>(TYPES.DomainEventPublisher);
    if (eventPublisher && typeof eventPublisher.cleanup === 'function') {
      await eventPublisher.cleanup();
    }

    // Unbind all services
    container.unbindAll();

  } catch (error) {
    console.error('Error during container cleanup:', error);
  }
};

/**
 * Container configuration validation
 */
export const validateContainerConfiguration = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  let valid = true;

  try {
    const config = container.get<ClinicalEMRConfig>(TYPES.Config);
    
    if (!config.supabaseUrl) {
      errors.push('Supabase URL not configured');
      valid = false;
    }

    if (!config.supabaseServiceRoleKey) {
      errors.push('Supabase service role key not configured');
      valid = false;
    }

    if (!config.jwtSecret) {
      errors.push('JWT secret not configured');
      valid = false;
    }

    if (!config.port || config.port < 1000 || config.port > 65535) {
      errors.push('Invalid port configuration');
      valid = false;
    }

  } catch (error) {
    errors.push(`Configuration validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    valid = false;
  }

  return { valid, errors };
};

/**
 * Initialize container with health checks
 */
export const initializeContainer = async (): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = [];

  try {
    // Validate configuration
    const configValidation = validateContainerConfiguration();
    if (!configValidation.valid) {
      errors.push(...configValidation.errors);
      return { success: false, errors };
    }

    // Check container health
    const healthCheck = checkContainerHealth();
    if (!healthCheck.healthy) {
      errors.push(...healthCheck.errors);
      return { success: false, errors };
    }

    // Test database connection
    const supabaseClient = container.get<OptimizedSupabaseClient>(TYPES.SupabaseClient);
    const connection = await supabaseClient.getConnection();
    if (!connection) {
      errors.push('Failed to establish database connection');
      return { success: false, errors };
    }

    return { success: true, errors: [] };

  } catch (error) {
    errors.push(`Container initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, errors };
  }
};
