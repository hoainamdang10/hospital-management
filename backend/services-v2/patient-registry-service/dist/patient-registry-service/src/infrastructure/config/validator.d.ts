/**
 * Environment Configuration Validator
 * Patient Registry Service - Infrastructure Layer
 *
 * Validates required environment variables before service startup
 * Fail-fast approach to prevent runtime errors
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, 12-Factor App
 */
import { ILogger } from '../../../../shared/application/services/logger.interface';
export declare enum ValidationMode {
    STRICT = "strict",// All variables required (production)
    LENIENT = "lenient"
}
export interface ValidationResult {
    valid: boolean;
    missing: string[];
    warnings: string[];
}
/**
 * Validate environment configuration
 * Throws error if critical variables are missing
 */
export declare function validateConfig(logger: ILogger, mode?: ValidationMode): ValidationResult;
/**
 * Get validation mode based on NODE_ENV
 */
export declare function getValidationMode(): ValidationMode;
/**
 * Validate and log configuration on startup
 */
export declare function validateAndLog(logger: ILogger): void;
//# sourceMappingURL=validator.d.ts.map