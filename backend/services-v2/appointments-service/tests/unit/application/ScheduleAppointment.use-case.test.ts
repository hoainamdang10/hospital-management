/**
 * Schedule Appointment Use Case Unit Tests
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { ScheduleAppointmentUseCase } from '../../../src/application/use-cases/ScheduleAppointment.use-case';
import { IAppointmentRepository } from '../../../src/infrastructure/persistence/SupabaseAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority } from '../../../src/domain/aggregates/Appointment.aggregate';

describe('ScheduleAppointmentUseCase', () => {
  let useCase: ScheduleAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByAppointmentId: jest.fn(),
      findByPatientId: jest.fn(),
      findByDoctorId: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn()
    };

    useCase = new ScheduleAppointmentUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should schedule appointment with valid data', async () => {
      const request = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        reason: 'Khám tổng quát',
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      const result = await useCase.execute(request, { userId: 'user-789', timestamp: new Date() });

      expect(result.success).toBe(true);
      expect(result.appointmentId).toBeDefined();
      expect(result.message).toBe('Đặt lịch hẹn thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return error when patient ID is missing', async () => {
      const request = {
        patientId: '',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      const result = await useCase.execute(request, { userId: 'user-789', timestamp: new Date() });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Patient ID is required');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should return error when doctor ID is missing', async () => {
      const request = {
        patientId: 'patient-123',
        doctorId: '',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      const result = await useCase.execute(request, { userId: 'user-789', timestamp: new Date() });

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Doctor ID is required');
    });

    it('should return error when duration is invalid', async () => {
      const request = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 0,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      const result = await useCase.execute(request, { userId: 'user-789', timestamp: new Date() });

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Duration must be positive');
    });

    it('should return error when consultation fee is negative', async () => {
      const request = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        consultationFee: -100000,
        createdBy: 'user-789'
      };

      const result = await useCase.execute(request, { userId: 'user-789', timestamp: new Date() });

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Consultation fee cannot be negative');
    });

    it('should include appointment details in response', async () => {
      const request = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        reason: 'Khám tổng quát',
        chiefComplaint: 'Đau đầu',
        symptoms: ['Sốt', 'Mệt mỏi'],
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      const result = await useCase.execute(request, { userId: 'user-789', timestamp: new Date() });

      expect(result.success).toBe(true);
      expect(result.appointment).toBeDefined();
      expect(result.appointment?.patientId).toBe('patient-123');
      expect(result.appointment?.doctorId).toBe('doctor-456');
      expect(result.appointment?.type).toBe(AppointmentType.CONSULTATION);
      expect(result.appointment?.status).toBe('scheduled');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const request = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      const result = await useCase.execute(request, { userId: 'user-789', timestamp: new Date() });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Database error');
    });
  });

  describe('authorize', () => {
    it('should authorize authenticated users', async () => {
      const request = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      const authorized = await useCase.authorize(request, 'user-789');
      expect(authorized).toBe(true);
    });

    it('should not authorize unauthenticated users', async () => {
      const request = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      const authorized = await useCase.authorize(request, '');
      expect(authorized).toBe(false);
    });
  });

  describe('involvesPHI', () => {
    it('should return true for appointment data', () => {
      const request = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.ROUTINE,
        consultationFee: 200000,
        createdBy: 'user-789'
      };

      expect(useCase.involvesPHI(request)).toBe(true);
    });
  });
});

