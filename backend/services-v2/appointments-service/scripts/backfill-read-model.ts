/**
 * Backfill Script - Sync Write Model → Read Model
 * Migrates 1,792 appointments from write model to CQRS read model
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @usage: ts-node scripts/backfill-read-model.ts
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BATCH_SIZE = 100;

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: string;
  priority: string;
  status: string;
  room_id?: string;
  department_id?: string;
  consultation_fee: number;
  reason?: string;
  chief_complaint?: string;
  symptoms?: string[];
  notes?: string;
  special_instructions?: string;
  required_equipment?: string[];
  created_at: string;
  updated_at: string;
}

interface PatientData {
  patient_full_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_date_of_birth?: string;
  patient_gender?: string;
  patient_national_id?: string;
  patient_insurance_number?: string;
  patient_insurance_type?: string;
  patient_address?: string;
}

interface DoctorData {
  doctor_full_name: string;
  doctor_specialization?: string;
  doctor_department?: string;
  doctor_license_number?: string;
  doctor_phone?: string;
  doctor_email?: string;
}

async function backfillReadModel() {
  console.log('='.repeat(70));
  console.log('🔄 BACKFILL READ MODEL - Sync Write Model → Read Model');
  console.log('='.repeat(70));

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'appointments_schema' }
  });

  try {
    // Step 1: Check current state
    console.log('\n📊 Step 1: Checking current state...');
    
    const { count: writeCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    const { count: readCount } = await supabase
      .from('appointment_read_model')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Write Model (appointments): ${writeCount} records`);
    console.log(`   Read Model (appointment_read_model): ${readCount} records`);
    console.log(`   Gap: ${(writeCount || 0) - (readCount || 0)} records need sync`);

    if (!writeCount || writeCount === 0) {
      console.log('\n✅ No appointments to sync');
      return;
    }

    // Step 2: Fetch all appointments in batches
    console.log(`\n📥 Step 2: Fetching ${writeCount} appointments...`);
    let offset = 0;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    while (offset < (writeCount || 0)) {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error(`   ❌ Failed to fetch batch at offset ${offset}:`, error.message);
        break;
      }

      if (!appointments || appointments.length === 0) {
        break;
      }

      console.log(`   Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${appointments.length} records`);

      // Step 3: For each appointment, fetch patient and doctor data
      for (const apt of appointments as Appointment[]) {
        try {
          // Fetch patient data
          let patientData: PatientData | null = null;
          const { data: patient } = await supabase
            .from('patient_read_model')
            .select('*')
            .eq('patient_id', apt.patient_id)
            .single();

          if (patient) {
            patientData = {
              patient_full_name: patient.full_name || 'Unknown',
              patient_phone: patient.phone,
              patient_email: patient.email,
              patient_date_of_birth: patient.date_of_birth,
              patient_gender: patient.gender,
              patient_national_id: patient.national_id,
              patient_insurance_number: patient.insurance_number,
              patient_insurance_type: patient.insurance_type,
              patient_address: patient.address
            };
          }

          // Fetch doctor data
          let doctorData: DoctorData | null = null;
          const { data: doctor } = await supabase
            .from('provider_read_model')
            .select('*')
            .eq('provider_id', apt.doctor_id)
            .single();

          if (doctor) {
            doctorData = {
              doctor_full_name: doctor.full_name || 'Unknown',
              doctor_specialization: doctor.specialization,
              doctor_department: doctor.department,
              doctor_license_number: doctor.license_number,
              doctor_phone: doctor.phone,
              doctor_email: doctor.email
            };
          }

          // Insert into read model
          const { error: insertError } = await supabase
            .from('appointment_read_model')
            .upsert({
              appointment_id: apt.id,
              patient_id: apt.patient_id,
              doctor_id: apt.doctor_id,
              appointment_date: apt.appointment_date,
              appointment_time: apt.appointment_time,
              duration_minutes: apt.duration_minutes,
              type: apt.type,
              priority: apt.priority,
              status: apt.status,
              room_id: apt.room_id,
              department_id: apt.department_id,
              consultation_fee: apt.consultation_fee,
              reason: apt.reason,
              chief_complaint: apt.chief_complaint,
              symptoms: apt.symptoms,
              notes: apt.notes,
              special_instructions: apt.special_instructions,
              required_equipment: apt.required_equipment,
              ...patientData,
              ...doctorData,
              synced_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`   ❌ Failed to sync appointment ${apt.id}:`, insertError.message);
            totalFailed++;
          } else {
            totalSuccess++;
          }

          totalProcessed++;

          // Progress indicator
          if (totalProcessed % 10 === 0) {
            process.stdout.write(`\r   Progress: ${totalProcessed}/${writeCount} (${Math.round(totalProcessed / (writeCount || 1) * 100)}%)`);
          }
        } catch (err) {
          console.error(`   ❌ Error processing appointment ${apt.id}:`, err);
          totalFailed++;
        }
      }

      offset += BATCH_SIZE;
    }

    console.log('\n');
    console.log('='.repeat(70));
    console.log('✅ BACKFILL COMPLETED');
    console.log('='.repeat(70));
    console.log(`   Total Processed: ${totalProcessed}`);
    console.log(`   Success: ${totalSuccess}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ BACKFILL FAILED:', error);
    process.exit(1);
  }
}

// Run backfill
backfillReadModel()
  .then(() => {
    console.log('\n✅ Backfill script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill script failed:', error);
    process.exit(1);
  });
