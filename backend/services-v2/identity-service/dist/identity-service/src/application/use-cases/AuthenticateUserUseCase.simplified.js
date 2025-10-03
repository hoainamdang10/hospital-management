"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateUserUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const CircuitBreaker_1 = require("../../infrastructure/resilience/CircuitBreaker");
const Email_1 = require("../../domain/value-objects/Email");
class AuthenticateUserUseCase {
    constructor(authService, userRepository, logger) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('authentication-use-case');
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for AuthenticateUserUseCase');
            return {
                success: false,
                error: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.'
            };
        });
    }
    async executeImpl(request) {
        const startTime = Date.now();
        try {
            this.logger.info('Authentication attempt', {
                email: Email_1.Email.create(request.email).getMaskedEmail(),
                ipAddress: request.ipAddress
            });
            // 1. Check account lockout BEFORE authentication
            const lockoutStatus = await this.userRepository.checkAccountLockout(request.email);
            if (lockoutStatus.isLocked) {
                const minutesRemaining = Math.ceil((lockoutStatus.unlockAt.getTime() - Date.now()) / 60000);
                const errorMessage = `Tài khoản đã bị khóa do quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ${minutesRemaining} phút.`;
                this.logger.warn('Account locked', {
                    email: request.email,
                    failedAttempts: lockoutStatus.failedAttempts,
                    unlockAt: lockoutStatus.unlockAt
                });
                return {
                    success: false,
                    error: errorMessage
                };
            }
            // 2. Authenticate with Supabase Auth (password verification)
            const authResult = await this.authService.signIn(request.email, request.password);
            this.logger.info('Supabase Auth successful', {
                userId: authResult.user.id,
                emailConfirmed: authResult.user.emailConfirmed
            });
            // 3. Get user profile from database
            const user = await this.userRepository.findById(authResult.user.id);
            if (!user) {
                throw new Error('User profile not found');
            }
            // 4. Check if user is active
            if (!user.isActive) {
                throw new Error('Tài khoản đã bị vô hiệu hóa');
            }
            // 5. Check if MFA is required
            const requiresMFA = await this.shouldRequireMFA(user.id.value);
            if (requiresMFA && !request.mfaCode) {
                // Record successful password verification but pending MFA
                await this.userRepository.recordLoginAttempt(request.email, false, // Not fully successful yet
                request.ipAddress, request.userAgent, 'MFA required');
                return {
                    success: true,
                    requiresMFA: true,
                    userId: user.id.value,
                    error: 'MFA verification required'
                };
            }
            // 6. Record authentication in domain
            const session = user.recordAuthentication(request.ipAddress, request.userAgent);
            // 7. Create session in database
            await this.userRepository.createSession({
                userId: user.id.value,
                sessionToken: session.sessionToken,
                deviceInfo: request.deviceInfo || {},
                ipAddress: request.ipAddress,
                userAgent: request.userAgent,
                expiresAt: session.expiresAt,
                isActive: true
            });
            // 8. Get user roles and permissions
            const roles = await this.userRepository.getUserRoles(user.id.value);
            const permissions = this.getPermissionsForRoles(roles);
            // 9. Record successful login attempt
            await this.userRepository.recordLoginAttempt(request.email, true, request.ipAddress, request.userAgent);
            this.logger.info('Authentication successful', {
                userId: user.id.value,
                responseTime: Date.now() - startTime
            });
            return {
                success: true,
                userId: user.id.value,
                sessionToken: session.sessionToken,
                accessToken: authResult.session.accessToken,
                refreshToken: authResult.session.refreshToken,
                roles,
                permissions,
                expiresAt: session.expiresAt
            };
        }
        catch (error) {
            // Record failed login attempt
            await this.userRepository.recordLoginAttempt(request.email, false, request.ipAddress, request.userAgent, (0, error_helper_1.getErrorMessage)(error));
            this.logger.error('Authentication failed', {
                email: request.email,
                ipAddress: request.ipAddress,
                error: (0, error_helper_1.getErrorMessage)(error),
                responseTime: Date.now() - startTime
            });
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error) || 'Đăng nhập thất bại'
            };
        }
    }
    /**
     * Check if user requires MFA
     */
    async shouldRequireMFA(userId) {
        try {
            // This would check the two_factor_auth table
            // For now, return false (MFA is optional)
            return false;
        }
        catch (error) {
            this.logger.error('Error checking MFA requirement', { userId, error: (0, error_helper_1.getErrorMessage)(error) });
            return false;
        }
    }
    getPermissionsForRoles(roles) {
        const permissionMap = {
            admin: ['*'],
            doctor: ['read:patients', 'write:patients', 'read:appointments', 'write:appointments', 'read:medical_records', 'write:medical_records'],
            patient: ['read:own_profile', 'write:own_profile', 'read:own_appointments', 'write:own_appointments'],
            receptionist: ['read:patients', 'read:appointments', 'write:appointments']
        };
        const permissions = new Set();
        roles.forEach(role => {
            const rolePermissions = permissionMap[role] || [];
            rolePermissions.forEach(p => permissions.add(p));
        });
        return Array.from(permissions);
    }
}
exports.AuthenticateUserUseCase = AuthenticateUserUseCase;
//# sourceMappingURL=AuthenticateUserUseCase.simplified.js.map