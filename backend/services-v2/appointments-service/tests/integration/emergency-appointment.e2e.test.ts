/**
 * Emergency Appointment E2E Tests
 * 
 * Tests the complete emergency appointment flow including:
 * - Bypassing normal scheduling rules
 * - Overriding provider schedule
 * - Emergency fee calculation
 * - Staff notifications
 * - Priority queue placement
 */

import request from 'supertest';
import app from '../../src/main';
import { createClient } from '@supabase/supabase-js';
import { createAppointment, waitFor, waitForCondition } from '../helpers/test-data-builder';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Emergency Appointment E2E', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      db: { schema: 'appointments_schema' }
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('appointments').delete().like('patient_id', 'e2e-emergency-%');
    await supabase.from('queue').delete().like('patient_id', 'e2e-emergency-%');
  });

  describe('Emergency Appointment Creation', () => {
    it('should create emergency appointment successfully', async () => {
      const patientId = `e2e-emergency-patient-${Date.now()}`;
      const providerId = `e2e-emergency-provider-${Date.now()}`;

      const response = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId,
          providerId,
          tenantId: 'e2e-tenant',
          reason: 'Severe chest pain - suspected cardiac event',
          severity: 'HIGH',
          consultationFee: 500000
        })
        .expect(201);

      expect(response.body).toMatchObject({
        patientId,
        providerId,
        appointmentType: 'EMERGENCY',
        status: 'SCHEDULED'
      });

      // Verify appointment ID was generated
      expect(response.body.id).toBeDefined();

      // Verify appointment was created in database
      const { data: appointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', response.body.id)
        .single();

      expect(appointment).toBeDefined();
      expect(appointment.appointment_type).toBe('EMERGENCY');
    });

    it('should bypass time slot validation for emergencies', async () => {
      const patientId = `e2e-emergency-patient-${Date.now()}`;
      const providerId = `e2e-emergency-provider-${Date.now()}`;

      // First, create a regular appointment at 09:00-09:30
      await request(app)
        .post('/api/v1/appointments')
        .send(
          createAppointment()
            .withPatientId(`regular-${patientId}`)
            .withProviderId(providerId)
            .withTimeSlot('09:00', '09:30')
            .build()
        )
        .expect(201);

      // Now create emergency appointment at the SAME TIME (should succeed)
      const emergencyResponse = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId,
          providerId,
          tenantId: 'e2e-tenant',
          // Force same time slot (normally would conflict)
          appointmentDate: new Date(Date.now() + 86400000).toISOString(),
          timeSlot: { startTime: '09:00', endTime: '09:30' },
          reason: 'Acute emergency - immediate attention required',
          severity: 'CRITICAL'
        })
        .expect(201);

      expect(emergencyResponse.body.appointmentType).toBe('EMERGENCY');
      expect(emergencyResponse.body.timeSlot.startTime).toBe('09:00');

      // Verify both appointments exist at same time
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', providerId)
        .gte('appointment_date', new Date(Date.now() + 86400000 - 3600000).toISOString())
        .lte('appointment_date', new Date(Date.now() + 86400000 + 3600000).toISOString());

      expect(appointments?.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate emergency surcharge (50% extra)', async () => {
      const baseFee = 500000; // 500k VND
      const expectedTotal = baseFee * 1.5; // 750k VND (50% surcharge)

      const response = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId: `e2e-emergency-provider-${Date.now()}`,
          tenantId: 'e2e-tenant',
          reason: 'Emergency procedure required',
          severity: 'HIGH',
          consultationFee: baseFee
        })
        .expect(201);

      expect(response.body.consultationFee).toBe(expectedTotal);
      expect(response.body.emergencySurcharge).toBe(baseFee * 0.5);
    });

    it('should override provider schedule (even if off-duty)', async () => {
      const providerId = `e2e-emergency-provider-${Date.now()}`;

      // Simulate: Provider is off-duty (no schedule entry)
      // Emergency appointment should still be created

      const response = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId,
          tenantId: 'e2e-tenant',
          reason: 'Critical emergency - provider needed immediately',
          severity: 'CRITICAL',
          overrideSchedule: true
        })
        .expect(201);

      expect(response.body.scheduledOverride).toBe(true);
      expect(response.body.status).toBe('SCHEDULED');
    });
  });

  describe('Emergency Queue Priority', () => {
    it('should place emergency appointment at front of queue', async () => {
      const providerId = `e2e-emergency-provider-${Date.now()}`;

      // Create 2 normal queue entries first
      await request(app)
        .post('/api/queue/join')
        .send({
          patientId: `e2e-queue-patient-1-${Date.now()}`,
          providerId,
          departmentId: 'dept-001',
          priority: 'NORMAL'
        })
        .expect(201);

      await request(app)
        .post('/api/queue/join')
        .send({
          patientId: `e2e-queue-patient-2-${Date.now()}`,
          providerId,
          departmentId: 'dept-001',
          priority: 'NORMAL'
        })
        .expect(201);

      // Add emergency patient to queue
      const emergencyPatientId = `e2e-emergency-patient-${Date.now()}`;
      const emergencyResponse = await request(app)
        .post('/api/queue/join')
        .send({
          patientId: emergencyPatientId,
          providerId,
          departmentId: 'dept-001',
          priority: 'EMERGENCY',
          reason: 'Emergency case - needs immediate attention'
        })
        .expect(201);

      // Check queue status - emergency should be FIRST
      const queueStatusResponse = await request(app)
        .get(`/api/queue/status?providerId=${providerId}`)
        .expect(200);

      const queueEntries = queueStatusResponse.body.entries;
      expect(queueEntries[0].patientId).toBe(emergencyPatientId);
      expect(queueEntries[0].priority).toBe('EMERGENCY');
      expect(queueEntries[0].position).toBe(1);
    });

    it('should automatically check-in emergency appointment', async () => {
      const response = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId: `e2e-emergency-provider-${Date.now()}`,
          tenantId: 'e2e-tenant',
          reason: 'Acute emergency',
          severity: 'HIGH',
          autoCheckIn: true
        })
        .expect(201);

      // Emergency appointments should auto-check-in
      expect(response.body.status).toBe('CHECKED_IN');
    });
  });

  describe('Emergency Notifications', () => {
    it('should publish EmergencyAppointmentCreated event', async () => {
      const patientId = `e2e-emergency-patient-${Date.now()}`;
      const providerId = `e2e-emergency-provider-${Date.now()}`;

      await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId,
          providerId,
          tenantId: 'e2e-tenant',
          reason: 'Critical emergency',
          severity: 'CRITICAL'
        })
        .expect(201);

      // Wait for event to be processed
      await waitFor(2000);

      // Verify event was published to outbox
      const { data: outboxEvents } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'appointments.emergency.created')
        .like('payload->>patientId', patientId)
        .single();

      expect(outboxEvents).toBeDefined();
      expect(outboxEvents.event_type).toBe('appointments.emergency.created');
      expect(JSON.parse(outboxEvents.payload).severity).toBe('CRITICAL');
    });

    it('should notify staff immediately via notification service', async () => {
      const response = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId: `e2e-emergency-provider-${Date.now()}`,
          tenantId: 'e2e-tenant',
          reason: 'Life-threatening emergency',
          severity: 'CRITICAL',
          notifyStaff: ['provider', 'nurse', 'admin']
        })
        .expect(201);

      // Wait for notification events
      await waitFor(1500);

      // Verify notification events were published
      const { data: notificationEvents } = await supabase
        .from('outbox')
        .select('*')
        .eq('event_type', 'notifications.emergency.required')
        .like('payload->>appointmentId', response.body.id);

      expect(notificationEvents?.length).toBeGreaterThan(0);
    });
  });

  describe('Emergency Appointment Validation', () => {
    it('should require severity level', async () => {
      const response = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId: `e2e-emergency-provider-${Date.now()}`,
          tenantId: 'e2e-tenant',
          reason: 'Emergency case'
          // Missing severity
        })
        .expect(400);

      expect(response.body.error).toContain('severity');
    });

    it('should require reason for emergency', async () => {
      const response = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId: `e2e-emergency-provider-${Date.now()}`,
          tenantId: 'e2e-tenant',
          severity: 'HIGH'
          // Missing reason
        })
        .expect(400);

      expect(response.body.error).toContain('reason');
    });

    it('should validate severity levels (LOW, MEDIUM, HIGH, CRITICAL)', async () => {
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      for (const severity of validSeverities) {
        const response = await request(app)
          .post('/api/v1/appointments/emergency')
          .send({
            patientId: `e2e-emergency-patient-${Date.now()}-${severity}`,
            providerId: `e2e-emergency-provider-${Date.now()}`,
            tenantId: 'e2e-tenant',
            reason: `Emergency with ${severity} severity`,
            severity
          })
          .expect(201);

        expect(response.body.severity).toBe(severity);
      }
    });

    it('should reject invalid severity levels', async () => {
      const response = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId: `e2e-emergency-provider-${Date.now()}`,
          tenantId: 'e2e-tenant',
          reason: 'Emergency',
          severity: 'INVALID_SEVERITY'
        })
        .expect(400);

      expect(response.body.error).toContain('severity');
    });
  });

  describe('Emergency Appointment Lifecycle', () => {
    it('should allow immediate transition to IN_PROGRESS', async () => {
      // Create emergency appointment
      const createResponse = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId: `e2e-emergency-provider-${Date.now()}`,
          tenantId: 'e2e-tenant',
          reason: 'Critical emergency',
          severity: 'CRITICAL',
          autoCheckIn: true
        })
        .expect(201);

      const appointmentId = createResponse.body.id;

      // Should allow direct transition to IN_PROGRESS (skip confirmation)
      const startResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/start`)
        .expect(200);

      expect(startResponse.body.status).toBe('IN_PROGRESS');
    });

    it('should track emergency response time', async () => {
      const createResponse = await request(app)
        .post('/api/v1/appointments/emergency')
        .send({
          patientId: `e2e-emergency-patient-${Date.now()}`,
          providerId: `e2e-emergency-provider-${Date.now()}`,
          tenantId: 'e2e-tenant',
          reason: 'Time-sensitive emergency',
          severity: 'HIGH',
          autoCheckIn: true
        })
        .expect(201);

      const appointmentId = createResponse.body.id;
      expect(createResponse.body.emergencyRegisteredAt).toBeDefined();

      // Simulate delay before starting
      await waitFor(1000);

      const startResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/start`)
        .expect(200);

      // Should track time from emergency registration to start
      expect(startResponse.body.emergencyResponseTime).toBeDefined();
      expect(startResponse.body.emergencyResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Emergency Appointment Statistics', () => {
    it('should contribute to emergency metrics', async () => {
      const departmentId = 'dept-emergency-001';

      // Create multiple emergency appointments
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/appointments/emergency')
          .send({
            patientId: `e2e-emergency-patient-${Date.now()}-${i}`,
            providerId: `e2e-emergency-provider-${Date.now()}`,
            tenantId: 'e2e-tenant',
            departmentId,
            reason: `Emergency case ${i}`,
            severity: i === 0 ? 'CRITICAL' : i === 1 ? 'HIGH' : 'MEDIUM'
          })
          .expect(201);

        await waitFor(100);
      }

      // Get emergency statistics
      const statsResponse = await request(app)
        .get(`/api/v1/appointments/statistics?departmentId=${departmentId}&type=EMERGENCY`)
        .expect(200);

      expect(statsResponse.body.totalEmergencies).toBeGreaterThanOrEqual(3);
      expect(statsResponse.body.bySeverity.CRITICAL).toBeGreaterThanOrEqual(1);
      expect(statsResponse.body.bySeverity.HIGH).toBeGreaterThanOrEqual(1);
      expect(statsResponse.body.bySeverity.MEDIUM).toBeGreaterThanOrEqual(1);
    });
  });
});
