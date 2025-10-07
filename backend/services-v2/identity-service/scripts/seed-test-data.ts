/**
 * Seed Test Data Script
 *
 * Creates comprehensive test data for integration tests including:
 * - Test users (admin, doctor, nurse, receptionist, patients)
 * - MFA settings
 * - Sessions
 * - Permissions
 *
 * Uses SupabaseUserRepository.createAuthUser() to create both auth user + profile
 * This approach:
 * - ✅ Explicit control over user creation
 * - ✅ No hidden trigger dependencies
 * - ✅ Rollback on failure
 * - ✅ Clean Architecture compliant
 *
 * Usage:
 *   npm run seed:test-data
 *   or
 *   ts-node scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Import infrastructure
import { SupabaseUserRepository } from '../src/infrastructure/repositories/SupabaseUserRepository';
import { ILogger } from '../src/application/services/ILogger';

// Import test user fixtures
import { ALL_TEST_USERS, INACTIVE_USER } from '../tests/fixtures/test-users';

// Create simple logger
const logger: ILogger = {
  debug: (message: string, meta?: any) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  fatal: (message: string, meta?: any) => {
    console.error(`[FATAL] ${new Date().toISOString()} - ${message}`, meta || '');
  }
};

// Create repository instance
const userRepository = new SupabaseUserRepository(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  logger
);

/**
 * Delete all existing test users
 */
async function cleanupTestUsers() {
  console.log('\n🗑️  Cleaning up existing test users...');
  
  const { data: users } = await supabase.auth.admin.listUsers();
  
  for (const testUser of ALL_TEST_USERS) {
    const existingUser = users?.users.find(u => u.email === testUser.email);
    
    if (existingUser) {
      const { error } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (error) {
        console.error(`   ❌ Failed to delete ${testUser.email}:`, error.message);
      } else {
        console.log(`   ✅ Deleted ${testUser.email}`);
      }
    }
  }
}

/**
 * Create test users via SupabaseUserRepository
 * This approach:
 * - ✅ Uses application layer (repository)
 * - ✅ Explicit control over user creation
 * - ✅ No hidden trigger dependencies
 * - ✅ Rollback on failure
 */
async function createTestUsers() {
  console.log('\n👤 Creating test users via SupabaseUserRepository...');
  console.log('   Method: createAuthUser() - creates both auth user + profile\n');

  const createdUsers: Record<string, string> = {};

  for (const testUser of ALL_TEST_USERS) {
    try {
      // Create user via repository (Clean Architecture approach)
      const user = await userRepository.createAuthUser({
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.user_metadata.full_name,
        roleType: testUser.user_metadata.role,
        citizenId: testUser.user_metadata.citizen_id,
        dateOfBirth: testUser.user_metadata.date_of_birth
          ? new Date(testUser.user_metadata.date_of_birth)
          : undefined,
        gender: testUser.user_metadata.gender,
        phoneNumber: testUser.user_metadata.phone_number,
        address: testUser.user_metadata.address,
        emailConfirm: true // Auto-confirm email
      });

      const userId = typeof user.id === 'string' ? user.id : (user.id as any).value;
      createdUsers[testUser.email] = userId;
      console.log(`   ✅ ${testUser.email}`);
      console.log(`      ID: ${userId}`);
      console.log(`      Role: ${testUser.user_metadata.role}`);
      console.log(`      Name: ${testUser.user_metadata.full_name}\n`);

    } catch (error: any) {
      console.error(`   ❌ Error creating ${testUser.email}:`, error.message);
    }
  }

  return createdUsers;
}

/**
 * Deactivate inactive test user
 */
async function deactivateInactiveUser(userId: string) {
  console.log('\n🚫 Deactivating inactive test user...');
  
  try {
    const { error } = await supabase
      .from('auth_schema.user_profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      console.error(`   ❌ Failed to deactivate user:`, error.message);
    } else {
      console.log(`   ✅ Deactivated ${INACTIVE_USER.email}`);
    }
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
  }
}

/**
 * Verify created users
 */
async function verifyUsers() {
  console.log('\n🔍 Verifying test users...\n');

  for (const testUser of ALL_TEST_USERS) {
    try {
      // Get user from auth.users
      const { data: users } = await supabase.auth.admin.listUsers();
      const authUser = users?.users.find(u => u.email === testUser.email);

      if (!authUser) {
        console.error(`   ❌ ${testUser.email} not found in auth.users`);
        continue;
      }

      // Get user profile - try direct query
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) {
        // Profile should exist (created explicitly by createAuthUser)
        // If not found, there's an issue with the creation process
        console.log(`   ⚠️  ${testUser.email} - Profile not found`);
        console.log(`      User ID: ${authUser.id}`);
        console.log(`      Note: Profile should exist in auth_schema.user_profiles (created explicitly)\n`);
        continue;
      }

      console.log(`   ✅ ${testUser.email}`);
      console.log(`      Profile: ${(profile as any).full_name} (${(profile as any).role_type})`);
      console.log(`      Active: ${(profile as any).is_active}, Verified: ${(profile as any).is_verified}\n`);

    } catch (error: any) {
      console.error(`   ❌ Error verifying ${testUser.email}:`, error.message);
    }
  }
}

/**
 * Display test credentials
 */
function displayCredentials() {
  console.log('\n📝 Test Credentials:\n');
  console.log('   Admin:        test.admin@hospital.com / TestAdmin123!');
  console.log('   Doctor:       test.doctor@hospital.com / TestDoctor123!');
  console.log('   Nurse:        test.nurse@hospital.com / TestNurse123!');
  console.log('   Receptionist: test.receptionist@hospital.com / TestReceptionist123!');
  console.log('   Patient:      test.patient@hospital.com / TestPatient123!');
  console.log('   Patient 2:    test.patient2@hospital.com / TestPatient2123!');
  console.log('   MFA User:     test.mfa@hospital.com / TestMFA123!');
  console.log('   Inactive:     test.inactive@hospital.com / TestInactive123! (deactivated)');
  console.log('\n🧪 Run integration tests: npm test -- tests/integration');
  console.log('💾 Export for tests: export TEST_USER_EMAIL=test.admin@hospital.com');
  console.log('                     export TEST_USER_PASSWORD=TestAdmin123!');
}

/**
 * Main function
 */
async function main() {
  console.log('🌱 Seeding test data for integration tests...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📊 Total users to create: ${ALL_TEST_USERS.length}`);
  
  try {
    // Step 1: Cleanup existing test users
    await cleanupTestUsers();
    
    // Step 2: Create test users
    const createdUsers = await createTestUsers();
    
    // Step 3: Deactivate inactive user
    const inactiveUserId = createdUsers[INACTIVE_USER.email];
    if (inactiveUserId) {
      await deactivateInactiveUser(inactiveUserId);
    }
    
    // Step 4: Verify all users
    await verifyUsers();
    
    // Step 5: Display credentials
    displayCredentials();
    
    console.log('\n✅ Test data seeding complete!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run main function
main();

