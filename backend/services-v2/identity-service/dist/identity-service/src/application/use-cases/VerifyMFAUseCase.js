"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyMFAUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const CircuitBreaker_1 = require("../../infrastructure/resilience/CircuitBreaker");
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
/**
 * Verify MFA Use Case
 * Verifies TOTP codes or backup codes
 */
class VerifyMFAUseCase {
    constructor(logger, supabaseUrl, supabaseKey) {
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('verify-mfa-use-case');
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for VerifyMFAUseCase');
            return {
                success: false,
                valid: false,
                message: 'Dịch vụ xác thực MFA tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Starting MFA verification', {
                userId: request.userId,
                attemptType: request.attemptType
            });
            // 1. Validate request
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    valid: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            // 2. Check rate limiting
            const rateLimitOk = await this.checkRateLimit(request.userId, request.attemptType);
            if (!rateLimitOk) {
                return {
                    success: false,
                    valid: false,
                    message: 'Quá nhiều lần thử không thành công. Vui lòng thử lại sau 15 phút.',
                    error: 'RATE_LIMIT_EXCEEDED'
                };
            }
            // 3. Get MFA settings
            const { data: mfaSettings, error: mfaError } = await this.supabaseClient
                .from('two_factor_auth')
                .select('*')
                .eq('user_id', request.userId)
                .single();
            if (mfaError || !mfaSettings) {
                return {
                    success: false,
                    valid: false,
                    message: 'Cài đặt MFA không tồn tại',
                    error: 'MFA_NOT_FOUND'
                };
            }
            // 4. Verify code based on method
            let isValid = false;
            let usedMethod = request.method || mfaSettings.method;
            if (request.method === 'backup' || (!request.method && mfaSettings.backup_codes?.includes(request.code))) {
                // Verify backup code
                isValid = await this.verifyBackupCode(request.userId, request.code);
                usedMethod = 'backup';
            }
            else if (mfaSettings.method === '2fa_app' && mfaSettings.secret_key) {
                // Verify TOTP
                isValid = this.verifyTOTP(mfaSettings.secret_key, request.code);
                usedMethod = '2fa_app';
            }
            // 5. Log attempt
            await this.logAttempt(request.userId, request.attemptType, usedMethod, request.code, isValid, request.ipAddress, request.userAgent);
            // 6. Handle successful verification
            if (isValid) {
                // Update last used timestamp
                await this.supabaseClient
                    .from('two_factor_auth')
                    .update({
                    last_used_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                    .eq('user_id', request.userId);
                // If this is setup verification, enable MFA
                if (request.attemptType === 'setup') {
                    await this.enableMFA(request.userId);
                }
                this.logger.info('MFA verification successful', { userId: request.userId });
                return {
                    success: true,
                    valid: true,
                    message: 'Xác thực MFA thành công'
                };
            }
            else {
                this.logger.warn('MFA verification failed', { userId: request.userId });
                return {
                    success: true,
                    valid: false,
                    message: 'Mã xác thực không đúng',
                    error: 'INVALID_CODE'
                };
            }
        }
        catch (error) {
            this.logger.error('MFA verification error', {
                userId: request.userId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                valid: false,
                message: `Xác thực MFA thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`,
                error: 'VERIFICATION_FAILED'
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
        if (!request.code) {
            return 'Mã xác thực là bắt buộc';
        }
        if (request.code.length !== 6 && request.code.length !== 8) {
            return 'Mã xác thực phải có 6 hoặc 8 ký tự';
        }
        if (!request.attemptType) {
            return 'Loại xác thực là bắt buộc';
        }
        return null;
    }
    /**
     * Check rate limiting
     */
    async checkRateLimit(userId, attemptType) {
        try {
            const { data, error } = await this.supabaseClient
                .rpc('check_2fa_rate_limit', {
                user_uuid: userId,
                attempt_type_param: attemptType
            });
            if (error) {
                this.logger.warn('Rate limit check failed, allowing attempt', { error });
                return true; // Allow on error
            }
            return data === true;
        }
        catch (error) {
            this.logger.warn('Rate limit check error, allowing attempt', { error });
            return true; // Allow on error
        }
    }
    /**
     * Verify TOTP code
     */
    verifyTOTP(secret, token) {
        const window = 30; // 30 second window
        const currentTime = Math.floor(Date.now() / 1000 / window);
        // Check current time window and adjacent windows for clock drift
        for (let i = -1; i <= 1; i++) {
            const timeStep = currentTime + i;
            const expectedToken = this.generateTOTP(secret, timeStep);
            if (expectedToken === token) {
                return true;
            }
        }
        return false;
    }
    /**
     * Generate TOTP token
     */
    generateTOTP(secret, timeStep) {
        const decodedSecret = this.base32Decode(secret);
        const timeBuffer = Buffer.alloc(8);
        timeBuffer.writeBigInt64BE(BigInt(timeStep));
        const hmac = (0, crypto_1.createHmac)('sha1', decodedSecret);
        hmac.update(timeBuffer);
        const hash = hmac.digest();
        const offset = hash[hash.length - 1] & 0xf;
        const code = ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff);
        return (code % 1000000).toString().padStart(6, '0');
    }
    /**
     * Base32 decode
     */
    base32Decode(encoded) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const bytes = [];
        for (let i = 0; i < encoded.length; i += 8) {
            const chunk = encoded.slice(i, i + 8).padEnd(8, '=');
            let bits = 0;
            let bitsCount = 0;
            for (const char of chunk) {
                if (char === '=')
                    break;
                bits = (bits << 5) | alphabet.indexOf(char);
                bitsCount += 5;
                if (bitsCount >= 8) {
                    bytes.push((bits >> (bitsCount - 8)) & 0xff);
                    bitsCount -= 8;
                }
            }
        }
        return Buffer.from(bytes);
    }
    /**
     * Verify backup code
     */
    async verifyBackupCode(userId, code) {
        try {
            const { data, error } = await this.supabaseClient
                .rpc('validate_backup_code', {
                user_uuid: userId,
                input_code: code
            });
            if (error) {
                this.logger.error('Backup code validation failed', { error });
                return false;
            }
            return data === true;
        }
        catch (error) {
            this.logger.error('Backup code validation error', { error });
            return false;
        }
    }
    /**
     * Log MFA attempt
     */
    async logAttempt(userId, attemptType, method, code, isSuccessful, ipAddress, userAgent) {
        try {
            await this.supabaseClient
                .from('two_factor_attempts')
                .insert({
                user_id: userId,
                attempt_type: attemptType,
                method,
                code_used: code.substring(0, 2) + '****', // Log partial code for security
                is_successful: isSuccessful,
                ip_address: ipAddress,
                user_agent: userAgent,
                created_at: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to log MFA attempt', { error });
        }
    }
    /**
     * Enable MFA after successful setup verification
     */
    async enableMFA(userId) {
        await this.supabaseClient
            .from('two_factor_auth')
            .update({
            is_enabled: true,
            updated_at: new Date().toISOString()
        })
            .eq('user_id', userId);
        // Update user profile
        await this.supabaseClient
            .from('user_profiles')
            .update({
            two_factor_enabled: true,
            updated_at: new Date().toISOString()
        })
            .eq('id', userId);
    }
}
exports.VerifyMFAUseCase = VerifyMFAUseCase;
//# sourceMappingURL=VerifyMFAUseCase.js.map