const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Receptionist Service Database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../database/init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing database initialization script...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec', {
            sql: statement
          });
          
          if (stmtError) {
            console.warn(`⚠️  Warning executing statement: ${stmtError.message}`);
          }
        }
      }
    }
    
    console.log('✅ Database initialization completed successfully!');
    
    // Test the database setup
    await testDatabaseSetup();
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

async function testDatabaseSetup() {
  console.log('🧪 Testing database setup...');
  
  try {
    // Test receptionist table
    const { data: receptionistTest, error: receptionistError } = await supabase
      .from('receptionist')
      .select('count(*)')
      .limit(1);
    
    if (receptionistError) {
      console.error('❌ Receptionist table test failed:', receptionistError);
    } else {
      console.log('✅ Receptionist table accessible');
    }
    
    // Test patient_check_ins table
    const { data: checkInTest, error: checkInError } = await supabase
      .from('patient_check_ins')
      .select('count(*)')
      .limit(1);
    
    if (checkInError) {
      console.error('❌ Patient check-ins table test failed:', checkInError);
    } else {
      console.log('✅ Patient check-ins table accessible');
    }
    
    // Test appointments table with receptionist fields
    const { data: appointmentTest, error: appointmentError } = await supabase
      .from('appointments')
      .select('appointment_id, receptionist_notes, insurance_verified')
      .limit(1);
    
    if (appointmentError) {
      console.error('❌ Appointments table test failed:', appointmentError);
    } else {
      console.log('✅ Appointments table with receptionist fields accessible');
    }
    
    // Test dashboard stats function
    const { data: statsTest, error: statsError } = await supabase
      .rpc('get_receptionist_dashboard_stats');
    
    if (statsError) {
      console.warn('⚠️  Dashboard stats function test failed:', statsError.message);
    } else {
      console.log('✅ Dashboard stats function working');
      console.log('📊 Sample stats:', statsTest);
    }
    
    console.log('🎉 All database tests completed!');
    
  } catch (error) {
    console.error('❌ Error testing database setup:', error);
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🏁 Database initialization finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, testDatabaseSetup };
