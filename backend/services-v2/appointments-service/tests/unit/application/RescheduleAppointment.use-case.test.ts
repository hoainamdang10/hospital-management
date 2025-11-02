/**
 * Reschedule Appointment Use Case Tests
 * Tests appointment rescheduling logic
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { RescheduleAppointmentUseCase } from '../../../src/application/use-cases/RescheduleAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IReminderService } from '../../../src/application/services/IReminderService';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';

describe('RescheduleAppointmentUseCase', () => {
  let useCase: RescheduleAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockReminderService: jest.Mocked<IReminderService>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findByAppointmentId: jest.fn(),
      findById: jest.fn(),
      findByTimeSlot: jest.fn().mockResolvedValue([]),
      checkConflicts: jest.fn().mockResolvedValue({ hasConflicts: false, conflicts: [] }),
    } as any;

    mockAuthService = {
      hasAnyRole: jest.fn().mockResolvedValue(true),
      canRescheduleAppointment: jest.fn().mockResolvedValue(true),
    } as any;

    mockReminderService = {
      scheduleReminders: jest.fn().mockResolvedValue([]),
      cancelReminders: jest.fn().mockResolvedValue(undefined),
      sendReminder: jest.fn().mockResolvedValue({ success: true }),
      getPendingReminders: jest.fn().mockResolvedValue([]),
      markReminderAsSent: jest.fn().mockResolvedValue(undefined),
      markReminderAsFailed: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new RescheduleAppointmentUseCase(
      mockRepository,
      mockAuthService,
      mockReminderService
    );
  });

  const createMockAppointment = (): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    const timeSlot = TimeSlot.create('2025-12-01', '10:00:00');
    const details = AppointmentDetails.create('Original checkup');

    return Appointment.create(
      appointmentId,
      tenantId,
      'patient-1',
      'doctor-1',
      timeSlot,
      30,
      AppointmentType.CONSULTATION,
      AppointmentPriority.NORMAL,
      details,
      200000,
      'user-1'
    );
  };

  describe('execute', () => {
    it('should reschedule appointment with valid new time', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        newAppointmentDate: '2025-12-05',
        newAppointmentTime: '14:00:00',
        reason: 'Doctor requested reschedule',
        rescheduledBy: 'doctor-1',
        notifyPatient: true,
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.appointment?.newDate).toBe('2025-12-05');
      expect(result.appointment?.newTime).toBe('14:00:00');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockReminderService.cancelReminders).toHaveBeenCalled();
      expect(mockReminderService.scheduleReminders).toHaveBeenCalled();
    });

    it('should fail when appointment not found', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'non-existent',
        newAppointmentDate: '2025-12-05',
        newAppointmentTime: '14:00:00',
        reason: 'Reschedule',
        rescheduledBy: 'user-1',
      };

      const result = await useCase.execute(request, {
        userId: 'user-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy');
    });

    it('should fail when user not authorized', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      mockAuthService.canRescheduleAppointment.mockResolvedValue(false);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        newAppointmentDate: '2025-12-05',
        newAppointmentTime: '14:00:00',
        reason: 'Reschedule',
        rescheduledBy: 'unauthorized-user',
      };

      const result = await useCase.execute(request, {
        userId: 'unauthorized-user',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('not authorized');
    });

    it('should fail when rescheduling to past time', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        newAppointmentDate: '2020-01-01', // Past date
        newAppointmentTime: '10:00:00',
        reason: 'Invalid reschedule',
        rescheduledBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should cancel old reminders and schedule new ones', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        newAppointmentDate: '2025-12-05',
        newAppointmentTime: '14:00:00',
        reason: 'Reschedule with reminders',
        rescheduledBy: 'doctor-1',
      };

      await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(mockReminderService.cancelReminders).toHaveBeenCalledWith(
        mockAppointment.getAppointmentId().value
      );
      expect(mockReminderService.scheduleReminders).toHaveBeenCalled();
    });

    it('should fail when new time has conflicts', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      
      // Create conflicting appointment at target time
      const conflictId = AppointmentId.generate();
      const conflictTimeSlot = TimeSlot.create('2025-12-05', '14:00:00');
      const conflictDetails = AppointmentDetails.create('Conflicting appointment');
      
      const conflictingAppointment = Appointment.reconstitute({
        appointmentId: conflictId,
        tenantId: TenantId.createDefault(),
        patientId: 'patient-2',
        doctorId: 'doctor-1', // Same doctor
        timeSlot: conflictTimeSlot,
        durationMinutes: 30,
        type: AppointmentType.CONSULTATION,
        priority: AppointmentPriority.NORMAL,
        status: AppointmentStatus.CONFIRMED,
        details: conflictDetails,
        consultationFee: 200000,
        reminderSent: false,
        confirmationRequired: true,
        version: 1,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }, conflictId.value);
      
      // Mock findByTimeSlot to return conflicting appointment
      mockRepository.findByTimeSlot.mockResolvedValue([conflictingAppointment]);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        newAppointmentDate: '2025-12-05',
        newAppointmentTime: '14:00:00',
        reason: 'Reschedule',
        rescheduledBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Time slot not available');
    });
  });
});
