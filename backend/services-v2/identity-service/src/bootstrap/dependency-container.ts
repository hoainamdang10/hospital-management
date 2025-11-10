/**
 * Dependency Injection Container
 * Centralized DI container managing all service dependencies
 *
 * Features:
 * - Infrastructure initialization (Supabase, Redis, RabbitMQ)
 * - Repository initialization
 * - Service initialization
 * - Use case initialization (40+ use cases)
 * - Event consumer initialization
 * - Lifecycle management (startup, shutdown)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Production-Ready
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ILogger } from "../application/services/ILogger";
import { AppConfig } from "./config";
import { RouteDependencies } from "../presentation/routes/types";

// Infrastructure
import { IdentityServiceHealthCheck } from "../infrastructure/monitoring/HealthChecks";
import { IdentityServiceDegradation } from "../infrastructure/resilience/GracefulDegradation";
import { CircuitBreakerFactory } from "../infrastructure/resilience/CircuitBreaker";
import { RedisCacheService } from "../infrastructure/cache/RedisCacheService";
import { PermissionCache } from "../infrastructure/cache/PermissionCache";
import { RabbitMQEventPublisher } from "../infrastructure/events/RabbitMQEventPublisher";
import { SendGridEmailService } from "../infrastructure/email/SendGridEmailService";
import { MockEmailService } from "../infrastructure/email/MockEmailService";

// Repositories
import { SupabaseUserRepository } from "../infrastructure/repositories/SupabaseUserRepository";
import { SupabasePermissionRepository } from "../infrastructure/repositories/SupabasePermissionRepository";
import { SupabaseSessionRepository } from "../infrastructure/repositories/SupabaseSessionRepository";
import { SupabasePasswordPolicyRepository } from "../infrastructure/repositories/SupabasePasswordPolicyRepository";
import { SupabaseRecoveryMethodRepository } from "../infrastructure/repositories/SupabaseRecoveryMethodRepository";
import { SupabaseRecoveryHistoryRepository } from "../infrastructure/repositories/SupabaseRecoveryHistoryRepository";
import { SupabaseEmailVerificationTokenRepository } from "../infrastructure/repositories/SupabaseEmailVerificationTokenRepository";
import { SupabasePendingRegistrationRepository } from "../infrastructure/repositories/SupabasePendingRegistrationRepository";

// Services
import { SupabaseAuthService } from "../infrastructure/auth/SupabaseAuthService";
import { SupabaseAuthClient } from "../infrastructure/auth/SupabaseAuthClient";
import { PermissionService } from "../infrastructure/services/PermissionService";
import { SupabaseMFAService } from "../infrastructure/services/SupabaseMFAService";

// Middleware
import { AuthenticationMiddleware } from "../presentation/middleware/AuthenticationMiddleware";
import { PermissionMiddleware } from "../presentation/middleware/PermissionMiddleware";
import { createInternalServiceAuthMiddleware } from "../presentation/middleware/InternalServiceAuthMiddleware";

// Use Cases - Auth
import { AuthenticateUserUseCase } from "../application/use-cases/AuthenticateUserUseCase";
import { RegisterUserUseCase } from "../application/use-cases/RegisterUserUseCase";
import { ForgotPasswordUseCase } from "../application/use-cases/ForgotPasswordUseCase";
import { ResetPasswordUseCase } from "../application/use-cases/ResetPasswordUseCase";
import { VerifyEmailUseCase } from "../application/use-cases/VerifyEmailUseCase";
import { ResendVerificationEmailUseCase } from "../application/use-cases/ResendVerificationEmailUseCase";
import { LogoutUserUseCase } from "../application/use-cases/LogoutUserUseCase";
import { RefreshTokenUseCase } from "../application/use-cases/RefreshTokenUseCase";

// Use Cases - MFA
import { EnableMFAUseCase } from "../application/use-cases/EnableMFAUseCase";
import { VerifyMFAUseCase } from "../application/use-cases/VerifyMFAUseCase";
import { DisableMFAUseCase } from "../application/use-cases/DisableMFAUseCase";

// Use Cases - User Management
import { GetUserUseCase } from "../application/use-cases/GetUserUseCase";
import { UpdateUserUseCase } from "../application/use-cases/UpdateUserUseCase";
import { DeleteUserUseCase } from "../application/use-cases/DeleteUserUseCase";
import { ListUsersUseCase } from "../application/use-cases/ListUsersUseCase";
import { ChangePasswordUseCase } from "../application/use-cases/ChangePasswordUseCase";
import { LockAccountUseCase } from "../application/use-cases/LockAccountUseCase";
import { UnlockAccountUseCase } from "../application/use-cases/UnlockAccountUseCase";
import { AssignRoleUseCase } from "../application/use-cases/AssignRoleUseCase";

// Use Cases - Staff Management
import { ProvisionStaffUseCase } from "../application/use-cases/ProvisionStaffUseCase";
import { AcceptStaffInvitationUseCase } from "../application/use-cases/AcceptStaffInvitationUseCase";
import { ValidateStaffInvitationUseCase } from "../application/use-cases/ValidateStaffInvitationUseCase";
import { ListStaffInvitationsUseCase } from "../application/use-cases/ListStaffInvitationsUseCase";
import { GetStaffInvitationUseCase } from "../application/use-cases/GetStaffInvitationUseCase";
import { CancelStaffInvitationUseCase } from "../application/use-cases/CancelStaffInvitationUseCase";
import { ResendStaffInvitationUseCase } from "../application/use-cases/ResendStaffInvitationUseCase";

// Use Cases - Session Management
import { ListActiveSessionsUseCase } from "../application/use-cases/ListActiveSessionsUseCase";
import { TerminateSessionUseCase } from "../application/use-cases/TerminateSessionUseCase";
import { TerminateAllSessionsUseCase } from "../application/use-cases/TerminateAllSessionsUseCase";

// Use Cases - Password Policy
import { GetPasswordPolicyUseCase } from "../application/use-cases/GetPasswordPolicyUseCase";
import { UpdatePasswordPolicyUseCase } from "../application/use-cases/UpdatePasswordPolicyUseCase";
import { ValidatePasswordUseCase } from "../application/use-cases/ValidatePasswordUseCase";

// Use Cases - Account Recovery
import { GetRecoveryMethodsUseCase } from "../application/use-cases/GetRecoveryMethodsUseCase";
import { UpdateRecoveryMethodsUseCase } from "../application/use-cases/UpdateRecoveryMethodsUseCase";
import { RequestPasswordResetUseCase } from "../application/use-cases/RequestPasswordResetUseCase";
import { VerifyResetTokenUseCase } from "../application/use-cases/VerifyResetTokenUseCase";
import { ResetPasswordWithTokenUseCase } from "../application/use-cases/ResetPasswordWithTokenUseCase";
import { GetRecoveryHistoryUseCase } from "../application/use-cases/GetRecoveryHistoryUseCase";

// Use Cases - Permission Check
import { CheckPermissionUseCase } from "../application/use-cases/CheckPermissionUseCase";
import { CheckPermissionsUseCase } from "../application/use-cases/CheckPermissionsUseCase";
import { CheckRoleUseCase } from "../application/use-cases/CheckRoleUseCase";
import { CheckRolesUseCase } from "../application/use-cases/CheckRolesUseCase";

// Use Cases - Account Management
import { ActivateUserUseCase } from "../application/use-cases/ActivateUserUseCase";
import { DeactivateUserUseCase } from "../application/use-cases/DeactivateUserUseCase";
import { instrumentUseCaseWithMetrics } from "../application/decorators/WithMetrics";

// Event Consumer
import { InboxService } from "../infrastructure/inbox/InboxService";
import { IdentityEventConsumer } from "../infrastructure/events/IdentityEventConsumer";
import { StaffCredentialEventHandler } from "../infrastructure/events/handlers/StaffCredentialEventHandler";
import { BillingFraudEventHandler } from "../infrastructure/events/handlers/BillingFraudEventHandler";
import { AppointmentAbuseEventHandler } from "../infrastructure/events/handlers/AppointmentAbuseEventHandler";
import { ClinicalComplianceEventHandler } from "../infrastructure/events/handlers/ClinicalComplianceEventHandler";
import { StaffLifecycleEventHandler } from "../infrastructure/events/handlers/StaffLifecycleEventHandler";
import { NotificationEventHandler } from "../infrastructure/events/handlers/NotificationEventHandler";
import { PatientLifecycleEventHandler } from "../infrastructure/events/handlers/PatientLifecycleEventHandler";

// Cleanup Job
import { PendingRegistrationCleanupJob } from "../infrastructure/jobs/PendingRegistrationCleanupJob";

/**
 * Dependency Container
 * Manages all service dependencies and lifecycle
 */
export class DependencyContainer {
  // Infrastructure
  private supabaseClient!: SupabaseClient;
  private healthCheck!: IdentityServiceHealthCheck;
  private degradationService!: IdentityServiceDegradation;
  private cacheService!: RedisCacheService | null;
  private permissionCache!: PermissionCache;
  private eventPublisher!: RabbitMQEventPublisher;

  // Repositories
  private userRepository!: SupabaseUserRepository;
  private permissionRepository!: SupabasePermissionRepository;
  private sessionRepository!: SupabaseSessionRepository;
  private passwordPolicyRepository!: SupabasePasswordPolicyRepository;
  private recoveryMethodRepository!: SupabaseRecoveryMethodRepository;
  private recoveryHistoryRepository!: SupabaseRecoveryHistoryRepository;
  private emailVerificationTokenRepository!: SupabaseEmailVerificationTokenRepository;
  private pendingRegistrationRepository!: SupabasePendingRegistrationRepository;

  // Services
  private authService!: SupabaseAuthService;
  private authClient!: SupabaseAuthClient;
  private permissionService!: PermissionService;
  private mfaService!: SupabaseMFAService;
  private emailService!: SendGridEmailService | MockEmailService;

  // Middleware
  private authMiddleware!: AuthenticationMiddleware;
  private permissionMiddleware!: PermissionMiddleware;
  private internalServiceAuthMiddleware!: ReturnType<
    typeof createInternalServiceAuthMiddleware
  >;

  // Use Cases - Auth
  private authenticateUserUseCase!: AuthenticateUserUseCase;
  private registerUserUseCase!: RegisterUserUseCase;
  private forgotPasswordUseCase!: ForgotPasswordUseCase;
  private resetPasswordUseCase!: ResetPasswordUseCase;
  private verifyEmailUseCase!: VerifyEmailUseCase;
  private resendVerificationEmailUseCase!: ResendVerificationEmailUseCase;
  private logoutUserUseCase!: LogoutUserUseCase;
  private refreshTokenUseCase!: RefreshTokenUseCase;

  // Use Cases - MFA
  private enableMFAUseCase!: EnableMFAUseCase;
  private verifyMFAUseCase!: VerifyMFAUseCase;
  private disableMFAUseCase!: DisableMFAUseCase;

  // Use Cases - User Management
  private getUserUseCase!: GetUserUseCase;
  private updateUserUseCase!: UpdateUserUseCase;
  private deleteUserUseCase!: DeleteUserUseCase;
  private listUsersUseCase!: ListUsersUseCase;
  private changePasswordUseCase!: ChangePasswordUseCase;
  private lockAccountUseCase!: LockAccountUseCase;
  private unlockAccountUseCase!: UnlockAccountUseCase;
  private assignRoleUseCase!: AssignRoleUseCase;

  // Use Cases - Staff Management
  private provisionStaffUseCase!: ProvisionStaffUseCase;
  private acceptStaffInvitationUseCase!: AcceptStaffInvitationUseCase;
  private validateStaffInvitationUseCase!: ValidateStaffInvitationUseCase;
  private listStaffInvitationsUseCase!: ListStaffInvitationsUseCase;
  private getStaffInvitationUseCase!: GetStaffInvitationUseCase;
  private cancelStaffInvitationUseCase!: CancelStaffInvitationUseCase;
  private resendStaffInvitationUseCase!: ResendStaffInvitationUseCase;

  // Use Cases - Session Management
  private listActiveSessionsUseCase!: ListActiveSessionsUseCase;
  private terminateSessionUseCase!: TerminateSessionUseCase;
  private terminateAllSessionsUseCase!: TerminateAllSessionsUseCase;

  // Use Cases - Password Policy
  private getPasswordPolicyUseCase!: GetPasswordPolicyUseCase;
  private updatePasswordPolicyUseCase!: UpdatePasswordPolicyUseCase;
  private validatePasswordUseCase!: ValidatePasswordUseCase;

  // Use Cases - Account Recovery
  private getRecoveryMethodsUseCase!: GetRecoveryMethodsUseCase;
  private updateRecoveryMethodsUseCase!: UpdateRecoveryMethodsUseCase;
  private requestPasswordResetUseCase!: RequestPasswordResetUseCase;
  private verifyResetTokenUseCase!: VerifyResetTokenUseCase;
  private resetPasswordWithTokenUseCase!: ResetPasswordWithTokenUseCase;
  private getRecoveryHistoryUseCase!: GetRecoveryHistoryUseCase;

  // Use Cases - Permission Check
  private checkPermissionUseCase!: CheckPermissionUseCase;
  private checkPermissionsUseCase!: CheckPermissionsUseCase;
  private checkRoleUseCase!: CheckRoleUseCase;
  private checkRolesUseCase!: CheckRolesUseCase;

  // Use Cases - Account Management
  private activateUserUseCase!: ActivateUserUseCase;
  private deactivateUserUseCase!: DeactivateUserUseCase;

  // Event Consumer
  private inboxService!: InboxService;
  private identityEventConsumer!: IdentityEventConsumer | null;
  private staffCredentialHandler!: StaffCredentialEventHandler;
  private billingFraudHandler!: BillingFraudEventHandler;
  private appointmentAbuseHandler!: AppointmentAbuseEventHandler;
  private clinicalComplianceHandler!: ClinicalComplianceEventHandler;
  private staffLifecycleHandler!: StaffLifecycleEventHandler;
  private notificationHandler!: NotificationEventHandler;
  private patientLifecycleHandler!: PatientLifecycleEventHandler;

  // Cleanup Job
  private pendingRegistrationCleanupJob!: PendingRegistrationCleanupJob;

  constructor(
    private config: AppConfig,
    private logger: ILogger,
  ) {}

  /**
   * Build container - Initialize all dependencies
   */
  async build(): Promise<void> {
    this.logger.info("Building dependency container...");

    await this.initializeInfrastructure();
    await this.initializeRepositories();
    await this.initializeServices();
    await this.initializeMiddleware();
    await this.initializeUseCases();
    await this.initializeEventConsumer();
    await this.initializeCleanupJobs();

    this.logger.info("Dependency container built successfully");
  }

  /**
   * Initialize infrastructure components
   */
  private async initializeInfrastructure(): Promise<void> {
    this.logger.debug("Initializing infrastructure...");

    // Supabase client
    this.supabaseClient = createClient(
      this.config.supabaseUrl,
      this.config.supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: "auth_schema",
        },
      },
    ) as any;

    // Health check
    this.healthCheck = new IdentityServiceHealthCheck(
      this.config.supabaseUrl,
      this.config.supabaseKey,
      this.logger,
    );

    // Degradation service
    this.degradationService = new IdentityServiceDegradation(
      {
        enableReadOnlyFallback: true,
        enableCacheFallback: true,
        enableEmergencyMode: true,
        maxDegradationTime: 300000, // 5 minutes
      },
      {
        supabaseUrl: this.config.supabaseUrl,
        supabaseServiceRoleKey: this.config.supabaseKey,
        jwtSecret: this.config.jwtSecret,
      },
      this.logger,
    );

    // Redis cache service (optional)
    try {
      this.cacheService = new RedisCacheService(
        this.config.redisUrl,
        this.logger,
      );
      await this.cacheService.connect();
      this.logger.info("Redis cache service initialized and connected");
    } catch (error) {
      this.logger.warn("Redis cache not available, running without cache", {
        error,
      });
      this.cacheService = null;
    }

    // Permission cache
    this.permissionCache = new PermissionCache(
      this.config.redisUrl,
      this.logger,
    );
    try {
      await this.permissionCache.connect();
      this.logger.info("Permission cache connected successfully");
    } catch (error) {
      this.logger.error("Failed to connect permission cache", { error });
      this.logger.warn("Continuing without permission caching");
    }

    // Set logger for CircuitBreakerFactory
    CircuitBreakerFactory.setLogger(this.logger);

    // Event publisher (RabbitMQ)
    this.eventPublisher = new RabbitMQEventPublisher(
      this.config.rabbitmqUrl,
      this.logger,
      this.config.rabbitmqExchange,
    );
    try {
      await this.eventPublisher.initialize?.();
      this.logger.info("Event publisher initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize event publisher", { error });
      this.logger.warn("Continuing without event publishing");
    }

    this.logger.debug("Infrastructure initialized");
  }

  /**
   * Initialize repositories
   */
  private async initializeRepositories(): Promise<void> {
    this.logger.debug("Initializing repositories...");

    // Permission repository
    this.permissionRepository = new SupabasePermissionRepository(
      this.supabaseClient,
      this.permissionCache,
    );

    // User repository
    this.userRepository = new SupabaseUserRepository(
      this.supabaseClient,
      this.logger,
      this.cacheService || undefined,
      this.permissionRepository,
      this.eventPublisher,
    );

    // Session repository
    this.sessionRepository = new SupabaseSessionRepository(this.supabaseClient);

    // Password policy repository
    this.passwordPolicyRepository = new SupabasePasswordPolicyRepository(
      this.supabaseClient,
      this.logger,
    );

    // Recovery method repository
    this.recoveryMethodRepository = new SupabaseRecoveryMethodRepository(
      this.supabaseClient,
      this.logger,
    );

    // Recovery history repository
    this.recoveryHistoryRepository = new SupabaseRecoveryHistoryRepository(
      this.supabaseClient,
      this.logger,
    );

    // Email verification token repository
    this.emailVerificationTokenRepository =
      new SupabaseEmailVerificationTokenRepository({
        supabase: this.supabaseClient,
        logger: this.logger,
      });

    // Pending registration repository
    this.pendingRegistrationRepository =
      new SupabasePendingRegistrationRepository({
        supabase: this.supabaseClient,
        logger: this.logger,
        circuitBreaker: CircuitBreakerFactory.getBreaker(
          "pending-registration-repository",
        ),
      });

    this.logger.debug("Repositories initialized");
  }

  /**
   * Initialize services
   */
  private async initializeServices(): Promise<void> {
    this.logger.debug("Initializing services...");

    // Auth service
    this.authService = new SupabaseAuthService(
      this.config.supabaseUrl,
      this.config.supabaseKey,
      this.logger,
      this.config.defaultUserRole,
    );

    // Auth client
    this.authClient = new SupabaseAuthClient(
      {
        supabaseUrl: this.config.supabaseUrl,
        supabaseServiceRoleKey: this.config.supabaseKey,
        jwtSecret: this.config.jwtSecret,
      },
      this.logger,
    );

    // Permission service
    this.permissionService = new PermissionService(
      this.permissionRepository,
      this.permissionCache,
      this.logger,
    );

    // MFA service
    this.mfaService = new SupabaseMFAService(this.supabaseClient, this.logger);

    // Email service
    const sendgridApiKey = this.config.sendgridApiKey;
    const isProduction = this.config.nodeEnv === "production";
    const forceMockEmail = this.config.emailDeliveryMode === "mock";

    if (forceMockEmail) {
      this.logger.warn(
        "Email delivery mode set to MOCK - emails will not be sent",
      );
      this.emailService = new MockEmailService(this.logger);
    } else if (!sendgridApiKey || sendgridApiKey.trim() === "") {
      if (isProduction) {
        this.logger.error("SENDGRID_API_KEY is required in production");
        throw new Error("SENDGRID_API_KEY is required in production");
      } else {
        this.logger.warn(
          "SENDGRID_API_KEY not configured - using MockEmailService",
        );
        this.emailService = new MockEmailService(this.logger);
      }
    } else {
      this.emailService = new SendGridEmailService(
        {
          apiKey: sendgridApiKey,
          fromEmail: this.config.sendgridFromEmail,
          fromName: this.config.sendgridFromName,
          frontendUrl: this.config.frontendUrl,
        },
        this.logger,
      );
    }

    this.logger.debug("Services initialized");
  }

  /**
   * Initialize middleware
   */
  private async initializeMiddleware(): Promise<void> {
    this.logger.debug("Initializing middleware...");

    this.authMiddleware = new AuthenticationMiddleware(
      this.authClient,
      this.permissionService,
      this.logger,
    );

    this.permissionMiddleware = new PermissionMiddleware(
      this.permissionService,
      this.logger,
    );

    this.internalServiceAuthMiddleware = createInternalServiceAuthMiddleware(
      {
        enabled: this.config.internalAuthEnabled,
        tokens: this.config.internalServiceTokens,
        headerName: this.config.internalAuthHeaderName,
        allowedIPs: this.config.internalAuthAllowedIPs,
      },
      this.logger,
    );

    this.logger.debug("Middleware initialized");
  }

  /**
   * Initialize use cases
   */
  private async initializeUseCases(): Promise<void> {
    this.logger.debug("Initializing use cases...");

    // Auth use cases
    const authCircuitBreaker = CircuitBreakerFactory.getBreaker(
      "authentication-use-case",
    );
    this.authenticateUserUseCase = new AuthenticateUserUseCase(
      this.userRepository,
      this.authService,
      this.degradationService,
      authCircuitBreaker,
      this.logger,
      this.permissionRepository,
      this.eventPublisher,
    );

    this.forgotPasswordUseCase = new ForgotPasswordUseCase(
      this.authService,
      this.userRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("forgot-password-use-case"),
    );

    this.resetPasswordUseCase = new ResetPasswordUseCase(
      this.authService,
      this.logger,
      CircuitBreakerFactory.getBreaker("reset-password-use-case"),
    );

    this.verifyEmailUseCase = new VerifyEmailUseCase(
      this.userRepository,
      this.pendingRegistrationRepository,
      this.emailService,
      this.logger,
      CircuitBreakerFactory.getBreaker("verify-email-use-case"),
      this.config.jwtSecret,
      this.eventPublisher,
    );

    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.pendingRegistrationRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("register-user-use-case"),
      this.emailService,
      this.config.jwtSecret,
      this.config.frontendUrl,
      this.eventPublisher,
      {
        enabled: this.config.autoVerifyPendingRegistrations,
        verifyToken: (token: string) =>
          this.verifyEmailUseCase.execute({ token }),
      },
    );

    this.resendVerificationEmailUseCase = new ResendVerificationEmailUseCase(
      this.userRepository,
      this.emailVerificationTokenRepository,
      this.pendingRegistrationRepository,
      this.emailService,
      this.logger,
      CircuitBreakerFactory.getBreaker("resend-verification-email-use-case"),
      this.config.jwtSecret,
      this.config.frontendUrl,
    );

    this.logoutUserUseCase = new LogoutUserUseCase(
      this.authService,
      this.userRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("logout-user-use-case"),
      this.eventPublisher,
    );

    this.refreshTokenUseCase = new RefreshTokenUseCase(
      this.authService,
      this.logger,
    );

    // MFA use cases
    this.enableMFAUseCase = new EnableMFAUseCase(
      this.userRepository,
      this.mfaService,
      this.logger,
      CircuitBreakerFactory.getBreaker("enable-mfa-use-case"),
    );

    this.verifyMFAUseCase = new VerifyMFAUseCase(
      this.mfaService,
      this.logger,
      CircuitBreakerFactory.getBreaker("verify-mfa-use-case"),
    );

    this.disableMFAUseCase = new DisableMFAUseCase(
      this.userRepository,
      this.mfaService,
      this.verifyMFAUseCase,
      this.logger,
      CircuitBreakerFactory.getBreaker("disable-mfa-use-case"),
    );

    // User management use cases
    this.getUserUseCase = new GetUserUseCase(
      this.userRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("get-user-use-case"),
    );

    this.updateUserUseCase = new UpdateUserUseCase(
      this.userRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("update-user-use-case"),
    );

    this.deleteUserUseCase = new DeleteUserUseCase(
      this.userRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("delete-user-use-case"),
    );

    this.listUsersUseCase = new ListUsersUseCase(
      this.userRepository,
      CircuitBreakerFactory.getBreaker("list-users-use-case"),
      this.logger,
    );

    this.changePasswordUseCase = new ChangePasswordUseCase(
      this.authService,
      this.userRepository,
      this.passwordPolicyRepository,
      this.sessionRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("change-password-use-case"),
    );

    this.lockAccountUseCase = new LockAccountUseCase(
      this.userRepository,
      this.sessionRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("lock-account-use-case"),
    );

    this.unlockAccountUseCase = new UnlockAccountUseCase(
      this.userRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("unlock-account-use-case"),
      this.eventPublisher,
    );

    this.assignRoleUseCase = new AssignRoleUseCase(
      this.userRepository,
      this.permissionRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("assign-role-use-case"),
    );

    // Staff management use cases
    this.provisionStaffUseCase = new ProvisionStaffUseCase(
      this.userRepository,
      this.logger,
      this.emailService,
      this.config.frontendUrl,
      this.eventPublisher,
    );

    this.acceptStaffInvitationUseCase = new AcceptStaffInvitationUseCase(
      this.userRepository,
      this.logger,
      this.eventPublisher,
    );

    this.validateStaffInvitationUseCase = new ValidateStaffInvitationUseCase(
      this.userRepository,
      this.logger,
    );

    this.listStaffInvitationsUseCase = new ListStaffInvitationsUseCase(
      this.userRepository,
      this.logger,
    );

    this.getStaffInvitationUseCase = new GetStaffInvitationUseCase(
      this.userRepository,
      this.logger,
    );

    this.cancelStaffInvitationUseCase = new CancelStaffInvitationUseCase(
      this.userRepository,
      this.logger,
    );

    this.resendStaffInvitationUseCase = new ResendStaffInvitationUseCase(
      this.userRepository,
      this.emailService,
      this.logger,
      this.config.frontendUrl,
    );

    // Session management use cases
    this.listActiveSessionsUseCase = new ListActiveSessionsUseCase(
      this.sessionRepository,
      this.logger,
    );

    this.terminateSessionUseCase = new TerminateSessionUseCase(
      this.sessionRepository,
      this.logger,
    );

    this.terminateAllSessionsUseCase = new TerminateAllSessionsUseCase(
      this.sessionRepository,
      this.logger,
    );

    // Password policy use cases
    this.getPasswordPolicyUseCase = new GetPasswordPolicyUseCase(
      this.passwordPolicyRepository,
      this.logger,
    );

    this.updatePasswordPolicyUseCase = new UpdatePasswordPolicyUseCase(
      this.passwordPolicyRepository,
      this.logger,
    );

    this.validatePasswordUseCase = new ValidatePasswordUseCase(
      this.passwordPolicyRepository,
      this.logger,
    );

    // Account recovery use cases
    this.getRecoveryMethodsUseCase = new GetRecoveryMethodsUseCase(
      this.recoveryMethodRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("get-recovery-methods-use-case"),
    );

    this.updateRecoveryMethodsUseCase = new UpdateRecoveryMethodsUseCase(
      this.recoveryMethodRepository,
      this.userRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("update-recovery-methods-use-case"),
    );

    this.requestPasswordResetUseCase = new RequestPasswordResetUseCase(
      this.authService,
      this.userRepository,
      this.recoveryMethodRepository,
      this.recoveryHistoryRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("request-password-reset-use-case"),
    );

    this.verifyResetTokenUseCase = new VerifyResetTokenUseCase(
      this.authService,
      this.recoveryHistoryRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("verify-reset-token-use-case"),
    );

    this.resetPasswordWithTokenUseCase = new ResetPasswordWithTokenUseCase(
      this.authService,
      this.passwordPolicyRepository,
      this.recoveryHistoryRepository,
      this.sessionRepository,
      this.userRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("reset-password-with-token-use-case"),
      this.eventPublisher,
    );

    this.getRecoveryHistoryUseCase = new GetRecoveryHistoryUseCase(
      this.recoveryHistoryRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("get-recovery-history-use-case"),
    );

    // Permission check use cases
    this.checkPermissionUseCase = new CheckPermissionUseCase(
      this.permissionService,
      this.logger,
    );

    this.checkPermissionsUseCase = new CheckPermissionsUseCase(
      this.permissionService,
      this.logger,
    );

    this.checkRoleUseCase = new CheckRoleUseCase(
      this.permissionService,
      this.logger,
    );

    this.checkRolesUseCase = new CheckRolesUseCase(
      this.permissionService,
      this.logger,
    );

    // Account management use cases
    this.activateUserUseCase = new ActivateUserUseCase(
      this.userRepository,
      this.logger,
    );

    this.deactivateUserUseCase = new DeactivateUserUseCase(
      this.userRepository,
      this.sessionRepository,
      this.logger,
      CircuitBreakerFactory.getBreaker("deactivate-user-use-case"),
    );

    this.instrumentUseCasesWithMetrics();
    this.logger.debug("Use cases initialized");
  }

  private instrumentUseCasesWithMetrics(): void {
    const useCaseEntries: Array<
      [string, { execute(request: unknown): Promise<unknown> }]
    > = [
      ["AuthenticateUserUseCase", this.authenticateUserUseCase],
      ["RegisterUserUseCase", this.registerUserUseCase],
      ["ForgotPasswordUseCase", this.forgotPasswordUseCase],
      ["ResetPasswordUseCase", this.resetPasswordUseCase],
      ["VerifyEmailUseCase", this.verifyEmailUseCase],
      ["ResendVerificationEmailUseCase", this.resendVerificationEmailUseCase],
      ["LogoutUserUseCase", this.logoutUserUseCase],
      ["RefreshTokenUseCase", this.refreshTokenUseCase],
      ["EnableMFAUseCase", this.enableMFAUseCase],
      ["VerifyMFAUseCase", this.verifyMFAUseCase],
      ["DisableMFAUseCase", this.disableMFAUseCase],
      ["GetUserUseCase", this.getUserUseCase],
      ["UpdateUserUseCase", this.updateUserUseCase],
      ["DeleteUserUseCase", this.deleteUserUseCase],
      ["ListUsersUseCase", this.listUsersUseCase],
      ["ChangePasswordUseCase", this.changePasswordUseCase],
      ["LockAccountUseCase", this.lockAccountUseCase],
      ["UnlockAccountUseCase", this.unlockAccountUseCase],
      ["AssignRoleUseCase", this.assignRoleUseCase],
      ["ProvisionStaffUseCase", this.provisionStaffUseCase],
      ["AcceptStaffInvitationUseCase", this.acceptStaffInvitationUseCase],
      ["ListStaffInvitationsUseCase", this.listStaffInvitationsUseCase],
      ["GetStaffInvitationUseCase", this.getStaffInvitationUseCase],
      ["CancelStaffInvitationUseCase", this.cancelStaffInvitationUseCase],
      ["ResendStaffInvitationUseCase", this.resendStaffInvitationUseCase],
      ["ListActiveSessionsUseCase", this.listActiveSessionsUseCase],
      ["TerminateSessionUseCase", this.terminateSessionUseCase],
      ["TerminateAllSessionsUseCase", this.terminateAllSessionsUseCase],
      ["GetPasswordPolicyUseCase", this.getPasswordPolicyUseCase],
      ["UpdatePasswordPolicyUseCase", this.updatePasswordPolicyUseCase],
      ["ValidatePasswordUseCase", this.validatePasswordUseCase],
      ["GetRecoveryMethodsUseCase", this.getRecoveryMethodsUseCase],
      ["UpdateRecoveryMethodsUseCase", this.updateRecoveryMethodsUseCase],
      ["RequestPasswordResetUseCase", this.requestPasswordResetUseCase],
      ["VerifyResetTokenUseCase", this.verifyResetTokenUseCase],
      ["ResetPasswordWithTokenUseCase", this.resetPasswordWithTokenUseCase],
      ["GetRecoveryHistoryUseCase", this.getRecoveryHistoryUseCase],
      ["CheckPermissionUseCase", this.checkPermissionUseCase],
      ["CheckPermissionsUseCase", this.checkPermissionsUseCase],
      ["CheckRoleUseCase", this.checkRoleUseCase],
      ["CheckRolesUseCase", this.checkRolesUseCase],
      ["ActivateUserUseCase", this.activateUserUseCase],
      ["DeactivateUserUseCase", this.deactivateUserUseCase],
    ];

    for (const [name, useCase] of useCaseEntries) {
      if (!useCase || typeof useCase.execute !== "function") {
        this.logger.warn("Use case not available for metrics instrumentation", {
          useCase: name,
        });
        continue;
      }

      instrumentUseCaseWithMetrics(useCase, name, this.logger);
    }
  }

  /**
   * Initialize event consumer
   */
  private async initializeEventConsumer(): Promise<void> {
    this.logger.debug("Initializing event consumer...");

    try {
      // Initialize inbox service
      this.inboxService = new InboxService(this.supabaseClient, this.logger);
      this.logger.info("InboxService initialized successfully");

      // Initialize event handlers
      this.staffCredentialHandler = new StaffCredentialEventHandler(
        this.lockAccountUseCase,
        this.unlockAccountUseCase,
        this.terminateAllSessionsUseCase,
        this.inboxService,
        this.supabaseClient,
        this.logger,
      );

      this.billingFraudHandler = new BillingFraudEventHandler(
        this.lockAccountUseCase,
        this.inboxService,
        this.supabaseClient,
        this.logger,
      );

      this.appointmentAbuseHandler = new AppointmentAbuseEventHandler(
        this.inboxService,
        this.supabaseClient,
        this.logger,
      );

      this.clinicalComplianceHandler = new ClinicalComplianceEventHandler(
        this.lockAccountUseCase,
        this.terminateAllSessionsUseCase,
        this.inboxService,
        this.supabaseClient,
        this.logger,
      );

      this.staffLifecycleHandler = new StaffLifecycleEventHandler(
        this.activateUserUseCase,
        this.inboxService,
        this.logger,
      );

      this.notificationHandler = new NotificationEventHandler(
        this.lockAccountUseCase,
        this.inboxService,
        this.supabaseClient,
        this.logger,
      );

      this.patientLifecycleHandler = new PatientLifecycleEventHandler(
        this.deactivateUserUseCase,
        this.inboxService,
        this.logger,
      );

      this.logger.info("Event handlers initialized successfully");

      // Initialize event consumer
      this.identityEventConsumer = new IdentityEventConsumer(
        {
          rabbitmqUrl: this.config.rabbitmqUrl,
          exchange: "hospital.events",
          queueName: "identity-service.events",
          routingKeys: [
            // PHASE 1 routing keys
            "staff.credential_verified",
            "staff.status_changed",
            "payment.failed",
            "invoice.overdue",
            "appointment.no_show",
            "appointment.cancelled_late",
            "appointment.abuse_detected",
            // PHASE 2 routing keys
            "clinical.hipaa_violation",
            "clinical.unauthorized_access",
            "staff.onboarded",
            // PHASE 3 routing keys
            "notification.spam_detected",
            "payment.processed",
            "billing.dispute_filed",
            "payment.refunded",
            "insurance.claim_rejected",
            // PHASE 4 routing keys
            "patient.deceased",
          ],
        },
        this.logger,
        this.staffCredentialHandler,
        this.billingFraudHandler,
        this.appointmentAbuseHandler,
        this.clinicalComplianceHandler,
        this.staffLifecycleHandler,
        this.notificationHandler,
        this.patientLifecycleHandler,
      );

      this.logger.info("Event consumer initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize event consumer", { error });
      this.logger.warn("Continuing without event consumption");
      this.identityEventConsumer = null;
    }

    this.logger.debug("Event consumer initialized");
  }

  /**
   * Initialize cleanup jobs
   */
  private async initializeCleanupJobs(): Promise<void> {
    this.logger.debug("Initializing cleanup jobs...");

    this.pendingRegistrationCleanupJob = new PendingRegistrationCleanupJob({
      pendingRegistrationRepository: this.pendingRegistrationRepository,
      logger: this.logger,
      intervalMinutes: 60, // Run every hour
    });

    this.pendingRegistrationCleanupJob.start();
    this.logger.info(
      "Pending registration cleanup job started (runs every 60 minutes)",
    );

    this.logger.debug("Cleanup jobs initialized");
  }

  /**
   * Start event consumers
   */
  async startEventConsumers(): Promise<void> {
    if (this.identityEventConsumer) {
      try {
        await this.identityEventConsumer.connect();
        this.logger.info("Event consumers started successfully");
      } catch (error) {
        this.logger.error("Failed to start event consumers", { error });
      }
    } else {
      this.logger.warn("Event consumer not initialized, skipping start");
    }
  }

  /**
   * Stop event consumers
   */
  async stopEventConsumers(): Promise<void> {
    if (this.identityEventConsumer) {
      try {
        await this.identityEventConsumer.disconnect();
        this.logger.info("Event consumers stopped successfully");
      } catch (error) {
        this.logger.error("Failed to stop event consumers", { error });
      }
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    this.logger.info("Starting container cleanup...");

    try {
      // Stop cleanup jobs
      if (this.pendingRegistrationCleanupJob) {
        this.pendingRegistrationCleanupJob.stop();
        this.logger.info("Cleanup jobs stopped");
      }

      // Close event publisher
      if (this.eventPublisher && "close" in this.eventPublisher) {
        await (this.eventPublisher as any).close();
        this.logger.info("Event publisher closed");
      }

      // Close permission cache
      if (this.permissionCache) {
        await this.permissionCache.disconnect();
        this.logger.info("Permission cache disconnected");
      }

      // Close cache service
      if (this.cacheService) {
        await this.cacheService.disconnect();
        this.logger.info("Cache service disconnected");
      }

      // Stop degradation service
      if (this.degradationService) {
        this.degradationService.stop?.();
        this.logger.info("Degradation service stopped");
      }

      this.logger.info("Container cleanup complete");
    } catch (error) {
      this.logger.error("Error during container cleanup", { error });
      throw error;
    }
  }

  /**
   * Get route dependencies
   */
  getRouteDependencies(): RouteDependencies {
    return {
      // Infrastructure
      logger: this.logger,
      cacheService: this.cacheService,

      // Middleware
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      internalServiceAuthMiddleware: this.internalServiceAuthMiddleware,

      // Auth Use Cases
      authenticateUserUseCase: this.authenticateUserUseCase,
      registerUserUseCase: this.registerUserUseCase,
      forgotPasswordUseCase: this.forgotPasswordUseCase,
      resetPasswordUseCase: this.resetPasswordUseCase,
      verifyEmailUseCase: this.verifyEmailUseCase,
      resendVerificationEmailUseCase: this.resendVerificationEmailUseCase,
      logoutUserUseCase: this.logoutUserUseCase,
      refreshTokenUseCase: this.refreshTokenUseCase,

      // MFA Use Cases
      enableMFAUseCase: this.enableMFAUseCase,
      verifyMFAUseCase: this.verifyMFAUseCase,
      disableMFAUseCase: this.disableMFAUseCase,

      // User Management Use Cases
      getUserUseCase: this.getUserUseCase,
      updateUserUseCase: this.updateUserUseCase,
      deleteUserUseCase: this.deleteUserUseCase,
      listUsersUseCase: this.listUsersUseCase,
      changePasswordUseCase: this.changePasswordUseCase,
      lockAccountUseCase: this.lockAccountUseCase,
      unlockAccountUseCase: this.unlockAccountUseCase,
      assignRoleUseCase: this.assignRoleUseCase,

      // Staff Management Use Cases
      provisionStaffUseCase: this.provisionStaffUseCase,
      acceptStaffInvitationUseCase: this.acceptStaffInvitationUseCase,
      validateStaffInvitationUseCase: this.validateStaffInvitationUseCase,
      listStaffInvitationsUseCase: this.listStaffInvitationsUseCase,
      getStaffInvitationUseCase: this.getStaffInvitationUseCase,
      cancelStaffInvitationUseCase: this.cancelStaffInvitationUseCase,
      resendStaffInvitationUseCase: this.resendStaffInvitationUseCase,

      // Session Management Use Cases
      listActiveSessionsUseCase: this.listActiveSessionsUseCase,
      terminateSessionUseCase: this.terminateSessionUseCase,
      terminateAllSessionsUseCase: this.terminateAllSessionsUseCase,

      // Password Policy Use Cases
      getPasswordPolicyUseCase: this.getPasswordPolicyUseCase,
      updatePasswordPolicyUseCase: this.updatePasswordPolicyUseCase,
      validatePasswordUseCase: this.validatePasswordUseCase,

      // Account Recovery Use Cases
      getRecoveryMethodsUseCase: this.getRecoveryMethodsUseCase,
      updateRecoveryMethodsUseCase: this.updateRecoveryMethodsUseCase,
      requestPasswordResetUseCase: this.requestPasswordResetUseCase,
      verifyResetTokenUseCase: this.verifyResetTokenUseCase,
      resetPasswordWithTokenUseCase: this.resetPasswordWithTokenUseCase,
      getRecoveryHistoryUseCase: this.getRecoveryHistoryUseCase,

      // Permission Check Use Cases
      checkPermissionUseCase: this.checkPermissionUseCase,
      checkPermissionsUseCase: this.checkPermissionsUseCase,
      checkRoleUseCase: this.checkRoleUseCase,
      checkRolesUseCase: this.checkRolesUseCase,

      // Services
      healthCheck: this.healthCheck,
      degradationService: this.degradationService,
      permissionService: this.permissionService,
    };
  }

  /**
   * Get cache service (for app builder)
   */
  get cache(): RedisCacheService | null {
    return this.cacheService;
  }
}

/**
 * Build dependency container
 *
 * @param config Application configuration
 * @param logger Logger instance
 * @returns Initialized dependency container
 */
export async function buildContainer(
  config: AppConfig,
  logger: ILogger,
): Promise<DependencyContainer> {
  const container = new DependencyContainer(config, logger);
  await container.build();
  return container;
}
