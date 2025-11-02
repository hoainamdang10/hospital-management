/**
 * Test User Pool - Seed và Reuse Test Users
 * 
 * Giải quyết vấn đề Supabase rate limiting bằng cách:
 * 1. Tạo pool test users một lần duy nhất
 * 2. Reuse users này cho tất cả tests
 * 3. Tránh gọi login API liên tục
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createTestUser, createStaffUser, cleanupTestUsers, TestUser } from './integrationHelpers';

export interface TestUserPool {
  admin: TestUser;
  doctor: TestUser;
  nurse: TestUser;
  patient: TestUser;
  patient2: TestUser; // For multi-user tests
  
  // Destructive test users (dành cho tests làm bẩn state)
  destructive: {
    lockable: TestUser;      // Cho tests lock/unlock
    deletable: TestUser;     // Cho tests delete
    passwordChange: TestUser; // Cho tests đổi password
  };
}

/**
 * Seed test users một lần duy nhất
 * Gọi hàm này trong global setup hoặc beforeAll
 * 
 * @param supabaseClient - Supabase client
 * @param options - Seeding options
 */
export async function seedTestUserPool(
  supabaseClient: SupabaseClient,
  options: { sequential?: boolean } = {}
): Promise<TestUserPool> {
  console.log('🌱 Seeding test user pool...');

  const timestamp = Date.now();
  
  // Generate unique citizen IDs
  const generateCitizenId = (index: number): string => {
    return `${timestamp}${index}`.slice(-12);
  };

  // Helper to create users with delay between each (sequential mode)
  const createUserWithDelay = async (
    userConfig: {
      email: string;
      password: string;
      role: string;
      options: any;
    },
    delayMs: number = 500
  ): Promise<TestUser> => {
    // Use appropriate function based on role
    const normalizedRole = userConfig.role.toLowerCase();
    const isStaff = ['admin', 'doctor', 'nurse', 'receptionist'].includes(normalizedRole);
    
    const user = isStaff 
      ? await createStaffUser(
          supabaseClient,
          userConfig.email,
          userConfig.password,
          userConfig.role,
          userConfig.options
        )
      : await createTestUser(
          supabaseClient,
          userConfig.email,
          userConfig.password,
          userConfig.role,
          userConfig.options
        );
    
    // Add delay to avoid burst (chỉ khi sequential mode)
    if (options.sequential && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    return user;
  };

  const userConfigs = [
    // Core users (read-only operations)
    {
      email: `pool-admin-${timestamp}@hospital.vn`,
      password: 'AdminPool123!',
      role: 'ADMIN',
      options: {
        fullName: 'Pool Admin User',
        phoneNumber: '0901111111',
        citizenId: generateCitizenId(1),
        dateOfBirth: '1985-01-01',
        gender: 'male',
        address: 'Admin Address',
        skipAutoLogin: true // Skip auto-login to reduce API calls
      }
    },
    {
      email: `pool-doctor-${timestamp}@hospital.vn`,
      password: 'DoctorPool123!',
      role: 'DOCTOR',
      options: {
        fullName: 'Pool Doctor User',
        phoneNumber: '0902222222',
        citizenId: generateCitizenId(2),
        dateOfBirth: '1980-02-02',
        gender: 'female',
        address: 'Doctor Address',
        skipAutoLogin: true
      }
    },
    {
      email: `pool-nurse-${timestamp}@hospital.vn`,
      password: 'NursePool123!',
      role: 'NURSE',
      options: {
        fullName: 'Pool Nurse User',
        phoneNumber: '0903333333',
        citizenId: generateCitizenId(3),
        dateOfBirth: '1990-03-03',
        gender: 'female',
        address: 'Nurse Address',
        skipAutoLogin: true
      }
    },
    {
      email: `pool-patient-${timestamp}@hospital.vn`,
      password: 'PatientPool123!',
      role: 'PATIENT',
      options: {
        fullName: 'Pool Patient User',
        phoneNumber: '0904444444',
        citizenId: generateCitizenId(4),
        dateOfBirth: '1995-04-04',
        gender: 'male',
        address: 'Patient Address',
        skipAutoLogin: true
      }
    },
    {
      email: `pool-patient2-${timestamp}@hospital.vn`,
      password: 'PatientPool123!',
      role: 'PATIENT',
      options: {
        fullName: 'Pool Patient 2 User',
        phoneNumber: '0905555555',
        citizenId: generateCitizenId(5),
        dateOfBirth: '1992-05-05',
        gender: 'female',
        address: 'Patient 2 Address',
        skipAutoLogin: true
      }
    },
    // Destructive test users
    {
      email: `pool-lockable-${timestamp}@hospital.vn`,
      password: 'LockablePool123!',
      role: 'PATIENT',
      options: {
        fullName: 'Pool Lockable User',
        phoneNumber: '0906666666',
        citizenId: generateCitizenId(6),
        dateOfBirth: '1993-06-06',
        gender: 'male',
        address: 'Lockable Address',
        skipAutoLogin: true
      }
    },
    {
      email: `pool-deletable-${timestamp}@hospital.vn`,
      password: 'DeletablePool123!',
      role: 'PATIENT',
      options: {
        fullName: 'Pool Deletable User',
        phoneNumber: '0907777777',
        citizenId: generateCitizenId(7),
        dateOfBirth: '1994-07-07',
        gender: 'female',
        address: 'Deletable Address',
        skipAutoLogin: true
      }
    },
    {
      email: `pool-password-change-${timestamp}@hospital.vn`,
      password: 'PasswordChangePool123!',
      role: 'PATIENT',
      options: {
        fullName: 'Pool Password Change User',
        phoneNumber: '0908888888',
        citizenId: generateCitizenId(8),
        dateOfBirth: '1996-08-08',
        gender: 'male',
        address: 'Password Change Address',
        skipAutoLogin: true
      }
    }
  ];

  let users: TestUser[];
  
  if (options.sequential) {
    // Tạo tuần tự với delay để tránh burst
    // skipAutoLogin = true giảm API calls một nửa, nên delay 1s là đủ
    console.log('   Creating users sequentially with 1000ms delay (skipAutoLogin=true)...');
    users = [];
    for (const config of userConfigs) {
      const user = await createUserWithDelay(config, 1000);
      users.push(user);
      console.log(`   ✓ Created ${config.role}: ${config.email}`);
    }
  } else {
    // Tạo song song với concurrency limit = 2
    console.log('   Creating users with concurrency limit = 2...');
    users = [];
    
    for (let i = 0; i < userConfigs.length; i += 2) {
      const batch = userConfigs.slice(i, i + 2);
      const batchUsers = await Promise.all(
        batch.map(config => createUserWithDelay(config, 0))
      );
      users.push(...batchUsers);
      
      // Delay between batches to avoid rate limiting (1500ms between creations)
      if (i + 2 < userConfigs.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  const [admin, doctor, nurse, patient, patient2, lockable, deletable, passwordChange] = users;

  // Login tất cả users tuần tự với delay để lấy token (tránh rate limit)
  console.log('🔐 Logging in all users to get tokens...');
  
  const usersToLogin = [
    { user: admin, password: 'AdminPool123!' },
    { user: doctor, password: 'DoctorPool123!' },
    { user: nurse, password: 'NursePool123!' },
    { user: patient, password: 'PatientPool123!' },
    { user: patient2, password: 'PatientPool123!' },
    { user: lockable, password: 'LockablePool123!' },
    { user: deletable, password: 'DeletablePool123!' },
    { user: passwordChange, password: 'PasswordChangePool123!' }
  ];

  const loggedInUsers: TestUser[] = [];
  
  for (let i = 0; i < usersToLogin.length; i++) {
    const { user, password } = usersToLogin[i];
    
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (error || !data.session) {
        console.error(`   ⚠️  Failed to login ${user.email}: ${error?.message || 'No session'}`);
        // Keep user without token
        loggedInUsers.push(user);
      } else {
        // Update user with token
        loggedInUsers.push({
          ...user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token
        });
        console.log(`   ✓ Logged in ${user.email.split('@')[0]}`);
      }

      // Sign out to reset context
      await supabaseClient.auth.signOut().catch(() => {});

      // Delay between logins to respect rate limit (2000ms - Supabase allows ~1 req/sec)
      if (i < usersToLogin.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`   ⚠️  Error logging in ${user.email}: ${error.message}`);
      loggedInUsers.push(user);
    }
  }

  const [
    adminWithToken,
    doctorWithToken,
    nurseWithToken,
    patientWithToken,
    patient2WithToken,
    lockableWithToken,
    deletableWithToken,
    passwordChangeWithToken
  ] = loggedInUsers;

  console.log('✅ Test user pool seeded successfully with tokens');
  console.log('   Core users:');
  console.log('   - Admin:', adminWithToken.email, adminWithToken.token ? '(✓ token)' : '(✗ no token)');
  console.log('   - Doctor:', doctorWithToken.email, doctorWithToken.token ? '(✓ token)' : '(✗ no token)');
  console.log('   - Nurse:', nurseWithToken.email, nurseWithToken.token ? '(✓ token)' : '(✗ no token)');
  console.log('   - Patient:', patientWithToken.email, patientWithToken.token ? '(✓ token)' : '(✗ no token)');
  console.log('   - Patient 2:', patient2WithToken.email, patient2WithToken.token ? '(✓ token)' : '(✗ no token)');
  console.log('   Destructive test users:');
  console.log('   - Lockable:', lockableWithToken.email, lockableWithToken.token ? '(✓ token)' : '(✗ no token)');
  console.log('   - Deletable:', deletableWithToken.email, deletableWithToken.token ? '(✓ token)' : '(✗ no token)');
  console.log('   - Password Change:', passwordChangeWithToken.email, passwordChangeWithToken.token ? '(✓ token)' : '(✗ no token)');

  return {
    admin: adminWithToken,
    doctor: doctorWithToken,
    nurse: nurseWithToken,
    patient: patientWithToken,
    patient2: patient2WithToken,
    destructive: {
      lockable: lockableWithToken,
      deletable: deletableWithToken,
      passwordChange: passwordChangeWithToken
    }
  };
}

/**
 * Cleanup test user pool
 * Gọi hàm này trong global teardown hoặc afterAll
 */
export async function cleanupTestUserPool(
  supabaseClient: SupabaseClient,
  pool: TestUserPool
): Promise<void> {
  console.log('🧹 Cleaning up test user pool...');
  
  // Check if pool is valid before cleanup
  if (!pool || !pool.admin) {
    console.warn('⚠️  Test pool is empty or invalid, skipping cleanup');
    return;
  }

  const emails = [
    pool.admin?.email,
    pool.doctor?.email,
    pool.nurse?.email,
    pool.patient?.email,
    pool.patient2?.email,
    pool.destructive?.lockable?.email,
    pool.destructive?.deletable?.email,
    pool.destructive?.passwordChange?.email
  ].filter(email => email); // Filter out undefined emails

  if (emails.length > 0) {
    await cleanupTestUsers(supabaseClient, emails);
  }
  
  console.log('✅ Test user pool cleaned up');
}

/**
 * Login test user từ pool và lấy token
 * Dùng khi users được tạo với skipAutoLogin=true
 * 
 * @param supabaseClient - Supabase client
 * @param user - TestUser từ pool
 * @returns Updated TestUser với fresh tokens
 */
export async function loginTestUser(
  supabaseClient: SupabaseClient,
  user: TestUser
): Promise<TestUser> {
  console.log(`🔐 Logging in test user ${user.email}...`);

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: user.email,
    password: user.password
  });

  if (error) {
    throw new Error(`Failed to login test user ${user.email}: ${error.message}`);
  }

  if (!data.session) {
    throw new Error(`No session returned for ${user.email}`);
  }

  // Sign out to reset client context
  await supabaseClient.auth.signOut().catch(() => {});

  console.log(`✅ Logged in ${user.email}`);

  return {
    ...user,
    token: data.session.access_token,
    refreshToken: data.session.refresh_token
  };
}

/**
 * Refresh JWT tokens for entire test user pool.
 * Dùng khi cache đã có pool nhưng token có thể hết hạn.
 */
export async function refreshTestUserPoolTokens(
  supabaseClient: SupabaseClient,
  pool: TestUserPool
): Promise<TestUserPool> {
  console.log('♻️  Refreshing tokens for cached test user pool...');

  const refreshed: TestUserPool = {
    admin: pool.admin,
    doctor: pool.doctor,
    nurse: pool.nurse,
    patient: pool.patient,
    patient2: pool.patient2,
    destructive: {
      lockable: pool.destructive.lockable,
      deletable: pool.destructive.deletable,
      passwordChange: pool.destructive.passwordChange
    }
  };

  const refreshSequentially = async (user: TestUser, label: string): Promise<TestUser> => {
    try {
      const updated = await loginTestUser(supabaseClient, user);
      // Giữ khoảng nghỉ nhỏ để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
      return updated;
    } catch (error: any) {
      console.warn(`⚠️  Could not refresh token for ${label} (${user.email}): ${error.message}`);
      return user;
    }
  };

  refreshed.admin = await refreshSequentially(pool.admin, 'admin');
  refreshed.doctor = await refreshSequentially(pool.doctor, 'doctor');
  refreshed.nurse = await refreshSequentially(pool.nurse, 'nurse');
  refreshed.patient = await refreshSequentially(pool.patient, 'patient');
  refreshed.patient2 = await refreshSequentially(pool.patient2, 'patient2');
  refreshed.destructive.lockable = await refreshSequentially(pool.destructive.lockable, 'lockable');
  refreshed.destructive.deletable = await refreshSequentially(pool.destructive.deletable, 'deletable');
  refreshed.destructive.passwordChange = await refreshSequentially(pool.destructive.passwordChange, 'passwordChange');

  console.log('✅ Tokens refreshed for test user pool');
  return refreshed;
}

/**
 * Get fresh token for test user
 * Chỉ dùng khi cần token mới (ví dụ: token expired)
 * Tránh dùng hàm này trong beforeEach!
 * 
 * @param supabaseClient - Supabase client
 * @param email - User email
 * @param password - User password
 * @returns Fresh access token
 */
export async function refreshTestUserToken(
  supabaseClient: SupabaseClient,
  email: string,
  password: string
): Promise<string> {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add delay before each attempt to respect rate limits
      if (attempt > 1) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff: 2s, 4s, 5s
        console.log(`⏳ Retry ${attempt}/${maxRetries} after ${delayMs}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Check if it's a rate limit error
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          lastError = error;
          console.warn(`⚠️  Rate limit hit on attempt ${attempt}/${maxRetries}`);
          continue; // Retry
        }
        
        // Other errors - throw immediately
        throw new Error(`Failed to refresh token for ${email}: ${error.message}`);
      }

      if (!data.session) {
        throw new Error(`No session returned for ${email}`);
      }

      // Success - sign out immediately to reset client context
      await supabaseClient.auth.signOut().catch(() => {});

      console.log(`✅ Token refreshed for ${email} (attempt ${attempt}/${maxRetries})`);
      return data.session.access_token;

    } catch (error: any) {
      // Network errors - retry
      const isNetworkError = error.message?.includes('fetch failed') ||
                            error.message?.includes('ECONNRESET') ||
                            error.message?.includes('ETIMEDOUT');
      
      if (isNetworkError && attempt < maxRetries) {
        lastError = error;
        console.warn(`⚠️  Network error on attempt ${attempt}/${maxRetries}`);
        continue; // Retry
      }
      
      // Non-retryable error or max retries reached
      throw error;
    }
  }

  // All retries failed
  throw new Error(
    `Failed to refresh token for ${email} after ${maxRetries} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Reset user state về trạng thái ban đầu
 * Dùng để cleanup sau destructive tests
 * 
 * @param supabaseClient - Supabase client
 * @param userId - User ID to reset
 */
export async function resetUserState(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<void> {
  console.log(`🔄 Resetting user state for ${userId}...`);

  try {
    // Unlock account if locked
    await supabaseClient
      .from('user_profiles')
      .update({
        is_locked: false,
        is_active: true,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // Clear failed login attempts
    await supabaseClient
      .from('login_attempts')
      .delete()
      .eq('user_id', userId);

    // Deactivate all sessions
    await supabaseClient
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);

    console.log(`✅ User state reset for ${userId}`);
  } catch (error: any) {
    console.error(`⚠️  Failed to reset user state for ${userId}:`, error.message);
    // Don't throw - best effort cleanup
  }
}

/**
 * Reset password for destructive test user
 * 
 * @param supabaseClient - Supabase client
 * @param userId - User ID
 * @param newPassword - New password
 */
export async function resetUserPassword(
  supabaseClient: SupabaseClient,
  userId: string,
  newPassword: string
): Promise<void> {
  console.log(`🔑 Resetting password for user ${userId}...`);

  try {
    await supabaseClient.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    console.log(`✅ Password reset for ${userId}`);
  } catch (error: any) {
    console.error(`⚠️  Failed to reset password for ${userId}:`, error.message);
    throw error;
  }
}

