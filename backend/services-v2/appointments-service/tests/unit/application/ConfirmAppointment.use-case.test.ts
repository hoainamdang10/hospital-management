/**
 * Confirm Appointment Use Case Unit Tests
 * Tests appointment confirmation workflow
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { ConfirmAppointmentUseCase } from '../../../src/application/use-cases/ConfirmAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';

describe('ConfirmAppointmentUseCase', () => {
  let useCase: ConfirmAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockAppointment: jest.Mocked<Appointment>;

  beforeEach(() => {
    mockAppointment = {
      id: 'apt-1',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      status: AppointmentStatus.SCHEDULED,
      confirm: jest.fn(),
      getUncommittedEvents: jest.fn().mockReturnValue([]),
    } as any;

    mockRepository = {
      findByAppointmentId: jest.fn().mockResolvedValue(mockAppointment),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAuthService = {
      canConfirmAppointment: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new ConfirmAppointmentUseCase(
      mockRepository,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should confirm appointment when patient confirms', async () => {
      const request = {
        appointmentId: 'apt-1',
        confirmedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(mockAppointment.confirm).toHaveBeenCalledWith('patient-1');
      expect(mockRepository.save).toHaveBeenCalledWith(mockAppointment);
    });

    it('should confirm appointment when staff confirms', async () => {
      const request = {
        appointmentId: 'apt-1',
        confirmedBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(mockAppointment.confirm).toHaveBeenCalledWith('nurse-1');
    });

    it('should fail when appointment not found', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'invalid-id',
        confirmedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy');
      expect(mockAppointment.confirm).not.toHaveBeenCalled();
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canConfirmAppointment.mockResolvedValue(false);

      const request = {
        appointmentId: 'apt-1',
        confirmedBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('thất bại');
      expect(mockAppointment.confirm).not.toHaveBeenCalled();
    });

    it('should fail when appointment already confirmed', async () => {
      mockAppointment.confirm.mockImplementation(() => {
        throw new Error('Appointment is not in SCHEDULED status');
      });

      const request = {
        appointmentId: 'apt-1',
        confirmedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Appointment is not in SCHEDULED status');
    });

    it('should fail when appointment is cancelled', async () => {
      // Create new mock with cancelled status
      const mockCancelledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        confirm: jest.fn().mockImplementation(() => {
          throw new Error('Cannot confirm cancelled appointment');
        }),
      };
      mockRepository.findByAppointmentId.mockResolvedValueOnce(mockCancelledAppointment as any);

      const request = {
        appointmentId: 'apt-1',
        confirmedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle repository save errors gracefully', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database connection failed'));

      const request = {
        appointmentId: 'apt-1',
        confirmedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('thất bại');
    });

    it('should verify authorization with correct parameters', async () => {
      const request = {
        appointmentId: 'apt-1',
        confirmedBy: 'patient-1',
      };

      await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(mockAuthService.canConfirmAppointment).toHaveBeenCalledWith(
        'patient-1',
        'apt-1',
        {
          patientId: 'patient-1',
          doctorId: 'doctor-1',
        }
      );
    });

    it('should publish domain events after confirmation', async () => {
      const mockEvent = { eventType: 'AppointmentConfirmed' };
      mockAppointment.getUncommittedEvents.mockReturnValue([mockEvent] as any);

      const request = {
        appointmentId: 'apt-1',
        confirmedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
