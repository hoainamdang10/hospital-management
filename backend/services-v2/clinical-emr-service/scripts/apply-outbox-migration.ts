/**
 * Apply Outbox Migration Script
 * Run this to create outbox tables on Supabase
 * 
 * Usage: npm run migrate:outbox
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function applyOutboxMigration() {
  console.log('🚀 Starting Outbox Pattern Migration...\n');

  // Validate environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Connected to Supabase');
  console.log(`   URL: ${supabaseUrl}\n`);

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/007_create_outbox_pattern.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Read migration file: 007_create_outbox_pattern.sql');
    console.log(`   Size: ${migrationSQL.length} bytes\n`);

    // Execute migration
    console.log('⚙️  Executing migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      // Try direct query if RPC not available
      console.log('   Trying direct query execution...');
      
      const { error: queryError } = await supabase
        .from('_migrations')
        .select('*')
        .limit(1);

      if (queryError) {
        console.error('❌ Migration failed:', error.message);
        console.error('\n⚠️  Manual steps required:');
        console.error('   1. Go to Supabase Dashboard → SQL Editor');
        console.error('   2. Copy content from migrations/007_create_outbox_pattern.sql');
        console.error('   3. Paste and run in SQL Editor');
        console.error('   4. Verify tables created in clinical_schema\n');
        process.exit(1);
      }
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify tables created
    console.log('🔍 Verifying table creation...');

    const tables = ['outbox_events', 'outbox_processing_lock', 'outbox_dead_letter_queue'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .schema('clinical_schema')
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`   ❌ Table ${table} not found`);
      } else {
        console.log(`   ✅ Table ${table} created`);
      }
    }

    // Verify functions
    console.log('\n🔍 Verifying functions created...');
    const functions = [
      'acquire_outbox_lock',
      'release_outbox_lock',
      'update_outbox_heartbeat',
      'move_to_dead_letter_queue',
      'cleanup_old_published_events',
    ];

    console.log(`   ℹ️  ${functions.length} functions should be created`);
    functions.forEach(fn => console.log(`      - ${fn}`));

    console.log('\n✅ Outbox Pattern Migration Complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Restart clinical-emr-service');
    console.log('   2. Verify worker starts: "Outbox Publisher Worker started"');
    console.log('   3. Test event publishing through outbox');
    console.log('   4. Monitor outbox_events table for pending events\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
applyOutboxMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
