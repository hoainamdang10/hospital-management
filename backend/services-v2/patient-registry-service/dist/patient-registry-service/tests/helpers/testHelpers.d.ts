/**
 * Test Helpers and Utilities
 *
 * Shared helper functions for integration tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
declare function issueMockIdentityToken(userId: string, email: string, roles?: string[]): string;
/**
 * Export issueMockIdentityToken for use in tests
 */
export { issueMockIdentityToken };
/**
 * Generate random Vietnamese phone number
 */
export declare function generateRandomPhone(): string;
/**
 * Generate random Vietnamese national ID (CCCD)
 */
export declare function generateRandomNationalId(): string;
/**
 * Generate random email
 */
export declare function generateRandomEmail(): string;
/**
 * Generate random patient ID
 */
export declare function generateRandomPatientId(): string;
/**
 * Create valid patient data for testing (API format - flat structure)
 */
export declare function createValidPatientData(overrides?: any): any;
/**
 * Wait for a condition to be true
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * Sleep utility
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
/**
 * Clean up test patients from database
 */
export declare function cleanupTestPatients(supabaseClient: SupabaseClient | null, pattern?: string): Promise<void>;
/**
 * Clean up test users from auth
 * NOTE: Only cleanup user_profiles and user_roles, NOT auth.users
 * This prevents orphaned profiles when auth.users is deleted
 */
export declare function cleanupTestUsers(supabaseClient: SupabaseClient | null, emails: string[]): Promise<void>;
/**
 * Get or create test user via Identity Service
 * Creates verified users directly in database to bypass email verification
 */
export declare function getOrCreateTestUser(supabaseClient: SupabaseClient | null, email: string, password: string): Promise<{
    userId: string;
    token: string;
}>;
/**
 * Verify patient exists in database
 */
export declare function verifyPatientExists(supabaseClient: SupabaseClient | null, patientId: string): Promise<boolean>;
/**
 * Get patient from database
 */
export declare function getPatientFromDb(supabaseClient: SupabaseClient | null, patientId: string): Promise<any>;
/**
 * Create test patient directly in database
 */
export declare function createTestPatientInDb(supabaseClient: SupabaseClient | null, patientData: any): Promise<string>;
//# sourceMappingURL=testHelpers.d.ts.map