/**
 * Complete Appointment Use Case Unit Tests
 * Tests appointment completion workflow
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { CompleteAppointmentUseCase } from '../../../src/application/use-cases/CompleteAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';

describe('CompleteAppointmentUseCase', () => {
  let useCase: CompleteAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockAppointment: jest.Mocked<Appointment>;

  beforeEach(() => {
    mockAppointment = {
      id: 'apt-1',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      status: AppointmentStatus.IN_PROGRESS,
      complete: jest.fn(),
      getUncommittedEvents: jest.fn().mockReturnValue([]),
    } as any;

    mockRepository = {
      findByAppointmentId: jest.fn().mockResolvedValue(mockAppointment),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAuthService = {
      canCompleteAppointment: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new CompleteAppointmentUseCase(
      mockRepository,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should complete appointment when doctor completes it', async () => {
      const request = {
        appointmentId: 'apt-1',
        completedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(mockAppointment.complete).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockAppointment);
    });

    it('should complete appointment when nurse completes it', async () => {
      const request = {
        appointmentId: 'apt-1',
        completedBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(mockAppointment.complete).toHaveBeenCalled();
    });

    it('should fail when appointment not found', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'invalid-id',
        completedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy');
      expect(mockAppointment.complete).not.toHaveBeenCalled();
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canCompleteAppointment.mockResolvedValue(false);

      const request = {
        appointmentId: 'apt-1',
        completedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('thất bại');
      expect(mockAppointment.complete).not.toHaveBeenCalled();
    });

    it('should fail when appointment already completed', async () => {
      mockAppointment.complete.mockImplementation(() => {
        throw new Error('Appointment already completed');
      });

      const request = {
        appointmentId: 'apt-1',
        completedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Appointment already completed');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save errors gracefully', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const request = {
        appointmentId: 'apt-1',
        completedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('thất bại');
    });

    it('should verify authorization with correct parameters', async () => {
      const request = {
        appointmentId: 'apt-1',
        completedBy: 'doctor-1',
      };

      await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(mockAuthService.canCompleteAppointment).toHaveBeenCalledWith(
        'doctor-1',
        'apt-1',
        {
          patientId: 'patient-1',
          doctorId: 'doctor-1',
        }
      );
    });
  });
});
