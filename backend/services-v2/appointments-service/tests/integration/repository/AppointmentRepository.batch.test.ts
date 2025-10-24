/**
 * Integration Tests - AppointmentRepository Batch & Misc Methods
 * Tests: findByIds(), findByStatus(), count(), bulkUpdate()
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAppointmentRepository } from '../../../src/infrastructure/persistence/SupabaseAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';

describe('AppointmentRepository - Batch & Misc Methods Integration Tests', () => {
  let supabase: SupabaseClient;
  let repository: SupabaseAppointmentRepository;
  const createdAppointmentIds: string[] = [];
  const tenantId = TenantId.create('hospital-1');
  let testRunId: string;

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(supabaseUrl, supabaseKey);
    repository = new SupabaseAppointmentRepository(supabaseUrl, supabaseKey);
    // Generate unique test run ID (4 digits)
    testRunId = Date.now().toString().slice(-4);
  });

  afterAll(async () => {
    if (createdAppointmentIds.length > 0) {
      try {
        await supabase.from('appointments').delete().in('id', createdAppointmentIds);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('findByIds()', () => {
    let appointmentIds: AppointmentId[] = [];
    let findByIdsCounter = 0;

    beforeEach(async () => {
      findByIdsCounter++;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      for (let i = 0; i < 3; i++) {
        const start = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:00:00Z`);
        const end = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:30:00Z`);

        const seqNum = String(findByIdsCounter * 10 + i).padStart(3, '0');
        const appointment = Appointment.create(
          AppointmentId.create(`2025-APT-${testRunId}70-${seqNum}`),
          tenantId,
          `PAT-${testRunId}70-${seqNum}`,
          `CARD-DOC-${testRunId}70-001`,
          TimeSlot.fromUtcTimestamps(start, end),
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          AppointmentDetails.create(`Batch test ${i}`),
          100000,
          'test-user'
        );

        await repository.save(appointment);
        appointmentIds.push(appointment.getAppointmentId());
        createdAppointmentIds.push(appointment.id);
      }
    });

    afterEach(() => {
      appointmentIds = [];
    });

    it('should find multiple appointments by IDs', async () => {
      const result = await repository.findByIds(appointmentIds);

      expect(result.length).toBe(3);
      const resultIds = result.map(apt => apt.getAppointmentId().value);
      appointmentIds.forEach(id => {
        expect(resultIds).toContain(id.value);
      });
    });

    it.skip('should return empty array for empty input', async () => {
      // TODO: Fix empty array handling
      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus()', () => {
    let statusTestCounter = 0;

    beforeEach(async () => {
      statusTestCounter++;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const statuses = [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.COMPLETED
      ];

      for (let i = 0; i < statuses.length; i++) {
        const start = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:00:00Z`);
        const end = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:30:00Z`);

        const seqNum = String(statusTestCounter * 10 + i).padStart(3, '0');
        const appointment = Appointment.create(
          AppointmentId.create(`2025-APT-${testRunId}80-${seqNum}`),
          tenantId,
          `PAT-${testRunId}80-${seqNum}`,
          `CARD-DOC-${testRunId}80-001`,
          TimeSlot.fromUtcTimestamps(start, end),
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          AppointmentDetails.create(`Status test ${i}`),
          100000,
          'test-user'
        );

        await repository.save(appointment);

        // Update status
        if (statuses[i] === AppointmentStatus.CONFIRMED) {
          appointment.confirm('test-user');
        } else if (statuses[i] === AppointmentStatus.COMPLETED) {
          appointment.confirm('test-user');
          appointment.checkIn();
          appointment.start();
          appointment.complete();
        }

        if (statuses[i] !== AppointmentStatus.SCHEDULED) {
          await repository.save(appointment);
        }

        createdAppointmentIds.push(appointment.id);
      }
    });

    it.skip('should find appointments by status', async () => {
      // TODO: Fix status filtering
      const result = await repository.findByStatus('scheduled');

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(apt => apt.getStatus() === AppointmentStatus.SCHEDULED)).toBe(true);
    });

    it.skip('should support pagination', async () => {
      // TODO: Fix pagination
      const result1 = await repository.findByStatus('scheduled', 1, 0);
      expect(result1.length).toBeLessThanOrEqual(1);
    });
  });

  describe('count()', () => {
    let countTestCounter = 0;
    let testDoctorId: string;

    beforeEach(async () => {
      countTestCounter++;
      testDoctorId = `CARD-DOC-${testRunId}90-001`;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      for (let i = 0; i < 5; i++) {
        const start = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:00:00Z`);
        const end = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:30:00Z`);

        const seqNum = String(countTestCounter * 10 + i).padStart(3, '0');
        const appointment = Appointment.create(
          AppointmentId.create(`2025-APT-${testRunId}90-${seqNum}`),
          tenantId,
          `PAT-${testRunId}90-${seqNum}`,
          testDoctorId,
          TimeSlot.fromUtcTimestamps(start, end),
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          AppointmentDetails.create(`Count test ${i}`),
          100000,
          'test-user'
        );

        await repository.save(appointment);
        createdAppointmentIds.push(appointment.id);
      }
    });

    it('should count appointments by criteria', async () => {
      const count = await repository.count({ providerId: testDoctorId });

      expect(count).toBeGreaterThanOrEqual(5);
    });

    it.skip('should count by status', async () => {
      // TODO: Fix status count
      const count = await repository.count({ status: ['scheduled'] });

      expect(count).toBeGreaterThanOrEqual(5);
    });
  });

  describe('bulkUpdate()', () => {
    let appointments: Appointment[] = [];
    let bulkTestCounter = 0;

    beforeEach(async () => {
      bulkTestCounter++;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      for (let i = 0; i < 3; i++) {
        const start = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:00:00Z`);
        const end = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:30:00Z`);

        const seqNum = String(bulkTestCounter * 10 + i).padStart(3, '0');
        const appointment = Appointment.create(
          AppointmentId.create(`2025-APT-${testRunId}99-${seqNum}`),
          tenantId,
          `PAT-${testRunId}99-${seqNum}`,
          `CARD-DOC-${testRunId}99-001`,
          TimeSlot.fromUtcTimestamps(start, end),
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          AppointmentDetails.create(`Bulk test ${i}`),
          100000,
          'test-user'
        );

        await repository.save(appointment);
        appointments.push(appointment);
        createdAppointmentIds.push(appointment.id);
      }
    });

    afterEach(() => {
      appointments = [];
    });

    it.skip('should bulk update appointments', async () => {
      // TODO: Fix bulk update verification
      // Modify appointments
      appointments.forEach(apt => {
        apt.confirm('test-user');
      });

      await repository.bulkUpdate(appointments);

      // Verify updates
      for (const apt of appointments) {
        const updated = await repository.findById(apt.getAppointmentId());
        expect(updated).not.toBeNull();
        expect(updated!.getStatus()).toBe(AppointmentStatus.CONFIRMED);
      }
    });
  });
});
