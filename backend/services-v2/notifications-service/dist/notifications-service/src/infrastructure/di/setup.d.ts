/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Notifications Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
import { DIContainer } from "../../../../shared/infrastructure/di/container";
export declare const ServiceTokens: {
    readonly SUPABASE_CLIENT: "SupabaseClient";
    readonly LOGGER: "Logger";
    readonly AUDIT_SERVICE: "AuditService";
    readonly EVENT_BUS: "EventBus";
    readonly NOTIFICATION_REPOSITORY: "NotificationRepository";
    readonly INBOX_REPOSITORY: "InboxRepository";
    readonly TEMPLATE_REPOSITORY: "TemplateRepository";
    readonly PREFERENCES_REPOSITORY: "PreferencesRepository";
    readonly APPOINTMENT_REMINDER_REPOSITORY: "AppointmentReminderRepository";
    readonly DELIVERY_SERVICE: "DeliveryService";
    readonly TEMPLATE_SERVICE: "TemplateService";
    readonly REALTIME_SERVICE: "RealTimeService";
    readonly SEND_NOTIFICATION_USE_CASE: "SendNotificationUseCase";
    readonly GET_NOTIFICATION_USE_CASE: "GetNotificationUseCase";
    readonly GET_NOTIFICATION_PREFERENCES_USE_CASE: "GetNotificationPreferencesUseCase";
    readonly PROCESS_NOTIFICATION_QUEUE_USE_CASE: "ProcessNotificationQueueUseCase";
    readonly GET_TEMPLATES_USE_CASE: "GetTemplatesUseCase";
    readonly CREATE_TEMPLATE_USE_CASE: "CreateTemplateUseCase";
    readonly UPDATE_TEMPLATE_USE_CASE: "UpdateTemplateUseCase";
    readonly DELETE_TEMPLATE_USE_CASE: "DeleteTemplateUseCase";
    readonly MARK_AS_READ_USE_CASE: "MarkNotificationAsReadUseCase";
    readonly GET_USER_NOTIFICATIONS_USE_CASE: "GetUserNotificationsUseCase";
    readonly UPDATE_PREFERENCES_USE_CASE: "UpdateNotificationPreferencesUseCase";
    readonly CREATE_APPOINTMENT_REMINDERS_USE_CASE: "CreateAppointmentRemindersUseCase";
    readonly NOTIFICATION_COMMAND_HANDLERS: "NotificationCommandHandlers";
    readonly NOTIFICATION_QUERY_HANDLERS: "NotificationQueryHandlers";
    readonly NOTIFICATION_EVENT_HANDLERS: "NotificationEventHandlers";
    readonly APPOINTMENT_EVENT_CONSUMER: "AppointmentEventConsumer";
    readonly STAFF_EVENT_CONSUMER: "StaffEventConsumer";
    readonly BILLING_EVENT_CONSUMER: "BillingEventConsumer";
    readonly REMINDER_CRON_JOB: "ReminderCronJob";
    readonly NOTIFICATION_APPLICATION_SERVICE: "NotificationApplicationService";
    readonly NOTIFICATION_CONTROLLER: "NotificationController";
};
export declare function setupDependencies(container: DIContainer): void;
//# sourceMappingURL=setup.d.ts.map