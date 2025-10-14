/**
 * Identity Service Consolidated - Main Application
 * Production-ready service with enhanced monitoring and resilience
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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
// Infrastructure imports
import { IdentityServiceHealthCheck } from './infrastructure/monitoring/HealthChecks';
import { IdentityServiceDegradation } from './infrastructure/resilience/GracefulDegradation';
import { CircuitBreakerFactory } from './infrastructure/resilience/CircuitBreaker';
import { SupabaseUserRepository } from './infrastructure/repositories/SupabaseUserRepository';
import { SupabasePermissionRepository } from './infrastructure/repositories/SupabasePermissionRepository';
import { SupabaseAuthClient } from './infrastructure/auth/SupabaseAuthClient';
import { PermissionService } from './infrastructure/services/PermissionService';
import { SupabaseMFAService } from './infrastructure/services/SupabaseMFAService';
import { RedisCacheService } from './infrastructure/cache/RedisCacheService';
import { PermissionCache } from './infrastructure/cache/PermissionCache';

// Middleware imports
import { AuthenticationMiddleware } from './presentation/middleware/AuthenticationMiddleware';
import { PermissionMiddleware } from './presentation/middleware/PermissionMiddleware';

// Routes imports
import { registerRoutes } from './presentation/routes';
import { RouteDependencies } from './presentation/routes/types';

// Application imports
import { IAuthenticationService } from './application/services/IAuthenticationService';
import { ILogger, LogMetadata } from './application/services/ILogger';
import { AuthenticateUserUseCase } from './application/use-cases/AuthenticateUserUseCase';
import { SupabaseAuthService } from './infrastructure/auth/SupabaseAuthService';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';
import { ForgotPasswordUseCase } from './application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from './application/use-cases/ResetPasswordUseCase';
import { VerifyEmailUseCase } from './application/use-cases/VerifyEmailUseCase';
import { LogoutUserUseCase } from './application/use-cases/LogoutUserUseCase';
import { EnableMFAUseCase } from './application/use-cases/EnableMFAUseCase';
import { VerifyMFAUseCase } from './application/use-cases/VerifyMFAUseCase';
import { DisableMFAUseCase } from './application/use-cases/DisableMFAUseCase';
import { GetUserUseCase } from './application/use-cases/GetUserUseCase';
import { UpdateUserUseCase } from './application/use-cases/UpdateUserUseCase';
import { DeleteUserUseCase } from './application/use-cases/DeleteUserUseCase';
import { ListUsersUseCase } from './application/use-cases/ListUsersUseCase';
import { RefreshTokenUseCase } from './application/use-cases/RefreshTokenUseCase';
import { ProvisionStaffUseCase } from './application/use-cases/ProvisionStaffUseCase';
import { AcceptStaffInvitationUseCase } from './application/use-cases/AcceptStaffInvitationUseCase';
import { RabbitMQEventPublisher } from './infrastructure/events/RabbitMQEventPublisher';
import { IEventPublisher } from './application/services/IEventPublisher';

// Session Management imports
import { ListActiveSessionsUseCase } from './application/use-cases/ListActiveSessionsUseCase';
import { TerminateSessionUseCase } from './application/use-cases/TerminateSessionUseCase';
import { TerminateAllSessionsUseCase } from './application/use-cases/TerminateAllSessionsUseCase';
import { SupabaseSessionRepository } from './infrastructure/repositories/SupabaseSessionRepository';

// Password Policy imports
import { GetPasswordPolicyUseCase } from './application/use-cases/GetPasswordPolicyUseCase';
import { UpdatePasswordPolicyUseCase } from './application/use-cases/UpdatePasswordPolicyUseCase';
import { ValidatePasswordUseCase } from './application/use-cases/ValidatePasswordUseCase';
import { SupabasePasswordPolicyRepository } from './infrastructure/repositories/SupabasePasswordPolicyRepository';

// Account Recovery imports
import { GetRecoveryMethodsUseCase } from './application/use-cases/GetRecoveryMethodsUseCase';
import { UpdateRecoveryMethodsUseCase } from './application/use-cases/UpdateRecoveryMethodsUseCase';
import { RequestPasswordResetUseCase } from './application/use-cases/RequestPasswordResetUseCase';
import { VerifyResetTokenUseCase } from './application/use-cases/VerifyResetTokenUseCase';
import { ResetPasswordWithTokenUseCase } from './application/use-cases/ResetPasswordWithTokenUseCase';
import { GetRecoveryHistoryUseCase } from './application/use-cases/GetRecoveryHistoryUseCase';
import { SupabaseRecoveryMethodRepository } from './infrastructure/repositories/SupabaseRecoveryMethodRepository';
import { SupabaseRecoveryHistoryRepository } from './infrastructure/repositories/SupabaseRecoveryHistoryRepository';

// P1 Features - Account Management imports
import { ChangePasswordUseCase } from './application/use-cases/ChangePasswordUseCase';
import { LockAccountUseCase } from './application/use-cases/LockAccountUseCase';
import { UnlockAccountUseCase } from './application/use-cases/UnlockAccountUseCase';
import { AssignRoleUseCase } from './application/use-cases/AssignRoleUseCase';

// Permission Check imports (for API Gateway)
import { CheckPermissionUseCase } from './application/use-cases/CheckPermissionUseCase';
import { CheckPermissionsUseCase } from './application/use-cases/CheckPermissionsUseCase';
import { CheckRoleUseCase } from './application/use-cases/CheckRoleUseCase';
import { CheckRolesUseCase } from './application/use-cases/CheckRolesUseCase';

// Configuration
const config = {
  port: process.env.PORT || 3001,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'identity-service',
  version: '2.0.0',
  // Pure RBAC Configuration
  defaultUserRole: process.env.DEFAULT_USER_ROLE || 'patient' // Default role for new users
};

// Logger setup (simplified - in production use Winston or similar)
const logger: ILogger = {
  debug: (message: string, meta?: LogMetadata) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  info: (message: string, meta?: LogMetadata) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  warn: (message: string, meta?: LogMetadata) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, meta?: LogMetadata) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  fatal: (message: string, meta?: LogMetadata) => {
    console.error(`[FATAL] ${new Date().toISOString()} - ${message}`, meta || '');
  }
};

// Helper function to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Identity Service Application Class
 * Implements production-ready patterns and anti-pattern mitigation
 */
class IdentityServiceApp {
  private app: express.Application;
  private supabaseClient!: SupabaseClient;
  private healthCheck!: IdentityServiceHealthCheck;
  private degradationService!: IdentityServiceDegradation;
  private userRepository!: SupabaseUserRepository;
  private permissionRepository!: SupabasePermissionRepository;
  private authService!: IAuthenticationService;
  private authClient!: SupabaseAuthClient;
  private permissionService!: PermissionService;
  private permissionCache!: PermissionCache;
  private mfaService!: SupabaseMFAService;
  private cacheService!: RedisCacheService | null;
  private authMiddleware!: AuthenticationMiddleware;
  private permissionMiddleware!: PermissionMiddleware;
  private authenticateUserUseCase!: AuthenticateUserUseCase;
  private registerUserUseCase!: RegisterUserUseCase;
  private forgotPasswordUseCase!: ForgotPasswordUseCase;
  private resetPasswordUseCase!: ResetPasswordUseCase;
  private verifyEmailUseCase!: VerifyEmailUseCase;
  private logoutUserUseCase!: LogoutUserUseCase;
  private enableMFAUseCase!: EnableMFAUseCase;
  private verifyMFAUseCase!: VerifyMFAUseCase;
  private disableMFAUseCase!: DisableMFAUseCase;
  private getUserUseCase!: GetUserUseCase;
  private updateUserUseCase!: UpdateUserUseCase;
  private deleteUserUseCase!: DeleteUserUseCase;
  private listUsersUseCase!: ListUsersUseCase;
  private refreshTokenUseCase!: RefreshTokenUseCase;
  private provisionStaffUseCase!: ProvisionStaffUseCase;
  private acceptStaffInvitationUseCase!: AcceptStaffInvitationUseCase;
  private eventPublisher!: IEventPublisher;

  // Session Management use cases
  private sessionRepository!: SupabaseSessionRepository;
  private listActiveSessionsUseCase!: ListActiveSessionsUseCase;
  private terminateSessionUseCase!: TerminateSessionUseCase;
  private terminateAllSessionsUseCase!: TerminateAllSessionsUseCase;

  // Password Policy use cases
  private passwordPolicyRepository!: SupabasePasswordPolicyRepository;
  private getPasswordPolicyUseCase!: GetPasswordPolicyUseCase;
  private updatePasswordPolicyUseCase!: UpdatePasswordPolicyUseCase;
  private validatePasswordUseCase!: ValidatePasswordUseCase;

  // Account Recovery
  private recoveryMethodRepository!: SupabaseRecoveryMethodRepository;
  private recoveryHistoryRepository!: SupabaseRecoveryHistoryRepository;
  private getRecoveryMethodsUseCase!: GetRecoveryMethodsUseCase;
  private updateRecoveryMethodsUseCase!: UpdateRecoveryMethodsUseCase;
  private requestPasswordResetUseCase!: RequestPasswordResetUseCase;
  private verifyResetTokenUseCase!: VerifyResetTokenUseCase;
  private resetPasswordWithTokenUseCase!: ResetPasswordWithTokenUseCase;
  private getRecoveryHistoryUseCase!: GetRecoveryHistoryUseCase;

  // P1 Features - Account Management
  private changePasswordUseCase!: ChangePasswordUseCase;
  private lockAccountUseCase!: LockAccountUseCase;
  private unlockAccountUseCase!: UnlockAccountUseCase;
  private assignRoleUseCase!: AssignRoleUseCase;

  // Permission Check Use Cases (for API Gateway)
  private checkPermissionUseCase!: CheckPermissionUseCase;
  private checkPermissionsUseCase!: CheckPermissionsUseCase;
  private checkRoleUseCase!: CheckRoleUseCase;
  private checkRolesUseCase!: CheckRolesUseCase;

  constructor() {
    this.app = express();
    // Note: initializeInfrastructure is now async, called in initialize()
    this.setupMiddleware();
    // setupRoutes() moved to initialize() after infrastructure is ready
    this.setupErrorHandling();
  }

  /**
   * Initialize the application (async wrapper for constructor)
   */
  async initialize(): Promise<void> {
    await this.initializeInfrastructure();
    // Setup routes AFTER infrastructure is initialized
    this.setupRoutes();
  }

  /**
   * Initialize infrastructure components
   */
  private async initializeInfrastructure(): Promise<void> {
    try {
      // Initialize shared Supabase client
      this.supabaseClient = createClient(
        config.supabaseUrl,
        config.supabaseKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Initialize health check service
      this.healthCheck = new IdentityServiceHealthCheck(
        config.supabaseUrl,
        config.supabaseKey,
        logger
      );

      // Initialize graceful degradation service
      this.degradationService = new IdentityServiceDegradation(
        {
          enableReadOnlyFallback: true,
          enableCacheFallback: true,
          enableEmergencyMode: true,
          maxDegradationTime: 300000 // 5 minutes
        },
        {
          supabaseUrl: config.supabaseUrl,
          supabaseServiceRoleKey: config.supabaseKey,
          jwtSecret: config.jwtSecret
        },
        logger
      );

      // Initialize Redis Cache Service (optional)
      try {
        this.cacheService = new RedisCacheService(
          process.env.REDIS_URL || 'redis://localhost:6379',
          logger
        );
        // IMPORTANT: Connect to Redis immediately
        await this.cacheService.connect();
        logger.info('Redis cache service initialized and connected');
      } catch (error) {
        logger.warn('Redis cache not available, running without cache', { error });
        this.cacheService = null;
      }

      // Initialize Event Publisher (RabbitMQ)
      const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673';
      this.eventPublisher = new RabbitMQEventPublisher(rabbitMQUrl, logger);
      try {
        await this.eventPublisher.initialize?.();
        logger.info('Event Publisher initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Event Publisher', { error: getErrorMessage(error) });
        logger.warn('Continuing without event publishing');
      }

      // Initialize Permission Cache (Pure RBAC)
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.permissionCache = new PermissionCache(redisUrl);
      try {
        await this.permissionCache.connect();
        logger.info('Permission Cache connected successfully');
      } catch (error) {
        logger.error('Failed to connect Permission Cache', { error: getErrorMessage(error) });
        logger.warn('Continuing without permission caching - permissions will be fetched from database');
        // Service can continue without cache, just slower
      }

      // Initialize Permission Repository (Pure RBAC)
      this.permissionRepository = new SupabasePermissionRepository(
        this.supabaseClient,
        this.permissionCache
      );

      // Initialize User Repository (with permissionRepository for Pure RBAC)
      this.userRepository = new SupabaseUserRepository(
        config.supabaseUrl,
        config.supabaseKey,
        logger,
        this.cacheService || undefined,
        this.permissionRepository
      );

      // Initialize Supabase Auth Service with configurable default role
      this.authService = new SupabaseAuthService(
        config.supabaseUrl,
        config.supabaseKey,
        logger,
        config.defaultUserRole
      );

      // Initialize Supabase Auth Client for middleware
      this.authClient = new SupabaseAuthClient(
        {
          supabaseUrl: config.supabaseUrl,
          supabaseServiceRoleKey: config.supabaseKey,
          jwtSecret: config.jwtSecret
        },
        logger
      );

      // Initialize Permission Service (Pure RBAC)
      this.permissionService = new PermissionService(
        this.permissionRepository,
        this.permissionCache
      );

      // Initialize MFA Service
      this.mfaService = new SupabaseMFAService(
        this.supabaseClient, // Use shared Supabase client
        logger
      );

      // Initialize Middleware
      this.authMiddleware = new AuthenticationMiddleware(
        this.authClient,
        this.permissionService,
        logger
      );

      this.permissionMiddleware = new PermissionMiddleware(
        this.permissionService,
        logger
      );

      // Initialize use cases
      const authCircuitBreaker = CircuitBreakerFactory.getBreaker('authentication-use-case');
      this.authenticateUserUseCase = new AuthenticateUserUseCase(
        this.userRepository,
        this.authService,
        this.degradationService,
        authCircuitBreaker,
        logger,
        this.permissionRepository,
        this.eventPublisher // Add event publisher
      );

      // RegisterUserUseCase now uses explicit control via repository
      // No longer needs authService - repository handles auth user creation
      // Requires permissionRepository for dynamic role validation
      this.registerUserUseCase = new RegisterUserUseCase(
        this.userRepository,
        this.permissionRepository,
        logger,
        CircuitBreakerFactory.getBreaker('register-user-use-case'),
        this.eventPublisher // Add event publisher
      );

      this.forgotPasswordUseCase = new ForgotPasswordUseCase(
        this.authService,
        this.userRepository,
        logger,
        CircuitBreakerFactory.getBreaker('forgot-password-use-case')
      );

      this.resetPasswordUseCase = new ResetPasswordUseCase(
        this.authService,
        logger,
        CircuitBreakerFactory.getBreaker('reset-password-use-case')
      );

      this.verifyEmailUseCase = new VerifyEmailUseCase(
        this.authService,
        this.userRepository,
        logger,
        CircuitBreakerFactory.getBreaker('verify-email-use-case'),
        this.eventPublisher // Add event publisher
      );

      this.logoutUserUseCase = new LogoutUserUseCase(
        this.authService,
        this.userRepository,
        logger,
        CircuitBreakerFactory.getBreaker('logout-user-use-case'),
        this.eventPublisher // Add event publisher
      );

      this.enableMFAUseCase = new EnableMFAUseCase(
        this.userRepository,
        this.mfaService,
        logger,
        CircuitBreakerFactory.getBreaker('enable-mfa-use-case')
      );

      this.verifyMFAUseCase = new VerifyMFAUseCase(
        this.mfaService,
        logger,
        CircuitBreakerFactory.getBreaker('verify-mfa-use-case')
      );

      this.disableMFAUseCase = new DisableMFAUseCase(
        this.userRepository,
        this.mfaService,
        this.verifyMFAUseCase,
        logger,
        CircuitBreakerFactory.getBreaker('disable-mfa-use-case')
      );

      // Initialize user management use cases
      this.getUserUseCase = new GetUserUseCase(
        this.userRepository,
        logger,
        CircuitBreakerFactory.getBreaker('get-user-use-case')
      );

      this.updateUserUseCase = new UpdateUserUseCase(
        this.userRepository,
        logger,
        CircuitBreakerFactory.getBreaker('update-user-use-case')
      );

      this.deleteUserUseCase = new DeleteUserUseCase(
        this.userRepository,
        logger,
        CircuitBreakerFactory.getBreaker('delete-user-use-case')
      );

      this.listUsersUseCase = new ListUsersUseCase(
        this.userRepository,
        CircuitBreakerFactory.getBreaker('list-users-use-case'),
        logger
      );

      this.refreshTokenUseCase = new RefreshTokenUseCase(
        this.authService,
        logger
      );

      this.provisionStaffUseCase = new ProvisionStaffUseCase(
        this.userRepository,
        logger,
        this.eventPublisher // Add event publisher
      );

      this.acceptStaffInvitationUseCase = new AcceptStaffInvitationUseCase(
        this.userRepository,
        logger,
        this.eventPublisher
      );

      // Initialize Session Management use cases
      this.sessionRepository = new SupabaseSessionRepository(this.supabaseClient);

      this.listActiveSessionsUseCase = new ListActiveSessionsUseCase(
        this.sessionRepository,
        logger
      );

      this.terminateSessionUseCase = new TerminateSessionUseCase(
        this.sessionRepository
      );

      this.terminateAllSessionsUseCase = new TerminateAllSessionsUseCase(
        this.sessionRepository
      );

      // Initialize Password Policy use cases
      this.passwordPolicyRepository = new SupabasePasswordPolicyRepository(
        this.supabaseClient,
        logger
      );

      this.getPasswordPolicyUseCase = new GetPasswordPolicyUseCase(
        this.passwordPolicyRepository,
        logger
      );

      this.updatePasswordPolicyUseCase = new UpdatePasswordPolicyUseCase(
        this.passwordPolicyRepository,
        logger
      );

      this.validatePasswordUseCase = new ValidatePasswordUseCase(
        this.passwordPolicyRepository,
        logger
      );

      // Initialize Account Recovery use cases
      this.recoveryMethodRepository = new SupabaseRecoveryMethodRepository(
        this.supabaseClient,
        logger
      );

      this.recoveryHistoryRepository = new SupabaseRecoveryHistoryRepository(
        this.supabaseClient,
        logger
      );

      this.getRecoveryMethodsUseCase = new GetRecoveryMethodsUseCase(
        this.recoveryMethodRepository,
        logger,
        CircuitBreakerFactory.getBreaker('get-recovery-methods-use-case')
      );

      this.updateRecoveryMethodsUseCase = new UpdateRecoveryMethodsUseCase(
        this.recoveryMethodRepository,
        this.userRepository,
        logger,
        CircuitBreakerFactory.getBreaker('update-recovery-methods-use-case')
      );

      this.requestPasswordResetUseCase = new RequestPasswordResetUseCase(
        this.authService,
        this.userRepository,
        this.recoveryMethodRepository,
        this.recoveryHistoryRepository,
        logger,
        CircuitBreakerFactory.getBreaker('request-password-reset-use-case')
      );

      this.verifyResetTokenUseCase = new VerifyResetTokenUseCase(
        this.authService,
        this.recoveryHistoryRepository,
        logger,
        CircuitBreakerFactory.getBreaker('verify-reset-token-use-case')
      );

      this.resetPasswordWithTokenUseCase = new ResetPasswordWithTokenUseCase(
        this.authService,
        this.passwordPolicyRepository,
        this.recoveryHistoryRepository,
        this.sessionRepository,
        logger,
        CircuitBreakerFactory.getBreaker('reset-password-with-token-use-case')
      );

      this.getRecoveryHistoryUseCase = new GetRecoveryHistoryUseCase(
        this.recoveryHistoryRepository,
        logger,
        CircuitBreakerFactory.getBreaker('get-recovery-history-use-case')
      );

      // Initialize P1 Features - Account Management use cases
      this.changePasswordUseCase = new ChangePasswordUseCase(
        this.authService,
        this.userRepository,
        this.passwordPolicyRepository,
        this.sessionRepository,
        logger,
        CircuitBreakerFactory.getBreaker('change-password-use-case')
      );

      this.lockAccountUseCase = new LockAccountUseCase(
        this.userRepository,
        this.sessionRepository,
        logger,
        CircuitBreakerFactory.getBreaker('lock-account-use-case')
      );

      this.unlockAccountUseCase = new UnlockAccountUseCase(
        this.userRepository,
        logger,
        CircuitBreakerFactory.getBreaker('unlock-account-use-case')
      );

      this.assignRoleUseCase = new AssignRoleUseCase(
        this.userRepository,
        this.permissionRepository,
        logger,
        CircuitBreakerFactory.getBreaker('assign-role-use-case')
      );

      this.checkPermissionUseCase = new CheckPermissionUseCase(
        this.permissionService,
        logger
      );

      this.checkPermissionsUseCase = new CheckPermissionsUseCase(
        this.permissionService,
        logger
      );

      this.checkRoleUseCase = new CheckRoleUseCase(
        this.permissionService,
        logger
      );

      this.checkRolesUseCase = new CheckRolesUseCase(
        this.permissionService,
        logger
      );

      logger.info('Infrastructure initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize infrastructure', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Setup Express middleware with security and monitoring
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent')?.substring(0, 100),
          ip: req.ip
        });
      });
      
      next();
    });
  }

  /**
   * Setup API routes
   * Routes are now organized in separate modules under presentation/routes/
   */
  private setupRoutes(): void {
    // Swagger UI Documentation
    try {
      const swaggerDocument = YAML.load('./openapi.yaml');
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Identity Service API Documentation'
      }));
      logger.info('Swagger UI available at /api-docs');
    } catch (error) {
      logger.warn('Failed to load OpenAPI spec', { error: getErrorMessage(error) });
    }

    // Prepare dependencies for routes
    const routeDeps: RouteDependencies = {
      // Middleware
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,

      // Auth Use Cases
      authenticateUserUseCase: this.authenticateUserUseCase,
      registerUserUseCase: this.registerUserUseCase,
      forgotPasswordUseCase: this.forgotPasswordUseCase,
      resetPasswordUseCase: this.resetPasswordUseCase,
      verifyEmailUseCase: this.verifyEmailUseCase,
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
      permissionService: this.permissionService
    };

    // Register all routes
    registerRoutes(this.app, routeDeps);
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        method: req.method
      });

      res.status(500).json({
        error: 'Lỗi hệ thống không xác định',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: getErrorMessage(error), stack: error.stack });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      process.exit(1);
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize infrastructure (async)
      await this.initialize();

      // Perform initial health check
      const health = await this.healthCheck.checkHealth();
      if (health.overall === 'UNHEALTHY') {
        logger.warn('Service starting with unhealthy status', { health });
      }

      // Start server
      this.app.listen(config.port, () => {
        logger.info('Identity Service Consolidated started', {
          port: config.port,
          environment: config.nodeEnv,
          version: config.version,
          healthStatus: health.overall
        });
      });

      // Setup periodic health checks
      setInterval(async () => {
        try {
          this.degradationService.checkRecovery();
        } catch (error) {
          logger.error('Periodic health check failed', { error: getErrorMessage(error) });
        }
      }, 30000); // Every 30 seconds

    } catch (error) {
      logger.error('Failed to start service', { error: getErrorMessage(error) });
      process.exit(1);
    }
  }
}

// Start the application
if (require.main === module) {
  const app = new IdentityServiceApp();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    try {
      // Close RabbitMQ connection
      if (app['eventPublisher']) {
        await app['eventPublisher'].close?.();
        logger.info('Event Publisher closed');
      }

      // Close Redis connection
      if (app['permissionCache']) {
        await app['permissionCache'].disconnect();
        logger.info('Permission Cache disconnected');
      }

      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: getErrorMessage(error) });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default IdentityServiceApp;
