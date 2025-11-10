/**
 * RefundPaymentUseCase Unit Tests
 * Tests for payment refund use case logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RefundPaymentUseCase } from '../../../src/application/use-cases/RefundPaymentUseCase';
import { IInvoiceRepository } from '../../../src/domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';
import { Invoice } from '../../../src/domain/aggregates/Invoice';
import { Money } from '../../../src/domain/value-objects/Money';
import { InvoiceStatus } from '../../../src/domain/value-objects/InvoiceStatus';
import { Payment } from '../../../src/domain/entities/Payment';

describe('RefundPaymentUseCase', () => {
  let useCase: RefundPaymentUseCase;
  let mockRepository: jest.Mocked<IInvoiceRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      findByInvoiceNumber: jest.fn(),
      findOverdueInvoices: jest.fn(),
      search: jest.fn(),
      getRevenueSummary: jest.fn(),
      delete: jest.fn()
    } as any;

    mockEventBus = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn()
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn()
    } as any;

    useCase = new RefundPaymentUseCase(mockRepository, mockEventBus, mockLogger);
  });

  describe('execute', () => {
    it('should refund payment successfully', async () => {
      // Create mock invoice with payment
      const mockInvoice = {
        id: 'inv-123',
        patientId: 'pat-123',
        totalAmount: Money.create(1000000),
        outstandingAmount: Money.create(0),
        status: InvoiceStatus.create('paid'),
        payments: [
          {
            id: 'pay-123',
            amount: Money.create(1000000),
            method: 'cash',
            status: 'completed',
            transactionId: 'txn-123',
            refund: jest.fn()
          }
        ],
        processRefund: jest.fn()
      } as any;

      mockRepository.findById.mockResolvedValue(mockInvoice);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const request = {
        invoiceId: 'inv-123',
        paymentId: 'pay-123',
        amount: 500000,
        reason: 'Customer request'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.refundedAmount).toBe(500000);
      expect(mockRepository.save).toHaveBeenCalledWith(mockInvoice);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Payment refunded successfully',
        expect.any(Object)
      );
    });

    it('should fail when invoice not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const request = {
        invoiceId: 'inv-999',
        paymentId: 'pay-123',
        amount: 500000,
        reason: 'Customer request'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Invoice not found');
    });

    it('should fail when payment not found', async () => {
      const mockInvoice = {
        id: 'inv-123',
        payments: []
      } as any;

      mockRepository.findById.mockResolvedValue(mockInvoice);

      const request = {
        invoiceId: 'inv-123',
        paymentId: 'pay-999',
        amount: 500000,
        reason: 'Customer request'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Payment not found');
    });

    it('should fail when payment already refunded', async () => {
      const mockInvoice = {
        id: 'inv-123',
        payments: [
          {
            id: 'pay-123',
            status: 'refunded'
          }
        ]
      } as any;

      mockRepository.findById.mockResolvedValue(mockInvoice);

      const request = {
        invoiceId: 'inv-123',
        paymentId: 'pay-123',
        amount: 500000,
        reason: 'Customer request'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Payment already refunded');
    });
  });
});

