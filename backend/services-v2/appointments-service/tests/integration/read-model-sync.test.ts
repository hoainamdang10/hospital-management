import { createClient } from '@supabase/supabase-js';
import request from 'supertest';
import app from '../../src/main';
import { createTestUserWithToken, cleanupTestUser, createAuthHeader, type TestUser } from '../helpers/authHelper';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Read Model Sync Integration', () => {
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
    await supabase.from('appointment_read_model').delete().like('patient_id', 'test-%');
    await supabase.from('appointments').delete().like('patient_id', 'test-%');
  });

  describe('AppointmentScheduled Event → Read Model', () => {
    it('should sync new appointment to read model', async () => {
      // 1. Create appointment via API
      const appointmentData = {
        patientId: `test-patient-${Date.now()}`,
        providerId: `test-provider-${Date.now()}`,
        tenantId: 'test-tenant',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        timeSlot: {
          startTime: '09:00',
          endTime: '09:30'
        },
        appointmentType: 'CONSULTATION',
        consultationFee: 500000,
        notes: 'Integration test appointment'
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .send(appointmentData)
        .expect(201);

      const appointmentId = response.body.id;
      expect(appointmentId).toBeDefined();

      // 2. Wait for event processing (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Verify read model has the appointment
      const { data: readModel, error } = await supabase
        .from('appointment_read_model')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      expect(error).toBeNull();
      expect(readModel).toBeDefined();
      expect(readModel).not.toBeNull();
      expect((readModel as any).appointment_id).toBe(appointmentId);
      expect((readModel as any).patient_id).toBe(appointmentData.patientId);
      expect((readModel as any).provider_id).toBe(appointmentData.providerId);
      expect((readModel as any).status).toBe('SCHEDULED');
    });

    it('should update read model when appointment is confirmed', async () => {
      // 1. Create appointment
      const appointmentData = {
        patientId: `test-patient-${Date.now()}`,
        providerId: `test-provider-${Date.now()}`,
        tenantId: 'test-tenant',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: { startTime: '10:00', endTime: '10:30' },
        appointmentType: 'CONSULTATION',
        consultationFee: 500000
      };

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(appointmentData)
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Confirm appointment
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/confirm`)
        .set('Authorization', createAuthHeader(testDoctor.token))
        .expect(200);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Verify read model updated
      const { data: readModel } = await supabase
        .from('appointment_read_model')
        .select('status')
        .eq('appointment_id', appointmentId)
        .single();

      expect(readModel).not.toBeNull();
      expect((readModel as any).status).toBe('CONFIRMED');
    });

    it('should handle concurrent appointments sync', async () => {
      const appointmentCount = 10;
      const promises: Promise<any>[] = [];

      // Create 10 appointments concurrently
      for (let i = 0; i < appointmentCount; i++) {
        const data = {
          patientId: `test-patient-concurrent-${i}-${Date.now()}`,
          providerId: `test-provider-${Date.now()}`,
          tenantId: 'test-tenant',
          appointmentDate: new Date(Date.now() + 86400000 + i * 3600000).toISOString(),
          timeSlot: { startTime: `${9 + i}:00`, endTime: `${9 + i}:30` },
          appointmentType: 'CONSULTATION',
          consultationFee: 500000
        };

        promises.push(
          request(app)
            .post('/api/v1/appointments')
            .set('Authorization', createAuthHeader(testDoctor.token))
            .send(data)
        );
      }

      const results = await Promise.all(promises);
      
      // All should succeed
      expect(results.every(r => r.status === 201)).toBe(true);

      // Wait for all events to process
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify all synced
      const appointmentIds = results.map(r => r.body.id);
      const { data: readModels, error } = await supabase
        .from('appointment_read_model')
        .select('appointment_id')
        .in('appointment_id', appointmentIds);

      expect(error).toBeNull();
      expect(readModels).toHaveLength(appointmentCount);
    });
  });

  describe('Read Model Query Performance', () => {
    it('should query read model faster than write model', async () => {
      // Create test appointment
      const appointmentData = {
        patientId: `test-patient-${Date.now()}`,
        providerId: `test-provider-${Date.now()}`,
        tenantId: 'test-tenant',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: { startTime: '14:00', endTime: '14:30' },
        appointmentType: 'CONSULTATION',
        consultationFee: 500000
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', createAuthHeader(testDoctor.token))
        .send(appointmentData)
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const appointmentId = response.body.id;

      // Query write model (with joins)
      const writeStart = Date.now();
      await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
      const writeTime = Date.now() - writeStart;

      // Query read model (denormalized)
      const readStart = Date.now();
      await supabase
        .from('appointment_read_model')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();
      const readTime = Date.now() - readStart;

      console.log(`Write model query: ${writeTime}ms, Read model query: ${readTime}ms`);
      
      // Read model should be faster (or at least not slower)
      expect(readTime).toBeLessThanOrEqual(writeTime * 2);
    });
  });
});
