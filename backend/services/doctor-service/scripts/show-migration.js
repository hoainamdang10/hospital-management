const fs = require('fs');
const path = require('path');

console.log('🏥 Doctor Management Microservice - Database Migration\n');

try {
  // Read the migration file
  const migrationPath = path.join(__dirname, '../../../../database/migrations/create_doctor_management_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    console.log('\n💡 Please make sure the migration file exists at:');
    console.log('   database/migrations/create_doctor_management_tables.sql');
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📋 INSTRUCTIONS:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL below');
  console.log('4. Click "Run" to execute the migration');
  console.log('\n🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project-id]/sql\n');
  
  console.log('=' .repeat(100));
  console.log('📄 MIGRATION SQL - COPY FROM HERE:');
  console.log('=' .repeat(100));
  console.log(migrationSQL);
  console.log('=' .repeat(100));
  console.log('📄 END OF MIGRATION SQL');
  console.log('=' .repeat(100));
  
  console.log('\n✅ After running the SQL, you will have:');
  console.log('   📊 4 new tables:');
  console.log('      - doctor_schedules (Lịch làm việc bác sĩ)');
  console.log('      - doctor_reviews (Đánh giá từ bệnh nhân)');
  console.log('      - doctor_shifts (Ca trực bác sĩ)');
  console.log('      - doctor_experiences (Kinh nghiệm và học vấn)');
  console.log('   🔧 3 new functions:');
  console.log('      - get_doctor_review_stats()');
  console.log('      - get_doctor_availability()');
  console.log('      - update_updated_at_column()');
  console.log('   🔒 Proper indexes and constraints');
  console.log('   ⚡ Automatic triggers for updated_at');
  
  console.log('\n🚀 Next steps after migration:');
  console.log('   1. Start the doctor service: npm run dev');
  console.log('   2. Test endpoints: http://localhost:3002/health');
  console.log('   3. View API docs: http://localhost:3002/api-docs');
  console.log('   4. Test profile endpoint: http://localhost:3002/api/doctors/DOC000001/profile');

} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}
