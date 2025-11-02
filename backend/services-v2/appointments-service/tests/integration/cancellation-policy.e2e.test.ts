/**
 * Cancellation Policy E2E Tests
 * 
 * Tests the complete cancellation policy enforcement including:
 * - Tiered cancellation fees based on timing
 * - Free cancellation window (24+ hours)
 * - Partial refunds (12-24h: 50%, 6-12h: 25%, <6h: 0%)
 * - Emergency cancellation exemptions
 * - Provider vs patient cancellation rules
 * - Billing event integration
 */

import request from 'supertest';
import app from '../../src/main';
import { createClient } from '@supabase/supabase-js';
import { createAppointment, waitFor } from '../helpers/test-data-builder';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Cancellation Policy E2E', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      db: { schema: 'appointments_schema' }
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('appointments').delete().like('patient_id', 'e2e-cancel-%');
  });

  describe('Free Cancellation Window (24+ hours)', () => {
    it('should allow FREE cancellation 24+ hours before appointment', async () => {
      const consultationFee = 500000;
      const futureDate = new Date(Date.now() + 86400000 * 2); // 2 days from now

      // Create appointment 2 days in future
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withProviderId(`e2e-cancel-provider-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Cancel appointment
      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({
          reason: 'Patient request - schedule conflict',
          cancelledBy: 'patient'
        })
        .expect(200);

      expect(cancelResponse.body.status).toBe('CANCELLED');
      expect(cancelResponse.body.cancellationFee).toBe(0);
      expect(cancelResponse.body.refundAmount).toBe(consultationFee);
      expect(cancelResponse.body.refundPercentage).toBe(100);
      expect(cancelResponse.body.policyApplied).toBe('FREE_CANCELLATION_24H');
    });

    it('should refund FULL amount for early cancellation', async () => {
      const consultationFee = 500000;
      const futureDate = new Date(Date.now() + 86400000 * 3); // 3 days from now

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Early cancellation', cancelledBy: 'patient' })
        .expect(200);

      expect(cancelResponse.body.refundAmount).toBe(consultationFee);
      expect(cancelResponse.body.cancellationFee).toBe(0);
    });
  });

  describe('Partial Refund Window (12-24 hours)', () => {
    it('should charge 50% fee for cancellation 12-24h before appointment', async () => {
      const consultationFee = 500000;
      const expectedFee = consultationFee * 0.5; // 250k cancellation fee
      const expectedRefund = consultationFee * 0.5; // 250k refund

      // Create appointment 18 hours from now (within 12-24h window)
      const futureDate = new Date(Date.now() + 18 * 3600000);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Late cancellation', cancelledBy: 'patient' })
        .expect(200);

      expect(cancelResponse.body.cancellationFee).toBe(expectedFee);
      expect(cancelResponse.body.refundAmount).toBe(expectedRefund);
      expect(cancelResponse.body.refundPercentage).toBe(50);
      expect(cancelResponse.body.policyApplied).toBe('LATE_CANCELLATION_12_24H');
    });

    it('should apply 50% refund policy consistently', async () => {
      const consultationFee = 500000;

      // Test at 23 hours before (edge of window)
      const futureDate = new Date(Date.now() + 23 * 3600000);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
        .send({ reason: 'Edge case test', cancelledBy: 'patient' })
        .expect(200);

      expect(cancelResponse.body.refundPercentage).toBe(50);
      expect(cancelResponse.body.cancellationFee).toBe(250000);
    });
  });

  describe('Heavy Penalty Window (6-12 hours)', () => {
    it('should charge 75% fee for cancellation 6-12h before appointment', async () => {
      const consultationFee = 500000;
      const expectedFee = consultationFee * 0.75; // 375k cancellation fee
      const expectedRefund = consultationFee * 0.25; // 125k refund (25%)

      // Create appointment 8 hours from now (within 6-12h window)
      const futureDate = new Date(Date.now() + 8 * 3600000);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Very late cancellation', cancelledBy: 'patient' })
        .expect(200);

      expect(cancelResponse.body.cancellationFee).toBe(expectedFee);
      expect(cancelResponse.body.refundAmount).toBe(expectedRefund);
      expect(cancelResponse.body.refundPercentage).toBe(25);
      expect(cancelResponse.body.policyApplied).toBe('VERY_LATE_CANCELLATION_6_12H');
    });
  });

  describe('No Refund Window (<6 hours)', () => {
    it('should charge 100% fee (no refund) for cancellation <6h before appointment', async () => {
      const consultationFee = 500000;

      // Create appointment 3 hours from now (<6h window)
      const futureDate = new Date(Date.now() + 3 * 3600000);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Last minute cancellation', cancelledBy: 'patient' })
        .expect(200);

      expect(cancelResponse.body.cancellationFee).toBe(consultationFee);
      expect(cancelResponse.body.refundAmount).toBe(0);
      expect(cancelResponse.body.refundPercentage).toBe(0);
      expect(cancelResponse.body.policyApplied).toBe('NO_REFUND_WITHIN_6H');
    });

    it('should enforce no-refund policy at 2 hours before', async () => {
      const consultationFee = 500000;
      const futureDate = new Date(Date.now() + 2 * 3600000);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
        .send({ reason: 'Emergency', cancelledBy: 'patient' })
        .expect(200);

      expect(cancelResponse.body.refundAmount).toBe(0);
      expect(cancelResponse.body.cancellationFee).toBe(consultationFee);
    });
  });

  describe('Emergency Cancellation Exemptions', () => {
    it('should waive cancellation fee for medical emergency', async () => {
      const consultationFee = 500000;
      const futureDate = new Date(Date.now() + 3 * 3600000); // 3 hours (normally 100% fee)

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({
          reason: 'Patient hospitalized with acute condition',
          cancelledBy: 'patient',
          exemptionReason: 'MEDICAL_EMERGENCY',
          exemptionNotes: 'Patient admitted to emergency room'
        })
        .expect(200);

      expect(cancelResponse.body.cancellationFee).toBe(0);
      expect(cancelResponse.body.refundAmount).toBe(consultationFee);
      expect(cancelResponse.body.feeWaived).toBe(true);
      expect(cancelResponse.body.exemptionReason).toBe('MEDICAL_EMERGENCY');
    });

    it('should waive fee for natural disaster', async () => {
      const consultationFee = 500000;
      const futureDate = new Date(Date.now() + 2 * 3600000);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
        .send({
          reason: 'Typhoon - unable to travel',
          cancelledBy: 'patient',
          exemptionReason: 'NATURAL_DISASTER'
        })
        .expect(200);

      expect(cancelResponse.body.feeWaived).toBe(true);
      expect(cancelResponse.body.refundAmount).toBe(consultationFee);
    });

    it('should require approval for exemption', async () => {
      const futureDate = new Date(Date.now() + 2 * 3600000);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(500000)
            .build()
        )
        .expect(201);

      // Try to claim exemption without proper authorization
      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
        .send({
          reason: 'Random excuse',
          cancelledBy: 'patient',
          exemptionReason: 'OTHER',
          exemptionNotes: 'Just changed my mind'
        })
        .expect(403);

      expect(cancelResponse.body.error).toContain('approval');
    });
  });

  describe('Provider-Initiated Cancellation', () => {
    it('should refund FULL amount for provider cancellation (no fee)', async () => {
      const consultationFee = 500000;
      const futureDate = new Date(Date.now() + 2 * 3600000); // 2 hours before

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Provider cancels (patient should get full refund regardless of timing)
      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({
          reason: 'Provider emergency - unable to attend',
          cancelledBy: 'provider',
          providerId: createResponse.body.providerId
        })
        .expect(200);

      expect(cancelResponse.body.cancellationFee).toBe(0);
      expect(cancelResponse.body.refundAmount).toBe(consultationFee);
      expect(cancelResponse.body.refundPercentage).toBe(100);
      expect(cancelResponse.body.cancelledBy).toBe('provider');
      expect(cancelResponse.body.policyApplied).toBe('PROVIDER_CANCELLATION');
    });

    it('should not penalize patient for provider cancellation', async () => {
      const futureDate = new Date(Date.now() + 1 * 3600000); // 1 hour before (normally no refund)

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(futureDate)
            .withFee(500000)
            .build()
        )
        .expect(201);

      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
        .send({
          reason: 'Provider illness',
          cancelledBy: 'provider'
        })
        .expect(200);

      expect(cancelResponse.body.refundAmount).toBe(500000);
      expect(cancelResponse.body.cancellationFee).toBe(0);
    });
  });

  describe('Cancellation Billing Events', () => {
    it('should publish RefundRequired event for cancelled appointment', async () => {
      const patientId = `e2e-cancel-patient-${Date.now()}`;
      const consultationFee = 500000;
      const futureDate = new Date(Date.now() + 86400000 * 2);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withDate(futureDate)
            .withFee(consultationFee)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Refund test', cancelledBy: 'patient' })
        .expect(200);

      await waitFor(2000);

      // Verify refund event was published
      const { data: refundEvent } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'billing.refund.required')
        .like('payload->>appointmentId', appointmentId)
        .single();

      expect(refundEvent).toBeDefined();
      const payload = JSON.parse(refundEvent.payload);
      expect(payload.refundAmount).toBe(consultationFee);
      expect(payload.reason).toContain('cancellation');
    });

    it('should publish CancellationFee event when fee applied', async () => {
      const patientId = `e2e-cancel-patient-${Date.now()}`;
      const futureDate = new Date(Date.now() + 3 * 3600000); // 3 hours (100% fee)

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withDate(futureDate)
            .withFee(500000)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
        .send({ reason: 'Fee test', cancelledBy: 'patient' })
        .expect(200);

      await waitFor(2000);

      // Verify cancellation fee event
      const { data: feeEvent } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'billing.cancellation-fee.charged')
        .like('payload->>patientId', patientId)
        .single();

      expect(feeEvent).toBeDefined();
      const payload = JSON.parse(feeEvent.payload);
      expect(payload.cancellationFee).toBe(500000);
    });
  });

  describe('Cancellation Business Rules', () => {
    it('should NOT allow cancelling completed appointment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Complete the appointment
      await request(app).post(`/api/v1/appointments/${appointmentId}/confirm`).expect(200);
      await request(app).post(`/api/v1/appointments/${appointmentId}/check-in`).expect(200);
      await request(app).post(`/api/v1/appointments/${appointmentId}/start`).expect(200);
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/complete`)
        .send({ diagnosis: 'Test', treatment: 'Test' })
        .expect(200);

      // Try to cancel (should fail)
      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Too late', cancelledBy: 'patient' })
        .expect(400);

      expect(cancelResponse.body.error).toContain('completed');
    });

    it('should NOT allow cancelling already cancelled appointment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(new Date(Date.now() + 86400000))
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Cancel once
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'First cancel', cancelledBy: 'patient' })
        .expect(200);

      // Try to cancel again (should fail)
      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Second cancel', cancelledBy: 'patient' })
        .expect(400);

      expect(cancelResponse.body.error).toContain('already cancelled');
    });

    it('should require cancellation reason', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-cancel-patient-${Date.now()}`)
            .withDate(new Date(Date.now() + 86400000))
            .build()
        )
        .expect(201);

      // Try to cancel without reason
      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
        .send({ cancelledBy: 'patient' })
        .expect(400);

      expect(cancelResponse.body.error).toContain('reason');
    });
  });

  describe('Cancellation Notifications', () => {
    it('should notify patient about cancellation and refund', async () => {
      const patientId = `e2e-cancel-patient-${Date.now()}`;
      const futureDate = new Date(Date.now() + 86400000 * 2);

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withDate(futureDate)
            .withFee(500000)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
        .send({ reason: 'Notification test', cancelledBy: 'patient' })
        .expect(200);

      await waitFor(1500);

      // Verify notification event
      const { data: notificationEvent } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'notifications.cancellation.patient')
        .like('payload->>patientId', patientId)
        .single();

      expect(notificationEvent).toBeDefined();
      const payload = JSON.parse(notificationEvent.payload);
      expect(payload.refundAmount).toBe(500000);
    });
  });

  describe('Cancellation History', () => {
    it('should track patient cancellation history', async () => {
      const patientId = `e2e-cancel-patient-${Date.now()}`;

      // Create and cancel 2 appointments
      for (let i = 0; i < 2; i++) {
        const createResponse = await request(app)
          .post('/api/v1/appointments')
          .send(
            createAppointment()
              .withPatientId(patientId)
              .withDate(new Date(Date.now() + 86400000 * (i + 1)))
              .build()
          )
          .expect(201);

        await request(app)
          .post(`/api/v1/appointments/${createResponse.body.id}/cancel`)
          .send({ reason: `Cancel ${i + 1}`, cancelledBy: 'patient' })
          .expect(200);

        await waitFor(100);
      }

      // Get cancellation history
      const historyResponse = await request(app)
        .get(`/api/v1/appointments/history?patientId=${patientId}&status=CANCELLED`)
        .expect(200);

      expect(historyResponse.body.appointments.length).toBeGreaterThanOrEqual(2);
      expect(historyResponse.body.totalCancellations).toBeGreaterThanOrEqual(2);
    });

    it('should calculate total cancellation fees for patient', async () => {
      const patientId = `e2e-cancel-patient-${Date.now()}`;
      let totalExpectedFees = 0;

      // Cancel 1 with 50% fee
      const appt1 = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withDate(new Date(Date.now() + 18 * 3600000))
            .withFee(500000)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${appt1.body.id}/cancel`)
        .send({ reason: 'Test 1', cancelledBy: 'patient' })
        .expect(200);

      totalExpectedFees += 250000; // 50% of 500k

      // Cancel 1 with 100% fee
      const appt2 = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withDate(new Date(Date.now() + 3 * 3600000))
            .withFee(500000)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${appt2.body.id}/cancel`)
        .send({ reason: 'Test 2', cancelledBy: 'patient' })
        .expect(200);

      totalExpectedFees += 500000; // 100% of 500k

      await waitFor(500);

      // Get patient statistics
      const statsResponse = await request(app)
        .get(`/api/v1/patients/${patientId}/statistics`)
        .expect(200);

      expect(statsResponse.body.totalCancellationFees).toBeGreaterThanOrEqual(totalExpectedFees);
    });
  });
});
