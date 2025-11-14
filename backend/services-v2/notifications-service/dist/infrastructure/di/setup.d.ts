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
    readonly TEMPLATE_REPOSITORY: "TemplateRepository";
    readonly DELIVERY_SERVICE: "DeliveryService";
    readonly TEMPLATE_SERVICE: "TemplateService";
    readonly REALTIME_SERVICE: "RealTimeService";
    readonly SCHEDULE_NOTIFICATION_USE_CASE: "ScheduleNotificationUseCase";
    readonly SEND_NOTIFICATION_USE_CASE: "SendNotificationUseCase";
    readonly GET_NOTIFICATION_PREFERENCES_USE_CASE: "GetNotificationPreferencesUseCase";
    readonly PROCESS_NOTIFICATION_QUEUE_USE_CASE: "ProcessNotificationQueueUseCase";
    readonly GET_TEMPLATES_USE_CASE: "GetTemplatesUseCase";
    readonly CREATE_TEMPLATE_USE_CASE: "CreateTemplateUseCase";
    readonly UPDATE_TEMPLATE_USE_CASE: "UpdateTemplateUseCase";
    readonly DELETE_TEMPLATE_USE_CASE: "DeleteTemplateUseCase";
    readonly NOTIFICATION_COMMAND_HANDLERS: "NotificationCommandHandlers";
    readonly NOTIFICATION_QUERY_HANDLERS: "NotificationQueryHandlers";
    readonly NOTIFICATION_EVENT_HANDLERS: "NotificationEventHandlers";
    readonly APPOINTMENT_EVENT_CONSUMER: "AppointmentEventConsumer";
    readonly STAFF_EVENT_CONSUMER: "StaffEventConsumer";
    readonly NOTIFICATION_APPLICATION_SERVICE: "NotificationApplicationService";
    readonly NOTIFICATION_CONTROLLER: "NotificationController";
};
export declare function setupDependencies(container: DIContainer): void;
//# sourceMappingURL=setup.d.ts.map