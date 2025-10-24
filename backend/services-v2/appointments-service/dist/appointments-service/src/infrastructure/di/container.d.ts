/**
 * Dependency Injection Container
 * Centralized DI setup for Scheduling Service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, SOLID
 */
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAppointmentReadModelRepository } from '../../domain/repositories/IAppointmentReadModelRepository';
import { AppointmentReadModelEventHandler } from '../events/AppointmentReadModelEventHandler';
import { EventSubscriptions } from '../events/EventSubscriptions';
import { AppointmentController } from '../../presentation/controllers/AppointmentController';
import { AppointmentQueryController } from '../../presentation/controllers/AppointmentQueryController';
/**
 * DI Container
 */
export declare class DIContainer {
    private appointmentRepository;
    private appointmentReadModelRepository;
    private patientService;
    private providerService;
    private cacheService;
    private scheduleAppointmentUseCase;
    private cancelAppointmentUseCase;
    private confirmAppointmentUseCase;
    private completeAppointmentUseCase;
    private getAppointmentUseCase;
    private listAppointmentsUseCase;
    private getAppointmentDetailsQuery;
    private listAppointmentsQuery;
    private appointmentReadModelEventHandler;
    private eventSubscriptions;
    private appointmentController;
    private appointmentQueryController;
    constructor();
    /**
     * Validate required environment variables
     */
    private validateEnvironment;
    /**
     * Initialize cache service
     */
    private initializeCacheService;
    /**
     * Initialize repositories
     */
    private initializeRepositories;
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