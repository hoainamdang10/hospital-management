/**
 * Identity Service Consolidated - Main Application
 * Production-ready service with enhanced monitoring and resilience
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
// Infrastructure imports
import { IdentityServiceHealthCheck } from './infrastructure/monitoring/HealthChecks';
import { IdentityServiceDegradation } from './infrastructure/resilience/GracefulDegradation';
import { CircuitBreakerFactory } from './infrastructure/resilience/CircuitBreaker';
import { SupabaseUserRepository } from './infrastructure/repositories/SupabaseUserRepository';
import { SupabaseAuthClient } from './infrastructure/auth/SupabaseAuthClient';
import { PermissionService } from './infrastructure/services/PermissionService';
import { RedisCacheService } from './infrastructure/cache/RedisCacheService';

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

// Configuration
const config = {
  port: process.env.PORT || 3001,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'identity-service',
  version: '2.0.0'
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
  private healthCheck!: IdentityServiceHealthCheck;
  private degradationService!: IdentityServiceDegradation;
  private userRepository!: SupabaseUserRepository;
  private authService!: IAuthenticationService;
  private authClient!: SupabaseAuthClient;
  private permissionService!: PermissionService;
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

  constructor() {
    this.app = express();
    this.initializeInfrastructure();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Initialize infrastructure components
   */
  private initializeInfrastructure(): void {
    try {
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

      // Initialize repository
      this.userRepository = new SupabaseUserRepository(
        config.supabaseUrl,
        config.supabaseKey,
        logger
      );

      // Initialize Supabase Auth Service
      this.authService = new SupabaseAuthService(
        config.supabaseUrl,
        config.supabaseKey,
        logger
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

      // Initialize Redis Cache Service (optional)
      try {
        this.cacheService = new RedisCacheService(
          process.env.REDIS_URL || 'redis://localhost:6379',
          logger
        );
      } catch (error) {
        logger.warn('Redis cache not available, running without cache', { error });
        this.cacheService = null;
      }

      // Initialize Permission Service
      this.permissionService = new PermissionService(
        this.userRepository,
        this.cacheService,
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
        logger
      );

      this.registerUserUseCase = new RegisterUserUseCase(
        this.authService,
        this.userRepository,
        logger
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
        logger
      );

      this.logoutUserUseCase = new LogoutUserUseCase(
        this.authService,
        this.userRepository,
        logger
      );

      this.enableMFAUseCase = new EnableMFAUseCase(
        this.userRepository,
        logger,
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      this.verifyMFAUseCase = new VerifyMFAUseCase(
        logger,
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      this.disableMFAUseCase = new DisableMFAUseCase(
        this.userRepository,
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

    // User Registration endpoint
    this.app.post('/auth/register', async (req, res) => {
      try {
        const request = {
          email: req.body.email,
          password: req.body.password,
          fullName: req.body.fullName,
          roleType: req.body.roleType,
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

    // Invalidate user permission cache (admin only)
    this.app.post('/admin/permissions/invalidate/:userId',
      this.authMiddleware.authenticate(),
      this.permissionMiddleware.requireAdmin(),
      async (req, res) => {
        try {
          const userId = req.params.userId;
          await this.permissionService.invalidateCache(userId);
          res.json({
            success: true,
            message: `Permission cache invalidated for user ${userId}`
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
  app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default IdentityServiceApp;
