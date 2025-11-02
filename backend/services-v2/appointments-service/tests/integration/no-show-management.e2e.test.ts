/**
 * No-Show Management E2E Tests
 * 
 * Tests the complete no-show management flow including:
 * - Marking appointments as no-show
 * - No-show fee calculation
 * - Patient no-show tracking
 * - Billing event integration
 * - Business rules validation
 */

import request from 'supertest';
import app from '../../src/main';
import { createClient } from '@supabase/supabase-js';
import { createAppointment, waitFor } from '../helpers/test-data-builder';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('No-Show Management E2E', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      db: { schema: 'appointments_schema' }
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('appointments').delete().like('patient_id', 'e2e-noshow-%');
  });

  describe('Mark Appointment as No-Show', () => {
    it('should mark scheduled appointment as NO_SHOW', async () => {
      const patientId = `e2e-noshow-patient-${Date.now()}`;
      const providerId = `e2e-noshow-provider-${Date.now()}`;
      const consultationFee = 500000;

      // Create appointment in the past
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withProviderId(providerId)
            .withDate(pastDate)
            .withTimeSlot('09:00', '09:30')
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Mark as no-show
      const noShowResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .send({
          markedBy: 'provider-001',
          reason: 'Patient did not arrive for scheduled appointment'
        })
        .expect(200);

      expect(noShowResponse.body.status).toBe('NO_SHOW');
      expect(noShowResponse.body.noShowMarkedAt).toBeDefined();
      expect(noShowResponse.body.noShowMarkedBy).toBe('provider-001');

      // Verify in database
      const { data: appointment } = await supabase
        .from('appointments')
        .select('status, no_show_marked_at')
        .eq('id', appointmentId)
        .single();

      expect(appointment.status).toBe('NO_SHOW');
      expect(appointment.no_show_marked_at).toBeDefined();
    });

    it('should calculate no-show fee (50% of consultation fee)', async () => {
      const consultationFee = 500000; // 500k VND
      const expectedNoShowFee = consultationFee * 0.5; // 250k VND

      // Create appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-noshow-patient-${Date.now()}`)
            .withProviderId(`e2e-noshow-provider-${Date.now()}`)
            .withDate(new Date(Date.now() - 3600000))
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Mark as no-show
      const noShowResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .expect(200);

      expect(noShowResponse.body.noShowFee).toBe(expectedNoShowFee);
      expect(noShowResponse.body.feeReason).toContain('50%');
    });

    it('should update patient no-show count', async () => {
      const patientId = `e2e-noshow-patient-${Date.now()}`;

      // Create and mark 3 appointments as no-show
      for (let i = 0; i < 3; i++) {
        const createResponse = await request(app)
          .post('/api/v1/appointments')
          .send(
            createAppointment()
              .withPatientId(patientId)
              .withProviderId(`provider-${i}`)
              .withDate(new Date(Date.now() - 3600000 * (i + 1)))
              .build()
          )
          .expect(201);

        await request(app)
          .post(`/api/v1/appointments/${createResponse.body.id}/mark-no-show`)
          .expect(200);

        await waitFor(100);
      }

      // Get patient statistics
      const statsResponse = await request(app)
        .get(`/api/v1/patients/${patientId}/statistics`)
        .expect(200);

      expect(statsResponse.body.noShowCount).toBeGreaterThanOrEqual(3);
      expect(statsResponse.body.noShowRate).toBeGreaterThan(0);
    });
  });

  describe('No-Show Fee Billing', () => {
    it('should publish BillingRequired event for no-show fee', async () => {
      const patientId = `e2e-noshow-patient-${Date.now()}`;
      const consultationFee = 500000;

      // Create appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withDate(new Date(Date.now() - 3600000))
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Mark as no-show
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .expect(200);

      // Wait for event processing
      await waitFor(2000);

      // Verify billing event was published to outbox
      const { data: outboxEvents } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'billing.no-show-fee.required')
        .like('payload->>appointmentId', appointmentId)
        .single();

      expect(outboxEvents).toBeDefined();
      const payload = JSON.parse(outboxEvents.payload);
      expect(payload.amount).toBe(consultationFee * 0.5);
      expect(payload.reason).toContain('no-show');
    });

    it('should include no-show fee in patient invoice', async () => {
      const patientId = `e2e-noshow-patient-${Date.now()}`;

      // Create and mark as no-show
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withDate(new Date(Date.now() - 3600000))
            .withFee(500000)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/mark-no-show`)
        .expect(200);

      await waitFor(1000);

      // Get patient invoices
      const invoiceResponse = await request(app)
        .get(`/api/v1/patients/${patientId}/invoices`)
        .expect(200);

      const noShowInvoice = invoiceResponse.body.find(
        (inv: any) => inv.type === 'NO_SHOW_FEE'
      );

      expect(noShowInvoice).toBeDefined();
      expect(noShowInvoice.amount).toBe(250000); // 50% of 500k
    });
  });

  describe('No-Show Business Rules', () => {
    it('should NOT allow marking completed appointment as no-show', async () => {
      // Create and complete appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-noshow-patient-${Date.now()}`)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Complete appointment
      await request(app).post(`/api/v1/appointments/${appointmentId}/confirm`).expect(200);
      await request(app).post(`/api/v1/appointments/${appointmentId}/check-in`).expect(200);
      await request(app).post(`/api/v1/appointments/${appointmentId}/start`).expect(200);
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/complete`)
        .send({ diagnosis: 'Test', treatment: 'Test' })
        .expect(200);

      // Try to mark as no-show (should fail)
      const noShowResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .expect(400);

      expect(noShowResponse.body.error).toContain('completed');
    });

    it('should NOT allow marking cancelled appointment as no-show', async () => {
      // Create and cancel appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-noshow-patient-${Date.now()}`)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Cancel appointment
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Test cancellation' })
        .expect(200);

      // Try to mark as no-show (should fail)
      const noShowResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .expect(400);

      expect(noShowResponse.body.error).toContain('cancelled');
    });

    it('should NOT allow marking future appointment as no-show', async () => {
      // Create future appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-noshow-patient-${Date.now()}`)
            .withDate(new Date(Date.now() + 86400000)) // Tomorrow
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Try to mark as no-show (should fail - appointment hasn't happened yet)
      const noShowResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .expect(400);

      expect(noShowResponse.body.error).toContain('future');
    });

    it('should allow marking as no-show within grace period (30 minutes)', async () => {
      // Create appointment 15 minutes ago (within grace period)
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-noshow-patient-${Date.now()}`)
            .withDate(new Date(Date.now() - 900000)) // 15 minutes ago
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Should allow marking as no-show (within 30-minute grace period)
      const noShowResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .expect(200);

      expect(noShowResponse.body.status).toBe('NO_SHOW');
    });
  });

  describe('No-Show Waivers', () => {
    it('should waive no-show fee for medical emergency', async () => {
      // Create appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-noshow-patient-${Date.now()}`)
            .withDate(new Date(Date.now() - 3600000))
            .withFee(500000)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Mark as no-show with waiver
      const noShowResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .send({
          waiveReason: 'MEDICAL_EMERGENCY',
          waiverNotes: 'Patient was hospitalized'
        })
        .expect(200);

      expect(noShowResponse.body.noShowFee).toBe(0);
      expect(noShowResponse.body.feeWaived).toBe(true);
      expect(noShowResponse.body.waiverReason).toBe('MEDICAL_EMERGENCY');
    });

    it('should require approval for fee waiver', async () => {
      // Create appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-noshow-patient-${Date.now()}`)
            .withDate(new Date(Date.now() - 3600000))
            .withFee(500000)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Try to waive without authorization (should fail)
      const noShowResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/mark-no-show`)
        .send({
          waiveReason: 'OTHER',
          waiverNotes: 'Random reason'
        })
        .expect(403);

      expect(noShowResponse.body.error).toContain('approval');
    });
  });

  describe('No-Show Notifications', () => {
    it('should send notification to patient about no-show fee', async () => {
      const patientId = `e2e-noshow-patient-${Date.now()}`;

      // Create appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withDate(new Date(Date.now() - 3600000))
            .withFee(500000)
            .build()
        )
        .expect(201);

      // Mark as no-show
      await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/mark-no-show`)
        .expect(200);

      await waitFor(1500);

      // Verify notification event
      const { data: notificationEvent } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'notifications.no-show.patient')
        .like('payload->>patientId', patientId)
        .single();

      expect(notificationEvent).toBeDefined();
      const payload = JSON.parse(notificationEvent.payload);
      expect(payload.notificationType).toBe('NO_SHOW_FEE');
      expect(payload.amount).toBe(250000);
    });
  });

  describe('No-Show History & Reporting', () => {
    it('should track no-show history for patient', async () => {
      const patientId = `e2e-noshow-patient-${Date.now()}`;

      // Create 2 appointments and mark as no-show
      const appointments = [];
      for (let i = 0; i < 2; i++) {
        const createResponse = await request(app)
          .post('/api/v1/appointments')
          .send(
            createAppointment()
              .withPatientId(patientId)
              .withDate(new Date(Date.now() - 3600000 * (i + 1)))
              .build()
          )
          .expect(201);

        await request(app)
          .post(`/api/v1/appointments/${createResponse.body.id}/mark-no-show`)
          .expect(200);

        appointments.push(createResponse.body.id);
        await waitFor(100);
      }

      // Get no-show history
      const historyResponse = await request(app)
        .get(`/api/v1/appointments/history?patientId=${patientId}&status=NO_SHOW`)
        .expect(200);

      expect(historyResponse.body.appointments.length).toBeGreaterThanOrEqual(2);
      expect(historyResponse.body.totalNoShows).toBeGreaterThanOrEqual(2);
    });

    it('should include no-show data in provider statistics', async () => {
      const providerId = `e2e-noshow-provider-${Date.now()}`;

      // Create appointments with mix of completed and no-show
      // 1 completed
      const completedAppt = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`patient-completed-${Date.now()}`)
            .withProviderId(providerId)
            .build()
        )
        .expect(201);

      await request(app).post(`/api/v1/appointments/${completedAppt.body.id}/confirm`).expect(200);
      await request(app).post(`/api/v1/appointments/${completedAppt.body.id}/check-in`).expect(200);
      await request(app).post(`/api/v1/appointments/${completedAppt.body.id}/start`).expect(200);
      await request(app)
        .post(`/api/v1/appointments/${completedAppt.body.id}/complete`)
        .send({ diagnosis: 'Test', treatment: 'Test' })
        .expect(200);

      // 2 no-shows
      for (let i = 0; i < 2; i++) {
        const noShowAppt = await request(app)
          .post('/api/v1/appointments')
          .send(
            createAppointment()
              .withPatientId(`patient-noshow-${Date.now()}-${i}`)
              .withProviderId(providerId)
              .withDate(new Date(Date.now() - 3600000 * (i + 1)))
              .build()
          )
          .expect(201);

        await request(app)
          .post(`/api/v1/appointments/${noShowAppt.body.id}/mark-no-show`)
          .expect(200);

        await waitFor(100);
      }

      // Get provider statistics
      const statsResponse = await request(app)
        .get(`/api/v1/appointments/statistics?providerId=${providerId}`)
        .expect(200);

      expect(statsResponse.body.noShowCount).toBeGreaterThanOrEqual(2);
      expect(statsResponse.body.noShowRate).toBeGreaterThan(0);
      expect(statsResponse.body.completedCount).toBeGreaterThanOrEqual(1);
    });
  });
});
