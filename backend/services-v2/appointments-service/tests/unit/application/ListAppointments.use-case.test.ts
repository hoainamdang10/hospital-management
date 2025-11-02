/**
 * List Appointments Use Case Unit Tests
 * Tests appointment listing with filters and pagination
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { ListAppointmentsUseCase } from '../../../src/application/use-cases/ListAppointments.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { Appointment, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';

describe('ListAppointmentsUseCase', () => {
  let useCase: ListAppointmentsUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAppointments: jest.Mocked<Appointment>[];

  beforeEach(() => {
    mockAppointments = [
      {
        id: 'apt-1',
        appointmentId: { value: 'APT-2025-001' } as AppointmentId,
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        timeSlot: {
          appointmentDate: '2025-12-01',
          appointmentTime: '10:00:00',
        } as TimeSlot,
        durationMinutes: 30,
        type: 'CONSULTATION',
        priority: 'NORMAL',
        status: AppointmentStatus.SCHEDULED,
        consultationFee: 50000,
      } as any,
      {
        id: 'apt-2',
        appointmentId: { value: 'APT-2025-002' } as AppointmentId,
        patientId: 'patient-1',
        doctorId: 'doctor-2',
        timeSlot: {
          appointmentDate: '2025-12-02',
          appointmentTime: '14:00:00',
        } as TimeSlot,
        durationMinutes: 60,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        status: AppointmentStatus.CONFIRMED,
        consultationFee: 75000,
      } as any,
    ];

    mockRepository = {
      findByPatientId: jest.fn().mockResolvedValue(mockAppointments),
      findByDoctorId: jest.fn().mockResolvedValue([mockAppointments[0]]),
      findByDateRange: jest.fn().mockResolvedValue(mockAppointments),
    } as any;

    useCase = new ListAppointmentsUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should list appointments by patient ID', async () => {
      const request = {
        patientId: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.appointments).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockRepository.findByPatientId).toHaveBeenCalledWith('patient-1');
    });

    it('should list appointments by doctor ID', async () => {
      const request = {
        doctorId: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.appointments).toHaveLength(1);
      expect(result.appointments?.[0].doctorId).toBe('doctor-1');
      expect(mockRepository.findByDoctorId).toHaveBeenCalledWith('doctor-1');
    });

    it('should list appointments by date range', async () => {
      const request = {
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.appointments).toHaveLength(2);
      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        new Date('2025-12-01'),
        new Date('2025-12-31')
      );
    });

    it('should return complete appointment details', async () => {
      const request = {
        patientId: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.appointments?.[0]).toMatchObject({
        id: 'apt-1',
        appointmentId: 'APT-2025-001',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        appointmentDate: '2025-12-01',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'CONSULTATION',
        priority: 'NORMAL',
        status: AppointmentStatus.SCHEDULED,
        consultationFee: 50000,
      });
    });

    it('should fail when no filter criteria provided', async () => {
      const request = {};

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Vui lòng cung cấp');
      expect(result.errors).toContain('Missing filter criteria');
      expect(result.appointments).toBeUndefined();
    });

    it('should return empty list when no appointments found', async () => {
      mockRepository.findByPatientId.mockResolvedValue([]);

      const request = {
        patientId: 'patient-999',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-999',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.appointments).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findByPatientId.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = {
        patientId: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('thất bại');
      expect(result.errors).toContain('Database connection failed');
    });

    it('should prioritize patientId over other filters', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      };

      await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(mockRepository.findByPatientId).toHaveBeenCalled();
      expect(mockRepository.findByDoctorId).not.toHaveBeenCalled();
      expect(mockRepository.findByDateRange).not.toHaveBeenCalled();
    });

    it('should prioritize doctorId over date range', async () => {
      const request = {
        doctorId: 'doctor-1',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      };

      await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(mockRepository.findByDoctorId).toHaveBeenCalled();
      expect(mockRepository.findByDateRange).not.toHaveBeenCalled();
    });

    it('should handle invalid date range gracefully', async () => {
      mockRepository.findByDateRange.mockRejectedValue(
        new Error('Invalid date format')
      );

      const request = {
        startDate: 'invalid-date',
        endDate: '2025-12-31',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should include all appointment types in results', async () => {
      const request = {
        patientId: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      const types = result.appointments?.map(apt => apt.type);
      expect(types).toContain('CONSULTATION');
      expect(types).toContain('FOLLOW_UP');
    });
  });

  describe('PHI compliance', () => {
    it('should mark appointment list as PHI', () => {
      expect(useCase.involvesPHI({ patientId: 'patient-1' })).toBe(true);
    });
  });
});
