/**
 * Transfer Appointment E2E Tests
 * 
 * Tests the complete appointment transfer flow including:
 * - Transfer to different provider
 * - Preserve appointment history
 * - Notify old and new providers
 * - Handle billing adjustments
 * - Audit trail tracking
 */

import request from 'supertest';
import app from '../../src/main';
import { createClient } from '@supabase/supabase-js';
import { createAppointment, waitFor } from '../helpers/test-data-builder';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Transfer Appointment E2E', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      db: { schema: 'appointments_schema' }
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('appointments').delete().like('patient_id', 'e2e-transfer-%');
  });

  describe('Basic Transfer Flow', () => {
    it('should transfer appointment to new provider successfully', async () => {
      const patientId = `e2e-transfer-patient-${Date.now()}`;
      const originalProviderId = `e2e-original-provider-${Date.now()}`;
      const newProviderId = `e2e-new-provider-${Date.now()}`;

      // Create original appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withProviderId(originalProviderId)
            .withDate(new Date(Date.now() + 86400000))
            .withTimeSlot('09:00', '09:30')
            .withFee(500000)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Transfer to new provider
      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/transfer`)
        .send({
          newProviderId,
          reason: 'Original provider unavailable',
          requestedBy: 'admin-001'
        })
        .expect(200);

      expect(transferResponse.body.providerId).toBe(newProviderId);
      expect(transferResponse.body.previousProviderId).toBe(originalProviderId);
      expect(transferResponse.body.transferredAt).toBeDefined();
      expect(transferResponse.body.transferReason).toBe('Original provider unavailable');

      // Verify in database
      const { data: appointment } = await supabase
        .from('appointments')
        .select('provider_id, previous_provider_id')
        .eq('id', appointmentId)
        .single();

      expect(appointment.provider_id).toBe(newProviderId);
      expect(appointment.previous_provider_id).toBe(originalProviderId);
    });

    it('should preserve appointment details during transfer', async () => {
      const originalData = createAppointment()
        .withPatientId(`e2e-transfer-patient-${Date.now()}`)
        .withProviderId(`original-${Date.now()}`)
        .withDate(new Date(Date.now() + 86400000))
        .withTimeSlot('10:00', '10:30')
        .withType('CONSULTATION')
        .withFee(500000)
        .withNotes('Important consultation')
        .build();

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(originalData)
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Transfer appointment
      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          reason: 'Provider transfer'
        })
        .expect(200);

      // Verify preserved details
      expect(transferResponse.body.patientId).toBe(originalData.patientId);
      expect(transferResponse.body.appointmentType).toBe(originalData.appointmentType);
      expect(transferResponse.body.timeSlot).toEqual(originalData.timeSlot);
      expect(transferResponse.body.notes).toBe(originalData.notes);
      expect(transferResponse.body.status).toBe('SCHEDULED'); // Status unchanged
    });

    it('should maintain appointment time slot after transfer', async () => {
      const appointmentDate = new Date(Date.now() + 86400000);
      const timeSlot = { startTime: '11:00', endTime: '11:30' };

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
            .withDate(appointmentDate)
            .withTimeSlot(timeSlot.startTime, timeSlot.endTime)
            .build()
        )
        .expect(201);

      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          reason: 'Transfer test'
        })
        .expect(200);

      expect(transferResponse.body.timeSlot).toEqual(timeSlot);
      expect(new Date(transferResponse.body.appointmentDate).toISOString()).toBe(
        appointmentDate.toISOString()
      );
    });
  });

  describe('Transfer with Time Slot Change', () => {
    it('should allow changing time slot during transfer', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
            .withDate(new Date(Date.now() + 86400000))
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      const newTimeSlot = { startTime: '14:00', endTime: '14:30' };

      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          newTimeSlot,
          reason: 'Provider change with reschedule'
        })
        .expect(200);

      expect(transferResponse.body.timeSlot).toEqual(newTimeSlot);
      expect(transferResponse.body.previousTimeSlot).toEqual({
        startTime: '09:00',
        endTime: '09:30'
      });
    });

    it('should validate new time slot availability during transfer', async () => {
      const newProviderId = `new-provider-${Date.now()}`;
      const appointmentDate = new Date(Date.now() + 86400000);

      // Create existing appointment for new provider at 14:00-14:30
      await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`existing-patient-${Date.now()}`)
            .withProviderId(newProviderId)
            .withDate(appointmentDate)
            .withTimeSlot('14:00', '14:30')
            .build()
        )
        .expect(201);

      // Create appointment to transfer
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
            .withDate(appointmentDate)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Try to transfer to conflicting time slot (should fail)
      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId,
          newTimeSlot: { startTime: '14:00', endTime: '14:30' },
          reason: 'Transfer with conflict'
        })
        .expect(409);

      expect(transferResponse.body.error).toContain('conflict');
    });
  });

  describe('Billing Adjustments', () => {
    it('should calculate fee difference when transferring to provider with different rate', async () => {
      const originalFee = 500000;
      const newProviderFee = 700000;

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
            .withFee(originalFee)
            .build()
        )
        .expect(201);

      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          newConsultationFee: newProviderFee,
          reason: 'Transfer to specialist'
        })
        .expect(200);

      expect(transferResponse.body.consultationFee).toBe(newProviderFee);
      expect(transferResponse.body.originalConsultationFee).toBe(originalFee);
      expect(transferResponse.body.feeAdjustment).toBe(200000); // +200k
      expect(transferResponse.body.feeAdjustmentReason).toBe('PROVIDER_RATE_CHANGE');
    });

    it('should publish billing adjustment event', async () => {
      const patientId = `e2e-transfer-patient-${Date.now()}`;
      const originalFee = 500000;
      const newFee = 600000;

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withProviderId(`original-${Date.now()}`)
            .withFee(originalFee)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          newConsultationFee: newFee,
          reason: 'Transfer test'
        })
        .expect(200);

      await waitFor(2000);

      // Verify billing adjustment event
      const { data: billingEvent } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'billing.fee-adjustment.required')
        .like('payload->>patientId', patientId)
        .single();

      expect(billingEvent).toBeDefined();
      const payload = JSON.parse(billingEvent.payload);
      expect(payload.adjustmentAmount).toBe(100000);
      expect(payload.reason).toContain('transfer');
    });
  });

  describe('Transfer Notifications', () => {
    it('should notify old provider about transfer', async () => {
      const originalProviderId = `original-provider-${Date.now()}`;

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(originalProviderId)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          reason: 'Notification test'
        })
        .expect(200);

      await waitFor(1500);

      // Verify old provider notification
      const { data: notification } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'notifications.appointment.transferred-away')
        .like('payload->>providerId', originalProviderId)
        .single();

      expect(notification).toBeDefined();
      const payload = JSON.parse(notification.payload);
      expect(payload.providerId).toBe(originalProviderId);
    });

    it('should notify new provider about transfer', async () => {
      const newProviderId = `new-provider-${Date.now()}`;

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId,
          reason: 'Notification test'
        })
        .expect(200);

      await waitFor(1500);

      // Verify new provider notification
      const { data: notification } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'notifications.appointment.transferred-to')
        .like('payload->>providerId', newProviderId)
        .single();

      expect(notification).toBeDefined();
    });

    it('should notify patient about transfer', async () => {
      const patientId = `e2e-transfer-patient-${Date.now()}`;

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(patientId)
            .withProviderId(`original-${Date.now()}`)
            .build()
        )
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          reason: 'Patient notification test'
        })
        .expect(200);

      await waitFor(1500);

      // Verify patient notification
      const { data: notification } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'notifications.appointment.provider-changed')
        .like('payload->>patientId', patientId)
        .single();

      expect(notification).toBeDefined();
    });
  });

  describe('Transfer Audit Trail', () => {
    it('should record transfer history', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          reason: 'Audit trail test',
          requestedBy: 'admin-123'
        })
        .expect(200);

      // Get transfer history
      const historyResponse = await request(app)
        .get(`/api/v1/appointments/${appointmentId}/history`)
        .expect(200);

      const transferEvent = historyResponse.body.events.find(
        (e: any) => e.eventType === 'TRANSFERRED'
      );

      expect(transferEvent).toBeDefined();
      expect(transferEvent.requestedBy).toBe('admin-123');
      expect(transferEvent.reason).toBe('Audit trail test');
      expect(transferEvent.timestamp).toBeDefined();
    });

    it('should track multiple transfers', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`provider-1-${Date.now()}`)
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // First transfer
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/transfer`)
        .send({
          newProviderId: `provider-2-${Date.now()}`,
          reason: 'First transfer'
        })
        .expect(200);

      // Second transfer
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/transfer`)
        .send({
          newProviderId: `provider-3-${Date.now()}`,
          reason: 'Second transfer'
        })
        .expect(200);

      // Get history
      const historyResponse = await request(app)
        .get(`/api/v1/appointments/${appointmentId}/history`)
        .expect(200);

      const transferEvents = historyResponse.body.events.filter(
        (e: any) => e.eventType === 'TRANSFERRED'
      );

      expect(transferEvents.length).toBe(2);
    });
  });

  describe('Transfer Validation Rules', () => {
    it('should NOT allow transfer to same provider', async () => {
      const providerId = `provider-${Date.now()}`;

      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(providerId)
            .build()
        )
        .expect(201);

      // Try to transfer to same provider (should fail)
      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId: providerId,
          reason: 'Invalid transfer'
        })
        .expect(400);

      expect(transferResponse.body.error).toContain('same provider');
    });

    it('should NOT allow transfer of completed appointment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
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

      // Try to transfer (should fail)
      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          reason: 'Invalid transfer'
        })
        .expect(400);

      expect(transferResponse.body.error).toContain('completed');
    });

    it('should NOT allow transfer of cancelled appointment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
            .withDate(new Date(Date.now() + 86400000))
            .build()
        )
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Cancel appointment
      await request(app)
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .send({ reason: 'Cancelled', cancelledBy: 'patient' })
        .expect(200);

      // Try to transfer (should fail)
      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`,
          reason: 'Invalid transfer'
        })
        .expect(400);

      expect(transferResponse.body.error).toContain('cancelled');
    });

    it('should require transfer reason', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`e2e-transfer-patient-${Date.now()}`)
            .withProviderId(`original-${Date.now()}`)
            .build()
        )
        .expect(201);

      // Try to transfer without reason
      const transferResponse = await request(app)
        .post(`/api/v1/appointments/${createResponse.body.id}/transfer`)
        .send({
          newProviderId: `new-${Date.now()}`
          // Missing reason
        })
        .expect(400);

      expect(transferResponse.body.error).toContain('reason');
    });
  });
});
