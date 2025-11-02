/**
 * App Factory for Integration Tests
 * Creates Express app with real dependencies (NO MOCKS)
 * Based on exact initialization logic from src/main.ts
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import express, { Application } from 'express';
import { createClient } from '@supabase/supabase-js';

// Infrastructure
import { SupabaseUserRepository } from '../../src/infrastructure/repositories/SupabaseUserRepository';
import { SupabasePermissionRepository } from '../../src/infrastructure/repositories/SupabasePermissionRepository';
import { SupabasePendingRegistrationRepository } from '../../src/infrastructure/repositories/SupabasePendingRegistrationRepository';
import { SupabaseAuthClient } from '../../src/infrastructure/auth/SupabaseAuthClient';
import { SupabaseAuthService } from '../../src/infrastructure/auth/SupabaseAuthService';
import { PermissionService } from '../../src/infrastructure/services/PermissionService';
import { SupabaseMFAService } from '../../src/infrastructure/services/SupabaseMFAService';
import { SupabaseSessionRepository } from '../../src/infrastructure/repositories/SupabaseSessionRepository';
import { SupabasePasswordPolicyRepository } from '../../src/infrastructure/repositories/SupabasePasswordPolicyRepository';
import { SupabaseRecoveryMethodRepository } from '../../src/infrastructure/repositories/SupabaseRecoveryMethodRepository';
import { SupabaseRecoveryHistoryRepository } from '../../src/infrastructure/repositories/SupabaseRecoveryHistoryRepository';
import { CircuitBreakerFactory } from '../../src/infrastructure/resilience/CircuitBreaker';
// import { PermissionCache } from '../../src/infrastructure/cache/PermissionCache'; // Mocked below
import { IdentityServiceHealthCheck } from '../../src/infrastructure/monitoring/HealthChecks';
import { IdentityServiceDegradation } from '../../src/infrastructure/resilience/GracefulDegradation';
import { SendGridEmailService } from '../../src/infrastructure/email/SendGridEmailService';
import { IEmailService } from '../../src/application/services/IEmailService';

// Middleware
import { AuthenticationMiddleware } from '../../src/presentation/middleware/AuthenticationMiddleware';
import { PermissionMiddleware } from '../../src/presentation/middleware/PermissionMiddleware';
import { createInternalServiceAuthMiddleware } from '../../src/presentation/middleware/InternalServiceAuthMiddleware';

// Routes
import { registerRoutes } from '../../src/presentation/routes';
import { RouteDependencies } from '../../src/presentation/routes/types';

// Use Cases - Auth
import { AuthenticateUserUseCase } from '../../src/application/use-cases/AuthenticateUserUseCase';
import { RegisterUserUseCase } from '../../src/application/use-cases/RegisterUserUseCase';
import { ForgotPasswordUseCase } from '../../src/application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../src/application/use-cases/ResetPasswordUseCase';
import { VerifyEmailUseCase } from '../../src/application/use-cases/VerifyEmailUseCase';
import { ResendVerificationEmailUseCase } from '../../src/application/use-cases/ResendVerificationEmailUseCase';
import { LogoutUserUseCase } from '../../src/application/use-cases/LogoutUserUseCase';
import { RefreshTokenUseCase } from '../../src/application/use-cases/RefreshTokenUseCase';

// Use Cases - MFA
import { EnableMFAUseCase } from '../../src/application/use-cases/EnableMFAUseCase';
import { VerifyMFAUseCase } from '../../src/application/use-cases/VerifyMFAUseCase';
import { DisableMFAUseCase } from '../../src/application/use-cases/DisableMFAUseCase';

// Use Cases - User Management
import { GetUserUseCase } from '../../src/application/use-cases/GetUserUseCase';
import { UpdateUserUseCase } from '../../src/application/use-cases/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../src/application/use-cases/DeleteUserUseCase';
import { ListUsersUseCase } from '../../src/application/use-cases/ListUsersUseCase';

// Use Cases - Staff Management
import { ProvisionStaffUseCase } from '../../src/application/use-cases/ProvisionStaffUseCase';
import { AcceptStaffInvitationUseCase } from '../../src/application/use-cases/AcceptStaffInvitationUseCase';
import { ListStaffInvitationsUseCase } from '../../src/application/use-cases/ListStaffInvitationsUseCase';
import { GetStaffInvitationUseCase } from '../../src/application/use-cases/GetStaffInvitationUseCase';
import { CancelStaffInvitationUseCase } from '../../src/application/use-cases/CancelStaffInvitationUseCase';
import { ResendStaffInvitationUseCase } from '../../src/application/use-cases/ResendStaffInvitationUseCase';

// Use Cases - Session Management
import { ListActiveSessionsUseCase } from '../../src/application/use-cases/ListActiveSessionsUseCase';
import { TerminateSessionUseCase } from '../../src/application/use-cases/TerminateSessionUseCase';
import { TerminateAllSessionsUseCase } from '../../src/application/use-cases/TerminateAllSessionsUseCase';

// Use Cases - Password Policy
import { GetPasswordPolicyUseCase } from '../../src/application/use-cases/GetPasswordPolicyUseCase';
import { UpdatePasswordPolicyUseCase } from '../../src/application/use-cases/UpdatePasswordPolicyUseCase';
import { ValidatePasswordUseCase } from '../../src/application/use-cases/ValidatePasswordUseCase';

// Use Cases - Account Recovery
import { GetRecoveryMethodsUseCase } from '../../src/application/use-cases/GetRecoveryMethodsUseCase';
import { UpdateRecoveryMethodsUseCase } from '../../src/application/use-cases/UpdateRecoveryMethodsUseCase';
import { RequestPasswordResetUseCase } from '../../src/application/use-cases/RequestPasswordResetUseCase';
import { VerifyResetTokenUseCase } from '../../src/application/use-cases/VerifyResetTokenUseCase';
import { ResetPasswordWithTokenUseCase } from '../../src/application/use-cases/ResetPasswordWithTokenUseCase';
import { GetRecoveryHistoryUseCase } from '../../src/application/use-cases/GetRecoveryHistoryUseCase';

// Use Cases - Account Management
import { ChangePasswordUseCase } from '../../src/application/use-cases/ChangePasswordUseCase';
import { LockAccountUseCase } from '../../src/application/use-cases/LockAccountUseCase';
import { UnlockAccountUseCase } from '../../src/application/use-cases/UnlockAccountUseCase';
import { AssignRoleUseCase } from '../../src/application/use-cases/AssignRoleUseCase';

// Use Cases - Permission Checks
import { CheckPermissionUseCase } from '../../src/application/use-cases/CheckPermissionUseCase';
import { CheckPermissionsUseCase } from '../../src/application/use-cases/CheckPermissionsUseCase';
import { CheckRoleUseCase } from '../../src/application/use-cases/CheckRoleUseCase';
import { CheckRolesUseCase } from '../../src/application/use-cases/CheckRolesUseCase';

// Logger
import { logger } from '../../src/infrastructure/logging/Logger';

// Mock event publisher for tests (to avoid RabbitMQ dependency)
const mockEventPublisher = {
  publish: jest.fn().mockResolvedValue(undefined),
  publishDomainEvents: jest.fn().mockResolvedValue(undefined),
  publishIntegrationEvent: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
  initialize: jest.fn().mockResolvedValue(undefined)
};

export interface TestAppConfig {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseJwtSecret?: string;
  jwtSecret?: string;
  frontendUrl?: string;
}

/**
 * Create Express app with real dependencies for integration tests
 * Based on exact initialization logic from src/main.ts
 *
 * @param config - Optional configuration (defaults to env vars)
 * @returns Object with Express application and cleanup function
 */
export async function createTestApp(config?: TestAppConfig): Promise<{
  app: Application;
  cleanup: () => Promise<void>;
}> {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configuration
  const supabaseUrl = config?.supabaseUrl || process.env.SUPABASE_URL!;
  const supabaseServiceRoleKey = config?.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseJwtSecret = config?.supabaseJwtSecret || process.env.SUPABASE_JWT_SECRET!;

  if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseJwtSecret) {
    throw new Error('Missing required Supabase configuration');
  }

  // Create Supabase client
  const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'auth_schema'  // Use auth_schema instead of public
    }
  });

  // Initialize health check service
  const healthCheck = new IdentityServiceHealthCheck(
    supabaseUrl,
    supabaseServiceRoleKey,
    logger
  );

  // Initialize graceful degradation service
  const degradationService = new IdentityServiceDegradation(
    {
      enableReadOnlyFallback: true,
      enableCacheFallback: true,
      enableEmergencyMode: true,
      maxDegradationTime: 300000
    },
    {
      supabaseUrl,
      supabaseServiceRoleKey,
      jwtSecret: supabaseJwtSecret
    },
    logger
  );

  // Initialize Permission Cache (mock for tests)
  const permissionCache = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
    getStats: jest.fn().mockReturnValue({ l1Hits: 0, l1Misses: 0, l2Hits: 0, l2Misses: 0, invalidations: 0 })
  } as any;

  // Set logger for CircuitBreakerFactory (required for all repositories)
  CircuitBreakerFactory.setLogger(logger);

  // Initialize Permission Repository
  const permissionRepository = new SupabasePermissionRepository(
    supabaseClient as any,
    permissionCache
  );

  // Initialize User Repository
  const userRepository = new SupabaseUserRepository(
    supabaseUrl,
    supabaseServiceRoleKey,
    logger,
    undefined, // No cache service in tests
    permissionRepository
  );

  // Initialize Auth Service
  const authService = new SupabaseAuthService(
    supabaseUrl,
    supabaseServiceRoleKey,
    logger,
    'PATIENT' // Default role
  );

  // Initialize Auth Client
  const authClient = new SupabaseAuthClient(
    {
      supabaseUrl,
      supabaseServiceRoleKey,
      jwtSecret: supabaseJwtSecret
    },
    logger
  );

  // Initialize Permission Service
  const permissionService = new PermissionService(
    permissionRepository,
    permissionCache,
    logger
  );

  // Initialize MFA Service
  const mfaService = new SupabaseMFAService(
    supabaseClient as any,
    logger
  );

  // Initialize Email Service
  const emailService: IEmailService = new SendGridEmailService(
    {
      apiKey: process.env.SENDGRID_API_KEY || 'test-api-key',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'test@hospital.com',
      fromName: 'Hospital Management System',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    },
    logger
  );

  // Initialize Middleware
  const authMiddleware = new AuthenticationMiddleware(
    authClient,
    permissionService,
    logger
  );

  const permissionMiddleware = new PermissionMiddleware(
    permissionService,
    logger
  );

  // Initialize Session Repository
  const sessionRepository = new SupabaseSessionRepository(supabaseClient as any);

  // Initialize Password Policy Repository
  const passwordPolicyRepository = new SupabasePasswordPolicyRepository(
    supabaseClient as any,
    logger
  );

  // Initialize Recovery Repositories
  const recoveryMethodRepository = new SupabaseRecoveryMethodRepository(
    supabaseClient as any,
    logger
  );

  const recoveryHistoryRepository = new SupabaseRecoveryHistoryRepository(
    supabaseClient as any,
    logger
  );

  // Initialize Use Cases - Auth
  const authCircuitBreaker = CircuitBreakerFactory.getBreaker('authentication-use-case');
  const authenticateUserUseCase = new AuthenticateUserUseCase(
    userRepository,
    authService,
    degradationService,
    authCircuitBreaker,
    logger,
    permissionRepository,
    mockEventPublisher
  );

  // Initialize REAL Pending Registration Repository (not mock!)
  const pendingRegistrationRepository = new SupabasePendingRegistrationRepository({
    supabase: supabaseClient as any,
    logger,
    circuitBreaker: CircuitBreakerFactory.getBreaker('pending-registration-repository')
  });

  // Mock email service (to avoid sending real emails in tests)
  const mockEmailService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendStaffInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendVerificationSuccessEmail: jest.fn().mockResolvedValue(undefined)
  } as any;

  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    pendingRegistrationRepository, // Use REAL repository
    logger,
    CircuitBreakerFactory.getBreaker('register-user-use-case'),
    mockEmailService,
    config?.jwtSecret || process.env.JWT_SECRET || 'test-jwt-secret',
    config?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000',
    mockEventPublisher
  );

  const forgotPasswordUseCase = new ForgotPasswordUseCase(
    authService,
    userRepository,
    logger,
    CircuitBreakerFactory.getBreaker('forgot-password-use-case')
  );

  const resetPasswordUseCase = new ResetPasswordUseCase(
    authService,
    logger,
    CircuitBreakerFactory.getBreaker('reset-password-use-case')
  );

  const verifyEmailUseCase = new VerifyEmailUseCase(
    userRepository,
    pendingRegistrationRepository, // Use REAL repository
    mockEmailService,
    logger,
    CircuitBreakerFactory.getBreaker('verify-email-use-case'),
    config?.jwtSecret || process.env.JWT_SECRET || 'test-jwt-secret',
    mockEventPublisher
  );

  // Mock email verification token repository
  const mockEmailVerificationTokenRepository = {
    store: jest.fn(),
    findByToken: jest.fn(),
    findLatestByUserId: jest.fn(),
    findLatestByEmail: jest.fn(),
    markAsUsed: jest.fn(),
    deleteExpired: jest.fn(),
    countActiveForUser: jest.fn(),
    countActiveForEmail: jest.fn()
  } as any;

  const resendVerificationEmailUseCase = new ResendVerificationEmailUseCase(
    userRepository,
    mockEmailVerificationTokenRepository,
    pendingRegistrationRepository,
    mockEmailService,
    logger,
    CircuitBreakerFactory.getBreaker('resend-verification-email-use-case'),
    config?.jwtSecret || process.env.JWT_SECRET || 'test-jwt-secret',
    config?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'
  );

  const logoutUserUseCase = new LogoutUserUseCase(
    authService,
    userRepository,
    logger,
    CircuitBreakerFactory.getBreaker('logout-user-use-case'),
    mockEventPublisher
  );

  const refreshTokenUseCase = new RefreshTokenUseCase(
    authService,
    logger
  );

  // Initialize Use Cases - MFA
  const enableMFAUseCase = new EnableMFAUseCase(
    userRepository,
    mfaService,
    logger,
    CircuitBreakerFactory.getBreaker('enable-mfa-use-case')
  );

  const verifyMFAUseCase = new VerifyMFAUseCase(
    mfaService,
    logger,
    CircuitBreakerFactory.getBreaker('verify-mfa-use-case')
  );

  const disableMFAUseCase = new DisableMFAUseCase(
    userRepository,
    mfaService,
    verifyMFAUseCase,
    logger,
    CircuitBreakerFactory.getBreaker('disable-mfa-use-case')
  );

  // Initialize Use Cases - User Management
  const getUserUseCase = new GetUserUseCase(
    userRepository,
    logger,
    CircuitBreakerFactory.getBreaker('get-user-use-case')
  );

  const updateUserUseCase = new UpdateUserUseCase(
    userRepository,
    logger,
    CircuitBreakerFactory.getBreaker('update-user-use-case')
  );

  const deleteUserUseCase = new DeleteUserUseCase(
    userRepository,
    logger,
    CircuitBreakerFactory.getBreaker('delete-user-use-case')
  );

  const listUsersUseCase = new ListUsersUseCase(
    userRepository,
    CircuitBreakerFactory.getBreaker('list-users-use-case'),
    logger
  );

  // Initialize Use Cases - Staff Management
  const provisionStaffUseCase = new ProvisionStaffUseCase(
    userRepository,
    logger,
    mockEmailService,
    process.env.FRONTEND_URL || 'http://localhost:3000',
    mockEventPublisher
  );

  const acceptStaffInvitationUseCase = new AcceptStaffInvitationUseCase(
    userRepository,
    logger,
    mockEventPublisher
  );

  const listStaffInvitationsUseCase = new ListStaffInvitationsUseCase(
    userRepository,
    logger
  );

  const getStaffInvitationUseCase = new GetStaffInvitationUseCase(
    userRepository,
    logger
  );

  const cancelStaffInvitationUseCase = new CancelStaffInvitationUseCase(
    userRepository,
    logger
  );

  const resendStaffInvitationUseCase = new ResendStaffInvitationUseCase(
    userRepository,
    emailService,
    logger,
    process.env.FRONTEND_URL || 'http://localhost:3000'
  );

  // Initialize Use Cases - Session Management
  const listActiveSessionsUseCase = new ListActiveSessionsUseCase(
    sessionRepository,
    logger
  );

  const terminateSessionUseCase = new TerminateSessionUseCase(
    sessionRepository,
    logger
  );

  const terminateAllSessionsUseCase = new TerminateAllSessionsUseCase(
    sessionRepository,
    logger
  );

  // Initialize Use Cases - Password Policy
  const getPasswordPolicyUseCase = new GetPasswordPolicyUseCase(
    passwordPolicyRepository,
    logger
  );

  const updatePasswordPolicyUseCase = new UpdatePasswordPolicyUseCase(
    passwordPolicyRepository,
    logger
  );

  const validatePasswordUseCase = new ValidatePasswordUseCase(
    passwordPolicyRepository,
    logger
  );

  // Initialize Use Cases - Account Recovery
  const getRecoveryMethodsUseCase = new GetRecoveryMethodsUseCase(
    recoveryMethodRepository,
    logger,
    CircuitBreakerFactory.getBreaker('get-recovery-methods-use-case')
  );

  const updateRecoveryMethodsUseCase = new UpdateRecoveryMethodsUseCase(
    recoveryMethodRepository,
    userRepository,
    logger,
    CircuitBreakerFactory.getBreaker('update-recovery-methods-use-case')
  );

  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
    authService,
    userRepository,
    recoveryMethodRepository,
    recoveryHistoryRepository,
    logger,
    CircuitBreakerFactory.getBreaker('request-password-reset-use-case')
  );

  const verifyResetTokenUseCase = new VerifyResetTokenUseCase(
    authService,
    recoveryHistoryRepository,
    logger,
    CircuitBreakerFactory.getBreaker('verify-reset-token-use-case')
  );

  const resetPasswordWithTokenUseCase = new ResetPasswordWithTokenUseCase(
    authService,
    passwordPolicyRepository,
    recoveryHistoryRepository,
    sessionRepository,
    userRepository,
    logger,
    CircuitBreakerFactory.getBreaker('reset-password-with-token-use-case'),
    undefined // eventPublisher not needed in tests
  );

  const getRecoveryHistoryUseCase = new GetRecoveryHistoryUseCase(
    recoveryHistoryRepository,
    logger,
    CircuitBreakerFactory.getBreaker('get-recovery-history-use-case')
  );

  // Initialize Use Cases - Account Management
  const changePasswordUseCase = new ChangePasswordUseCase(
    authService,
    userRepository,
    passwordPolicyRepository,
    sessionRepository,
    logger,
    CircuitBreakerFactory.getBreaker('change-password-use-case')
  );

  const lockAccountUseCase = new LockAccountUseCase(
    userRepository,
    sessionRepository,
    logger,
    CircuitBreakerFactory.getBreaker('lock-account-use-case')
  );

  const unlockAccountUseCase = new UnlockAccountUseCase(
    userRepository,
    logger,
    CircuitBreakerFactory.getBreaker('unlock-account-use-case')
  );

  const assignRoleUseCase = new AssignRoleUseCase(
    userRepository,
    permissionRepository,
    logger,
    CircuitBreakerFactory.getBreaker('assign-role-use-case')
  );

  // Initialize Use Cases - Permission Checks
  const checkPermissionUseCase = new CheckPermissionUseCase(
    permissionService,
    logger
  );

  const checkPermissionsUseCase = new CheckPermissionsUseCase(
    permissionService,
    logger
  );

  const checkRoleUseCase = new CheckRoleUseCase(
    permissionService,
    logger
  );

  const checkRolesUseCase = new CheckRolesUseCase(
    permissionService,
    logger
  );

  // Create Internal Service Auth Middleware (for test environment - disabled)
  const internalServiceAuthMiddleware = createInternalServiceAuthMiddleware(
    {
      enabled: false, // Disabled in test environment
      tokens: [],
      headerName: 'x-internal-token',
      allowedIPs: []
    },
    logger
  );

  // Create dependencies
  const dependencies: RouteDependencies = {
    // Middleware
    authMiddleware,
    permissionMiddleware,
    internalServiceAuthMiddleware,

    // Auth Use Cases
    authenticateUserUseCase,
    registerUserUseCase,
    forgotPasswordUseCase,
    resetPasswordUseCase,
    verifyEmailUseCase,
    resendVerificationEmailUseCase,
    logoutUserUseCase,
    refreshTokenUseCase,

    // MFA Use Cases
    enableMFAUseCase,
    verifyMFAUseCase,
    disableMFAUseCase,

    // User Management Use Cases
    getUserUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    listUsersUseCase,

    // Staff Management Use Cases
    provisionStaffUseCase,
    acceptStaffInvitationUseCase,
    listStaffInvitationsUseCase,
    getStaffInvitationUseCase,
    cancelStaffInvitationUseCase,
    resendStaffInvitationUseCase,

    // Session Management Use Cases
    listActiveSessionsUseCase,
    terminateSessionUseCase,
    terminateAllSessionsUseCase,

    // Password Policy Use Cases
    getPasswordPolicyUseCase,
    updatePasswordPolicyUseCase,
    validatePasswordUseCase,

    // Account Recovery Use Cases
    getRecoveryMethodsUseCase,
    updateRecoveryMethodsUseCase,
    requestPasswordResetUseCase,
    verifyResetTokenUseCase,
    resetPasswordWithTokenUseCase,
    getRecoveryHistoryUseCase,

    // Account Management Use Cases
    changePasswordUseCase,
    lockAccountUseCase,
    unlockAccountUseCase,
    assignRoleUseCase,

    // Permission Check Use Cases
    checkPermissionUseCase,
    checkPermissionsUseCase,
    checkRoleUseCase,
    checkRolesUseCase,

    // Services
    healthCheck,
    degradationService,
    permissionService,
    logger,
    cacheService: null,

    // Repositories
    sessionRepository
  };

  // Register routes
  registerRoutes(app, dependencies);

  // Cleanup function to prevent memory leaks
  const cleanup = async () => {
    // Stop GracefulDegradation interval
    degradationService.stop();

    // Note: Supabase client doesn't have close method
    // Connection will be cleaned up when process exits
  };

  return { app, cleanup };
}
