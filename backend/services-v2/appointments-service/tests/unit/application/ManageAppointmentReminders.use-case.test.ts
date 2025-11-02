/**
 * Manage Appointment Reminders Use Case Unit Tests
 * Tests reminder management (enable/disable/reschedule)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ManageAppointmentRemindersUseCase } from '../../../src/application/use-cases/ManageAppointmentReminders.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IReminderService, ReminderChannel } from '../../../src/application/services/IReminderService';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentType, AppointmentPriority } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';

describe('ManageAppointmentRemindersUseCase', () => {
  let useCase: ManageAppointmentRemindersUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockReminderService: jest.Mocked<IReminderService>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;

  beforeEach(() => {
    mockRepository = {
      findByAppointmentId: jest.fn(),
      save: jest.fn(),
    } as any;

    mockReminderService = {
      scheduleReminders: jest.fn().mockResolvedValue([]),
      cancelReminders: jest.fn().mockResolvedValue(undefined),
      sendReminder: jest.fn().mockResolvedValue({ success: true }),
      getPendingReminders: jest.fn().mockResolvedValue([]),
      markReminderAsSent: jest.fn().mockResolvedValue(undefined),
      markReminderAsFailed: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAuthService = {
      canManageAppointmentReminders: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new ManageAppointmentRemindersUseCase(
      mockRepository,
      mockReminderService,
      mockAuthService
    );
  });

  const createMockAppointment = (): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    const timeSlot = TimeSlot.create('2025-12-01', '10:00:00');
    const details = AppointmentDetails.create('Routine checkup');

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

  describe('execute - enable reminders', () => {
    it('should enable reminders with default windows', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        action: 'enable' as const,
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.reminders?.enabled).toBe(true);
      expect(mockReminderService.scheduleReminders).toHaveBeenCalled();
      
      // Implementation passes default windows (24h, 2h, 30m)
      const scheduleCall = mockReminderService.scheduleReminders.mock.calls[0];
      const customWindows = scheduleCall[4]; // 5th parameter
      expect(customWindows).toBeDefined();
      expect(customWindows).toHaveLength(3);
    });

    it('should enable reminders with custom windows', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const customWindows = [
        { window: '1h', channels: [ReminderChannel.SMS] },
        { window: '15m', channels: [ReminderChannel.IN_APP] },
      ];

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        action: 'enable' as const,
        reminderWindows: customWindows,
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.reminders?.windows).toBeDefined();
      expect(mockReminderService.scheduleReminders).toHaveBeenCalled();
      
      const scheduleCall = mockReminderService.scheduleReminders.mock.calls[0];
      const passedWindows = scheduleCall[4];
      expect(passedWindows).toEqual(customWindows);
    });

    it('should fail when appointment not found', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'non-existent',
        action: 'enable' as const,
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy');
    });

    it('should fail when user not authorized', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      // Mock authorization to return false
      mockAuthService.canManageAppointmentReminders.mockResolvedValue(false);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        action: 'enable' as const,
      };

      // Use different userId to fail authorization
      await expect(useCase.execute(request, {
        userId: 'unauthorized-user',
        timestamp: new Date(),
      })).rejects.toThrow(); // Base class throws UseCaseAuthorizationError
    });
  });

  describe('execute - disable reminders', () => {
    it('should disable reminders and cancel scheduled reminders', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        action: 'disable' as const,
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.reminders?.enabled).toBe(false);
      expect(mockReminderService.cancelReminders).toHaveBeenCalledWith(
        mockAppointment.getAppointmentId().value
      );
    });
  });

  describe('execute - reschedule reminders', () => {
    it('should cancel old reminders and create new ones', async () => {
      const mockAppointment = createMockAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        action: 'reschedule' as const,
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(mockReminderService.cancelReminders).toHaveBeenCalled();
      expect(mockReminderService.scheduleReminders).toHaveBeenCalled();
    });
  });

  describe('PHI compliance', () => {
    it('should mark reminder management as PHI', () => {
      const request = {
        appointmentId: 'APT-001',
        action: 'enable' as const,
      };

      expect(useCase.involvesPHI(request)).toBe(true);
    });
  });
});
