/**
 * Reminder Service Unit Tests
 * Tests reminder scheduling logic via scheduler-service integration
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { ReminderService } from '../../../../src/infrastructure/services/ReminderService';
import { ISchedulerAdapter } from '../../../../src/infrastructure/adapters/ISchedulerAdapter';
import { ReminderChannel, ReminderType } from '../../../../src/application/services/IReminderService';

describe('ReminderService', () => {
  let service: ReminderService;
  let mockSchedulerAdapter: jest.Mocked<ISchedulerAdapter>;

  beforeEach(() => {
    mockSchedulerAdapter = {
      scheduleReminder: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-1',
        success: true,
      }),
      cancelReminders: jest.fn().mockResolvedValue({
        success: true,
        cancelledCount: 2,
      }),
      rescheduleReminders: jest.fn().mockResolvedValue({
        success: true,
        rescheduledCount: 2,
      }),
      isAvailable: jest.fn().mockResolvedValue(true),
    } as any;

    service = new ReminderService(mockSchedulerAdapter);
  });

  describe('scheduleReminders', () => {
    it('should schedule default reminders for NORMAL priority', async () => {
      const appointmentDateTime = new Date('2025-12-01T10:00:00Z');

      const schedules = await service.scheduleReminders(
        'apt-1',
        'patient-1',
        appointmentDateTime,
        'NORMAL'
      );

      expect(schedules.length).toBeGreaterThan(0);
      expect(mockSchedulerAdapter.scheduleReminder).toHaveBeenCalled();
      
      // Verify 24h reminder scheduled
      expect(schedules.some(s => s.reminderType === ReminderType.BEFORE_24H)).toBe(true);
      // Verify 2h reminder scheduled
      expect(schedules.some(s => s.reminderType === ReminderType.BEFORE_2H)).toBe(true);
    });

    it('should schedule reminders for URGENT priority with SMS', async () => {
      const appointmentDateTime = new Date('2025-12-01T10:00:00Z');

      const schedules = await service.scheduleReminders(
        'apt-1',
        'patient-1',
        appointmentDateTime,
        'URGENT'
      );

      expect(schedules.length).toBeGreaterThan(0);
      
      // Urgent should have SMS channel
      const hasSMS = schedules.some(s => 
        s.channels.includes(ReminderChannel.SMS)
      );
      expect(hasSMS).toBe(true);
    });

    it('should not schedule reminders for EMERGENCY priority', async () => {
      const appointmentDateTime = new Date('2025-12-01T10:00:00Z');

      const schedules = await service.scheduleReminders(
        'apt-1',
        'patient-1',
        appointmentDateTime,
        'EMERGENCY'
      );

      expect(schedules.length).toBe(0);
      expect(mockSchedulerAdapter.scheduleReminder).not.toHaveBeenCalled();
    });

    it('should use custom reminder windows when provided', async () => {
      const appointmentDateTime = new Date('2025-12-01T10:00:00Z');
      const customWindows = [
        { window: '48h', channels: [ReminderChannel.EMAIL] },
        { window: '1h', channels: [ReminderChannel.SMS, ReminderChannel.PUSH] },
      ];

      const schedules = await service.scheduleReminders(
        'apt-1',
        'patient-1',
        appointmentDateTime,
        'NORMAL',
        customWindows
      );

      expect(schedules.length).toBe(2);
      // Custom windows should result in reminders being scheduled
      expect(mockSchedulerAdapter.scheduleReminder).toHaveBeenCalledTimes(2);
    });

    it('should skip reminders scheduled in the past', async () => {
      const pastAppointment = new Date('2025-01-01T10:00:00Z');

      const schedules = await service.scheduleReminders(
        'apt-1',
        'patient-1',
        pastAppointment,
        'NORMAL'
      );

      // All reminders should be skipped for past appointments
      expect(schedules.length).toBe(0);
    });

    it('should calculate correct reminder times', async () => {
      const appointmentDateTime = new Date('2025-12-01T10:00:00Z');

      const schedules = await service.scheduleReminders(
        'apt-1',
        'patient-1',
        appointmentDateTime,
        'NORMAL'
      );

      const reminder24h = schedules.find(s => s.reminderType === ReminderType.BEFORE_24H);
      expect(reminder24h).toBeDefined();
      
      // 24h before appointment should be 2025-11-30T10:00:00Z
      const expected24h = new Date('2025-11-30T10:00:00Z');
      expect(reminder24h?.scheduledFor.getTime()).toBe(expected24h.getTime());
    });

    it('should include multiple channels for each reminder', async () => {
      const appointmentDateTime = new Date('2025-12-01T10:00:00Z');

      const schedules = await service.scheduleReminders(
        'apt-1',
        'patient-1',
        appointmentDateTime,
        'NORMAL'
      );

      schedules.forEach(schedule => {
        expect(schedule.channels.length).toBeGreaterThan(0);
        expect(Array.isArray(schedule.channels)).toBe(true);
      });
    });
  });

  describe('cancelReminders', () => {
    it('should cancel all reminders for appointment', async () => {
      await service.cancelReminders('apt-1');

      expect(mockSchedulerAdapter.cancelReminders).toHaveBeenCalledWith('apt-1');
    });

    it('should handle scheduler adapter errors', async () => {
      mockSchedulerAdapter.cancelReminders.mockRejectedValue(
        new Error('Scheduler unavailable')
      );

      await expect(service.cancelReminders('apt-1')).rejects.toThrow('Scheduler unavailable');
    });
  });

  describe('rescheduleReminders', () => {
    it('should reschedule reminders for new appointment time', async () => {
      const newDateTime = new Date('2025-12-02T14:00:00Z');

      const result = await service.rescheduleReminders(
        'apt-1',
        'patient-1',
        newDateTime,
        'NORMAL'
      );

      expect(result.success).toBe(true);
      expect(mockSchedulerAdapter.cancelReminders).toHaveBeenCalledWith('apt-1');
      expect(mockSchedulerAdapter.scheduleReminder).toHaveBeenCalled();
    });

    it('should use new custom windows when rescheduling', async () => {
      const newDateTime = new Date('2025-12-02T14:00:00Z');
      const newWindows = [
        { window: '12h', channels: [ReminderChannel.EMAIL] },
      ];

      const result = await service.rescheduleReminders(
        'apt-1',
        'patient-1',
        newDateTime,
        'NORMAL',
        newWindows
      );

      expect(result.success).toBe(true);
      expect(result.newSchedules?.length).toBe(1);
      expect(result.newSchedules?.[0].window).toBe('12h');
    });
  });

  describe('checkSchedulerHealth', () => {
    it('should return healthy when scheduler is available', async () => {
      const health = await service.checkSchedulerHealth();

      expect(health.healthy).toBe(true);
      expect(mockSchedulerAdapter.isAvailable).toHaveBeenCalled();
    });

    it('should return unhealthy when scheduler is down', async () => {
      mockSchedulerAdapter.isAvailable.mockResolvedValue(false);

      const health = await service.checkSchedulerHealth();

      expect(health.healthy).toBe(false);
      expect(health.message).toContain('unavailable');
    });
  });

  describe('previewReminders', () => {
    it('should preview reminders without scheduling', async () => {
      const appointmentDateTime = new Date('2025-12-01T10:00:00Z');

      const preview = await service.previewReminders(
        appointmentDateTime,
        'NORMAL'
      );

      expect(preview.length).toBeGreaterThan(0);
      expect(mockSchedulerAdapter.scheduleReminder).not.toHaveBeenCalled();
    });

    it('should preview custom reminder windows', async () => {
      const appointmentDateTime = new Date('2025-12-01T10:00:00Z');
      const customWindows = [
        { window: '72h', channels: [ReminderChannel.EMAIL] },
      ];

      const preview = await service.previewReminders(
        appointmentDateTime,
        'NORMAL',
        customWindows
      );

      expect(preview.length).toBe(1);
      expect(preview[0].window).toBe('72h');
    });
  });
});
