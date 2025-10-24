/**
 * BillingEventHandler Unit Tests
 * Provider/Staff Service V2
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BillingEventHandler } from '../../../../src/infrastructure/events/BillingEventHandler';
import {
  PaymentProcessedEvent,
  InvoiceGeneratedEvent,
  ConsultationFeeUpdatedEvent,
  PaymentRefundedEvent
} from '@shared/domain/events/billing.events';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { IAuditService } from '../../../../src/application/interfaces/IAuditService';

describe('BillingEventHandler', () => {
  let handler: BillingEventHandler;
  let mockLogger: jest.Mocked<ILogger>;
  let mockAuditService: jest.Mocked<IAuditService>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      log: jest.fn()
    } as jest.Mocked<ILogger>;

    mockAuditService = {
      logDataAccess: jest.fn(),
      logDataModification: jest.fn(),
      logSecurityEvent: jest.fn(),
      logAction: jest.fn()
    } as jest.Mocked<IAuditService>;

    handler = new BillingEventHandler(mockLogger, mockAuditService);
  });

  describe('handlePaymentProcessed', () => {
    it('should log payment processed event', async () => {
      // Arrange
      const event = new PaymentProcessedEvent(
        'payment-1',
        'invoice-1',
        'staff-123',
        'patient-1',
        500000,
        300000,
        'CREDIT_CARD'
      );

      // Act
      await handler.handlePaymentProcessed(event);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Handling PaymentProcessed event from Billing Service',
        expect.objectContaining({
          paymentId: 'payment-1',
          staffId: 'staff-123',
          amount: 500000,
          consultationFee: 300000
        })
      );
      expect(mockAuditService.logDataModification).toHaveBeenCalled();
    });

    it('should implement idempotency - skip duplicate events', async () => {
      // Arrange
      const event = new PaymentProcessedEvent(
        'payment-1',
        'invoice-1',
        'staff-123',
        'patient-1',
        500000,
        300000,
        'CREDIT_CARD'
      );

      // Act - Process same event twice
      await handler.handlePaymentProcessed(event);
      await handler.handlePaymentProcessed(event);

      // Assert - Should only log once
      expect(mockAuditService.logDataModification).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully without throwing', async () => {
      // Arrange
      const event = new PaymentProcessedEvent(
        'payment-1',
        'invoice-1',
        'staff-123',
        'patient-1',
        500000,
        300000,
        'CREDIT_CARD'
      );

      mockAuditService.logDataModification.mockRejectedValue(new Error('Audit service error'));

      // Act & Assert - Should not throw
      await expect(handler.handlePaymentProcessed(event)).resolves.not.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleInvoiceGenerated', () => {
    it('should log invoice generated event', async () => {
      // Arrange
      const event = new InvoiceGeneratedEvent(
        'invoice-1',
        'staff-123',
        'patient-1',
        500000,
        300000,
        200000,
        'appointment-1'
      );

      // Act
      await handler.handleInvoiceGenerated(event);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Handling InvoiceGenerated event from Billing Service',
        expect.objectContaining({
          invoiceId: 'invoice-1',
          staffId: 'staff-123',
          totalAmount: 500000,
          consultationFee: 300000
        })
      );
      expect(mockAuditService.logDataModification).toHaveBeenCalled();
    });
  });

  describe('handleConsultationFeeUpdated', () => {
    it('should log consultation fee updated event', async () => {
      // Arrange
      const event = new ConsultationFeeUpdatedEvent(
        'staff-123',
        300000,
        350000,
        'admin-1',
        new Date('2025-02-01'),
        'Annual fee adjustment'
      );

      // Act
      await handler.handleConsultationFeeUpdated(event);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Handling ConsultationFeeUpdated event from Billing Service',
        expect.objectContaining({
          staffId: 'staff-123',
          oldFee: 300000,
          newFee: 350000
        })
      );
      expect(mockAuditService.logDataModification).toHaveBeenCalled();
    });
  });

  describe('handlePaymentRefunded', () => {
    it('should log payment refunded event', async () => {
      // Arrange
      const event = new PaymentRefundedEvent(
        'refund-1',
        'payment-1',
        'invoice-1',
        'staff-123',
        'patient-1',
        500000,
        'Service not provided',
        'admin-1'
      );

      // Act
      await handler.handlePaymentRefunded(event);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Handling PaymentRefunded event from Billing Service',
        expect.objectContaining({
          refundId: 'refund-1',
          staffId: 'staff-123',
          refundAmount: 500000
        })
      );
      expect(mockAuditService.logDataModification).toHaveBeenCalled();
    });
  });

  describe('getHandlerName', () => {
    it('should return correct handler name', () => {
      expect(handler.getHandlerName()).toBe('BillingEventHandler');
    });
  });
});
