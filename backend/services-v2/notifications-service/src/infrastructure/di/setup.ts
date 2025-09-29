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
import { NotificationApplicationService } from "../../application/services/NotificationApplicationService";
import { ScheduleNotificationUseCase } from "../../application/use-cases/ScheduleNotificationUseCase";
import { SendNotificationUseCase } from "../../application/use-cases/SendNotificationUseCase";
import { ProcessNotificationQueueUseCase } from "../../application/use-cases/ProcessNotificationQueueUseCase";
import { NotificationCommandHandlers } from "../../application/handlers/NotificationCommandHandlers";
import { NotificationQueryHandlers } from "../../application/handlers/NotificationQueryHandlers";

// Infrastructure Layer
import { SupabaseNotificationRepository } from "../persistence/SupabaseNotificationRepository";
import { MultiChannelDeliveryService } from "../delivery/MultiChannelDeliveryService";
import { VietnameseTemplateService } from "../templates/VietnameseTemplateService";
import { RealTimeNotificationService } from "../realtime/RealTimeNotificationService";
import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
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
  container.register(
    ServiceTokens.LOGGER,
    () => new ConsoleLogger('notifications-service'),
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
        serviceName: "notifications-service",
        schemaName: "notifications_schema",
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
    ServiceTokens.NOTIFICATION_REPOSITORY,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new SupabaseNotificationRepository({
        supabase: supabaseClient,
        logger,
        auditService,
        schema: 'notifications_schema',
        tableName: 'notifications'
      });
    },
    ServiceLifetime.SCOPED
  );

  // Register external services
  container.register(
    ServiceTokens.DELIVERY_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new MultiChannelDeliveryService({
        logger,
        auditService,
        emailConfig: {
          provider: process.env.EMAIL_PROVIDER || 'smtp',
          smtpHost: process.env.SMTP_HOST || '',
          smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
          smtpUser: process.env.SMTP_USER || '',
          smtpPassword: process.env.SMTP_PASSWORD || ''
        },
        smsConfig: {
          provider: process.env.SMS_PROVIDER || 'twilio',
          apiKey: process.env.SMS_API_KEY || '',
          apiSecret: process.env.SMS_API_SECRET || ''
        }
      });
    },
    ServiceLifetime.SINGLETON
  );

  container.register(
    ServiceTokens.TEMPLATE_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new VietnameseTemplateService({
        logger,
        templatesPath: process.env.TEMPLATES_PATH || './templates',
        defaultLanguage: 'vi'
      });
    },
    ServiceLifetime.SINGLETON
  );

  container.register(
    ServiceTokens.REALTIME_SERVICE,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new RealTimeNotificationService({
        supabase: supabaseClient,
        logger,
        channelName: 'notifications'
      });
    },
    ServiceLifetime.SINGLETON
  );

  // Register use cases
  container.register(
    ServiceTokens.SCHEDULE_NOTIFICATION_USE_CASE,
    (container) => {
      const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
      const templateService = container.resolve(ServiceTokens.TEMPLATE_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new ScheduleNotificationUseCase(
        notificationRepository,
        templateService,
        eventBus,
        logger
      );
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.SEND_NOTIFICATION_USE_CASE,
    (container) => {
      const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
      const deliveryService = container.resolve(ServiceTokens.DELIVERY_SERVICE);
      const realtimeService = container.resolve(ServiceTokens.REALTIME_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new SendNotificationUseCase(
        notificationRepository,
        deliveryService,
        realtimeService,
        eventBus,
        logger
      );
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.PROCESS_NOTIFICATION_QUEUE_USE_CASE,
    (container) => {
      const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
      const sendNotificationUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new ProcessNotificationQueueUseCase(
        notificationRepository,
        sendNotificationUseCase,
        logger
      );
    },
    ServiceLifetime.TRANSIENT
  );

  // Register handlers
  container.register(
    ServiceTokens.NOTIFICATION_COMMAND_HANDLERS,
    (container) => {
      const scheduleUseCase = container.resolve(ServiceTokens.SCHEDULE_NOTIFICATION_USE_CASE);
      const sendUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);
      const processQueueUseCase = container.resolve(ServiceTokens.PROCESS_NOTIFICATION_QUEUE_USE_CASE);
      const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new NotificationCommandHandlers(
        scheduleUseCase,
        sendUseCase,
        processQueueUseCase,
        notificationRepository,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  container.register(
    ServiceTokens.NOTIFICATION_QUERY_HANDLERS,
    (container) => {
      const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new NotificationQueryHandlers(
        notificationRepository,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  // Register event handlers
  container.register(
    ServiceTokens.NOTIFICATION_EVENT_HANDLERS,
    (container) => {
      const scheduleUseCase = container.resolve(ServiceTokens.SCHEDULE_NOTIFICATION_USE_CASE);
      const sendUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new NotificationEventHandlers(
        scheduleUseCase,
        sendUseCase,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  // Register application services
  container.register(
    ServiceTokens.NOTIFICATION_APPLICATION_SERVICE,
    (container) => {
      const scheduleUseCase = container.resolve(ServiceTokens.SCHEDULE_NOTIFICATION_USE_CASE);
      const sendUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);
      const processQueueUseCase = container.resolve(ServiceTokens.PROCESS_NOTIFICATION_QUEUE_USE_CASE);
      const commandHandlers = container.resolve(ServiceTokens.NOTIFICATION_COMMAND_HANDLERS);
      const queryHandlers = container.resolve(ServiceTokens.NOTIFICATION_QUERY_HANDLERS);
      const deliveryService = container.resolve(ServiceTokens.DELIVERY_SERVICE);
      const templateService = container.resolve(ServiceTokens.TEMPLATE_SERVICE);
      const realtimeService = container.resolve(ServiceTokens.REALTIME_SERVICE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new NotificationApplicationService({
        scheduleNotificationUseCase: scheduleUseCase,
        sendNotificationUseCase: sendUseCase,
        processNotificationQueueUseCase: processQueueUseCase,
        commandHandlers,
        queryHandlers,
        deliveryService,
        templateService,
        realtimeService,
        logger
      });
    },
    ServiceLifetime.SCOPED
  );
}
