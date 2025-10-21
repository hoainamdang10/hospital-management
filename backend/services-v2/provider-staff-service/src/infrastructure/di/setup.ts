/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Provider Staff Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */

import {
  DIContainer,
  ServiceLifetime,
} from "../../../../shared/infrastructure/di/container";
import { ILogger } from "../../application/interfaces/ILogger";
import { IAuditService } from "../../application/interfaces/IAuditService";

// Application Layer
import { RegisterStaffUseCase } from "../../application/use-cases/RegisterStaffUseCase";
import { GetStaffProfileUseCase } from "../../application/use-cases/GetStaffProfileUseCase";
import { UpdateStaffProfileUseCase } from "../../application/use-cases/UpdateStaffProfileUseCase";
import { DeactivateStaffUseCase } from "../../application/use-cases/DeactivateStaffUseCase";
import { SearchStaffUseCase } from "../../application/use-cases/SearchStaffUseCase";
import { GetStaffByDepartmentUseCase } from "../../application/use-cases/GetStaffByDepartmentUseCase";
import { UpdateStaffScheduleUseCase } from "../../application/use-cases/UpdateStaffScheduleUseCase";
import { AddStaffCertificationUseCase } from "../../application/use-cases/AddStaffCertificationUseCase";
import { UpdateStaffAvailabilityUseCase } from "../../application/use-cases/UpdateStaffAvailabilityUseCase";
import { StaffCommandHandlers } from "../../application/handlers/StaffCommandHandlers";
import { StaffQueryHandlers } from "../../application/handlers/StaffQueryHandlers";

// Infrastructure Layer
import { SupabaseProviderStaffRepository } from "../repositories/SupabaseProviderStaffRepository";
import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
import { StaffDomainEventHandler } from "../events/StaffDomainEventHandler";

// Service Tokens
export const ServiceTokens = {
  // Infrastructure
  SUPABASE_URL: "SupabaseUrl",
  SUPABASE_KEY: "SupabaseKey",
  LOGGER: "Logger",
  AUDIT_SERVICE: "AuditService",
  EVENT_BUS: "EventBus",

  // Repositories
  PROVIDER_STAFF_REPOSITORY: "ProviderStaffRepository",

  // Use Cases
  REGISTER_STAFF_USE_CASE: "RegisterStaffUseCase",
  GET_STAFF_PROFILE_USE_CASE: "GetStaffProfileUseCase",
  UPDATE_STAFF_PROFILE_USE_CASE: "UpdateStaffProfileUseCase",
  DEACTIVATE_STAFF_USE_CASE: "DeactivateStaffUseCase",
  SEARCH_STAFF_USE_CASE: "SearchStaffUseCase",
  GET_STAFF_BY_DEPARTMENT_USE_CASE: "GetStaffByDepartmentUseCase",
  UPDATE_STAFF_SCHEDULE_USE_CASE: "UpdateStaffScheduleUseCase",
  ADD_STAFF_CERTIFICATION_USE_CASE: "AddStaffCertificationUseCase",
  UPDATE_STAFF_AVAILABILITY_USE_CASE: "UpdateStaffAvailabilityUseCase",

  // Handlers
  STAFF_COMMAND_HANDLERS: "StaffCommandHandlers",
  STAFF_QUERY_HANDLERS: "StaffQueryHandlers",

  // Event Handlers
  STAFF_DOMAIN_EVENT_HANDLER: "StaffDomainEventHandler",
} as const;

export function setupDependencies(): DIContainer {
  const container = new DIContainer({
    enableHealthcareCompliance: true,
    enableHealthChecks: true,
    enableMetrics: true
  });

  // Register infrastructure services
  container.registerFactory(
    ServiceTokens.LOGGER,
    () => ({
      debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta),
      info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
      warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta),
      error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
      fatal: (message: string, meta?: any) => console.error(`[FATAL] ${message}`, meta),
    }),
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.AUDIT_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      return {
        logDataAccess: async (entry: any) => {
          logger.info('AUDIT: Data Access', entry);
        },
        logDataModification: async (entry: any) => {
          logger.info('AUDIT: Data Modification', entry);
        },
        logSecurityEvent: async (entry: any) => {
          logger.warn('AUDIT: Security Event', entry);
        },
      };
    },
    ServiceLifetime.SINGLETON
  );

  // Register Supabase URL and Key
  container.registerFactory(
    ServiceTokens.SUPABASE_URL,
    () => process.env.SUPABASE_URL || "",
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.SUPABASE_KEY,
    () => process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    ServiceLifetime.SINGLETON
  );

  // Register event bus
  container.registerFactory(
    ServiceTokens.EVENT_BUS,
    (container) => {
      const supabaseUrl = container.resolve(ServiceTokens.SUPABASE_URL);
      const supabaseKey = container.resolve(ServiceTokens.SUPABASE_KEY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new SupabaseEventBus(
        supabaseUrl,
        supabaseKey,
        logger,
        'provider_schema'
      );
    },
    ServiceLifetime.SCOPED
  );

  // Register repositories
  container.registerFactory(
    ServiceTokens.PROVIDER_STAFF_REPOSITORY,
    (container) => {
      const supabaseUrl = container.resolve(ServiceTokens.SUPABASE_URL);
      const supabaseKey = container.resolve(ServiceTokens.SUPABASE_KEY);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new SupabaseProviderStaffRepository(
        supabaseUrl,
        supabaseKey,
        logger,
        auditService,
        'provider_schema',
        'staff_profiles'
      );
    },
    ServiceLifetime.SCOPED
  );

  // Register use cases
  container.registerFactory(
    ServiceTokens.REGISTER_STAFF_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new RegisterStaffUseCase(
        staffRepository,
        eventBus,
        logger
      );
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.GET_STAFF_PROFILE_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetStaffProfileUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.UPDATE_STAFF_PROFILE_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new UpdateStaffProfileUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.DEACTIVATE_STAFF_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new DeactivateStaffUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.SEARCH_STAFF_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new SearchStaffUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.GET_STAFF_BY_DEPARTMENT_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetStaffByDepartmentUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.UPDATE_STAFF_SCHEDULE_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new UpdateStaffScheduleUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.ADD_STAFF_CERTIFICATION_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new AddStaffCertificationUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.UPDATE_STAFF_AVAILABILITY_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new UpdateStaffAvailabilityUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  // Register handlers
  container.registerFactory(
    ServiceTokens.STAFF_COMMAND_HANDLERS,
    (container) => {
      const registerStaffUseCase = container.resolve(ServiceTokens.REGISTER_STAFF_USE_CASE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new StaffCommandHandlers(
        registerStaffUseCase,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  container.registerFactory(
    ServiceTokens.STAFF_QUERY_HANDLERS,
    (container) => {
      const getStaffProfileUseCase = container.resolve(ServiceTokens.GET_STAFF_PROFILE_USE_CASE);
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new StaffQueryHandlers(
        getStaffProfileUseCase,
        staffRepository,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  // Register event handlers
  container.registerFactory(
    ServiceTokens.STAFF_DOMAIN_EVENT_HANDLER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);

      return new StaffDomainEventHandler({
        logger,
        auditService,
        eventBus
      });
    },
    ServiceLifetime.SCOPED
  );

  return container;
}
