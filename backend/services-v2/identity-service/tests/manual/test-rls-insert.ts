/**
 * Manual Test: RLS INSERT Behavior
 * Test để xác nhận giả thuyết về error 42501
 * 
 * Giả thuyết: Error 42501 xuất hiện khi INSERT + SELECT, không phải chỉ INSERT
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service_role key
const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'auth_schema'
  }
});

async function testInsertWithoutSelect() {
  console.log('\n🧪 TEST 1: INSERT WITHOUT SELECT\n');
  
  const testId = uuidv4();
  const testEmail = `test-insert-only-${Date.now()}@hospital.vn`;
  
  try {
    // Test 1: INSERT without SELECT
    console.log('📝 Inserting profile WITHOUT .select()...');
    const insertResult = await supabaseClient
      .from('user_profiles')
      .insert({
        id: testId,
        email: testEmail,
        full_name: 'Test Insert Only',
        role_type: 'patient',
        is_active: true,
        is_verified: true,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    console.log('✅ INSERT Result:', {
      error: insertResult.error,
      errorCode: insertResult.error?.code,
      errorMessage: insertResult.error?.message,
      data: insertResult.data
    });
    
    // Verify data exists in database
    console.log('\n🔍 Verifying data exists in database...');
    const { data: verifyData, error: verifyError } = await supabaseClient
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('id', testId)
      .single();
    
    console.log('✅ Verification Result:', {
      error: verifyError,
      errorCode: verifyError?.code,
      data: verifyData
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseClient
      .from('user_profiles')
      .delete()
      .eq('id', testId);
    
    return { success: !insertResult.error, error: insertResult.error };
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    return { success: false, error };
  }
}

async function testInsertWithSelect() {
  console.log('\n🧪 TEST 2: INSERT WITH SELECT\n');
  
  const testId = uuidv4();
  const testEmail = `test-insert-select-${Date.now()}@hospital.vn`;
  
  try {
    // Test 2: INSERT with SELECT
    console.log('📝 Inserting profile WITH .select()...');
    const insertResult = await supabaseClient
      .from('user_profiles')
      .insert({
        id: testId,
        email: testEmail,
        full_name: 'Test Insert With Select',
        role_type: 'patient',
        is_active: true,
        is_verified: true,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    console.log('✅ INSERT + SELECT Result:', {
      error: insertResult.error,
      errorCode: insertResult.error?.code,
      errorMessage: insertResult.error?.message,
      data: insertResult.data ? 'Data returned' : 'No data'
    });
    
    // Verify data exists in database
    console.log('\n🔍 Verifying data exists in database...');
    const { data: verifyData, error: verifyError } = await supabaseClient
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('id', testId)
      .single();
    
    console.log('✅ Verification Result:', {
      error: verifyError,
      errorCode: verifyError?.code,
      data: verifyData
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseClient
      .from('user_profiles')
      .delete()
      .eq('id', testId);
    
    return { success: !insertResult.error, error: insertResult.error };
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    return { success: false, error };
  }
}

async function testInsertAfterSignIn() {
  console.log('\n🧪 TEST 3: INSERT AFTER SIGN IN (User Session Override)\n');
  
  const testId = uuidv4();
  const testEmail = `test-after-signin-${Date.now()}@hospital.vn`;
  const testPassword = 'Test@123456';
  
  try {
    // Step 1: Create auth user
    console.log('📝 Creating auth user...');
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }
    
    console.log('✅ Auth user created:', authData.user.id);
    
    // Step 2: Sign in to get session (this will override service_role key)
    console.log('\n🔐 Signing in to get session...');
    const { error: sessionError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (sessionError) {
      throw new Error(`Failed to sign in: ${sessionError.message}`);
    }

    console.log('✅ Signed in, session active');
    
    // Step 3: Try to INSERT profile (should fail with 42501 because user session overrides service_role)
    console.log('\n📝 Inserting profile AFTER sign in (with user session active)...');
    const insertResult = await supabaseClient
      .from('user_profiles')
      .insert({
        id: testId,
        email: testEmail,
        full_name: 'Test After Sign In',
        role_type: 'patient',
        is_active: true,
        is_verified: true,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    console.log('✅ INSERT Result (with user session):', {
      error: insertResult.error,
      errorCode: insertResult.error?.code,
      errorMessage: insertResult.error?.message,
      data: insertResult.data
    });
    
    // Step 4: Sign out to reset to service_role context
    console.log('\n🔓 Signing out to reset to service_role context...');
    await supabaseClient.auth.signOut();
    console.log('✅ Signed out');
    
    // Step 5: Verify data exists in database
    console.log('\n🔍 Verifying data exists in database (after sign out)...');
    const { data: verifyData, error: verifyError } = await supabaseClient
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('id', testId)
      .single();
    
    console.log('✅ Verification Result:', {
      error: verifyError,
      errorCode: verifyError?.code,
      data: verifyData
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseClient
      .from('user_profiles')
      .delete()
      .eq('id', testId);
    
    await supabaseClient.auth.admin.deleteUser(authData.user.id);
    
    return { success: !insertResult.error, error: insertResult.error };
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('🚀 Starting RLS INSERT Behavior Tests\n');
  console.log('📋 Testing với service_role key:', supabaseServiceRoleKey.substring(0, 20) + '...');
  console.log('🌐 Supabase URL:', supabaseUrl);
  console.log('═'.repeat(80));
  
  const results = {
    test1: await testInsertWithoutSelect(),
    test2: await testInsertWithSelect(),
    test3: await testInsertAfterSignIn()
  };
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  console.log('Test 1 (INSERT without SELECT):', results.test1.success ? '✅ PASS' : '❌ FAIL');
  console.log('Test 2 (INSERT with SELECT):', results.test2.success ? '✅ PASS' : '❌ FAIL');
  console.log('Test 3 (INSERT after sign in):', results.test3.success ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n🎯 CONCLUSION:');
  if (results.test1.success && results.test2.success && !results.test3.success) {
    console.log('✅ Giả thuyết ĐÚNG: Error 42501 xuất hiện khi có user session override service_role key');
  } else if (!results.test1.success || !results.test2.success) {
    console.log('⚠️  Có vấn đề với service_role key hoặc RLS policies');
  } else {
    console.log('❓ Kết quả không như mong đợi, cần điều tra thêm');
  }
  
  console.log('\n' + '═'.repeat(80));
}

// Run tests
runTests().catch(console.error);

