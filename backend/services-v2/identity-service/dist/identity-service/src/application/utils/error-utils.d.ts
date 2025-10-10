/**
 * Error Utilities
 * Helper functions for type-safe error handling
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
/**
 * Type guard to check if value is an Error
 */
export declare function isError(error: unknown): error is Error;
/**
 * Extract error message from unknown error
 * @param error Unknown error value
 * @param fallback Fallback message if error is not an Error instance
 * @returns Error message string
 */
export declare function getErrorMessage(error: unknown, fallback?: string): string;
/**
 * Extract error stack from unknown error
 * @param error Unknown error value
 * @returns Error stack string or undefined
 */
export declare function getErrorStack(error: unknown): string | undefined;
//# sourceMappingURL=error-utils.d.ts.map