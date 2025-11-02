/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Notifications Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */

import {
  OptimizedSupabaseClient,
  OptimizedSupabaseClientConfig,
} from "@shared/infrastructure/database/optimized-supabase-client";
import {
  DIContainer,
  ServiceLifetime,
} from "@shared/infrastructure/di/container";
// import { ILogger } from "@shared/infrastructure/logging/logger.interface";
// import { IAuditService } from "@shared/application/services/audit.service.interface";
// import { ConsoleLogger } from "@shared/infrastructure/logging/console-logger";
// import { AuditService } from "@shared/infrastructure/services/audit.service";

// Application Layer
import { NotificationApplicationService } from "../../application/services/NotificationApplicationService";
// import { ScheduleNotificationUseCase } from "../../application/use-cases/ScheduleNotificationUseCase";
import { SendNotificationUseCase } from "../../application/use-cases/SendNotificationUseCase";
// import { ProcessNotificationQueueUseCase } from "../../application/use-cases/ProcessNotificationQueueUseCase";
// import { NotificationCommandHandlers } from "../../application/handlers/NotificationCommandHandlers";
// import { NotificationQueryHandlers } from "../../application/handlers/NotificationQueryHandlers";

// Infrastructure Layer
import { SupabaseNotificationRepository } from "../persistence/SupabaseNotificationRepository";
import { SupabaseInboxRepository } from "../persistence/SupabaseInboxRepository";
import { MultiChannelDeliveryService } from "../delivery/MultiChannelDeliveryService";
import { VietnameseTemplateService } from "../templates/VietnameseTemplateService";
// import { RealTimeNotificationService } from "../realtime/RealTimeNotificationService";
// import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
import { NotificationEventHandlers } from "../events/NotificationEventHandlers";

// Service Tokens
export const ServiceTokens = {
  // Infrastructure
  SUPABASE_CLIENT: "SupabaseClient",
  LOGGER: "Logger",
  AUDIT_SERVICE: "AuditService",
  EVENT_BUS: "EventBus",

  // Repositories
  NOTIFICATION_REPOSITORY: "NotificationRepository",
  INBOX_REPOSITORY: "InboxRepository",

  // External Services
  DELIVERY_SERVICE: "DeliveryService",
  TEMPLATE_SERVICE: "TemplateService",
  REALTIME_SERVICE: "RealTimeService",

  // Use Cases
  SCHEDULE_NOTIFICATION_USE_CASE: "ScheduleNotificationUseCase",
  SEND_NOTIFICATION_USE_CASE: "SendNotificationUseCase",
  PROCESS_NOTIFICATION_QUEUE_USE_CASE: "ProcessNotificationQueueUseCase",

  // Handlers
  NOTIFICATION_COMMAND_HANDLERS: "NotificationCommandHandlers",
  NOTIFICATION_QUERY_HANDLERS: "NotificationQueryHandlers",

  // Event Handlers
  NOTIFICATION_EVENT_HANDLERS: "NotificationEventHandlers",

  // Application Services
  NOTIFICATION_APPLICATION_SERVICE: "NotificationApplicationService",
} as const;

export function setupDependencies(container: DIContainer): void {
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

  // Comment out AuditService - not needed for now
  // container.registerFactory(
  //   ServiceTokens.AUDIT_SERVICE,
  //   (container) => {
  //     const logger = container.resolve(ServiceTokens.LOGGER);
  //     return new AuditService({ logger });
  //   },
  //   ServiceLifetime.SINGLETON
  // );

  // Register Supabase client
  container.registerFactory(
    ServiceTokens.SUPABASE_CLIENT,
    () => {
      const config: OptimizedSupabaseClientConfig = {
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        serviceName: "notifications-service",
        schemaName: "notifications_schema",
        enableOptimizations: true,
      };
      return new OptimizedSupabaseClient(config);
    },
    ServiceLifetime.SINGLETON
  );

  // Comment out EventBus - not needed for now
  // container.registerFactory(
  //   ServiceTokens.EVENT_BUS,
  //   (container) => {
  //     const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
  //     const logger = container.resolve(ServiceTokens.LOGGER);
  //     return new SupabaseEventBus({ supabase: supabaseClient, logger });
  //   },
  //   ServiceLifetime.SCOPED
  // );

  // Register repositories
  container.registerFactory(
    ServiceTokens.NOTIFICATION_REPOSITORY,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      return new SupabaseNotificationRepository(supabaseClient);
    },
    ServiceLifetime.SCOPED
  );

  container.registerFactory(
    ServiceTokens.INBOX_REPOSITORY,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      return new SupabaseInboxRepository(supabaseClient);
    },
    ServiceLifetime.SCOPED
  );

  // Register external services
  container.registerFactory(
    ServiceTokens.DELIVERY_SERVICE,
    () => {
      return new MultiChannelDeliveryService();
    },
    ServiceLifetime.SINGLETON
  );

  container.registerFactory(
    ServiceTokens.TEMPLATE_SERVICE,
    (container) => {
      const templateRepository = container.resolve(ServiceTokens.TEMPLATE_REPOSITORY);
      return new VietnameseTemplateService(templateRepository);
    },
    ServiceLifetime.SINGLETON
  );

  // Comment out RealTimeService - not needed for now
  // container.registerFactory(
  //   ServiceTokens.REALTIME_SERVICE,
  //   (container) => {
  //     const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
  //     const logger = container.resolve(ServiceTokens.LOGGER);
  //
  //     return new RealTimeNotificationService({
  //       supabase: supabaseClient,
  //       logger,
  //       channelName: 'notifications'
  //     });
  //   },
  //   ServiceLifetime.SINGLETON
  // );

  // Register use cases
  // Comment out ScheduleNotificationUseCase - not needed (use Scheduler Service instead)
  // container.registerFactory(
  //   ServiceTokens.SCHEDULE_NOTIFICATION_USE_CASE,
  //   (container) => {
  //     const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
  //     const templateService = container.resolve(ServiceTokens.TEMPLATE_SERVICE);
  //     const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
  //     const logger = container.resolve(ServiceTokens.LOGGER);
  //
  //     return new ScheduleNotificationUseCase(
  //       notificationRepository,
  //       templateService,
  //       eventBus,
  //       logger
  //     );
  //   },
  //   ServiceLifetime.TRANSIENT
  // );

  container.registerFactory(
    ServiceTokens.SEND_NOTIFICATION_USE_CASE,
    (container) => {
      const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
      const templateService = container.resolve(ServiceTokens.TEMPLATE_SERVICE);
      const deliveryService = container.resolve(ServiceTokens.DELIVERY_SERVICE);

      return new SendNotificationUseCase(
        notificationRepository,
        templateService,
        deliveryService
      );
    },
    ServiceLifetime.TRANSIENT
  );

  // Comment out ProcessNotificationQueueUseCase - not needed
  // container.registerFactory(
  //   ServiceTokens.PROCESS_NOTIFICATION_QUEUE_USE_CASE,
  //   (container) => {
  //     const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
  //     const sendNotificationUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);
  //     const logger = container.resolve(ServiceTokens.LOGGER);
  //
  //     return new ProcessNotificationQueueUseCase(
  //       notificationRepository,
  //       sendNotificationUseCase,
  //       logger
  //     );
  //   },
  //   ServiceLifetime.TRANSIENT
  // );

  // Comment out handlers - not needed for now
  // container.registerFactory(
  //   ServiceTokens.NOTIFICATION_COMMAND_HANDLERS,
  //   (container) => {
  //     const scheduleUseCase = container.resolve(ServiceTokens.SCHEDULE_NOTIFICATION_USE_CASE);
  //     const sendUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);
  //     const processQueueUseCase = container.resolve(ServiceTokens.PROCESS_NOTIFICATION_QUEUE_USE_CASE);
  //     const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
  //     const logger = container.resolve(ServiceTokens.LOGGER);
  //
  //     return new NotificationCommandHandlers(
  //       scheduleUseCase,
  //       sendUseCase,
  //       processQueueUseCase,
  //       notificationRepository,
  //       logger
  //     );
  //   },
  //   ServiceLifetime.SCOPED
  // );

  // container.registerFactory(
  //   ServiceTokens.NOTIFICATION_QUERY_HANDLERS,
  //   (container) => {
  //     const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
  //     const logger = container.resolve(ServiceTokens.LOGGER);
  //
  //     return new NotificationQueryHandlers(
  //       notificationRepository,
  //       logger
  //     );
  //   },
  //   ServiceLifetime.SCOPED
  // );

  // Register application services
  container.registerFactory(
    ServiceTokens.NOTIFICATION_APPLICATION_SERVICE,
    (container) => {
      const sendUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);

      return new NotificationApplicationService(sendUseCase);
    },
    ServiceLifetime.SCOPED
  );

  // Register event handlers (after application service to avoid circular dependency)
  container.registerFactory(
    ServiceTokens.NOTIFICATION_EVENT_HANDLERS,
    (container) => {
      const notificationService = container.resolve(ServiceTokens.NOTIFICATION_APPLICATION_SERVICE);
      const inboxRepo = container.resolve(ServiceTokens.INBOX_REPOSITORY);
      const sendUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);

      return new NotificationEventHandlers(
        notificationService,
        inboxRepo,
        sendUseCase
      );
    },
    ServiceLifetime.SCOPED
  );
}
