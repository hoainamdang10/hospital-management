/**
 * Error Helper Utilities
 * Helper functions for error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
