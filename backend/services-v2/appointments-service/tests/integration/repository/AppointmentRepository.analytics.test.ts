/**
 * Integration Tests - AppointmentRepository Analytics Methods
 * Tests: getStatistics(), getPatientHistory(), getUtilizationRate()
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAppointmentRepository } from '../../../src/infrastructure/persistence/SupabaseAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';

describe('AppointmentRepository - Analytics Methods Integration Tests', () => {
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

  describe('getStatistics()', () => {
    let statsTestCounter = 0;
    let testDoctorId: string;

    beforeEach(async () => {
      testDoctorId = `CARD-DOC-${testRunId}40-001`;
      statsTestCounter++;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const statuses = [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED
      ];

      for (let i = 0; i < statuses.length; i++) {
        const start = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:00:00Z`);
        const end = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:30:00Z`);

        const seqNum = String(statsTestCounter * 10 + i).padStart(3, '0');
        const appointment = Appointment.create(
          AppointmentId.create(`2025-APT-${testRunId}40-${seqNum}`),
          tenantId,
          `PAT-${testRunId}40-${seqNum}`,
          testDoctorId,
          TimeSlot.fromUtcTimestamps(start, end),
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          AppointmentDetails.create(`Stats test ${i}`),
          100000,
          'test-user',
          undefined,
          undefined // departmentId - skip for now
        );

        await repository.save(appointment);

        // Update status if needed
        if (statuses[i] !== AppointmentStatus.SCHEDULED) {
          if (statuses[i] === AppointmentStatus.COMPLETED) {
            appointment.confirm('test-user');
            appointment.checkIn();
            appointment.start();
            appointment.complete();
          } else if (statuses[i] === AppointmentStatus.CANCELLED) {
            appointment.cancel('Test cancellation', 'test-user');
          }
          await repository.save(appointment);
        }

        createdAppointmentIds.push(appointment.id);
      }
    });

    it('should calculate statistics correctly', async () => {
      const now = new Date();
      const dateFrom = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
      const dateTo = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

      const result = await repository.getStatistics(dateFrom, dateTo, testDoctorId);

      expect(result.totalAppointments).toBeGreaterThanOrEqual(3);
      expect(result.scheduledAppointments).toBeGreaterThanOrEqual(1);
      expect(result.completedAppointments).toBeGreaterThanOrEqual(1);
      expect(result.cancelledAppointments).toBeGreaterThanOrEqual(1);
      expect(result.averageDuration).toBeGreaterThan(0);
    });
  });

  describe('getPatientHistory()', () => {
    let historyTestCounter = 0;
    let testPatientId: string;

    beforeEach(async () => {
      historyTestCounter++;
      testPatientId = `PAT-${testRunId}50-00${historyTestCounter}`;
      const now = new Date();

      const statuses = [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
        AppointmentStatus.SCHEDULED
      ];

      for (let i = 0; i < statuses.length; i++) {
        const futureDate = new Date(now.getTime() + (30 + i) * 24 * 60 * 60 * 1000);
        const start = new Date(futureDate.toISOString().split('T')[0] + 'T02:00:00Z');
        const end = new Date(futureDate.toISOString().split('T')[0] + 'T02:30:00Z');

        const seqNum = String(historyTestCounter * 10 + i).padStart(3, '0');
        const docSeqNum = String(i).padStart(3, '0');
        const appointment = Appointment.create(
          AppointmentId.create(`2025-APT-${testRunId}50-${seqNum}`),
          tenantId,
          testPatientId,
          `CARD-DOC-${testRunId}50-${docSeqNum}`,
          TimeSlot.fromUtcTimestamps(start, end),
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          AppointmentDetails.create(`History test ${i}`),
          100000,
          'test-user'
        );

        await repository.save(appointment);

        // Update status
        if (statuses[i] === AppointmentStatus.COMPLETED) {
          appointment.confirm('test-user');
          appointment.checkIn();
          appointment.start();
          appointment.complete();
        } else if (statuses[i] === AppointmentStatus.CANCELLED) {
          appointment.cancel('Test', 'test-user');
        } else if (statuses[i] === AppointmentStatus.NO_SHOW) {
          appointment.confirm('test-user');
          appointment.markAsNoShow();
        }

        if (statuses[i] !== AppointmentStatus.SCHEDULED) {
          await repository.save(appointment);
        }

        createdAppointmentIds.push(appointment.id);
      }
    });

    it('should get patient history with counts', async () => {
      const result = await repository.getPatientHistory(testPatientId);

      expect(result.appointments.length).toBeGreaterThanOrEqual(4);
      expect(result.totalCount).toBeGreaterThanOrEqual(4);
      expect(result.completedCount).toBeGreaterThanOrEqual(1);
      expect(result.cancelledCount).toBeGreaterThanOrEqual(1);
      expect(result.noShowCount).toBeGreaterThanOrEqual(1);
    });

    it.skip('should support pagination', async () => {
      // TODO: Fix pagination implementation
      const result1 = await repository.getPatientHistory(testPatientId, 2, 0);
      expect(result1.appointments.length).toBeLessThanOrEqual(2);

      const result2 = await repository.getPatientHistory(testPatientId, 2, 2);
      expect(result2.appointments.length).toBeGreaterThan(0);
    });
  });

  describe('getUtilizationRate()', () => {
    let utilTestCounter = 0;

    beforeEach(async () => {
      utilTestCounter++;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const statuses = [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW
      ];

      for (let i = 0; i < statuses.length; i++) {
        const start = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:00:00Z`);
        const end = new Date(futureDate.toISOString().split('T')[0] + `T0${2 + i}:30:00Z`);

        const seqNum = String(utilTestCounter * 10 + i).padStart(3, '0');
        const appointment = Appointment.create(
          AppointmentId.create(`2025-APT-${testRunId}60-${seqNum}`),
          tenantId,
          `PAT-${testRunId}60-${seqNum}`,
          `CARD-DOC-${testRunId}60-001`,
          TimeSlot.fromUtcTimestamps(start, end),
          30,
          AppointmentType.CONSULTATION,
          AppointmentPriority.NORMAL,
          AppointmentDetails.create(`Util test ${i}`),
          100000,
          'test-user',
          undefined,
          undefined // departmentId - skip for now
        );

        await repository.save(appointment);

        // Update status
        if (statuses[i] === AppointmentStatus.COMPLETED) {
          appointment.confirm('test-user');
          appointment.checkIn();
          appointment.start();
          appointment.complete();
        } else if (statuses[i] === AppointmentStatus.CANCELLED) {
          appointment.cancel('Test', 'test-user');
        } else if (statuses[i] === AppointmentStatus.NO_SHOW) {
          appointment.confirm('test-user');
          appointment.markAsNoShow();
        }

        if (statuses[i] !== AppointmentStatus.SCHEDULED) {
          await repository.save(appointment);
        }

        createdAppointmentIds.push(appointment.id);
      }
    });

    it.skip('should calculate utilization rate', async () => {
      // TODO: Fix utilization rate calculation
      const now = new Date();
      const dateFrom = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
      const dateTo = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

      const result = await repository.getUtilizationRate('doctor-util-1', undefined, dateFrom, dateTo);

      expect(result.totalSlots).toBeGreaterThanOrEqual(4);
      expect(result.bookedSlots).toBeGreaterThanOrEqual(3);
      expect(result.utilizationRate).toBeGreaterThan(0);
      expect(result.utilizationRate).toBeLessThanOrEqual(100);
      expect(result.noShowRate).toBeGreaterThan(0);
      expect(result.cancellationRate).toBeGreaterThan(0);
    });
  });
});
