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
const optimized_supabase_client_1 = require("../../../../shared/infrastructure/database/optimized-supabase-client");
const container_1 = require("../../../../shared/infrastructure/di/container");
// import { ILogger } from "@shared/infrastructure/logging/logger.interface";
// import { IAuditService } from "@shared/application/services/audit.service.interface";
// import { ConsoleLogger } from "@shared/infrastructure/logging/console-logger";
// import { AuditService } from "@shared/infrastructure/services/audit.service";
// Application Layer
const NotificationApplicationService_1 = require("../../application/services/NotificationApplicationService");
// import { ScheduleNotificationUseCase } from "../../application/use-cases/ScheduleNotificationUseCase";
const SendNotificationUseCase_1 = require("../../application/use-cases/SendNotificationUseCase");
const GetNotificationUseCase_1 = require("../../application/use-cases/GetNotificationUseCase");
const GetNotificationPreferencesUseCase_1 = require("../../application/use-cases/GetNotificationPreferencesUseCase");
// import { ProcessNotificationQueueUseCase } from "../../application/use-cases/ProcessNotificationQueueUseCase";
// import { NotificationCommandHandlers } from "../../application/handlers/NotificationCommandHandlers";
// import { NotificationQueryHandlers } from "../../application/handlers/NotificationQueryHandlers";
// ARCHIVED - Template management out of MVP scope
// import { GetTemplatesUseCase } from "../../application/use-cases/GetTemplatesUseCase";
// import { CreateTemplateUseCase } from "../../application/use-cases/CreateTemplateUseCase";
// import { UpdateTemplateUseCase } from "../../application/use-cases/UpdateTemplateUseCase";
// import { DeleteTemplateUseCase } from "../../application/use-cases/DeleteTemplateUseCase";
const MarkNotificationAsReadUseCase_1 = require("../../application/use-cases/MarkNotificationAsReadUseCase");
// OUT OF SCOPE - Archived for thesis
// import { GetUserNotificationsUseCase } from "../../application/use-cases/GetUserNotificationsUseCase";
// import { UpdateNotificationPreferencesUseCase } from "../../application/use-cases/UpdateNotificationPreferencesUseCase";
const CreateAppointmentRemindersUseCase_1 = require("../../application/use-cases/CreateAppointmentRemindersUseCase");
// Infrastructure Layer
const SupabaseNotificationRepository_1 = require("../persistence/SupabaseNotificationRepository");
const SupabaseInboxRepository_1 = require("../persistence/SupabaseInboxRepository");
const SupabaseTemplateRepository_1 = require("../persistence/SupabaseTemplateRepository");
const SupabasePreferencesRepository_1 = require("../persistence/SupabasePreferencesRepository");
const SupabaseAppointmentReminderRepository_1 = require("../persistence/SupabaseAppointmentReminderRepository");
const MultiChannelDeliveryService_1 = require("../delivery/MultiChannelDeliveryService");
const VietnameseTemplateService_1 = require("../templates/VietnameseTemplateService");
// import { RealTimeNotificationService } from "../realtime/RealTimeNotificationService";
// import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
const NotificationEventHandlers_1 = require("../events/NotificationEventHandlers");
const AppointmentEventConsumer_1 = require("../events/AppointmentEventConsumer");
const StaffEventConsumer_1 = require("../events/StaffEventConsumer");
const BillingEventConsumer_1 = require("../events/BillingEventConsumer");
// import { ClinicalEMREventConsumer } from "../events/ClinicalEMREventConsumer"; // REMOVED FOR MVP
const ReminderCronJob_1 = require("../cron/ReminderCronJob");
// import { NotificationController } from "../../presentation/controllers/NotificationController"; // OUT OF SCOPE
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
    TEMPLATE_REPOSITORY: "TemplateRepository",
    PREFERENCES_REPOSITORY: "PreferencesRepository",
    APPOINTMENT_REMINDER_REPOSITORY: "AppointmentReminderRepository",
    // External Services
    DELIVERY_SERVICE: "DeliveryService",
    TEMPLATE_SERVICE: "TemplateService",
    REALTIME_SERVICE: "RealTimeService",
    // Use Cases
    SEND_NOTIFICATION_USE_CASE: "SendNotificationUseCase",
    GET_NOTIFICATION_USE_CASE: "GetNotificationUseCase",
    GET_NOTIFICATION_PREFERENCES_USE_CASE: "GetNotificationPreferencesUseCase",
    PROCESS_NOTIFICATION_QUEUE_USE_CASE: "ProcessNotificationQueueUseCase",
    // ARCHIVED for MVP
    // GET_TEMPLATES_USE_CASE: "GetTemplatesUseCase",
    // CREATE_TEMPLATE_USE_CASE: "CreateTemplateUseCase",
    // UPDATE_TEMPLATE_USE_CASE: "UpdateTemplateUseCase",
    // DELETE_TEMPLATE_USE_CASE: "DeleteTemplateUseCase",
    MARK_AS_READ_USE_CASE: "MarkNotificationAsReadUseCase",
    GET_USER_NOTIFICATIONS_USE_CASE: "GetUserNotificationsUseCase",
    UPDATE_PREFERENCES_USE_CASE: "UpdateNotificationPreferencesUseCase",
    CREATE_APPOINTMENT_REMINDERS_USE_CASE: "CreateAppointmentRemindersUseCase",
    // Handlers
    NOTIFICATION_COMMAND_HANDLERS: "NotificationCommandHandlers",
    NOTIFICATION_QUERY_HANDLERS: "NotificationQueryHandlers",
    // Event Handlers
    NOTIFICATION_EVENT_HANDLERS: "NotificationEventHandlers",
    // Event Consumers
    APPOINTMENT_EVENT_CONSUMER: "AppointmentEventConsumer",
    STAFF_EVENT_CONSUMER: "StaffEventConsumer",
    BILLING_EVENT_CONSUMER: "BillingEventConsumer",
    // CLINICAL_EMR_EVENT_CONSUMER: "ClinicalEMREventConsumer", // REMOVED FOR MVP
    // Cron Jobs
    REMINDER_CRON_JOB: "ReminderCronJob",
    // Application Services
    NOTIFICATION_APPLICATION_SERVICE: "NotificationApplicationService",
    // Controllers
    NOTIFICATION_CONTROLLER: "NotificationController",
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
    // Register RabbitMQ Event Bus for publishing domain events
    container.registerFactory(exports.ServiceTokens.EVENT_BUS, () => {
        const { RabbitMQEventBus } = require('../../../../shared/infrastructure/event-bus/EventBus');
        return new RabbitMQEventBus({
            rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq-v2:5672',
            exchangeName: 'hospital.events',
            serviceName: 'notifications-service'
        });
    }, container_1.ServiceLifetime.SINGLETON);
    // Register repositories
    container.registerFactory(exports.ServiceTokens.NOTIFICATION_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        const eventBus = container.resolve(exports.ServiceTokens.EVENT_BUS);
        return new SupabaseNotificationRepository_1.SupabaseNotificationRepository(supabaseClient, eventBus);
    }, container_1.ServiceLifetime.SCOPED);
    container.registerFactory(exports.ServiceTokens.INBOX_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        return new SupabaseInboxRepository_1.SupabaseInboxRepository(supabaseClient);
    }, container_1.ServiceLifetime.SCOPED);
    container.registerFactory(exports.ServiceTokens.TEMPLATE_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        return new SupabaseTemplateRepository_1.SupabaseTemplateRepository(supabaseClient);
    }, container_1.ServiceLifetime.SCOPED);
    container.registerFactory(exports.ServiceTokens.PREFERENCES_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        return new SupabasePreferencesRepository_1.SupabasePreferencesRepository(supabaseClient);
    }, container_1.ServiceLifetime.SCOPED);
    container.registerFactory(exports.ServiceTokens.APPOINTMENT_REMINDER_REPOSITORY, (container) => {
        const supabaseClient = container.resolve(exports.ServiceTokens.SUPABASE_CLIENT);
        return new SupabaseAppointmentReminderRepository_1.SupabaseAppointmentReminderRepository(supabaseClient);
    }, container_1.ServiceLifetime.SCOPED);
    // Register external services
    container.registerFactory(exports.ServiceTokens.DELIVERY_SERVICE, () => {
        return new MultiChannelDeliveryService_1.MultiChannelDeliveryService();
    }, container_1.ServiceLifetime.SINGLETON);
    container.registerFactory(exports.ServiceTokens.TEMPLATE_SERVICE, (container) => {
        const templateRepository = container.resolve(exports.ServiceTokens.TEMPLATE_REPOSITORY);
        return new VietnameseTemplateService_1.VietnameseTemplateService(templateRepository);
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
    container.registerFactory(exports.ServiceTokens.GET_NOTIFICATION_USE_CASE, (container) => {
        const notificationRepository = container.resolve(exports.ServiceTokens.NOTIFICATION_REPOSITORY);
        return new GetNotificationUseCase_1.GetNotificationUseCase(notificationRepository);
    }, container_1.ServiceLifetime.TRANSIENT);
    // Register GetNotificationPreferencesUseCase
    container.registerFactory(exports.ServiceTokens.GET_NOTIFICATION_PREFERENCES_USE_CASE, (container) => {
        const notificationRepository = container.resolve(exports.ServiceTokens.NOTIFICATION_REPOSITORY);
        return new GetNotificationPreferencesUseCase_1.GetNotificationPreferencesUseCase(notificationRepository);
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
    // ARCHIVED - Template management use cases out of MVP scope
    // container.registerFactory(
    //   ServiceTokens.GET_TEMPLATES_USE_CASE,
    //   (container) => {
    //     const templateService = container.resolve(ServiceTokens.TEMPLATE_SERVICE);
    //     return new GetTemplatesUseCase(templateService);
    //   },
    //   ServiceLifetime.SCOPED
    // );
    // container.registerFactory(
    //   ServiceTokens.CREATE_TEMPLATE_USE_CASE,
    //   (container) => {
    //     const templateService = container.resolve(ServiceTokens.TEMPLATE_SERVICE);
    //     return new CreateTemplateUseCase(templateService);
    //   },
    //   ServiceLifetime.SCOPED
    // );
    // container.registerFactory(
    //   ServiceTokens.UPDATE_TEMPLATE_USE_CASE,
    //   (container) => {
    //     const templateService = container.resolve(ServiceTokens.TEMPLATE_SERVICE);
    //     return new UpdateTemplateUseCase(templateService);
    //   },
    //   ServiceLifetime.SCOPED
    // );
    // container.registerFactory(
    //   ServiceTokens.DELETE_TEMPLATE_USE_CASE,
    //   (container) => {
    //     const templateService = container.resolve(ServiceTokens.TEMPLATE_SERVICE);
    //     return new DeleteTemplateUseCase(templateService);
    //   },
    //   ServiceLifetime.SCOPED
    // );
    // Register application services
    container.registerFactory(exports.ServiceTokens.NOTIFICATION_APPLICATION_SERVICE, (container) => {
        const sendUseCase = container.resolve(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        const getUseCase = container.resolve(exports.ServiceTokens.GET_NOTIFICATION_USE_CASE);
        const getPreferencesUseCase = container.resolve(exports.ServiceTokens.GET_NOTIFICATION_PREFERENCES_USE_CASE);
        return new NotificationApplicationService_1.NotificationApplicationService(sendUseCase, getUseCase, getPreferencesUseCase);
    }, container_1.ServiceLifetime.SCOPED);
    // Register event handlers (after application service to avoid circular dependency)
    container.registerFactory(exports.ServiceTokens.NOTIFICATION_EVENT_HANDLERS, (container) => {
        const notificationService = container.resolve(exports.ServiceTokens.NOTIFICATION_APPLICATION_SERVICE);
        const inboxRepo = container.resolve(exports.ServiceTokens.INBOX_REPOSITORY);
        const sendUseCase = container.resolve(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        return new NotificationEventHandlers_1.NotificationEventHandlers(notificationService, inboxRepo, sendUseCase);
    }, container_1.ServiceLifetime.SCOPED);
    // Register Event Consumers
    container.registerFactory(exports.ServiceTokens.APPOINTMENT_EVENT_CONSUMER, (container) => {
        const sendNotificationUseCase = container.resolve(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        const getNotificationPreferencesUseCase = container.resolve(exports.ServiceTokens.GET_NOTIFICATION_PREFERENCES_USE_CASE);
        const createAppointmentRemindersUseCase = container.resolve(exports.ServiceTokens.CREATE_APPOINTMENT_REMINDERS_USE_CASE);
        const appointmentReminderRepo = container.resolve(exports.ServiceTokens.APPOINTMENT_REMINDER_REPOSITORY);
        const inboxRepo = container.resolve(exports.ServiceTokens.INBOX_REPOSITORY);
        const config = {
            rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
            queueName: process.env.APPOINTMENT_EVENT_QUEUE || 'notifications.appointment.events',
            exchangeName: process.env.APPOINTMENT_EVENT_EXCHANGE || 'appointments.events',
            routingKeys: [
                'appointment.scheduled',
                'appointment.confirmed',
                'appointment.cancelled',
                'appointment.completed',
                'appointment.rescheduled',
                'appointment.reminder',
                'appointment.no_show'
            ],
            prefetchCount: parseInt(process.env.EVENT_CONSUMER_PREFETCH_COUNT || '10'),
            retryAttempts: parseInt(process.env.EVENT_CONSUMER_RETRY_ATTEMPTS || '3'),
            retryDelayMs: parseInt(process.env.EVENT_CONSUMER_RETRY_DELAY_MS || '1000')
        };
        return new AppointmentEventConsumer_1.AppointmentEventConsumer(config, sendNotificationUseCase, getNotificationPreferencesUseCase, createAppointmentRemindersUseCase, appointmentReminderRepo, inboxRepo);
    }, container_1.ServiceLifetime.SINGLETON);
    container.registerFactory(exports.ServiceTokens.STAFF_EVENT_CONSUMER, (container) => {
        const sendNotificationUseCase = container.resolve(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        const getNotificationPreferencesUseCase = container.resolve(exports.ServiceTokens.GET_NOTIFICATION_PREFERENCES_USE_CASE);
        const inboxRepo = container.resolve(exports.ServiceTokens.INBOX_REPOSITORY);
        const config = {
            rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
            queueName: process.env.STAFF_EVENT_QUEUE || 'notifications.staff.events',
            exchangeName: process.env.STAFF_EVENT_EXCHANGE || 'staff.events',
            routingKeys: [
                'availability.staff.changed',
                'shift.staff.assigned',
                'shift.staff.cancelled',
                'schedule.staff.updated',
                'department.staff.assigned',
                'oncall.staff.assigned',
                'performance.staff.reviewed'
            ],
            prefetchCount: parseInt(process.env.EVENT_CONSUMER_PREFETCH_COUNT || '10'),
            retryAttempts: parseInt(process.env.EVENT_CONSUMER_RETRY_ATTEMPTS || '3'),
            retryDelayMs: parseInt(process.env.EVENT_CONSUMER_RETRY_DELAY_MS || '1000')
        };
        return new StaffEventConsumer_1.StaffEventConsumer(config, sendNotificationUseCase, getNotificationPreferencesUseCase, inboxRepo);
    }, container_1.ServiceLifetime.SINGLETON);
    container.registerFactory(exports.ServiceTokens.BILLING_EVENT_CONSUMER, (container) => {
        const sendNotificationUseCase = container.resolve(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        const getNotificationPreferencesUseCase = container.resolve(exports.ServiceTokens.GET_NOTIFICATION_PREFERENCES_USE_CASE);
        const inboxRepo = container.resolve(exports.ServiceTokens.INBOX_REPOSITORY);
        const config = {
            rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
            queueName: process.env.BILLING_EVENT_QUEUE || 'notifications.billing.events',
            exchangeName: process.env.BILLING_EVENT_EXCHANGE || 'hospital.events',
            routingKeys: [
                'billing.invoice.generated',
                'billing.payment.completed',
                'billing.payment.reminder.*',
                'billing.insurance.*',
                'billing.rate.updated'
            ],
            prefetchCount: parseInt(process.env.EVENT_CONSUMER_PREFETCH_COUNT || '10'),
            retryAttempts: parseInt(process.env.EVENT_CONSUMER_RETRY_ATTEMPTS || '3'),
            retryDelayMs: parseInt(process.env.EVENT_CONSUMER_RETRY_DELAY_MS || '1000')
        };
        return new BillingEventConsumer_1.BillingEventConsumer(config, sendNotificationUseCase, getNotificationPreferencesUseCase, inboxRepo);
    }, container_1.ServiceLifetime.SINGLETON);
    // CLINICAL EMR EVENT CONSUMER REMOVED FOR MVP - Focus on Appointments only
    /*
    container.registerFactory(
      ServiceTokens.CLINICAL_EMR_EVENT_CONSUMER,
      (container) => {
        const sendNotificationUseCase = container.resolve(ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        const getNotificationPreferencesUseCase = container.resolve(ServiceTokens.GET_NOTIFICATION_PREFERENCES_USE_CASE);
        const inboxRepo = container.resolve(ServiceTokens.INBOX_REPOSITORY);
  
        const config = {
          rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
          queueName: process.env.CLINICAL_EVENT_QUEUE || 'notifications.clinical.events',
          exchangeName: process.env.CLINICAL_EVENT_EXCHANGE || 'hospital.events',
          routingKeys: [
            'clinical.medical_record_updated',
            'clinical.medication.reminder.*',
            'clinical.test_result.ready',
            'clinical.prescription.created',
            'emergency.alert'
          ],
          prefetchCount: parseInt(process.env.EVENT_CONSUMER_PREFETCH_COUNT || '10'),
          retryAttempts: parseInt(process.env.EVENT_CONSUMER_RETRY_ATTEMPTS || '3'),
          retryDelayMs: parseInt(process.env.EVENT_CONSUMER_RETRY_DELAY_MS || '1000')
        };
  
        return new ClinicalEMREventConsumer(
          config,
          sendNotificationUseCase,
          getNotificationPreferencesUseCase,
          inboxRepo
        );
      },
      ServiceLifetime.SINGLETON
    );
    */
    // Register new use cases
    container.registerFactory(exports.ServiceTokens.MARK_AS_READ_USE_CASE, (container) => {
        const notificationRepository = container.resolve(exports.ServiceTokens.NOTIFICATION_REPOSITORY);
        return new MarkNotificationAsReadUseCase_1.MarkNotificationAsReadUseCase(notificationRepository);
    }, container_1.ServiceLifetime.TRANSIENT);
    // OUT OF SCOPE - User notifications archived for thesis
    // container.registerFactory(
    //   ServiceTokens.GET_USER_NOTIFICATIONS_USE_CASE,
    //   (container) => {
    //     const notificationRepository = container.resolve(ServiceTokens.NOTIFICATION_REPOSITORY);
    //     return new GetUserNotificationsUseCase(notificationRepository);
    //   },
    //   ServiceLifetime.TRANSIENT
    // );
    // OUT OF SCOPE - Preferences archived for thesis
    // container.registerFactory(
    //   ServiceTokens.UPDATE_PREFERENCES_USE_CASE,
    //   (container) => {
    //     const preferencesRepository = container.resolve(ServiceTokens.PREFERENCES_REPOSITORY);
    //     return new UpdateNotificationPreferencesUseCase(preferencesRepository);
    //   },
    //   ServiceLifetime.TRANSIENT
    // );
    container.registerFactory(exports.ServiceTokens.CREATE_APPOINTMENT_REMINDERS_USE_CASE, (container) => {
        const reminderRepo = container.resolve(exports.ServiceTokens.APPOINTMENT_REMINDER_REPOSITORY);
        return new CreateAppointmentRemindersUseCase_1.CreateAppointmentRemindersUseCase(reminderRepo);
    }, container_1.ServiceLifetime.TRANSIENT);
    // Register Cron Jobs
    container.registerFactory(exports.ServiceTokens.REMINDER_CRON_JOB, (container) => {
        const reminderRepo = container.resolve(exports.ServiceTokens.APPOINTMENT_REMINDER_REPOSITORY);
        const sendNotificationUseCase = container.resolve(exports.ServiceTokens.SEND_NOTIFICATION_USE_CASE);
        const config = {
            cronExpression: process.env.REMINDER_CRON_EXPRESSION || '*/5 * * * *', // Every 5 minutes
            batchSize: parseInt(process.env.REMINDER_BATCH_SIZE || '50'),
            enabled: process.env.REMINDER_CRON_ENABLED !== 'false' // Enabled by default
        };
        return new ReminderCronJob_1.ReminderCronJob(config, reminderRepo, sendNotificationUseCase);
    }, container_1.ServiceLifetime.SINGLETON);
    // Register Controllers
    // OUT OF SCOPE - NotificationController archived for thesis
    // container.registerFactory(
    //   ServiceTokens.NOTIFICATION_CONTROLLER,
    //   (container) => {
    //     const notificationApplicationService = container.resolve(ServiceTokens.NOTIFICATION_APPLICATION_SERVICE);
    //     const markAsReadUseCase = container.resolve(ServiceTokens.MARK_AS_READ_USE_CASE);
    //     const getUserNotificationsUseCase = container.resolve(ServiceTokens.GET_USER_NOTIFICATIONS_USE_CASE);
    //     const updatePreferencesUseCase = container.resolve(ServiceTokens.UPDATE_PREFERENCES_USE_CASE);
    //     return new NotificationController(
    //       notificationApplicationService,
    //       markAsReadUseCase,
    //       getUserNotificationsUseCase,
    //       updatePreferencesUseCase
    //     );
    //   },
    //   ServiceLifetime.SCOPED
    // );
}
//# sourceMappingURL=setup.js.map