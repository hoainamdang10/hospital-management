/**
 * Test Database Permissions for Notifications Schema
 * Checks if notifications_schema exists and service_role has proper access
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'notifications_schema'
  }
});

async function testDatabasePermissions() {
  console.log('🔍 Testing Notifications Schema Permissions...\n');
  console.log('📋 Supabase URL:', supabaseUrl);
  console.log('🔑 Using service_role key\n');

  // Test 1: Check if schema exists
  console.log('Test 1: Checking if notifications_schema exists...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = 'notifications_schema'
      `
    });

    if (error) {
      console.log('⚠️  Cannot use exec_sql RPC, trying direct query...');
      
      // Try alternative method
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.schemata')
        .select('schema_name')
        .eq('schema_name', 'notifications_schema');
      
      if (schemaError) {
        console.error('❌ Schema check failed:', schemaError.message);
      } else if (schemaData && schemaData.length > 0) {
        console.log('✅ notifications_schema exists');
      } else {
        console.log('❌ notifications_schema does NOT exist');
      }
    } else {
      console.log('✅ notifications_schema exists');
    }
  } catch (err) {
    console.error('❌ Error checking schema:', err.message);
  }

  // Test 2: Check if appointment_reminders table exists
  console.log('\nTest 2: Checking if appointment_reminders table exists...');
  try {
    const { data, error } = await supabase
      .from('appointment_reminders')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Table check failed:', error.message);
      console.error('   Error details:', error);
    } else {
      console.log('✅ appointment_reminders table exists and is accessible');
    }
  } catch (err) {
    console.error('❌ Error checking table:', err.message);
  }

  // Test 3: Try to query appointment_reminders
  console.log('\nTest 3: Trying to query appointment_reminders...');
  try {
    const { data, error } = await supabase
      .from('appointment_reminders')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Query failed:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error details:', error.details);
      console.error('   Error hint:', error.hint);
    } else {
      console.log('✅ Query successful');
      console.log('   Found', data.length, 'reminders');
    }
  } catch (err) {
    console.error('❌ Error querying table:', err.message);
  }

  // Test 4: Check RLS policies
  console.log('\nTest 4: Checking RLS policies...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, roles, cmd
        FROM pg_policies
        WHERE schemaname = 'notifications_schema'
        AND tablename = 'appointment_reminders'
      `
    });

    if (error) {
      console.log('⚠️  Cannot check RLS policies via RPC');
    } else if (data && data.length > 0) {
      console.log('✅ RLS policies found:');
      data.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}) for ${policy.roles}`);
      });
    } else {
      console.log('⚠️  No RLS policies found');
    }
  } catch (err) {
    console.log('⚠️  Cannot check RLS policies:', err.message);
  }

  console.log('\n✅ Database permission test complete');
}

testDatabasePermissions().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

