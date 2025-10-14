"use strict";
/**
 * Identity Service Consolidated - Main Application
 * Production-ready service with enhanced monitoring and resilience
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const supabase_js_1 = require("@supabase/supabase-js");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
// Infrastructure imports
const HealthChecks_1 = require("./infrastructure/monitoring/HealthChecks");
const GracefulDegradation_1 = require("./infrastructure/resilience/GracefulDegradation");
const CircuitBreaker_1 = require("./infrastructure/resilience/CircuitBreaker");
const SupabaseUserRepository_1 = require("./infrastructure/repositories/SupabaseUserRepository");
const SupabasePermissionRepository_1 = require("./infrastructure/repositories/SupabasePermissionRepository");
const SupabaseAuthClient_1 = require("./infrastructure/auth/SupabaseAuthClient");
const PermissionService_1 = require("./infrastructure/services/PermissionService");
const SupabaseMFAService_1 = require("./infrastructure/services/SupabaseMFAService");
const RedisCacheService_1 = require("./infrastructure/cache/RedisCacheService");
const PermissionCache_1 = require("./infrastructure/cache/PermissionCache");
// Middleware imports
const AuthenticationMiddleware_1 = require("./presentation/middleware/AuthenticationMiddleware");
const PermissionMiddleware_1 = require("./presentation/middleware/PermissionMiddleware");
// Routes imports
const routes_1 = require("./presentation/routes");
const AuthenticateUserUseCase_1 = require("./application/use-cases/AuthenticateUserUseCase");
const SupabaseAuthService_1 = require("./infrastructure/auth/SupabaseAuthService");
const RegisterUserUseCase_1 = require("./application/use-cases/RegisterUserUseCase");
const ForgotPasswordUseCase_1 = require("./application/use-cases/ForgotPasswordUseCase");
const ResetPasswordUseCase_1 = require("./application/use-cases/ResetPasswordUseCase");
const VerifyEmailUseCase_1 = require("./application/use-cases/VerifyEmailUseCase");
const LogoutUserUseCase_1 = require("./application/use-cases/LogoutUserUseCase");
const EnableMFAUseCase_1 = require("./application/use-cases/EnableMFAUseCase");
const VerifyMFAUseCase_1 = require("./application/use-cases/VerifyMFAUseCase");
const DisableMFAUseCase_1 = require("./application/use-cases/DisableMFAUseCase");
const GetUserUseCase_1 = require("./application/use-cases/GetUserUseCase");
const UpdateUserUseCase_1 = require("./application/use-cases/UpdateUserUseCase");
const DeleteUserUseCase_1 = require("./application/use-cases/DeleteUserUseCase");
const ListUsersUseCase_1 = require("./application/use-cases/ListUsersUseCase");
const RefreshTokenUseCase_1 = require("./application/use-cases/RefreshTokenUseCase");
const ProvisionStaffUseCase_1 = require("./application/use-cases/ProvisionStaffUseCase");
const AcceptStaffInvitationUseCase_1 = require("./application/use-cases/AcceptStaffInvitationUseCase");
const RabbitMQEventPublisher_1 = require("./infrastructure/events/RabbitMQEventPublisher");
// Session Management imports
const ListActiveSessionsUseCase_1 = require("./application/use-cases/ListActiveSessionsUseCase");
const TerminateSessionUseCase_1 = require("./application/use-cases/TerminateSessionUseCase");
const TerminateAllSessionsUseCase_1 = require("./application/use-cases/TerminateAllSessionsUseCase");
const SupabaseSessionRepository_1 = require("./infrastructure/repositories/SupabaseSessionRepository");
// Password Policy imports
const GetPasswordPolicyUseCase_1 = require("./application/use-cases/GetPasswordPolicyUseCase");
const UpdatePasswordPolicyUseCase_1 = require("./application/use-cases/UpdatePasswordPolicyUseCase");
const ValidatePasswordUseCase_1 = require("./application/use-cases/ValidatePasswordUseCase");
const SupabasePasswordPolicyRepository_1 = require("./infrastructure/repositories/SupabasePasswordPolicyRepository");
// Account Recovery imports
const GetRecoveryMethodsUseCase_1 = require("./application/use-cases/GetRecoveryMethodsUseCase");
const UpdateRecoveryMethodsUseCase_1 = require("./application/use-cases/UpdateRecoveryMethodsUseCase");
const RequestPasswordResetUseCase_1 = require("./application/use-cases/RequestPasswordResetUseCase");
const VerifyResetTokenUseCase_1 = require("./application/use-cases/VerifyResetTokenUseCase");
const ResetPasswordWithTokenUseCase_1 = require("./application/use-cases/ResetPasswordWithTokenUseCase");
const GetRecoveryHistoryUseCase_1 = require("./application/use-cases/GetRecoveryHistoryUseCase");
const SupabaseRecoveryMethodRepository_1 = require("./infrastructure/repositories/SupabaseRecoveryMethodRepository");
const SupabaseRecoveryHistoryRepository_1 = require("./infrastructure/repositories/SupabaseRecoveryHistoryRepository");
// P1 Features - Account Management imports
const ChangePasswordUseCase_1 = require("./application/use-cases/ChangePasswordUseCase");
const LockAccountUseCase_1 = require("./application/use-cases/LockAccountUseCase");
const UnlockAccountUseCase_1 = require("./application/use-cases/UnlockAccountUseCase");
const AssignRoleUseCase_1 = require("./application/use-cases/AssignRoleUseCase");
// Permission Check imports (for API Gateway)
const CheckPermissionUseCase_1 = require("./application/use-cases/CheckPermissionUseCase");
const CheckPermissionsUseCase_1 = require("./application/use-cases/CheckPermissionsUseCase");
const CheckRoleUseCase_1 = require("./application/use-cases/CheckRoleUseCase");
const CheckRolesUseCase_1 = require("./application/use-cases/CheckRolesUseCase");
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
    debug: (message, meta) => {
        console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    info: (message, meta) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    error: (message, meta) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    fatal: (message, meta) => {
        console.error(`[FATAL] ${new Date().toISOString()} - ${message}`, meta || '');
    }
};
// Helper function to get error message
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
/**
 * Identity Service Application Class
 * Implements production-ready patterns and anti-pattern mitigation
 */
class IdentityServiceApp {
    constructor() {
        this.app = (0, express_1.default)();
        // Note: initializeInfrastructure is now async, called in initialize()
        this.setupMiddleware();
        // setupRoutes() moved to initialize() after infrastructure is ready
        this.setupErrorHandling();
    }
    /**
     * Initialize the application (async wrapper for constructor)
     */
    async initialize() {
        await this.initializeInfrastructure();
        // Setup routes AFTER infrastructure is initialized
        this.setupRoutes();
    }
    /**
     * Initialize infrastructure components
     */
    async initializeInfrastructure() {
        try {
            // Initialize shared Supabase client
            this.supabaseClient = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
            // Initialize health check service
            this.healthCheck = new HealthChecks_1.IdentityServiceHealthCheck(config.supabaseUrl, config.supabaseKey, logger);
            // Initialize graceful degradation service
            this.degradationService = new GracefulDegradation_1.IdentityServiceDegradation({
                enableReadOnlyFallback: true,
                enableCacheFallback: true,
                enableEmergencyMode: true,
                maxDegradationTime: 300000 // 5 minutes
            }, {
                supabaseUrl: config.supabaseUrl,
                supabaseServiceRoleKey: config.supabaseKey,
                jwtSecret: config.jwtSecret
            }, logger);
            // Initialize Redis Cache Service (optional)
            try {
                this.cacheService = new RedisCacheService_1.RedisCacheService(process.env.REDIS_URL || 'redis://localhost:6379', logger);
                // IMPORTANT: Connect to Redis immediately
                await this.cacheService.connect();
                logger.info('Redis cache service initialized and connected');
            }
            catch (error) {
                logger.warn('Redis cache not available, running without cache', { error });
                this.cacheService = null;
            }
            // Initialize Event Publisher (RabbitMQ)
            const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673';
            this.eventPublisher = new RabbitMQEventPublisher_1.RabbitMQEventPublisher(rabbitMQUrl, logger);
            try {
                await this.eventPublisher.initialize?.();
                logger.info('Event Publisher initialized successfully');
            }
            catch (error) {
                logger.error('Failed to initialize Event Publisher', { error: getErrorMessage(error) });
                logger.warn('Continuing without event publishing');
            }
            // Initialize Permission Cache (Pure RBAC)
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.permissionCache = new PermissionCache_1.PermissionCache(redisUrl);
            try {
                await this.permissionCache.connect();
                logger.info('Permission Cache connected successfully');
            }
            catch (error) {
                logger.error('Failed to connect Permission Cache', { error: getErrorMessage(error) });
                logger.warn('Continuing without permission caching - permissions will be fetched from database');
                // Service can continue without cache, just slower
            }
            // Initialize Permission Repository (Pure RBAC)
            this.permissionRepository = new SupabasePermissionRepository_1.SupabasePermissionRepository(this.supabaseClient, this.permissionCache);
            // Initialize User Repository (with permissionRepository for Pure RBAC)
            this.userRepository = new SupabaseUserRepository_1.SupabaseUserRepository(config.supabaseUrl, config.supabaseKey, logger, this.cacheService || undefined, this.permissionRepository);
            // Initialize Supabase Auth Service with configurable default role
            this.authService = new SupabaseAuthService_1.SupabaseAuthService(config.supabaseUrl, config.supabaseKey, logger, config.defaultUserRole);
            // Initialize Supabase Auth Client for middleware
            this.authClient = new SupabaseAuthClient_1.SupabaseAuthClient({
                supabaseUrl: config.supabaseUrl,
                supabaseServiceRoleKey: config.supabaseKey,
                jwtSecret: config.jwtSecret
            }, logger);
            // Initialize Permission Service (Pure RBAC)
            this.permissionService = new PermissionService_1.PermissionService(this.permissionRepository, this.permissionCache);
            // Initialize MFA Service
            this.mfaService = new SupabaseMFAService_1.SupabaseMFAService(this.supabaseClient, // Use shared Supabase client
            logger);
            // Initialize Middleware
            this.authMiddleware = new AuthenticationMiddleware_1.AuthenticationMiddleware(this.authClient, this.permissionService, logger);
            this.permissionMiddleware = new PermissionMiddleware_1.PermissionMiddleware(this.permissionService, logger);
            // Initialize use cases
            const authCircuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('authentication-use-case');
            this.authenticateUserUseCase = new AuthenticateUserUseCase_1.AuthenticateUserUseCase(this.userRepository, this.authService, this.degradationService, authCircuitBreaker, logger, this.permissionRepository, this.eventPublisher // Add event publisher
            );
            // RegisterUserUseCase now uses explicit control via repository
            // No longer needs authService - repository handles auth user creation
            // Requires permissionRepository for dynamic role validation
            this.registerUserUseCase = new RegisterUserUseCase_1.RegisterUserUseCase(this.userRepository, this.permissionRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('register-user-use-case'), this.eventPublisher // Add event publisher
            );
            this.forgotPasswordUseCase = new ForgotPasswordUseCase_1.ForgotPasswordUseCase(this.authService, this.userRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('forgot-password-use-case'));
            this.resetPasswordUseCase = new ResetPasswordUseCase_1.ResetPasswordUseCase(this.authService, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('reset-password-use-case'));
            this.verifyEmailUseCase = new VerifyEmailUseCase_1.VerifyEmailUseCase(this.authService, this.userRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('verify-email-use-case'), this.eventPublisher // Add event publisher
            );
            this.logoutUserUseCase = new LogoutUserUseCase_1.LogoutUserUseCase(this.authService, this.userRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('logout-user-use-case'), this.eventPublisher // Add event publisher
            );
            this.enableMFAUseCase = new EnableMFAUseCase_1.EnableMFAUseCase(this.userRepository, this.mfaService, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('enable-mfa-use-case'));
            this.verifyMFAUseCase = new VerifyMFAUseCase_1.VerifyMFAUseCase(this.mfaService, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('verify-mfa-use-case'));
            this.disableMFAUseCase = new DisableMFAUseCase_1.DisableMFAUseCase(this.userRepository, this.mfaService, this.verifyMFAUseCase, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('disable-mfa-use-case'));
            // Initialize user management use cases
            this.getUserUseCase = new GetUserUseCase_1.GetUserUseCase(this.userRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('get-user-use-case'));
            this.updateUserUseCase = new UpdateUserUseCase_1.UpdateUserUseCase(this.userRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('update-user-use-case'));
            this.deleteUserUseCase = new DeleteUserUseCase_1.DeleteUserUseCase(this.userRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('delete-user-use-case'));
            this.listUsersUseCase = new ListUsersUseCase_1.ListUsersUseCase(this.userRepository, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('list-users-use-case'), logger);
            this.refreshTokenUseCase = new RefreshTokenUseCase_1.RefreshTokenUseCase(this.authService, logger);
            this.provisionStaffUseCase = new ProvisionStaffUseCase_1.ProvisionStaffUseCase(this.userRepository, logger, this.eventPublisher // Add event publisher
            );
            this.acceptStaffInvitationUseCase = new AcceptStaffInvitationUseCase_1.AcceptStaffInvitationUseCase(this.userRepository, logger, this.eventPublisher);
            // Initialize Session Management use cases
            this.sessionRepository = new SupabaseSessionRepository_1.SupabaseSessionRepository(this.supabaseClient);
            this.listActiveSessionsUseCase = new ListActiveSessionsUseCase_1.ListActiveSessionsUseCase(this.sessionRepository, logger);
            this.terminateSessionUseCase = new TerminateSessionUseCase_1.TerminateSessionUseCase(this.sessionRepository);
            this.terminateAllSessionsUseCase = new TerminateAllSessionsUseCase_1.TerminateAllSessionsUseCase(this.sessionRepository);
            // Initialize Password Policy use cases
            this.passwordPolicyRepository = new SupabasePasswordPolicyRepository_1.SupabasePasswordPolicyRepository(this.supabaseClient, logger);
            this.getPasswordPolicyUseCase = new GetPasswordPolicyUseCase_1.GetPasswordPolicyUseCase(this.passwordPolicyRepository, logger);
            this.updatePasswordPolicyUseCase = new UpdatePasswordPolicyUseCase_1.UpdatePasswordPolicyUseCase(this.passwordPolicyRepository, logger);
            this.validatePasswordUseCase = new ValidatePasswordUseCase_1.ValidatePasswordUseCase(this.passwordPolicyRepository, logger);
            // Initialize Account Recovery use cases
            this.recoveryMethodRepository = new SupabaseRecoveryMethodRepository_1.SupabaseRecoveryMethodRepository(this.supabaseClient, logger);
            this.recoveryHistoryRepository = new SupabaseRecoveryHistoryRepository_1.SupabaseRecoveryHistoryRepository(this.supabaseClient, logger);
            this.getRecoveryMethodsUseCase = new GetRecoveryMethodsUseCase_1.GetRecoveryMethodsUseCase(this.recoveryMethodRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('get-recovery-methods-use-case'));
            this.updateRecoveryMethodsUseCase = new UpdateRecoveryMethodsUseCase_1.UpdateRecoveryMethodsUseCase(this.recoveryMethodRepository, this.userRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('update-recovery-methods-use-case'));
            this.requestPasswordResetUseCase = new RequestPasswordResetUseCase_1.RequestPasswordResetUseCase(this.authService, this.userRepository, this.recoveryMethodRepository, this.recoveryHistoryRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('request-password-reset-use-case'));
            this.verifyResetTokenUseCase = new VerifyResetTokenUseCase_1.VerifyResetTokenUseCase(this.authService, this.recoveryHistoryRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('verify-reset-token-use-case'));
            this.resetPasswordWithTokenUseCase = new ResetPasswordWithTokenUseCase_1.ResetPasswordWithTokenUseCase(this.authService, this.passwordPolicyRepository, this.recoveryHistoryRepository, this.sessionRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('reset-password-with-token-use-case'));
            this.getRecoveryHistoryUseCase = new GetRecoveryHistoryUseCase_1.GetRecoveryHistoryUseCase(this.recoveryHistoryRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('get-recovery-history-use-case'));
            // Initialize P1 Features - Account Management use cases
            this.changePasswordUseCase = new ChangePasswordUseCase_1.ChangePasswordUseCase(this.authService, this.userRepository, this.passwordPolicyRepository, this.sessionRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('change-password-use-case'));
            this.lockAccountUseCase = new LockAccountUseCase_1.LockAccountUseCase(this.userRepository, this.sessionRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('lock-account-use-case'));
            this.unlockAccountUseCase = new UnlockAccountUseCase_1.UnlockAccountUseCase(this.userRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('unlock-account-use-case'));
            this.assignRoleUseCase = new AssignRoleUseCase_1.AssignRoleUseCase(this.userRepository, this.permissionRepository, logger, CircuitBreaker_1.CircuitBreakerFactory.getBreaker('assign-role-use-case'));
            this.checkPermissionUseCase = new CheckPermissionUseCase_1.CheckPermissionUseCase(this.permissionService, logger);
            this.checkPermissionsUseCase = new CheckPermissionsUseCase_1.CheckPermissionsUseCase(this.permissionService, logger);
            this.checkRoleUseCase = new CheckRoleUseCase_1.CheckRoleUseCase(this.permissionService, logger);
            this.checkRolesUseCase = new CheckRolesUseCase_1.CheckRolesUseCase(this.permissionService, logger);
            logger.info('Infrastructure initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize infrastructure', { error: getErrorMessage(error) });
            throw error;
        }
    }
    /**
     * Setup Express middleware with security and monitoring
     */
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
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
        this.app.use((0, cors_1.default)({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
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
        this.app.use((0, compression_1.default)());
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
    setupRoutes() {
        // Swagger UI Documentation
        try {
            const swaggerDocument = yamljs_1.default.load('./openapi.yaml');
            this.app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, {
                customCss: '.swagger-ui .topbar { display: none }',
                customSiteTitle: 'Identity Service API Documentation'
            }));
            logger.info('Swagger UI available at /api-docs');
        }
        catch (error) {
            logger.warn('Failed to load OpenAPI spec', { error: getErrorMessage(error) });
        }
        // Prepare dependencies for routes
        const routeDeps = {
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
        (0, routes_1.registerRoutes)(this.app, routeDeps);
    }
    /**
     * Setup error handling middleware
     */
    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, _next) => {
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
    async start() {
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
                }
                catch (error) {
                    logger.error('Periodic health check failed', { error: getErrorMessage(error) });
                }
            }, 30000); // Every 30 seconds
        }
        catch (error) {
            logger.error('Failed to start service', { error: getErrorMessage(error) });
            process.exit(1);
        }
    }
}
// Start the application
if (require.main === module) {
    const app = new IdentityServiceApp();
    // Graceful shutdown
    const shutdown = async (signal) => {
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
        }
        catch (error) {
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
exports.default = IdentityServiceApp;
//# sourceMappingURL=main.js.map