/**
 * Supabase Appointment Repository Integration Tests
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { SupabaseAppointmentRepository } from '../../src/infrastructure/persistence/SupabaseAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority } from '../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../src/domain/value-objects/AppointmentDetails.vo';

describe('SupabaseAppointmentRepository Integration Tests', () => {
  let repository: SupabaseAppointmentRepository;
  let testAppointment: Appointment;

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }

    repository = new SupabaseAppointmentRepository(supabaseUrl, supabaseKey);
  });

  beforeEach(() => {
    testAppointment = createTestAppointment();
  });

  describe('save', () => {
    it('should save new appointment to database', async () => {
      await repository.save(testAppointment);

      const found = await repository.findById(testAppointment.id);
      expect(found).toBeDefined();
      expect(found?.getAppointmentId().value).toBe(testAppointment.getAppointmentId().value);
    });

    it('should update existing appointment', async () => {
      await repository.save(testAppointment);

      testAppointment.confirm('user-123');
      await repository.save(testAppointment);

      const found = await repository.findById(testAppointment.id);
      expect(found?.getStatus()).toBe('confirmed');
      expect(found?.getConfirmedBy()).toBe('user-123');
    });
  });

  describe('findById', () => {
    it('should find appointment by UUID', async () => {
      await repository.save(testAppointment);

      const found = await repository.findById(testAppointment.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(testAppointment.id);
      expect(found?.getPatientId()).toBe(testAppointment.getPatientId());
      expect(found?.getDoctorId()).toBe(testAppointment.getDoctorId());
    });

    it('should return null when appointment not found', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByAppointmentId', () => {
    it('should find appointment by appointment_id', async () => {
      await repository.save(testAppointment);

      const found = await repository.findByAppointmentId(testAppointment.getAppointmentId().value);

      expect(found).toBeDefined();
      expect(found?.getAppointmentId().value).toBe(testAppointment.getAppointmentId().value);
    });

    it('should return null when appointment_id not found', async () => {
      const found = await repository.findByAppointmentId('XXXX-APT-XXXXXX-XXX');
      expect(found).toBeNull();
    });
  });

  describe('findByPatientId', () => {
    it('should find all appointments for a patient', async () => {
      const appointment1 = createTestAppointment();
      const appointment2 = createTestAppointment();
      
      await repository.save(appointment1);
      await repository.save(appointment2);

      const found = await repository.findByPatientId('patient-123');
      
      expect(found.length).toBeGreaterThanOrEqual(2);
      expect(found.every(apt => apt.patientId === 'patient-123')).toBe(true);
    });

    it('should return empty array when no appointments found', async () => {
      const found = await repository.findByPatientId('non-existent-patient');
      expect(found).toEqual([]);
    });
  });

  describe('findByDoctorId', () => {
    it('should find all appointments for a doctor', async () => {
      const appointment1 = createTestAppointment();
      const appointment2 = createTestAppointment();
      
      await repository.save(appointment1);
      await repository.save(appointment2);

      const found = await repository.findByDoctorId('doctor-456');
      
      expect(found.length).toBeGreaterThanOrEqual(2);
      expect(found.every(apt => apt.doctorId === 'doctor-456')).toBe(true);
    });
  });

  describe('findByDateRange', () => {
    it('should find appointments within date range', async () => {
      const appointment1 = createTestAppointment();
      await repository.save(appointment1);

      const found = await repository.findByDateRange('2025-01-01', '2025-01-31');
      
      expect(found.length).toBeGreaterThanOrEqual(1);
      expect(found.some(apt => apt.appointmentId.value === appointment1.appointmentId.value)).toBe(true);
    });

    it('should return empty array when no appointments in range', async () => {
      const found = await repository.findByDateRange('2030-01-01', '2030-01-31');
      expect(found).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete appointment from database', async () => {
      await repository.save(testAppointment);
      
      await repository.delete(testAppointment.id);

      const found = await repository.findById(testAppointment.id);
      expect(found).toBeNull();
    });
  });

  describe('domain reconstruction', () => {
    it('should correctly reconstruct domain aggregate from database', async () => {
      testAppointment.confirm('user-123');
      testAppointment.checkIn();
      testAppointment.start();

      await repository.save(testAppointment);

      const found = await repository.findById(testAppointment.id);

      expect(found).toBeDefined();
      expect(found?.getStatus()).toBe('in_progress');
      expect(found?.getConfirmedAt()).toBeDefined();
      expect(found?.getCheckedInAt()).toBeDefined();
      expect(found?.getStartedAt()).toBeDefined();
    });

    it('should preserve all value objects', async () => {
      await repository.save(testAppointment);

      const found = await repository.findById(testAppointment.id);

      expect(found?.getAppointmentId().value).toBe(testAppointment.getAppointmentId().value);
      expect(found?.getTimeSlot().appointmentDate).toBe(testAppointment.getTimeSlot().appointmentDate);
      expect(found?.getTimeSlot().appointmentTime).toBe(testAppointment.getTimeSlot().appointmentTime);
      expect(found?.getDetails().reason).toBe(testAppointment.getDetails().reason);
    });
  });

  afterEach(async () => {
    // Cleanup: delete test appointment
    try {
      await repository.delete(testAppointment.id);
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
});

// Helper function
function getFutureDate(daysAhead: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

function createTestAppointment(): Appointment {
  const appointmentId = AppointmentId.generate();
  const timeSlot = TimeSlot.create(getFutureDate(), '09:00:00');
  const details = AppointmentDetails.create(
    'Khám tổng quát',
    'Đau đầu',
    ['Sốt', 'Mệt mỏi'],
    'Bệnh nhân cần khám gấp',
    'Nhịn ăn trước khi khám'
  );

  return Appointment.create(
    appointmentId,
    'patient-123',
    'doctor-456',
    timeSlot,
    30,
    AppointmentType.CONSULTATION,
    AppointmentPriority.ROUTINE,
    details,
    200000,
    'user-789'
  );
}

