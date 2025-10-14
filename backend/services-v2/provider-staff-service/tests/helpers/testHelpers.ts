/**
 * Test Helpers and Utilities
 * Shared helper functions for integration tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { TestUtils } from '../setup';

/**
 * Create test staff directly in database
 */
export async function createTestStaffInDb(
  supabaseClient: SupabaseClient,
  staffData: any
): Promise<string> {
  const staffId = staffData.staffId || TestUtils.generateRandomStaffId();
  
  const { data, error } = await supabaseClient
    .from('staff_profiles')
    .insert({
      staff_id: staffId,
      user_id: staffData.userId,
      staff_type: staffData.staffType,
      full_name: staffData.personalInfo.fullName,
      date_of_birth: staffData.personalInfo.dateOfBirth,
      gender: staffData.personalInfo.gender,
      national_id: staffData.personalInfo.nationalId,
      phone_number: staffData.personalInfo.phoneNumber,
      email: staffData.personalInfo.email,
      license_number: staffData.professionalInfo?.licenseNumber,
      specialization: staffData.professionalInfo?.specialization,
      department: staffData.professionalInfo?.department,
      years_of_experience: staffData.professionalInfo?.yearsOfExperience,
      consultation_fee: staffData.professionalInfo?.consultationFee,
      status: 'active',
      is_accepting_new_patients: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test staff: ${error.message}`);
  }

  return staffId;
}

/**
 * Delete test staff from database
 */
export async function deleteTestStaffFromDb(
  supabaseClient: SupabaseClient,
  staffId: string
): Promise<void> {
  const { error } = await supabaseClient
    .from('staff_profiles')
    .delete()
    .eq('staff_id', staffId);

  if (error) {
    throw new Error(`Failed to delete test staff: ${error.message}`);
  }
}

/**
 * Get or create test user in Supabase Auth
 */
export async function getOrCreateTestUser(
  supabaseClient: SupabaseClient,
  email: string,
  password: string
): Promise<{ userId: string; token: string }> {
  // Try to sign in first
  const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (signInData?.user && signInData?.session) {
    return {
      userId: signInData.user.id,
      token: signInData.session.access_token
    };
  }

  // If sign in failed, create new user
  const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test User',
        role_type: 'doctor'
      }
    }
  });

  if (signUpError || !signUpData?.user || !signUpData?.session) {
    throw new Error(`Failed to create test user: ${signUpError?.message || 'Unknown error'}`);
  }

  return {
    userId: signUpData.user.id,
    token: signUpData.session.access_token
  };
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData(
  supabaseClient: SupabaseClient,
  options: {
    staffIds?: string[];
    userIds?: string[];
  }
): Promise<void> {
  // Delete staff profiles
  if (options.staffIds && options.staffIds.length > 0) {
    await supabaseClient
      .from('staff_profiles')
      .delete()
      .in('staff_id', options.staffIds);
  }

  // Delete credentials
  if (options.staffIds && options.staffIds.length > 0) {
    await supabaseClient
      .from('staff_credentials')
      .delete()
      .in('staff_id', options.staffIds);
  }

  // Delete work schedules
  if (options.staffIds && options.staffIds.length > 0) {
    await supabaseClient
      .from('staff_work_schedules')
      .delete()
      .in('staff_id', options.staffIds);
  }
}

/**
 * Wait for event to be published
 */
export async function waitForEvent(
  eventBus: any,
  eventType: string,
  timeout: number = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventType}`));
    }, timeout);

    eventBus.once(eventType, (event: any) => {
      clearTimeout(timer);
      resolve(event);
    });
  });
}

/**
 * Create test patient data
 */
export function createTestPatientData(overrides: any = {}) {
  return {
    patientId: overrides.patientId || `PAT-${Date.now()}-001`,
    userId: overrides.userId || TestUtils.generateRandomUserId(),
    personalInfo: {
      fullName: overrides.fullName || 'Nguyễn Văn Test',
      dateOfBirth: overrides.dateOfBirth || '1990-01-01',
      gender: overrides.gender || 'male',
      nationalId: overrides.nationalId || TestUtils.generateRandomNationalId()
    },
    contactInfo: {
      primaryPhone: overrides.primaryPhone || TestUtils.generateRandomPhone(),
      email: overrides.email || TestUtils.generateRandomEmail(),
      address: {
        street: overrides.street || '123 Đường Test',
        ward: overrides.ward || 'Phường 1',
        district: overrides.district || 'Quận 1',
        city: overrides.city || 'Hồ Chí Minh',
        country: 'Vietnam'
      }
    }
  };
}

/**
 * Verify staff exists in database
 */
export async function verifyStaffExistsInDb(
  supabaseClient: SupabaseClient,
  staffId: string
): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('staff_profiles')
    .select('staff_id')
    .eq('staff_id', staffId)
    .single();

  return !error && !!data;
}

/**
 * Get staff from database
 */
export async function getStaffFromDb(
  supabaseClient: SupabaseClient,
  staffId: string
): Promise<any> {
  const { data, error } = await supabaseClient
    .from('staff_profiles')
    .select('*')
    .eq('staff_id', staffId)
    .single();

  if (error) {
    throw new Error(`Failed to get staff: ${error.message}`);
  }

  return data;
}

/**
 * Update staff in database
 */
export async function updateStaffInDb(
  supabaseClient: SupabaseClient,
  staffId: string,
  updates: any
): Promise<void> {
  const { error } = await supabaseClient
    .from('staff_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('staff_id', staffId);

  if (error) {
    throw new Error(`Failed to update staff: ${error.message}`);
  }
}

/**
 * Create test credential in database
 */
export async function createTestCredentialInDb(
  supabaseClient: SupabaseClient,
  staffId: string,
  credentialData: any
): Promise<string> {
  const credentialId = `CRED-${Date.now()}`;
  
  const { error } = await supabaseClient
    .from('staff_credentials')
    .insert({
      credential_id: credentialId,
      staff_id: staffId,
      credential_type: credentialData.credentialType,
      credential_number: credentialData.credentialNumber,
      issued_by: credentialData.issuedBy,
      issued_date: credentialData.issuedDate,
      expiry_date: credentialData.expiryDate,
      document_url: credentialData.documentUrl,
      created_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to create credential: ${error.message}`);
  }

  return credentialId;
}

/**
 * Mock RabbitMQ Event Publisher
 */
export class MockRabbitMQEventPublisher {
  private publishedEvents: any[] = [];
  private connected: boolean = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async publish(event: any): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to RabbitMQ');
    }
    this.publishedEvents.push(event);
  }

  async publishAll(events: any[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  isReady(): boolean {
    return this.connected;
  }

  getPublishedEvents(): any[] {
    return this.publishedEvents;
  }

  clearPublishedEvents(): void {
    this.publishedEvents = [];
  }

  getEventsByType(eventType: string): any[] {
    return this.publishedEvents.filter(e => e.eventType === eventType);
  }
}

