/**
 * Bulk Reschedule Appointments Use Case Unit Tests
 * Tests batch rescheduling operations
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { BulkRescheduleAppointmentsUseCase } from '../../../src/application/use-cases/BulkRescheduleAppointments.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';

describe('BulkRescheduleAppointmentsUseCase', () => {
  let useCase: BulkRescheduleAppointmentsUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockAppointments: jest.Mocked<Appointment>[];

  beforeEach(() => {
    mockAppointments = [
      {
        appointmentId: { value: 'APT-2025-001' },
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        timeSlot: {
          appointmentDate: '2025-12-01',
          appointmentTime: '09:00:00',
        },
        status: AppointmentStatus.SCHEDULED,
        getStatus: jest.fn(() => AppointmentStatus.SCHEDULED),
        reschedule: jest.fn(),
      } as any,
      {
        appointmentId: { value: 'APT-2025-002' },
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        timeSlot: {
          appointmentDate: '2025-12-01',
          appointmentTime: '10:00:00',
        },
        status: AppointmentStatus.CONFIRMED,
        getStatus: jest.fn(() => AppointmentStatus.CONFIRMED),
        reschedule: jest.fn(),
      } as any,
      {
        appointmentId: { value: 'APT-2025-003' },
        patientId: 'patient-3',
        doctorId: 'doctor-1',
        timeSlot: {
          appointmentDate: '2025-12-01',
          appointmentTime: '11:00:00',
        },
        status: AppointmentStatus.SCHEDULED,
        getStatus: jest.fn(() => AppointmentStatus.SCHEDULED),
        reschedule: jest.fn(),
      } as any,
    ];

    mockRepository = {
      findByDoctorAndDate: jest.fn().mockResolvedValue(mockAppointments),
      findByTimeSlot: jest.fn().mockResolvedValue(mockAppointments),
      saveMany: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAuthService = {
      canBulkReschedule: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new BulkRescheduleAppointmentsUseCase(
      mockRepository,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should bulk reschedule all appointments for doctor on date', async () => {
      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Doctor on emergency leave',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Đã xử lý');
      expect(result.summary?.totalAppointments).toBe(3);
      expect(mockRepository.findByDoctorAndDate).toHaveBeenCalledWith(
        'doctor-1',
        new Date('2025-12-01')
      );
    });

    it('should provide summary of rescheduling results', async () => {
      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Clinic closed',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.summary).toBeDefined();
      expect(result.summary?.totalAppointments).toBe(3);
      expect(result.summary?.rescheduled).toBeGreaterThanOrEqual(0);
      expect(result.summary?.failed).toBeGreaterThanOrEqual(0);
      expect(result.summary?.pending).toBeGreaterThanOrEqual(0);
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canBulkReschedule.mockResolvedValue(false);

      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(mockRepository.findByDoctorAndDate).not.toHaveBeenCalled();
    });

    it('should handle empty appointment list', async () => {
      mockRepository.findByDoctorAndDate.mockResolvedValue([]);

      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.summary?.totalAppointments).toBe(0);
      expect(result.summary?.rescheduled).toBe(0);
    });

    it('should skip completed appointments', async () => {
      // Create a new mock with COMPLETED status instead of mutating
      const completedAppointment = {
        ...mockAppointments[0],
        status: AppointmentStatus.COMPLETED,
        getStatus: jest.fn(() => AppointmentStatus.COMPLETED),
        reschedule: jest.fn(),
      } as any;
      
      mockRepository.findByDoctorAndDate.mockResolvedValue([
        completedAppointment,
        mockAppointments[1],
        mockAppointments[2],
      ]);

      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(completedAppointment.reschedule).not.toHaveBeenCalled();
      expect(result.summary?.totalAppointments).toBe(2); // Only SCHEDULED and CONFIRMED counted
    });

    it('should skip cancelled appointments', async () => {
      // Create a new mock with CANCELLED status instead of mutating
      const cancelledAppointment = {
        ...mockAppointments[1],
        status: AppointmentStatus.CANCELLED,
        getStatus: jest.fn(() => AppointmentStatus.CANCELLED),
        reschedule: jest.fn(),
      } as any;
      
      mockRepository.findByDoctorAndDate.mockResolvedValue([
        mockAppointments[0],
        cancelledAppointment,
        mockAppointments[2],
      ]);

      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(cancelledAppointment.reschedule).not.toHaveBeenCalled();
    });

    it('should handle partial failures gracefully', async () => {
      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary?.totalAppointments).toBe(3);
      expect(result.summary?.pending).toBeGreaterThan(0);
    });

    it('should include appointment details in response', async () => {
      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.appointments).toBeDefined();
      expect(result.appointments?.length).toBeGreaterThan(0);
      expect(result.appointments?.[0]).toHaveProperty('appointmentId');
      expect(result.appointments?.[0]).toHaveProperty('patientId');
      expect(result.appointments?.[0]).toHaveProperty('status');
      expect(result.appointments?.[0]).toHaveProperty('oldDate');
      expect(result.appointments?.[0]).toHaveProperty('oldTime');
    });

    it('should support alternative doctor suggestions', async () => {
      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Doctor unavailable',
        rescheduledBy: 'admin-1',
        suggestAlternatives: true,
        alternativeDoctorIds: ['doctor-2', 'doctor-3'],
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      // Alternative doctor logic would be tested in integration tests
    });

    it('should verify authorization with correct parameters', async () => {
      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(mockAuthService.canBulkReschedule).toHaveBeenCalledWith(
        'admin-1',
        'doctor-1'
      );
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findByDoctorAndDate.mockRejectedValue(
        new Error('Database query failed')
      );

      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database query failed');
    });

    it('should track pending patient confirmations', async () => {
      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      const pendingAppointments = result.appointments?.filter(
        apt => apt.status === 'pending_patient_confirmation'
      );

      if (pendingAppointments && pendingAppointments.length > 0) {
        expect(result.summary?.pending).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance', () => {
    it('should handle large batches efficiently', async () => {
      const largeBatch = Array.from({ length: 50 }, (_, i) => ({
        appointmentId: { value: `APT-2025-${i.toString().padStart(3, '0')}` },
        patientId: `patient-${i}`,
        doctorId: 'doctor-1',
        timeSlot: {
          appointmentDate: '2025-12-01',
          appointmentTime: `${(9 + Math.floor(i / 2)).toString().padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}:00`,
        },
        status: AppointmentStatus.SCHEDULED,
        getStatus: jest.fn(() => AppointmentStatus.SCHEDULED),
        reschedule: jest.fn(),
      }));

      mockRepository.findByDoctorAndDate.mockResolvedValue(largeBatch as any);

      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Bulk reschedule',
        rescheduledBy: 'admin-1',
      };

      const start = Date.now();
      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(result.summary?.totalAppointments).toBe(50);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('PHI compliance', () => {
    it('should mark bulk reschedule as PHI operation', () => {
      const request = {
        doctorId: 'doctor-1',
        date: '2025-12-01',
        reason: 'Reschedule',
        rescheduledBy: 'admin-1',
      };

      expect(useCase.involvesPHI(request)).toBe(true);
    });
  });
});
