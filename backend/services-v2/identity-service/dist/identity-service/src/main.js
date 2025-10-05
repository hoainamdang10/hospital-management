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
const SupabaseAuthClient_1 = require("./infrastructure/auth/SupabaseAuthClient");
const PermissionService_1 = require("./infrastructure/services/PermissionService");
const SupabaseMFAService_1 = require("./infrastructure/services/SupabaseMFAService");
const RedisCacheService_1 = require("./infrastructure/cache/RedisCacheService");
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
        this.initializeInfrastructure();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    /**
     * Initialize infrastructure components
     */
    initializeInfrastructure() {
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
            // Initialize repository
            this.userRepository = new SupabaseUserRepository_1.SupabaseUserRepository(config.supabaseUrl, config.supabaseKey, logger);
            // Initialize Supabase Auth Service
            this.authService = new SupabaseAuthService_1.SupabaseAuthService(config.supabaseUrl, config.supabaseKey, logger);
            // Initialize Supabase Auth Client for middleware
            this.authClient = new SupabaseAuthClient_1.SupabaseAuthClient({
                supabaseUrl: config.supabaseUrl,
                supabaseServiceRoleKey: config.supabaseKey,
                jwtSecret: config.jwtSecret
            }, logger);
            // Initialize Redis Cache Service (optional)
            try {
                this.cacheService = new RedisCacheService_1.RedisCacheService(process.env.REDIS_URL || 'redis://localhost:6379', logger);
            }
            catch (error) {
                logger.warn('Redis cache not available, running without cache', { error });
                this.cacheService = null;
            }
            // Initialize Permission Service
            this.permissionService = new PermissionService_1.PermissionService(this.userRepository, this.cacheService, logger);
            // Initialize MFA Service
            this.mfaService = new SupabaseMFAService_1.SupabaseMFAService(this.supabaseClient, // Use shared Supabase client
            logger);
            // Initialize Middleware
            this.authMiddleware = new AuthenticationMiddleware_1.AuthenticationMiddleware(this.authClient, this.permissionService, logger);
            this.permissionMiddleware = new PermissionMiddleware_1.PermissionMiddleware(this.permissionService, logger);
            // Initialize use cases
            const authCircuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('authentication-use-case');
            this.authenticateUserUseCase = new AuthenticateUserUseCase_1.AuthenticateUserUseCase(this.userRepository, this.authService, this.degradationService, authCircuitBreaker, logger);
            this.registerUserUseCase = new RegisterUserUseCase_1.RegisterUserUseCase(this.authService, this.userRepository, logger);
            this.forgotPasswordUseCase = new ForgotPasswordUseCase_1.ForgotPasswordUseCase(this.authService, this.userRepository, logger);
            this.resetPasswordUseCase = new ResetPasswordUseCase_1.ResetPasswordUseCase(this.authService, logger);
            this.verifyEmailUseCase = new VerifyEmailUseCase_1.VerifyEmailUseCase(this.authService, this.userRepository, logger);
            this.logoutUserUseCase = new LogoutUserUseCase_1.LogoutUserUseCase(this.authService, this.userRepository, logger);
            this.enableMFAUseCase = new EnableMFAUseCase_1.EnableMFAUseCase(this.userRepository, this.mfaService, logger);
            this.verifyMFAUseCase = new VerifyMFAUseCase_1.VerifyMFAUseCase(this.mfaService, logger);
            this.disableMFAUseCase = new DisableMFAUseCase_1.DisableMFAUseCase(this.userRepository, this.mfaService, this.verifyMFAUseCase, logger);
            // Initialize user management use cases
            this.getUserUseCase = new GetUserUseCase_1.GetUserUseCase(this.userRepository, logger);
            this.updateUserUseCase = new UpdateUserUseCase_1.UpdateUserUseCase(this.userRepository, logger);
            this.deleteUserUseCase = new DeleteUserUseCase_1.DeleteUserUseCase(this.userRepository, logger);
            this.listUsersUseCase = new ListUsersUseCase_1.ListUsersUseCase(this.userRepository, logger);
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
            }
            catch (error) {
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
        // Invalidate user permission cache (admin only)
        this.app.post('/admin/permissions/invalidate/:userId', this.authMiddleware.authenticate(), this.permissionMiddleware.requireAdmin(), async (req, res) => {
            try {
                const userId = req.params.userId;
                await this.permissionService.invalidateCache(userId);
                res.json({
                    success: true,
                    message: `Permission cache invalidated for user ${userId}`
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
    async start() {
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
    app.start().catch((error) => {
        console.error('Failed to start application:', error);
        process.exit(1);
    });
}
exports.default = IdentityServiceApp;
//# sourceMappingURL=main.js.map