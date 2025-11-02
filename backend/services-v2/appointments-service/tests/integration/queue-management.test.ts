import request from 'supertest';
import app from '../../src/main';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Queue Management Integration', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  });

  afterEach(async () => {
    // Cleanup test queues
    // Note: Using service_role_key with full schema access
    await supabase
      .from('appointments_schema.queues')
      .delete()
      .like('queue_id', 'queue-test-%');
  });

  describe('Join Queue', () => {
    it('should add patient to queue successfully', async () => {
      const queueData = {
        patientId: `queue-test-patient-${Date.now()}`,
        providerId: `queue-test-provider-${Date.now()}`,
        departmentId: 'dept-001',
        priority: 'NORMAL',
        reason: 'Regular checkup'
      };

      const response = await request(app)
        .post('/api/queue/join')
        .send(queueData)
        .expect(201);

      expect(response.body.queueId).toBeDefined();
      expect(response.body.position).toBe(1); // First in queue
      expect(response.body.status).toBe('WAITING');
    });

    it('should assign correct queue position for multiple patients', async () => {
      const providerId = `queue-test-provider-${Date.now()}`;

      // Add 3 patients to same provider queue
      const results = [];
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/queue/join')
          .send({
            patientId: `queue-test-patient-${i}-${Date.now()}`,
            providerId,
            departmentId: 'dept-001',
            priority: 'NORMAL',
            reason: 'Checkup'
          })
          .expect(201);

        results.push(response.body);
      }

      // Verify positions
      expect(results[0].position).toBe(1);
      expect(results[1].position).toBe(2);
      expect(results[2].position).toBe(3);
    });

    it('should prioritize URGENT patients over NORMAL', async () => {
      const providerId = `queue-test-provider-urgent-${Date.now()}`;

      // Add normal patient
      const normal = await request(app)
        .post('/api/queue/join')
        .send({
          patientId: `queue-normal-${Date.now()}`,
          providerId,
          departmentId: 'dept-001',
          priority: 'NORMAL',
          reason: 'Regular checkup'
        })
        .expect(201);

      // Add urgent patient (should jump queue)
      const urgent = await request(app)
        .post('/api/queue/join')
        .send({
          patientId: `queue-urgent-${Date.now()}`,
          providerId,
          departmentId: 'dept-001',
          priority: 'URGENT',
          reason: 'Emergency'
        })
        .expect(201);

      // Urgent should be ahead of normal
      expect(urgent.body.position).toBeLessThan(normal.body.position);
    });
  });

  describe('Queue Status', () => {
    it('should return current queue status for patient', async () => {
      const patientId = `queue-status-patient-${Date.now()}`;
      const providerId = `queue-status-provider-${Date.now()}`;

      // Join queue
      const joinResponse = await request(app)
        .post('/api/queue/join')
        .send({
          patientId,
          providerId,
          departmentId: 'dept-001',
          priority: 'NORMAL',
          reason: 'Checkup'
        })
        .expect(201);

      const queueId = joinResponse.body.queueId;

      // Get status
      const statusResponse = await request(app)
        .get(`/api/queue/${queueId}/status`)
        .expect(200);

      expect(statusResponse.body.position).toBe(1);
      expect(statusResponse.body.estimatedWaitTime).toBeDefined();
      expect(statusResponse.body.status).toBe('WAITING');
    });

    it('should show queue for provider', async () => {
      const providerId = `queue-provider-list-${Date.now()}`;

      // Add 3 patients
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/queue/join')
          .send({
            patientId: `queue-patient-${i}-${Date.now()}`,
            providerId,
            departmentId: 'dept-001',
            priority: 'NORMAL',
            reason: 'Checkup'
          });
      }

      // Get provider's queue
      const response = await request(app)
        .get(`/api/queue/provider/${providerId}`)
        .expect(200);

      expect(response.body.queue).toHaveLength(3);
      expect(response.body.totalWaiting).toBe(3);
    });
  });

  describe('Call Next Patient', () => {
    it('should call next patient in queue', async () => {
      const providerId = `queue-call-provider-${Date.now()}`;

      // Add 2 patients
      const patient1 = await request(app)
        .post('/api/queue/join')
        .send({
          patientId: `queue-call-patient-1-${Date.now()}`,
          providerId,
          departmentId: 'dept-001',
          priority: 'NORMAL',
          reason: 'Checkup'
        })
        .expect(201);

      await request(app)
        .post('/api/queue/join')
        .send({
          patientId: `queue-call-patient-2-${Date.now()}`,
          providerId,
          departmentId: 'dept-001',
          priority: 'NORMAL',
          reason: 'Checkup'
        })
        .expect(201);

      // Call next
      const callResponse = await request(app)
        .post(`/api/queue/call-next`)
        .send({ providerId })
        .expect(200);

      expect(callResponse.body.calledPatient).toBe(patient1.body.queueId);
      expect(callResponse.body.status).toBe('CALLED');
    });

    it('should update queue positions after calling patient', async () => {
      const providerId = `queue-update-provider-${Date.now()}`;

      // Add 3 patients
      const patients = [];
      for (let i = 0; i < 3; i++) {
        const resp = await request(app)
          .post('/api/queue/join')
          .send({
            patientId: `queue-update-patient-${i}-${Date.now()}`,
            providerId,
            departmentId: 'dept-001',
            priority: 'NORMAL',
            reason: 'Checkup'
          })
          .expect(201);
        patients.push(resp.body);
      }

      // Call first patient
      await request(app)
        .post(`/api/queue/call-next`)
        .send({ providerId })
        .expect(200);

      // Check remaining patients' positions
      const patient2Status = await request(app)
        .get(`/api/queue/${patients[1].queueId}/status`)
        .expect(200);

      const patient3Status = await request(app)
        .get(`/api/queue/${patients[2].queueId}/status`)
        .expect(200);

      // Positions should update
      expect(patient2Status.body.position).toBe(1);
      expect(patient3Status.body.position).toBe(2);
    });
  });

  describe('Leave Queue', () => {
    it('should remove patient from queue', async () => {
      const queueData = {
        patientId: `queue-leave-patient-${Date.now()}`,
        providerId: `queue-leave-provider-${Date.now()}`,
        departmentId: 'dept-001',
        priority: 'NORMAL',
        reason: 'Checkup'
      };

      // Join
      const joinResponse = await request(app)
        .post('/api/queue/join')
        .send(queueData)
        .expect(201);

      const queueId = joinResponse.body.queueId;

      // Leave
      await request(app)
        .post(`/api/queue/${queueId}/leave`)
        .expect(200);

      // Verify removed
      const statusResponse = await request(app)
        .get(`/api/queue/${queueId}/status`)
        .expect(404); // Should not be found
    });

    it('should update positions for remaining patients after leave', async () => {
      const providerId = `queue-leave-update-${Date.now()}`;

      // Add 3 patients
      const patients = [];
      for (let i = 0; i < 3; i++) {
        const resp = await request(app)
          .post('/api/queue/join')
          .send({
            patientId: `queue-leave-patient-${i}-${Date.now()}`,
            providerId,
            departmentId: 'dept-001',
            priority: 'NORMAL',
            reason: 'Checkup'
          })
          .expect(201);
        patients.push(resp.body);
      }

      // Patient 2 leaves
      await request(app)
        .post(`/api/v1/queue/${patients[1].queueId}/leave`)
        .expect(200);

      // Patient 3 should move up
      const patient3Status = await request(app)
        .get(`/api/queue/${patients[2].queueId}/status`)
        .expect(200);

      expect(patient3Status.body.position).toBe(2);
    });
  });

  describe('Queue Metrics', () => {
    it('should calculate average wait time', async () => {
      const providerId = `queue-metrics-${Date.now()}`;

      // Add patients and call them
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/queue/join')
          .send({
            patientId: `queue-metrics-patient-${i}-${Date.now()}`,
            providerId,
            departmentId: 'dept-001',
            priority: 'NORMAL',
            reason: 'Checkup'
          });

        await new Promise(resolve => setTimeout(resolve, 1000));

        await request(app)
          .post(`/api/queue/call-next`)
          .send({ providerId });
      }

      // Get metrics
      const metricsResponse = await request(app)
        .get(`/api/queue/provider/${providerId}/metrics`)
        .expect(200);

      expect(metricsResponse.body.averageWaitTime).toBeGreaterThan(0);
      expect(metricsResponse.body.totalServed).toBe(3);
    });
  });
});
