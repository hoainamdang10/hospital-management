/**
 * Error Helper Utilities
 * Helper functions for error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  // Handle Supabase error objects
  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
}
