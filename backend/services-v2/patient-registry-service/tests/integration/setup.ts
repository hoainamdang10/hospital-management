/**
 * Integration Tests Setup
 * 
 * Global setup and teardown for integration tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { config } from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load test environment variables
config({ path: '.env.test' });

let supabaseClient: SupabaseClient;

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  console.log('🚀 Setting up integration tests...');

  // Initialize Supabase client
  supabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify database connection
  try {
    const { error } = await supabaseClient
      .from('patient_profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }

    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }

  // Setup test schemas if needed
  await setupTestSchemas();

  // Create test users
  await createTestUsers();

  console.log('✅ Integration tests setup complete');
});

/**
 * Global teardown - runs once after all tests
 */
afterAll(async () => {
  console.log('🧹 Cleaning up integration tests...');

  // Cleanup test data
  await cleanupTestData();

  // Delete test users
  await deleteTestUsers();

  console.log('✅ Integration tests cleanup complete');
});

/**
 * Setup test database schemas
 */
async function setupTestSchemas() {
  try {
    // Check if schemas exist
    const { data: schemas } = await supabaseClient
      .rpc('get_schemas');

    const requiredSchemas = ['auth_schema', 'patient_schema'];
    const missingSchemas = requiredSchemas.filter(
      schema => !schemas?.includes(schema)
    );

    if (missingSchemas.length > 0) {
      console.warn(`⚠️  Missing schemas: ${missingSchemas.join(', ')}`);
      console.warn('Please run database migrations before running tests');
    }
  } catch (error) {
    console.warn('⚠️  Could not verify schemas:', error);
  }
}

/**
 * Create test users for integration tests
 */
async function createTestUsers() {
  const { setupTestUserRoles } = await import('../helpers/roleAssignment');

  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'test-password-123',
      role: 'ADMIN'
    },
    {
      email: 'receptionist@test.com',
      password: 'test-password-123',
      role: 'RECEPTIONIST'
    },
    {
      email: 'doctor@test.com',
      password: 'test-password-123',
      role: 'DOCTOR'
    },
    {
      email: 'nurse@test.com',
      password: 'test-password-123',
      role: 'NURSE'
    },
    {
      email: 'patient@test.com',
      password: 'test-password-123',
      role: 'PATIENT'
    }
  ];

  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
      const userExists = existingUser?.users.some(u => u.email === user.email);

      if (!userExists) {
        // Create user
        const { data, error } = await supabaseClient.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        });

        if (error) {
          console.warn(`⚠️  Could not create test user ${user.email}:`, error.message);
        } else if (data.user) {
          console.log(`✅ Created test user: ${user.email}`);

          // Assign role and permissions
          await setupTestUserRoles(supabaseClient, data.user.id, user.email);
        }
      } else {
        console.log(`ℹ️  Test user already exists: ${user.email}`);

        // Get user ID and ensure roles are assigned
        const existingUserData = existingUser?.users.find(u => u.email === user.email);
        if (existingUserData) {
          await setupTestUserRoles(supabaseClient, existingUserData.id, user.email);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Error creating test user ${user.email}:`, error);
    }
  }
}

/**
 * Cleanup test data after tests
 */
async function cleanupTestData() {
  try {
    // Delete test patients
    const { error: patientsError } = await supabaseClient
      .from('patient_profiles')
      .delete()
      .like('national_id', 'TEST%');

    if (patientsError) {
      console.warn('⚠️  Could not cleanup test patients:', patientsError.message);
    }

    // Delete test insurance records
    const { error: insuranceError } = await supabaseClient
      .from('patient_insurance')
      .delete()
      .like('policy_number', 'TEST%');

    if (insuranceError) {
      console.warn('⚠️  Could not cleanup test insurance:', insuranceError.message);
    }

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.warn('⚠️  Error cleaning up test data:', error);
  }
}

/**
 * Delete test users after tests
 */
async function deleteTestUsers() {
  const { cleanupUserRoles } = await import('../helpers/roleAssignment');

  const testEmails = [
    'admin@test.com',
    'receptionist@test.com',
    'doctor@test.com',
    'nurse@test.com',
    'patient@test.com'
  ];

  for (const email of testEmails) {
    try {
      // Get user by email
      const { data: users } = await supabaseClient.auth.admin.listUsers();
      const user = users?.users.find(u => u.email === email);

      if (user) {
        // Cleanup roles and permissions first
        await cleanupUserRoles(supabaseClient, user.id);

        // Delete user
        const { error } = await supabaseClient.auth.admin.deleteUser(user.id);

        if (error) {
          console.warn(`⚠️  Could not delete test user ${email}:`, error.message);
        } else {
          console.log(`✅ Deleted test user: ${email}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Error deleting test user ${email}:`, error);
    }
  }
}

/**
 * Helper function to get test user token
 */
export async function getTestUserToken(email: string, password: string): Promise<string> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session) {
    throw new Error(`Failed to get token for ${email}: ${error?.message}`);
  }

  return data.session.access_token;
}

/**
 * Helper function to create test patient
 */
export async function createTestPatient(data: any): Promise<string> {
  const { data: patient, error } = await supabaseClient
    .from('patient_profiles')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test patient: ${error.message}`);
  }

  return patient.patient_id;
}

/**
 * Helper function to delete test patient
 */
export async function deleteTestPatient(patientId: string): Promise<void> {
  const { error } = await supabaseClient
    .from('patient_profiles')
    .delete()
    .eq('patient_id', patientId);

  if (error) {
    throw new Error(`Failed to delete test patient: ${error.message}`);
  }
}

// Export Supabase client for use in tests
export { supabaseClient };

