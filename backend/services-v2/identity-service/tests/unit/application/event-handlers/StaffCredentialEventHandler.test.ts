/**
 * Unit Tests for StaffCredentialEventHandler
 * Tests event handling from Provider Staff Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, High Test Coverage
 */

import { StaffCredentialEventHandler } from '@application/event-handlers/StaffCredentialEventHandler';
import { LockAccountUseCase } from '@application/use-cases/LockAccountUseCase';
import { UnlockAccountUseCase } from '@application/use-cases/UnlockAccountUseCase';
import { TerminateAllSessionsUseCase } from '@application/use-cases/TerminateAllSessionsUseCase';
import { InboxService } from '@infrastructure/inbox/InboxService';

describe('StaffCredentialEventHandler', () => {
  let handler: StaffCredentialEventHandler;
  let mockLockAccountUseCase: jest.Mocked<LockAccountUseCase>;
  let mockUnlockAccountUseCase: jest.Mocked<UnlockAccountUseCase>;
  let mockTerminateAllSessionsUseCase: jest.Mocked<TerminateAllSessionsUseCase>;
  let mockInboxService: jest.Mocked<InboxService>;
  let mockSupabaseClient: any;
  let mockLogger: any;

  beforeEach(() => {
    // Mock use cases
    mockLockAccountUseCase = {
      execute: jest.fn()
    } as any;

    mockUnlockAccountUseCase = {
      execute: jest.fn()
    } as any;

    mockTerminateAllSessionsUseCase = {
      execute: jest.fn()
    } as any;

    // Mock InboxService
    mockInboxService = {
      checkProcessed: jest.fn(),
      storeEvent: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn()
    } as any;

    // Mock Supabase Client with proper chain
    const mockSingle = jest.fn();
    mockSupabaseClient = {
      schema: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      eq: jest.fn().mockReturnThis(),
      single: mockSingle,
      auth: {
        admin: {
          updateUserById: jest.fn().mockResolvedValue({ error: null })
        }
      }
    } as any;

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    handler = new StaffCredentialEventHandler(
      mockLockAccountUseCase,
      mockUnlockAccountUseCase,
      mockTerminateAllSessionsUseCase,
      mockInboxService,
      mockSupabaseClient,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleStaffCredentialVerified', () => {
    const mockEvent = {
      eventId: 'evt-123',
      staffId: 'staff-456',
      credentialNumber: 'CRED-789',
      credentialType: 'MEDICAL_LICENSE',
      issuingAuthority: 'Ministry of Health',
      verifiedAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should process event successfully', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-1',
        status: 'PENDING'
      });

      await handler.handleStaffCredentialVerified(mockEvent);

      expect(mockInboxService.checkProcessed).toHaveBeenCalledWith('evt-123');
      expect(mockInboxService.storeEvent).toHaveBeenCalledWith({
        eventId: 'evt-123',
        eventType: 'StaffCredentialVerifiedEvent',
        aggregateId: 'staff-456',
        aggregateType: 'Staff',
        payloadJson: mockEvent,
        sourceService: 'provider-staff-service',
        routingKey: 'staff.credential_verified',
        occurredAt: mockEvent.verifiedAt
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-123');
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should skip processing if event already processed (idempotency)', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(true);

      await handler.handleStaffCredentialVerified(mockEvent);

      expect(mockInboxService.checkProcessed).toHaveBeenCalledWith('evt-123');
      expect(mockInboxService.storeEvent).not.toHaveBeenCalled();
      expect(mockInboxService.markProcessed).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Event already processed', { eventId: 'evt-123' });
    });

    it('should mark as failed on error', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('Database error'));

      await expect(handler.handleStaffCredentialVerified(mockEvent)).rejects.toThrow('Database error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-123', 'Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleStaffStatusChanged', () => {
    const mockEvent = {
      eventId: 'evt-124',
      staffId: 'staff-456',
      oldStatus: 'active',
      newStatus: 'suspended',
      reason: 'Performance issues',
      changedBy: 'admin-123'
    };

    it('should lock account when status changed to suspended', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-2',
        status: 'PENDING'
      });

      // Mock user lookup
      await handler.handleStaffStatusChanged(mockEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'staff-456', // Uses staffId as userId
        lockedBy: 'admin-123',
        reason: 'Performance issues',
        terminateSessions: true
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-124');
    });

    it('should unlock account when status changed from suspended to active', async () => {
      const reactivateEvent = {
        ...mockEvent,
        oldStatus: 'suspended',
        newStatus: 'active',
        reason: 'Performance improved'
      };

      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-3',
        status: 'PENDING'
      });

      await handler.handleStaffStatusChanged(reactivateEvent);

      expect(mockUnlockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'staff-456', // Uses staffId as userId
        unlockedBy: 'admin-123',
        reason: 'Performance improved'
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-124');
    });

    it('should still lock account even when processing (uses staffId as userId)', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-4',
        status: 'PENDING'
      });

      await handler.handleStaffStatusChanged(mockEvent);

      // Business logic uses staffId as userId, so lock is always called
      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'staff-456',
        lockedBy: 'admin-123',
        reason: 'Performance issues',
        terminateSessions: true
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-124');
    });
  });

  describe('handleStaffCredentialExpired', () => {
    const mockEvent = {
      eventId: 'evt-125',
      staffId: 'staff-456',
      credentialNumber: 'CRED-789',
      credentialType: 'MEDICAL_LICENSE',
      expirationDate: new Date('2025-01-01T00:00:00Z'),
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should lock account when credential expires', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-5',
        status: 'PENDING'
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { user_id: 'user-789' },
        error: null
      });

      await handler.handleStaffCredentialExpired(mockEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'staff-456',
        lockedBy: 'SYSTEM_AUTO',
        reason: 'Credential expired: MEDICAL_LICENSE (CRED-789)',
        terminateSessions: true
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-125');
    });
  });

  describe('handleStaffLicenseRevoked', () => {
    const mockEvent = {
      eventId: 'evt-126',
      staffId: 'staff-456',
      licenseNumber: 'LIC-789',
      revocationReason: 'Malpractice',
      revokedBy: 'admin-123',
      revocationDate: new Date('2025-01-01T00:00:00Z'),
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should lock account and terminate sessions when license revoked', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-6',
        status: 'PENDING'
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { user_id: 'user-789' },
        error: null
      });

      await handler.handleStaffLicenseRevoked(mockEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'staff-456',
        lockedBy: 'SYSTEM_AUTO',
        reason: 'License revoked: Malpractice',
        terminateSessions: true
      });
      expect(mockTerminateAllSessionsUseCase.execute).toHaveBeenCalledWith({
        userId: 'staff-456'
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-126');
    });
  });

  describe('handleStaffPerformanceFlagged', () => {
    it('should lock account when severity is CRITICAL', async () => {
      const mockEvent = {
        eventId: 'evt-127',
        staffId: 'staff-456',
        flagReason: 'Multiple patient complaints',
        severity: 'CRITICAL',
        performanceMetrics: { complaints: 5 },
        flaggedBy: 'admin-123',
        occurredAt: new Date('2025-01-01T10:00:00Z')
      };

      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-7',
        status: 'PENDING'
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { user_id: 'user-789' },
        error: null
      });

      await handler.handleStaffPerformanceFlagged(mockEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'staff-456',
        lockedBy: 'SYSTEM_AUTO',
        reason: 'Account locked due to CRITICAL performance issue: Multiple patient complaints'
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-127');
      expect(mockInboxService.markFailed).not.toHaveBeenCalled();
    });

    it('should only flag account when severity is not CRITICAL', async () => {
      const mockEvent = {
        eventId: 'evt-128',
        staffId: 'staff-456',
        flagReason: 'Minor performance issue',
        severity: 'MEDIUM',
        performanceMetrics: { complaints: 2 },
        flaggedBy: 'admin-123',
        occurredAt: new Date('2025-01-01T10:00:00Z')
      };

      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-8',
        status: 'PENDING'
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { user_id: 'user-789' },
        error: null
      });

      await handler.handleStaffPerformanceFlagged(mockEvent);

      expect(mockLockAccountUseCase.execute).not.toHaveBeenCalled();
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-128');
      expect(mockInboxService.markFailed).not.toHaveBeenCalled();
    });
  });

  describe('handleStaffDepartmentChanged', () => {
    const mockEvent = {
      eventId: 'evt-129',
      staffId: 'staff-456',
      userId: 'user-789',
      oldDepartmentId: 'dept-1',
      newDepartmentId: 'dept-2',
      oldDepartmentName: 'Cardiology',
      newDepartmentName: 'Emergency',
      effectiveDate: new Date('2025-01-01T00:00:00Z'),
      changedBy: 'admin-123',
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should update user metadata with new department', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-9',
        status: 'PENDING'
      });

      (mockSupabaseClient.auth.admin.updateUserById as jest.Mock).mockResolvedValue({
        data: { user: {} },
        error: null
      });

      await handler.handleStaffDepartmentChanged(mockEvent);

      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-789',
        {
          user_metadata: {
            department_id: 'dept-2',
            department_name: 'Emergency',
            department_changed_at: mockEvent.effectiveDate.toISOString(),
            previous_department: 'Cardiology'
          }
        }
      );
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-129');
      expect(mockInboxService.markFailed).not.toHaveBeenCalled();
    });
  });

  describe('handleStaffScheduleUpdated', () => {
    const mockEvent = {
      eventId: 'evt-130',
      staffId: 'staff-456',
      userId: 'user-789',
      scheduleType: 'WEEKLY',
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
      workingHours: {
        start: '08:00',
        end: '17:00'
      },
      isAvailable: true,
      updatedBy: 'admin-123',
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should update user metadata with schedule info', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-10',
        status: 'PENDING'
      });

      (mockSupabaseClient.auth.admin.updateUserById as jest.Mock).mockResolvedValue({
        data: { user: {} },
        error: null
      });

      await handler.handleStaffScheduleUpdated(mockEvent);

      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-789',
        {
          user_metadata: {
            schedule_type: 'WEEKLY',
            working_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
            working_hours: {
              start: '08:00',
              end: '17:00'
            },
            is_available: true,
            schedule_updated_at: mockEvent.occurredAt.toISOString()
          }
        }
      );
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-130');
      expect(mockInboxService.markFailed).not.toHaveBeenCalled();
    });
  });
});
