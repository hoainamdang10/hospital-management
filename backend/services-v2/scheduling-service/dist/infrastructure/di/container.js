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
// Services
const HttpPatientService_1 = require("../services/HttpPatientService");
const HttpProviderService_1 = require("../services/HttpProviderService");
// Use Cases (Commands)
const ScheduleAppointment_use_case_1 = require("../../application/use-cases/ScheduleAppointment.use-case");
const CancelAppointment_use_case_1 = require("../../application/use-cases/CancelAppointment.use-case");
const ConfirmAppointment_use_case_1 = require("../../application/use-cases/ConfirmAppointment.use-case");
const CompleteAppointment_use_case_1 = require("../../application/use-cases/CompleteAppointment.use-case");
const GetAppointment_use_case_1 = require("../../application/use-cases/GetAppointment.use-case");
const ListAppointments_use_case_1 = require("../../application/use-cases/ListAppointments.use-case");
// Queries
const GetAppointmentDetailsQuery_1 = require("../../application/queries/GetAppointmentDetailsQuery");
const ListAppointmentsQuery_1 = require("../../application/queries/ListAppointmentsQuery");
// Event Handlers
const AppointmentReadModelEventHandler_1 = require("../events/AppointmentReadModelEventHandler");
const EventSubscriptions_1 = require("../events/EventSubscriptions");
// Controllers
const AppointmentController_1 = require("../../presentation/controllers/AppointmentController");
const AppointmentQueryController_1 = require("../../presentation/controllers/AppointmentQueryController");
/**
 * DI Container
 */
class DIContainer {
    constructor() {
        // Validate environment variables
        this.validateEnvironment();
        // Initialize repositories
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
        // Initialize controllers
        this.initializeControllers();
    }
    /**
     * Validate required environment variables
     */
    validateEnvironment() {
        const required = [
            'SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY'
        ];
        const missing = required.filter(key => !process.env[key]);
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
        // Warn about optional variables
        if (!process.env.PATIENT_SERVICE_URL) {
            console.warn('[DI] PATIENT_SERVICE_URL not set - defaulting to http://localhost:3023');
        }
        if (!process.env.PROVIDER_SERVICE_URL) {
            console.warn('[DI] PROVIDER_SERVICE_URL not set - defaulting to http://localhost:3022');
        }
    }
    /**
     * Initialize repositories
     */
    initializeRepositories() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.appointmentRepository = new SupabaseAppointmentRepository_1.SupabaseAppointmentRepository(supabaseUrl, supabaseKey);
        this.appointmentReadModelRepository = new SupabaseAppointmentReadModelRepository_1.SupabaseAppointmentReadModelRepository(supabaseUrl, supabaseKey);
        console.log('[DI] ✅ Repositories initialized');
    }
    /**
     * Initialize external services
     */
    initializeServices() {
        const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3023';
        const providerServiceUrl = process.env.PROVIDER_SERVICE_URL || 'http://localhost:3022';
        this.patientService = new HttpPatientService_1.HttpPatientService(patientServiceUrl);
        this.providerService = new HttpProviderService_1.HttpProviderService(providerServiceUrl);
        console.log('[DI] ✅ External services initialized');
        console.log(`[DI]    - Patient Service: ${patientServiceUrl}`);
        console.log(`[DI]    - Provider Service: ${providerServiceUrl}`);
    }
    /**
     * Initialize use cases
     */
    initializeUseCases() {
        this.scheduleAppointmentUseCase = new ScheduleAppointment_use_case_1.ScheduleAppointmentUseCase(this.appointmentRepository);
        this.cancelAppointmentUseCase = new CancelAppointment_use_case_1.CancelAppointmentUseCase(this.appointmentRepository);
        this.confirmAppointmentUseCase = new ConfirmAppointment_use_case_1.ConfirmAppointmentUseCase(this.appointmentRepository);
        this.completeAppointmentUseCase = new CompleteAppointment_use_case_1.CompleteAppointmentUseCase(this.appointmentRepository);
        this.getAppointmentUseCase = new GetAppointment_use_case_1.GetAppointmentUseCase(this.appointmentRepository);
        this.listAppointmentsUseCase = new ListAppointments_use_case_1.ListAppointmentsUseCase(this.appointmentRepository);
        console.log('[DI] ✅ Use cases initialized');
    }
    /**
     * Initialize queries
     */
    initializeQueries() {
        this.getAppointmentDetailsQuery = new GetAppointmentDetailsQuery_1.GetAppointmentDetailsQuery(this.appointmentReadModelRepository);
        this.listAppointmentsQuery = new ListAppointmentsQuery_1.ListAppointmentsQuery(this.appointmentReadModelRepository);
        console.log('[DI] ✅ Queries initialized');
    }
    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        this.appointmentReadModelEventHandler = new AppointmentReadModelEventHandler_1.AppointmentReadModelEventHandler(this.appointmentReadModelRepository, this.patientService, this.providerService);
        console.log('[DI] ✅ Event handlers initialized');
    }
    /**
     * Initialize event subscriptions
     */
    initializeEventSubscriptions() {
        this.eventSubscriptions = (0, EventSubscriptions_1.createEventSubscriptions)(this.appointmentReadModelEventHandler);
        console.log('[DI] ✅ Event subscriptions initialized');
    }
    /**
     * Initialize controllers
     */
    initializeControllers() {
        this.appointmentController = new AppointmentController_1.AppointmentController(this.scheduleAppointmentUseCase, this.cancelAppointmentUseCase, this.confirmAppointmentUseCase, this.completeAppointmentUseCase, this.getAppointmentUseCase, this.listAppointmentsUseCase);
        this.appointmentQueryController = new AppointmentQueryController_1.AppointmentQueryController(this.getAppointmentDetailsQuery, this.listAppointmentsQuery);
        console.log('[DI] ✅ Controllers initialized');
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
}
exports.DIContainer = DIContainer;
// Singleton instance
let containerInstance = null;
/**
 * Get DI container instance
 */
function getContainer() {
    if (!containerInstance) {
        console.log('[DI] 🔧 Initializing DI Container...');
        containerInstance = new DIContainer();
        console.log('[DI] ✅ DI Container ready');
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