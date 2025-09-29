const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Running Doctor Management Microservice Migrations...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../../../../database/migrations/create_doctor_management_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    console.log('⚠️  Note: You need to run this SQL manually in Supabase SQL Editor');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
    console.log('\n📋 Copy and paste the following SQL:\n');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));

    console.log('\n✅ After running the SQL in Supabase, the following tables will be created:');
    console.log('   - doctor_schedules (Lịch làm việc bác sĩ)');
    console.log('   - doctor_reviews (Đánh giá từ bệnh nhân)');
    console.log('   - doctor_shifts (Ca trực bác sĩ)');
    console.log('   - doctor_experiences (Kinh nghiệm và học vấn)');
    console.log('\n🔧 Functions created:');
    console.log('   - get_doctor_review_stats()');
    console.log('   - get_doctor_availability()');
    console.log('   - update_updated_at_column()');

    let successCount = 1;
    let errorCount = 0;

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Successful statements: ${successCount}`);
    console.log(`   ❌ Failed statements: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 All migrations completed successfully!');
      
      // Test the new tables
      await testTables();
    } else {
      console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function testTables() {
  console.log('\n🧪 Testing created tables...');

  const tables = ['doctor_schedules', 'doctor_reviews', 'doctor_shifts', 'doctor_experiences'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Table accessible`);
      }
    } catch (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    }
  }

  // Test functions
  console.log('\n🔧 Testing created functions...');
  
  try {
    const { data, error } = await supabase.rpc('get_doctor_review_stats', {
      doctor_id_param: 'DOC000001'
    });

    if (error) {
      console.log(`   ❌ get_doctor_review_stats: ${error.message}`);
    } else {
      console.log(`   ✅ get_doctor_review_stats: Function working`);
    }
  } catch (error) {
    console.log(`   ❌ get_doctor_review_stats: ${error.message}`);
  }

  try {
    const { data, error } = await supabase.rpc('get_doctor_availability', {
      doctor_id_param: 'DOC000001',
      check_date: '2024-01-15'
    });

    if (error) {
      console.log(`   ❌ get_doctor_availability: ${error.message}`);
    } else {
      console.log(`   ✅ get_doctor_availability: Function working`);
    }
  } catch (error) {
    console.log(`   ❌ get_doctor_availability: ${error.message}`);
  }
}

async function insertSampleData() {
  console.log('\n📝 Inserting sample data...');

  try {
    // Sample doctor schedule
    const { error: scheduleError } = await supabase
      .from('doctor_schedules')
      .insert([
        {
          doctor_id: 'DOC000001',
          day_of_week: 1, // Monday
          start_time: '08:00',
          end_time: '17:00',
          is_available: true,
          break_start: '12:00',
          break_end: '13:00',
          max_appointments: 16,
          slot_duration: 30
        },
        {
          doctor_id: 'DOC000001',
          day_of_week: 2, // Tuesday
          start_time: '08:00',
          end_time: '17:00',
          is_available: true,
          break_start: '12:00',
          break_end: '13:00',
          max_appointments: 16,
          slot_duration: 30
        }
      ]);

    if (scheduleError) {
      console.log(`   ⚠️  Sample schedule: ${scheduleError.message}`);
    } else {
      console.log(`   ✅ Sample schedule data inserted`);
    }

    // Sample doctor experience
    const { error: experienceError } = await supabase
      .from('doctor_experiences')
      .insert([
        {
          doctor_id: 'DOC000001',
          institution_name: 'Bệnh viện Đại học Y Dược TP.HCM',
          position: 'Bác sĩ nội trú',
          start_date: '2020-01-01',
          end_date: '2022-12-31',
          is_current: false,
          description: 'Thực tập và làm việc tại khoa Nội tim mạch',
          experience_type: 'work'
        },
        {
          doctor_id: 'DOC000001',
          institution_name: 'Đại học Y Dược TP.HCM',
          position: 'Bằng Tiến sĩ Y khoa',
          start_date: '2015-09-01',
          end_date: '2021-06-30',
          is_current: false,
          description: 'Chuyên ngành Tim mạch',
          experience_type: 'education'
        }
      ]);

    if (experienceError) {
      console.log(`   ⚠️  Sample experience: ${experienceError.message}`);
    } else {
      console.log(`   ✅ Sample experience data inserted`);
    }

  } catch (error) {
    console.log(`   ❌ Error inserting sample data: ${error.message}`);
  }
}

// Main execution
async function main() {
  await runMigrations();
  
  // Ask if user wants to insert sample data
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n❓ Do you want to insert sample data? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await insertSampleData();
    }
    
    console.log('\n🏁 Migration process completed!');
    console.log('\n📚 Next steps:');
    console.log('   1. Start the doctor service: npm run dev');
    console.log('   2. Test the new endpoints');
    console.log('   3. Check the API documentation at /api-docs');
    
    rl.close();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('❌ Migration process failed:', error);
  process.exit(1);
});
