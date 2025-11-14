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
} from "@shared/infrastructure/di/container";
import { createClient } from "@supabase/supabase-js";
import { ILogger } from "../../application/interfaces/ILogger";

// Application Layer
import { RegisterStaffUseCase } from "../../application/use-cases/RegisterStaffUseCase";
import { GetStaffProfileUseCase } from "../../application/use-cases/GetStaffProfileUseCase";
import { UpdateStaffProfileUseCase } from "../../application/use-cases/UpdateStaffProfileUseCase";
import { DeactivateStaffUseCase } from "../../application/use-cases/DeactivateStaffUseCase";
import { SearchStaffUseCase } from "../../application/use-cases/SearchStaffUseCase";
import { GetStaffByDepartmentUseCase } from "../../application/use-cases/GetStaffByDepartmentUseCase";
import { UpdateStaffScheduleUseCase } from "../../application/use-cases/UpdateStaffScheduleUseCase";
import { AddStaffCertificationUseCase } from "../../application/use-cases/AddStaffCertificationUseCase";
import { UpdateStaffDepartmentUseCase } from "../../application/use-cases/UpdateStaffDepartmentUseCase";
import { UpdateStaffPerformanceUseCase } from "../../application/use-cases/UpdateStaffPerformanceUseCase";
import { AssignStaffToDepartmentUseCase } from "../../application/use-cases/AssignStaffToDepartmentUseCase";
import { SetDepartmentHeadUseCase } from "../../application/use-cases/SetDepartmentHeadUseCase";
import { AddStaffCredentialUseCase } from "../../application/use-cases/AddStaffCredentialUseCase";
import { RemoveStaffCredentialUseCase } from "../../application/use-cases/RemoveStaffCredentialUseCase";
import { RenewStaffCredentialUseCase } from "../../application/use-cases/RenewStaffCredentialUseCase";
import { GetExpiringCredentialsUseCase } from "../../application/use-cases/GetExpiringCredentialsUseCase";
import { ActivateStaffUseCase } from "../../application/use-cases/ActivateStaffUseCase";
import { SuspendStaffUseCase } from "../../application/use-cases/SuspendStaffUseCase";
import { ReactivateStaffUseCase } from "../../application/use-cases/ReactivateStaffUseCase";
import { TerminateStaffUseCase } from "../../application/use-cases/TerminateStaffUseCase";
import { UpdateEmploymentStatusUseCase } from "../../application/use-cases/UpdateEmploymentStatusUseCase";
// REMOVED: Availability use cases - Belongs to Scheduling/Appointment Service (bounded context violation)
import { GetStaffSpecializationsUseCase } from "../../application/use-cases/GetStaffSpecializationsUseCase";
import { AddStaffSpecializationUseCase } from "../../application/use-cases/AddStaffSpecializationUseCase";
import { RemoveStaffSpecializationUseCase } from "../../application/use-cases/RemoveStaffSpecializationUseCase";
import { StaffCommandHandlers } from "../../application/handlers/StaffCommandHandlers";
import { StaffQueryHandlers } from "../../application/handlers/StaffQueryHandlers";

// Infrastructure Layer
import { SupabaseProviderStaffRepository } from "../repositories/SupabaseProviderStaffRepository";
import { HybridEventBus } from "../events/HybridEventBus";
import { StaffDomainEventHandler } from "../events/StaffDomainEventHandler";
import { DepartmentServiceClient } from "../clients/DepartmentServiceClient";
import { UserCreatedEventHandler } from "../events/UserCreatedEventHandler";
import { UserDeactivatedEventHandler } from "../events/UserDeactivatedEventHandler";
import { UserRoleChangedEventHandler } from "../events/UserRoleChangedEventHandler";
import { IdentityEventConsumer } from "../events/IdentityEventConsumer";
import { PatientEventConsumer } from "../events/PatientEventConsumer";
import { EnhancedDepartmentEventConsumer } from "../events/EnhancedDepartmentEventConsumer";
// TODO: Fix and re-enable other event consumers when needed
import { ReviewEventConsumer } from "../events/ReviewEventConsumer";
// // TODO: Re-enable SchedulingEventConsumer when proper bounded context is established
// import { SchedulingEventConsumer } from "../events/SchedulingEventConsumer";
import { AppointmentScheduledEventHandler } from "../events/AppointmentScheduledEventHandler";
import { AppointmentCancelledEventHandler } from "../events/AppointmentCancelledEventHandler";
import { AppointmentCompletedEventHandler } from "../events/AppointmentCompletedEventHandler";
import { PatientRegisteredEventHandler } from "../events/PatientRegisteredEventHandler";
import { PatientUpdatedEventHandler } from "../events/PatientUpdatedEventHandler";
import { ReviewEventHandler } from "../events/ReviewEventHandler";
import { BillingEventHandler } from "../events/BillingEventHandler";
import { StaffReadModelRepository } from "../repositories/StaffReadModelRepository";

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

  // External Service Clients
  DEPARTMENT_SERVICE_CLIENT: "DepartmentServiceClient",

  // Use Cases
  REGISTER_STAFF_USE_CASE: "RegisterStaffUseCase",
  GET_STAFF_PROFILE_USE_CASE: "GetStaffProfileUseCase",
  UPDATE_STAFF_PROFILE_USE_CASE: "UpdateStaffProfileUseCase",
  DEACTIVATE_STAFF_USE_CASE: "DeactivateStaffUseCase",
  SEARCH_STAFF_USE_CASE: "SearchStaffUseCase",
  GET_STAFF_BY_DEPARTMENT_USE_CASE: "GetStaffByDepartmentUseCase",
  UPDATE_STAFF_SCHEDULE_USE_CASE: "UpdateStaffScheduleUseCase",
  UPDATE_STAFF_DEPARTMENT_USE_CASE: "UpdateStaffDepartmentUseCase",
  UPDATE_STAFF_PERFORMANCE_USE_CASE: "UpdateStaffPerformanceUseCase",
  ASSIGN_STAFF_TO_DEPARTMENT_USE_CASE: "AssignStaffToDepartmentUseCase",
  SET_DEPARTMENT_HEAD_USE_CASE: "SetDepartmentHeadUseCase",
  ADD_STAFF_CERTIFICATION_USE_CASE: "AddStaffCertificationUseCase",
  ADD_STAFF_CREDENTIAL_USE_CASE: "AddStaffCredentialUseCase",
  REMOVE_STAFF_CREDENTIAL_USE_CASE: "RemoveStaffCredentialUseCase",
  RENEW_STAFF_CREDENTIAL_USE_CASE: "RenewStaffCredentialUseCase",
  GET_EXPIRING_CREDENTIALS_USE_CASE: "GetExpiringCredentialsUseCase",
  ACTIVATE_STAFF_USE_CASE: "ActivateStaffUseCase",
  SUSPEND_STAFF_USE_CASE: "SuspendStaffUseCase",
  REACTIVATE_STAFF_USE_CASE: "ReactivateStaffUseCase",
  TERMINATE_STAFF_USE_CASE: "TerminateStaffUseCase",
  UPDATE_EMPLOYMENT_STATUS_USE_CASE: "UpdateEmploymentStatusUseCase",
  // REMOVED: Availability use case tokens - Belongs to Scheduling/Appointment Service
  GET_STAFF_SPECIALIZATIONS_USE_CASE: "GetStaffSpecializationsUseCase",
  ADD_STAFF_SPECIALIZATION_USE_CASE: "AddStaffSpecializationUseCase",
  REMOVE_STAFF_SPECIALIZATION_USE_CASE: "RemoveStaffSpecializationUseCase",

  // Handlers
  STAFF_COMMAND_HANDLERS: "StaffCommandHandlers",
  STAFF_QUERY_HANDLERS: "StaffQueryHandlers",

  // Event Handlers
  STAFF_DOMAIN_EVENT_HANDLER: "StaffDomainEventHandler",
  USER_CREATED_EVENT_HANDLER: "UserCreatedEventHandler",
  USER_DEACTIVATED_EVENT_HANDLER: "UserDeactivatedEventHandler",
  USER_ROLE_CHANGED_EVENT_HANDLER: "UserRoleChangedEventHandler",
  IDENTITY_EVENT_CONSUMER: "IdentityEventConsumer",
  
  // Enhanced Event Consumers
  ENHANCED_DEPARTMENT_EVENT_CONSUMER: "EnhancedDepartmentEventConsumer",
  REVIEW_EVENT_CONSUMER: "ReviewEventConsumer",
  // SCHEDULING_EVENT_CONSUMER: "SchedulingEventConsumer", // TODO: Re-enable when needed
  
  // Appointments Event Handlers
  APPOINTMENT_SCHEDULED_EVENT_HANDLER: "AppointmentScheduledEventHandler",
  APPOINTMENT_CANCELLED_EVENT_HANDLER: "AppointmentCancelledEventHandler",
  APPOINTMENT_COMPLETED_EVENT_HANDLER: "AppointmentCompletedEventHandler",
  
  // Patient Event Handlers
  PATIENT_REGISTERED_EVENT_HANDLER: "PatientRegisteredEventHandler",
  PATIENT_UPDATED_EVENT_HANDLER: "PatientUpdatedEventHandler",
  PATIENT_EVENT_CONSUMER: "PatientEventConsumer",
  
  // Review Event Handlers
  REVIEW_EVENT_HANDLER: "ReviewEventHandler",
  
  // Billing Event Handlers
  BILLING_EVENT_HANDLER: "BillingEventHandler",
  
  // Read Model Repository
  STAFF_READ_MODEL_REPOSITORY: "StaffReadModelRepository",
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
      debug: (message: string, meta?: Record<string, unknown>) => {
        // Logger implementation - replace console in production
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[DEBUG] ${message}`, meta);
        }
      },
      info: (message: string, meta?: Record<string, unknown>) => {
        // Logger implementation - replace console in production
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[INFO] ${message}`, meta);
        }
      },
      warn: (message: string, meta?: Record<string, unknown>) => console.warn(`[WARN] ${message}`, meta),
      error: (message: string, meta?: Record<string, unknown>) => console.error(`[ERROR] ${message}`, meta),
      fatal: (message: string, meta?: Record<string, unknown>) => console.error(`[FATAL] ${message}`, meta),
    }),
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.AUDIT_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      return {
        logDataAccess: async (entry: Record<string, unknown>) => {
          logger.info('AUDIT: Data Access', entry);
        },
        logDataModification: async (entry: Record<string, unknown>) => {
          logger.info('AUDIT: Data Modification', entry);
        },
        logSecurityEvent: async (entry: Record<string, unknown>) => {
          logger.info('AUDIT: Security Event', entry);
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

  // Register event bus (Hybrid: Supabase + RabbitMQ)
  container.registerFactory(
    ServiceTokens.EVENT_BUS,
    (container) => {
      const supabaseUrl = container.resolve(ServiceTokens.SUPABASE_URL);
      const supabaseKey = container.resolve(ServiceTokens.SUPABASE_KEY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new HybridEventBus({
        supabaseUrl,
        supabaseKey,
        schema: 'provider_schema',
        rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
        rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
        rabbitmqExchangeType: (process.env.RABBITMQ_EXCHANGE_TYPE as 'topic' | 'direct' | 'fanout') || 'topic',
        serviceName: 'provider-staff-service',
        logger
      });
    },
    ServiceLifetime.SINGLETON
  );

  // Register external service clients
  container.registerFactory(
    ServiceTokens.DEPARTMENT_SERVICE_CLIENT,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new DepartmentServiceClient(
        {
          baseUrl: process.env.DEPARTMENT_SERVICE_URL || 'http://localhost:3025',
          timeout: parseInt(process.env.DEPARTMENT_SERVICE_TIMEOUT || '5000'),
          retryAttempts: 3,
          retryDelay: 1000
        },
        logger
      );
    },
    ServiceLifetime.SINGLETON
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
    ServiceLifetime.SINGLETON
  );

  // Register StaffReadModel Repository
  container.registerFactory(
    ServiceTokens.STAFF_READ_MODEL_REPOSITORY,
    (container) => {
      const supabaseUrl = container.resolve(ServiceTokens.SUPABASE_URL);
      const supabaseKey = container.resolve(ServiceTokens.SUPABASE_KEY);
      const logger = container.resolve(ServiceTokens.LOGGER);
      
      const supabaseClient = createClient(supabaseUrl, supabaseKey);

      return new StaffReadModelRepository(supabaseClient, logger);
    },
    ServiceLifetime.SINGLETON
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
    ServiceTokens.UPDATE_STAFF_DEPARTMENT_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new UpdateStaffDepartmentUseCase(
        staffRepository,
        auditService,
        eventBus,
        logger
      );
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.UPDATE_STAFF_PERFORMANCE_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new UpdateStaffPerformanceUseCase(
        staffRepository,
        auditService,
        eventBus,
        logger
      );
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

  // REMOVED: UPDATE_STAFF_AVAILABILITY_USE_CASE registration - Belongs to Scheduling/Appointment Service

  container.registerFactory(
    ServiceTokens.ASSIGN_STAFF_TO_DEPARTMENT_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new AssignStaffToDepartmentUseCase(
        staffRepository,
        logger,
        auditService
      );
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.SET_DEPARTMENT_HEAD_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new SetDepartmentHeadUseCase(
        staffRepository,
        logger,
        auditService
      );
    },
    ServiceLifetime.TRANSIENT
  );

  // Register credential management use cases
  container.registerFactory(
    ServiceTokens.ADD_STAFF_CREDENTIAL_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new AddStaffCredentialUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.REMOVE_STAFF_CREDENTIAL_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new RemoveStaffCredentialUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.RENEW_STAFF_CREDENTIAL_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new RenewStaffCredentialUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.GET_EXPIRING_CREDENTIALS_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetExpiringCredentialsUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  // Register employment status management use cases
  container.registerFactory(
    ServiceTokens.ACTIVATE_STAFF_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new ActivateStaffUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.SUSPEND_STAFF_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new SuspendStaffUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.REACTIVATE_STAFF_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new ReactivateStaffUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.TERMINATE_STAFF_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new TerminateStaffUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.UPDATE_EMPLOYMENT_STATUS_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new UpdateEmploymentStatusUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  // REMOVED: Availability Management Use Cases - Belongs to Scheduling/Appointment Service (bounded context violation)
  // - GET_STAFF_AVAILABILITY_USE_CASE
  // - ADD_STAFF_AVAILABILITY_USE_CASE
  // - REMOVE_STAFF_AVAILABILITY_USE_CASE

  // Specialization Management Use Cases
  container.registerFactory(
    ServiceTokens.GET_STAFF_SPECIALIZATIONS_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetStaffSpecializationsUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.ADD_STAFF_SPECIALIZATION_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new AddStaffSpecializationUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.registerFactory(
    ServiceTokens.REMOVE_STAFF_SPECIALIZATION_USE_CASE,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new RemoveStaffSpecializationUseCase(staffRepository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  // Register handlers
  container.registerFactory(
    ServiceTokens.STAFF_COMMAND_HANDLERS,
    (container) => {
      const registerStaffUseCase = container.resolve(ServiceTokens.REGISTER_STAFF_USE_CASE);
      const updateStaffProfileUseCase = container.resolve(ServiceTokens.UPDATE_STAFF_PROFILE_USE_CASE);
      const activateStaffUseCase = container.resolve(ServiceTokens.ACTIVATE_STAFF_USE_CASE);
      const suspendStaffUseCase = container.resolve(ServiceTokens.SUSPEND_STAFF_USE_CASE);
      const terminateStaffUseCase = container.resolve(ServiceTokens.TERMINATE_STAFF_USE_CASE);
      const addStaffCredentialUseCase = container.resolve(ServiceTokens.ADD_STAFF_CREDENTIAL_USE_CASE);
      const assignStaffToDepartmentUseCase = container.resolve(ServiceTokens.ASSIGN_STAFF_TO_DEPARTMENT_USE_CASE);
      const updateStaffScheduleUseCase = container.resolve(ServiceTokens.UPDATE_STAFF_SCHEDULE_USE_CASE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new StaffCommandHandlers(
        registerStaffUseCase,
        updateStaffProfileUseCase,
        activateStaffUseCase,
        suspendStaffUseCase,
        terminateStaffUseCase,
        addStaffCredentialUseCase,
        assignStaffToDepartmentUseCase,
        updateStaffScheduleUseCase,
        logger
      );
    },
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.STAFF_QUERY_HANDLERS,
    (container) => {
      const getStaffProfileUseCase = container.resolve(ServiceTokens.GET_STAFF_PROFILE_USE_CASE);
      const searchStaffUseCase = container.resolve(ServiceTokens.SEARCH_STAFF_USE_CASE);
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new StaffQueryHandlers(
        getStaffProfileUseCase,
        searchStaffUseCase,
        staffRepository,
        logger
      );
    },
    ServiceLifetime.SINGLETON
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
    ServiceLifetime.SINGLETON
  );

  // Register Identity Service event handlers
  container.registerFactory(
    ServiceTokens.USER_CREATED_EVENT_HANDLER,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new UserCreatedEventHandler(
        staffRepository,
        logger,
        auditService
      );
    },
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.USER_DEACTIVATED_EVENT_HANDLER,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new UserDeactivatedEventHandler(
        staffRepository,
        logger,
        auditService
      );
    },
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.USER_ROLE_CHANGED_EVENT_HANDLER,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new UserRoleChangedEventHandler(
        staffRepository,
        logger,
        auditService
      );
    },
    ServiceLifetime.SINGLETON
  );

  // Register Identity Event Consumer
  container.registerFactory(
    ServiceTokens.IDENTITY_EVENT_CONSUMER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const userCreatedHandler = container.resolve(ServiceTokens.USER_CREATED_EVENT_HANDLER);
      const userDeactivatedHandler = container.resolve(ServiceTokens.USER_DEACTIVATED_EVENT_HANDLER);
      const userRoleChangedHandler = container.resolve(ServiceTokens.USER_ROLE_CHANGED_EVENT_HANDLER);

      const config = {
        rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
        exchange: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
        queueName: 'provider-staff-service.identity-events',
        routingKeys: ['user.created.event', 'user.deactivated.event', 'user.role.changed.event'],
        prefetchCount: 1,
        retryAttempts: 3,
        retryDelayMs: 1000
      };

      return new IdentityEventConsumer(
        config,
        logger,
        userCreatedHandler,
        userDeactivatedHandler,
        userRoleChangedHandler
      );
    },
    ServiceLifetime.SINGLETON
  );

  // Register Appointments Service event handlers
  container.registerFactory(
    ServiceTokens.APPOINTMENT_SCHEDULED_EVENT_HANDLER,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new AppointmentScheduledEventHandler(
        staffRepository,
        logger
      );
    },
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.APPOINTMENT_CANCELLED_EVENT_HANDLER,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new AppointmentCancelledEventHandler(
        staffRepository,
        logger
      );
    },
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.APPOINTMENT_COMPLETED_EVENT_HANDLER,
    (container) => {
      const staffRepository = container.resolve(ServiceTokens.PROVIDER_STAFF_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new AppointmentCompletedEventHandler(
        staffRepository,
        logger
      );
    },
    ServiceLifetime.SINGLETON
  );

  // Register Patient Service event handlers
  container.registerFactory(
    ServiceTokens.PATIENT_REGISTERED_EVENT_HANDLER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new PatientRegisteredEventHandler(
        logger
      );
    },
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.PATIENT_UPDATED_EVENT_HANDLER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new PatientUpdatedEventHandler(
        logger
      );
    },
    ServiceLifetime.SINGLETON
  );

  // Register Patient Event Consumer
  container.registerFactory(
    ServiceTokens.PATIENT_EVENT_CONSUMER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const patientRegisteredHandler = container.resolve(ServiceTokens.PATIENT_REGISTERED_EVENT_HANDLER);
      const patientUpdatedHandler = container.resolve(ServiceTokens.PATIENT_UPDATED_EVENT_HANDLER);

      const config = {
        rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
        exchange: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
        queueName: 'provider-staff-service.patient-events',
        routingKeys: ['patient.registered', 'patient.updated', 'patient.deactivated'],
        prefetchCount: 10,
        retryAttempts: 3,
        retryDelayMs: 1000
      };

      return new PatientEventConsumer(
        config,
        logger,
        patientRegisteredHandler,
        patientUpdatedHandler
      );
    },
    ServiceLifetime.SINGLETON
  );

  // Register Review Event Handler
  container.registerFactory(
    ServiceTokens.REVIEW_EVENT_HANDLER,
    (container) => {
      const readModelRepository = container.resolve(ServiceTokens.STAFF_READ_MODEL_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new ReviewEventHandler(
        readModelRepository,
        logger,
        auditService
      );
    },
    ServiceLifetime.SINGLETON
  );

  // Register Billing Event Handler
  container.registerFactory(
    ServiceTokens.BILLING_EVENT_HANDLER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new BillingEventHandler(
        logger,
        auditService
      );
    },
    ServiceLifetime.SINGLETON
  );

  // Register Enhanced Department Event Consumer
  container.registerFactory(
    ServiceTokens.ENHANCED_DEPARTMENT_EVENT_CONSUMER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const getStaffProfileUseCase = container.resolve('GetStaffProfileUseCase');
      const setDepartmentHeadUseCase = container.resolve('SetDepartmentHeadUseCase');
      const updateStaffDepartmentUseCase = container.resolve('UpdateStaffDepartmentUseCase');

      const config = {
        rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
        queueName: 'provider-staff-service.department-events',
        exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
        routingKeys: [
          'department.staff.assigned',
          'department.staff.removed', 
          'department.head.assigned',
          'department.staff.transferred'
        ],
        prefetchCount: 10,
        retryAttempts: 3,
        retryDelayMs: 1000
      };

      return new EnhancedDepartmentEventConsumer(
        config,
        logger,
        getStaffProfileUseCase,
        setDepartmentHeadUseCase,
        updateStaffDepartmentUseCase
      );
    },
    ServiceLifetime.SINGLETON
  );

  // TODO: Fix other event consumers later - focus on core functionality first
  const logger = container.resolve(ServiceTokens.LOGGER) as ILogger;
  logger.info('EnhancedDepartmentEventConsumer registered successfully');

  // TODO: Re-enable SchedulingEventConsumer when scheduling events are properly defined

  // Register Review Event Consumer
  container.registerFactory(
    ServiceTokens.REVIEW_EVENT_CONSUMER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const getStaffProfileUseCase = container.resolve('GetStaffProfileUseCase');
      const updateStaffPerformanceUseCase = container.resolve('UpdateStaffPerformanceUseCase');

      const config = {
        rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
        queueName: 'provider-staff-service.review-events',
        exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
        routingKeys: [
          'review.staff.created',
          'review.staff.updated',
          'review.staff.deleted'
        ],
        prefetchCount: 10,
        retryAttempts: 3,
        retryDelayMs: 1000
      };

      return new ReviewEventConsumer(
        config,
        logger,
        getStaffProfileUseCase,
        updateStaffPerformanceUseCase
      );
    },
    ServiceLifetime.SINGLETON
  );

  logger.info('Provider Staff Service DI setup completed successfully');

  return container;
}
