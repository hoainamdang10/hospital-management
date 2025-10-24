/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Notifications Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
import { DIContainer } from "@shared/infrastructure/di/container";
export declare const ServiceTokens: {
    readonly SUPABASE_CLIENT: "SupabaseClient";
    readonly LOGGER: "Logger";
    readonly AUDIT_SERVICE: "AuditService";
    readonly EVENT_BUS: "EventBus";
    readonly NOTIFICATION_REPOSITORY: "NotificationRepository";
    readonly INBOX_REPOSITORY: "InboxRepository";
    readonly DELIVERY_SERVICE: "DeliveryService";
    readonly TEMPLATE_SERVICE: "TemplateService";
    readonly REALTIME_SERVICE: "RealTimeService";
    readonly SCHEDULE_NOTIFICATION_USE_CASE: "ScheduleNotificationUseCase";
    readonly SEND_NOTIFICATION_USE_CASE: "SendNotificationUseCase";
    readonly PROCESS_NOTIFICATION_QUEUE_USE_CASE: "ProcessNotificationQueueUseCase";
    readonly NOTIFICATION_COMMAND_HANDLERS: "NotificationCommandHandlers";
    readonly NOTIFICATION_QUERY_HANDLERS: "NotificationQueryHandlers";
    readonly NOTIFICATION_EVENT_HANDLERS: "NotificationEventHandlers";
    readonly NOTIFICATION_APPLICATION_SERVICE: "NotificationApplicationService";
};
export declare function setupDependencies(container: DIContainer): void;
//# sourceMappingURL=setup.d.ts.map