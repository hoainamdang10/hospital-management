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

import express, { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Extend Express Request type to include user
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
import { UserId } from './domain/value-objects/UserId';

// Middleware imports
import { AuthenticationMiddleware } from './presentation/middleware/AuthenticationMiddleware';
import { PermissionMiddleware } from './presentation/middleware/PermissionMiddleware';

// Application imports
import { IAuthenticationService } from './application/services/IAuthenticationService';
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
import { RabbitMQEventPublisher, IEventPublisher } from './infrastructure/events/RabbitMQEventPublisher';

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
const logger = {
  debug: (message: string, meta?: any) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  fatal: (message: string, meta?: any) => {
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
  private passwordPolicyRepository!: any; // Will be typed properly
  private getPasswordPolicyUseCase!: any;
  private updatePasswordPolicyUseCase!: any;
  private validatePasswordUseCase!: any;

  // Account Recovery
  private recoveryMethodRepository!: SupabaseRecoveryMethodRepository;
  private recoveryHistoryRepository!: SupabaseRecoveryHistoryRepository;
  private getRecoveryMethodsUseCase!: GetRecoveryMethodsUseCase;
  private updateRecoveryMethodsUseCase!: UpdateRecoveryMethodsUseCase;
  private requestPasswordResetUseCase!: RequestPasswordResetUseCase;
  private verifyResetTokenUseCase!: VerifyResetTokenUseCase;
  private resetPasswordWithTokenUseCase!: ResetPasswordWithTokenUseCase;
  private getRecoveryHistoryUseCase!: GetRecoveryHistoryUseCase;

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
        await this.eventPublisher.initialize();
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
        this.eventPublisher // Add event publisher
      );

      this.forgotPasswordUseCase = new ForgotPasswordUseCase(
        this.authService,
        this.userRepository,
        logger
      );

      this.resetPasswordUseCase = new ResetPasswordUseCase(
        this.authService,
        logger
      );

      this.verifyEmailUseCase = new VerifyEmailUseCase(
        this.authService,
        this.userRepository,
        logger,
        this.eventPublisher // Add event publisher
      );

      this.logoutUserUseCase = new LogoutUserUseCase(
        this.authService,
        this.userRepository,
        logger,
        this.eventPublisher // Add event publisher
      );

      this.enableMFAUseCase = new EnableMFAUseCase(
        this.userRepository,
        this.mfaService,
        logger
      );

      this.verifyMFAUseCase = new VerifyMFAUseCase(
        this.mfaService,
        logger
      );

      this.disableMFAUseCase = new DisableMFAUseCase(
        this.userRepository,
        this.mfaService,
        this.verifyMFAUseCase,
        logger
      );

      // Initialize user management use cases
      this.getUserUseCase = new GetUserUseCase(
        this.userRepository,
        logger
      );

      this.updateUserUseCase = new UpdateUserUseCase(
        this.userRepository,
        logger
      );

      this.deleteUserUseCase = new DeleteUserUseCase(
        this.userRepository,
        logger
      );

      this.listUsersUseCase = new ListUsersUseCase(
        this.userRepository,
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
        this.sessionRepository
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
        logger
      );

      this.updateRecoveryMethodsUseCase = new UpdateRecoveryMethodsUseCase(
        this.recoveryMethodRepository,
        this.userRepository,
        logger
      );

      this.requestPasswordResetUseCase = new RequestPasswordResetUseCase(
        this.authService,
        this.userRepository,
        this.recoveryMethodRepository,
        this.recoveryHistoryRepository,
        logger
      );

      this.verifyResetTokenUseCase = new VerifyResetTokenUseCase(
        this.authService,
        this.recoveryHistoryRepository,
        logger
      );

      this.resetPasswordWithTokenUseCase = new ResetPasswordWithTokenUseCase(
        this.authService,
        this.passwordPolicyRepository,
        this.recoveryHistoryRepository,
        this.sessionRepository,
        logger
      );

      this.getRecoveryHistoryUseCase = new GetRecoveryHistoryUseCase(
        this.recoveryHistoryRepository,
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
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (_req, res) => {
      try {
        const health = await this.healthCheck.checkHealth();
        const statusCode = health.overall === 'HEALTHY' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Health check failed', { error: getErrorMessage(error) });
        res.status(503).json({
          overall: 'UNHEALTHY',
          error: getErrorMessage(error),
          timestamp: new Date()
        });
      }
    });

    // Service info endpoint
    this.app.get('/info', (_req, res) => {
      res.json({
        service: config.serviceName,
        version: config.version,
        environment: config.nodeEnv,
        timestamp: new Date(),
        uptime: process.uptime(),
        mode: this.degradationService.getStatus().mode
      });
    });

    // Circuit breaker status endpoint
    this.app.get('/circuit-breakers', (_req, res) => {
      try {
        const status = CircuitBreakerFactory.getHealthStatus();
        res.json(status);
      } catch (error) {
        logger.error('Failed to get circuit breaker status', { error: getErrorMessage(error) });
        res.status(500).json({ error: 'Failed to get circuit breaker status' });
      }
    });

    // Authentication endpoint
    this.app.post('/auth/login', async (req, res) => {
      try {
        const request = {
          email: req.body.email,
          password: req.body.password,
          mfaCode: req.body.mfaCode,
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          deviceInfo: {
            platform: req.body.platform,
            browser: req.body.browser,
            version: req.body.version
          }
        };

        const result = await this.authenticateUserUseCase.execute(request);
        
        const statusCode = result.success ? 200 : 401;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Authentication endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Patient Self-Registration endpoint (PUBLIC)
    // Security: Only allows patient registration, staff accounts must be created by admin
    this.app.post('/auth/register', async (req, res) => {
      try {
        const request = {
          email: req.body.email,
          password: req.body.password,
          fullName: req.body.fullName,
          roleType: 'PATIENT', // ✅ SECURITY: Force patient role, prevent privilege escalation
          phoneNumber: req.body.phoneNumber,
          citizenId: req.body.citizenId,
          dateOfBirth: req.body.dateOfBirth,
          gender: req.body.gender,
          address: req.body.address
        };

        const result = await this.registerUserUseCase.execute(request);
        const statusCode = result.success ? 201 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Registration endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Forgot Password endpoint
    this.app.post('/auth/forgot-password', async (req, res) => {
      try {
        const request = {
          email: req.body.email
        };

        const result = await this.forgotPasswordUseCase.execute(request);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Forgot password endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Reset Password endpoint
    this.app.post('/auth/reset-password', async (req, res) => {
      try {
        const request = {
          accessToken: req.body.accessToken,
          newPassword: req.body.newPassword,
          confirmPassword: req.body.confirmPassword
        };

        const result = await this.resetPasswordUseCase.execute(request);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Reset password endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Verify Email endpoint
    this.app.post('/auth/verify-email', async (req, res) => {
      try {
        const request = {
          email: req.body.email,
          token: req.body.token
        };

        const result = await this.verifyEmailUseCase.execute(request);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Verify email endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Accept Staff Invitation endpoint (PUBLIC)
    // Staff clicks link from invitation email and sets password
    this.app.post('/auth/activate-staff', async (req, res) => {
      try {
        const request = {
          invitationToken: req.body.invitationToken,
          password: req.body.password,
          confirmPassword: req.body.confirmPassword,
          fullName: req.body.fullName,
          phoneNumber: req.body.phoneNumber
        };

        const result = await this.acceptStaffInvitationUseCase.execute(request);
        const statusCode = result.success ? 201 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Accept staff invitation endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Logout endpoint
    this.app.post('/auth/logout', async (req, res) => {
      try {
        const request = {
          userId: req.body.userId,
          accessToken: req.headers.authorization?.replace('Bearer ', '') || '',
          sessionId: req.body.sessionId
        };

        const result = await this.logoutUserUseCase.execute(request);
        res.status(200).json(result);
      } catch (error) {
        logger.error('Logout endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Token Refresh endpoint
    this.app.post('/auth/refresh', async (req, res) => {
      try {
        const request = {
          refreshToken: req.body.refreshToken,
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        };

        const result = await this.refreshTokenUseCase.execute(request);
        const statusCode = result.success ? 200 : 401;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Refresh token endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Enable MFA endpoint
    this.app.post('/auth/mfa/enable', async (req, res) => {
      try {
        const request = {
          userId: req.body.userId,
          method: req.body.method,
          phoneNumber: req.body.phoneNumber,
          email: req.body.email
        };

        const result = await this.enableMFAUseCase.execute(request);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Enable MFA endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Verify MFA endpoint
    this.app.post('/auth/mfa/verify', async (req, res) => {
      try {
        const request = {
          userId: req.body.userId,
          code: req.body.code,
          attemptType: req.body.attemptType || 'login',
          method: req.body.method || '2fa_app',
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        };

        const result = await this.verifyMFAUseCase.execute(request);
        const statusCode = result.success ? 200 : 401;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Verify MFA endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // Disable MFA endpoint
    this.app.post('/auth/mfa/disable', async (req, res) => {
      try {
        const request = {
          userId: req.body.userId,
          verificationCode: req.body.verificationCode
        };

        const result = await this.disableMFAUseCase.execute(request);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Disable MFA endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    });

    // ========================================
    // PROTECTED ENDPOINTS - Require Authentication
    // ========================================

    // Get current user profile
    this.app.get('/api/v1/users/me',
      this.authMiddleware.authenticate(),
      async (req: any, res) => {
        try {
          res.json({
            success: true,
            user: req.user
          });
        } catch (error) {
          logger.error('Get user profile error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to get user profile'
          });
        }
      }
    );

    // Get user by ID (admin or self only)
    this.app.get('/api/v1/users/:userId',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requirePermission({
        permissions: ['users:read', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req: any) => req.params.userId
      }),
      async (req: any, res) => {
        try {
          const result = await this.getUserUseCase.execute({
            userId: req.params.userId,
            requesterId: req.user.userId
          });

          const statusCode = result.success ? 200 : 404;
          res.status(statusCode).json(result);
        } catch (error) {
          logger.error('Get user error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to get user'
          });
        }
      }
    );

    // List all users (admin only)
    this.app.get('/api/v1/users',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requireAdmin(),
      async (req: any, res) => {
        try {
          const result = await this.listUsersUseCase.execute({
            requesterId: req.user.userId,
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            roleType: req.query.roleType as string,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            searchTerm: req.query.search as string
          });

          res.json(result);
        } catch (error) {
          logger.error('List users error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to list users'
          });
        }
      }
    );

    // Update user (admin or self only)
    this.app.patch('/api/v1/users/:userId',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requirePermission({
        permissions: ['users:update', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req: any) => req.params.userId
      }),
      async (req: any, res) => {
        try {
          const result = await this.updateUserUseCase.execute({
            userId: req.params.userId,
            requesterId: req.user.userId,
            updates: req.body
          });

          const statusCode = result.success ? 200 : 400;
          res.status(statusCode).json(result);
        } catch (error) {
          logger.error('Update user error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to update user'
          });
        }
      }
    );

    // Delete user (admin only)
    this.app.delete('/api/v1/users/:userId',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requireAdmin(),
      async (req: any, res) => {
        try {
          const result = await this.deleteUserUseCase.execute({
            userId: req.params.userId,
            requesterId: req.user.userId,
            hardDelete: req.query.hard === 'true',
            reason: req.body.reason
          });

          const statusCode = result.success ? 200 : 400;
          res.status(statusCode).json(result);
        } catch (error) {
          logger.error('Delete user error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to delete user'
          });
        }
      }
    );

    // ========================================
    // SESSION MANAGEMENT ENDPOINTS
    // ========================================

    // List active sessions for current user
    this.app.get('/api/v1/users/:userId/sessions',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requirePermission({
        permissions: ['sessions:read', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req: any) => req.params.userId
      }),
      async (req: any, res) => {
        try {
          const result = await this.listActiveSessionsUseCase.execute({
            userId: req.params.userId,
            currentSessionId: req.user.sessionId // If available from auth middleware
          });

          res.json(result);
        } catch (error) {
          logger.error('List active sessions error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to list active sessions'
          });
        }
      }
    );

    // Terminate a specific session
    this.app.delete('/api/v1/users/:userId/sessions/:sessionId',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requirePermission({
        permissions: ['sessions:delete', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req: any) => req.params.userId
      }),
      async (req: any, res) => {
        try {
          const result = await this.terminateSessionUseCase.execute({
            userId: req.params.userId,
            sessionId: req.params.sessionId
          });

          res.json(result);
        } catch (error) {
          logger.error('Terminate session error', { error: getErrorMessage(error) });

          // Handle specific errors
          if (error instanceof Error) {
            if (error.message.includes('not found')) {
              return res.status(404).json({
                success: false,
                error: 'Session not found'
              });
            }
            if (error.message.includes('Unauthorized')) {
              return res.status(403).json({
                success: false,
                error: 'Unauthorized to terminate this session'
              });
            }
          }

          res.status(500).json({
            success: false,
            error: 'Failed to terminate session'
          });
        }
      }
    );

    // Terminate all sessions except current
    this.app.delete('/api/v1/users/:userId/sessions',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requirePermission({
        permissions: ['sessions:delete', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req: any) => req.params.userId
      }),
      async (req: any, res) => {
        try {
          const result = await this.terminateAllSessionsUseCase.execute({
            userId: req.params.userId,
            currentSessionId: req.user.sessionId // If available from auth middleware
          });

          res.json(result);
        } catch (error) {
          logger.error('Terminate all sessions error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to terminate all sessions'
          });
        }
      }
    );

    // ========================================
    // PASSWORD POLICY ENDPOINTS
    // ========================================

    // Get current password policy (public - no auth required)
    this.app.get('/api/v1/password-policy',
      async (_req, res) => {
        try {
          const result = await this.getPasswordPolicyUseCase.execute();
          res.json(result);
        } catch (error) {
          logger.error('Get password policy error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to get password policy'
          });
        }
      }
    );

    // Update password policy (admin only)
    this.app.put('/api/v1/password-policy',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requireAdmin(),
      async (req: any, res) => {
        try {
          const result = await this.updatePasswordPolicyUseCase.execute({
            minLength: req.body.minLength,
            requireUppercase: req.body.requireUppercase,
            requireLowercase: req.body.requireLowercase,
            requireNumbers: req.body.requireNumbers,
            requireSpecialChars: req.body.requireSpecialChars,
            expirationDays: req.body.expirationDays,
            preventReuse: req.body.preventReuse,
            updatedBy: req.user.userId
          });

          res.json(result);
        } catch (error) {
          logger.error('Update password policy error', { error: getErrorMessage(error) });
          res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update password policy'
          });
        }
      }
    );

    // Validate password against current policy (public - no auth required)
    this.app.post('/api/v1/password-policy/validate',
      async (req, res) => {
        try {
          const result = await this.validatePasswordUseCase.execute({
            password: req.body.password
          });

          res.json(result);
        } catch (error) {
          logger.error('Validate password error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to validate password'
          });
        }
      }
    );

    // ========================================
    // ACCOUNT RECOVERY ENDPOINTS
    // ========================================

    // Get recovery methods (authenticated users can view their own)
    this.app.get('/api/v1/account-recovery/methods',
      this.authMiddleware.authenticate(),
      async (req: any, res) => {
        try {
          const result = await this.getRecoveryMethodsUseCase.execute({
            userId: req.user.userId
          });

          res.json(result);
        } catch (error) {
          logger.error('Get recovery methods error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to get recovery methods'
          });
        }
      }
    );

    // Update recovery methods (authenticated users can update their own)
    this.app.put('/api/v1/account-recovery/methods',
      this.authMiddleware.authenticate(),
      async (req: any, res) => {
        try {
          const result = await this.updateRecoveryMethodsUseCase.execute({
            userId: req.user.userId,
            recoveryEmail: req.body.recoveryEmail
          });

          res.json(result);
        } catch (error) {
          logger.error('Update recovery methods error', { error: getErrorMessage(error) });
          res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update recovery methods'
          });
        }
      }
    );

    // Request password reset (public - no auth required)
    this.app.post('/api/v1/account-recovery/request-reset',
      async (req, res) => {
        try {
          const result = await this.requestPasswordResetUseCase.execute({
            email: req.body.email,
            method: req.body.method,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });

          res.json(result);
        } catch (error) {
          logger.error('Request password reset error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to request password reset'
          });
        }
      }
    );

    // Verify reset token (public - no auth required)
    this.app.post('/api/v1/account-recovery/verify-token',
      async (req, res) => {
        try {
          const result = await this.verifyResetTokenUseCase.execute({
            token: req.body.token,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });

          res.json(result);
        } catch (error) {
          logger.error('Verify reset token error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to verify reset token'
          });
        }
      }
    );

    // Reset password with token (public - no auth required)
    this.app.post('/api/v1/account-recovery/reset-password',
      async (req, res) => {
        try {
          const result = await this.resetPasswordWithTokenUseCase.execute({
            token: req.body.token,
            newPassword: req.body.newPassword,
            confirmPassword: req.body.confirmPassword,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });

          res.json(result);
        } catch (error) {
          logger.error('Reset password with token error', { error: getErrorMessage(error) });
          res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reset password'
          });
        }
      }
    );

    // Get recovery history (authenticated users can view their own)
    this.app.get('/api/v1/account-recovery/history',
      this.authMiddleware.authenticate(),
      async (req: any, res) => {
        try {
          const result = await this.getRecoveryHistoryUseCase.execute({
            userId: req.user.userId,
            page: req.query.page ? parseInt(req.query.page as string) : undefined,
            pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string
          });

          res.json(result);
        } catch (error) {
          logger.error('Get recovery history error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to get recovery history'
          });
        }
      }
    );

    // ========================================
    // ADMIN ENDPOINTS
    // ========================================

    // Graceful degradation control (admin only)
    this.app.post('/admin/recovery',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requireAdmin(),
      (_req, res) => {
        try {
          this.degradationService.forceRecovery();
          res.json({ success: true, message: 'Service recovery initiated' });
        } catch (error) {
          res.status(500).json({ error: getErrorMessage(error) });
        }
      }
    );

    // Get user permissions (authenticated users can check their own, admins can check anyone)
    this.app.get('/api/v1/permissions/:userId',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requirePermission({
        permissions: ['permissions:read', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req: any) => req.params.userId
      }),
      async (req: any, res) => {
        try {
          const userIdString = req.params.userId;
          const userId = UserId.fromString(userIdString);
          const permissions = await this.permissionService.getEffectivePermissions(userId);

          res.json({
            success: true,
            data: {
              userId: userIdString,
              permissions,
              cached: true,
              cacheTTL: '5 minutes'
            }
          });
        } catch (error) {
          logger.error('Get permissions error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to get permissions'
          });
        }
      }
    );

    // Invalidate user permission cache (admin only)
    this.app.post('/admin/permissions/invalidate/:userId',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requireAdmin(),
      async (req, res) => {
        try {
          const userIdString = req.params.userId;
          const userId = UserId.fromString(userIdString);
          await this.permissionService.invalidateCache(userId);
          res.json({
            success: true,
            message: `Permission cache invalidated for user ${userIdString}`
          });
        } catch (error) {
          logger.error('Invalidate cache error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to invalidate cache'
          });
        }
      }
    );

    // Invalidate permission cache for all users with a role (admin only)
    this.app.post('/admin/permissions/invalidate-role/:roleType',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requireAdmin(),
      async (req, res) => {
        try {
          const roleType = req.params.roleType;
          await this.permissionService.invalidateCacheForRole(roleType);
          res.json({
            success: true,
            message: `Permission cache invalidated for all users with role ${roleType}`
          });
        } catch (error) {
          logger.error('Invalidate role cache error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Failed to invalidate role cache'
          });
        }
      }
    );

    // Provision staff account (admin only)
    this.app.post('/admin/staff/register',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requireAdmin(),
      async (req, res) => {
        try {
          const request = {
            email: req.body.email,
            fullName: req.body.fullName,
            roleType: req.body.roleType,
            phoneNumber: req.body.phoneNumber,
            requesterId: req.user?.userId || '' // Admin user ID from auth middleware
          };

          const result = await this.provisionStaffUseCase.execute(request);
          const statusCode = result.success ? 201 : 400;
          res.status(statusCode).json(result);
        } catch (error) {
          logger.error('Provision staff endpoint error', { error: getErrorMessage(error) });
          res.status(500).json({
            success: false,
            error: 'Lỗi hệ thống, vui lòng thử lại sau'
          });
        }
      }
    );

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint không tồn tại',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: getErrorMessage(error),
        stack: error.stack,
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
        await app['eventPublisher'].close();
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
