/**
 * Integration Test Helpers
 * Helper functions for integration tests with real Supabase database
 * Pattern based on identity-service implementation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create Supabase client for integration tests
 * Uses service_role key for full database access
 */
export function createTestSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Generate unique test ID with timestamp
 * Format: prefix-{timestamp}-{random}
 */
export function generateUniqueTestId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate unique doctor ID matching format: [DEPT]-DOC-[6digits]-[3digits]
 */
export function generateUniqueDoctorId(dept: string = 'TEST'): string {
  const timestamp = String(Date.now()).slice(-6);
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${dept}-DOC-${timestamp}-${random}`;
}

/**
 * Generate unique patient ID matching format: PAT-[6digits]-[3digits]
 */
export function generateUniquePatientId(): string {
  const timestamp = String(Date.now()).slice(-6);
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `PAT-${timestamp}-${random}`;
}

/**
 * Cleanup test appointments by pattern
 */
export async function cleanupTestAppointments(
  supabase: SupabaseClient,
  patterns: string[]
): Promise<void> {
  for (const pattern of patterns) {
    try {
      await supabase
        .from('appointments_schema.appointments')
        .delete()
        .like('patient_id', pattern);
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Could not cleanup appointments for pattern ${pattern}`);
    }
  }
}

/**
 * Cleanup test queues by pattern
 */
export async function cleanupTestQueues(
  supabase: SupabaseClient,
  patterns: string[]
): Promise<void> {
  for (const pattern of patterns) {
    try {
      await supabase
        .from('appointments_schema.queues')
        .delete()
        .like('queue_id', pattern);
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Could not cleanup queues for pattern ${pattern}`);
    }
  }
}

/**
 * Cleanup test read models by pattern
 */
export async function cleanupTestReadModels(
  supabase: SupabaseClient,
  patterns: string[]
): Promise<void> {
  for (const pattern of patterns) {
    try {
      await supabase
        .from('appointments_schema.appointment_read_model')
        .delete()
        .like('patient_id', pattern);
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Could not cleanup read models for pattern ${pattern}`);
    }
  }
}

/**
 * Sleep utility for async waits in tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate future date for appointments (avoid past validation errors)
 */
export function generateFutureDate(daysAhead: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

/**
 * Generate future datetime in UTC
 */
export function generateFutureDatetime(hoursAhead: number = 24): Date {
  const date = new Date();
  date.setHours(date.getHours() + hoursAhead);
  return date;
}
