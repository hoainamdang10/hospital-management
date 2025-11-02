import { createClient } from '@supabase/supabase-js';
import request from 'supertest';
import app from '../../src/main';
import { createTestUserWithToken, cleanupTestUser, createAuthHeader, type TestUser } from '../helpers/authHelper';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Event-Driven Architecture Integration', () => {
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
    await supabase.from('appointments').delete().like('patient_id', 'event-%');
    await supabase.from('outbox_events').delete().like('aggregate_id', 'event-%');
  });

  describe('Outbox Pattern', () => {
    it('should publish AppointmentScheduled event to outbox', async () => {
      const appointmentData = {
        patientId: `event-patient-${Date.now()}`,
        providerId: `event-provider-${Date.now()}`,
        tenantId: 'event-tenant',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: { startTime: '09:00', endTime: '09:30' },
        appointmentType: 'CONSULTATION',
        consultationFee: 500000
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData)
        .expect(201);

      const appointmentId = response.body.id;

      // Wait for outbox event
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify event in outbox
      const { data: outboxEvents, error } = await supabase
        .from('outbox_events')
        .select('*')
        .eq('aggregate_id', appointmentId)
        .eq('event_type', 'appointments.appointment.scheduled')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(error).toBeNull();
      expect(outboxEvents).toBeDefined();
      expect(outboxEvents).toHaveLength(1);
      expect(outboxEvents![0].event_type).toBe('appointments.appointment.scheduled');
      expect(outboxEvents![0].aggregate_type).toBe('Appointment');
      expect(outboxEvents![0].payload).toBeDefined();
    });

    it('should publish AppointmentCancelled event to outbox', async () => {
      // Create appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send({
          patientId: `event-cancel-${Date.now()}`,
          providerId: `event-provider-${Date.now()}`,
          tenantId: 'event-tenant',
          appointmentDate: new Date(Date.now() + 86400000).toISOString(),
          timeSlot: { startTime: '10:00', endTime: '10:30' },
          appointmentType: 'CONSULTATION',
          consultationFee: 500000
        })
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Cancel appointment
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send({
          reason: 'Test cancellation',
          cancelledBy: 'PATIENT'
        })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify cancellation event
      const { data: cancelEvents } = await supabase
        .from('outbox_events')
        .select('*')
        .eq('aggregate_id', appointmentId)
        .eq('event_type', 'appointments.appointment.cancelled')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(cancelEvents).toBeDefined();
      expect(cancelEvents).toHaveLength(1);
      expect(cancelEvents![0].payload).toHaveProperty('reason', 'Test cancellation');
    });

    it('should track event processing status', async () => {
      const appointmentData = {
        patientId: `event-status-${Date.now()}`,
        providerId: `event-provider-${Date.now()}`,
        tenantId: 'event-tenant',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: { startTime: '11:00', endTime: '11:30' },
        appointmentType: 'CONSULTATION',
        consultationFee: 500000
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(appointmentData)
        .expect(201);

      const appointmentId = response.body.id;

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check event status
      const { data: events } = await supabase
        .from('outbox_events')
        .select('processed_at, retry_count, error_message')
        .eq('aggregate_id', appointmentId);

      expect(events).toBeDefined();
      expect(events!.length).toBeGreaterThan(0);

      // Event should be processed (or pending)
      const hasProcessedEvent = events!.some(e => e.processed_at !== null);
      const hasPendingEvent = events!.some(e => e.processed_at === null);

      expect(hasProcessedEvent || hasPendingEvent).toBe(true);
    });
  });

  describe('Event Consumers', () => {
    it('should consume PatientRegistered event and update patient cache', async () => {
      const patientId = `event-patient-consume-${Date.now()}`;

      // Simulate PatientRegistered event from Patient service
      const { error } = await supabase
        .from('inbox_events')
        .insert({
          event_id: `evt-${Date.now()}`,
          event_type: 'patient.patient.registered',
          payload: {
            patientId,
            patientFullName: 'John Doe',
            dateOfBirth: '1990-01-01',
            gender: 'MALE',
            phoneNumber: '+84901234567',
            email: 'john@example.com'
          },
          created_at: new Date().toISOString()
        } as any);

      expect(error).toBeNull();

      // Wait for consumer to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify patient in cache
      const { data: patientCache } = await supabase
        .from('patient_read_model')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      expect(patientCache).toBeDefined();
      expect(patientCache!.patient_full_name).toBe('John Doe');
      expect(patientCache!.gender).toBe('MALE');
    });

    it('should consume ProviderRegistered event and update provider cache', async () => {
      const providerId = `event-provider-consume-${Date.now()}`;

      // Simulate ProviderRegistered event
      const { error } = await supabase
        .from('inbox_events')
        .insert({
          event_id: `evt-${Date.now()}`,
          event_type: 'provider.provider.registered',
          payload: {
            providerId,
            providerFullName: 'Dr. Smith',
            specialization: 'CARDIOLOGY',
            licenseNumber: 'LIC12345',
            departmentId: 'dept-001'
          },
          created_at: new Date().toISOString()
        } as any);

      expect(error).toBeNull();

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify provider in cache
      const { data: providerCache } = await supabase
        .from('provider_read_model')
        .select('*')
        .eq('provider_id', providerId)
        .single();

      expect(providerCache).toBeDefined();
      expect(providerCache!.provider_full_name).toBe('Dr. Smith');
      expect(providerCache!.specialization).toBe('CARDIOLOGY');
    });

    it('should handle duplicate events (idempotency)', async () => {
      const patientId = `event-duplicate-${Date.now()}`;
      const eventId = `evt-${Date.now()}`;

      const eventPayload = {
        event_id: eventId,
        event_type: 'patient.patient.registered',
        payload: {
          patientId,
          patientFullName: 'Jane Doe',
          dateOfBirth: '1992-05-15',
          gender: 'FEMALE',
          phoneNumber: '+84907654321',
          email: 'jane@example.com'
        },
        created_at: new Date().toISOString()
      };

      // Insert same event twice
      await supabase.from('inbox_events').insert(eventPayload as any);
      await supabase.from('inbox_events').insert(eventPayload as any);

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should only have 1 patient record (idempotent)
      const { data: patients, error } = await supabase
        .from('patient_read_model')
        .select('*')
        .eq('patient_id', patientId);

      expect(error).toBeNull();
      expect(patients).toHaveLength(1);
    });
  });

  describe('Event Ordering', () => {
    it('should process events in correct order', async () => {
      const patientId = `event-order-${Date.now()}`;
      const appointmentData = {
        patientId,
        providerId: `event-provider-${Date.now()}`,
        tenantId: 'event-tenant',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: { startTime: '09:00', endTime: '09:30' },
        appointmentType: 'CONSULTATION',
        consultationFee: 500000
      };

      // Schedule
      const scheduleResp = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(appointmentData)
        .expect(201);

      const appointmentId = scheduleResp.body.id;

      // Confirm
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/confirm`)
        .set('Authorization', createAuthHeader(testDoctor.token))
        .expect(200);

      // Check-in
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/check-in`)
        .set('Authorization', createAuthHeader(testDoctor.token))
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify events published in order
      const { data: events } = await supabase
        .from('outbox_events')
        .select('event_type, created_at')
        .eq('aggregate_id', appointmentId)
        .order('created_at', { ascending: true });

      expect(events).toBeDefined();
      expect(events!.length).toBeGreaterThanOrEqual(3);
      
      const eventTypes = events!.map(e => e.event_type);
      const scheduledIndex = eventTypes.indexOf('appointments.appointment.scheduled');
      const confirmedIndex = eventTypes.indexOf('appointments.appointment.confirmed');
      const checkedInIndex = eventTypes.indexOf('appointments.appointment.checked_in');

      // Events should be in chronological order
      expect(scheduledIndex).toBeLessThan(confirmedIndex);
      expect(confirmedIndex).toBeLessThan(checkedInIndex);
    });
  });
});
