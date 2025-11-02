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
import { TenantId } from '../../src/domain/value-objects/TenantId.vo';
import { AppointmentTestDataBuilder } from '../helpers/AppointmentTestDataBuilder';

describe('SupabaseAppointmentRepository Integration Tests', () => {
  let repository: SupabaseAppointmentRepository;
  let testAppointment: Appointment;
  const createdAppointments: AppointmentId[] = [];

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }

    repository = new SupabaseAppointmentRepository(supabaseUrl, supabaseKey);
  });

  beforeEach(() => {
    AppointmentTestDataBuilder.reset();
    testAppointment = createTestAppointment();
  });

  describe('save', () => {
    it('should save new appointment to database', async () => {
      await repository.save(testAppointment);

      const found = await repository.findByIdString(testAppointment.id);
      expect(found).toBeDefined();
      expect(found?.getAppointmentId().value).toBe(testAppointment.getAppointmentId().value);
    });

    it('should update existing appointment', async () => {
      await repository.save(testAppointment);

      testAppointment.confirm('user-123');
      await repository.save(testAppointment);

      const found = await repository.findByIdString(testAppointment.id);
      expect(found?.getStatus()).toBe('confirmed');
      expect(found?.getConfirmedBy()).toBe('user-123');
    });
  });

  describe('findById', () => {
    it('should find appointment by UUID', async () => {
      await repository.save(testAppointment);

      const found = await repository.findByIdString(testAppointment.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(testAppointment.id);
      expect(found?.getPatientId()).toBe(testAppointment.getPatientId());
      expect(found?.getDoctorId()).toBe(testAppointment.getDoctorId());
    });

    it('should return null when appointment not found', async () => {
      const nonExistentId = AppointmentId.generate();
      const found = await repository.findById(nonExistentId);
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
      const testPatientId = AppointmentTestDataBuilder.generatePatientId();
      const appointment1 = createTestAppointmentWithData({ patientId: testPatientId });
      const appointment2 = createTestAppointmentWithData({ patientId: testPatientId, offsetHours: 2 });
      
      await repository.save(appointment1);
      createdAppointments.push(appointment1.getAppointmentId());
      
      await repository.save(appointment2);
      createdAppointments.push(appointment2.getAppointmentId());

      const found = await repository.findByPatientId(testPatientId);
      
      expect(found.length).toBeGreaterThanOrEqual(2);
      expect(found.every(apt => apt.getPatientId() === testPatientId)).toBe(true);
    });

    it('should return empty array when no appointments found', async () => {
      const found = await repository.findByPatientId('PAT-999999-999');
      expect(found).toEqual([]);
    });
  });

  describe('findByDoctorId', () => {
    it('should find all appointments for a doctor', async () => {
      const testDoctorId = AppointmentTestDataBuilder.generateDoctorId();
      const appointment1 = createTestAppointmentWithData({ doctorId: testDoctorId });
      const appointment2 = createTestAppointmentWithData({ doctorId: testDoctorId, offsetHours: 2 });
      
      await repository.save(appointment1);
      createdAppointments.push(appointment1.getAppointmentId());
      
      await repository.save(appointment2);
      createdAppointments.push(appointment2.getAppointmentId());

      const found = await repository.findByDoctorId(testDoctorId);
      
      expect(found.length).toBeGreaterThanOrEqual(2);
      expect(found.every(apt => apt.getDoctorId() === testDoctorId)).toBe(true);
    });
  });

  describe('findByDateRange', () => {
    it('should find appointments within date range', async () => {
      const appointment1 = createTestAppointment();
      await repository.save(appointment1);
      createdAppointments.push(appointment1.getAppointmentId());

      // Use specific date of the appointment as range (UTC midnight)
      const appointmentDate = new Date(appointment1.getTimeSlot().appointmentDate + 'T00:00:00Z');
      const startDate = new Date(appointmentDate);
      startDate.setUTCDate(appointmentDate.getUTCDate() - 1); // Day before
      const endDate = new Date(appointmentDate);
      endDate.setUTCDate(appointmentDate.getUTCDate() + 1); // Day after
      
      const found = await repository.findByDateRange(startDate, endDate);
      
      // Should find the appointment we just created
      const match = found.find(apt => apt.getAppointmentId().value === appointment1.getAppointmentId().value);
      expect(match).toBeDefined();
      expect(match?.getDoctorId()).toBe(appointment1.getDoctorId());
    });

    it('should return empty array when no appointments in range', async () => {
      const found = await repository.findByDateRange(new Date('2030-01-01'), new Date('2030-01-31'));
      expect(found).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete appointment from database', async () => {
      await repository.save(testAppointment);
      
      await repository.delete(testAppointment.getAppointmentId());

      const found = await repository.findByIdString(testAppointment.id);
      expect(found).toBeNull();
    });
  });

  describe('domain reconstruction', () => {
    it('should correctly reconstruct domain aggregate from database', async () => {
      testAppointment.confirm('user-123');
      testAppointment.checkIn();
      testAppointment.start();

      await repository.save(testAppointment);

      const found = await repository.findByIdString(testAppointment.id);

      expect(found).toBeDefined();
      expect(found?.getStatus()).toBe('in_progress');
      expect(found?.getConfirmedAt()).toBeDefined();
      expect(found?.getCheckedInAt()).toBeDefined();
      expect(found?.getStartedAt()).toBeDefined();
    });

    it('should preserve all value objects', async () => {
      await repository.save(testAppointment);

      const found = await repository.findByIdString(testAppointment.id);

      expect(found?.getAppointmentId().value).toBe(testAppointment.getAppointmentId().value);
      expect(found?.getTimeSlot().appointmentDate).toBe(testAppointment.getTimeSlot().appointmentDate);
      expect(found?.getTimeSlot().appointmentTime).toBe(testAppointment.getTimeSlot().appointmentTime);
      expect(found?.getDetails().reason).toBe(testAppointment.getDetails().reason);
    });
  });

  afterEach(async () => {
    // Cleanup: delete all created appointments
    for (const appointmentId of createdAppointments) {
      try {
        await repository.delete(appointmentId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    
    // Also try to delete the main test appointment
    try {
      await repository.delete(testAppointment.getAppointmentId());
    } catch (error) {
      // Ignore errors during cleanup
    }
    
    // Clear the array for next test
    createdAppointments.length = 0;
  });
});

// Test fixtures - Business format IDs (matching DB schema)
const TEST_USER_UUID = '00000000-0000-0000-0000-000000000003'; // created_by/last_modified_by: UUID

// Helper functions
function createTestAppointment(): Appointment {
  const testData = AppointmentTestDataBuilder.generateNonOverlappingAppointment();
  return createAppointmentFromData(testData);
}

function createTestAppointmentWithData(options: {
  doctorId?: string;
  patientId?: string;
  offsetHours?: number;
}): Appointment {
  const testData = AppointmentTestDataBuilder.generateNonOverlappingAppointment(options);
  return createAppointmentFromData(testData);
}

function createAppointmentFromData(data: any): Appointment {
  const appointmentId = AppointmentId.generate();
  const tenantId = TenantId.createDefault();
  const timeSlot = TimeSlot.create(data.appointmentDate, data.appointmentTime);
  const details = AppointmentDetails.create(
    'Khám tổng quát',
    'Đau đầu',
    ['Sốt', 'Mệt mỏi'],
    'Bệnh nhân cần khám gấp',
    'Nhịn ăn trước khi khám'
  );

  return Appointment.create(
    appointmentId,
    tenantId,
    data.patientId,
    data.doctorId,
    timeSlot,
    data.durationMinutes,
    AppointmentType.CONSULTATION,
    AppointmentPriority.NORMAL,
    details,
    200000,
    'test-user', // createdBy
    undefined, // roomId
    undefined, // departmentId
    undefined  // requiredEquipment
  );
}

