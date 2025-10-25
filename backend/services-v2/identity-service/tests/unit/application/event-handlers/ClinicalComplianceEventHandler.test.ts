/**
 * Unit Tests for ClinicalComplianceEventHandler
 * Tests event handling from Clinical EMR Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, High Test Coverage
 */

import { ClinicalComplianceEventHandler } from '@application/event-handlers/ClinicalComplianceEventHandler';
import { LockAccountUseCase } from '@application/use-cases/LockAccountUseCase';
import { TerminateAllSessionsUseCase } from '@application/use-cases/TerminateAllSessionsUseCase';
import { InboxService } from '@infrastructure/inbox/InboxService';
import { SupabaseClient } from '@supabase/supabase-js';

describe('ClinicalComplianceEventHandler', () => {
  let handler: ClinicalComplianceEventHandler;
  let mockLockAccountUseCase: jest.Mocked<LockAccountUseCase>;
  let mockTerminateAllSessionsUseCase: jest.Mocked<TerminateAllSessionsUseCase>;
  let mockInboxService: jest.Mocked<InboxService>;
  let mockSupabaseClient: jest.Mocked<SupabaseClient>;
  let mockLogger: any;

  beforeEach(() => {
    mockLockAccountUseCase = { execute: jest.fn() } as any;
    mockTerminateAllSessionsUseCase = { execute: jest.fn() } as any;
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
      single: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    handler = new ClinicalComplianceEventHandler(
      mockLockAccountUseCase,
      mockTerminateAllSessionsUseCase,
      mockInboxService,
      mockSupabaseClient,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMedicalRecordFlagged', () => {
    const mockEvent = {
      eventId: 'evt-401',
      recordId: 'record-123',
      patientId: 'patient-456',
      providerId: 'provider-789',
      flagReason: 'Unauthorized access',
      severity: 'CRITICAL' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      suspiciousActivity: 'Multiple access attempts',
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should lock account for CRITICAL severity', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-1',
        status: 'PENDING'
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      });

      await handler.handleMedicalRecordFlagged(mockEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        lockedBy: 'SYSTEM_AUTO',
        reason: expect.stringContaining('Medical record violation'),
        terminateSessions: true
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-401');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should lock account for HIGH severity', async () => {
      const highSeverityEvent = { ...mockEvent, severity: 'HIGH' };
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-2',
        status: 'PENDING'
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      });

      await handler.handleMedicalRecordFlagged(highSeverityEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalled();
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-401');
    });

    it('should not lock account for MEDIUM severity', async () => {
      const mediumSeverityEvent = { ...mockEvent, severity: 'MEDIUM' };
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-3',
        status: 'PENDING'
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      });

      await handler.handleMedicalRecordFlagged(mediumSeverityEvent);

      expect(mockLockAccountUseCase.execute).not.toHaveBeenCalled();
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-401');
    });

    it('should skip if event already processed', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(true);

      await handler.handleMedicalRecordFlagged(mockEvent);

      expect(mockInboxService.storeEvent).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Event already processed', { eventId: 'evt-401' });
    });

    it('should mark as failed on error', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('DB error'));

      await expect(handler.handleMedicalRecordFlagged(mockEvent)).rejects.toThrow('DB error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-401', 'DB error');
    });
  });

  describe('handlePrescriptionAbuseDetected', () => {
    const mockEvent = {
      eventId: 'evt-402',
      prescriptionId: 'rx-123',
      providerId: 'provider-789',
      patientId: 'patient-456',
      drugName: 'Oxycodone',
      drugClass: 'CONTROLLED_SUBSTANCE',
      abusePattern: 'Excessive prescribing',
      severity: 'CRITICAL',
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should lock provider account and terminate sessions', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-4',
        status: 'PENDING'
      });

      await handler.handlePrescriptionAbuseDetected(mockEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'provider-789',
        lockedBy: 'SYSTEM_AUTO',
        reason: expect.stringContaining('Prescription abuse detected'),
        terminateSessions: true
      });
      expect(mockTerminateAllSessionsUseCase.execute).toHaveBeenCalledWith({
        userId: 'provider-789'
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-402');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should skip if event already processed', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(true);

      await handler.handlePrescriptionAbuseDetected(mockEvent);

      expect(mockLockAccountUseCase.execute).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Event already processed', { eventId: 'evt-402' });
    });

    it('should mark as failed on error', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('DB error'));

      await expect(handler.handlePrescriptionAbuseDetected(mockEvent)).rejects.toThrow('DB error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-402', 'DB error');
    });
  });
});
