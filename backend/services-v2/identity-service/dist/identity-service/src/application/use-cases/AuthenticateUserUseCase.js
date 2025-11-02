"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateUserUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
/**
 * Authenticate User Use Case - Enhanced with Circuit Breaker
 * Handles user authentication with graceful degradation
 *
 * Pure RBAC: Uses IPermissionRepository for permission management
 *
 * @author Hospital Management Team
 * @version 3.1.0 - Fixed session_id to use Supabase session_id
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const IDegradationService_1 = require("../services/IDegradationService");
const Email_1 = require("../../domain/value-objects/Email");
const UserSession_1 = require("../../domain/entities/UserSession");
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
                    await this.degradationService.cacheAuthentication(request.email, authResult, request.password);
                }
            }
            return this.mapToResponse(authResult);
        }
        catch (error) {
            // Log authentication failure
            const errorMessage = (0, error_helper_1.getErrorMessage)(error);
            this.logger.error('Authentication failed', {
                email: Email_1.Email.create(request.email).getMaskedEmail(),
                ipAddress: request.ipAddress,
                error: errorMessage,
                responseTime: Date.now() - startTime
            });
            // Check error type and preserve specific error messages
            const isAccountLocked = errorMessage.includes('Tài khoản đã bị khóa');
            const isEmailNotVerified = errorMessage.includes('xác thực email') ||
                errorMessage.includes('Email not confirmed');
            return {
                success: false,
                mode: IDegradationService_1.ServiceMode.DEGRADED_SERVICE,
                degradationReason: isAccountLocked ? 'ACCOUNT_LOCKED' :
                    isEmailNotVerified ? 'EMAIL_NOT_VERIFIED' :
                        'AUTHENTICATION_FAILED',
                error: (isAccountLocked || isEmailNotVerified) ? errorMessage : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.',
                message: (isAccountLocked || isEmailNotVerified) ? errorMessage : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.'
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
            // Check email verification for PATIENT role only
            // Staff accounts (DOCTOR, NURSE, RECEPTIONIST, ADMIN) are auto-verified by admin
            // This follows healthcare industry best practices:
            // - Patients must verify email (HIPAA security requirement)
            // - Staff are verified through admin-initiated onboarding process
            if (user.hasRole('PATIENT') && !user.isEmailVerified) {
                // Record failed attempt (email not verified)
                await this.userRepository.recordLoginAttempt(email, false, request.ipAddress, request.userAgent, 'Email not verified');
                throw new Error('Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư email của bạn để nhận link xác thực.');
            }
            // Step 3: Record successful login attempt
            await this.userRepository.recordLoginAttempt(email, true, request.ipAddress, request.userAgent);
            // Step 4: Record authentication in domain (triggers domain event)
            user.recordAuthentication(request.ipAddress, request.userAgent);
            // Step 5: Extract Supabase session_id from JWT token
            // Supabase JWT contains session_id at top-level payload
            let supabaseSessionId;
            try {
                const decoded = jsonwebtoken_1.default.decode(authResult.accessToken);
                supabaseSessionId = decoded?.session_id;
                if (!supabaseSessionId) {
                    this.logger.warn('Supabase session_id not found in JWT token', {
                        userId: user.id
                    });
                }
                else {
                    this.logger.debug('Extracted Supabase session_id from JWT', {
                        userId: user.id,
                        sessionId: supabaseSessionId
                    });
                }
            }
            catch (error) {
                this.logger.error('Failed to decode JWT for session_id extraction', {
                    userId: user.id,
                    error: (0, error_helper_1.getErrorMessage)(error)
                });
            }
            // Step 5.1: Create session in database with Supabase session_id
            // Use Supabase session_id as the session ID to ensure consistency
            const expiresAt = new Date(Date.now() + (authResult.expiresIn || 3600) * 1000);
            // Create session with Supabase session_id if available
            const sessionWithToken = supabaseSessionId
                ? UserSession_1.UserSession.fromPersistenceData({
                    id: supabaseSessionId, // Use Supabase session_id
                    userId: user.id,
                    sessionToken: authResult.accessToken,
                    deviceInfo: request.deviceInfo || {},
                    ipAddress: request.ipAddress,
                    userAgent: request.userAgent,
                    expiresAt,
                    isActive: true,
                    createdAt: new Date(),
                    lastAccessedAt: new Date()
                })
                : UserSession_1.UserSession.create(// Fallback to random UUID if session_id not found
                user.id, authResult.accessToken, request.deviceInfo || {}, request.ipAddress, request.userAgent, expiresAt);
            await this.userRepository.createSession(sessionWithToken);
            this.logger.info('Session created in database', {
                userId: user.id,
                sessionId: sessionWithToken.id,
                usedSupabaseSessionId: !!supabaseSessionId
            });
            // Step 6: Get user roles and permissions (Pure RBAC)
            const roles = await this.userRepository.getUserRoles(user.userId);
            const permissions = authResult.permissions || await this.permissionRepository.getUserPermissions(user.userId);
            // Step 7: Publish domain events
            if (this.eventPublisher) {
                try {
                    const domainEvents = user.getUncommittedEvents();
                    await this.eventPublisher.publishDomainEvents(domainEvents);
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
                accessToken: authResult.accessToken, // Supabase JWT access token
                refreshToken: authResult.refreshToken, // Supabase refresh token
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
        // IMPORTANT: Check account lockout even in fallback mode
        // This prevents bypassing brute force protection via fallback authentication
        const email = Email_1.Email.create(request.email);
        const lockoutStatus = await this.userRepository.checkAccountLockout(email);
        if (lockoutStatus.isLocked) {
            this.logger.warn('Account is locked (fallback authentication blocked)', {
                email: email.getMaskedEmail(),
                unlockAt: lockoutStatus.unlockAt
            });
            // Record failed attempt (account locked)
            await this.userRepository.recordLoginAttempt(email, false, request.ipAddress, request.userAgent, 'Account is locked (fallback blocked)');
            throw new Error(`Tài khoản đã bị khóa. Vui lòng thử lại sau ${lockoutStatus.unlockAt?.toLocaleString('vi-VN')}`);
        }
        const credentials = {
            email: request.email,
            password: request.password,
            mfaCode: request.mfaCode,
            ipAddress: request.ipAddress,
            userAgent: request.userAgent
        };
        const fallbackResult = await this.degradationService.authenticateUser(credentials);
        if (!fallbackResult.success) {
            await this.userRepository.recordLoginAttempt(email, false, request.ipAddress, request.userAgent, fallbackResult.degradationReason || 'Fallback authentication failed');
            throw new Error(fallbackResult.degradationReason || 'Không thể xác thực trong chế độ dự phòng');
        }
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            await this.userRepository.recordLoginAttempt(email, false, request.ipAddress, request.userAgent, 'User not found during fallback');
            throw new Error('Người dùng không tồn tại');
        }
        const [repoRoles, repoPermissions] = await Promise.all([
            this.userRepository.getUserRoles(user.userId),
            this.permissionRepository.getUserPermissions(user.userId)
        ]);
        const roles = fallbackResult.roles && fallbackResult.roles.length > 0
            ? fallbackResult.roles
            : repoRoles;
        const permissions = fallbackResult.permissions && fallbackResult.permissions.length > 0
            ? fallbackResult.permissions
            : repoPermissions;
        await this.userRepository.recordLoginAttempt(email, true, request.ipAddress, request.userAgent, 'Fallback authentication success');
        user.recordAuthentication(request.ipAddress, request.userAgent);
        const sessionToken = fallbackResult.accessToken ?? fallbackResult.sessionToken;
        const accessToken = fallbackResult.accessToken ?? sessionToken;
        const expiresAt = fallbackResult.expiresAt ?? new Date(Date.now() + 3600000);
        let supabaseSessionId;
        if (sessionToken) {
            try {
                const decoded = jsonwebtoken_1.default.decode(sessionToken);
                supabaseSessionId = decoded?.session_id || decoded?.sid || decoded?.sessionId;
            }
            catch (error) {
                this.logger.warn('Failed to decode JWT for session_id in fallback auth', {
                    error: (0, error_helper_1.getErrorMessage)(error),
                    userId: user.id
                });
            }
        }
        else {
            this.logger.warn('Fallback authentication succeeded without access token', {
                userId: user.id
            });
        }
        if (sessionToken) {
            const session = supabaseSessionId
                ? UserSession_1.UserSession.fromPersistenceData({
                    id: supabaseSessionId,
                    userId: user.id,
                    sessionToken,
                    deviceInfo: request.deviceInfo || {},
                    ipAddress: request.ipAddress,
                    userAgent: request.userAgent,
                    expiresAt,
                    isActive: true,
                    createdAt: new Date(),
                    lastAccessedAt: new Date()
                })
                : UserSession_1.UserSession.create(user.id, sessionToken, request.deviceInfo || {}, request.ipAddress, request.userAgent, expiresAt);
            await this.userRepository.createSession(session);
            this.logger.info('Fallback session created in database', {
                userId: user.id,
                sessionId: session.id,
                usedSupabaseSessionId: !!supabaseSessionId
            });
        }
        if (this.eventPublisher) {
            try {
                const domainEvents = user.getUncommittedEvents();
                await this.eventPublisher.publishDomainEvents(domainEvents);
                user.markEventsAsCommitted();
                this.logger.info('Fallback authentication events published', {
                    userId: user.id,
                    eventCount: domainEvents.length
                });
            }
            catch (error) {
                this.logger.error('Failed to publish fallback authentication events', {
                    userId: user.id,
                    error: (0, error_helper_1.getErrorMessage)(error)
                });
            }
        }
        const enhancedResult = {
            success: true,
            userId: fallbackResult.userId ?? user.id,
            accessToken,
            sessionToken: sessionToken,
            refreshToken: fallbackResult.refreshToken,
            roles,
            permissions,
            mode: fallbackResult.mode,
            degradationReason: fallbackResult.degradationReason,
            expiresAt,
            metadata: fallbackResult.metadata
        };
        if (enhancedResult.mode === IDegradationService_1.ServiceMode.FULL_SERVICE) {
            await this.degradationService.cacheAuthentication(request.email, enhancedResult, request.password);
        }
        return enhancedResult;
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
            accessToken: authResult.accessToken, // Supabase JWT access token
            refreshToken: authResult.refreshToken, // Supabase refresh token for token renewal
            sessionToken: authResult.accessToken, // Deprecated: kept for backward compatibility
            roles: authResult.roles,
            permissions: authResult.permissions,
            expiresAt: authResult.expiresAt,
            mode: authResult.mode,
            degradationReason: authResult.degradationReason,
            requiresMFA: this.shouldRequireMFA(authResult)
        };
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