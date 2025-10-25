/**
 * Cancel Appointment Use Case Tests
 * Unit tests for CancelAppointmentUseCase
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { CancelAppointmentUseCase } from '../../../src/application/use-cases/CancelAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';

describe('CancelAppointmentUseCase', () => {
  let useCase: CancelAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findByAppointmentId: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      findByDoctorId: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new CancelAppointmentUseCase(mockRepository);
  });

  const createMockAppointment = (status: AppointmentStatus = AppointmentStatus.SCHEDULED): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    const timeSlot = TimeSlot.create('2025-11-30', '10:00:00');
    const details = AppointmentDetails.create('Routine checkup');

    return Appointment.create(
      appointmentId,
      tenantId,
      'PAT-202510-001',
      'DOC-202510-001',
      timeSlot,
      30,
      AppointmentType.CONSULTATION,
      AppointmentPriority.NORMAL,
      details,
      200000,
      'user-123'
    );
  };

  describe('execute', () => {
    it('should cancel scheduled appointment successfully', async () => {
      // Arrange
      const mockAppointment = createMockAppointment(AppointmentStatus.SCHEDULED);
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      mockRepository.save.mockResolvedValue();

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        cancellationReason: 'Patient requested cancellation',
        cancelledBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Đã hủy lịch hẹn thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should fail when appointment is not found', async () => {
      // Arrange
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'non-existent-id',
        cancellationReason: 'Patient requested cancellation',
        cancelledBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('không tìm thấy');
    });

    it('should fail when appointment is already completed', async () => {
      // Arrange
      const mockAppointment = createMockAppointment(AppointmentStatus.SCHEDULED);
      mockAppointment.complete(); // Change to completed
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        cancellationReason: 'Patient requested cancellation',
        cancelledBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when appointment is already cancelled', async () => {
      // Arrange
      const mockAppointment = createMockAppointment(AppointmentStatus.SCHEDULED);
      mockAppointment.cancel('Already cancelled', 'admin');
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        cancellationReason: 'Patient requested cancellation',
        cancelledBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when cancellation reason is missing', async () => {
      // Arrange
      const mockAppointment = createMockAppointment(AppointmentStatus.SCHEDULED);
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        cancellationReason: '', // Missing
        cancelledBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('reason');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockAppointment = createMockAppointment(AppointmentStatus.SCHEDULED);
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        cancellationReason: 'Patient requested cancellation',
        cancelledBy: 'user-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'user-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Hủy lịch hẹn thất bại');
      expect(result.errors).toBeDefined();
    });

    it('should publish AppointmentCancelled event', async () => {
      // Arrange
      const mockAppointment = createMockAppointment(AppointmentStatus.SCHEDULED);
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      mockRepository.save.mockResolvedValue();

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        cancellationReason: 'Doctor unavailable',
        cancelledBy: 'doctor-123',
      };

      // Act
      const result = await useCase.execute(request, {
        userId: 'doctor-123',
        timestamp: new Date(),
      });

      // Assert
      expect(result.success).toBe(true);
      // Domain event should be published (checked in aggregate)
      const events = (mockAppointment as any).getDomainEvents();
      expect(events).toBeDefined();
    });
  });

  describe('authorize', () => {
    it('should allow authenticated users to cancel appointments', async () => {
      // Arrange
      const request = {
        appointmentId: 'APT-123',
        cancellationReason: 'Patient requested',
        cancelledBy: 'user-123',
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
});

