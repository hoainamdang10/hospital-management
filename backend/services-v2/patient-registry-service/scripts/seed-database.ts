/**
 * Database Seeding Script
 * 
 * Seeds the database with sample patient data for development
 * 
 * Usage:
 *   npm run db:seed
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(' Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log(' Starting database seeding...\n');

  try {
    // Read seed SQL file
    const seedSqlPath = path.join(__dirname, '../database/seed.sql');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf-8');

    console.log(' Loaded seed.sql file');

    // Split SQL into individual statements
    const statements = seedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(` Found ${statements.length} SQL statements\n`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and verification queries
      if (statement.startsWith('--') || statement.toUpperCase().startsWith('SELECT')) {
        skipCount++;
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Check if error is due to duplicate (which is OK)
          if (error.message.includes('duplicate') || error.message.includes('already exists')) {
            console.log(`️  Skipped (already exists): Statement ${i + 1}`);
            skipCount++;
          } else {
            console.error(` Error in statement ${i + 1}:`, error.message);
            errorCount++;
          }
        } else {
          successCount++;
          console.log(` Executed statement ${i + 1}`);
        }
      } catch (error) {
        console.error(` Exception in statement ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log('\n Seeding Summary:');
    console.log(`    Success: ${successCount}`);
    console.log(`   ️  Skipped: ${skipCount}`);
    console.log(`    Errors: ${errorCount}`);

    // Verify seeded data
    console.log('\n Verifying seeded data...\n');
    await verifySeededData();

    console.log('\n Database seeding completed successfully!');
  } catch (error) {
    console.error('\n Database seeding failed:', error);
    process.exit(1);
  }
}

async function verifySeededData() {
  try {
    // Count patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (patientsError) {
      console.error(' Error counting patients:', patientsError.message);
    } else {
      console.log(` Total patients: ${patients?.length || 0}`);
    }

    // Count active patients
    const { data: activePatients, error: activeError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) {
      console.error(' Error counting active patients:', activeError.message);
    } else {
      console.log(` Active patients: ${activePatients?.length || 0}`);
    }

    // Count insurance records
    const { data: insurance, error: insuranceError } = await supabase
      .from('insurance_info')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (insuranceError) {
      console.error(' Error counting insurance:', insuranceError.message);
    } else {
      console.log(` Active insurance records: ${insurance?.length || 0}`);
    }

    // Count emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*', { count: 'exact', head: true });

    if (contactsError) {
      console.error(' Error counting emergency contacts:', contactsError.message);
    } else {
      console.log(` Emergency contacts: ${contacts?.length || 0}`);
    }

    // Count consents
    const { data: consents, error: consentsError } = await supabase
      .from('patient_consents')
      .select('*', { count: 'exact', head: true });

    if (consentsError) {
      console.error(' Error counting consents:', consentsError.message);
    } else {
      console.log(` Patient consents: ${consents?.length || 0}`);
    }

    // List sample patients
    console.log('\n Sample Patients:');
    const { data: samplePatients, error: sampleError } = await supabase
      .from('patients')
      .select('patient_id, personal_info, status')
      .limit(5);

    if (sampleError) {
      console.error(' Error fetching sample patients:', sampleError.message);
    } else if (samplePatients) {
      samplePatients.forEach((patient: any) => {
        const fullName = patient.personal_info?.fullName || 'Unknown';
        console.log(`   - ${patient.patient_id}: ${fullName} (${patient.status})`);
      });
    }
  } catch (error) {
    console.error(' Error verifying data:', error);
  }
}

async function cleanDatabase() {
  console.log(' Cleaning existing seed data...\n');

  try {
    // Delete in reverse order of dependencies
    const tables = [
      'patient_consents',
      'patient_links',
      'emergency_contacts',
      'insurance_info',
      'patients'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('created_by', 'system');

      if (error) {
        console.warn(`️  Could not clean ${table}:`, error.message);
      } else {
        console.log(` Cleaned ${table}`);
      }
    }

    console.log('\n Database cleaned successfully!\n');
  } catch (error) {
    console.error(' Error cleaning database:', error);
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (command === 'clean') {
  cleanDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else if (command === 'reset') {
  cleanDatabase()
    .then(() => seedDatabase())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

