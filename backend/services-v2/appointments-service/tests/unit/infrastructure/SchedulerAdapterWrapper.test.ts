/**
 * Scheduler Adapter Wrapper Tests
 * Unit tests for SchedulerAdapterWrapper
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { SchedulerAdapterWrapper } from '../../../src/infrastructure/adapters/SchedulerAdapterWrapper';
import { RemoteSchedulerAdapter } from '../../../src/infrastructure/adapters/RemoteSchedulerAdapter';
import { ScheduleReminderTask } from '../../../src/infrastructure/adapters/ISchedulerAdapter';

describe('SchedulerAdapterWrapper', () => {
  let wrapper: SchedulerAdapterWrapper;
  let mockScheduler: jest.Mocked<RemoteSchedulerAdapter>;

  beforeEach(() => {
    mockScheduler = {
      createOrUpdateByDedup: jest.fn(),
      cancelByOwner: jest.fn(),
      isAvailable: jest.fn(),
    } as any;

    wrapper = new SchedulerAdapterWrapper(mockScheduler, 'hospital-1');
  });

  describe('scheduleReminder', () => {
    it('should map ScheduleReminderTask to CreateScheduleRequest correctly', async () => {
      // Arrange
      const task: ScheduleReminderTask = {
        appointmentId: 'APT-123',
        patientId: 'PAT-456',
        reminderType: '24h',
        scheduledFor: new Date('2025-11-30T10:00:00Z'),
        channels: ['SMS', 'EMAIL'],
      };

      mockScheduler.createOrUpdateByDedup.mockResolvedValue({
        scheduleId: 'SCH-789',
        status: 'ACTIVE',
        nextRunAt: '2025-11-30T10:00:00Z',
      });

      // Act
      const result = await wrapper.scheduleReminder(task);

      // Assert
      expect(result.success).toBe(true);
      expect(result.scheduleId).toBe('SCH-789');
      expect(mockScheduler.createOrUpdateByDedup).toHaveBeenCalledWith({
        tenantId: 'hospital-1',
        dedupKey: 'reminder:APT-123:24h',
        ownerService: 'appointments',
        ownerResourceType: 'APPOINTMENT',
        ownerResourceId: 'APT-123',
        topicOrCommand: 'notifications.send_reminder',
        scheduleType: 'ONCE',
        startAtUtc: '2025-11-30T10:00:00.000Z',
        payloadJson: {
          appointmentId: 'APT-123',
          patientId: 'PAT-456',
          reminderType: '24h',
          channels: ['SMS', 'EMAIL'],
        },
        retryPolicy: {
          strategy: 'exp',
          maxAttempts: 3,
          baseMs: 1000,
          maxDelayMs: 10000,
        },
      });
    });

    it('should return error response when scheduler fails', async () => {
      // Arrange
      const task: ScheduleReminderTask = {
        appointmentId: 'APT-123',
        patientId: 'PAT-456',
        reminderType: '2h',
        scheduledFor: new Date('2025-11-30T10:00:00Z'),
        channels: ['APP'],
      };

      mockScheduler.createOrUpdateByDedup.mockRejectedValue(
        new Error('Scheduler service unavailable')
      );

      // Act
      const result = await wrapper.scheduleReminder(task);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Scheduler service unavailable');
    });
  });

  describe('cancelReminders', () => {
    it('should map appointmentId to CancelByOwnerRequest correctly', async () => {
      // Arrange
      mockScheduler.cancelByOwner.mockResolvedValue({
        cancelledCount: 3,
      });

      // Act
      const result = await wrapper.cancelReminders('APT-123');

      // Assert
      expect(result.success).toBe(true);
      expect(mockScheduler.cancelByOwner).toHaveBeenCalledWith({
        tenantId: 'hospital-1',
        ownerService: 'appointments',
        ownerResourceType: 'APPOINTMENT',
        ownerResourceId: 'APT-123',
      });
    });

    it('should return error response when cancellation fails', async () => {
      // Arrange
      mockScheduler.cancelByOwner.mockRejectedValue(
        new Error('Connection timeout')
      );

      // Act
      const result = await wrapper.cancelReminders('APT-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Connection timeout');
    });
  });

  describe('isAvailable', () => {
    it('should delegate to underlying scheduler', async () => {
      // Arrange
      mockScheduler.isAvailable.mockResolvedValue(true);

      // Act
      const result = await wrapper.isAvailable();

      // Assert
      expect(result).toBe(true);
      expect(mockScheduler.isAvailable).toHaveBeenCalled();
    });

    it('should return false when scheduler unavailable', async () => {
      // Arrange
      mockScheduler.isAvailable.mockResolvedValue(false);

      // Act
      const result = await wrapper.isAvailable();

      // Assert
      expect(result).toBe(false);
    });
  });
});
