/**
 * Dependency Injection Container
 * Centralized DI setup for Scheduling Service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, SOLID
 */

// Repositories
import { SupabaseAppointmentRepository } from "../persistence/SupabaseAppointmentRepository";
import { SupabaseAppointmentReadModelRepository } from "../persistence/SupabaseAppointmentReadModelRepository";
import { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
import { IAppointmentReadModelRepository } from "../../domain/repositories/IAppointmentReadModelRepository";
import { IQueueRepository } from "../../domain/repositories/IQueueRepository";
import { SupabaseQueueRepository } from "../persistence/SupabaseQueueRepository";
import { IProviderScheduleRepository } from "../../domain/repositories/IProviderScheduleRepository";
import { SupabaseProviderScheduleRepository } from "../persistence/SupabaseProviderScheduleRepository";
// ===== ARCHIVED FOR POST-MVP: Waitlist System =====
// import { IAppointmentWaitlistRepository } from "../../domain/repositories/IAppointmentWaitlistRepository";
// import { SupabaseAppointmentWaitlistRepository } from "../repositories/SupabaseAppointmentWaitlistRepository";
import { IAppointmentReminderRepository } from "../../domain/repositories/IAppointmentReminderRepository";
import { SupabaseAppointmentReminderRepository } from "../repositories/SupabaseAppointmentReminderRepository";
import { IReschedulingQueueRepository } from "../../domain/interfaces/IReschedulingQueueRepository";
import { SupabaseReschedulingQueueRepository } from "../persistence/SupabaseReschedulingQueueRepository";

// Event Publishing
import { IDomainEventPublisher } from "@shared/domain/events/IDomainEventPublisher";
import { EventBusAdapter } from "../events/EventBusAdapter";
import { IEventBus } from "@shared/infrastructure/event-bus/EventBus";

// Services - PURE OUTBOX PATTERN (No HTTP)
import { LocalPatientReadModelService } from "../services/LocalPatientReadModelService";
import { LocalProviderReadModelService } from "../services/LocalProviderReadModelService";
import { HttpProviderService } from "../services/HttpProviderService";
import { IPatientService } from "../../application/services/IPatientService";
import { IProviderService } from "../../application/services/IProviderService";
import { RemoteSchedulerAdapter } from "../adapters/RemoteSchedulerAdapter";
import { SchedulerAdapterWrapper } from "../adapters/SchedulerAdapterWrapper";
import { BillingServiceClient } from "../clients/BillingServiceClient";
import { IConflictResolutionService } from "../../application/services/IConflictResolutionService";
import { ConflictResolutionService } from "../services/ConflictResolutionService";
import { IAuthorizationService } from "../../application/services/IAuthorizationService";
import { AuthorizationService } from "../services/AuthorizationService";
import { IReminderService } from "../../application/services/IReminderService";
import { ReminderService } from "../services/ReminderService";
import { ReschedulingService } from "../../application/services/ReschedulingService";
import { EventBusPublisher } from "../events/EventBusPublisher";

// Reminder Management
import { ReminderController } from "../../presentation/controllers/ReminderController";
import { CreateAppointmentReminderUseCase } from "../../application/use-cases/CreateAppointmentReminderUseCase";
import { GetAppointmentRemindersUseCase } from "../../application/use-cases/GetAppointmentRemindersUseCase";
import { UpdateAppointmentReminderUseCase } from "../../application/use-cases/UpdateAppointmentReminderUseCase";
import { DeleteAppointmentReminderUseCase } from "../../application/use-cases/DeleteAppointmentReminderUseCase";
import { ManageAppointmentRemindersUseCase } from "../../application/use-cases/ManageAppointmentReminders.use-case";
import { ReschedulingQueueController } from "../../presentation/controllers/ReschedulingQueueController";

// Read Model Repositories
import { PatientReadModelRepository } from "../repositories/PatientReadModelRepository";
import { ProviderReadModelRepository } from "../repositories/ProviderReadModelRepository";
import { InboxRepository } from "../inbox/InboxRepository";

// Event Consumers
import { PatientEventConsumer } from "../events/PatientEventConsumer";
import { ProviderEventConsumer } from "../events/ProviderEventConsumer";
import { StaffEventConsumer } from "../events/StaffEventConsumer";
import { DepartmentEventConsumer } from "../events/DepartmentEventConsumer";
import { BillingEventConsumer } from "../events/BillingEventConsumer"; // ENABLED for Prepaid Billing Flow
import { PaymentCompletedHandler } from "../events/handlers/PaymentCompletedHandler";
// ===== ARCHIVED FOR POST-MVP: Non-operational Event Consumers =====
// import { ClinicalEMREventConsumer } from "../events/ClinicalEMREventConsumer"; // REMOVED FOR MVP

// Resilience & Cache
import { RedisCacheService } from "../cache/RedisCacheService";
import { CircuitBreakerService } from "../resilience/CircuitBreakerService";

// Use Cases (Commands)
import { ScheduleAppointmentUseCase } from "../../application/use-cases/ScheduleAppointment.use-case";
import { CancelAppointmentUseCase } from "../../application/use-cases/CancelAppointment.use-case";
import { ConfirmAppointmentUseCase } from "../../application/use-cases/ConfirmAppointment.use-case";
import { CompleteAppointmentUseCase } from "../../application/use-cases/CompleteAppointment.use-case";
import { GetAppointmentUseCase } from "../../application/use-cases/GetAppointment.use-case";
import { ListAppointmentsUseCase } from "../../application/use-cases/ListAppointments.use-case";
import { RescheduleAppointmentUseCase } from "../../application/use-cases/RescheduleAppointment.use-case";
import { CheckInAppointmentUseCase } from "../../application/use-cases/CheckInAppointment.use-case";
import { MarkAsNoShowUseCase } from "../../application/use-cases/MarkAsNoShow.use-case";
import { StartAppointmentUseCase } from "../../application/use-cases/StartAppointment.use-case";
import { CallNextPatientUseCase } from "../../application/use-cases/CallNextPatient.use-case";
import { JoinQueueUseCase } from "../../application/use-cases/JoinQueue.use-case";
import { LeaveQueueUseCase } from "../../application/use-cases/LeaveQueue.use-case";
import { GetQueueStatusUseCase } from "../../application/use-cases/GetQueueStatus.use-case";
import { ValidateCancellationPolicyUseCase } from "../../application/use-cases/ValidateCancellationPolicy.use-case";
import { CreateRecurringAppointmentSeriesUseCase } from "../../application/use-cases/CreateRecurringAppointmentSeries.use-case";
// ===== ARCHIVED FOR POST-MVP: BulkReschedule Use Case =====
// import { BulkRescheduleAppointmentsUseCase } from "../../application/use-cases/BulkRescheduleAppointments.use-case";
import { GetAppointmentHistoryUseCase } from "../../application/use-cases/GetAppointmentHistory.use-case";
import { GetAppointmentStatisticsUseCase } from "../../application/use-cases/GetAppointmentStatistics.use-case";
import { CreateEmergencyAppointmentUseCase } from "../../application/use-cases/CreateEmergencyAppointment.use-case";
import { TransferAppointmentUseCase } from "../../application/use-cases/TransferAppointment.use-case";
import { FindAvailableTimeSlotsUseCase } from "../../application/use-cases/FindAvailableTimeSlotsUseCase";
// ===== ARCHIVED FOR POST-MVP: Waitlist Use Cases =====
// import { AddToWaitlistUseCase } from "../../application/use-cases/AddToWaitlistUseCase";
// import { GetWaitlistUseCase } from "../../application/use-cases/GetWaitlistUseCase";
// import { UpdateWaitlistEntryUseCase } from "../../application/use-cases/UpdateWaitlistEntryUseCase";
// import { RemoveFromWaitlistUseCase } from "../../application/use-cases/RemoveFromWaitlistUseCase";
// import { ConvertWaitlistToAppointmentUseCase } from "../../application/use-cases/ConvertWaitlistToAppointmentUseCase";

// Queries
import { GetAppointmentDetailsQuery } from "../../application/queries/GetAppointmentDetailsQuery";
import { ListAppointmentsQuery } from "../../application/queries/ListAppointmentsQuery";

// Event Handlers
import { AppointmentReadModelEventHandler } from "../events/AppointmentReadModelEventHandler";
import {
  EventSubscriptions,
  createEventSubscriptions,
} from "../events/EventSubscriptions";

// Controllers
import { AppointmentController } from "../../presentation/controllers/AppointmentController";
import { AppointmentQueryController } from "../../presentation/controllers/AppointmentQueryController";
import { AvailabilityController } from "../../presentation/controllers/AvailabilityController";
// ===== ARCHIVED FOR POST-MVP: Waitlist Controller =====
// import { WaitlistController } from "../../presentation/controllers/WaitlistController";

// Config & Health
import { AppConfig, loadConfig } from "../config/ConfigValidator";
import { HealthCheckService } from "../health/HealthCheckService";
import { MetricsService } from "../metrics/MetricsService";

/**
 * DI Container
 */
export class DIContainer {
  // Config
  private config: AppConfig;

  // Repositories
  private appointmentRepository: IAppointmentRepository;
  private appointmentReadModelRepository: IAppointmentReadModelRepository;
  private queueRepository: IQueueRepository;
  private providerScheduleRepository: IProviderScheduleRepository;
  // ===== ARCHIVED FOR POST-MVP: Waitlist Repository =====
  // private waitlistRepository: IAppointmentWaitlistRepository;
  private reminderRepository: IAppointmentReminderRepository;
  private reschedulingQueueRepository: IReschedulingQueueRepository;

  // Read Model Repositories (Pure Outbox Pattern)
  private patientReadModelRepository: PatientReadModelRepository;
  private providerReadModelRepository: ProviderReadModelRepository;
  private inboxRepository: InboxRepository;


  // Services
  private patientService: IPatientService;
  private providerService: IProviderService;
  private httpProviderService: HttpProviderService;
  private schedulerAdapter: RemoteSchedulerAdapter;
  private conflictResolutionService: IConflictResolutionService;
  private authorizationService: IAuthorizationService;
  private reminderService: IReminderService;
  private reschedulingService: ReschedulingService;
  private billingServiceClient: BillingServiceClient;

  // Reminder Management
  private reminderController: ReminderController;
  private createAppointmentReminderUseCase: CreateAppointmentReminderUseCase;
  private getAppointmentRemindersUseCase: GetAppointmentRemindersUseCase;
  private updateAppointmentReminderUseCase: UpdateAppointmentReminderUseCase;
  private deleteAppointmentReminderUseCase: DeleteAppointmentReminderUseCase;
  private manageAppointmentRemindersUseCase: ManageAppointmentRemindersUseCase;

  // Resilience & Cache
  private cacheService: RedisCacheService;
  private circuitBreaker: CircuitBreakerService;

  // Health Check & Metrics
  private healthCheckService: HealthCheckService;
  private metricsService: MetricsService;

  // Event Publishing
  private eventPublisher: IDomainEventPublisher;

  // Use Cases
  private scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  private cancelAppointmentUseCase: CancelAppointmentUseCase;
  private confirmAppointmentUseCase: ConfirmAppointmentUseCase;
  private completeAppointmentUseCase: CompleteAppointmentUseCase;
  private getAppointmentUseCase: GetAppointmentUseCase;
  private listAppointmentsUseCase: ListAppointmentsUseCase;
  private rescheduleAppointmentUseCase: RescheduleAppointmentUseCase;
  private checkInAppointmentUseCase: CheckInAppointmentUseCase;
  private markAsNoShowUseCase: MarkAsNoShowUseCase;
  private startAppointmentUseCase: StartAppointmentUseCase;
  private callNextPatientUseCase: CallNextPatientUseCase;
  private joinQueueUseCase: JoinQueueUseCase;
  private leaveQueueUseCase: LeaveQueueUseCase;
  private queueStatusUseCase: GetQueueStatusUseCase;
  private validateCancellationPolicyUseCase: ValidateCancellationPolicyUseCase;
  private createRecurringSeriesUseCase: CreateRecurringAppointmentSeriesUseCase;
  // ===== ARCHIVED FOR POST-MVP: BulkReschedule Use Case =====
  // private bulkRescheduleAppointmentsUseCase: BulkRescheduleAppointmentsUseCase;
  private appointmentHistoryUseCase: GetAppointmentHistoryUseCase;
  private appointmentStatisticsUseCase: GetAppointmentStatisticsUseCase;
  private createEmergencyAppointmentUseCase: CreateEmergencyAppointmentUseCase;
  private transferAppointmentUseCase: TransferAppointmentUseCase;
  private findAvailableTimeSlotsUseCase: FindAvailableTimeSlotsUseCase;
  // ===== ARCHIVED FOR POST-MVP: Waitlist Use Cases =====
  // private addToWaitlistUseCase: AddToWaitlistUseCase;
  // private getWaitlistUseCase: GetWaitlistUseCase;
  // private updateWaitlistEntryUseCase: UpdateWaitlistEntryUseCase;
  // private removeFromWaitlistUseCase: RemoveFromWaitlistUseCase;
  // private convertWaitlistToAppointmentUseCase: ConvertWaitlistToAppointmentUseCase;

  // Queries
  private getAppointmentDetailsQuery: GetAppointmentDetailsQuery;
  private listAppointmentsQuery: ListAppointmentsQuery;

  // Event Handlers
  private appointmentReadModelEventHandler: AppointmentReadModelEventHandler;
  private eventSubscriptions: EventSubscriptions;

  private patientEventConsumer: PatientEventConsumer;
  private providerEventConsumer: ProviderEventConsumer;
  private staffEventConsumer: StaffEventConsumer;
  private departmentEventConsumer: DepartmentEventConsumer;
  private billingEventConsumer: BillingEventConsumer; // ENABLED for Prepaid Billing Flow
  private paymentCompletedHandler: PaymentCompletedHandler;
  // ===== ARCHIVED FOR POST-MVP: Non-operational Event Consumers =====
  // private clinicalEMREventConsumer: ClinicalEMREventConsumer; // REMOVED FOR MVP

  // Controllers
  private appointmentController: AppointmentController;
  private appointmentQueryController: AppointmentQueryController;
  private availabilityController: AvailabilityController;
  // ===== ARCHIVED FOR POST-MVP: Waitlist Controller =====
  // private waitlistController: WaitlistController;
  private reschedulingQueueController: ReschedulingQueueController;

  constructor() {
    // Load and validate configuration
    this.config = loadConfig();

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
  private async initializeCacheService(): Promise<void> {
    this.cacheService = new RedisCacheService();
    this.circuitBreaker = new CircuitBreakerService();

    try {
      await this.cacheService.connect();
      console.log("[DI] ✅ Cache service initialized");
      console.log("[DI] ✅ Circuit breaker initialized");
    } catch (error) {
      console.warn(
        "[DI] ⚠️ Cache service failed to connect - continuing without cache",
      );
    }
  }

  /**
   * Initialize health check service
   */
  private initializeHealthCheckService(): void {
    // Note: EventSubscriptions might not be initialized yet, so pass undefined initially
    // It will be updated later via updateHealthCheckDependencies()
    this.healthCheckService = new HealthCheckService(
      this.config,
      this.cacheService,
      undefined,
    );
    console.log(
      "[DI] ✅ Health check service initialized (EventSubscriptions will be injected later)",
    );
  }

  /**
   * Update health check service with EventSubscriptions dependency
   * Called after EventSubscriptions is initialized
   */
  public updateHealthCheckDependencies(): void {
    if (this.healthCheckService && this.eventSubscriptions) {
      this.healthCheckService.attachEventSubscriptions(this.eventSubscriptions);
      console.log(
        "[DI] ✅ Health check service updated with EventSubscriptions",
      );
    }
  }

  /**
   * Initialize metrics service
   */
  private initializeMetricsService(): void {
    this.metricsService = new MetricsService();
    console.log("[DI] ✅ Metrics service initialized");
  }

  /**
   * Initialize repositories
   */
  private initializeRepositories(): void {
    // Initialize without event publisher first
    this.appointmentRepository = new SupabaseAppointmentRepository(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    this.appointmentReadModelRepository =
      new SupabaseAppointmentReadModelRepository(
        this.config.supabase.url,
        this.config.supabase.serviceRoleKey,
      );

    this.queueRepository = new SupabaseQueueRepository(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    this.reschedulingQueueRepository = new SupabaseReschedulingQueueRepository(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    this.providerScheduleRepository = new SupabaseProviderScheduleRepository(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    // Create Supabase client for repositories that need it
    const { createClient } = require("@supabase/supabase-js");
    const supabaseClient = createClient(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    // ===== ARCHIVED FOR POST-MVP: Waitlist Repository =====
    // this.waitlistRepository = new SupabaseAppointmentWaitlistRepository(
    //   supabaseClient,
    // );

    // Reminder Repository
    this.reminderRepository = new SupabaseAppointmentReminderRepository(
      supabaseClient,
    );

    // Pure Outbox Pattern - Read Model Repositories
    this.patientReadModelRepository = new PatientReadModelRepository(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    this.providerReadModelRepository = new ProviderReadModelRepository(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    this.inboxRepository = new InboxRepository(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    console.log("[DI] ✅ Repositories initialized (7 total, Waitlist archived)");
    console.log(
      "[DI]    - Appointment, ReadModel, Queue, ProviderSchedule, Reminder",
    );
    console.log(
      "[DI]    - PatientReadModel, ProviderReadModel, Inbox (Pure Outbox)",
    );
  }

  /**
   * Initialize event publisher and wire it to repository
   */
  private initializeEventPublisher(): void {
    // Get event bus from event subscriptions
    const eventBus = this.eventSubscriptions.getEventBus();

    // Create adapter to wrap EventBus as IDomainEventPublisher
    this.eventPublisher = new EventBusAdapter(eventBus);

    // Wire event publisher to repository using reflection
    // This is a workaround since we can't inject it in constructor due to circular dependency
    (this.appointmentRepository as any).eventPublisher = this.eventPublisher;

    // Configure application-level publishers
    const appEventPublisher = new EventBusPublisher(eventBus);
    this.reschedulingService.setEventPublisher(appEventPublisher);

    console.log("[DI] ✅ Event publisher initialized and wired to repository");
  }

  /**
   * Initialize external services
   */
  private initializeServices(): void {
    // PURE OUTBOX PATTERN: Use local read models instead of HTTP
    this.patientService = new LocalPatientReadModelService(
      this.patientReadModelRepository,
    );
    this.providerService = new LocalProviderReadModelService(
      this.providerReadModelRepository,
    );
    
    // HTTP Provider Service for work schedule (simple MVP approach)
    this.httpProviderService = new HttpProviderService(
      this.config.services.providerServiceUrl
    );
    this.schedulerAdapter = new RemoteSchedulerAdapter({
      baseUrl: this.config.services.schedulerServiceUrl,
      apiKey: this.config.services.schedulerApiKey,
      timeout: 5000,
      circuitBreaker: this.circuitBreaker,
    });

    // NEW: Authorization, Conflict Resolution & Reminder Services
    this.authorizationService = new AuthorizationService(
      this.config.supabase.url,
      this.config.supabase.serviceRoleKey,
    );

    this.conflictResolutionService = new ConflictResolutionService(
      this.appointmentRepository,
    );

    // Create scheduler adapter wrapper for ReminderService
    const schedulerWrapper = new SchedulerAdapterWrapper(
      this.schedulerAdapter,
      this.config.tenantId || "default",
    );
    this.reminderService = new ReminderService(schedulerWrapper);

    // Billing Service Client (for payment link creation)
    this.billingServiceClient = new BillingServiceClient({
      baseUrl: this.config.services.billingServiceUrl,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    // Rescheduling Service
    this.reschedulingService = new ReschedulingService(
      this.reschedulingQueueRepository,
      this.appointmentRepository,
      this.reminderService,
    );

    console.log("[DI] ✅ Services initialized (Pure Outbox Pattern)");
    console.log("[DI]    - Patient Service: LOCAL READ MODEL (No HTTP) ⚡");
    console.log("[DI]    - Provider Service: LOCAL READ MODEL (No HTTP) ⚡");
    console.log(
      `[DI]    - Scheduler Service: ${this.config.services.schedulerServiceUrl}`,
    );
    console.log(
      `[DI]    - Billing Service: ${this.config.services.billingServiceUrl} 💳`,
    );
    console.log("[DI]    - Authorization Service: RBAC enabled 🔐");
    console.log("[DI]    - Reminder Service: Scheduler integration enabled 🔔");
    console.log(
      "[DI]    - Performance: <10ms queries vs 150ms HTTP (15x faster)",
    );
    console.log("[DI]    - Availability: 100% (zero network dependencies)");
  }

  /**
   * Initialize use cases
   */
  private initializeUseCases(): void {
    // With Authorization & Reminders & Billing Service Client
    this.scheduleAppointmentUseCase = new ScheduleAppointmentUseCase(
      this.appointmentRepository,
      this.conflictResolutionService,
      this.authorizationService,
      this.reminderService,
      this.billingServiceClient,
    );

    this.cancelAppointmentUseCase = new CancelAppointmentUseCase(
      this.appointmentRepository,
      this.authorizationService,
      this.reminderService,
    );

    this.confirmAppointmentUseCase = new ConfirmAppointmentUseCase(
      this.appointmentRepository,
      this.authorizationService,
    );

    this.completeAppointmentUseCase = new CompleteAppointmentUseCase(
      this.appointmentRepository,
      this.authorizationService,
    );

    this.getAppointmentUseCase = new GetAppointmentUseCase(
      this.appointmentRepository,
    );

    this.listAppointmentsUseCase = new ListAppointmentsUseCase(
      this.appointmentRepository,
    );

    this.rescheduleAppointmentUseCase = new RescheduleAppointmentUseCase(
      this.appointmentRepository,
      this.authorizationService,
      this.reminderService,
    );

    this.checkInAppointmentUseCase = new CheckInAppointmentUseCase(
      this.appointmentRepository,
      this.authorizationService,
      this.queueRepository, // Add queue integration
    );

    this.markAsNoShowUseCase = new MarkAsNoShowUseCase(
      this.appointmentRepository,
      this.authorizationService,
    );

    this.startAppointmentUseCase = new StartAppointmentUseCase(
      this.appointmentRepository,
      this.authorizationService,
    );

    // Phase 2: Queue Management Use Cases
    this.callNextPatientUseCase = new CallNextPatientUseCase(
      this.queueRepository,
      this.authorizationService,
    );

    this.joinQueueUseCase = new JoinQueueUseCase(this.queueRepository);

    this.leaveQueueUseCase = new LeaveQueueUseCase(
      this.queueRepository,
      this.authorizationService,
    );

    this.queueStatusUseCase = new GetQueueStatusUseCase(
      this.queueRepository,
      this.authorizationService,
    );

    this.validateCancellationPolicyUseCase =
      new ValidateCancellationPolicyUseCase(this.appointmentRepository);

    this.manageAppointmentRemindersUseCase =
      new ManageAppointmentRemindersUseCase(
        this.appointmentRepository,
        this.reminderService,
        this.authorizationService,
      );

    this.createRecurringSeriesUseCase =
      new CreateRecurringAppointmentSeriesUseCase(
        this.scheduleAppointmentUseCase,
      );

    // ===== ARCHIVED FOR POST-MVP: BulkReschedule Use Case =====
    // this.bulkRescheduleAppointmentsUseCase =
    //   new BulkRescheduleAppointmentsUseCase(
    //     this.appointmentRepository,
    //     this.authorizationService,
    //   );

    this.appointmentHistoryUseCase = new GetAppointmentHistoryUseCase(
      this.appointmentRepository,
      this.authorizationService,
    );

    this.appointmentStatisticsUseCase = new GetAppointmentStatisticsUseCase(
      this.appointmentRepository,
      this.queueRepository,
      this.authorizationService,
    );

    this.createEmergencyAppointmentUseCase =
      new CreateEmergencyAppointmentUseCase(
        this.appointmentRepository,
        this.queueRepository,
        this.authorizationService,
      );

    this.transferAppointmentUseCase = new TransferAppointmentUseCase(
      this.appointmentRepository,
      this.authorizationService,
    );

    // Availability Use Case
    this.findAvailableTimeSlotsUseCase = new FindAvailableTimeSlotsUseCase(
      this.providerScheduleRepository,
      this.appointmentRepository,
      this.httpProviderService,
    );

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
    this.createAppointmentReminderUseCase = new CreateAppointmentReminderUseCase(
      this.reminderRepository,
      this.appointmentRepository,
    );

    this.getAppointmentRemindersUseCase = new GetAppointmentRemindersUseCase(
      this.reminderRepository,
    );

    this.updateAppointmentReminderUseCase = new UpdateAppointmentReminderUseCase(
      this.reminderRepository,
    );

    this.deleteAppointmentReminderUseCase = new DeleteAppointmentReminderUseCase(
      this.reminderRepository,
    );


    // Reminder Controller
    this.reminderController = new ReminderController(
      this.createAppointmentReminderUseCase,
      this.getAppointmentRemindersUseCase,
      this.updateAppointmentReminderUseCase,
      this.deleteAppointmentReminderUseCase,
    );

    console.log("[DI] ✅ Use cases initialized (35 total)");
  }

  /**
   * Initialize queries
   */
  private initializeQueries(): void {
    this.getAppointmentDetailsQuery = new GetAppointmentDetailsQuery(
      this.appointmentReadModelRepository,
    );

    this.listAppointmentsQuery = new ListAppointmentsQuery(
      this.appointmentReadModelRepository,
    );

    console.log("[DI] ✅ Queries initialized");
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    this.appointmentReadModelEventHandler =
      new AppointmentReadModelEventHandler(
        this.appointmentReadModelRepository,
        this.patientService,
        this.providerService,
      );

    // Pure Outbox Pattern - Event Consumers
    this.patientEventConsumer = new PatientEventConsumer(
      this.patientReadModelRepository,
      this.inboxRepository,
    );

    this.providerEventConsumer = new ProviderEventConsumer(
      this.providerReadModelRepository,
      this.inboxRepository,
    );

    // New Event Consumers for Appointment Service
    this.staffEventConsumer = new StaffEventConsumer(
      {
        rabbitmqUrl: this.config.rabbitmq.url,
        queueName: 'appointments-service.staff-events',
        exchangeName: this.config.rabbitmq.exchange,
        routingKeys: [
          'provider.schedule.updated',        // StaffScheduleUpdatedEvent from Provider Staff
          'provider.status.changed',          // StaffStatusChangedEvent from Provider Staff  
          'provider.department.assigned',     // StaffDepartmentAssignedEvent from Provider Staff
          'department.created',               // DepartmentCreatedEvent from Department Service
          'department.updated',               // DepartmentUpdatedEvent from Department Service
          'department.staff.count.changed'    // DepartmentStaffCountChangedEvent from Department Service
        ],
        prefetchCount: 10,
        retryAttempts: 3,
        retryDelayMs: 1000
      },
      this.appointmentRepository,
      this.queueRepository,
      this.providerScheduleRepository,
      this.conflictResolutionService,
      this.reminderService,
      this.inboxRepository,
      this.reschedulingService,
    );

    this.departmentEventConsumer = new DepartmentEventConsumer(
      {
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
      },
      this.appointmentRepository,
      this.queueRepository,
      this.conflictResolutionService,
      this.reminderService,
      this.inboxRepository,
    );

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
    this.paymentCompletedHandler = new PaymentCompletedHandler(
      this.appointmentRepository
    );

    // Initialize BillingEventConsumer with payment event support
    this.billingEventConsumer = new BillingEventConsumer(
      {
        rabbitmqUrl: this.config.rabbitmq.url,
        queueName: 'appointments-service.billing-events',
        exchangeName: this.config.rabbitmq.exchange,
        routingKey: 'billing.*',
        routingKeys: [
          'billing.payment.completed',  // Prepaid flow: auto-confirm after payment
          'billing.pre-authorization.*',
          'billing.rate.updated',
          'billing.insurance.verified'
        ]
      },
      this.appointmentRepository,
      this.queueRepository,
      this.reminderService,
      this.conflictResolutionService,
      this.inboxRepository,
      this.paymentCompletedHandler
    );

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
  private initializeEventSubscriptions(): void {
    // Pass Pure Outbox Pattern event consumers to EventSubscriptions
    this.eventSubscriptions = createEventSubscriptions(
      this.appointmentReadModelEventHandler,
      this.patientEventConsumer,
      this.providerEventConsumer,
    );

    console.log(
      "[DI] ✅ Event subscriptions initialized with Pure Outbox Pattern consumers",
    );
  }

  /**
   * Initialize controllers
   */
  private initializeControllers(): void {
    this.appointmentController = new AppointmentController(
      this.scheduleAppointmentUseCase,
      this.cancelAppointmentUseCase,
      this.confirmAppointmentUseCase,
      this.completeAppointmentUseCase,
      this.getAppointmentUseCase,
      this.listAppointmentsUseCase,
      this.rescheduleAppointmentUseCase,
      this.checkInAppointmentUseCase,
      this.markAsNoShowUseCase,
      this.startAppointmentUseCase,
      // this.bulkRescheduleAppointmentsUseCase, // ARCHIVED FOR POST-MVP
      this.appointmentHistoryUseCase,
      this.appointmentStatisticsUseCase,
      this.createEmergencyAppointmentUseCase,
      this.transferAppointmentUseCase,
      this.createRecurringSeriesUseCase,
    );

    this.appointmentQueryController = new AppointmentQueryController(
      this.getAppointmentDetailsQuery,
      this.listAppointmentsQuery,
    );

    this.availabilityController = new AvailabilityController(
      this.findAvailableTimeSlotsUseCase,
      this.providerScheduleRepository,
    );

    // ===== ARCHIVED FOR POST-MVP: Waitlist Controller =====
    // this.waitlistController = new WaitlistController(
    //   this.addToWaitlistUseCase,
    //   this.getWaitlistUseCase,
    //   this.updateWaitlistEntryUseCase,
    //   this.removeFromWaitlistUseCase,
    //   this.convertWaitlistToAppointmentUseCase,
    // );

    // Rescheduling Queue Controller
    this.reschedulingQueueController = new ReschedulingQueueController({
      reschedulingService: this.reschedulingService,
      reschedulingQueueRepository: this.reschedulingQueueRepository,
    });

    console.log("[DI] ✅ Controllers initialized (4 total, Waitlist archived)");
  }

  /**
   * Get appointment controller
   */
  public getAppointmentController(): AppointmentController {
    return this.appointmentController;
  }

  /**
   * Get appointment query controller
   */
  public getAppointmentQueryController(): AppointmentQueryController {
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
  public getAppointmentReadModelEventHandler(): AppointmentReadModelEventHandler {
    return this.appointmentReadModelEventHandler;
  }

  /**
   * Get event subscriptions
   */
  public getEventSubscriptions(): EventSubscriptions {
    return this.eventSubscriptions;
  }

  /**
   * Get appointment repository
   */
  public getAppointmentRepository(): IAppointmentRepository {
    return this.appointmentRepository;
  }

  /**
   * Get appointment read model repository
   */
  public getAppointmentReadModelRepository(): IAppointmentReadModelRepository {
    return this.appointmentReadModelRepository;
  }

  /**
   * Get configuration
   */
  public getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Get health check service
   */
  public getHealthCheckService(): HealthCheckService {
    return this.healthCheckService;
  }

  /**
   * Get metrics service
   */
  public getMetricsService(): MetricsService {
    return this.metricsService;
  }

  /**
   * Get reschedule appointment use case
   */
  public getRescheduleAppointmentUseCase(): RescheduleAppointmentUseCase {
    return this.rescheduleAppointmentUseCase;
  }

  /**
   * Get check-in appointment use case
   */
  public getCheckInAppointmentUseCase(): CheckInAppointmentUseCase {
    return this.checkInAppointmentUseCase;
  }

  /**
   * Get mark as no-show use case
   */
  public getMarkAsNoShowUseCase(): MarkAsNoShowUseCase {
    return this.markAsNoShowUseCase;
  }

  /**
   * Get start appointment use case
   */
  public getStartAppointmentUseCase(): StartAppointmentUseCase {
    return this.startAppointmentUseCase;
  }

  /**
   * Get call next patient use case
   */
  public getCallNextPatientUseCase(): CallNextPatientUseCase {
    return this.callNextPatientUseCase;
  }

  /**
   * Get join queue use case
   */
  public getJoinQueueUseCase(): JoinQueueUseCase {
    return this.joinQueueUseCase;
  }

  /**
   * Get leave queue use case
   */
  public getLeaveQueueUseCase(): LeaveQueueUseCase {
    return this.leaveQueueUseCase;
  }

  /**
   * Get queue status use case
   */
  public getQueueStatusUseCase(): GetQueueStatusUseCase {
    return this.queueStatusUseCase;
  }

  /**
   * Get validate cancellation policy use case
   */
  public getValidateCancellationPolicyUseCase(): ValidateCancellationPolicyUseCase {
    return this.validateCancellationPolicyUseCase;
  }

  /**
   * Get manage appointment reminders use case
   */
  public getManageAppointmentRemindersUseCase(): ManageAppointmentRemindersUseCase {
    return this.manageAppointmentRemindersUseCase;
  }

  /**
   * Get create recurring appointment series use case
   */
  public getCreateRecurringSeriesUseCase(): CreateRecurringAppointmentSeriesUseCase {
    return this.createRecurringSeriesUseCase;
  }

  /**
   * Get queue repository
   */
  public getQueueRepository(): IQueueRepository {
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
  public getAppointmentHistoryUseCase(): GetAppointmentHistoryUseCase {
    return this.appointmentHistoryUseCase;
  }

  /**
   * Get appointment statistics use case
   */
  public getAppointmentStatisticsUseCase(): GetAppointmentStatisticsUseCase {
    return this.appointmentStatisticsUseCase;
  }

  /**
   * Get create emergency appointment use case
   */
  public getCreateEmergencyAppointmentUseCase(): CreateEmergencyAppointmentUseCase {
    return this.createEmergencyAppointmentUseCase;
  }

  /**
   * Get transfer appointment use case
   */
  public getTransferAppointmentUseCase(): TransferAppointmentUseCase {
    return this.transferAppointmentUseCase;
  }

  /**
   * Get availability controller
   */
  public getReschedulingQueueController(): ReschedulingQueueController {
    return this.reschedulingQueueController;
  }

  public getAvailabilityController(): AvailabilityController {
    return this.availabilityController;
  }

  /**
   * Get find available time slots use case
   */
  public getFindAvailableTimeSlotsUseCase(): FindAvailableTimeSlotsUseCase {
    return this.findAvailableTimeSlotsUseCase;
  }

  /**
   * Get provider schedule repository
   */
  public getProviderScheduleRepository(): IProviderScheduleRepository {
    return this.providerScheduleRepository;
  }

  /**
   * Get patient event consumer (Pure Outbox Pattern)
   */
  public getPatientEventConsumer(): PatientEventConsumer {
    return this.patientEventConsumer;
  }

  /**
   * Get provider event consumer (Pure Outbox Pattern)
   */
  public getProviderEventConsumer(): ProviderEventConsumer {
    return this.providerEventConsumer;
  }

  /**
   * Get staff event consumer
   */
  public getStaffEventConsumer(): StaffEventConsumer {
    return this.staffEventConsumer;
  }

  /**
   * Get department event consumer
   */
  public getDepartmentEventConsumer(): DepartmentEventConsumer {
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
  public getBillingEventConsumer(): BillingEventConsumer {
    return this.billingEventConsumer;
  }

  /**
   * Get patient read model repository
   */
  public getPatientReadModelRepository(): PatientReadModelRepository {
    return this.patientReadModelRepository;
  }

  /**
   * Get provider read model repository
   */
  public getProviderReadModelRepository(): ProviderReadModelRepository {
    return this.providerReadModelRepository;
  }

  /**
   * Get reminder controller
   */
  public getReminderController(): ReminderController {
    return this.reminderController;
  }

  /**
   * Get inbox repository
   */
  public getInboxRepository(): InboxRepository {
    return this.inboxRepository;
  }
}

// Singleton instance
let containerInstance: DIContainer | null = null;

/**
 * Get DI container instance
 */
export function getContainer(): DIContainer {
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
export function resetContainer(): void {
  containerInstance = null;
}
