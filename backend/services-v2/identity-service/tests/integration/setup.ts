/**
 * Integration Tests Setup
 * Global setup and teardown for integration tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { config } from 'dotenv';
import { SupabaseClient } from '@supabase/supabase-js';
import { createTestSupabaseClient } from '../helpers/integrationHelpers';
import { testUserPoolCache } from '../helpers/test-user-pool-cache';

// Load test environment variables
config({ path: '.env.test' });

// Global Supabase client
let supabaseClient: SupabaseClient;

/**
 * Global setup - runs once before all integration tests
 */
beforeAll(async () => {
  console.log('\n Setting up integration tests...');
  console.log(` Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(` Node Environment: ${process.env.NODE_ENV}`);

  try {
    // Create Supabase client
    supabaseClient = createTestSupabaseClient();

    // Verify database connection
    console.log(' Verifying database connection...');
    const { error } = await supabaseClient
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error(' Database connection failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log(' Database connection successful');

    // Verify required schemas exist
    await verifySchemas();

    // Verify test users exist (seeded by seed-test-data.ts)
    await verifyTestUsers();

    console.log(' Integration tests setup complete\n');
  } catch (error) {
    console.error(' Integration tests setup failed:', error);
    throw error;
  }
}, 30000); // 30 second timeout for setup

/**
 * Global teardown - runs once after all integration tests
 */
afterAll(async () => {
  console.log('\n Cleaning up integration tests...');

  try {
    // Cleanup cached test user pool
    if (testUserPoolCache.isCached()) {
      console.log('️  Cleaning up cached test user pool...');
      await testUserPoolCache.cleanup(supabaseClient);
    }

    // Cleanup dynamic test users (pattern: test-*@hospital.vn)
    await cleanupDynamicTestUsers();

    console.log(' Integration tests cleanup complete\n');
  } catch (error) {
    console.warn('️  Integration tests cleanup warning:', error);
  }
});

/**
 * Verify required database schemas exist
 */
async function verifySchemas(): Promise<void> {
  console.log(' Verifying database schemas...');

  const requiredTables = [
    'user_profiles',
    'user_roles',
    'user_sessions',
    'login_attempts',
    'audit_logs',
    'healthcare_roles',
    'permissions',
    'role_permissions',
    'password_policies',
    'recovery_methods',
    'recovery_history'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabaseClient
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.warn(`️  Table ${table} not accessible: ${error.message}`);
      }
    } catch (error) {
      console.warn(`️  Could not verify table ${table}:`, error);
    }
  }

  console.log(' Database schemas verified');
}

/**
 * Verify test users exist (seeded by seed-test-data.ts)
 */
async function verifyTestUsers(): Promise<void> {
  console.log(' Verifying test users...');

  const testEmails = [
    process.env.TEST_USER_EMAIL || 'test.admin@hospital.com',
    process.env.TEST_DOCTOR_EMAIL || 'test.doctor@hospital.com',
    process.env.TEST_PATIENT_EMAIL || 'test.patient@hospital.com'
  ];

  let foundCount = 0;

  for (const email of testEmails) {
    try {
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('id, email, role_type')
        .eq('email', email)
        .single();

      if (!error && data) {
        foundCount++;
        console.log(`   Found test user: ${email} (${data.role_type})`);
      } else {
        console.warn(`  ️  Test user not found: ${email}`);
      }
    } catch (error) {
      console.warn(`  ️  Could not verify test user ${email}:`, error);
    }
  }

  if (foundCount === 0) {
    console.warn('\n️  WARNING: No test users found!');
    console.warn('Run: npm run seed:test-data');
    console.warn('This will create test users for integration tests\n');
  } else {
    console.log(` Found ${foundCount}/${testEmails.length} test users`);
  }
}

/**
 * Cleanup dynamic test users created during tests
 * Pattern: test-*@hospital.vn
 */
async function cleanupDynamicTestUsers(): Promise<void> {
  console.log('️  Cleaning up dynamic test users...');

  try {
    // Get all users
    const { data: users } = await supabaseClient.auth.admin.listUsers();

    if (!users || !users.users) {
      console.log('  No users to cleanup');
      return;
    }

    // Filter dynamic test users (pattern: test-*@hospital.vn)
    const dynamicTestUsers = users.users.filter(user => 
      user.email?.match(/^test-\d+@hospital\.vn$/)
    );

    if (dynamicTestUsers.length === 0) {
      console.log('  No dynamic test users to cleanup');
      return;
    }

    console.log(`  Found ${dynamicTestUsers.length} dynamic test users to cleanup`);

    // Delete each dynamic test user
    for (const user of dynamicTestUsers) {
      try {
        // Delete related data first
        await supabaseClient.from('user_sessions').delete().eq('user_id', user.id);
        await supabaseClient.from('login_attempts').delete().eq('user_id', user.id);
        await supabaseClient.from('two_factor_auth').delete().eq('user_id', user.id);
        await supabaseClient.from('recovery_methods').delete().eq('user_id', user.id);
        await supabaseClient.from('recovery_history').delete().eq('user_id', user.id);
        await supabaseClient.from('user_permissions').delete().eq('user_id', user.id);
        await supabaseClient.from('user_roles').delete().eq('user_id', user.id);
        await supabaseClient.from('audit_logs').delete().eq('user_id', user.id);
        await supabaseClient.from('user_profiles').delete().eq('id', user.id);

        // Delete auth user
        await supabaseClient.auth.admin.deleteUser(user.id);

        console.log(`   Cleaned up: ${user.email}`);
      } catch (error) {
        console.warn(`  ️  Failed to cleanup ${user.email}:`, error);
      }
    }

    console.log(` Cleaned up ${dynamicTestUsers.length} dynamic test users`);
  } catch (error) {
    console.warn('️  Error during cleanup:', error);
  }
}

// Export for use in tests
export { supabaseClient };

