/**
 * Dependency Injection Container
 * Centralized DI setup for Scheduling Service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, SOLID
 */
import { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
import { IAppointmentReadModelRepository } from "../../domain/repositories/IAppointmentReadModelRepository";
import { IQueueRepository } from "../../domain/repositories/IQueueRepository";
import { IProviderScheduleRepository } from "../../domain/repositories/IProviderScheduleRepository";
import { ReminderController } from "../../presentation/controllers/ReminderController";
import { ManageAppointmentRemindersUseCase } from "../../application/use-cases/ManageAppointmentReminders.use-case";
import { ReschedulingQueueController } from "../../presentation/controllers/ReschedulingQueueController";
import { PatientReadModelRepository } from "../repositories/PatientReadModelRepository";
import { ProviderReadModelRepository } from "../repositories/ProviderReadModelRepository";
import { InboxRepository } from "../inbox/InboxRepository";
import { PatientEventConsumer } from "../events/PatientEventConsumer";
import { ProviderEventConsumer } from "../events/ProviderEventConsumer";
import { StaffEventConsumer } from "../events/StaffEventConsumer";
import { DepartmentEventConsumer } from "../events/DepartmentEventConsumer";
import { BillingEventConsumer } from "../events/BillingEventConsumer";
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
import { GetAppointmentHistoryUseCase } from "../../application/use-cases/GetAppointmentHistory.use-case";
import { GetAppointmentStatisticsUseCase } from "../../application/use-cases/GetAppointmentStatistics.use-case";
import { CreateEmergencyAppointmentUseCase } from "../../application/use-cases/CreateEmergencyAppointment.use-case";
import { TransferAppointmentUseCase } from "../../application/use-cases/TransferAppointment.use-case";
import { FindAvailableTimeSlotsUseCase } from "../../application/use-cases/FindAvailableTimeSlotsUseCase";
import { AppointmentReadModelEventHandler } from "../events/AppointmentReadModelEventHandler";
import { EventSubscriptions } from "../events/EventSubscriptions";
import { AppointmentController } from "../../presentation/controllers/AppointmentController";
import { AppointmentQueryController } from "../../presentation/controllers/AppointmentQueryController";
import { AvailabilityController } from "../../presentation/controllers/AvailabilityController";
import { AppConfig } from "../config/ConfigValidator";
import { HealthCheckService } from "../health/HealthCheckService";
import { MetricsService } from "../metrics/MetricsService";
/**
 * DI Container
 */
export declare class DIContainer {
    private config;
    private appointmentRepository;
    private appointmentReadModelRepository;
    private queueRepository;
    private providerScheduleRepository;
    private reminderRepository;
    private reschedulingQueueRepository;
    private patientReadModelRepository;
    private providerReadModelRepository;
    private inboxRepository;
    private patientService;
    private providerService;
    private schedulerAdapter;
    private conflictResolutionService;
    private authorizationService;
    private reminderService;
    private reschedulingService;
    private billingServiceClient;
    private reminderController;
    private createAppointmentReminderUseCase;
    private getAppointmentRemindersUseCase;
    private updateAppointmentReminderUseCase;
    private deleteAppointmentReminderUseCase;
    private manageAppointmentRemindersUseCase;
    private cacheService;
    private circuitBreaker;
    private healthCheckService;
    private metricsService;
    private eventPublisher;
    private scheduleAppointmentUseCase;
    private cancelAppointmentUseCase;
    private confirmAppointmentUseCase;
    private completeAppointmentUseCase;
    private getAppointmentUseCase;
    private listAppointmentsUseCase;
    private rescheduleAppointmentUseCase;
    private checkInAppointmentUseCase;
    private markAsNoShowUseCase;
    private startAppointmentUseCase;
    private callNextPatientUseCase;
    private joinQueueUseCase;
    private leaveQueueUseCase;
    private queueStatusUseCase;
    private validateCancellationPolicyUseCase;
    private createRecurringSeriesUseCase;
    private appointmentHistoryUseCase;
    private appointmentStatisticsUseCase;
    private createEmergencyAppointmentUseCase;
    private transferAppointmentUseCase;
    private findAvailableTimeSlotsUseCase;
    private getAppointmentDetailsQuery;
    private listAppointmentsQuery;
    private appointmentReadModelEventHandler;
    private eventSubscriptions;
    private patientEventConsumer;
    private providerEventConsumer;
    private staffEventConsumer;
    private departmentEventConsumer;
    private billingEventConsumer;
    private paymentCompletedHandler;
    private appointmentController;
    private appointmentQueryController;
    private availabilityController;
    private reschedulingQueueController;
    constructor();
    /**
     * Initialize cache service and circuit breaker
     */
    private initializeCacheService;
    /**
     * Initialize health check service
     */
    private initializeHealthCheckService;
    /**
     * Update health check service with EventSubscriptions dependency
     * Called after EventSubscriptions is initialized
     */
    updateHealthCheckDependencies(): void;
    /**
     * Initialize metrics service
     */
    private initializeMetricsService;
    /**
     * Initialize repositories
     */
    private initializeRepositories;
    /**
     * Initialize event publisher and wire it to repository
     */
    private initializeEventPublisher;
    /**
     * Initialize external services
     */
    private initializeServices;
    /**
     * Initialize use cases
     */
    private initializeUseCases;
    /**
     * Initialize queries
     */
    private initializeQueries;
    /**
     * Initialize event handlers
     */
    private initializeEventHandlers;
    /**
     * Initialize event subscriptions
     */
    private initializeEventSubscriptions;
    /**
     * Initialize controllers
     */
    private initializeControllers;
    /**
     * Get appointment controller
     */
    getAppointmentController(): AppointmentController;
    /**
     * Get appointment query controller
     */
    getAppointmentQueryController(): AppointmentQueryController;
    /**
     * Get appointment read model event handler
     */
    getAppointmentReadModelEventHandler(): AppointmentReadModelEventHandler;
    /**
     * Get event subscriptions
     */
    getEventSubscriptions(): EventSubscriptions;
    /**
     * Get appointment repository
     */
    getAppointmentRepository(): IAppointmentRepository;
    /**
     * Get appointment read model repository
     */
    getAppointmentReadModelRepository(): IAppointmentReadModelRepository;
    /**
     * Get configuration
     */
    getConfig(): AppConfig;
    /**
     * Get health check service
     */
    getHealthCheckService(): HealthCheckService;
    /**
     * Get metrics service
     */
    getMetricsService(): MetricsService;
    /**
     * Get reschedule appointment use case
     */
    getRescheduleAppointmentUseCase(): RescheduleAppointmentUseCase;
    /**
     * Get check-in appointment use case
     */
    getCheckInAppointmentUseCase(): CheckInAppointmentUseCase;
    /**
     * Get mark as no-show use case
     */
    getMarkAsNoShowUseCase(): MarkAsNoShowUseCase;
    /**
     * Get start appointment use case
     */
    getStartAppointmentUseCase(): StartAppointmentUseCase;
    /**
     * Get call next patient use case
     */
    getCallNextPatientUseCase(): CallNextPatientUseCase;
    /**
     * Get join queue use case
     */
    getJoinQueueUseCase(): JoinQueueUseCase;
    /**
     * Get leave queue use case
     */
    getLeaveQueueUseCase(): LeaveQueueUseCase;
    /**
     * Get queue status use case
     */
    getQueueStatusUseCase(): GetQueueStatusUseCase;
    /**
     * Get validate cancellation policy use case
     */
    getValidateCancellationPolicyUseCase(): ValidateCancellationPolicyUseCase;
    /**
     * Get manage appointment reminders use case
     */
    getManageAppointmentRemindersUseCase(): ManageAppointmentRemindersUseCase;
    /**
     * Get create recurring appointment series use case
     */
    getCreateRecurringSeriesUseCase(): CreateRecurringAppointmentSeriesUseCase;
    /**
     * Get queue repository
     */
    getQueueRepository(): IQueueRepository;
    /**
     * Get appointment history use case
     */
    getAppointmentHistoryUseCase(): GetAppointmentHistoryUseCase;
    /**
     * Get appointment statistics use case
     */
    getAppointmentStatisticsUseCase(): GetAppointmentStatisticsUseCase;
    /**
     * Get create emergency appointment use case
     */
    getCreateEmergencyAppointmentUseCase(): CreateEmergencyAppointmentUseCase;
    /**
     * Get transfer appointment use case
     */
    getTransferAppointmentUseCase(): TransferAppointmentUseCase;
    /**
     * Get availability controller
     */
    getReschedulingQueueController(): ReschedulingQueueController;
    getAvailabilityController(): AvailabilityController;
    /**
     * Get find available time slots use case
     */
    getFindAvailableTimeSlotsUseCase(): FindAvailableTimeSlotsUseCase;
    /**
     * Get provider schedule repository
     */
    getProviderScheduleRepository(): IProviderScheduleRepository;
    /**
     * Get patient event consumer (Pure Outbox Pattern)
     */
    getPatientEventConsumer(): PatientEventConsumer;
    /**
     * Get provider event consumer (Pure Outbox Pattern)
     */
    getProviderEventConsumer(): ProviderEventConsumer;
    /**
     * Get staff event consumer
     */
    getStaffEventConsumer(): StaffEventConsumer;
    /**
     * Get department event consumer
     */
    getDepartmentEventConsumer(): DepartmentEventConsumer;
    /**
     * Get clinical EMR event consumer
     * REMOVED FOR MVP - Focus on Appointments only
     */
    /**
     * Get billing event consumer
     * ENABLED for Prepaid Billing Flow
     */
    getBillingEventConsumer(): BillingEventConsumer;
    /**
     * Get patient read model repository
     */
    getPatientReadModelRepository(): PatientReadModelRepository;
    /**
     * Get provider read model repository
     */
    getProviderReadModelRepository(): ProviderReadModelRepository;
    /**
     * Get reminder controller
     */
    getReminderController(): ReminderController;
    /**
     * Get inbox repository
     */
    getInboxRepository(): InboxRepository;
}
/**
 * Get DI container instance
 */
export declare function getContainer(): DIContainer;
/**
 * Reset container (for testing)
 */
export declare function resetContainer(): void;
//# sourceMappingURL=container.d.ts.map