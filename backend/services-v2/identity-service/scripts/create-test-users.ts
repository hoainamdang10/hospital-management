/**
 * Create Test Users via Supabase Admin API
 * 
 * This script creates test users for integration tests using Supabase Admin API.
 * This ensures passwords are hashed correctly by Supabase Auth.
 * 
 * Usage:
 *   ts-node scripts/create-test-users.ts
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

// Test users to create
const testUsers = [
  {
    email: 'test.admin@hospital.com',
    password: 'TestAdmin123!',
    user_metadata: {
      full_name: 'Test Admin User',
      role: 'admin',  // Fixed: was 'role_type'
      phone_number: '0901234567',
      citizen_id: '001234567890',
      date_of_birth: '1980-01-01',
      gender: 'male',
      address: '123 Test Street, District 1, Ho Chi Minh City'
    }
  },
  {
    email: 'test.doctor@hospital.com',
    password: 'TestDoctor123!',
    user_metadata: {
      full_name: 'Test Doctor User',
      role: 'doctor',  // Fixed: was 'role_type'
      phone_number: '0901234568',
      citizen_id: '001234567891',
      date_of_birth: '1985-05-15',
      gender: 'female',
      address: '456 Test Avenue, District 3, Ho Chi Minh City'
    }
  },
  {
    email: 'test.patient@hospital.com',
    password: 'TestPatient123!',
    user_metadata: {
      full_name: 'Test Patient User',
      role: 'patient',  // Fixed: was 'role_type'
      phone_number: '0901234569',
      citizen_id: '001234567892',
      date_of_birth: '1990-12-25',
      gender: 'other',
      address: '789 Test Road, District 5, Ho Chi Minh City'
    }
  }
];

async function deleteExistingUsers() {
  console.log('\n🗑️  Deleting existing test users...');
  
  for (const user of testUsers) {
    try {
      // Get user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email === user.email);
      
      if (existingUser) {
        // Delete user
        const { error } = await supabase.auth.admin.deleteUser(existingUser.id);
        if (error) {
          console.error(`   ❌ Failed to delete ${user.email}:`, error.message);
        } else {
          console.log(`   ✅ Deleted ${user.email}`);
        }
      }
    } catch (error: any) {
      console.error(`   ❌ Error deleting ${user.email}:`, error.message);
    }
  }
}

async function createTestUsers() {
  console.log('\n👤 Creating test users...');
  console.log('   Note: Explicitly creating user_profiles (no trigger dependency)');

  for (const user of testUsers) {
    try {
      // Step 1: Create auth.users record via Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: user.user_metadata
      });

      if (error) {
        console.error(`   ❌ Failed to create auth user ${user.email}:`, error.message);
        continue;
      }

      if (!data.user) {
        console.error(`   ❌ No user data returned for ${user.email}`);
        continue;
      }

      // Step 2: Explicitly create user_profiles record
      // This ensures the profile exists even without database triggers
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: user.email,
          full_name: user.user_metadata.full_name,
          role_type: user.user_metadata.role,
          phone_number: user.user_metadata.phone_number,
          citizen_id: user.user_metadata.citizen_id,
          date_of_birth: user.user_metadata.date_of_birth,
          gender: user.user_metadata.gender,
          address: user.user_metadata.address,
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`   ❌ Failed to create profile for ${user.email}:`, profileError.message);
        // Rollback: delete auth user
        await supabase.auth.admin.deleteUser(data.user.id);
        continue;
      }

      console.log(`   ✅ Created ${user.email} (ID: ${data.user.id})`);
      console.log(`      Explicitly created profile with role: ${user.user_metadata.role}`);

    } catch (error: any) {
      console.error(`   ❌ Error creating ${user.email}:`, error.message);
    }
  }
}

async function verifyUsers() {
  console.log('\n🔍 Verifying test users...');
  
  for (const user of testUsers) {
    try {
      // Get user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email === user.email);
      
      if (existingUser) {
        console.log(`   ✅ ${user.email} exists (ID: ${existingUser.id})`);
        
        // Check profile
        const { data: profile, error } = await supabase
          .from('auth_schema.user_profiles')
          .select('*')
          .eq('id', existingUser.id)
          .single();
        
        if (error) {
          console.error(`   ⚠️  Profile not found for ${user.email}`);
        } else {
          console.log(`   ✅ Profile exists: ${profile.full_name} (${profile.role_type})`);
        }
      } else {
        console.error(`   ❌ ${user.email} not found`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error verifying ${user.email}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Creating test users for integration tests...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // Step 1: Delete existing users
    await deleteExistingUsers();
    
    // Step 2: Create new users
    await createTestUsers();
    
    // Step 3: Verify users
    await verifyUsers();
    
    console.log('\n✅ Test users setup complete!');
    console.log('\n📝 Test credentials:');
    console.log('   Admin:   test.admin@hospital.com / TestAdmin123!');
    console.log('   Doctor:  test.doctor@hospital.com / TestDoctor123!');
    console.log('   Patient: test.patient@hospital.com / TestPatient123!');
    console.log('\n🧪 Run tests: npm test -- tests/integration');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

