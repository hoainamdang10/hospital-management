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
                roles: string[];
                permissions: string[];
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
    private acceptStaffInvitationUseCase;
    private eventPublisher;
    private sessionRepository;
    private listActiveSessionsUseCase;
    private terminateSessionUseCase;
    private terminateAllSessionsUseCase;
    private passwordPolicyRepository;
    private getPasswordPolicyUseCase;
    private updatePasswordPolicyUseCase;
    private validatePasswordUseCase;
    private recoveryMethodRepository;
    private recoveryHistoryRepository;
    private getRecoveryMethodsUseCase;
    private updateRecoveryMethodsUseCase;
    private requestPasswordResetUseCase;
    private verifyResetTokenUseCase;
    private resetPasswordWithTokenUseCase;
    private getRecoveryHistoryUseCase;
    private changePasswordUseCase;
    private lockAccountUseCase;
    private unlockAccountUseCase;
    private assignRoleUseCase;
    private checkPermissionUseCase;
    private checkPermissionsUseCase;
    private checkRoleUseCase;
    private checkRolesUseCase;
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
     * Routes are now organized in separate modules under presentation/routes/
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