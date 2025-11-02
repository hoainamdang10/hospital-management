/**
 * Debug Repository Integration
 * Test save and retrieve to identify reconstitution issues
 */

require('dotenv').config();
const { SupabaseAppointmentRepository } = require('../dist/appointments-service/src/infrastructure/persistence/SupabaseAppointmentRepository');
const { Appointment, AppointmentType, AppointmentPriority } = require('../dist/appointments-service/src/domain/aggregates/Appointment.aggregate');
const { AppointmentId } = require('../dist/appointments-service/src/domain/value-objects/AppointmentId.vo');
const { TenantId } = require('../dist/appointments-service/src/domain/value-objects/TenantId.vo');
const { TimeSlot } = require('../dist/appointments-service/src/domain/value-objects/TimeSlot.vo');
const { AppointmentDetails } = require('../dist/appointments-service/src/domain/value-objects/AppointmentDetails.vo');

async function debugRepository() {
  console.log('🔍 Debug Repository Integration\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const repository = new SupabaseAppointmentRepository(supabaseUrl, supabaseKey);

  try {
    // Create test appointment
    console.log('1️⃣ Creating test appointment...');
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split('T')[0];
    const timeStr = '10:00:00';
    
    const timeSlot = TimeSlot.create(dateStr, timeStr);
    const details = AppointmentDetails.create('Debug test');
    
    const appointment = Appointment.create(
      appointmentId,
      tenantId,
      'PAT-110228-001', // Valid format: PAT-[6digits]-[3digits]
      'CARD-DOC-110228-001', // Valid format: [DEPT]-DOC-[6digits]-[3digits]
      timeSlot,
      30,
      AppointmentType.CONSULTATION,
      AppointmentPriority.NORMAL,
      details,
      100000,
      'debug-user'
    );

    console.log('✅ Appointment created:', {
      id: appointment.id,
      appointmentId: appointment.getAppointmentId().value,
      patientId: appointment.getPatientId(),
      doctorId: appointment.getDoctorId()
    });

    // Save to database
    console.log('\n2️⃣ Saving to database...');
    await repository.save(appointment);
    console.log('✅ Saved successfully');

    // Find by ID
    console.log('\n3️⃣ Finding by UUID...');
    const foundById = await repository.findByIdString(appointment.id);
    
    if (!foundById) {
      console.error('❌ findByIdString returned null');
    } else {
      console.log('✅ Found by UUID:', {
        id: foundById.id,
        hasGetAppointmentId: typeof foundById.getAppointmentId === 'function',
        appointmentId: foundById.getAppointmentId ? foundById.getAppointmentId().value : 'NO METHOD',
        hasGetStatus: typeof foundById.getStatus === 'function',
        status: foundById.getStatus ? foundById.getStatus() : 'NO METHOD'
      });
    }

    // Find by appointment_id
    console.log('\n4️⃣ Finding by appointment_id...');
    const foundByAppointmentId = await repository.findByAppointmentId(appointmentId.value);
    
    if (!foundByAppointmentId) {
      console.error('❌ findByAppointmentId returned null');
    } else {
      console.log('✅ Found by appointment_id:', {
        id: foundByAppointmentId.id,
        appointmentId: foundByAppointmentId.getAppointmentId ? foundByAppointmentId.getAppointmentId().value : 'NO METHOD',
        status: foundByAppointmentId.getStatus ? foundByAppointmentId.getStatus() : 'NO METHOD'
      });
    }

    // Cleanup
    console.log('\n5️⃣ Cleaning up...');
    await repository.delete(appointmentId);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugRepository()
  .then(() => {
    console.log('\n✨ Debug complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal:', error);
    process.exit(1);
  });
