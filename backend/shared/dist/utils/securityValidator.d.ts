/**
 * Security Validator - Environment Variables & Key Security
 * Hospital Management System
 */
export interface SecurityValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class SecurityValidator {
    private static readonly REQUIRED_ENV_VARS;
    private static readonly OPTIONAL_ENV_VARS;
    private static readonly MIN_KEY_LENGTHS;
    /**
     * Validate all environment variables
     */
    static validateEnvironment(): SecurityValidationResult;
    /**
     * Validate required environment variables exist
     */
    private static validateRequiredVars;
    /**
     * Validate key strength and format
     */
    private static validateKeyStrength;
    /**
     * Check for common security issues
     */
    private static validateSecurityIssues;
    /**
     * Check if a key appears to be weak
     */
    private static isWeakKey;
    /**
     * Log validation results
     */
    private static logValidationResults;
    /**
     * Validate environment and exit if critical errors
     */
    static validateOrExit(): void;
    /**
     * Generate a secure random key
     */
    static generateSecureKey(length?: number): string;
    /**
     * Mask sensitive values for logging
     */
    static maskSensitiveValue(value: string): string;
    /**
     * Check if running in secure environment
     */
    static isSecureEnvironment(): boolean;
    /**
     * Validate Supabase configuration specifically
     */
    static validateSupabaseConfig(): SecurityValidationResult;
}
export default SecurityValidator;
//# sourceMappingURL=securityValidator.d.ts.map