/**
 * Integration Test Helpers
 * Helper functions for integration tests with real Supabase database
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TestUser {
  userId: string;
  email: string;
  token: string;
  refreshToken: string;
  role: string;
  fullName?: string;
}

export interface CreateTestUserOptions {
  fullName?: string;
  phoneNumber?: string;
  citizenId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

/**
 * Create test user in real Supabase database
 * 
 * @param supabaseClient - Supabase client instance
 * @param email - User email
 * @param password - User password
 * @param role - User role (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT)
 * @param options - Additional user data
 * @returns Test user with credentials
 */
export async function createTestUser(
  supabaseClient: SupabaseClient,
  email: string,
  password: string,
  role: string,
  options: CreateTestUserOptions = {}
): Promise<TestUser> {
  try {
    // 0. Cleanup orphaned profiles with this email (from previous failed tests)
    // This prevents duplicate key errors when auth user is created with new ID
    // but old profile still exists
    try {
      await supabaseClient
        .from('user_profiles')
        .delete()
        .eq('email', email);
    } catch (cleanupError) {
      // Ignore cleanup errors - profile might not exist
      console.log(`ℹ️  Cleanup orphaned profile for ${email} (if exists)`);
    }

    // 1. Create auth user via Admin API
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: options.fullName || `Test ${role}`,
        role_type: role
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // 2. Create user_profiles EXPLICITLY (NO TRIGGER DEPENDENCY)
    // This matches the production code in SupabaseUserRepository.createAuthUser()
    // Generate unique citizen ID if not provided
    // Use timestamp + large random number to avoid collisions in parallel tests
    const uniqueCitizenId = options.citizenId || `${Date.now()}${Math.floor(Math.random() * 1000000)}`.slice(-12);
    
    const profileRecord = {
      id: authData.user.id, // Use auth user ID
      email,
      full_name: options.fullName || `Test ${role}`,
      role_type: role.toLowerCase(), // Normalize to lowercase for database constraint
      phone_number: options.phoneNumber,
      citizen_id: uniqueCitizenId,
      date_of_birth: options.dateOfBirth,
      gender: options.gender,
      address: options.address,
      is_active: options.isActive ?? true,
      is_verified: options.isVerified ?? true,
      subscription_tier: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create user_profiles explicitly (no trigger dependency)
    // IMPORTANT: RLS Behavior with Service Role Key:
    // - Service role key ALWAYS bypasses RLS (confirmed by Supabase official docs)
    // - If you get error 42501 (permission denied), it means:
    //   1. User session is overriding service_role key in Authorization header, OR
    //   2. Client is not using service_role key correctly
    // - In this function, we ensure service_role context by:
    //   1. Using service_role key from createTestSupabaseClient()
    //   2. NOT calling signInWithPassword() before INSERT
    //   3. Calling signOut() immediately after getting token to reset context
    //
    // Error handling:
    // - 23505 (duplicate key): Orphaned profile from previous failed test - cleanup and retry
    // - Any other error: Real failure - rollback auth user and throw

    const insertResult = await supabaseClient
      .from('user_profiles')
      .insert(profileRecord);

    // Check for duplicate key error (orphaned profile from previous failed test)
    if (insertResult.error && insertResult.error.code === '23505') {
      console.log(`⚠️  Found orphaned profile ${authData.user.id}, deleting and retrying...`);
      await supabaseClient
        .from('user_profiles')
        .delete()
        .eq('id', authData.user.id);

      // Retry insert
      const retryResult = await supabaseClient
        .from('user_profiles')
        .insert(profileRecord);

      if (retryResult.error) {
        // Rollback auth user on any error
        await supabaseClient.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create user profile after retry: ${retryResult.error.message} (code: ${retryResult.error.code})`);
      }
    } else if (insertResult.error) {
      // Rollback auth user on any error
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${insertResult.error.message} (code: ${insertResult.error.code})`);
    }

    // Profile created successfully
    // Note: We don't verify with SELECT here because we trust the INSERT succeeded (no error returned)

    // 3. Assign role in user_roles table (REQUIRED for permission checks)
    // The authentication middleware and permission service need this table
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role_name: role.toLowerCase(),
        assigned_by: 'system',
        assigned_at: new Date().toISOString()
      });

    if (roleError) {
      // Rollback on failure
      await supabaseClient.from('user_profiles').delete().eq('id', authData.user.id);
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to assign role: ${roleError.message} (code: ${roleError.code})`);
    }

    // 4. Get JWT token (use sign-in, then immediately sign out to avoid mutating the client session)
    // Retry logic for network errors (ECONNRESET, fetch failed)
    let sessionData: any = null;
    let sessionError: any = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      sessionData = result.data;
      sessionError = result.error;

      if (!sessionError) {
        // Success
        break;
      }

      // Check if it's a network error
      const errorMessage = sessionError.message || '';
      const isNetworkError = errorMessage.includes('fetch failed') ||
                            errorMessage.includes('ECONNRESET') ||
                            errorMessage.includes('ETIMEDOUT');

      if (isNetworkError && attempt < maxRetries) {
        console.log(`⚠️  Network error on attempt ${attempt}/${maxRetries}, retrying...`);
        // Wait before retry (exponential backoff: 1s, 2s, 3s)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Non-network error or max retries reached
      break;
    }

    if (sessionError) {
      // Cleanup on failure
      await supabaseClient.from('user_profiles').delete().eq('id', authData.user.id);
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to sign in after ${maxRetries} attempts: ${sessionError.message}`);
    }

    // CRITICAL: Reset client back to Service Role context to bypass RLS in subsequent calls
    // If we keep the user session, all later .from() queries will run under user RLS and may fail (42501)
    try {
      await supabaseClient.auth.signOut();
    } catch (_) {
      // ignore signOut errors in tests
    }

    return {
      userId: authData.user.id,
      email,
      token: sessionData.session!.access_token,
      refreshToken: sessionData.session!.refresh_token,
      role,
      fullName: options.fullName || `Test ${role}`
    };
  } catch (error) {
    console.error(`Error creating test user ${email}:`, error);
    throw error;
  }
}

/**
 * Get or create test user
 * Tries to sign in first, creates new user if doesn't exist
 * 
 * @param supabaseClient - Supabase client instance
 * @param email - User email
 * @param password - User password
 * @param role - User role
 * @param options - Additional user data
 * @returns Test user with credentials
 */
export async function getOrCreateTestUser(
  supabaseClient: SupabaseClient,
  email: string,
  password: string,
  role: string,
  options: CreateTestUserOptions = {}
): Promise<TestUser> {
  try {
    // Try to sign in first
    const { data: sessionData, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (!error && sessionData.session) {
      // User exists, get profile
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', sessionData.user.id)
        .single();

      // CRITICAL: Sign out immediately to reset client back to service_role context
      // If we keep the user session, subsequent .from() queries will run under user RLS context
      try {
        await supabaseClient.auth.signOut();
      } catch (_) {
        // ignore signOut errors
      }

      return {
        userId: sessionData.user.id,
        email,
        token: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
        role: profile?.role_type || role,
        fullName: profile?.full_name
      };
    }

    // User doesn't exist, create new
    return await createTestUser(supabaseClient, email, password, role, options);
  } catch (error) {
    console.error(`Error getting or creating test user ${email}:`, error);
    throw error;
  }
}

/**
 * Verify user exists in database
 * 
 * @param supabaseClient - Supabase client instance
 * @param userId - User ID
 * @returns True if user exists
 */
export async function verifyUserExists(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get user from database
 * 
 * @param supabaseClient - Supabase client instance
 * @param userId - User ID
 * @returns User data
 */
export async function getUserFromDb(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<any> {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
}

/**
 * Get user by email from database
 * 
 * @param supabaseClient - Supabase client instance
 * @param email - User email
 * @returns User data
 */
export async function getUserByEmail(
  supabaseClient: SupabaseClient,
  email: string
): Promise<any> {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    throw new Error(`Failed to get user by email: ${error.message}`);
  }

  return data;
}

/**
 * Cleanup test users
 * Deletes users and all related data
 *
 * @param supabaseClient - Supabase client instance
 * @param emails - Array of user emails to delete
 */
export async function cleanupTestUsers(
  supabaseClient: SupabaseClient,
  emails: string[]
): Promise<void> {
  for (const email of emails) {
    try {
      // Step 1: Get user ID from user_profiles (more reliable than auth.users)
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      let userId: string | null = profile?.id || null;

      // Step 2: If not found in profiles, try auth.users
      if (!userId) {
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const authUser = users?.users.find(u => u.email === email);
        userId = authUser?.id || null;
      }

      if (userId) {
        // Step 3: Delete related data first (to avoid foreign key constraints)
        await supabaseClient.from('user_sessions').delete().eq('user_id', userId);
        await supabaseClient.from('login_attempts').delete().eq('user_id', userId);
        await supabaseClient.from('two_factor_auth').delete().eq('user_id', userId);
        await supabaseClient.from('recovery_methods').delete().eq('user_id', userId);
        await supabaseClient.from('recovery_history').delete().eq('user_id', userId);
        await supabaseClient.from('user_permissions').delete().eq('user_id', userId);
        await supabaseClient.from('user_roles').delete().eq('user_id', userId);
        await supabaseClient.from('audit_logs').delete().eq('user_id', userId);

        // Step 4: Delete user profile
        await supabaseClient.from('user_profiles').delete().eq('id', userId);

        // Step 5: Delete auth user (may fail if already deleted by rollback)
        try {
          await supabaseClient.auth.admin.deleteUser(userId);
        } catch (authError) {
          // Ignore error if auth user already deleted
          console.log(`ℹ️  Auth user already deleted: ${email}`);
        }

        console.log(`✅ Cleaned up test user: ${email}`);
      } else {
        console.log(`ℹ️  User not found: ${email}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to cleanup user ${email}:`, error);
    }
  }
}

/**
 * Verify session exists in database
 * 
 * @param supabaseClient - Supabase client instance
 * @param userId - User ID
 * @returns True if active session exists
 */
export async function verifySessionExists(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get active sessions for user
 * 
 * @param supabaseClient - Supabase client instance
 * @param userId - User ID
 * @returns Array of active sessions
 */
export async function getActiveSessions(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<any[]> {
  const { data, error } = await supabaseClient
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to get sessions: ${error.message}`);
  }

  return data || [];
}

/**
 * Verify login attempt logged in database
 *
 * @param supabaseClient - Supabase client instance
 * @param email - User email
 * @param success - Whether login was successful
 * @returns True if login attempt exists
 */
export async function verifyLoginAttemptLogged(
  supabaseClient: SupabaseClient,
  email: string,
  success: boolean
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('login_attempts')
      .select('id')
      .eq('email', email)
      .eq('success', success)
      .order('attempted_at', { ascending: false })
      .limit(1)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get login attempts for user
 *
 * @param supabaseClient - Supabase client instance
 * @param email - User email
 * @param limit - Number of attempts to return
 * @returns Array of login attempts
 */
export async function getLoginAttempts(
  supabaseClient: SupabaseClient,
  email: string,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabaseClient
    .from('login_attempts')
    .select('*')
    .eq('email', email)
    .order('attempted_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get login attempts: ${error.message}`);
  }

  return data || [];
}

/**
 * Verify audit log entry exists
 *
 * @param supabaseClient - Supabase client instance
 * @param userId - User ID
 * @param action - Action type
 * @returns True if audit log exists
 */
export async function verifyAuditLogExists(
  supabaseClient: SupabaseClient,
  userId: string,
  action: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('audit_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get audit logs for user
 *
 * @param supabaseClient - Supabase client instance
 * @param userId - User ID
 * @param limit - Number of logs to return
 * @returns Array of audit logs
 */
export async function getAuditLogs(
  supabaseClient: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabaseClient
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get audit logs: ${error.message}`);
  }

  return data || [];
}

/**
 * Verify user role assigned
 *
 * @param supabaseClient - Supabase client instance
 * @param userId - User ID
 * @param roleName - Role name
 * @returns True if role assigned
 */
export async function verifyUserRoleAssigned(
  supabaseClient: SupabaseClient,
  userId: string,
  roleName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role_name', roleName)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get user roles
 *
 * @param supabaseClient - Supabase client instance
 * @param userId - User ID
 * @returns Array of user roles
 */
export async function getUserRoles(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<any[]> {
  const { data, error } = await supabaseClient
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get user roles: ${error.message}`);
  }

  return data || [];
}

/**
 * Create Supabase client for tests
 *
 * @returns Supabase client instance
 */
export function createTestSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.test');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'auth_schema'  // Use auth_schema instead of public
    }
  }) as any;
}

/**
 * Wait for async operation (useful for testing eventual consistency)
 *
 * @param ms - Milliseconds to wait
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Counter for unique email generation
let emailCounter = 0;

/**
 * Generate unique test email
 *
 * @param prefix - Email prefix
 * @returns Unique email address
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${emailCounter++}@hospital.vn`;
}

/**
 * Generate random password
 *
 * @returns Random password meeting policy requirements
 */
export function generateTestPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + 'A1!'; // Ensure it meets policy
}

/**
 * Cleanup all test users matching pattern
 * Useful for cleaning up before test suite runs
 *
 * @param supabaseClient - Supabase client instance
 * @param emailPattern - Email pattern to match (e.g., '%@hospital.vn')
 */
export async function cleanupAllTestUsers(
  supabaseClient: SupabaseClient,
  emailPattern: string = '%@hospital.vn'
): Promise<void> {
  try {
    // Get all test users from user_profiles
    const { data: profiles } = await supabaseClient
      .from('user_profiles')
      .select('id, email')
      .like('email', emailPattern);

    if (profiles && profiles.length > 0) {
      console.log(`🧹 Cleaning up ${profiles.length} test users...`);

      const emails = profiles.map(p => p.email);
      await cleanupTestUsers(supabaseClient, emails);

      console.log(`✅ Cleanup complete`);
    } else {
      console.log(`ℹ️  No test users to cleanup`);
    }
  } catch (error) {
    console.warn(`⚠️  Failed to cleanup all test users:`, error);
  }
}

/**
 * Verify pending registration exists in database
 *
 * @param supabaseClient Supabase client
 * @param pendingRegistrationId Pending registration ID
 * @returns True if exists, false otherwise
 */
export async function verifyPendingRegistrationExists(
  supabaseClient: SupabaseClient,
  pendingRegistrationId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('pending_registrations')
      .select('id')
      .eq('id', pendingRegistrationId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get pending registration from database
 *
 * @param supabaseClient Supabase client
 * @param pendingRegistrationId Pending registration ID
 * @returns Pending registration data
 */
export async function getPendingRegistrationFromDb(
  supabaseClient: SupabaseClient,
  pendingRegistrationId: string
): Promise<any> {
  const { data, error } = await supabaseClient
    .from('pending_registrations')
    .select('*')
    .eq('id', pendingRegistrationId)
    .single();

  if (error) {
    throw new Error(`Failed to get pending registration: ${error.message}`);
  }

  return data;
}

/**
 * Get pending registration by email
 *
 * @param supabaseClient Supabase client
 * @param email User email
 * @returns Pending registration data or null
 */
export async function getPendingRegistrationByEmail(
  supabaseClient: SupabaseClient,
  email: string
): Promise<any> {
  const { data, error } = await supabaseClient
    .from('pending_registrations')
    .select('*')
    .eq('email', email)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Cleanup pending registrations by emails
 *
 * @param supabaseClient Supabase client
 * @param emails Array of emails to cleanup
 */
export async function cleanupPendingRegistrations(
  supabaseClient: SupabaseClient,
  emails: string[]
): Promise<void> {
  for (const email of emails) {
    try {
      await supabaseClient
        .from('pending_registrations')
        .delete()
        .eq('email', email);
    } catch (error) {
      console.warn(`Failed to cleanup pending registration for ${email}:`, error);
    }
  }
}
