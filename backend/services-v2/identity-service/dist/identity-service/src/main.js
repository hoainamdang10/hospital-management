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
const UserId_1 = require("./domain/value-objects/UserId");
// Middleware imports
const AuthenticationMiddleware_1 = require("./presentation/middleware/AuthenticationMiddleware");
const PermissionMiddleware_1 = require("./presentation/middleware/PermissionMiddleware");
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
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', async (_req, res) => {
            try {
                const health = await this.healthCheck.checkHealth();
                const statusCode = health.overall === 'HEALTHY' ? 200 : 503;
                res.status(statusCode).json(health);
            }
            catch (error) {
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
                const status = CircuitBreaker_1.CircuitBreakerFactory.getHealthStatus();
                res.json(status);
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
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
                    refreshToken: req.body.refreshToken,
                    newPassword: req.body.newPassword,
                    confirmPassword: req.body.confirmPassword
                };
                const result = await this.resetPasswordUseCase.execute(request);
                const statusCode = result.success ? 200 : 400;
                res.status(statusCode).json(result);
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
                logger.error('Accept staff invitation endpoint error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Lỗi hệ thống, vui lòng thử lại sau'
                });
            }
        });
        // Logout endpoint (authentication required)
        this.app.post('/auth/logout', this.authMiddleware.authenticate(), async (req, res) => {
            try {
                if (!req.user) {
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Authentication required'
                    });
                    return;
                }
                const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';
                const request = {
                    userId: req.user.userId,
                    accessToken,
                    sessionId: typeof req.body.sessionId === 'string' ? req.body.sessionId : undefined
                };
                const result = await this.logoutUserUseCase.execute(request);
                res.status(200).json(result);
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
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
        this.app.get('/api/v1/users/me', this.authMiddleware.authenticate(), async (req, res) => {
            try {
                res.json({
                    success: true,
                    user: req.user
                });
            }
            catch (error) {
                logger.error('Get user profile error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get user profile'
                });
            }
        });
        // Get user by ID (admin or self only)
        this.app.get('/api/v1/users/:userId', this.authMiddleware.authenticate(), this.permissionMiddleware.requirePermission({
            permissions: ['users:read', '*'],
            checkOwnership: true,
            getResourceOwnerId: (req) => req.params.userId
        }), async (req, res) => {
            try {
                const result = await this.getUserUseCase.execute({
                    userId: req.params.userId,
                    requesterId: req.user.userId
                });
                const statusCode = result.success ? 200 : 404;
                res.status(statusCode).json(result);
            }
            catch (error) {
                logger.error('Get user error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get user'
                });
            }
        });
        // List all users (admin only)
        this.app.get('/api/v1/users', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
            try {
                const result = await this.listUsersUseCase.execute({
                    requesterId: req.user.userId,
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 20,
                    roleType: req.query.roleType,
                    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                    searchTerm: req.query.search
                });
                res.json(result);
            }
            catch (error) {
                logger.error('List users error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to list users'
                });
            }
        });
        // Update user (admin or self only)
        this.app.patch('/api/v1/users/:userId', this.authMiddleware.authenticate(), this.permissionMiddleware.requirePermission({
            permissions: ['users:update', '*'],
            checkOwnership: true,
            getResourceOwnerId: (req) => req.params.userId
        }), async (req, res) => {
            try {
                const result = await this.updateUserUseCase.execute({
                    userId: req.params.userId,
                    requesterId: req.user.userId,
                    updates: req.body
                });
                const statusCode = result.success ? 200 : 400;
                res.status(statusCode).json(result);
            }
            catch (error) {
                logger.error('Update user error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to update user'
                });
            }
        });
        // Delete user (admin only)
        this.app.delete('/api/v1/users/:userId', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
            try {
                const result = await this.deleteUserUseCase.execute({
                    userId: req.params.userId,
                    requesterId: req.user.userId,
                    hardDelete: req.query.hard === 'true',
                    reason: req.body.reason
                });
                const statusCode = result.success ? 200 : 400;
                res.status(statusCode).json(result);
            }
            catch (error) {
                logger.error('Delete user error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to delete user'
                });
            }
        });
        // ========================================
        // P1 FEATURES - ACCOUNT MANAGEMENT ENDPOINTS
        // ========================================
        // Change password (authenticated user only - self)
        this.app.post('/api/v1/users/:userId/change-password', this.authMiddleware.authenticate(), async (req, res, next) => {
            try {
                if (req.user && req.user.userId === req.params.userId) {
                    return next();
                }
                const middleware = this.permissionMiddleware.requirePermission({
                    permissions: ['users:update', '*']
                });
                return middleware(req, res, next);
            }
            catch (error) {
                logger.error('Change password authorization error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Xác thực quyền thất bại'
                });
            }
        }, async (req, res) => {
            try {
                const result = await this.changePasswordUseCase.execute({
                    userId: req.params.userId,
                    currentPassword: req.body.currentPassword,
                    newPassword: req.body.newPassword,
                    confirmPassword: req.body.confirmPassword
                });
                const statusCode = result.success ? 200 : 400;
                res.status(statusCode).json(result);
            }
            catch (error) {
                logger.error('Change password error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Đổi mật khẩu thất bại'
                });
            }
        });
        // Lock account (admin only)
        this.app.post('/api/v1/users/:userId/lock', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
            try {
                const result = await this.lockAccountUseCase.execute({
                    userId: req.params.userId,
                    lockedBy: req.user.userId,
                    reason: req.body.reason || 'Locked by administrator',
                    terminateSessions: req.body.terminateSessions !== false // Default true
                });
                const statusCode = result.success ? 200 : 400;
                res.status(statusCode).json(result);
            }
            catch (error) {
                logger.error('Lock account error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Khóa tài khoản thất bại'
                });
            }
        });
        // Unlock account (admin only)
        this.app.post('/api/v1/users/:userId/unlock', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
            try {
                const result = await this.unlockAccountUseCase.execute({
                    userId: req.params.userId,
                    unlockedBy: req.user.userId,
                    reason: req.body.reason || 'Unlocked by administrator'
                });
                const statusCode = result.success ? 200 : 400;
                res.status(statusCode).json(result);
            }
            catch (error) {
                logger.error('Unlock account error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Mở khóa tài khoản thất bại'
                });
            }
        });
        // Assign role (admin only)
        this.app.post('/api/v1/users/:userId/assign-role', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
            try {
                const result = await this.assignRoleUseCase.execute({
                    userId: req.params.userId,
                    roleType: req.body.roleType,
                    assignedBy: req.user.userId,
                    reason: req.body.reason || 'Role assigned by administrator'
                });
                const statusCode = result.success ? 200 : 400;
                res.status(statusCode).json(result);
            }
            catch (error) {
                logger.error('Assign role error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Gán vai trò thất bại'
                });
            }
        });
        // ========================================
        // SESSION MANAGEMENT ENDPOINTS
        // ========================================
        // List active sessions for current user
        this.app.get('/api/v1/users/:userId/sessions', this.authMiddleware.authenticate(), this.permissionMiddleware.requirePermission({
            permissions: ['sessions:read', '*'],
            checkOwnership: true,
            getResourceOwnerId: (req) => req.params.userId
        }), async (req, res) => {
            try {
                const result = await this.listActiveSessionsUseCase.execute({
                    userId: req.params.userId,
                    currentSessionId: req.user.sessionId // If available from auth middleware
                });
                res.json(result);
            }
            catch (error) {
                logger.error('List active sessions error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to list active sessions'
                });
            }
        });
        // Terminate a specific session
        this.app.delete('/api/v1/users/:userId/sessions/:sessionId', this.authMiddleware.authenticate(), this.permissionMiddleware.requirePermission({
            permissions: ['sessions:delete', '*'],
            checkOwnership: true,
            getResourceOwnerId: (req) => req.params.userId
        }), async (req, res) => {
            try {
                const result = await this.terminateSessionUseCase.execute({
                    userId: req.params.userId,
                    sessionId: req.params.sessionId
                });
                return res.json(result);
            }
            catch (error) {
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
                return res.status(500).json({
                    success: false,
                    error: 'Failed to terminate session'
                });
            }
        });
        // Terminate all sessions except current
        this.app.delete('/api/v1/users/:userId/sessions', this.authMiddleware.authenticate(), this.permissionMiddleware.requirePermission({
            permissions: ['sessions:delete', '*'],
            checkOwnership: true,
            getResourceOwnerId: (req) => req.params.userId
        }), async (req, res) => {
            try {
                const result = await this.terminateAllSessionsUseCase.execute({
                    userId: req.params.userId,
                    currentSessionId: req.user.sessionId // If available from auth middleware
                });
                res.json(result);
            }
            catch (error) {
                logger.error('Terminate all sessions error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to terminate all sessions'
                });
            }
        });
        // ========================================
        // PASSWORD POLICY ENDPOINTS
        // ========================================
        // Get current password policy (public - no auth required)
        this.app.get('/api/v1/password-policy', async (_req, res) => {
            try {
                const result = await this.getPasswordPolicyUseCase.execute();
                res.json(result);
            }
            catch (error) {
                logger.error('Get password policy error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get password policy'
                });
            }
        });
        // Update password policy (admin only)
        this.app.put('/api/v1/password-policy', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
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
            }
            catch (error) {
                logger.error('Update password policy error', { error: getErrorMessage(error) });
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update password policy'
                });
            }
        });
        // Validate password against current policy (public - no auth required)
        this.app.post('/api/v1/password-policy/validate', async (req, res) => {
            try {
                const result = await this.validatePasswordUseCase.execute({
                    password: req.body.password
                });
                res.json(result);
            }
            catch (error) {
                logger.error('Validate password error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to validate password'
                });
            }
        });
        // ========================================
        // ACCOUNT RECOVERY ENDPOINTS
        // ========================================
        // Get recovery methods (authenticated users can view their own)
        this.app.get('/api/v1/account-recovery/methods', this.authMiddleware.authenticate(), async (req, res) => {
            try {
                const result = await this.getRecoveryMethodsUseCase.execute({
                    userId: req.user.userId
                });
                res.json(result);
            }
            catch (error) {
                logger.error('Get recovery methods error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get recovery methods'
                });
            }
        });
        // Update recovery methods (authenticated users can update their own)
        this.app.put('/api/v1/account-recovery/methods', this.authMiddleware.authenticate(), async (req, res) => {
            try {
                const result = await this.updateRecoveryMethodsUseCase.execute({
                    userId: req.user.userId,
                    recoveryEmail: req.body.recoveryEmail
                });
                res.json(result);
            }
            catch (error) {
                logger.error('Update recovery methods error', { error: getErrorMessage(error) });
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update recovery methods'
                });
            }
        });
        // Request password reset (public - no auth required)
        this.app.post('/api/v1/account-recovery/request-reset', async (req, res) => {
            try {
                const result = await this.requestPasswordResetUseCase.execute({
                    email: req.body.email,
                    method: req.body.method,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                });
                res.json(result);
            }
            catch (error) {
                logger.error('Request password reset error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to request password reset'
                });
            }
        });
        // Verify reset token (public - no auth required)
        this.app.post('/api/v1/account-recovery/verify-token', async (req, res) => {
            try {
                const result = await this.verifyResetTokenUseCase.execute({
                    token: req.body.token,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                });
                res.json(result);
            }
            catch (error) {
                logger.error('Verify reset token error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to verify reset token'
                });
            }
        });
        // Reset password with token (public - no auth required)
        this.app.post('/api/v1/account-recovery/reset-password', async (req, res) => {
            try {
                const result = await this.resetPasswordWithTokenUseCase.execute({
                    token: req.body.token,
                    newPassword: req.body.newPassword,
                    confirmPassword: req.body.confirmPassword,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                });
                res.json(result);
            }
            catch (error) {
                logger.error('Reset password with token error', { error: getErrorMessage(error) });
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to reset password'
                });
            }
        });
        // Get recovery history (authenticated users can view their own)
        this.app.get('/api/v1/account-recovery/history', this.authMiddleware.authenticate(), async (req, res) => {
            try {
                const result = await this.getRecoveryHistoryUseCase.execute({
                    userId: req.user.userId,
                    page: req.query.page ? parseInt(req.query.page) : undefined,
                    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : undefined,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate
                });
                res.json(result);
            }
            catch (error) {
                logger.error('Get recovery history error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get recovery history'
                });
            }
        });
        // ========================================
        // ADMIN ENDPOINTS
        // ========================================
        // Graceful degradation control (admin only)
        this.app.post('/admin/recovery', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), (_req, res) => {
            try {
                this.degradationService.forceRecovery();
                res.json({ success: true, message: 'Service recovery initiated' });
            }
            catch (error) {
                res.status(500).json({ error: getErrorMessage(error) });
            }
        });
        // Get user permissions (authenticated users can check their own, admins can check anyone)
        this.app.get('/api/v1/permissions/:userId', this.authMiddleware.authenticate(), this.permissionMiddleware.requirePermission({
            permissions: ['permissions:read', '*'],
            checkOwnership: true,
            getResourceOwnerId: (req) => req.params.userId
        }), async (req, res) => {
            try {
                const userIdString = req.params.userId;
                const userId = UserId_1.UserId.fromString(userIdString);
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
            }
            catch (error) {
                logger.error('Get permissions error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to get permissions'
                });
            }
        });
        // Invalidate user permission cache (admin only)
        this.app.post('/admin/permissions/invalidate/:userId', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
            try {
                const userIdString = req.params.userId;
                const userId = UserId_1.UserId.fromString(userIdString);
                await this.permissionService.invalidateCache(userId);
                res.json({
                    success: true,
                    message: `Permission cache invalidated for user ${userIdString}`
                });
            }
            catch (error) {
                logger.error('Invalidate cache error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to invalidate cache'
                });
            }
        });
        // Invalidate permission cache for all users with a role (admin only)
        this.app.post('/admin/permissions/invalidate-role/:roleType', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
            try {
                const roleType = req.params.roleType;
                await this.permissionService.invalidateCacheForRole(roleType);
                res.json({
                    success: true,
                    message: `Permission cache invalidated for all users with role ${roleType}`
                });
            }
            catch (error) {
                logger.error('Invalidate role cache error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Failed to invalidate role cache'
                });
            }
        });
        // Provision staff account (admin only)
        this.app.post('/admin/staff/register', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
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
            }
            catch (error) {
                logger.error('Provision staff endpoint error', { error: getErrorMessage(error) });
                res.status(500).json({
                    success: false,
                    error: 'Lỗi hệ thống, vui lòng thử lại sau'
                });
            }
        });
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