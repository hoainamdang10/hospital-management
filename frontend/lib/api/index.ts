/**
 * API Services Export
 * 
 * MIGRATION NOTICE:
 * - Primary axios instance: './axios' (session-based auth with HTTP-only cookies)
 * - Legacy axios instance: './client' (DEPRECATED - localStorage-based auth)
 * 
 * All new code should use './axios' or the specific service files.
 */

// Primary API Client (Session-based Auth)
export { default as apiClient } from './axios';

// Legacy exports (DEPRECATED - for backward compatibility only)
/** @deprecated Use apiClient from './axios' instead */
export { handleApiError, apiRequest } from './client';

// Auth (DEPRECATED - use auth.service.ts)
/** @deprecated Use authService from './auth.service' instead */
export * from './auth';

// Service Exports
export * from './auth.service';
export * from './patient.service';
export * from './availability.service';
export * from './notifications.service';
