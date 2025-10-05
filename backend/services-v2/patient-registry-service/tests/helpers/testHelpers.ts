/**
 * Test Helpers and Utilities
 * 
 * Shared helper functions for integration tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generate random Vietnamese phone number
 */
export function generateRandomPhone(): string {
  const prefixes = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${suffix}`;
}

/**
 * Generate random Vietnamese national ID (CCCD)
 */
export function generateRandomNationalId(): string {
  // Vietnamese CCCD format: 12 digits
  return Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
}

/**
 * Generate random email
 */
export function generateRandomEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `test-${randomString}@hospital.test`;
}

/**
 * Generate random patient ID
 */
export function generateRandomPatientId(): string {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PAT-${year}${month}-${random}`;
}

/**
 * Create valid patient data for testing
 */
export function createValidPatientData(overrides: any = {}) {
  return {
    userId: overrides.userId || `user-${Math.random().toString(36).substring(7)}`,
    personalInfo: {
      fullName: overrides.fullName || 'Nguyễn Văn Test',
      dateOfBirth: overrides.dateOfBirth || '1990-01-01',
      gender: overrides.gender || 'male',
      nationalId: overrides.nationalId || generateRandomNationalId()
    },
    contactInfo: {
      primaryPhone: overrides.primaryPhone || generateRandomPhone(),
      email: overrides.email || generateRandomEmail(),
      address: {
        street: overrides.street || '123 Đường Test',
        ward: overrides.ward || 'Phường 1',
        district: overrides.district || 'Quận 1',
        city: overrides.city || 'Hồ Chí Minh',
        country: 'Vietnam'
      }
    },
    emergencyContacts: overrides.emergencyContacts || [{
      fullName: 'Nguyễn Thị Emergency',
      relationship: 'Spouse',
      phoneNumber: generateRandomPhone(),
      isPrimary: true
    }],
    ...overrides
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await sleep(interval);
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delayMs * Math.pow(2, i));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Clean up test patients from database
 */
export async function cleanupTestPatients(
  supabaseClient: SupabaseClient,
  pattern: string = 'TEST%'
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('patient_profiles')
      .delete()
      .like('national_id', pattern);

    if (error) {
      console.warn(`⚠️  Could not cleanup test patients: ${error.message}`);
    } else {
      console.log('✅ Test patients cleaned up');
    }
  } catch (error) {
    console.warn(`⚠️  Error cleaning up test patients: ${error}`);
  }
}

/**
 * Clean up test users from auth
 */
export async function cleanupTestUsers(
  supabaseClient: SupabaseClient,
  emails: string[]
): Promise<void> {
  for (const email of emails) {
    try {
      const { data: users } = await supabaseClient.auth.admin.listUsers();
      const user = users?.users.find(u => u.email === email);

      if (user) {
        const { error } = await supabaseClient.auth.admin.deleteUser(user.id);
        if (error) {
          console.warn(`⚠️  Could not delete test user ${email}: ${error.message}`);
        } else {
          console.log(`✅ Deleted test user: ${email}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Error deleting test user ${email}: ${error}`);
    }
  }
}

/**
 * Get or create test user
 */
export async function getOrCreateTestUser(
  supabaseClient: SupabaseClient,
  email: string,
  password: string
): Promise<{ userId: string; token: string }> {
  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (signInData?.session) {
      return {
        userId: signInData.user.id,
        token: signInData.session.access_token
      };
    }

    // If sign in failed, create user
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (signUpError || !signUpData.user) {
      throw new Error(`Failed to create user: ${signUpError?.message}`);
    }

    // Sign in to get token
    const { data: newSignInData, error: newSignInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (newSignInError || !newSignInData.session) {
      throw new Error(`Failed to sign in after creating user: ${newSignInError?.message}`);
    }

    return {
      userId: newSignInData.user.id,
      token: newSignInData.session.access_token
    };
  } catch (error) {
    throw new Error(`Failed to get or create test user: ${error}`);
  }
}

/**
 * Verify patient exists in database
 */
export async function verifyPatientExists(
  supabaseClient: SupabaseClient,
  patientId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('patient_profiles')
      .select('patient_id')
      .eq('patient_id', patientId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get patient from database
 */
export async function getPatientFromDb(
  supabaseClient: SupabaseClient,
  patientId: string
): Promise<any> {
  const { data, error } = await supabaseClient
    .from('patient_profiles')
    .select('*')
    .eq('patient_id', patientId)
    .single();

  if (error) {
    throw new Error(`Failed to get patient: ${error.message}`);
  }

  return data;
}

/**
 * Create test patient directly in database
 */
export async function createTestPatientInDb(
  supabaseClient: SupabaseClient,
  patientData: any
): Promise<string> {
  const { data, error } = await supabaseClient
    .from('patient_profiles')
    .insert({
      patient_id: patientData.patientId || generateRandomPatientId(),
      user_id: patientData.userId,
      full_name: patientData.personalInfo.fullName,
      date_of_birth: patientData.personalInfo.dateOfBirth,
      gender: patientData.personalInfo.gender,
      national_id: patientData.personalInfo.nationalId,
      primary_phone: patientData.contactInfo.primaryPhone,
      email: patientData.contactInfo.email,
      address_street: patientData.contactInfo.address.street,
      address_ward: patientData.contactInfo.address.ward,
      address_district: patientData.contactInfo.address.district,
      address_city: patientData.contactInfo.address.city,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('patient_id')
    .single();

  if (error) {
    throw new Error(`Failed to create test patient: ${error.message}`);
  }

  return data.patient_id;
}

