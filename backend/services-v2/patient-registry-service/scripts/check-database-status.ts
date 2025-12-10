/**
 * Check Database Status Script
 * Kiểm tra trạng thái database trên Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

interface SchemaInfo {
  schema_name: string;
}

/**
 * Check all schemas in database
 */
async function checkSchemas() {
  console.log('\n Checking Database Schemas...\n');
  console.log('='.repeat(60));

  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Query all schemas
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        ORDER BY schema_name;
      `
    });

    if (error) {
      // Fallback: Try direct query
      console.log('  RPC method not available, trying direct query...\n');
      
      const { data: schemas, error: schemaError } = await supabase
        .from('information_schema.schemata')
        .select('schema_name');

      if (schemaError) {
        console.log(' Cannot query schemas directly.');
        console.log('   Please run the following query in Supabase SQL Editor:\n');
        console.log('   ```sql');
        console.log('   SELECT schema_name');
        console.log('   FROM information_schema.schemata');
        console.log('   WHERE schema_name NOT IN (\'pg_catalog\', \'information_schema\', \'pg_toast\')');
        console.log('   ORDER BY schema_name;');
        console.log('   ```\n');
        return;
      }

      displaySchemas(schemas as SchemaInfo[]);
      return;
    }

    displaySchemas(data as SchemaInfo[]);
  } catch (error) {
    console.error(' Error checking schemas:', error);
    console.log('\n Please run this query manually in Supabase SQL Editor:\n');
    printManualQueries();
  }
}

/**
 * Display schemas
 */
function displaySchemas(schemas: SchemaInfo[]) {
  console.log('\n Available Schemas:\n');

  if (!schemas || schemas.length === 0) {
    console.log('     No custom schemas found');
    console.log('   Only default PostgreSQL schemas exist\n');
    return;
  }

  schemas.forEach((schema, index) => {
    const icon = schema.schema_name === 'patient_schema' ? '' : '';
    console.log(`   ${icon} ${index + 1}. ${schema.schema_name}`);
  });

  console.log('');

  // Check if patient_schema exists
  const hasPatientSchema = schemas.some(s => s.schema_name === 'patient_schema');
  
  if (hasPatientSchema) {
    console.log(' patient_schema EXISTS - Patient Registry Service schema is ready!\n');
  } else {
    console.log(' patient_schema NOT FOUND - Need to run schema.sql\n');
    console.log(' To create patient_schema:');
    console.log('   1. Open Supabase SQL Editor');
    console.log('   2. Copy content from: database/schema.sql');
    console.log('   3. Paste and run the SQL script\n');
  }

  // Check other service schemas
  const serviceSchemas = [
    'auth_schema',
    'provider_schema',
    'scheduling_schema',
    'clinical_schema',
    'billing_schema',
    'notification_schema'
  ];

  console.log(' Other Service Schemas Status:\n');
  serviceSchemas.forEach(schemaName => {
    const exists = schemas.some(s => s.schema_name === schemaName);
    const icon = exists ? '' : '';
    const status = exists ? 'EXISTS' : 'NOT FOUND';
    console.log(`   ${icon} ${schemaName}: ${status}`);
  });
  console.log('');
}

/**
 * Check tables in patient_schema
 */
async function checkPatientSchemaTables() {
  console.log('\n Checking patient_schema Tables...\n');
  console.log('='.repeat(60));

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

    // Try to query each table
    const requiredTables = [
      'patients',
      'insurance_info',
      'emergency_contacts',
      'patient_consents',
      'patient_links'
    ];

    console.log('\n Required Tables Status:\n');

    const tableStatus: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    for (const tableName of requiredTables) {
      try {
        const { error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          tableStatus[tableName] = {
            exists: false,
            error: error.message
          };
        } else {
          tableStatus[tableName] = {
            exists: true,
            count: count || 0
          };
        }
      } catch (err) {
        tableStatus[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }

    // Display results
    requiredTables.forEach(tableName => {
      const status = tableStatus[tableName];
      if (status.exists) {
        console.log(`    ${tableName}: EXISTS (${status.count} records)`);
      } else {
        console.log(`    ${tableName}: NOT FOUND`);
        if (status.error) {
          console.log(`      Error: ${status.error}`);
        }
      }
    });

    console.log('');

    // Summary
    const existingTables = Object.values(tableStatus).filter(s => s.exists).length;
    const totalTables = requiredTables.length;

    if (existingTables === totalTables) {
      console.log(` All tables exist (${existingTables}/${totalTables})\n`);
      
      // Show data summary
      const totalRecords = Object.values(tableStatus)
        .filter(s => s.exists)
        .reduce((sum, s) => sum + (s.count || 0), 0);
      
      console.log(` Total Records: ${totalRecords}`);
      console.log(`   - Patients: ${tableStatus['patients']?.count || 0}`);
      console.log(`   - Insurance: ${tableStatus['insurance_info']?.count || 0}`);
      console.log(`   - Emergency Contacts: ${tableStatus['emergency_contacts']?.count || 0}`);
      console.log(`   - Consents: ${tableStatus['patient_consents']?.count || 0}`);
      console.log(`   - Links: ${tableStatus['patient_links']?.count || 0}`);
      console.log('');

      if (totalRecords === 0) {
        console.log(' Database is empty. Run seed script to add sample data:');
        console.log('   npm run db:seed\n');
      }
    } else {
      console.log(` Missing tables (${existingTables}/${totalTables})\n`);
      console.log(' To create tables:');
      console.log('   1. Open Supabase SQL Editor');
      console.log('   2. Copy content from: database/schema.sql');
      console.log('   3. Paste and run the SQL script\n');
    }

  } catch (error) {
    console.log(' Cannot check patient_schema tables');
    console.log('   Reason: Schema might not exist or no access\n');
    console.log(' Run this query in Supabase SQL Editor to check:\n');
    console.log('   ```sql');
    console.log('   SELECT table_name');
    console.log('   FROM information_schema.tables');
    console.log('   WHERE table_schema = \'patient_schema\';');
    console.log('   ```\n');
  }
}

/**
 * Print manual queries for Supabase SQL Editor
 */
function printManualQueries() {
  console.log(' Manual Queries for Supabase SQL Editor:\n');
  console.log('='.repeat(60));
  
  console.log('\n1⃣  Check All Schemas:\n');
  console.log('```sql');
  console.log('SELECT schema_name');
  console.log('FROM information_schema.schemata');
  console.log('WHERE schema_name NOT IN (\'pg_catalog\', \'information_schema\', \'pg_toast\')');
  console.log('ORDER BY schema_name;');
  console.log('```\n');

  console.log('2⃣  Check patient_schema Tables:\n');
  console.log('```sql');
  console.log('SELECT table_name, table_type');
  console.log('FROM information_schema.tables');
  console.log('WHERE table_schema = \'patient_schema\'');
  console.log('ORDER BY table_name;');
  console.log('```\n');

  console.log('3⃣  Count Records in Each Table:\n');
  console.log('```sql');
  console.log('SELECT');
  console.log('  (SELECT COUNT(*) FROM patient_schema.patients) as patients,');
  console.log('  (SELECT COUNT(*) FROM patient_schema.insurance_info) as insurance,');
  console.log('  (SELECT COUNT(*) FROM patient_schema.emergency_contacts) as emergency_contacts,');
  console.log('  (SELECT COUNT(*) FROM patient_schema.patient_consents) as consents,');
  console.log('  (SELECT COUNT(*) FROM patient_schema.patient_links) as links;');
  console.log('```\n');
}

/**
 * Main function
 */
async function main() {
  console.log('\n Database Status Check - Patient Registry Service\n');
  console.log('='.repeat(60));

  // Validate config
  if (!config.supabaseUrl || !config.supabaseKey) {
    console.log('\n Missing Supabase credentials!');
    console.log('   Please check .env file in backend/services-v2/\n');
    console.log('   Required variables:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }

  console.log('\n Supabase Configuration:');
  console.log(`   URL: ${config.supabaseUrl}`);
  console.log(`   Key: ${config.supabaseKey.substring(0, 20)}...`);
  console.log('');

  // Check schemas
  await checkSchemas();

  // Check patient_schema tables
  await checkPatientSchemaTables();

  // Print manual queries
  console.log('\n' + '='.repeat(60));
  console.log('\n Need to run queries manually?');
  console.log('   See queries above or run: npm run test:connection\n');
}

// Run
main().catch((error) => {
  console.error('\n Unexpected error:', error);
  process.exit(1);
});

