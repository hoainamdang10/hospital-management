/**
 * Identity Service Consolidated - Main Application
 * Production-ready service with enhanced monitoring and resilience
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */
/**
 * Identity Service Application Class
 * Implements production-ready patterns and anti-pattern mitigation
 */
declare class IdentityServiceApp {
    private app;
    private supabaseClient;
    private healthCheck;
    private degradationService;
    private userRepository;
    private authService;
    private authClient;
    private permissionService;
    private mfaService;
    private cacheService;
    private authMiddleware;
    private permissionMiddleware;
    private authenticateUserUseCase;
    private registerUserUseCase;
    private forgotPasswordUseCase;
    private resetPasswordUseCase;
    private verifyEmailUseCase;
    private logoutUserUseCase;
    private enableMFAUseCase;
    private verifyMFAUseCase;
    private disableMFAUseCase;
    private getUserUseCase;
    private updateUserUseCase;
    private deleteUserUseCase;
    private listUsersUseCase;
    constructor();
    /**
     * Initialize infrastructure components
     */
    private initializeInfrastructure;
    /**
     * Setup Express middleware with security and monitoring
     */
    private setupMiddleware;
    /**
     * Setup API routes
     */
    private setupRoutes;
    /**
     * Setup error handling middleware
     */
    private setupErrorHandling;
    /**
     * Start the server
     */
    start(): Promise<void>;
}
export default IdentityServiceApp;
//# sourceMappingURL=main.d.ts.map