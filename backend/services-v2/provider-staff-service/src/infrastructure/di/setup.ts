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
import { RegisterStaffUseCase } from "../../application/use-cases/RegisterStaffUseCase";
import { GetStaffProfileUseCase } from "../../application/use-cases/GetStaffProfileUseCase";
import { StaffCommandHandlers } from "../../application/handlers/StaffCommandHandlers";
import { StaffQueryHandlers } from "../../application/handlers/StaffQueryHandlers";

// Infrastructure Layer
import { SupabaseProviderStaffRepository } from "../repositories/SupabaseProviderStaffRepository";
import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
import { StaffDomainEventHandler } from "../events/StaffDomainEventHandler";

// Service Tokens
export const ServiceTokens = {
  // Infrastructure
  SUPABASE_CLIENT: "SupabaseClient",
  LOGGER: "Logger",
  AUDIT_SERVICE: "AuditService",
  EVENT_BUS: "EventBus",

  // Repositories
  PROVIDER_STAFF_REPOSITORY: "ProviderStaffRepository",

  // Use Cases
  REGISTER_STAFF_USE_CASE: "RegisterStaffUseCase",
  GET_STAFF_PROFILE_USE_CASE: "GetStaffProfileUseCase",

  // Handlers
  STAFF_COMMAND_HANDLERS: "StaffCommandHandlers",
  STAFF_QUERY_HANDLERS: "StaffQueryHandlers",

  // Event Handlers
  STAFF_DOMAIN_EVENT_HANDLER: "StaffDomainEventHandler",
} as const;

export function setupDependencies(container: DIContainer): void {
  // Register infrastructure services
  container.register(
    ServiceTokens.LOGGER,
    () => new ConsoleLogger('provider-staff-service'),
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
        serviceName: "provider-staff-service",
        schemaName: "provider_schema",
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
    ServiceTokens.PROVIDER_STAFF_REPOSITORY,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new SupabaseProviderStaffRepository({
        supabase: supabaseClient,
        logger,
        auditService,
        schema: 'provider_schema',
        tableName: 'staff_profiles'
      });
    },
    ServiceLifetime.SCOPED
  );

  // Register use cases
  container.register(
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

  container.register(
    ServiceTokens.GET_STAFF_PROFILE_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetStaffProfileUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  // Register handlers
  container.register(
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

  container.register(
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
  container.register(
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
}
