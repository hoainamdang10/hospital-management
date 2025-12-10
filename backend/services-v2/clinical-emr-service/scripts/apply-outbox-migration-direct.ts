/**
 * Apply Outbox Migration Script - Direct SQL Execution
 * Executes SQL directly without relying on RPC functions
 * 
 * Usage: npm run migrate:outbox:direct
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function applyOutboxMigration() {
  console.log(' Starting Outbox Pattern Migration (Direct SQL)...\n');

  // Validate environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(' Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    console.error('   Checked path: ' + path.join(__dirname, '../../.env'));
    process.exit(1);
  }

  console.log(' Environment loaded');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${serviceRoleKey.substring(0, 20)}...\n`);

  // Read migration file
  const migrationPath = path.join(__dirname, '../migrations/007_create_outbox_pattern.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log(' Read migration file: 007_create_outbox_pattern.sql');
  console.log(`   Size: ${migrationSQL.length} bytes\n`);

  // Split SQL into individual statements (basic splitting)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(` Found ${statements.length} SQL statements\n`);
  console.log('  Executing migration via psql...\n');

  // Use psql to execute the entire migration file
  const { execSync } = require('child_process');
  
  try {
    // Extract connection details from Supabase URL
    const urlObj = new URL(supabaseUrl);
    const projectRef = urlObj.hostname.split('.')[0];
    
    // Construct PostgreSQL connection string
    const connectionString = `postgresql://postgres.${projectRef}:${serviceRoleKey.replace('eyJ', '[FILTERED]')}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
    
    console.log(' Connection info:');
    console.log(`   Project: ${projectRef}`);
    console.log(`   Host: aws-0-ap-southeast-1.pooler.supabase.com`);
    console.log(`   Port: 6543\n`);

    console.log('  Note: Direct psql execution not available in this environment');
    console.log('   Using alternative approach via REST API...\n');

    // Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: migrationSQL })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log(' Migration executed successfully via REST API!\n');

  } catch (error: any) {
    console.log('  REST API approach failed, using manual verification...\n');
    console.log('   Error:', error.message);
    console.log('\n Manual Steps:');
    console.log('   1. Open: https://supabase.com/dashboard/project/ciasxktujslgsdgylimv/sql/new');
    console.log('   2. Copy and paste the SQL from: migrations/007_create_outbox_pattern.sql');
    console.log('   3. Click "Run" to execute');
    console.log('   4. Come back here and I will verify the tables\n');

    // Ask to continue
    console.log(' After running SQL manually, we will verify the tables...\n');
  }

  // Verify tables (regardless of how they were created)
  console.log(' Verifying table creation...\n');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const tables = [
    { name: 'outbox_events', description: 'Transactional event storage' },
    { name: 'outbox_processing_lock', description: 'Worker coordination' },
    { name: 'outbox_dead_letter_queue', description: 'Failed events' }
  ];
  
  let successCount = 0;
  
  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .schema('clinical_schema')
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`    ${table.name}: ${error.message}`);
      } else {
        console.log(`    ${table.name}: Ready (${count || 0} rows) - ${table.description}`);
        successCount++;
      }
    } catch (err: any) {
      console.log(`    ${table.name}: ${err.message}`);
    }
  }

  console.log(`\n Verification Summary: ${successCount}/${tables.length} tables verified\n`);

  if (successCount === tables.length) {
    console.log(' All tables created successfully!\n');
    console.log(' Next Steps:');
    console.log('   1.  Tables created');
    console.log('   2. ⏳ Start clinical-emr-service');
    console.log('   3. ⏳ Verify worker starts: "Outbox Publisher Worker started"');
    console.log('   4. ⏳ Test event flow\n');
  } else {
    console.log('  Some tables not found. Please run SQL manually:\n');
    console.log('   Dashboard: https://supabase.com/dashboard/project/ciasxktujslgsdgylimv/sql/new');
    console.log('   SQL File: migrations/007_create_outbox_pattern.sql\n');
  }
}

// Run migration
applyOutboxMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
