/**
 * Transfer Appointment Use Case Unit Tests
 * Tests appointment transfer between doctors
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { TransferAppointmentUseCase } from '../../../src/application/use-cases/TransferAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';

describe('TransferAppointmentUseCase', () => {
  let useCase: TransferAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockAppointment: jest.Mocked<Appointment>;

  beforeEach(() => {
    mockAppointment = {
      appointmentId: { value: 'APT-2025-001' },
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      durationMinutes: 30,
      timeSlot: {
        appointmentDate: '2025-12-01',
        appointmentTime: '10:00:00',
      },
      getStatus: jest.fn().mockReturnValue(AppointmentStatus.SCHEDULED),
      getAppointmentId: jest.fn().mockReturnValue({ value: 'APT-2025-001' }),
      getPatientId: jest.fn().mockReturnValue('patient-1'),
      getDoctorId: jest.fn().mockReturnValue('doctor-1'),
      getTimeSlot: jest.fn().mockReturnValue({
        appointmentDate: '2025-12-01',
        appointmentTime: '10:00:00',
      }),
      transfer: jest.fn(),
    } as any;

    mockRepository = {
      findByAppointmentId: jest.fn().mockResolvedValue(mockAppointment),
      findByTimeSlot: jest.fn().mockResolvedValue([]), // No conflicts
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAuthService = {
      canTransferAppointment: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new TransferAppointmentUseCase(
      mockRepository,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should transfer appointment to new doctor', async () => {
      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Doctor on leave',
        transferredBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(mockAppointment.transfer).toHaveBeenCalledWith(
        'doctor-2',
        'Doctor on leave',
        'admin-1'
      );
      expect(mockRepository.save).toHaveBeenCalledWith(mockAppointment);
    });

    it('should fail when appointment not found', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'INVALID',
        newDoctorId: 'doctor-2',
        reason: 'Transfer',
        transferredBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Appointment not found');
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canTransferAppointment.mockResolvedValue(false);

      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Transfer',
        transferredBy: 'unauthorized-user',
      };

      const result = await useCase.execute(request, {
        userId: 'unauthorized-user',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when transferring to same doctor', async () => {
      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-1', // Same as current
        reason: 'Transfer',
        transferredBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(mockAppointment.transfer).not.toHaveBeenCalled();
    });

    it('should fail when appointment already completed', async () => {
      mockAppointment.getStatus = jest.fn().mockReturnValue(AppointmentStatus.COMPLETED);

      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Transfer',
        transferredBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when appointment is cancelled', async () => {
      mockAppointment.getStatus = jest.fn().mockReturnValue(AppointmentStatus.CANCELLED);

      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Transfer',
        transferredBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when new doctor not available', async () => {
      // Mock conflicting appointment
      const conflictingAppointment = {
        getStatus: jest.fn().mockReturnValue(AppointmentStatus.SCHEDULED),
        timeSlot: {
          appointmentDate: '2025-12-01',
          appointmentTime: '10:00:00',
        },
        durationMinutes: 30,
      } as any;

      mockRepository.findByTimeSlot.mockResolvedValue([conflictingAppointment]);

      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Transfer',
        transferredBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('New doctor not available');
    });

    it('should handle repository save errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database write failed'));

      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Transfer',
        transferredBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should return complete appointment details after transfer', async () => {
      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Doctor unavailable',
        transferredBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.appointment).toBeDefined();
      expect(result.appointment?.appointmentId).toBe('APT-2025-001');
      expect(result.appointment?.oldDoctorId).toBe('doctor-1');
      expect(result.appointment?.newDoctorId).toBe('doctor-2');
    });

    it('should support notification flags in request', async () => {
      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Transfer',
        transferredBy: 'admin-1',
        notifyPatient: true,
        notifyOldDoctor: true,
        notifyNewDoctor: true,
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('PHI compliance', () => {
    it('should mark transfer operation as PHI', () => {
      const request = {
        appointmentId: 'APT-2025-001',
        newDoctorId: 'doctor-2',
        reason: 'Transfer',
        transferredBy: 'admin-1',
      };

      expect(useCase.involvesPHI(request)).toBe(true);
    });
  });
});
