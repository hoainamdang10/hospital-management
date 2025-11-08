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
  
  const { error } = await supabaseClient
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
 * Get or create test user in Supabase Auth with specific role
 */
export async function getOrCreateTestUser(
  supabaseClient: SupabaseClient,
  email: string,
  password: string,
  role: string = 'ADMIN'
): Promise<{ userId: string; token: string; role: string }> {
  // Try to sign in first
  const { data: signInData } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (signInData?.user && signInData?.session) {
    return {
      userId: signInData.user.id,
      token: signInData.session.access_token,
      role: signInData.user.user_metadata?.role || role
    };
  }

  // If sign in failed, create new user
  const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `Test ${role}`,
        role: role,
        role_type: role.toLowerCase()
      }
    }
  });

  if (signUpError || !signUpData?.user || !signUpData?.session) {
    throw new Error(`Failed to create test user: ${signUpError?.message || 'Unknown error'}`);
  }

  // Assign role in auth_schema.user_roles table
  await assignUserRole(supabaseClient, signUpData.user.id, role);

  return {
    userId: signUpData.user.id,
    token: signUpData.session.access_token,
    role
  };
}

/**
 * Assign role to user in auth_schema.user_roles table
 */
export async function assignUserRole(
  supabaseClient: SupabaseClient,
  userId: string,
  roleName: string
): Promise<void> {
  const { error } = await supabaseClient
    .schema('auth_schema')
    .from('user_roles')
    .insert({
      user_id: userId,
      role_name: roleName,
      assigned_at: new Date().toISOString(),
      assigned_by: 'system'
    });

  if (error && !error.message.includes('duplicate')) {
    console.warn(`Failed to assign role ${roleName} to user ${userId}:`, error.message);
  }
}

/**
 * Create test users for different roles
 */
export async function createTestUsersForRoles(
  supabaseClient: SupabaseClient
): Promise<{
  admin: { userId: string; token: string; role: string };
  doctor: { userId: string; token: string; role: string };
  nurse: { userId: string; token: string; role: string };
  departmentManager: { userId: string; token: string; role: string };
}> {
  const admin = await getOrCreateTestUser(
    supabaseClient,
    'admin-test@hospital.vn',
    'TestPassword123!@#',
    'ADMIN'
  );

  const doctor = await getOrCreateTestUser(
    supabaseClient,
    'doctor-test@hospital.vn',
    'TestPassword123!@#',
    'DOCTOR'
  );

  const nurse = await getOrCreateTestUser(
    supabaseClient,
    'nurse-test@hospital.vn',
    'TestPassword123!@#',
    'NURSE'
  );

  const departmentManager = await getOrCreateTestUser(
    supabaseClient,
    'dept-manager-test@hospital.vn',
    'TestPassword123!@#',
    'DEPARTMENT_MANAGER'
  );

  return { admin, doctor, nurse, departmentManager };
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData(
  supabaseClient: SupabaseClient,
  options: {
    staffIds?: string[];
    userIds?: string[];
  } = {}
): Promise<void> {
  try {
    // Delete staff profiles
    if (options.staffIds && options.staffIds.length > 0) {
      await supabaseClient
        .schema('provider_schema')
        .from('staff_profiles')
        .delete()
        .in('staff_id', options.staffIds);
    }

    // Delete credentials
    if (options.staffIds && options.staffIds.length > 0) {
      await supabaseClient
        .schema('provider_schema')
        .from('staff_credentials')
        .delete()
        .in('staff_id', options.staffIds);
    }

    // Delete work schedules
    if (options.staffIds && options.staffIds.length > 0) {
      await supabaseClient
        .schema('provider_schema')
        .from('staff_work_schedules')
        .delete()
        .in('staff_id', options.staffIds);
    }

    // Delete read model data
    if (options.staffIds && options.staffIds.length > 0) {
      await supabaseClient
        .schema('provider_schema')
        .from('staff_read_model')
        .delete()
        .in('staff_id', options.staffIds);
    }
  } catch (error) {
    console.warn('Error cleaning up test data:', error);
  }
}

/**
 * Clean up test users from Supabase Auth
 */
export async function cleanupTestUsers(
  supabaseClient: SupabaseClient,
  userIds?: string[]
): Promise<void> {
  try {
    if (!userIds || userIds.length === 0) {
      return;
    }

    // Delete user roles
    await supabaseClient
      .schema('auth_schema')
      .from('user_roles')
      .delete()
      .in('user_id', userIds);

    // Note: Cannot delete users from auth.users via client
    // Users will be cleaned up manually or via admin API
  } catch (error) {
    console.warn('Error cleaning up test users:', error);
  }
}

/**
 * Clean up all test data (comprehensive cleanup)
 */
export async function cleanupAllTestData(
  supabaseClient: SupabaseClient
): Promise<void> {
  try {
    // Delete all test staff profiles (those with TEST in staff_id)
    await supabaseClient
      .schema('provider_schema')
      .from('staff_profiles')
      .delete()
      .like('staff_id', '%TEST%');

    // Delete all test read model data
    await supabaseClient
      .schema('provider_schema')
      .from('staff_read_model')
      .delete()
      .like('staff_id', '%TEST%');
  } catch (error) {
    console.warn('Error cleaning up all test data:', error);
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

