/**
 * Schedule Appointment Use Case Tests
 * Unit tests for ScheduleAppointmentUseCase
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { ScheduleAppointmentUseCase } from '../../../src/application/use-cases/ScheduleAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority } from '../../../src/domain/aggregates/Appointment.aggregate';
import { IConflictResolutionService } from '../../../src/application/services/IConflictResolutionService';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { IReminderService } from '../../../src/application/services/IReminderService';

describe('ScheduleAppointmentUseCase', () => {
  let useCase: ScheduleAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockConflictService: jest.Mocked<IConflictResolutionService>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockReminderService: jest.Mocked<IReminderService>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      findByDoctorId: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn(),
      checkConflicts: jest.fn(),
    } as any;

    // Create mock services
    mockConflictService = {
      checkConflicts: jest.fn().mockResolvedValue([]),
    } as any;

    mockAuthService = {
      canScheduleAppointment: jest.fn().mockResolvedValue(true),
    } as any;

    mockReminderService = {
      scheduleReminders: jest.fn().mockResolvedValue([]),
      cancelReminders: jest.fn().mockResolvedValue(undefined),
      sendReminder: jest.fn().mockResolvedValue({ success: true }),
      getPendingReminders: jest.fn().mockResolvedValue([]),
      markReminderAsSent: jest.fn().mockResolvedValue(undefined),
      markReminderAsFailed: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new ScheduleAppointmentUseCase(
      mockRepository,
      mockConflictService,
      mockAuthService,
      mockReminderService
    );
  });

  describe('execute', () => {
    it('should schedule appointment with valid data', async () => {
      // Arrange
      const request = {
        tenantId: 'hospital-1',
        patientId: 'PAT-202510-001',
        doctorId: 'DOC-202510-001',
        appointmentDate: '2025-11-30',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        reason: 'Routine checkup',
        consultationFee: 200000,
        createdBy: 'user-123',
      };

      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointmentId).toBeDefined();
      expect(result.message).toBe('Đặt lịch hẹn thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should fail when patient ID is missing', async () => {
      // Arrange
      const request = {
        tenantId: 'hospital-1',
        patientId: '', // Missing
        doctorId: 'DOC-202510-001',
        appointmentDate: '2025-11-30',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        consultationFee: 200000,
        createdBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Patient ID');
    });

    it('should fail when doctor ID is missing', async () => {
      // Arrange
      const request = {
        tenantId: 'hospital-1',
        patientId: 'PAT-202510-001',
        doctorId: '', // Missing
        appointmentDate: '2025-11-30',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        consultationFee: 200000,
        createdBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Doctor ID');
    });

    it('should fail when duration is invalid', async () => {
      // Arrange
      const request = {
        tenantId: 'hospital-1',
        patientId: 'PAT-202510-001',
        doctorId: 'DOC-202510-001',
        appointmentDate: '2025-11-30',
        appointmentTime: '10:00:00',
        durationMinutes: 0, // Invalid
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        consultationFee: 200000,
        createdBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Duration');
    });

    it('should fail when consultation fee is negative', async () => {
      // Arrange
      const request = {
        tenantId: 'hospital-1',
        patientId: 'PAT-202510-001',
        doctorId: 'DOC-202510-001',
        appointmentDate: '2025-11-30',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        consultationFee: -100, // Negative
        createdBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('fee');
    });

    it('should handle repository save errors gracefully', async () => {
      // Arrange
      const request = {
        tenantId: 'hospital-1',
        patientId: 'PAT-202510-001',
        doctorId: 'DOC-202510-001',
        appointmentDate: '2025-11-30',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        reason: 'Routine checkup',
        consultationFee: 200000,
        createdBy: 'user-123',
      };

      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Đặt lịch hẹn thất bại');
      expect(result.errors).toBeDefined();
    });

    it('should set emergency appointments with high priority', async () => {
      // Arrange
      const request = {
        tenantId: 'hospital-1',
        patientId: 'PAT-202510-001',
        doctorId: 'DOC-202510-001',
        appointmentDate: '2025-11-30',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: AppointmentType.EMERGENCY,
        priority: AppointmentPriority.EMERGENCY,
        reason: 'Chest pain',
        consultationFee: 500000,
        createdBy: 'user-123',
      };

      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointment?.type).toBe(AppointmentType.EMERGENCY);
      expect(result.appointment?.priority).toBe(AppointmentPriority.EMERGENCY);
    });
  });

  describe('authorize', () => {
    it('should allow authenticated users to schedule appointments', async () => {
      // Arrange
      const request = {
        tenantId: 'hospital-1',
        patientId: 'PAT-202510-001',
        doctorId: 'DOC-202510-001',
        appointmentDate: '2025-11-30',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        consultationFee: 200000,
        createdBy: 'user-123',
      };

      // Act
      const authorized = await useCase.authorize(request, 'user-123');

      // Assert
      expect(authorized).toBe(true);
    });

    it('should deny unauthenticated users', async () => {
      // Arrange
      const request = {} as any;

      // Act
      const authorized = await useCase.authorize(request, '');

      // Assert
      expect(authorized).toBe(false);
    });
  });

  describe('involvesPHI', () => {
    it('should mark appointment data as PHI', () => {
      // Arrange
      const request = {
        patientId: 'PAT-202510-001',
      } as any;

      // Act
      const isPHI = useCase.involvesPHI(request);

      // Assert
      expect(isPHI).toBe(true);
    });
  });

  describe('getPatientId', () => {
    it('should return patient ID from request', () => {
      // Arrange
      const request = {
        patientId: 'PAT-202510-001',
      } as any;

      // Act
      const patientId = useCase.getPatientId(request);

      // Assert
      expect(patientId).toBe('PAT-202510-001');
    });
  });
});
