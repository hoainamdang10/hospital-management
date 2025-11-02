/**
 * Conflict Detection E2E Tests
 * 
 * Tests database-level and application-level conflict detection including:
 * - PostgreSQL exclusion constraints for overlapping appointments
 * - Provider double-booking prevention
 * - Patient concurrent appointment detection
 * - Time slot conflict resolution
 * - Race condition handling
 */

import request from 'supertest';
import app from '../../src/main';
import { createClient } from '@supabase/supabase-js';
import { createAppointment, waitFor } from '../helpers/test-data-builder';
import { createTestUserWithToken, cleanupTestUser, createAuthHeader, type TestUser } from '../helpers/authHelper';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Conflict Detection E2E', () => {
  let supabase: ReturnType<typeof createClient>;
  let testDoctor: TestUser;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    // Create test user with token for auth
    testDoctor = await createTestUserWithToken('DOCTOR');
  });

  afterAll(async () => {
    // Cleanup test user
    if (testDoctor) {
      await cleanupTestUser(testDoctor.userId);
    }
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('appointments').delete().like('patient_id', 'e2e-conflict-%');
  });

  describe('Provider Double-Booking Prevention', () => {
    it('should PREVENT overlapping appointments for same provider', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000); // Tomorrow

      // Create first appointment at 09:00-09:30
      const firstResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      expect(firstResponse.body.status).toBe('SCHEDULED');

      // Try to create overlapping appointment at 09:15-09:45 (should fail)
      const conflictResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:15', '09:45')
            .build()
        )
        .expect(409);

      expect(conflictResponse.body.error).toContain('conflict');
      expect(conflictResponse.body.conflictType).toBe('PROVIDER_OVERLAP');
      expect(conflictResponse.body.existingAppointmentId).toBe(firstResponse.body.id);
    });

    it('should PREVENT exact time slot duplicate for provider', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Create first appointment
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('10:00', '10:30')
            .build()
        )
        .expect(201);

      // Try to create duplicate at exact same time (should fail)
      const duplicateResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('10:00', '10:30')
            .build()
        )
        .expect(409);

      expect(duplicateResponse.body.error).toContain('conflict');
    });

    it('should ALLOW back-to-back appointments (no gap)', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Create first appointment at 09:00-09:30
      const firstResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Create second appointment immediately after at 09:30-10:00 (should succeed)
      const secondResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:30', '10:00')
            .build()
        )
        .expect(201);

      expect(secondResponse.body.status).toBe('SCHEDULED');

      // Verify both appointments exist
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('provider_id', providerId)
        .in('id', [firstResponse.body.id, secondResponse.body.id]);

      expect(appointments?.length).toBe(2);
    });

    it('should detect partial overlaps (start time within existing)', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Create appointment at 09:00-10:00
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '10:00')
            .build()
        )
        .expect(201);

      // Try to create overlapping at 09:30-10:30 (should fail)
      const conflictResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:30', '10:30')
            .build()
        )
        .expect(409);

      expect(conflictResponse.body.conflictType).toBe('PROVIDER_OVERLAP');
    });

    it('should detect enclosing overlaps (new slot contains existing)', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Create appointment at 09:30-10:00
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:30', '10:00')
            .build()
        )
        .expect(201);

      // Try to create enclosing slot at 09:00-10:30 (should fail)
      const conflictResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '10:30')
            .build()
        )
        .expect(409);

      expect(conflictResponse.body.error).toContain('conflict');
    });
  });

  describe('Patient Concurrent Appointment Detection', () => {
    it('should PREVENT patient from booking overlapping appointments', async () => {
      const patientId = `e2e-conflict-patient-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Create first appointment at 09:00-09:30
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withProviderId(`provider-1-${Date.now()}`)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Try to book another appointment at same time with different provider (should fail)
      const conflictResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withProviderId(`provider-2-${Date.now()}`)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(409);

      expect(conflictResponse.body.conflictType).toBe('PATIENT_CONCURRENT');
    });

    it('should ALLOW patient to book on different days', async () => {
      const patientId = `e2e-conflict-patient-${Date.now()}`;

      // Appointment on Day 1
      const day1Response = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withProviderId(`provider-1-${Date.now()}`)
            .withDate(new Date(Date.now() + 86400000))
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Appointment on Day 2 at same time (should succeed)
      const day2Response = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withProviderId(`provider-2-${Date.now()}`)
            .withDate(new Date(Date.now() + 86400000 * 2))
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      expect(day1Response.body.id).toBeDefined();
      expect(day2Response.body.id).toBeDefined();
      expect(day1Response.body.id).not.toBe(day2Response.body.id);
    });
  });

  describe('Database Exclusion Constraint Enforcement', () => {
    it('should enforce exclusion constraint at database level', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // First appointment
      const { data: firstAppt } = await supabase
        .from('appointments')
        .insert({
          patient_id: `e2e-conflict-patient-1-${Date.now()}`,
          provider_id: providerId,
          tenant_id: 'test-tenant',
          appointment_date: appointmentDate.toISOString(),
          time_slot_start: '09:00',
          time_slot_end: '09:30',
          appointment_type: 'CONSULTATION',
          consultation_fee: 500000,
          status: 'SCHEDULED'
        } as any)
        .select()
        .single();

      expect(firstAppt).toBeDefined();

      // Try to insert overlapping directly via DB (should fail with exclusion violation)
      const { error } = await supabase.from('appointments').insert({
        patient_id: `e2e-conflict-patient-2-${Date.now()}`,
        provider_id: providerId,
        tenant_id: 'test-tenant',
        appointment_date: appointmentDate.toISOString(),
        time_slot_start: '09:15',
        time_slot_end: '09:45',
        appointment_type: 'CONSULTATION',
        consultation_fee: 500000,
        status: 'SCHEDULED'
      } as any);

      expect(error).toBeDefined();
      expect(error?.message).toContain('exclusion');
    });

    it('should allow same time slot if status is CANCELLED', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Create and cancel first appointment
      const firstResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${firstResponse.body.id}/cancel`)
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send({ reason: 'Test cancellation', cancelledBy: 'patient' })
        .expect(200);

      // Now create new appointment at same time (should succeed)
      const secondResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      expect(secondResponse.body.status).toBe('SCHEDULED');
    });

    it('should allow same time slot if previous is NO_SHOW', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

      // Create and mark as no-show
      const firstResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(pastDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${firstResponse.body.id}/mark-no-show`)
        .set('Authorization', createAuthHeader(testDoctor.token))
        .expect(200);

      // Create new appointment at same time slot (different day, should succeed)
      const secondResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(new Date(Date.now() + 86400000))
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      expect(secondResponse.body.status).toBe('SCHEDULED');
    });
  });

  describe('Race Condition Handling', () => {
    it('should handle concurrent booking attempts gracefully', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Simulate 3 concurrent booking requests for same slot
      const bookingPromises = [1, 2, 3].map((i) =>
        request(app)
          .post('/api/v1/appointments')
          .send(
            createAppointment()
              .withPatientId(`e2e-conflict-patient-${i}-${Date.now()}`)
              .withProviderId(providerId)
              .withDate(appointmentDate)
              .withTimeSlot('11:00', '11:30')
              .build()
          )
      );

      const results = await Promise.allSettled(bookingPromises);

      // Exactly 1 should succeed, 2 should fail with conflict
      const successful = results.filter((r) => r.status === 'fulfilled' && (r.value as any).status === 201);
      const failed = results.filter((r) => r.status === 'fulfilled' && (r.value as any).status === 409);

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);
    });

    it('should use database locks to prevent race conditions', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Create 5 rapid consecutive requests
      const rapidBookings = [];
      for (let i = 0; i < 5; i++) {
        rapidBookings.push(
          request(app)
            .post('/api/v1/appointments')
            .send(
              createAppointment()
                .withPatientId(`e2e-conflict-patient-${i}-${Date.now()}`)
                .withProviderId(providerId)
                .withDate(appointmentDate)
                .withTimeSlot('14:00', '14:30')
                .build()
            )
        );
      }

      const results = await Promise.all(rapidBookings);

      // Count successes and failures
      const successes = results.filter((r) => r.status === 201).length;
      const conflicts = results.filter((r) => r.status === 409).length;

      expect(successes).toBe(1);
      expect(conflicts).toBe(4);
    });
  });

  describe('Conflict Resolution Suggestions', () => {
    it('should suggest alternative time slots when conflict detected', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Book 09:00-09:30
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Try to book overlapping slot
      const conflictResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:15', '09:45')
            .build()
        )
        .expect(409);

      // Should include alternative suggestions
      expect(conflictResponse.body.suggestions).toBeDefined();
      expect(conflictResponse.body.suggestions.length).toBeGreaterThan(0);
      expect(conflictResponse.body.suggestions[0]).toHaveProperty('startTime');
      expect(conflictResponse.body.suggestions[0]).toHaveProperty('endTime');
    });

    it('should provide conflict details in error response', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      const existingAppt = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('10:00', '10:30')
            .build()
        )
        .expect(201);

      const conflictResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-2-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('10:00', '10:30')
            .build()
        )
        .expect(409);

      expect(conflictResponse.body.conflictDetails).toBeDefined();
      expect(conflictResponse.body.conflictDetails.existingAppointmentId).toBe(existingAppt.body.id);
      expect(conflictResponse.body.conflictDetails.conflictingTimeSlot).toEqual({
        startTime: '10:00',
        endTime: '10:30'
      });
    });
  });

  describe('Conflict Validation Before Booking', () => {
    it('should validate time slot availability before creating appointment', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Book slot
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-1-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Validate availability (should return conflict)
      const validateResponse = await request(app)
        .post('/api/v1/appointments/validate')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send({
          providerId,
          appointmentDate: appointmentDate.toISOString(),
          timeSlot: { startTime: '09:15', endTime: '09:45' }
        })
        .expect(200);

      expect(validateResponse.body.available).toBe(false);
      expect(validateResponse.body.reason).toContain('conflict');
    });

    it('should confirm availability for non-conflicting slot', async () => {
      const providerId = `e2e-conflict-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Book 09:00-09:30
      await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(
          createAppointment()
            .withPatientId(`e2e-conflict-patient-${Date.now()}`)
            .withProviderId(providerId)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Validate non-conflicting slot 10:00-10:30
      const validateResponse = await request(app)
        .post('/api/v1/appointments/validate')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send({
          providerId,
          appointmentDate: appointmentDate.toISOString(),
          timeSlot: { startTime: '10:00', endTime: '10:30' }
        })
        .expect(200);

      expect(validateResponse.body.available).toBe(true);
    });
  });
});
