/**
 * Unit Tests for StaffLifecycleEventHandler
 * Tests event handling from Provider Staff Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, High Test Coverage
 */

import { StaffLifecycleEventHandler } from '@application/event-handlers/StaffLifecycleEventHandler';
import { ActivateUserUseCase } from '@application/use-cases/ActivateUserUseCase';
import { InboxService } from '@infrastructure/inbox/InboxService';

describe('StaffLifecycleEventHandler', () => {
  let handler: StaffLifecycleEventHandler;
  let mockActivateUserUseCase: jest.Mocked<ActivateUserUseCase>;
  let mockInboxService: jest.Mocked<InboxService>;
  let mockLogger: any;

  beforeEach(() => {
    mockActivateUserUseCase = { execute: jest.fn() } as any;
    mockInboxService = {
      checkProcessed: jest.fn(),
      storeEvent: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    handler = new StaffLifecycleEventHandler(
      mockActivateUserUseCase,
      mockInboxService,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleStaffRegistered', () => {
    const mockEvent = {
      eventId: 'evt-501',
      staffId: 'staff-123',
      userId: 'user-456',
      staffType: 'DOCTOR',
      licenseNumber: 'LIC-12345',
      employmentType: 'FULL_TIME',
      hireDate: new Date('2025-01-01T10:00:00Z'),
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should activate user account when staff registered', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-1',
        status: 'PENDING'
      });

      await handler.handleStaffRegistered(mockEvent);

      expect(mockInboxService.checkProcessed).toHaveBeenCalledWith('evt-501');
      expect(mockInboxService.storeEvent).toHaveBeenCalledWith({
        eventId: 'evt-501',
        eventType: 'StaffRegisteredEvent',
        aggregateId: 'staff-123',
        aggregateType: 'Staff',
        payloadJson: mockEvent,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.registered',
        occurredAt: mockEvent.occurredAt
      });
      expect(mockActivateUserUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-456',
        activatedBy: 'SYSTEM_AUTO',
        reason: 'Staff registered: DOCTOR (License: LIC-12345)'
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-501');
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should skip if event already processed (idempotency)', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(true);

      await handler.handleStaffRegistered(mockEvent);

      expect(mockInboxService.checkProcessed).toHaveBeenCalledWith('evt-501');
      expect(mockInboxService.storeEvent).not.toHaveBeenCalled();
      expect(mockActivateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Event already processed', { eventId: 'evt-501' });
    });

    it('should mark as failed on error', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('Database error'));

      await expect(handler.handleStaffRegistered(mockEvent)).rejects.toThrow('Database error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-501', 'Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle use case failure gracefully', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-2',
        status: 'PENDING'
      });
      mockActivateUserUseCase.execute.mockRejectedValue(new Error('User not found'));

      await expect(handler.handleStaffRegistered(mockEvent)).rejects.toThrow('User not found');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-501', 'User not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
