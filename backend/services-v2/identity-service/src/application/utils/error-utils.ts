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
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract error message from unknown error
 * @param error Unknown error value
 * @param fallback Fallback message if error is not an Error instance
 * @returns Error message string
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Extract error stack from unknown error
 * @param error Unknown error value
 * @returns Error stack string or undefined
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  return undefined;
}

