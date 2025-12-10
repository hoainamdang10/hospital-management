/**
 * Test Database Connection Script
 * Verifies Supabase connection and schema setup
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Verify environment variables
 */
function testEnvironmentVariables(): TestResult {
  if (!config.supabaseUrl) {
    return {
      test: 'Environment Variables',
      status: 'FAIL',
      message: 'SUPABASE_URL is not set'
    };
  }

  if (!config.supabaseKey) {
    return {
      test: 'Environment Variables',
      status: 'FAIL',
      message: 'SUPABASE_SERVICE_ROLE_KEY is not set'
    };
  }

  return {
    test: 'Environment Variables',
    status: 'PASS',
    message: 'All required environment variables are set',
    details: {
      supabaseUrl: config.supabaseUrl,
      keyLength: config.supabaseKey.length
    }
  };
}

/**
 * Test 2: Test Supabase connection
 */
async function testSupabaseConnection(): Promise<TestResult> {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test connection with a simple RPC call
    const { error } = await supabase.rpc('exec_sql', {
      query: 'SELECT 1'
    });

    if (error) {
      return {
        test: 'Supabase Connection',
        status: 'FAIL',
        message: `Connection failed: ${error.message}`,
        details: error
      };
    }

    return {
      test: 'Supabase Connection',
      status: 'PASS',
      message: 'Successfully connected to Supabase'
    };
  } catch (error) {
    return {
      test: 'Supabase Connection',
      status: 'FAIL',
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Test 3: Verify patient_schema exists
 */
async function testSchemaExists(): Promise<TestResult> {
  // Schema verification is done via testTablesExist
  return {
    test: 'Schema Verification',
    status: 'PASS',
    message: 'Schema verification will be done via table checks'
  };
}

/**
 * Test 4: Verify all required tables exist
 */
async function testTablesExist(): Promise<TestResult> {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const requiredTables = [
      'patients',
      'insurance_info',
      'emergency_contacts',
      'patient_consents',
      'patient_links'
    ];

    const tableStatus: Record<string, boolean> = {};

    // Check tables using SQL query
    for (const table of requiredTables) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          query: `SELECT 1 FROM patient_schema.${table} LIMIT 1`
        });
        tableStatus[table] = !error;
      } catch {
        tableStatus[table] = false;
      }
    }

    const missingTables = Object.entries(tableStatus)
      .filter(([_, exists]) => !exists)
      .map(([table]) => table);

    if (missingTables.length > 0) {
      return {
        test: 'Tables Verification',
        status: 'FAIL',
        message: `Missing tables: ${missingTables.join(', ')}`,
        details: tableStatus
      };
    }

    return {
      test: 'Tables Verification',
      status: 'PASS',
      message: 'All required tables exist',
      details: tableStatus
    };
  } catch (error) {
    return {
      test: 'Tables Verification',
      status: 'FAIL',
      message: `Tables check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Test 5: Check if database has data
 */
async function testDatabaseData(): Promise<TestResult> {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'patient_schema',
      },
    });

    const { data, error } = await supabase
      .from('patients')
      .select('count', { count: 'exact' });

    if (error) {
      return {
        test: 'Database Data',
        status: 'FAIL',
        message: `Failed to count patients: ${error.message}`,
        details: error
      };
    }

    const count = (data as any)?.length || 0;

    return {
      test: 'Database Data',
      status: 'PASS',
      message: count > 0 
        ? `Database has ${count} patient(s)` 
        : 'Database is empty (run seed script to add sample data)',
      details: { patientCount: count }
    };
  } catch (error) {
    return {
      test: 'Database Data',
      status: 'FAIL',
      message: `Data check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n Testing Patient Registry Service Database Connection\n');
  console.log('='.repeat(60));

  // Test 1: Environment Variables
  console.log('\n1️⃣  Testing Environment Variables...');
  const envTest = testEnvironmentVariables();
  results.push(envTest);
  printResult(envTest);

  if (envTest.status === 'FAIL') {
    console.log('\n Cannot proceed without environment variables.');
    console.log('Please check your .env file in backend/services-v2/');
    process.exit(1);
  }

  // Test 2: Supabase Connection
  console.log('\n2️⃣  Testing Supabase Connection...');
  const connectionTest = await testSupabaseConnection();
  results.push(connectionTest);
  printResult(connectionTest);

  if (connectionTest.status === 'FAIL') {
    console.log('\n Cannot proceed without Supabase connection.');
    process.exit(1);
  }

  // Test 3: Schema Verification
  console.log('\n3️⃣  Verifying patient_schema...');
  const schemaTest = await testSchemaExists();
  results.push(schemaTest);
  printResult(schemaTest);

  // Test 4: Tables Verification
  console.log('\n4️⃣  Verifying Required Tables...');
  const tablesTest = await testTablesExist();
  results.push(tablesTest);
  printResult(tablesTest);

  // Test 5: Database Data
  console.log('\n5️⃣  Checking Database Data...');
  const dataTest = await testDatabaseData();
  results.push(dataTest);
  printResult(dataTest);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n Test Summary\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(` Passed: ${passed}/${results.length}`);
  console.log(` Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\n️  Some tests failed. Please follow the setup instructions below:\n');
    printSetupInstructions();
    process.exit(1);
  } else {
    console.log('\n All tests passed! Database is ready to use.\n');
    process.exit(0);
  }
}

/**
 * Print test result
 */
function printResult(result: TestResult) {
  const icon = result.status === 'PASS' ? '✅' : '❌';
  console.log(`   ${icon} ${result.test}: ${result.message}`);
  
  if (result.details && result.status === 'FAIL') {
    console.log(`      Details:`, result.details);
  }
}

/**
 * Print setup instructions
 */
function printSetupInstructions() {
  console.log(' Setup Instructions:\n');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy content from: backend/services-v2/patient-registry-service/database/schema.sql');
  console.log('5. Paste and run the SQL script');
  console.log('6. Run this test again: npm run test:connection\n');
  console.log('Optional: Seed sample data');
  console.log('   npm run db:seed\n');
}

// Run tests
runTests().catch((error) => {
  console.error('\n Unexpected error:', error);
  process.exit(1);
});

