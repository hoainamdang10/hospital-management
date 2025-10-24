/**
 * Integration Tests - AppointmentRepository Search Methods
 * Tests: search(), checkConflicts(), findUpcoming*()
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAppointmentRepository } from '../../../src/infrastructure/persistence/SupabaseAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';
import { AppointmentSearchCriteria } from '../../../src/domain/repositories/IAppointmentRepository';

describe('AppointmentRepository - Search Methods Integration Tests', () => {
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
    // Generate unique test run ID (4 digits for MMDDSS part)
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

  describe('search()', () => {
    let searchTestCounter = 0;

    beforeEach(async () => {
      searchTestCounter++;
      const now = new Date();
      const futureDate1 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const futureDate2 = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

      const start1 = new Date(futureDate1.toISOString().split('T')[0] + 'T02:00:00Z');
      const end1 = new Date(futureDate1.toISOString().split('T')[0] + 'T02:30:00Z');

      const appointment1 = Appointment.create(
        AppointmentId.create(`2025-APT-${testRunId}01-00${searchTestCounter}`),
        tenantId,
        `PAT-${testRunId}01-00${searchTestCounter}`,
        `CARD-DOC-${testRunId}01-00${searchTestCounter}`,
        TimeSlot.fromUtcTimestamps(start1, end1),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Search test 1'),
        100000,
        'test-user',
        undefined,
        undefined // departmentId - skip for now
      );

      const start2 = new Date(futureDate2.toISOString().split('T')[0] + 'T03:00:00Z');
      const end2 = new Date(futureDate2.toISOString().split('T')[0] + 'T03:45:00Z');

      const appointment2 = Appointment.create(
        AppointmentId.create(`2025-APT-${testRunId}02-00${searchTestCounter}`),
        tenantId,
        `PAT-${testRunId}02-00${searchTestCounter}`,
        `CARD-DOC-${testRunId}01-00${searchTestCounter}`,
        TimeSlot.fromUtcTimestamps(start2, end2),
        45,
        AppointmentType.FOLLOW_UP,
        AppointmentPriority.URGENT,
        AppointmentDetails.create('Search test 2'),
        150000,
        'test-user',
        undefined,
        undefined // departmentId - skip for now
      );

      await repository.save(appointment1);
      await repository.save(appointment2);

      createdAppointmentIds.push(appointment1.id);
      createdAppointmentIds.push(appointment2.id);
    });

    it('should search by providerId', async () => {
      const doctorId = `CARD-DOC-${testRunId}01-00${searchTestCounter}`;
      const criteria: AppointmentSearchCriteria = {
        providerId: doctorId,
        limit: 10,
        offset: 0
      };

      const result = await repository.search(criteria);

      expect(result.appointments.length).toBeGreaterThanOrEqual(2);
      expect(result.totalCount).toBeGreaterThanOrEqual(2);
      expect(result.appointments.every(apt => apt.getDoctorId() === doctorId)).toBe(true);
    });

    it.skip('should search by department', async () => {
      // TODO: Implement when department service is ready with real UUIDs
      const criteria: AppointmentSearchCriteria = {
        department: 'dept-cardiology',
        limit: 10,
        offset: 0
      };

      const result = await repository.search(criteria);

      expect(result.appointments.length).toBeGreaterThanOrEqual(1);
      expect(result.appointments.some(apt => apt.getDepartmentId() === 'dept-cardiology')).toBe(true);
    });

    it('should search by status', async () => {
      const criteria: AppointmentSearchCriteria = {
        status: ['scheduled'],
        limit: 10,
        offset: 0
      };

      const result = await repository.search(criteria);

      expect(result.appointments.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const doctorId = `CARD-DOC-${testRunId}01-00${searchTestCounter}`;
      const criteria1: AppointmentSearchCriteria = {
        providerId: doctorId,
        limit: 1,
        offset: 0
      };

      const result1 = await repository.search(criteria1);
      expect(result1.appointments.length).toBe(1);
      expect(result1.hasMore).toBe(true);

      const criteria2: AppointmentSearchCriteria = {
        providerId: doctorId,
        limit: 1,
        offset: 1
      };

      const result2 = await repository.search(criteria2);
      expect(result2.appointments.length).toBe(1);
      expect(result1.appointments[0].id).not.toBe(result2.appointments[0].id);
    });
  });

  describe('checkConflicts()', () => {
    let testDoctorId: string;
    let existingAppointmentId: string;
    let testDateStr: string;
    let conflictTestCounter = 0;

    beforeEach(async () => {
      conflictTestCounter++;
      testDoctorId = `NEUR-DOC-${testRunId}10-00${conflictTestCounter}`;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      testDateStr = futureDate.toISOString().split('T')[0];

      const start = new Date(`${testDateStr}T02:00:00Z`);
      const end = new Date(`${testDateStr}T02:30:00Z`);

      const existingAppointment = Appointment.create(
        AppointmentId.create(`2025-APT-${testRunId}10-00${conflictTestCounter}`),
        tenantId,
        `PAT-${testRunId}10-00${conflictTestCounter}`,
        testDoctorId,
        TimeSlot.fromUtcTimestamps(start, end),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Conflict test'),
        100000,
        'test-user'
      );

      await repository.save(existingAppointment);
      existingAppointmentId = existingAppointment.getAppointmentId().value;
      createdAppointmentIds.push(existingAppointment.id);
    });

    it('should detect overlapping appointments', async () => {
      const startTime = new Date(`${testDateStr}T02:15:00Z`);
      const endTime = new Date(`${testDateStr}T02:45:00Z`);

      const result = await repository.checkConflicts(testDoctorId, startTime, endTime);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should not detect conflicts for non-overlapping times', async () => {
      const startTime = new Date(`${testDateStr}T03:00:00Z`);
      const endTime = new Date(`${testDateStr}T03:30:00Z`);

      const result = await repository.checkConflicts(testDoctorId, startTime, endTime);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts.length).toBe(0);
    });

    it('should exclude specific appointment when checking conflicts', async () => {
      const startTime = new Date(`${testDateStr}T02:00:00Z`);
      const endTime = new Date(`${testDateStr}T02:30:00Z`);

      const result = await repository.checkConflicts(
        testDoctorId,
        startTime,
        endTime,
        existingAppointmentId
      );

      expect(result.hasConflicts).toBe(false);
    });
  });

  describe('findUpcomingByPatientId()', () => {
    let upcomingPatientCounter = 0;

    beforeEach(async () => {
      upcomingPatientCounter++;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const start = new Date(futureDate.toISOString().split('T')[0] + 'T02:00:00Z');
      const end = new Date(futureDate.toISOString().split('T')[0] + 'T02:30:00Z');

      const appointment = Appointment.create(
        AppointmentId.create(`2025-APT-${testRunId}20-00${upcomingPatientCounter}`),
        tenantId,
        `PAT-${testRunId}20-00${upcomingPatientCounter}`,
        `CARD-DOC-${testRunId}20-00${upcomingPatientCounter}`,
        TimeSlot.fromUtcTimestamps(start, end),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Upcoming test'),
        100000,
        'test-user'
      );

      await repository.save(appointment);
      createdAppointmentIds.push(appointment.id);
    });

    it('should find upcoming appointments for patient', async () => {
      const patientId = `PAT-${testRunId}20-00${upcomingPatientCounter}`;
      const result = await repository.findUpcomingByPatientId(patientId);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(apt => apt.patientId === patientId)).toBe(true);
    });
  });

  describe('findUpcomingByProviderId()', () => {
    let upcomingProviderCounter = 0;

    beforeEach(async () => {
      upcomingProviderCounter++;
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const start = new Date(futureDate.toISOString().split('T')[0] + 'T02:00:00Z');
      const end = new Date(futureDate.toISOString().split('T')[0] + 'T02:30:00Z');

      const appointment = Appointment.create(
        AppointmentId.create(`2025-APT-${testRunId}30-00${upcomingProviderCounter}`),
        tenantId,
        `PAT-${testRunId}30-00${upcomingProviderCounter}`,
        `NEUR-DOC-${testRunId}30-00${upcomingProviderCounter}`,
        TimeSlot.fromUtcTimestamps(start, end),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Upcoming test'),
        100000,
        'test-user'
      );

      await repository.save(appointment);
      createdAppointmentIds.push(appointment.id);
    });

    it('should find upcoming appointments for provider', async () => {
      const doctorId = `NEUR-DOC-${testRunId}30-00${upcomingProviderCounter}`;
      const result = await repository.findUpcomingByProviderId(doctorId);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(apt => apt.getDoctorId() === doctorId)).toBe(true);
    });
  });
});
