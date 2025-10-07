"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateUserUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const IDegradationService_1 = require("../services/IDegradationService");
const Email_1 = require("../../domain/value-objects/Email");
const UserSession_1 = require("../../domain/entities/UserSession");
const DomainEventMapper_1 = require("../../infrastructure/events/DomainEventMapper");
/**
 * Use Case for authenticating users with enhanced error handling
 * Implements circuit breaker pattern and graceful degradation
 */
class AuthenticateUserUseCase {
    constructor(userRepository, authService, degradationService, circuitBreaker, logger, permissionRepository, eventPublisher // Optional for backward compatibility
    ) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.degradationService = degradationService;
        this.circuitBreaker = circuitBreaker;
        this.logger = logger;
        this.permissionRepository = permissionRepository;
        this.eventPublisher = eventPublisher;
    }
    /**
     * Execute authentication with comprehensive error handling
     */
    async execute(request) {
        const startTime = Date.now();
        try {
            // Input validation
            this.validateRequest(request);
            // Log authentication attempt (without sensitive data)
            this.logger.info('Authentication attempt', {
                email: Email_1.Email.create(request.email).getMaskedEmail(),
                ipAddress: request.ipAddress,
                userAgent: request.userAgent?.substring(0, 50)
            });
            // Execute authentication with circuit breaker protection
            const authResult = await this.circuitBreaker.execute(() => this.performAuthentication(request), () => this.performFallbackAuthentication(request));
            // Log successful authentication
            if (authResult.success) {
                this.logger.info('Authentication successful', {
                    userId: authResult.userId,
                    mode: authResult.mode,
                    responseTime: Date.now() - startTime
                });
                // Cache successful authentication for fallback
                if (authResult.mode === IDegradationService_1.ServiceMode.FULL_SERVICE) {
                    this.degradationService.cacheAuthentication(request.email, authResult);
                }
            }
            return this.mapToResponse(authResult);
        }
        catch (error) {
            // Log authentication failure
            this.logger.error('Authentication failed', {
                email: Email_1.Email.create(request.email).getMaskedEmail(),
                ipAddress: request.ipAddress,
                error: (0, error_helper_1.getErrorMessage)(error),
                responseTime: Date.now() - startTime
            });
            return {
                success: false,
                mode: IDegradationService_1.ServiceMode.FULL_SERVICE, // Default to full service mode on error
                error: (0, error_helper_1.getErrorMessage)(error)
            };
        }
    }
    /**
     * Primary authentication flow
     */
    async performAuthentication(request) {
        const email = Email_1.Email.create(request.email);
        try {
            // Step 0: Check if account is locked
            const lockoutStatus = await this.userRepository.checkAccountLockout(email);
            if (lockoutStatus.isLocked) {
                this.logger.warn('Account is locked', {
                    email: email.getMaskedEmail(),
                    unlockAt: lockoutStatus.unlockAt
                });
                // Record failed attempt (account locked)
                await this.userRepository.recordLoginAttempt(email, false, request.ipAddress, request.userAgent, 'Account is locked');
                throw new Error(`Tài khoản đã bị khóa. Vui lòng thử lại sau ${lockoutStatus.unlockAt?.toLocaleString('vi-VN')}`);
            }
            // Step 1: Authenticate with Supabase Auth (password verification)
            // Use new interface with UserCredentials object
            const authResult = await this.authService.signIn({
                email: request.email,
                password: request.password
            });
            if (!authResult.success || !authResult.accessToken) {
                // Record failed attempt (invalid credentials)
                await this.userRepository.recordLoginAttempt(email, false, request.ipAddress, request.userAgent, authResult.error || 'Invalid credentials');
                throw new Error(authResult.error || 'Authentication failed');
            }
            // Step 2: Find user domain aggregate
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                // Record failed attempt (user not found)
                await this.userRepository.recordLoginAttempt(email, false, request.ipAddress, request.userAgent, 'User not found');
                throw new Error('Người dùng không tồn tại');
            }
            // Check if user is active
            if (!user.isActive) {
                // Record failed attempt (account disabled)
                await this.userRepository.recordLoginAttempt(email, false, request.ipAddress, request.userAgent, 'Account disabled');
                throw new Error('Tài khoản đã bị vô hiệu hóa');
            }
            // Step 3: Record successful login attempt
            await this.userRepository.recordLoginAttempt(email, true, request.ipAddress, request.userAgent);
            // Step 4: Record authentication in domain (triggers domain event)
            user.recordAuthentication(request.ipAddress, request.userAgent);
            // Step 5: Create session in database with Supabase tokens
            // Use new AuthResult structure (accessToken, expiresIn)
            const expiresAt = new Date(Date.now() + (authResult.expiresIn || 3600) * 1000);
            const sessionWithToken = UserSession_1.UserSession.create(user.id, authResult.accessToken, request.deviceInfo || {}, request.ipAddress, request.userAgent, expiresAt);
            await this.userRepository.createSession(sessionWithToken);
            // Step 6: Get user roles and permissions (Pure RBAC)
            const roles = await this.userRepository.getUserRoles(user.userId);
            const permissions = authResult.permissions || await this.permissionRepository.getUserPermissions(user.userId);
            // Step 7: Publish domain events
            if (this.eventPublisher) {
                try {
                    const domainEvents = user.getUncommittedEvents();
                    const rabbitMQEvents = DomainEventMapper_1.DomainEventMapper.toRabbitMQEvents(domainEvents);
                    await this.eventPublisher.publishBatch(rabbitMQEvents);
                    user.markEventsAsCommitted();
                    this.logger.info('Authentication events published', {
                        userId: user.id,
                        eventCount: domainEvents.length
                    });
                }
                catch (error) {
                    this.logger.error('Failed to publish authentication events', {
                        userId: user.id,
                        error: (0, error_helper_1.getErrorMessage)(error)
                    });
                    // Don't fail authentication if event publishing fails
                }
            }
            this.logger.info('Authentication successful', {
                userId: user.id,
                email: email.getMaskedEmail()
            });
            return {
                success: true,
                userId: user.id,
                roles,
                permissions,
                mode: IDegradationService_1.ServiceMode.FULL_SERVICE,
                expiresAt
            };
        }
        catch (error) {
            this.logger.warn('Primary authentication failed', {
                email: request.email,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            throw error;
        }
    }
    /**
     * Fallback authentication using degradation service
     */
    async performFallbackAuthentication(request) {
        this.logger.warn('Using fallback authentication', {
            email: Email_1.Email.create(request.email).getMaskedEmail()
        });
        const credentials = {
            email: request.email,
            password: request.password,
            mfaCode: request.mfaCode
        };
        return await this.degradationService.authenticateUser(credentials);
    }
    /**
     * Validate authentication request
     */
    validateRequest(request) {
        const errors = [];
        if (!request.email || request.email.trim().length === 0) {
            errors.push('Email không được để trống');
        }
        if (!request.password || request.password.length < 8) {
            errors.push('Mật khẩu phải có ít nhất 8 ký tự');
        }
        if (!request.ipAddress) {
            errors.push('IP address không được để trống');
        }
        if (!request.userAgent) {
            errors.push('User agent không được để trống');
        }
        // Validate email format
        try {
            Email_1.Email.create(request.email);
        }
        catch (error) {
            errors.push('Định dạng email không hợp lệ');
        }
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
    }
    /**
     * Map AuthResult to response format
     */
    mapToResponse(authResult) {
        return {
            success: authResult.success,
            userId: authResult.userId,
            sessionToken: this.generateSessionToken(authResult),
            roles: authResult.roles,
            permissions: authResult.permissions,
            expiresAt: authResult.expiresAt,
            mode: authResult.mode,
            degradationReason: authResult.degradationReason,
            requiresMFA: this.shouldRequireMFA(authResult)
        };
    }
    /**
     * Generate session token (simplified)
     */
    generateSessionToken(authResult) {
        if (!authResult.success || !authResult.userId) {
            return undefined;
        }
        // In production, use JWT or secure session token generation
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2);
        return `session_${authResult.userId}_${timestamp}_${randomPart}`;
    }
    /**
     * Determine if MFA is required
     */
    shouldRequireMFA(authResult) {
        // Require MFA for admin and doctor roles
        const mfaRequiredRoles = ['admin', 'doctor'];
        return authResult.roles?.some(role => mfaRequiredRoles.includes(role)) || false;
    }
}
exports.AuthenticateUserUseCase = AuthenticateUserUseCase;
//# sourceMappingURL=AuthenticateUserUseCase.js.map