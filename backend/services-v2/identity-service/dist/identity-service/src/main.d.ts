/**
 * Identity Service Consolidated - Main Application
 * Production-ready service with enhanced monitoring and resilience
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}
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
    private permissionRepository;
    private authService;
    private authClient;
    private permissionService;
    private permissionCache;
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
    private refreshTokenUseCase;
    private provisionStaffUseCase;
    private eventPublisher;
    constructor();
    /**
     * Initialize the application (async wrapper for constructor)
     */
    initialize(): Promise<void>;
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