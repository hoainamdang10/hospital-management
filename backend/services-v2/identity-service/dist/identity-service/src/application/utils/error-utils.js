"use strict";
/**
 * Error Utilities
 * Helper functions for type-safe error handling
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = isError;
exports.getErrorMessage = getErrorMessage;
exports.getErrorStack = getErrorStack;
/**
 * Type guard to check if value is an Error
 */
function isError(error) {
    return error instanceof Error;
}
/**
 * Extract error message from unknown error
 * @param error Unknown error value
 * @param fallback Fallback message if error is not an Error instance
 * @returns Error message string
 */
function getErrorMessage(error, fallback = 'Unknown error') {
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
function getErrorStack(error) {
    if (isError(error)) {
        return error.stack;
    }
    return undefined;
}
//# sourceMappingURL=error-utils.js.map