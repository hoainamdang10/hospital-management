/**
 * Integration test for exclusion constraint (prevent double-booking)
 * Tests the database-level constraint that prevents overlapping appointments for the same doctor
 * Uses SupabaseAppointmentRepository to test real database constraints
 */

import { SupabaseAppointmentRepository } from '../../../src/infrastructure/persistence/SupabaseAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';

describe('Exclusion Constraint - Prevent Double-Booking', () => {
  let repository: SupabaseAppointmentRepository;
  const testDoctorId = 'TEST-DOC-000001-001';
  const testDoctorId2 = 'TEST-DOC-000002-002';
  const testPatientId1 = 'PAT-000001-001';
  const testPatientId2 = 'PAT-000002-002';
  const tenantId = TenantId.createDefault();
  const createdAppointmentIds: string[] = [];

  // Use future date for tests
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
  const testDateStr = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    repository = new SupabaseAppointmentRepository(supabaseUrl, supabaseKey);
  });

  afterEach(async () => {
    // Cleanup test data
    for (const id of createdAppointmentIds) {
      try {
        await repository.delete(id);
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    createdAppointmentIds.length = 0;
  });

  describe('Exclusion Constraint Enforcement', () => {
    it('should allow non-overlapping appointments for same doctor', async () => {
      // Appointment 1: 09:00 - 09:30
      const start1 = new Date(`${testDateStr}T02:00:00Z`);
      const end1 = new Date(`${testDateStr}T02:30:00Z`);

      const appointment1 = Appointment.create(
        AppointmentId.create('2025-APT-000001-001'),
        tenantId,
        testPatientId1,
        testDoctorId,
        TimeSlot.fromUtcTimestamps(start1, end1),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Test reason'),
        100000,
        'test-user'
      );

      await repository.save(appointment1);
      createdAppointmentIds.push(appointment1.id);

      // Appointment 2: 09:30 - 10:00 (non-overlapping)
      const start2 = new Date(`${testDateStr}T02:30:00Z`);
      const end2 = new Date(`${testDateStr}T03:00:00Z`);

      const appointment2 = Appointment.create(
        AppointmentId.create('2025-APT-000002-002'),
        tenantId,
        testPatientId2,
        testDoctorId,
        TimeSlot.fromUtcTimestamps(start2, end2),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Test reason'),
        100000,
        'test-user'
      );

      await expect(repository.save(appointment2)).resolves.not.toThrow();
      createdAppointmentIds.push(appointment2.id);
    });

    it('should reject overlapping appointments for same doctor (exact overlap)', async () => {
      const start = new Date(`${testDateStr}T03:00:00Z`);
      const end = new Date(`${testDateStr}T03:30:00Z`);

      const appointment1 = Appointment.create(
        AppointmentId.create('2025-APT-000003-003'),
        tenantId,
        testPatientId1,
        testDoctorId,
        TimeSlot.fromUtcTimestamps(start, end),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Test reason'),
        100000,
        'test-user'
      );

      await repository.save(appointment1);
      createdAppointmentIds.push(appointment1.id);

      const appointment2 = Appointment.create(
        AppointmentId.create('2025-APT-000004-004'),
        tenantId,
        testPatientId2,
        testDoctorId,
        TimeSlot.fromUtcTimestamps(start, end),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Test reason'),
        100000,
        'test-user'
      );

      await expect(repository.save(appointment2)).rejects.toThrow(/exclude_doctor_time_overlap/);
    });

    it('should reject overlapping appointments for same doctor (partial overlap)', async () => {
      const start1 = new Date(`${testDateStr}T04:00:00Z`);
      const end1 = new Date(`${testDateStr}T04:30:00Z`);

      const appointment1 = Appointment.create(
        AppointmentId.create('2025-APT-000005-005'),
        tenantId,
        testPatientId1,
        testDoctorId,
        TimeSlot.fromUtcTimestamps(start1, end1),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Test reason'),
        100000,
        'test-user'
      );

      await repository.save(appointment1);
      createdAppointmentIds.push(appointment1.id);

      const start2 = new Date(`${testDateStr}T04:15:00Z`);
      const end2 = new Date(`${testDateStr}T04:45:00Z`);

      const appointment2 = Appointment.create(
        AppointmentId.create('2025-APT-000006-006'),
        tenantId,
        testPatientId2,
        testDoctorId,
        TimeSlot.fromUtcTimestamps(start2, end2),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Test reason'),
        100000,
        'test-user'
      );

      await expect(repository.save(appointment2)).rejects.toThrow(/exclude_doctor_time_overlap/);
    });

    it('should allow same time slots for different doctors', async () => {
      const start = new Date(`${testDateStr}T10:00:00Z`);
      const end = new Date(`${testDateStr}T10:30:00Z`);

      const appointment1 = Appointment.create(
        AppointmentId.create('2025-APT-000013-013'),
        tenantId,
        testPatientId1,
        testDoctorId,
        TimeSlot.fromUtcTimestamps(start, end),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Test reason'),
        100000,
        'test-user'
      );

      await repository.save(appointment1);
      createdAppointmentIds.push(appointment1.id);

      const appointment2 = Appointment.create(
        AppointmentId.create('2025-APT-000014-014'),
        tenantId,
        testPatientId2,
        testDoctorId2,
        TimeSlot.fromUtcTimestamps(start, end),
        30,
        AppointmentType.CONSULTATION,
        AppointmentPriority.NORMAL,
        AppointmentDetails.create('Test reason'),
        100000,
        'test-user'
      );

      await expect(repository.save(appointment2)).resolves.not.toThrow();
      createdAppointmentIds.push(appointment2.id);
    });
  });
});

