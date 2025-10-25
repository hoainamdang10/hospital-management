/**
 * Unit Tests for NotificationEventHandler
 * Tests event handling from Notifications Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, High Test Coverage
 */

import { NotificationEventHandler } from '@application/event-handlers/NotificationEventHandler';
import { LockAccountUseCase } from '@application/use-cases/LockAccountUseCase';
import { InboxService } from '@infrastructure/inbox/InboxService';
import { SupabaseClient } from '@supabase/supabase-js';

describe('NotificationEventHandler', () => {
  let handler: NotificationEventHandler;
  let mockLockAccountUseCase: jest.Mocked<LockAccountUseCase>;
  let mockInboxService: jest.Mocked<InboxService>;
  let mockSupabaseClient: jest.Mocked<SupabaseClient>;
  let mockLogger: any;

  beforeEach(() => {
    mockLockAccountUseCase = { execute: jest.fn() } as any;
    mockInboxService = {
      checkProcessed: jest.fn(),
      storeEvent: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn()
    } as any;

    mockSupabaseClient = {
      schema: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      single: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    handler = new NotificationEventHandler(
      mockLockAccountUseCase,
      mockInboxService,
      mockSupabaseClient,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleNotificationDeliveryFailed', () => {
    const mockEvent = {
      eventId: 'evt-601',
      notificationId: 'notif-123',
      userId: 'user-456',
      channel: 'EMAIL',
      failureReason: 'Invalid email address',
      attemptCount: 5,
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should lock account if >= 10 consecutive failures', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-1',
        status: 'PENDING'
      });

      // Mock count query - 10 failures
      mockSupabaseClient.single.mockResolvedValue({
        data: { count: 10 },
        error: null
      });

      await handler.handleNotificationDeliveryFailed(mockEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-456',
        lockedBy: 'SYSTEM_AUTO',
        reason: expect.stringContaining('Notification delivery failures'),
        terminateSessions: false
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-601');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should not lock account if < 10 failures', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-2',
        status: 'PENDING'
      });

      // Mock count query - 5 failures
      mockSupabaseClient.single.mockResolvedValue({
        data: { count: 5 },
        error: null
      });

      await handler.handleNotificationDeliveryFailed(mockEvent);

      expect(mockLockAccountUseCase.execute).not.toHaveBeenCalled();
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-601');
    });

    it('should skip if event already processed (idempotency)', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(true);

      await handler.handleNotificationDeliveryFailed(mockEvent);

      expect(mockInboxService.checkProcessed).toHaveBeenCalledWith('evt-601');
      expect(mockInboxService.storeEvent).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Event already processed', { eventId: 'evt-601' });
    });

    it('should mark as failed on error', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('Database error'));

      await expect(handler.handleNotificationDeliveryFailed(mockEvent)).rejects.toThrow('Database error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-601', 'Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
