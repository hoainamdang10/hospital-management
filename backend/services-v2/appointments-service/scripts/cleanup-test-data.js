/**
 * Cleanup Test Data Script
 * Removes all test appointments from Supabase to avoid constraint conflicts
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'appointments_schema' }
});

async function cleanupTestData() {
  console.log('🧹 Starting test data cleanup...\n');

  try {
    // 1. Count test appointments
    const { data: testAppts, error: countError } = await supabase
      .from('appointments')
      .select('id, doctor_id, patient_id, status, start_at_utc')
      .or('doctor_id.like.TEST-DOC%,patient_id.like.PAT-0%,patient_id.like.e2e-%,patient_id.like.test-%');

    if (countError) {
      console.error('❌ Error counting test appointments:', countError);
      return;
    }

    console.log(`📊 Found ${testAppts?.length || 0} test appointments`);

    if (!testAppts || testAppts.length === 0) {
      console.log('✅ No test data to clean up!');
      return;
    }

    // Show sample
    console.log('\n📋 Sample test data:');
    testAppts.slice(0, 5).forEach((appt, i) => {
      console.log(`  ${i + 1}. ${appt.id} - Doctor: ${appt.doctor_id}, Patient: ${appt.patient_id}, Status: ${appt.status}`);
    });

    // 2. Delete test appointments
    console.log('\n🗑️  Deleting test appointments...');
    
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .or('doctor_id.like.TEST-DOC%,patient_id.like.PAT-0%,patient_id.like.e2e-%,patient_id.like.test-%');

    if (deleteError) {
      console.error('❌ Error deleting test appointments:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${testAppts.length} test appointments`);

    // 3. Cleanup related data
    console.log('\n🧹 Cleaning up related data...');

    // Read models
    const { error: readModelError } = await supabase
      .from('appointment_read_model')
      .delete()
      .or('patient_id.like.e2e-%,patient_id.like.test-%');

    if (readModelError) {
      console.log('⚠️  Warning: Could not clean read models:', readModelError.message);
    } else {
      console.log('✅ Cleaned up read models');
    }

    // Queues
    const { error: queueError } = await supabase
      .from('queues')
      .delete()
      .or('queue_id.like.queue-test-%,patient_id.like.e2e-%,patient_id.like.test-%');

    if (queueError) {
      console.log('⚠️  Warning: Could not clean queues:', queueError.message);
    } else {
      console.log('✅ Cleaned up queues');
    }

    // Outbox events
    const { error: outboxError } = await supabase
      .from('outbox_events')
      .delete()
      .or('aggregate_id.like.event-%');

    if (outboxError) {
      console.log('⚠️  Warning: Could not clean outbox events:', outboxError.message);
    } else {
      console.log('✅ Cleaned up outbox events');
    }

    console.log('\n✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupTestData()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
