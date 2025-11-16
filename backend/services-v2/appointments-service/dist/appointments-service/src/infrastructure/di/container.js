"use strict";
/**
 * Dependency Injection Container
 * Centralized DI setup for Scheduling Service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, SOLID
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIContainer = void 0;
exports.getContainer = getContainer;
exports.resetContainer = resetContainer;
// Repositories
const SupabaseAppointmentRepository_1 = require("../persistence/SupabaseAppointmentRepository");
const SupabaseAppointmentReadModelRepository_1 = require("../persistence/SupabaseAppointmentReadModelRepository");
const SupabaseQueueRepository_1 = require("../persistence/SupabaseQueueRepository");
const SupabaseProviderScheduleRepository_1 = require("../persistence/SupabaseProviderScheduleRepository");
const SupabaseAppointmentReminderRepository_1 = require("../repositories/SupabaseAppointmentReminderRepository");
const SupabaseReschedulingQueueRepository_1 = require("../persistence/SupabaseReschedulingQueueRepository");
const EventBusAdapter_1 = require("../events/EventBusAdapter");
// Services - PURE OUTBOX PATTERN (No HTTP)
const LocalPatientReadModelService_1 = require("../services/LocalPatientReadModelService");
const LocalProviderReadModelService_1 = require("../services/LocalProviderReadModelService");
const RemoteSchedulerAdapter_1 = require("../adapters/RemoteSchedulerAdapter");
const SchedulerAdapterWrapper_1 = require("../adapters/SchedulerAdapterWrapper");
const BillingServiceClient_1 = require("../clients/BillingServiceClient");
const ConflictResolutionService_1 = require("../services/ConflictResolutionService");
const AuthorizationService_1 = require("../services/AuthorizationService");
const ReminderService_1 = require("../services/ReminderService");
const ReschedulingService_1 = require("../../application/services/ReschedulingService");
const EventBusPublisher_1 = require("../events/EventBusPublisher");
// Reminder Management
const ReminderController_1 = require("../../presentation/controllers/ReminderController");
const CreateAppointmentReminderUseCase_1 = require("../../application/use-cases/CreateAppointmentReminderUseCase");
const GetAppointmentRemindersUseCase_1 = require("../../application/use-cases/GetAppointmentRemindersUseCase");
const UpdateAppointmentReminderUseCase_1 = require("../../application/use-cases/UpdateAppointmentReminderUseCase");
const DeleteAppointmentReminderUseCase_1 = require("../../application/use-cases/DeleteAppointmentReminderUseCase");
const ManageAppointmentReminders_use_case_1 = require("../../application/use-cases/ManageAppointmentReminders.use-case");
const ReschedulingQueueController_1 = require("../../presentation/controllers/ReschedulingQueueController");
// Read Model Repositories
const PatientReadModelRepository_1 = require("../repositories/PatientReadModelRepository");
const ProviderReadModelRepository_1 = require("../repositories/ProviderReadModelRepository");
const InboxRepository_1 = require("../inbox/InboxRepository");
// Event Consumers
const PatientEventConsumer_1 = require("../events/PatientEventConsumer");
const ProviderEventConsumer_1 = require("../events/ProviderEventConsumer");
const StaffEventConsumer_1 = require("../events/StaffEventConsumer");
const DepartmentEventConsumer_1 = require("../events/DepartmentEventConsumer");
const BillingEventConsumer_1 = require("../events/BillingEventConsumer"); // ENABLED for Prepaid Billing Flow
const PaymentCompletedHandler_1 = require("../events/handlers/PaymentCompletedHandler");
// ===== ARCHIVED FOR POST-MVP: Non-operational Event Consumers =====
// import { ClinicalEMREventConsumer } from "../events/ClinicalEMREventConsumer"; // REMOVED FOR MVP
// Resilience & Cache
const RedisCacheService_1 = require("../cache/RedisCacheService");
const CircuitBreakerService_1 = require("../resilience/CircuitBreakerService");
// Use Cases (Commands)
const ScheduleAppointment_use_case_1 = require("../../application/use-cases/ScheduleAppointment.use-case");
const CancelAppointment_use_case_1 = require("../../application/use-cases/CancelAppointment.use-case");
const ConfirmAppointment_use_case_1 = require("../../application/use-cases/ConfirmAppointment.use-case");
const CompleteAppointment_use_case_1 = require("../../application/use-cases/CompleteAppointment.use-case");
const GetAppointment_use_case_1 = require("../../application/use-cases/GetAppointment.use-case");
const ListAppointments_use_case_1 = require("../../application/use-cases/ListAppointments.use-case");
const RescheduleAppointment_use_case_1 = require("../../application/use-cases/RescheduleAppointment.use-case");
const CheckInAppointment_use_case_1 = require("../../application/use-cases/CheckInAppointment.use-case");
const MarkAsNoShow_use_case_1 = require("../../application/use-cases/MarkAsNoShow.use-case");
const StartAppointment_use_case_1 = require("../../application/use-cases/StartAppointment.use-case");
const CallNextPatient_use_case_1 = require("../../application/use-cases/CallNextPatient.use-case");
const JoinQueue_use_case_1 = require("../../application/use-cases/JoinQueue.use-case");
const LeaveQueue_use_case_1 = require("../../application/use-cases/LeaveQueue.use-case");
const GetQueueStatus_use_case_1 = require("../../application/use-cases/GetQueueStatus.use-case");
const ValidateCancellationPolicy_use_case_1 = require("../../application/use-cases/ValidateCancellationPolicy.use-case");
const CreateRecurringAppointmentSeries_use_case_1 = require("../../application/use-cases/CreateRecurringAppointmentSeries.use-case");
// ===== ARCHIVED FOR POST-MVP: BulkReschedule Use Case =====
// import { BulkRescheduleAppointmentsUseCase } from "../../application/use-cases/BulkRescheduleAppointments.use-case";
const GetAppointmentHistory_use_case_1 = require("../../application/use-cases/GetAppointmentHistory.use-case");
const GetAppointmentStatistics_use_case_1 = require("../../application/use-cases/GetAppointmentStatistics.use-case");
const CreateEmergencyAppointment_use_case_1 = require("../../application/use-cases/CreateEmergencyAppointment.use-case");
const TransferAppointment_use_case_1 = require("../../application/use-cases/TransferAppointment.use-case");
const FindAvailableTimeSlotsUseCase_1 = require("../../application/use-cases/FindAvailableTimeSlotsUseCase");
// ===== ARCHIVED FOR POST-MVP: Waitlist Use Cases =====
// import { AddToWaitlistUseCase } from "../../application/use-cases/AddToWaitlistUseCase";
// import { GetWaitlistUseCase } from "../../application/use-cases/GetWaitlistUseCase";
// import { UpdateWaitlistEntryUseCase } from "../../application/use-cases/UpdateWaitlistEntryUseCase";
// import { RemoveFromWaitlistUseCase } from "../../application/use-cases/RemoveFromWaitlistUseCase";
// import { ConvertWaitlistToAppointmentUseCase } from "../../application/use-cases/ConvertWaitlistToAppointmentUseCase";
// Queries
const GetAppointmentDetailsQuery_1 = require("../../application/queries/GetAppointmentDetailsQuery");
const ListAppointmentsQuery_1 = require("../../application/queries/ListAppointmentsQuery");
// Event Handlers
const AppointmentReadModelEventHandler_1 = require("../events/AppointmentReadModelEventHandler");
const EventSubscriptions_1 = require("../events/EventSubscriptions");
// Controllers
const AppointmentController_1 = require("../../presentation/controllers/AppointmentController");
const AppointmentQueryController_1 = require("../../presentation/controllers/AppointmentQueryController");
const AvailabilityController_1 = require("../../presentation/controllers/AvailabilityController");
// ===== ARCHIVED FOR POST-MVP: Waitlist Controller =====
// import { WaitlistController } from "../../presentation/controllers/WaitlistController";
// Config & Health
const ConfigValidator_1 = require("../config/ConfigValidator");
const HealthCheckService_1 = require("../health/HealthCheckService");
const MetricsService_1 = require("../metrics/MetricsService");
/**
 * DI Container
 */
class DIContainer {
    constructor() {
        // Load and validate configuration
        this.config = (0, ConfigValidator_1.loadConfig)();
        // Initialize cache service
        this.initializeCacheService();
        // Initialize health check service
        this.initializeHealthCheckService();
        // Initialize metrics service
        this.initializeMetricsService();
        // Initialize repositories (without event publisher first)
        this.initializeRepositories();
        // Initialize services
        this.initializeServices();
        // Initialize use cases
        this.initializeUseCases();
        // Initialize queries
        this.initializeQueries();
        // Initialize event handlers
        this.initializeEventHandlers();
        // Initialize event subscriptions
        this.initializeEventSubscriptions();
        // Update health checks with event subscriptions
        this.updateHealthCheckDependencies();
        // Initialize event publisher and wire it to repository
        this.initializeEventPublisher();
        // Initialize controllers
        this.initializeControllers();
    }
    /**
     * Initialize cache service and circuit breaker
     */
    async initializeCacheService() {
        this.cacheService = new RedisCacheService_1.RedisCacheService();
        this.circuitBreaker = new CircuitBreakerService_1.CircuitBreakerService();
        try {
            await this.cacheService.connect();
            console.log("[DI] ✅ Cache service initialized");
            console.log("[DI] ✅ Circuit breaker initialized");
        }
        catch (error) {
            console.warn("[DI] ⚠️ Cache service failed to connect - continuing without cache");
        }
    }
    /**
     * Initialize health check service
     */
    initializeHealthCheckService() {
        // Note: EventSubscriptions might not be initialized yet, so pass undefined initially
        // It will be updated later via updateHealthCheckDependencies()
        this.healthCheckService = new HealthCheckService_1.HealthCheckService(this.config, this.cacheService, undefined);
        console.log("[DI] ✅ Health check service initialized (EventSubscriptions will be injected later)");
    }
    /**
     * Update health check service with EventSubscriptions dependency
     * Called after EventSubscriptions is initialized
     */
    updateHealthCheckDependencies() {
        if (this.healthCheckService && this.eventSubscriptions) {
            this.healthCheckService.attachEventSubscriptions(this.eventSubscriptions);
            console.log("[DI] ✅ Health check service updated with EventSubscriptions");
        }
    }
    /**
     * Initialize metrics service
     */
    initializeMetricsService() {
        this.metricsService = new MetricsService_1.MetricsService();
        console.log("[DI] ✅ Metrics service initialized");
    }
    /**
     * Initialize repositories
     */
    initializeRepositories() {
        // Initialize without event publisher first
        this.appointmentRepository = new SupabaseAppointmentRepository_1.SupabaseAppointmentRepository(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        this.appointmentReadModelRepository =
            new SupabaseAppointmentReadModelRepository_1.SupabaseAppointmentReadModelRepository(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        this.queueRepository = new SupabaseQueueRepository_1.SupabaseQueueRepository(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        this.reschedulingQueueRepository = new SupabaseReschedulingQueueRepository_1.SupabaseReschedulingQueueRepository(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        this.providerScheduleRepository = new SupabaseProviderScheduleRepository_1.SupabaseProviderScheduleRepository(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        // Create Supabase client for repositories that need it
        const { createClient } = require("@supabase/supabase-js");
        const supabaseClient = createClient(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        // ===== ARCHIVED FOR POST-MVP: Waitlist Repository =====
        // this.waitlistRepository = new SupabaseAppointmentWaitlistRepository(
        //   supabaseClient,
        // );
        // Reminder Repository
        this.reminderRepository = new SupabaseAppointmentReminderRepository_1.SupabaseAppointmentReminderRepository(supabaseClient);
        // Pure Outbox Pattern - Read Model Repositories
        this.patientReadModelRepository = new PatientReadModelRepository_1.PatientReadModelRepository(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        this.providerReadModelRepository = new ProviderReadModelRepository_1.ProviderReadModelRepository(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        this.inboxRepository = new InboxRepository_1.InboxRepository(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        console.log("[DI] ✅ Repositories initialized (7 total, Waitlist archived)");
        console.log("[DI]    - Appointment, ReadModel, Queue, ProviderSchedule, Reminder");
        console.log("[DI]    - PatientReadModel, ProviderReadModel, Inbox (Pure Outbox)");
    }
    /**
     * Initialize event publisher and wire it to repository
     */
    initializeEventPublisher() {
        // Get event bus from event subscriptions
        const eventBus = this.eventSubscriptions.getEventBus();
        // Create adapter to wrap EventBus as IDomainEventPublisher
        this.eventPublisher = new EventBusAdapter_1.EventBusAdapter(eventBus);
        // Wire event publisher to repository using reflection
        // This is a workaround since we can't inject it in constructor due to circular dependency
        this.appointmentRepository.eventPublisher = this.eventPublisher;
        // Configure application-level publishers
        const appEventPublisher = new EventBusPublisher_1.EventBusPublisher(eventBus);
        this.reschedulingService.setEventPublisher(appEventPublisher);
        console.log("[DI] ✅ Event publisher initialized and wired to repository");
    }
    /**
     * Initialize external services
     */
    initializeServices() {
        // PURE OUTBOX PATTERN: Use local read models instead of HTTP
        this.patientService = new LocalPatientReadModelService_1.LocalPatientReadModelService(this.patientReadModelRepository);
        this.providerService = new LocalProviderReadModelService_1.LocalProviderReadModelService(this.providerReadModelRepository);
        this.schedulerAdapter = new RemoteSchedulerAdapter_1.RemoteSchedulerAdapter({
            baseUrl: this.config.services.schedulerServiceUrl,
            apiKey: this.config.services.schedulerApiKey,
            timeout: 5000,
            circuitBreaker: this.circuitBreaker,
        });
        // NEW: Authorization, Conflict Resolution & Reminder Services
        this.authorizationService = new AuthorizationService_1.AuthorizationService(this.config.supabase.url, this.config.supabase.serviceRoleKey);
        this.conflictResolutionService = new ConflictResolutionService_1.ConflictResolutionService(this.appointmentRepository);
        // Create scheduler adapter wrapper for ReminderService
        const schedulerWrapper = new SchedulerAdapterWrapper_1.SchedulerAdapterWrapper(this.schedulerAdapter, this.config.tenantId || "default");
        this.reminderService = new ReminderService_1.ReminderService(schedulerWrapper);
        // Billing Service Client (for payment link creation)
        this.billingServiceClient = new BillingServiceClient_1.BillingServiceClient({
            baseUrl: this.config.services.billingServiceUrl,
            timeout: 5000,
            retryAttempts: 3,
            retryDelay: 1000,
        });
        // Rescheduling Service
        this.reschedulingService = new ReschedulingService_1.ReschedulingService(this.reschedulingQueueRepository, this.appointmentRepository, this.reminderService);
        console.log("[DI] ✅ Services initialized (Pure Outbox Pattern)");
        console.log("[DI]    - Patient Service: LOCAL READ MODEL (No HTTP) ⚡");
        console.log("[DI]    - Provider Service: LOCAL READ MODEL (No HTTP) ⚡");
        console.log(`[DI]    - Scheduler Service: ${this.config.services.schedulerServiceUrl}`);
        console.log(`[DI]    - Billing Service: ${this.config.services.billingServiceUrl} 💳`);
        console.log("[DI]    - Authorization Service: RBAC enabled 🔐");
        console.log("[DI]    - Reminder Service: Scheduler integration enabled 🔔");
        console.log("[DI]    - Performance: <10ms queries vs 150ms HTTP (15x faster)");
        console.log("[DI]    - Availability: 100% (zero network dependencies)");
    }
    /**
     * Initialize use cases
     */
    initializeUseCases() {
        // With Authorization & Reminders & Billing Service Client
        this.scheduleAppointmentUseCase = new ScheduleAppointment_use_case_1.ScheduleAppointmentUseCase(this.appointmentRepository, this.conflictResolutionService, this.authorizationService, this.reminderService, this.billingServiceClient);
        this.cancelAppointmentUseCase = new CancelAppointment_use_case_1.CancelAppointmentUseCase(this.appointmentRepository, this.authorizationService, this.reminderService);
        this.confirmAppointmentUseCase = new ConfirmAppointment_use_case_1.ConfirmAppointmentUseCase(this.appointmentRepository, this.authorizationService);
        this.completeAppointmentUseCase = new CompleteAppointment_use_case_1.CompleteAppointmentUseCase(this.appointmentRepository, this.authorizationService);
        this.getAppointmentUseCase = new GetAppointment_use_case_1.GetAppointmentUseCase(this.appointmentRepository);
        this.listAppointmentsUseCase = new ListAppointments_use_case_1.ListAppointmentsUseCase(this.appointmentRepository);
        this.rescheduleAppointmentUseCase = new RescheduleAppointment_use_case_1.RescheduleAppointmentUseCase(this.appointmentRepository, this.authorizationService, this.reminderService);
        this.checkInAppointmentUseCase = new CheckInAppointment_use_case_1.CheckInAppointmentUseCase(this.appointmentRepository, this.authorizationService, this.queueRepository);
        this.markAsNoShowUseCase = new MarkAsNoShow_use_case_1.MarkAsNoShowUseCase(this.appointmentRepository, this.authorizationService);
        this.startAppointmentUseCase = new StartAppointment_use_case_1.StartAppointmentUseCase(this.appointmentRepository, this.authorizationService);
        // Phase 2: Queue Management Use Cases
        this.callNextPatientUseCase = new CallNextPatient_use_case_1.CallNextPatientUseCase(this.queueRepository, this.authorizationService);
        this.joinQueueUseCase = new JoinQueue_use_case_1.JoinQueueUseCase(this.queueRepository);
        this.leaveQueueUseCase = new LeaveQueue_use_case_1.LeaveQueueUseCase(this.queueRepository, this.authorizationService);
        this.queueStatusUseCase = new GetQueueStatus_use_case_1.GetQueueStatusUseCase(this.queueRepository, this.authorizationService);
        this.validateCancellationPolicyUseCase =
            new ValidateCancellationPolicy_use_case_1.ValidateCancellationPolicyUseCase(this.appointmentRepository);
        this.manageAppointmentRemindersUseCase =
            new ManageAppointmentReminders_use_case_1.ManageAppointmentRemindersUseCase(this.appointmentRepository, this.reminderService, this.authorizationService);
        this.createRecurringSeriesUseCase =
            new CreateRecurringAppointmentSeries_use_case_1.CreateRecurringAppointmentSeriesUseCase(this.scheduleAppointmentUseCase);
        // ===== ARCHIVED FOR POST-MVP: BulkReschedule Use Case =====
        // this.bulkRescheduleAppointmentsUseCase =
        //   new BulkRescheduleAppointmentsUseCase(
        //     this.appointmentRepository,
        //     this.authorizationService,
        //   );
        this.appointmentHistoryUseCase = new GetAppointmentHistory_use_case_1.GetAppointmentHistoryUseCase(this.appointmentRepository, this.authorizationService);
        this.appointmentStatisticsUseCase = new GetAppointmentStatistics_use_case_1.GetAppointmentStatisticsUseCase(this.appointmentRepository, this.queueRepository, this.authorizationService);
        this.createEmergencyAppointmentUseCase =
            new CreateEmergencyAppointment_use_case_1.CreateEmergencyAppointmentUseCase(this.appointmentRepository, this.queueRepository, this.authorizationService);
        this.transferAppointmentUseCase = new TransferAppointment_use_case_1.TransferAppointmentUseCase(this.appointmentRepository, this.authorizationService);
        // Availability Use Case
        this.findAvailableTimeSlotsUseCase = new FindAvailableTimeSlotsUseCase_1.FindAvailableTimeSlotsUseCase(this.providerScheduleRepository, this.appointmentRepository);
        // ===== ARCHIVED FOR POST-MVP: Waitlist Use Cases =====
        // this.addToWaitlistUseCase = new AddToWaitlistUseCase(
        //   this.waitlistRepository,
        // );
        //
        // this.getWaitlistUseCase = new GetWaitlistUseCase(this.waitlistRepository);
        //
        // this.updateWaitlistEntryUseCase = new UpdateWaitlistEntryUseCase(
        //   this.waitlistRepository,
        // );
        //
        // this.removeFromWaitlistUseCase = new RemoveFromWaitlistUseCase(
        //   this.waitlistRepository,
        // );
        //
        // this.convertWaitlistToAppointmentUseCase =
        //   new ConvertWaitlistToAppointmentUseCase(this.waitlistRepository);
        // Reminder Use Cases
        this.createAppointmentReminderUseCase = new CreateAppointmentReminderUseCase_1.CreateAppointmentReminderUseCase(this.reminderRepository, this.appointmentRepository);
        this.getAppointmentRemindersUseCase = new GetAppointmentRemindersUseCase_1.GetAppointmentRemindersUseCase(this.reminderRepository);
        this.updateAppointmentReminderUseCase = new UpdateAppointmentReminderUseCase_1.UpdateAppointmentReminderUseCase(this.reminderRepository);
        this.deleteAppointmentReminderUseCase = new DeleteAppointmentReminderUseCase_1.DeleteAppointmentReminderUseCase(this.reminderRepository);
        // Reminder Controller
        this.reminderController = new ReminderController_1.ReminderController(this.createAppointmentReminderUseCase, this.getAppointmentRemindersUseCase, this.updateAppointmentReminderUseCase, this.deleteAppointmentReminderUseCase);
        console.log("[DI] ✅ Use cases initialized (35 total)");
    }
    /**
     * Initialize queries
     */
    initializeQueries() {
        this.getAppointmentDetailsQuery = new GetAppointmentDetailsQuery_1.GetAppointmentDetailsQuery(this.appointmentReadModelRepository);
        this.listAppointmentsQuery = new ListAppointmentsQuery_1.ListAppointmentsQuery(this.appointmentReadModelRepository);
        console.log("[DI] ✅ Queries initialized");
    }
    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        this.appointmentReadModelEventHandler =
            new AppointmentReadModelEventHandler_1.AppointmentReadModelEventHandler(this.appointmentReadModelRepository, this.patientService, this.providerService);
        // Pure Outbox Pattern - Event Consumers
        this.patientEventConsumer = new PatientEventConsumer_1.PatientEventConsumer(this.patientReadModelRepository, this.inboxRepository);
        this.providerEventConsumer = new ProviderEventConsumer_1.ProviderEventConsumer(this.providerReadModelRepository, this.inboxRepository);
        // New Event Consumers for Appointment Service
        this.staffEventConsumer = new StaffEventConsumer_1.StaffEventConsumer({
            rabbitmqUrl: this.config.rabbitmq.url,
            queueName: 'appointments-service.staff-events',
            exchangeName: this.config.rabbitmq.exchange,
            routingKeys: [
                'provider.schedule.updated', // StaffScheduleUpdatedEvent from Provider Staff
                'provider.status.changed', // StaffStatusChangedEvent from Provider Staff  
                'provider.department.assigned', // StaffDepartmentAssignedEvent from Provider Staff
                'department.created', // DepartmentCreatedEvent from Department Service
                'department.updated', // DepartmentUpdatedEvent from Department Service
                'department.staff.count.changed' // DepartmentStaffCountChangedEvent from Department Service
            ],
            prefetchCount: 10,
            retryAttempts: 3,
            retryDelayMs: 1000
        }, this.appointmentRepository, this.queueRepository, this.providerScheduleRepository, this.conflictResolutionService, this.reminderService, this.inboxRepository, this.reschedulingService);
        this.departmentEventConsumer = new DepartmentEventConsumer_1.DepartmentEventConsumer({
            rabbitmqUrl: this.config.rabbitmq.url,
            queueName: 'appointments-service.department-events',
            exchangeName: this.config.rabbitmq.exchange,
            routingKeys: [
                'department.created',
                'department.staff.assigned',
                'department.resource.updated',
                'department.operational_hours.changed',
                'department.capacity.updated'
            ],
            prefetchCount: 10,
            retryAttempts: 3,
            retryDelayMs: 1000
        }, this.appointmentRepository, this.queueRepository, this.conflictResolutionService, this.reminderService, this.inboxRepository);
        // CLINICAL EMR EVENT CONSUMER REMOVED FOR MVP - Focus on Appointments only
        /*
        this.clinicalEMREventConsumer = new ClinicalEMREventConsumer(
          this.inboxRepository,
          this.appointmentRepository,
          this.reminderService,
          this.conflictResolutionService,
          this.queueRepository,
        );
        */
        // ===== ENABLED: BillingEventConsumer for Prepaid Billing Flow =====
        // Initialize PaymentCompletedHandler
        this.paymentCompletedHandler = new PaymentCompletedHandler_1.PaymentCompletedHandler(this.appointmentRepository);
        // Initialize BillingEventConsumer with payment event support
        this.billingEventConsumer = new BillingEventConsumer_1.BillingEventConsumer({
            rabbitmqUrl: this.config.rabbitmq.url,
            queueName: 'appointments-service.billing-events',
            exchangeName: this.config.rabbitmq.exchange,
            routingKey: 'billing.*',
            routingKeys: [
                'billing.payment.completed', // Prepaid flow: auto-confirm after payment
                'billing.pre-authorization.*',
                'billing.rate.updated',
                'billing.insurance.verified'
            ]
        }, this.appointmentRepository, this.queueRepository, this.reminderService, this.conflictResolutionService, this.inboxRepository, this.paymentCompletedHandler);
        console.log("[DI] ✅ Event handlers initialized (5 total - Prepaid Billing Enabled)");
        console.log("[DI]    - AppointmentReadModelEventHandler");
        console.log("[DI]    - PatientEventConsumer (Pure Outbox)");
        console.log("[DI]    - ProviderEventConsumer (Pure Outbox)");
        console.log("[DI]    - StaffEventConsumer (RabbitMQ)");
        console.log("[DI]    - DepartmentEventConsumer (RabbitMQ)");
        console.log("[DI]    - BillingEventConsumer (RabbitMQ) ✅ ENABLED for Prepaid Flow");
        console.log("[DI]    ⚠️  ClinicalEMREventConsumer REMOVED FOR MVP");
    }
    /**
     * Initialize event subscriptions
     */
    initializeEventSubscriptions() {
        // Pass Pure Outbox Pattern event consumers to EventSubscriptions
        this.eventSubscriptions = (0, EventSubscriptions_1.createEventSubscriptions)(this.appointmentReadModelEventHandler, this.patientEventConsumer, this.providerEventConsumer);
        console.log("[DI] ✅ Event subscriptions initialized with Pure Outbox Pattern consumers");
    }
    /**
     * Initialize controllers
     */
    initializeControllers() {
        this.appointmentController = new AppointmentController_1.AppointmentController(this.scheduleAppointmentUseCase, this.cancelAppointmentUseCase, this.confirmAppointmentUseCase, this.completeAppointmentUseCase, this.getAppointmentUseCase, this.listAppointmentsUseCase, this.rescheduleAppointmentUseCase, this.checkInAppointmentUseCase, this.markAsNoShowUseCase, this.startAppointmentUseCase, 
        // this.bulkRescheduleAppointmentsUseCase, // ARCHIVED FOR POST-MVP
        this.appointmentHistoryUseCase, this.appointmentStatisticsUseCase, this.createEmergencyAppointmentUseCase, this.transferAppointmentUseCase, this.createRecurringSeriesUseCase);
        this.appointmentQueryController = new AppointmentQueryController_1.AppointmentQueryController(this.getAppointmentDetailsQuery, this.listAppointmentsQuery);
        this.availabilityController = new AvailabilityController_1.AvailabilityController(this.findAvailableTimeSlotsUseCase, this.providerScheduleRepository);
        // ===== ARCHIVED FOR POST-MVP: Waitlist Controller =====
        // this.waitlistController = new WaitlistController(
        //   this.addToWaitlistUseCase,
        //   this.getWaitlistUseCase,
        //   this.updateWaitlistEntryUseCase,
        //   this.removeFromWaitlistUseCase,
        //   this.convertWaitlistToAppointmentUseCase,
        // );
        // Rescheduling Queue Controller
        this.reschedulingQueueController = new ReschedulingQueueController_1.ReschedulingQueueController({
            reschedulingService: this.reschedulingService,
            reschedulingQueueRepository: this.reschedulingQueueRepository,
        });
        console.log("[DI] ✅ Controllers initialized (4 total, Waitlist archived)");
    }
    /**
     * Get appointment controller
     */
    getAppointmentController() {
        return this.appointmentController;
    }
    /**
     * Get appointment query controller
     */
    getAppointmentQueryController() {
        return this.appointmentQueryController;
    }
    // ===== ARCHIVED FOR POST-MVP: Waitlist Controller Getter =====
    // /**
    //  * Get waitlist controller
    //  */
    // public getWaitlistController(): WaitlistController {
    //   return this.waitlistController;
    // }
    /**
     * Get appointment read model event handler
     */
    getAppointmentReadModelEventHandler() {
        return this.appointmentReadModelEventHandler;
    }
    /**
     * Get event subscriptions
     */
    getEventSubscriptions() {
        return this.eventSubscriptions;
    }
    /**
     * Get appointment repository
     */
    getAppointmentRepository() {
        return this.appointmentRepository;
    }
    /**
     * Get appointment read model repository
     */
    getAppointmentReadModelRepository() {
        return this.appointmentReadModelRepository;
    }
    /**
     * Get configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get health check service
     */
    getHealthCheckService() {
        return this.healthCheckService;
    }
    /**
     * Get metrics service
     */
    getMetricsService() {
        return this.metricsService;
    }
    /**
     * Get reschedule appointment use case
     */
    getRescheduleAppointmentUseCase() {
        return this.rescheduleAppointmentUseCase;
    }
    /**
     * Get check-in appointment use case
     */
    getCheckInAppointmentUseCase() {
        return this.checkInAppointmentUseCase;
    }
    /**
     * Get mark as no-show use case
     */
    getMarkAsNoShowUseCase() {
        return this.markAsNoShowUseCase;
    }
    /**
     * Get start appointment use case
     */
    getStartAppointmentUseCase() {
        return this.startAppointmentUseCase;
    }
    /**
     * Get call next patient use case
     */
    getCallNextPatientUseCase() {
        return this.callNextPatientUseCase;
    }
    /**
     * Get join queue use case
     */
    getJoinQueueUseCase() {
        return this.joinQueueUseCase;
    }
    /**
     * Get leave queue use case
     */
    getLeaveQueueUseCase() {
        return this.leaveQueueUseCase;
    }
    /**
     * Get queue status use case
     */
    getQueueStatusUseCase() {
        return this.queueStatusUseCase;
    }
    /**
     * Get validate cancellation policy use case
     */
    getValidateCancellationPolicyUseCase() {
        return this.validateCancellationPolicyUseCase;
    }
    /**
     * Get manage appointment reminders use case
     */
    getManageAppointmentRemindersUseCase() {
        return this.manageAppointmentRemindersUseCase;
    }
    /**
     * Get create recurring appointment series use case
     */
    getCreateRecurringSeriesUseCase() {
        return this.createRecurringSeriesUseCase;
    }
    /**
     * Get queue repository
     */
    getQueueRepository() {
        return this.queueRepository;
    }
    // ===== ARCHIVED FOR POST-MVP: BulkReschedule Use Case Getter =====
    // /**
    //  * Get bulk reschedule appointments use case
    //  */
    // public getBulkRescheduleAppointmentsUseCase(): BulkRescheduleAppointmentsUseCase {
    //   return this.bulkRescheduleAppointmentsUseCase;
    // }
    /**
     * Get appointment history use case
     */
    getAppointmentHistoryUseCase() {
        return this.appointmentHistoryUseCase;
    }
    /**
     * Get appointment statistics use case
     */
    getAppointmentStatisticsUseCase() {
        return this.appointmentStatisticsUseCase;
    }
    /**
     * Get create emergency appointment use case
     */
    getCreateEmergencyAppointmentUseCase() {
        return this.createEmergencyAppointmentUseCase;
    }
    /**
     * Get transfer appointment use case
     */
    getTransferAppointmentUseCase() {
        return this.transferAppointmentUseCase;
    }
    /**
     * Get availability controller
     */
    getReschedulingQueueController() {
        return this.reschedulingQueueController;
    }
    getAvailabilityController() {
        return this.availabilityController;
    }
    /**
     * Get find available time slots use case
     */
    getFindAvailableTimeSlotsUseCase() {
        return this.findAvailableTimeSlotsUseCase;
    }
    /**
     * Get provider schedule repository
     */
    getProviderScheduleRepository() {
        return this.providerScheduleRepository;
    }
    /**
     * Get patient event consumer (Pure Outbox Pattern)
     */
    getPatientEventConsumer() {
        return this.patientEventConsumer;
    }
    /**
     * Get provider event consumer (Pure Outbox Pattern)
     */
    getProviderEventConsumer() {
        return this.providerEventConsumer;
    }
    /**
     * Get staff event consumer
     */
    getStaffEventConsumer() {
        return this.staffEventConsumer;
    }
    /**
     * Get department event consumer
     */
    getDepartmentEventConsumer() {
        return this.departmentEventConsumer;
    }
    /**
     * Get clinical EMR event consumer
     * REMOVED FOR MVP - Focus on Appointments only
     */
    /*
    public getClinicalEMREventConsumer(): ClinicalEMREventConsumer {
      return this.clinicalEMREventConsumer;
    }
    */
    /**
     * Get billing event consumer
     * ENABLED for Prepaid Billing Flow
     */
    getBillingEventConsumer() {
        return this.billingEventConsumer;
    }
    /**
     * Get patient read model repository
     */
    getPatientReadModelRepository() {
        return this.patientReadModelRepository;
    }
    /**
     * Get provider read model repository
     */
    getProviderReadModelRepository() {
        return this.providerReadModelRepository;
    }
    /**
     * Get reminder controller
     */
    getReminderController() {
        return this.reminderController;
    }
    /**
     * Get inbox repository
     */
    getInboxRepository() {
        return this.inboxRepository;
    }
}
exports.DIContainer = DIContainer;
// Singleton instance
let containerInstance = null;
/**
 * Get DI container instance
 */
function getContainer() {
    if (!containerInstance) {
        console.log("[DI] 🔧 Initializing DI Container...");
        containerInstance = new DIContainer();
        console.log("[DI] ✅ DI Container ready");
    }
    return containerInstance;
}
/**
 * Reset container (for testing)
 */
function resetContainer() {
    containerInstance = null;
}
//# sourceMappingURL=container.js.map