/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */

import {
  OptimizedSupabaseClient,
  OptimizedSupabaseClientConfig,
} from "../../../shared/infrastructure/database/optimized-supabase-client";
import {
  DIContainer,
  ServiceLifetime,
} from "../../../shared/infrastructure/di/container";
import { ScheduleAppointmentCommandHandler } from "../../application/handlers/ScheduleAppointmentCommandHandler";
import { SchedulingApplicationService } from "../../application/services/SchedulingApplicationService";
import { CheckAvailabilityUseCase } from "../../application/use-cases/CheckAvailabilityUseCase";
import { RescheduleAppointmentUseCase } from "../../application/use-cases/RescheduleAppointmentUseCase";
import { ScheduleAppointmentUseCase } from "../../application/use-cases/ScheduleAppointmentUseCase";
import { SupabaseAvailabilityService } from "../external/SupabaseAvailabilityService";
import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
import { SupabaseSchedulingRepository } from "../persistence/SupabaseSchedulingRepository";

// Service Tokens
export const ServiceTokens = {
  SUPABASE_CLIENT: "SupabaseClient",
  SCHEDULING_REPOSITORY: "SchedulingRepository",
  AVAILABILITY_SERVICE: "AvailabilityService",
  EVENT_BUS: "EventBus",
  SCHEDULE_APPOINTMENT_USE_CASE: "ScheduleAppointmentUseCase",
  RESCHEDULE_APPOINTMENT_USE_CASE: "RescheduleAppointmentUseCase",
  CHECK_AVAILABILITY_USE_CASE: "CheckAvailabilityUseCase",
  SCHEDULE_APPOINTMENT_COMMAND_HANDLER: "ScheduleAppointmentCommandHandler",
  SCHEDULING_APPLICATION_SERVICE: "SchedulingApplicationService",
} as const;

export function setupDependencies(container: DIContainer): void {
  // Register Supabase client
  container.register(
    ServiceTokens.SUPABASE_CLIENT,
    () => {
      const config: OptimizedSupabaseClientConfig = {
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        serviceName: "scheduling-service",
        schemaName: "scheduling_schema",
        enableOptimizations: true,
      };
      return new OptimizedSupabaseClient(config);
    },
    ServiceLifetime.SINGLETON
  );

  // Register repositories
  container.register(
    ServiceTokens.SCHEDULING_REPOSITORY,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      return new SupabaseSchedulingRepository(supabaseClient);
    },
    ServiceLifetime.SCOPED
  );

  // Register services
  container.register(
    ServiceTokens.AVAILABILITY_SERVICE,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      return new SupabaseAvailabilityService(supabaseClient);
    },
    ServiceLifetime.SCOPED
  );

  container.register(
    ServiceTokens.EVENT_BUS,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      return new SupabaseEventBus(supabaseClient);
    },
    ServiceLifetime.SCOPED
  );

  // Register use cases
  container.register(
    ServiceTokens.SCHEDULE_APPOINTMENT_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.SCHEDULING_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const availabilityService = container.resolve(
        ServiceTokens.AVAILABILITY_SERVICE
      );
      return new ScheduleAppointmentUseCase(
        repository,
        eventBus,
        availabilityService
      );
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.RESCHEDULE_APPOINTMENT_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.SCHEDULING_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const availabilityService = container.resolve(
        ServiceTokens.AVAILABILITY_SERVICE
      );
      return new RescheduleAppointmentUseCase(
        repository,
        eventBus,
        availabilityService
      );
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.CHECK_AVAILABILITY_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.SCHEDULING_REPOSITORY);
      const availabilityService = container.resolve(
        ServiceTokens.AVAILABILITY_SERVICE
      );
      return new CheckAvailabilityUseCase(repository, availabilityService);
    },
    ServiceLifetime.TRANSIENT
  );

  // Register command handlers
  container.register(
    ServiceTokens.SCHEDULE_APPOINTMENT_COMMAND_HANDLER,
    (container) => {
      const useCase = container.resolve(
        ServiceTokens.SCHEDULE_APPOINTMENT_USE_CASE
      );
      return new ScheduleAppointmentCommandHandler(useCase);
    },
    ServiceLifetime.TRANSIENT
  );

  // Register application service
  container.register(
    ServiceTokens.SCHEDULING_APPLICATION_SERVICE,
    (container) => {
      const repository = container.resolve(ServiceTokens.SCHEDULING_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const availabilityService = container.resolve(
        ServiceTokens.AVAILABILITY_SERVICE
      );
      return new SchedulingApplicationService(
        repository,
        eventBus,
        availabilityService
      );
    },
    ServiceLifetime.SCOPED
  );
}
