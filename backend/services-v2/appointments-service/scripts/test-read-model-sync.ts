/**
 * Read Model Sync Test Script
 * Tests the complete flow: Write Model → Event → Read Model
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @usage: ts-node scripts/test-read-model-sync.ts
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APPOINTMENTS_API_URL = process.env.APPOINTMENTS_API_URL || 'http://localhost:3004';

async function testReadModelSync() {
  console.log('='.repeat(70));
  console.log(' READ MODEL SYNC TEST');
  console.log('='.repeat(70));

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Step 1: Get current counts
    console.log('\n Step 1: Getting baseline counts...');
    const { count: writeCountBefore } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    const { count: readCountBefore } = await supabase
      .from('appointment_read_model')
      .select('*', { count: 'exact', head: true });

    console.log(`   Write Model: ${writeCountBefore} records`);
    console.log(`   Read Model: ${readCountBefore} records`);

    // Step 2: Create test appointment via API
    console.log('\n Step 2: Creating test appointment via API...');
    
    const testAppointment = {
      patientId: '00000000-0000-0000-0000-000000000001', // Use a test patient ID
      doctorId: '00000000-0000-0000-0000-000000000002', // Use a test doctor ID
      appointmentDate: '2025-12-01',
      appointmentTime: '14:00',
      type: 'CONSULTATION',
      priority: 'ROUTINE',
      reason: 'Test appointment for read model sync',
      durationMinutes: 30
    };

    try {
      const response = await axios.post(
        `${APPOINTMENTS_API_URL}/api/v1/appointments`,
        testAppointment,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token' // Replace with valid JWT
          }
        }
      );

      console.log(`    Appointment created: ${response.data.id}`);
      const appointmentId = response.data.id;

      // Step 3: Wait for event processing
      console.log('\n⏳ Step 3: Waiting for event processing (5 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 4: Check if read model was updated
      console.log('\n Step 4: Checking read model sync...');
      
      const { data: readModelRecord, error } = await supabase
        .from('appointment_read_model')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error) {
        console.error(`    Read model NOT synced:`, error.message);
        console.log('\n Troubleshooting steps:');
        console.log('   1. Check if appointments service is running');
        console.log('   2. Check if RabbitMQ is running');
        console.log('   3. Check service logs for event handler errors');
        console.log('   4. Verify EventSubscriptions are properly configured');
        console.log('   5. Run: ts-node scripts/verify-event-bus.ts');
      } else {
        console.log(`    Read model synced successfully!`);
        console.log(`   Record:`, JSON.stringify(readModelRecord, null, 2));
      }

      // Step 5: Get final counts
      console.log('\n Step 5: Getting final counts...');
      const { count: writeCountAfter } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });
      
      const { count: readCountAfter } = await supabase
        .from('appointment_read_model')
        .select('*', { count: 'exact', head: true });

      console.log(`   Write Model: ${writeCountBefore} → ${writeCountAfter} (+${(writeCountAfter || 0) - (writeCountBefore || 0)})`);
      console.log(`   Read Model: ${readCountBefore} → ${readCountAfter} (+${(readCountAfter || 0) - (readCountBefore || 0)})`);

      // Cleanup test appointment
      console.log('\n Step 6: Cleaning up test appointment...');
      await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      await supabase
        .from('appointment_read_model')
        .delete()
        .eq('appointment_id', appointmentId);

      console.log(`    Test appointment cleaned up`);

      // Summary
      console.log('\n' + '='.repeat(70));
      if (readModelRecord) {
        console.log(' TEST PASSED - Read model sync is working!');
      } else {
        console.log(' TEST FAILED - Read model sync is NOT working');
      }
      console.log('='.repeat(70));

    } catch (apiError: any) {
      console.error(`    API Error:`, apiError.message);
      if (apiError.response) {
        console.error('   Response:', apiError.response.data);
      }
      console.log('\n Note: You can also test manually via database:');
      console.log('   1. Insert into appointments table');
      console.log('   2. Wait 5 seconds');
      console.log('   3. Check appointment_read_model table');
    }

  } catch (error) {
    console.error('\n TEST FAILED:', error);
    process.exit(1);
  }
}

// Run test
testReadModelSync()
  .then(() => {
    console.log('\n Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n Test script failed:', error);
    process.exit(1);
  });

