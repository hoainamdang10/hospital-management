/**
 * Validate Cancellation Policy Use Case Tests
 * Unit tests for ValidateCancellationPolicyUseCase
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { ValidateCancellationPolicyUseCase } from '../../../src/application/use-cases/ValidateCancellationPolicy.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';

describe('ValidateCancellationPolicyUseCase', () => {
  let useCase: ValidateCancellationPolicyUseCase;
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

    useCase = new ValidateCancellationPolicyUseCase(mockRepository);
  });

  const createMockAppointment = (
    hoursFromNow: number,
    consultationFee: number = 200000,
    checkedInAt: Date | null = null
  ): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + hoursFromNow);
    
    const dateStr = futureDate.toISOString().split('T')[0];
    // Ensure HH:MM:SS format
    const hours = String(futureDate.getHours()).padStart(2, '0');
    const minutes = String(futureDate.getMinutes()).padStart(2, '0');
    const seconds = String(futureDate.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;
    
    const timeSlot = TimeSlot.create(dateStr, timeStr);
    const details = AppointmentDetails.create('Routine checkup');

    const appointment = Appointment.create(
      appointmentId,
      tenantId,
      'PAT-202510-001',
      'DOC-202510-001',
      timeSlot,
      30,
      AppointmentType.CONSULTATION,
      AppointmentPriority.NORMAL,
      details,
      consultationFee,
      'user-123'
    );

    // Simulate check-in if needed
    if (checkedInAt) {
      appointment.checkIn();
    }

    return appointment;
  };

  describe('execute', () => {
    it('should return free cancellation policy for appointment > 24 hours away', async () => {
      // Arrange: Appointment 30 hours from now
      const mockAppointment = createMockAppointment(30, 200000);
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      // Act
      const result = await useCase.execute(
        { appointmentId: mockAppointment.id },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.policy!.canCancel).toBe(true);
      expect(result.policy!.cancellationFee).toBe(0);
      expect(result.policy!.refundAmount).toBe(200000);
      expect(result.policy!.refundPercentage).toBe(100);
      expect(result.policy!.reason).toContain('Hủy miễn phí');
    });

    it('should return 50% fee policy for appointment 12-24 hours away', async () => {
      // Arrange: Create a clearly future appointment (30h) then test the policy logic
      const mockAppointment = createMockAppointment(30, 200000);
      
      // Override with 18-hour future time by modifying the props
      const futureDate = new Date();
      futureDate.setTime(futureDate.getTime() + (18 * 60 * 60 * 1000)); // Add 18 hours in milliseconds
      
      // Format in local timezone (NOT UTC)
      const year = futureDate.getFullYear();
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const day = String(futureDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const hours = String(futureDate.getHours()).padStart(2, '0');
      const minutes = String(futureDate.getMinutes()).padStart(2, '0');
      const seconds = String(futureDate.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;
      
      const modifiedAppointment = Appointment.reconstitute({
        ...mockAppointment['props'],
        timeSlot: TimeSlot.create(dateStr, timeStr)
      }, mockAppointment.id);
      
      mockRepository.findByAppointmentId.mockResolvedValue(modifiedAppointment);

      // Act
      const result = await useCase.execute(
        { appointmentId: modifiedAppointment.id },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.policy!.canCancel).toBe(true);
      
      // Should be in 12-24h window for 50% fee
      expect(result.policy!.hoursBeforeAppointment).toBeGreaterThanOrEqual(12);
      expect(result.policy!.hoursBeforeAppointment).toBeLessThan(24);
      expect(result.policy!.cancellationFee).toBe(100000); // 50% of 200000
      expect(result.policy!.refundAmount).toBe(100000);
      expect(result.policy!.refundPercentage).toBe(50);
      expect(result.policy!.reason).toContain('Phí hủy 50%');
    });

    it('should return 100% fee policy for appointment < 12 hours away', async () => {
      // Arrange: Appointment 6 hours from now
      const mockAppointment = createMockAppointment(6, 200000);
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      // Act
      const result = await useCase.execute(
        { appointmentId: mockAppointment.id },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.policy!.canCancel).toBe(true);
      expect(result.policy!.cancellationFee).toBe(200000); // 100%
      expect(result.policy!.refundAmount).toBe(0);
      expect(result.policy!.refundPercentage).toBe(0);
      expect(result.policy!.reason).toContain('Phí hủy 100%');
    });

    it('should not allow cancellation for checked-in appointment', async () => {
      // Arrange: Checked-in appointment
      const mockAppointment = createMockAppointment(10, 200000);
      mockAppointment.checkIn(); // Check in the appointment
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      // Act
      const result = await useCase.execute(
        { appointmentId: mockAppointment.id },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.policy!.canCancel).toBe(false);
      expect(result.policy!.cancellationFee).toBe(200000); // Full fee
      expect(result.policy!.refundAmount).toBe(0);
      expect(result.policy!.reason).toContain('check-in');
    });

    it('should not allow cancellation for past appointment', async () => {
      // Arrange: Create a future appointment first, then mock it as past by changing time
      const mockAppointment = createMockAppointment(24, 200000);
      
      // Override timeSlot to be in the past (manually create past timeslot)
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);
      const pastDateStr = pastDate.toISOString().split('T')[0];
      const pastTimeStr = `${String(pastDate.getHours()).padStart(2, '0')}:${String(pastDate.getMinutes()).padStart(2, '0')}:00`;
      
      // Replace timeSlot with past one using reconstitute
      const pastAppointment = Appointment.reconstitute(
        {
          ...mockAppointment['props'],
          timeSlot: TimeSlot.create(pastDateStr, pastTimeStr)
        },
        mockAppointment.id
      );
      
      mockRepository.findByAppointmentId.mockResolvedValue(pastAppointment);

      // Act
      const result = await useCase.execute(
        { appointmentId: pastAppointment.id },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.policy!.canCancel).toBe(false);
      expect(result.policy!.cancellationFee).toBe(200000);
      expect(result.policy!.refundAmount).toBe(0);
      expect(result.policy!.reason).toContain('Lịch hẹn đã qua');
    });

    it('should return error when appointment not found', async () => {
      // Arrange
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(
        { appointmentId: 'non-existent-id' },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy lịch hẹn');
      expect(result.errors).toBeDefined();
    });

    it('should calculate correct hours before appointment', async () => {
      // Arrange: Appointment exactly 24 hours from now
      const mockAppointment = createMockAppointment(24, 200000);
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      // Act
      const result = await useCase.execute(
        { appointmentId: mockAppointment.id },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      expect(result.policy!.hoursBeforeAppointment).toBeGreaterThanOrEqual(23.9);
      expect(result.policy!.hoursBeforeAppointment).toBeLessThanOrEqual(24.1);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockRepository.findByAppointmentId.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await useCase.execute(
        { appointmentId: 'test-id' },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('thất bại');
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Database connection failed');
    });

    it('should calculate refund correctly for different fee amounts', async () => {
      // Arrange: Create future appointment with 500k fee
      const mockAppointment = createMockAppointment(30, 500000);
      
      // Override with 18-hour future time for 50% policy
      const futureDate = new Date();
      futureDate.setTime(futureDate.getTime() + (18 * 60 * 60 * 1000)); // Add 18 hours in milliseconds
      
      // Format in local timezone
      const year = futureDate.getFullYear();
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const day = String(futureDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const hours = String(futureDate.getHours()).padStart(2, '0');
      const minutes = String(futureDate.getMinutes()).padStart(2, '0');
      const seconds = String(futureDate.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;
      
      const modifiedAppointment = Appointment.reconstitute({
        ...mockAppointment['props'],
        timeSlot: TimeSlot.create(dateStr, timeStr),
        consultationFee: 500000
      }, mockAppointment.id);
      
      mockRepository.findByAppointmentId.mockResolvedValue(modifiedAppointment);

      // Act
      const result = await useCase.execute(
        { appointmentId: modifiedAppointment.id },
        { userId: 'user-123', timestamp: new Date() }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.policy).toBeDefined();
      
      // Should be in 12-24h window for 50% fee
      expect(result.policy!.hoursBeforeAppointment).toBeGreaterThanOrEqual(12);
      expect(result.policy!.hoursBeforeAppointment).toBeLessThan(24);
      expect(result.policy!.cancellationFee).toBe(250000); // 50%
      expect(result.policy!.refundAmount).toBe(250000); // 50%
    });
  });

  describe('authorize', () => {
    it('should authorize any authenticated user to check policy', async () => {
      // Act
      const result = await useCase.authorize(
        { appointmentId: 'test-id' },
        'user-123'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should not authorize without userId', async () => {
      // Act
      const result = await useCase.authorize(
        { appointmentId: 'test-id' },
        ''
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('involvesPHI', () => {
    it('should indicate that operation involves PHI', () => {
      // Act
      const result = useCase.involvesPHI({ appointmentId: 'test-id' });

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getPatientId', () => {
    it('should return null as patient ID is retrieved from appointment', () => {
      // Act
      const result = useCase.getPatientId({ appointmentId: 'test-id' });

      // Assert
      expect(result).toBeNull();
    });
  });
});
