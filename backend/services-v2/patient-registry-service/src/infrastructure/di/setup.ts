/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Patient Registry Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */

import {
  OptimizedSupabaseClient,
  OptimizedSupabaseClientConfig,
} from "../../../../shared/infrastructure/database/optimized-supabase-client";
import {
  DIContainer,
  ServiceLifetime,
} from "../../../../shared/infrastructure/di/container";
import { ILogger } from "../../../../shared/infrastructure/logging/logger.interface";
import { IAuditService } from "../../../../shared/application/services/audit.service.interface";
import { ConsoleLogger } from "../../../../shared/infrastructure/logging/console-logger";
import { AuditService } from "../../../../shared/infrastructure/services/audit.service";

// Application Layer
import { RegisterPatientUseCase } from "../../application/use-cases/RegisterPatientUseCase";
import { GetPatientProfileUseCase } from "../../application/use-cases/GetPatientProfileUseCase";
import { UpdatePatientInfoUseCase } from "../../application/use-cases/UpdatePatientInfoUseCase";
import { PatientCommandHandlers } from "../../application/handlers/PatientCommandHandlers";
import { PatientQueryHandlers } from "../../application/handlers/PatientQueryHandlers";

// Infrastructure Layer
import { SupabasePatientRepository } from "../repositories/SupabasePatientRepository";
import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
import { PatientDomainEventHandler } from "../events/PatientDomainEventHandler";

// Service Tokens
export const ServiceTokens = {
  // Infrastructure
  SUPABASE_CLIENT: "SupabaseClient",
  LOGGER: "Logger",
  AUDIT_SERVICE: "AuditService",
  EVENT_BUS: "EventBus",

  // Repositories
  PATIENT_REPOSITORY: "PatientRepository",

  // Use Cases
  REGISTER_PATIENT_USE_CASE: "RegisterPatientUseCase",
  GET_PATIENT_PROFILE_USE_CASE: "GetPatientProfileUseCase",
  UPDATE_PATIENT_INFO_USE_CASE: "UpdatePatientInfoUseCase",

  // Handlers
  PATIENT_COMMAND_HANDLERS: "PatientCommandHandlers",
  PATIENT_QUERY_HANDLERS: "PatientQueryHandlers",

  // Event Handlers
  PATIENT_DOMAIN_EVENT_HANDLER: "PatientDomainEventHandler",
} as const;

export function setupDependencies(container: DIContainer): void {
  // Register infrastructure services
  container.register(
    ServiceTokens.LOGGER,
    () => new ConsoleLogger('patient-registry-service'),
    ServiceLifetime.SINGLETON
  );

  container.register(
    ServiceTokens.AUDIT_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new AuditService({ logger });
    },
    ServiceLifetime.SINGLETON
  );

  // Register Supabase client
  container.register(
    ServiceTokens.SUPABASE_CLIENT,
    () => {
      const config: OptimizedSupabaseClientConfig = {
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        serviceName: "patient-registry-service",
        schemaName: "patient_schema",
        enableOptimizations: true,
      };
      return new OptimizedSupabaseClient(config);
    },
    ServiceLifetime.SINGLETON
  );

  // Register event bus
  container.register(
    ServiceTokens.EVENT_BUS,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new SupabaseEventBus({ supabase: supabaseClient, logger });
    },
    ServiceLifetime.SCOPED
  );

  // Register repositories
  container.register(
    ServiceTokens.PATIENT_REPOSITORY,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new SupabasePatientRepository({
        supabase: supabaseClient,
        logger,
        auditService,
        schema: 'patient_schema',
        tableName: 'patient_profiles'
      });
    },
    ServiceLifetime.SCOPED
  );

  // Register use cases
  container.register(
    ServiceTokens.REGISTER_PATIENT_USE_CASE,
    (container) => {
      const patientRepository = container.resolve(ServiceTokens.PATIENT_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new RegisterPatientUseCase(
        patientRepository,
        eventBus,
        logger
      );
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.GET_PATIENT_PROFILE_USE_CASE,
    (container) => {
      const patientRepository = container.resolve(ServiceTokens.PATIENT_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetPatientProfileUseCase(patientRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.UPDATE_PATIENT_INFO_USE_CASE,
    (container) => {
      const patientRepository = container.resolve(ServiceTokens.PATIENT_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new UpdatePatientInfoUseCase(
        patientRepository,
        eventBus,
        logger
      );
    },
    ServiceLifetime.TRANSIENT
  );

  // Register handlers
  container.register(
    ServiceTokens.PATIENT_COMMAND_HANDLERS,
    (container) => {
      const registerPatientUseCase = container.resolve(ServiceTokens.REGISTER_PATIENT_USE_CASE);
      const updatePatientInfoUseCase = container.resolve(ServiceTokens.UPDATE_PATIENT_INFO_USE_CASE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new PatientCommandHandlers(
        registerPatientUseCase,
        updatePatientInfoUseCase,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  container.register(
    ServiceTokens.PATIENT_QUERY_HANDLERS,
    (container) => {
      const getPatientProfileUseCase = container.resolve(ServiceTokens.GET_PATIENT_PROFILE_USE_CASE);
      const patientRepository = container.resolve(ServiceTokens.PATIENT_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new PatientQueryHandlers(
        getPatientProfileUseCase,
        patientRepository,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  // Register event handlers
  container.register(
    ServiceTokens.PATIENT_DOMAIN_EVENT_HANDLER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);

      return new PatientDomainEventHandler({
        logger,
        auditService,
        eventBus
      });
    },
    ServiceLifetime.SCOPED
  );
}
