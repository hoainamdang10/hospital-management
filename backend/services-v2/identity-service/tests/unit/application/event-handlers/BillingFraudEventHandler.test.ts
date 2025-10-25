/**
 * Unit Tests for BillingFraudEventHandler
 * Tests event handling from Billing Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, High Test Coverage
 */

import { BillingFraudEventHandler } from '@application/event-handlers/BillingFraudEventHandler';
import { LockAccountUseCase } from '@application/use-cases/LockAccountUseCase';
import { InboxService } from '@infrastructure/inbox/InboxService';
import { SupabaseClient } from '@supabase/supabase-js';

describe('BillingFraudEventHandler', () => {
  let handler: BillingFraudEventHandler;
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

    const mockSingle = jest.fn();
    mockSupabaseClient = {
      schema: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnValue({ single: mockSingle }),
      single: mockSingle
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    handler = new BillingFraudEventHandler(
      mockLockAccountUseCase,
      mockInboxService,
      mockSupabaseClient,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePaymentFailed', () => {
    const mockEvent = {
      eventId: 'evt-201',
      patientId: 'patient-123',
      invoiceId: 'inv-456',
      amount: 500000,
      failureReason: 'Insufficient funds',
      attemptCount: 3,
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should flag account if >= 3 failures in 30 days', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-1',
        status: 'PENDING'
      });

      // Mock count query - 3 failures
      mockSupabaseClient.single.mockResolvedValue({
        data: { count: 3 },
        error: null
      });

      await handler.handlePaymentFailed(mockEvent);

      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-201');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should skip if event already processed', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(true);

      await handler.handlePaymentFailed(mockEvent);

      expect(mockInboxService.storeEvent).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Event already processed', { eventId: 'evt-201' });
    });

    it('should mark as failed on error', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('DB error'));

      await expect(handler.handlePaymentFailed(mockEvent)).rejects.toThrow('DB error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-201', 'DB error');
    });
  });

  describe('handleInvoiceOverdue', () => {
    const mockEvent = {
      eventId: 'evt-202',
      patientId: 'patient-123',
      invoiceId: 'inv-456',
      daysOverdue: 95,
      totalAmount: 5000000,
      dueDate: new Date('2024-10-01T00:00:00Z'),
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should lock account if > 90 days overdue', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-2',
        status: 'PENDING'
      });

      await handler.handleInvoiceOverdue(mockEvent);

      expect(mockLockAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'patient-123',
        lockedBy: 'SYSTEM_AUTO',
        reason: expect.stringContaining('Invoice overdue 95 days'),
        terminateSessions: false
      });
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-202');
    });

    it('should not lock account if <= 90 days overdue', async () => {
      const event = { ...mockEvent, daysOverdue: 60 };
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-3',
        status: 'PENDING'
      });

      await handler.handleInvoiceOverdue(event);

      expect(mockLockAccountUseCase.execute).not.toHaveBeenCalled();
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-202');
    });
  });

  describe('handlePaymentProcessed', () => {
    const mockEvent = {
      eventId: 'evt-203',
      patientId: 'patient-123',
      invoiceId: 'inv-456',
      amount: 1000000,
      paymentMethod: 'CREDIT_CARD',
      transactionId: 'txn-12345',
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should process payment successfully', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-4',
        status: 'PENDING'
      });

      await handler.handlePaymentProcessed(mockEvent);

      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-203');
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('handleBillingDisputeFiled', () => {
    const mockEvent = {
      eventId: 'evt-204',
      disputeId: 'dispute-001',
      patientId: 'patient-123',
      invoiceId: 'inv-456',
      disputeReason: 'Incorrect charges',
      disputeAmount: 500000,
      filedAt: new Date('2025-01-01T09:00:00Z'),
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should process dispute successfully', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-5',
        status: 'PENDING'
      });

      await handler.handleBillingDisputeFiled(mockEvent);

      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-204');
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('handlePaymentRefunded', () => {
    const mockEvent = {
      eventId: 'evt-205',
      refundId: 'refund-001',
      patientId: 'patient-123',
      invoiceId: 'inv-456',
      refundAmount: 1000000,
      refundReason: 'Service not provided',
      originalPaymentId: 'payment-123',
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should flag account if >= 5 refunds in 90 days', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-6',
        status: 'PENDING'
      });

      // Mock count query - 5 refunds
      mockSupabaseClient.single.mockResolvedValue({
        data: { count: 5 },
        error: null
      });

      await handler.handlePaymentRefunded(mockEvent);

      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-205');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('handleInsuranceClaimRejected', () => {
    const mockEvent = {
      eventId: 'evt-206',
      claimId: 'claim-456',
      patientId: 'patient-123',
      insuranceProvider: 'BHYT',
      rejectionReason: 'Invalid documentation',
      claimAmount: 2000000,
      occurredAt: new Date('2025-01-01T10:00:00Z')
    };

    it('should flag account if >= 3 rejections in 60 days', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-7',
        status: 'PENDING'
      });

      // Mock count query - 3 rejections
      (mockSupabaseClient.gte as jest.Mock).mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { count: 3 },
          error: null
        })
      });

      await handler.handleInsuranceClaimRejected(mockEvent);

      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-206');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
