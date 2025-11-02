import request from 'supertest';
import app from '../../src/main';
import { createClient } from '@supabase/supabase-js';
import { createTestUserWithToken, cleanupTestUser, createAuthHeader } from '../helpers/authHelper';
import { sleep, generateFutureDatetime } from '../helpers/integrationHelpers';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test department UUID (General Medicine)
const TEST_DEPARTMENT_ID = 'GEN'; // Department code (General Medicine) - now VARCHAR(50)

describe('Appointment Lifecycle E2E', () => {
  let supabase: ReturnType<typeof createClient>;
  let doctorToken: string;
  let patientToken: string;
  let doctorUserId: string;
  let patientUserId: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Create test users with valid tokens
    const doctor = await createTestUserWithToken('DOCTOR', { fullName: 'Dr. Test' });
    const patient = await createTestUserWithToken('PATIENT', { fullName: 'Test Patient' });

    doctorToken = doctor.token;
    patientToken = patient.token;
    doctorUserId = doctor.userId;
    patientUserId = patient.userId;
  }, 60000);

  afterAll(async () => {
    // Cleanup test users
    await cleanupTestUser(doctorUserId);
    await cleanupTestUser(patientUserId);
  });

  afterEach(async () => {
    // Cleanup appointments
    await supabase.from('appointments').delete().like('patient_id', 'e2e-%');
  });

  describe('Complete Appointment Flow', () => {
    it('should complete full lifecycle: Schedule → Confirm → CheckIn → Start → Complete', async () => {
      const now = Date.now();
      const tomorrow = new Date(now + 86400000);
      const startTime = new Date(tomorrow.setHours(9, 0, 0, 0));
      const endTime = new Date(tomorrow.setHours(9, 30, 0, 0));

      // STEP 1: Schedule Appointment (patient can schedule their own)
      const scheduleResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(patientToken))
        .send({
          patient: {
            patientId: patientUserId, // Patient schedules for themselves (userId = patientId)
            fullName: 'E2E Test Patient',
            phone: '0901234567',
            dateOfBirth: new Date('1990-01-01'),
            nationalId: '001234567890',
            email: `e2e-patient-${now}@test.com`
          },
          provider: {
            providerId: doctorUserId,
            fullName: 'Dr. E2E Test',
            specialization: 'General Medicine',
            department: 'General'
          },
          appointment: {
            appointmentType: 'consultation',
            priority: 'normal',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            reason: 'E2E test appointment - regular checkup',
            notes: 'Full lifecycle test'
          },
          departmentCode: TEST_DEPARTMENT_ID
        })
        .expect(201);

      const appointmentId = scheduleResponse.body.id;
      expect(scheduleResponse.body.status).toBe('SCHEDULED');

      // STEP 2: Confirm Appointment (requires DOCTOR/NURSE/ADMIN)
      const confirmResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/confirm`)
        .set('Authorization', createAuthHeader(doctorToken))
        .send({})
        .expect(200);

      expect(confirmResponse.body.status).toBe('CONFIRMED');

      // STEP 3: Check-In (requires NURSE/RECEPTIONIST - use doctor for simplicity)
      const checkInResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/check-in`)
        .set('Authorization', createAuthHeader(doctorToken))
        .send({})
        .expect(200);

      expect(checkInResponse.body.status).toBe('CHECKED_IN');

      // STEP 4: Start Appointment (requires DOCTOR/NURSE)
      const startResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/start`)
        .set('Authorization', createAuthHeader(doctorToken))
        .send({})
        .expect(200);

      expect(startResponse.body.status).toBe('IN_PROGRESS');

      // STEP 5: Complete Appointment (requires DOCTOR/NURSE)
      const completeResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/complete`)
        .set('Authorization', createAuthHeader(doctorToken))
        .send({
          diagnosis: 'E2E Test Diagnosis',
          treatment: 'E2E Test Treatment'
        })
        .expect(200);

      expect(completeResponse.body.status).toBe('COMPLETED');

      // STEP 6: Verify final state in DB
      const { data: appointment } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', appointmentId)
        .single() as { data: { status: string } | null };

      expect(appointment).not.toBeNull();
      expect(appointment!.status).toBe('COMPLETED');
    }, 90000); // Longer timeout for multi-step flow

    it('should handle cancellation flow', async () => {
      const now = Date.now();
      const tomorrow = new Date(now + 86400000);
      const startTime = new Date(tomorrow.setHours(10, 0, 0, 0));
      const endTime = new Date(tomorrow.setHours(10, 30, 0, 0));

      // Schedule
      const scheduleResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(patientToken))
        .send({
          patient: {
            patientId: patientUserId, // Patient schedules for themselves
            fullName: 'E2E Cancel Patient',
            phone: '0901234568',
            dateOfBirth: new Date('1992-05-15'),
            nationalId: '001234567891',
            email: `e2e-cancel-${now}@test.com`
          },
          provider: {
            providerId: doctorUserId,
            fullName: 'Dr. E2E Test',
            specialization: 'General Medicine',
            department: 'General'
          },
          appointment: {
            appointmentType: 'consultation',
            priority: 'normal',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            reason: 'E2E cancellation test',
            notes: 'Testing cancellation flow'
          },
          departmentCode: TEST_DEPARTMENT_ID
        })
        .expect(201);

      const appointmentId = scheduleResponse.body.id;

      // Cancel (patient can cancel their own appointment)
      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .set('Authorization', createAuthHeader(patientToken))
        .send({
          reason: 'Patient requested cancellation',
          cancelledBy: 'PATIENT'
        })
        .expect(200);

      expect(cancelResponse.body.status).toBe('CANCELLED');

      // Verify cannot perform actions on cancelled appointment
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/confirm`)
        .set('Authorization', createAuthHeader(doctorToken))
        .send({})
        .expect(400); // Should fail
    }, 60000);

    it('should handle reschedule flow', async () => {
      const now = Date.now();
      const tomorrow = new Date(now + 86400000);
      const startTime = new Date(tomorrow.setHours(11, 0, 0, 0));
      const endTime = new Date(tomorrow.setHours(11, 30, 0, 0));

      // Schedule
      const scheduleResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(patientToken))
        .send({
          patient: {
            patientId: patientUserId, // Patient schedules for themselves
            fullName: 'E2E Reschedule Patient',
            phone: '0901234569',
            dateOfBirth: new Date('1988-03-20'),
            nationalId: '001234567892',
            email: `e2e-reschedule-${now}@test.com`
          },
          provider: {
            providerId: doctorUserId,
            fullName: 'Dr. E2E Test',
            specialization: 'General Medicine',
            department: 'General'
          },
          appointment: {
            appointmentType: 'consultation',
            priority: 'normal',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            reason: 'E2E reschedule test',
            notes: 'Testing reschedule flow'
          },
          departmentCode: TEST_DEPARTMENT_ID
        })
        .expect(201);

      const appointmentId = scheduleResponse.body.id;

      // Reschedule to new date/time (patient or doctor can reschedule)
      const newDate = new Date(Date.now() + 2 * 86400000); // 2 days later
      const rescheduleResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/reschedule`)
        .set('Authorization', createAuthHeader(patientToken))
        .send({
          appointmentDate: newDate.toISOString(),
          timeSlot: { startTime: '14:00:00', endTime: '14:30:00' },
          reason: 'Patient requested different time'
        })
        .expect(200);

      expect(rescheduleResponse.body.status).toBe('RESCHEDULED');

      // Verify new time in DB
      const { data: appointment } = await supabase
        .from('appointments')
        .select('appointment_date, start_time')
        .eq('id', appointmentId)
        .single() as { data: { appointment_date: string; start_time: string } | null };

      expect(appointment).not.toBeNull();
      expect(new Date(appointment!.appointment_date).toDateString())
        .toBe(newDate.toDateString());
      expect(appointment!.start_time).toBe('14:00:00');
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should reject invalid appointment dates', async () => {
      const now = Date.now();
      const pastDate = new Date(now - 86400000); // Yesterday
      const startTime = new Date(pastDate.setHours(9, 0, 0, 0));
      const endTime = new Date(pastDate.setHours(9, 30, 0, 0));

      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(patientToken))
        .send({
          patient: {
            patientId: patientUserId,
            fullName: 'Error Test Patient',
            phone: '0901234570',
            dateOfBirth: new Date('1985-06-10'),
            nationalId: '001234567893',
            email: `e2e-error-past-${now}@test.com`
          },
          provider: {
            providerId: doctorUserId,
            fullName: 'Dr. E2E Test',
            department: 'General'
          },
          appointment: {
            appointmentType: 'consultation',
            priority: 'normal',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            reason: 'Testing past date validation'
          },
          departmentCode: TEST_DEPARTMENT_ID
        })
        .expect(400);
    }, 30000);

    it('should reject invalid time slots', async () => {
      const now = Date.now();
      const tomorrow = new Date(now + 86400000);
      const startTime = new Date(tomorrow.setHours(9, 30, 0, 0));
      const endTime = new Date(tomorrow.setHours(9, 0, 0, 0)); // End before start!

      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(patientToken))
        .send({
          patient: {
            patientId: patientUserId,
            fullName: 'Error Slot Patient',
            phone: '0901234571',
            dateOfBirth: new Date('1987-08-25'),
            nationalId: '001234567894',
            email: `e2e-error-slot-${now}@test.com`
          },
          provider: {
            providerId: doctorUserId,
            fullName: 'Dr. E2E Test',
            department: 'General'
          },
          appointment: {
            appointmentType: 'consultation',
            priority: 'normal',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            reason: 'Testing invalid time slot'
          },
          departmentCode: TEST_DEPARTMENT_ID
        })
        .expect(400);
    }, 30000);

    it('should reject missing required fields', async () => {
      const now = Date.now();
      const tomorrow = new Date(now + 86400000);
      const startTime = new Date(tomorrow.setHours(9, 0, 0, 0));
      const endTime = new Date(tomorrow.setHours(9, 30, 0, 0));

      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(patientToken))
        .send({
          patient: {
            patientId: patientUserId,
            fullName: 'Missing Field Patient',
            phone: '0901234572',
            dateOfBirth: new Date('1991-12-05'),
            nationalId: '001234567895',
            email: `e2e-error-missing-${now}@test.com`
          },
          // Missing provider object entirely
          appointment: {
            appointmentType: 'consultation',
            priority: 'normal',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            reason: 'Testing missing provider'
          },
          departmentCode: TEST_DEPARTMENT_ID
        })
        .expect(400);
    }, 30000);
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent bookings for same provider', async () => {
      const now = Date.now();
      const tomorrow = new Date(now + 86400000);
      const startTime = new Date(tomorrow.setHours(15, 0, 0, 0));
      const endTime = new Date(tomorrow.setHours(15, 30, 0, 0));

      // Try to book 3 appointments at same time for same provider
      const promises = [1, 2, 3].map(i =>
        request(app)
          .post('/api/v1/appointments')
          .set('Authorization', createAuthHeader(patientToken))
          .send({
            patient: {
              patientId: patientUserId, // Patient schedules for themselves
              fullName: `Concurrent Patient ${i}`,
              phone: `090123457${i}`,
              dateOfBirth: new Date('1993-04-10'),
              nationalId: `00123456789${i}`,
              email: `e2e-concurrent-${i}-${now}@test.com`
            },
            provider: {
              providerId: doctorUserId,
              fullName: 'Dr. E2E Test',
              department: 'General'
            },
            appointment: {
              appointmentType: 'consultation',
              priority: 'normal',
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              reason: 'Testing concurrent bookings'
            },
            departmentCode: TEST_DEPARTMENT_ID
          })
      );

      const results = await Promise.all(promises);

      // Only 1 should succeed (first one), others should fail due to conflict
      const successCount = results.filter(r => r.status === 201).length;
      const conflictCount = results.filter(r => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);
    }, 60000);
  });
});
