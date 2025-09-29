"use strict";
/**
 * Security Validator - Environment Variables & Key Security
 * Hospital Management System
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidator = void 0;
const logger_1 = __importDefault(require("./logger"));
class SecurityValidator {
    /**
     * Validate all environment variables
     */
    static validateEnvironment() {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        // Check required environment variables
        this.validateRequiredVars(result);
        // Check key strength
        this.validateKeyStrength(result);
        // Check for common security issues
        this.validateSecurityIssues(result);
        // Log results
        this.logValidationResults(result);
        return result;
    }
    /**
     * Validate required environment variables exist
     */
    static validateRequiredVars(result) {
        for (const envVar of this.REQUIRED_ENV_VARS) {
            if (!process.env[envVar]) {
                result.errors.push(`❌ Missing required environment variable: ${envVar}`);
                result.isValid = false;
            }
        }
        for (const envVar of this.OPTIONAL_ENV_VARS) {
            if (!process.env[envVar]) {
                result.warnings.push(`⚠️ Optional environment variable not set: ${envVar}`);
            }
        }
    }
    /**
     * Validate key strength and format
     */
    static validateKeyStrength(result) {
        for (const [key, minLength] of Object.entries(this.MIN_KEY_LENGTHS)) {
            const value = process.env[key];
            if (value) {
                if (value.length < minLength) {
                    result.errors.push(`❌ ${key} is too short (minimum ${minLength} characters)`);
                    result.isValid = false;
                }
                // Check for weak patterns
                if (this.isWeakKey(value)) {
                    result.warnings.push(`⚠️ ${key} appears to be weak (consider using a stronger key)`);
                }
            }
        }
    }
    /**
     * Check for common security issues
     */
    static validateSecurityIssues(result) {
        // Check NODE_ENV
        if (process.env.NODE_ENV === 'production') {
            if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_here_make_it_long_and_random') {
                result.errors.push('❌ Using default JWT_SECRET in production!');
                result.isValid = false;
            }
        }
        // Check for localhost URLs in production
        if (process.env.NODE_ENV === 'production') {
            const urlVars = ['SUPABASE_URL', 'FRONTEND_URL', 'API_GATEWAY_URL'];
            for (const urlVar of urlVars) {
                const url = process.env[urlVar];
                if (url && url.includes('localhost')) {
                    result.warnings.push(`⚠️ ${urlVar} contains localhost in production`);
                }
            }
        }
        // Check CORS settings
        if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes('*')) {
            result.warnings.push('⚠️ CORS_ORIGIN allows all origins (*)');
        }
    }
    /**
     * Check if a key appears to be weak
     */
    static isWeakKey(key) {
        const weakPatterns = [
            /^(password|secret|key|admin|test|demo|example)$/i,
            /^(123|abc|qwe|asd)/i,
            /^(.)\1{3,}/, // Repeated characters
            /^(your_|example_|test_|demo_)/i
        ];
        return weakPatterns.some(pattern => pattern.test(key));
    }
    /**
     * Log validation results
     */
    static logValidationResults(result) {
        if (result.isValid) {
            logger_1.default.info('🔒 Environment validation passed', {
                errors: result.errors.length,
                warnings: result.warnings.length
            });
        }
        else {
            logger_1.default.error('❌ Environment validation failed', {
                errors: result.errors,
                warnings: result.warnings
            });
        }
        // Log warnings separately
        if (result.warnings.length > 0) {
            logger_1.default.warn('⚠️ Security warnings detected', {
                warnings: result.warnings
            });
        }
    }
    /**
     * Validate environment and exit if critical errors
     */
    static validateOrExit() {
        const result = this.validateEnvironment();
        if (!result.isValid) {
            logger_1.default.error('🚨 Critical environment validation errors detected');
            result.errors.forEach(error => logger_1.default.error(error));
            logger_1.default.error('💡 Please check your .env file and fix the errors above');
            logger_1.default.error('📖 Refer to .env.example for proper configuration');
            process.exit(1);
        }
    }
    /**
     * Generate a secure random key
     */
    static generateSecureKey(length = 64) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('hex');
    }
    /**
     * Mask sensitive values for logging
     */
    static maskSensitiveValue(value) {
        if (!value || value.length < 8)
            return '***';
        const start = value.substring(0, 4);
        const end = value.substring(value.length - 4);
        const middle = '*'.repeat(Math.max(0, value.length - 8));
        return `${start}${middle}${end}`;
    }
    /**
     * Check if running in secure environment
     */
    static isSecureEnvironment() {
        return process.env.NODE_ENV === 'production' &&
            process.env.HTTPS === 'true';
    }
    /**
     * Validate Supabase configuration specifically
     */
    static validateSupabaseConfig() {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl) {
            if (!supabaseUrl.startsWith('https://')) {
                result.errors.push('❌ SUPABASE_URL must use HTTPS');
                result.isValid = false;
            }
            if (!supabaseUrl.includes('.supabase.co')) {
                result.warnings.push('⚠️ SUPABASE_URL does not appear to be a valid Supabase URL');
            }
        }
        if (serviceKey) {
            if (!serviceKey.startsWith('eyJ')) {
                result.warnings.push('⚠️ SUPABASE_SERVICE_ROLE_KEY does not appear to be a valid JWT');
            }
        }
        return result;
    }
}
exports.SecurityValidator = SecurityValidator;
SecurityValidator.REQUIRED_ENV_VARS = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
];
SecurityValidator.OPTIONAL_ENV_VARS = [
    'SUPABASE_ANON_KEY',
    'SUPABASE_JWT_SECRET',
    'REDIS_URL',
    'RABBITMQ_URL'
];
SecurityValidator.MIN_KEY_LENGTHS = {
    JWT_SECRET: 32,
    SUPABASE_SERVICE_ROLE_KEY: 50,
    SUPABASE_JWT_SECRET: 32
};
exports.default = SecurityValidator;
//# sourceMappingURL=securityValidator.js.map