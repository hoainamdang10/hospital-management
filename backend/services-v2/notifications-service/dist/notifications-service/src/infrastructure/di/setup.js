"use strict";
/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Notifications Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceTokens = void 0;
exports.setupDependencies = setupDependencies;
const optimized_supabase_client_1 = require("@shared/infrastructure/database/optimized-supabase-client");
const container_1 = require("@shared/infrastructure/di/container");
// import { ILogger } from "@shared/infrastructure/logging/logger.interface";
// import { IAuditService } from "@shared/application/services/audit.service.interface";
// import { ConsoleLogger } from "@shared/infrastructure/logging/console-logger";
// import { AuditService } from "@shared/infrastructure/services/audit.service";
// Application Layer
const NotificationApplicationService_1 = require("../../application/services/NotificationApplicationService");
// import { ScheduleNotificationUseCase } from "../../application/use-cases/ScheduleNotificationUseCase";
const SendNotificationUseCase_1 = require("../../application/use-cases/SendNotificationUseCase");
// import { ProcessNotificationQueueUseCase } from "../../application/use-cases/ProcessNotificationQueueUseCase";
// import { NotificationCommandHandlers } from "../../application/handlers/NotificationCommandHandlers";
// import { NotificationQueryHandlers } from "../../application/handlers/NotificationQueryHandlers";
// Infrastructure Layer
const SupabaseNotificationRepository_1 = require("../persistence/SupabaseNotificationRepository");
const SupabaseInboxRepository_1 = require("../persistence/SupabaseInboxRepository");
const MultiChannelDeliveryService_1 = require("../delivery/MultiChannelDeliveryService");
const VietnameseTemplateService_1 = require("../templates/VietnameseTemplateService");
// import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
const NotificationEventHandlers_1 = require("../events/NotificationEventHandlers");
// Service Tokens
exports.ServiceTokens = {
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
};
function setupDependencies(container) {
    // Register infrastructure services
    container.registerFactory(exports.ServiceTokens.LOGGER, () => ({
        debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta),
        info: (message, meta) => console.log(`[INFO] ${message}`, meta),
        warn: (message, meta) => console.warn(`[WARN] ${message}`, meta),
        error: (message, meta) => console.error(`[ERROR] ${message}`, meta),
        fatal: (message, meta) => console.error(`[FATAL] ${message}`, meta),
    }), container_1.ServiceLifetime.SINGLETON);
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
    container.registerFactory(exports.ServiceTokens.SUPABASE_CLIENT, () => {
        const config = {
            supabaseUrl: process.env.SUPABASE_URL || "",
            supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            serviceName: "notifications-service",
            schemaName: "notifications_schema",
            enableOptimizations: true,
        };
        return new optimized_supabase_client_1.OptimizedSupabaseClient(config);
    }, container_1.ServiceLifetime.SINGLETON);
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
    container.registerFactory(exports.ServiceTokens.NOTIFICATION_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const logger = container.resolve(exports.ServiceTokens.LOGGER);
        return new SupabaseNotificationRepository_1.SupabaseNotificationRepository({
            supabase: supabaseClient,
            logger,
            schema: 'notifications_schema',
            tableName: 'notifications'
        });
    }, container_1.ServiceLifetime.SCOPED);
    container.registerFactory(exports.ServiceTokens.INBOX_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        return new SupabaseInboxRepository_1.SupabaseInboxRepository(supabaseClient);
    }, container_1.ServiceLifetime.SCOPED);
    // Register external services
    container.registerFactory(exports.ServiceTokens.DELIVERY_SERVICE, () => {
        return new MultiChannelDeliveryService_1.MultiChannelDeliveryService();
    }, container_1.ServiceLifetime.SINGLETON);
    container.registerFactory(exports.ServiceTokens.TEMPLATE_SERVICE, () => {
        return new VietnameseTemplateService_1.VietnameseTemplateService();
    }, container_1.ServiceLifetime.SINGLETON);
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
    container.registerFactory(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE, (container) => {
        const notificationRepository = container.resolve(exports.ServiceTokens.NOTIFICATION_REPOSITORY);
        const templateService = container.resolve(exports.ServiceTokens.TEMPLATE_SERVICE);
        const deliveryService = container.resolve(exports.ServiceTokens.DELIVERY_SERVICE);
        return new SendNotificationUseCase_1.SendNotificationUseCase(notificationRepository, templateService, deliveryService);
    }, container_1.ServiceLifetime.TRANSIENT);
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
    container.registerFactory(exports.ServiceTokens.NOTIFICATION_APPLICATION_SERVICE, (container) => {
        const sendUseCase = container.resolve(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        return new NotificationApplicationService_1.NotificationApplicationService(sendUseCase);
    }, container_1.ServiceLifetime.SCOPED);
    // Register event handlers (after application service to avoid circular dependency)
    container.registerFactory(exports.ServiceTokens.NOTIFICATION_EVENT_HANDLERS, (container) => {
        const notificationService = container.resolve(exports.ServiceTokens.NOTIFICATION_APPLICATION_SERVICE);
        const inboxRepo = container.resolve(exports.ServiceTokens.INBOX_REPOSITORY);
        const sendUseCase = container.resolve(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        return new NotificationEventHandlers_1.NotificationEventHandlers(notificationService, inboxRepo, sendUseCase);
    }, container_1.ServiceLifetime.SCOPED);
}
//# sourceMappingURL=setup.js.map