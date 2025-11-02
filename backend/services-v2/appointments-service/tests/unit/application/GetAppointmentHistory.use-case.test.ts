/**
 * Get Appointment History Use Case Unit Tests
 * Tests appointment history retrieval and statistics
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { GetAppointmentHistoryUseCase } from '../../../src/application/use-cases/GetAppointmentHistory.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';

describe('GetAppointmentHistoryUseCase', () => {
  let useCase: GetAppointmentHistoryUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockAppointments: jest.Mocked<Appointment>[];

  beforeEach(() => {
    mockAppointments = [
      {
        appointmentId: { value: 'APT-2025-001' } as AppointmentId,
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        timeSlot: {
          appointmentDate: '2025-11-01',
          appointmentTime: '10:00:00',
        } as TimeSlot,
        status: 'completed',
        type: 'CONSULTATION',
        consultationFee: 50000,
        createdAt: new Date('2025-10-25'),
        completedAt: new Date('2025-11-01T10:30:00'),
      } as any,
      {
        appointmentId: { value: 'APT-2025-002' } as AppointmentId,
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        timeSlot: {
          appointmentDate: '2025-11-15',
          appointmentTime: '14:00:00',
        } as TimeSlot,
        status: 'cancelled',
        type: 'FOLLOW_UP',
        consultationFee: 75000,
        createdAt: new Date('2025-11-10'),
        cancelledAt: new Date('2025-11-14T09:00:00'),
        cancellationReason: 'Patient requested',
      } as any,
      {
        appointmentId: { value: 'APT-2025-003' } as AppointmentId,
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        timeSlot: {
          appointmentDate: '2025-12-01',
          appointmentTime: '09:00:00',
        } as TimeSlot,
        status: 'no_show',
        type: 'CONSULTATION',
        consultationFee: 50000,
        createdAt: new Date('2025-11-25'),
        noShowAt: new Date('2025-12-01T09:15:00'),
      } as any,
    ];

    mockRepository = {
      findByDateRange: jest.fn().mockResolvedValue(mockAppointments),
      findByPatientId: jest.fn().mockResolvedValue(mockAppointments),
      findByDoctorId: jest.fn().mockResolvedValue(mockAppointments),
      findByTimeSlot: jest.fn().mockResolvedValue(mockAppointments),
    } as any;

    mockAuthService = {
      canViewAppointmentHistory: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new GetAppointmentHistoryUseCase(
      mockRepository,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should retrieve appointment history for patient', async () => {
      const request = {
        patientId: 'patient-1',
        requestedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.history?.appointments).toHaveLength(3);
      expect(result.history?.total).toBe(3);
    });

    it('should calculate history statistics', async () => {
      const request = {
        patientId: 'patient-1',
        requestedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.history?.statistics).toBeDefined();
      expect(result.history?.statistics?.totalCompleted).toBe(1);
      expect(result.history?.statistics?.totalCancelled).toBe(1);
      expect(result.history?.statistics?.totalNoShow).toBe(1);
      
      // Completion rate = 1 / (1 + 1 + 1) = 33.33%
      expect(result.history?.statistics?.completionRate).toBeCloseTo(33.33, 1);
      
      // No-show rate = 1 / 3 = 33.33%
      expect(result.history?.statistics?.noShowRate).toBeCloseTo(33.33, 1);
    });

    it('should include cancellation details', async () => {
      const request = {
        patientId: 'patient-1',
        requestedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      const cancelled = result.history?.appointments.find(
        apt => apt.status === AppointmentStatus.CANCELLED
      );

      expect(cancelled).toBeDefined();
      expect(cancelled?.cancelledAt).toBeDefined();
      expect(cancelled?.cancellationReason).toBe('Patient requested');
    });

    it('should include no-show timestamp', async () => {
      const request = {
        patientId: 'patient-1',
        requestedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      const noShow = result.history?.appointments.find(
        apt => apt.status === AppointmentStatus.NO_SHOW
      );

      expect(noShow).toBeDefined();
      expect(noShow?.noShowAt).toBeDefined();
    });

    it('should filter by date range', async () => {
      const request = {
        patientId: 'patient-1',
        startDate: '2025-11-01',
        endDate: '2025-11-30',
        requestedBy: 'patient-1',
      };

      await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(mockRepository.findByTimeSlot).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      mockRepository.findByTimeSlot.mockResolvedValue(mockAppointments);

      const request = {
        patientId: 'patient-1',
        status: ['completed'],
        requestedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.history?.appointments).toHaveLength(1);
      expect(result.history?.appointments[0].status).toBe('completed');
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canViewAppointmentHistory.mockResolvedValue(false);

      const request = {
        patientId: 'patient-1',
        requestedBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('thất bại');
    });

    it('should retrieve history for doctor', async () => {
      const request = {
        doctorId: 'doctor-1',
        requestedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.history?.appointments).toHaveLength(3);
      expect(mockRepository.findByTimeSlot).toHaveBeenCalled();
    });

    it('should default to 1 year history when no date range provided', async () => {
      const request = {
        patientId: 'patient-1',
        requestedBy: 'patient-1',
      };

      await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      // Should use findByPatientId or findByDateRange with 1 year default
      expect(mockRepository.findByTimeSlot).toHaveBeenCalled();
    });

    it('should handle empty history gracefully', async () => {
      mockRepository.findByPatientId.mockResolvedValue([]);

      const request = {
        patientId: 'patient-999',
        requestedBy: 'patient-999',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-999',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.history?.appointments).toHaveLength(0);
      expect(result.history?.total).toBe(0);
      expect(result.history?.statistics?.totalCompleted).toBe(0);
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findByTimeSlot.mockRejectedValue(
        new Error('Database query failed')
      );

      const request = {
        patientId: 'patient-1',
        requestedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database query failed');
    });

    it('should verify authorization with correct parameters', async () => {
      const request = {
        patientId: 'patient-1',
        requestedBy: 'doctor-1',
      };

      await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(mockAuthService.canViewAppointmentHistory).toHaveBeenCalledWith(
        'doctor-1',
        'patient-1',
        undefined
      );
    });
  });

  describe('PHI compliance', () => {
    it('should mark appointment history as PHI', () => {
      expect(useCase.involvesPHI({ patientId: 'patient-1', requestedBy: 'patient-1' })).toBe(true);
    });

    it('should enforce authorization for PHI access', async () => {
      mockAuthService.canViewAppointmentHistory.mockResolvedValue(false);

      const request = {
        patientId: 'patient-1',
        requestedBy: 'unauthorized-user',
      };

      const result = await useCase.execute(request, {
        userId: 'unauthorized-user',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
    });
  });
});
