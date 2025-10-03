"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableMFAUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const CircuitBreaker_1 = require("../../infrastructure/resilience/CircuitBreaker");
const supabase_js_1 = require("@supabase/supabase-js");
const UserId_1 = require("../../domain/value-objects/UserId");
/**
 * Enable MFA Use Case
 * Generates TOTP secret, QR code, and backup codes for user
 */
class EnableMFAUseCase {
    constructor(userRepository, logger, supabaseUrl, supabaseKey) {
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('enable-mfa-use-case');
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for EnableMFAUseCase');
            return {
                success: false,
                message: 'Dịch vụ MFA tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Starting MFA setup', { userId: request.userId, method: request.method });
            // 1. Validate request
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            // 2. Check if user exists
            const userId = UserId_1.UserId.fromString(request.userId);
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại',
                    error: 'USER_NOT_FOUND'
                };
            }
            // 3. Check if MFA is already enabled
            const { data: existingMFA } = await this.supabaseClient
                .from('two_factor_auth')
                .select('*')
                .eq('user_id', request.userId)
                .eq('is_enabled', true)
                .single();
            if (existingMFA) {
                return {
                    success: false,
                    message: 'MFA đã được kích hoạt cho tài khoản này',
                    error: 'MFA_ALREADY_ENABLED'
                };
            }
            // 4. Generate TOTP secret
            const secret = this.generateSecret();
            // 5. Generate backup codes
            const backupCodes = await this.generateBackupCodes();
            // 6. Get user email for QR code
            const userEmail = user.email.value;
            // 7. Generate QR code URL
            const qrCodeUrl = this.generateQRCodeURL(secret, userEmail);
            // 8. Store MFA settings (not enabled yet - requires verification)
            const { error: insertError } = await this.supabaseClient
                .from('two_factor_auth')
                .upsert({
                user_id: request.userId,
                method: request.method,
                secret_key: request.method === '2fa_app' ? secret : null,
                backup_codes: backupCodes,
                phone_number: request.phoneNumber,
                email: request.email,
                is_enabled: false, // Will be enabled after verification
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            if (insertError) {
                this.logger.error('Failed to store MFA settings', { error: insertError });
                throw new Error(`Lỗi lưu cài đặt MFA: ${(0, error_helper_1.getErrorMessage)(insertError)}`);
            }
            this.logger.info('MFA setup completed successfully', { userId: request.userId });
            return {
                success: true,
                secret,
                qrCodeUrl,
                backupCodes,
                message: 'Thiết lập MFA thành công. Vui lòng quét mã QR và xác thực để kích hoạt.'
            };
        }
        catch (error) {
            this.logger.error('MFA setup failed', {
                userId: request.userId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                message: `Thiết lập MFA thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`,
                error: 'MFA_SETUP_FAILED'
            };
        }
    }
    /**
     * Validate request
     */
    validateRequest(request) {
        if (!request.userId) {
            return 'User ID là bắt buộc';
        }
        if (!request.method) {
            return 'Phương thức MFA là bắt buộc';
        }
        if (!['2fa_app', 'sms', 'email'].includes(request.method)) {
            return 'Phương thức MFA không hợp lệ';
        }
        if (request.method === 'sms' && !request.phoneNumber) {
            return 'Số điện thoại là bắt buộc cho phương thức SMS';
        }
        if (request.method === 'email' && !request.email) {
            return 'Email là bắt buộc cho phương thức Email';
        }
        return null;
    }
    /**
     * Generate TOTP secret (Base32 encoded)
     */
    generateSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }
    /**
     * Generate QR code URL for authenticator apps
     */
    generateQRCodeURL(secret, userEmail, issuer = 'Hospital Management') {
        const label = encodeURIComponent(`${issuer}:${userEmail}`);
        const params = new URLSearchParams({
            secret,
            issuer,
            algorithm: 'SHA1',
            digits: '6',
            period: '30'
        });
        return `otpauth://totp/${label}?${params.toString()}`;
    }
    /**
     * Generate backup codes
     */
    async generateBackupCodes() {
        try {
            // Call Supabase RPC function to generate backup codes
            const { data, error } = await this.supabaseClient
                .rpc('generate_backup_codes');
            if (error) {
                this.logger.warn('Failed to generate backup codes via RPC, using fallback', { error });
                // Fallback: generate locally
                return this.generateBackupCodesLocally();
            }
            return data || this.generateBackupCodesLocally();
        }
        catch (error) {
            this.logger.warn('Error calling generate_backup_codes RPC, using fallback', { error });
            return this.generateBackupCodesLocally();
        }
    }
    /**
     * Generate backup codes locally (fallback)
     */
    generateBackupCodesLocally() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }
        return codes;
    }
}
exports.EnableMFAUseCase = EnableMFAUseCase;
//# sourceMappingURL=EnableMFAUseCase.js.map