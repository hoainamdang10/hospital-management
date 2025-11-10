/**
 * HandlePayOSWebhookUseCase Integration Tests
 * Tests for PayOS webhook handling with event bus integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { HandlePayOSWebhookUseCase } from '../../src/application/use-cases/HandlePayOSWebhookUseCase';
import { IInvoiceRepository } from '../../src/domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { PayOSIntegrationService } from '../../src/infrastructure/services/PayOSIntegrationService';
import { ILogger } from '@shared/application/services/logger.interface';
import { Invoice } from '../../src/domain/aggregates/Invoice';
import { Money } from '../../src/domain/value-objects/Money';
import { InvoiceStatus } from '../../src/domain/value-objects/InvoiceStatus';

describe('HandlePayOSWebhookUseCase Integration Tests', () => {
  let useCase: HandlePayOSWebhookUseCase;
  let mockRepository: jest.Mocked<IInvoiceRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockPayOSService: jest.Mocked<PayOSIntegrationService>;
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

    mockPayOSService = {
      createPaymentLink: jest.fn(),
      getPaymentInfo: jest.fn(),
      cancelPaymentLink: jest.fn(),
      verifyWebhookSignature: jest.fn(),
      confirmWebhookUrl: jest.fn()
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn()
    } as any;

    useCase = new HandlePayOSWebhookUseCase(
      mockRepository,
      mockEventBus,
      mockPayOSService,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should handle successful payment webhook', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-001',
        patientId: 'pat-123',
        totalAmount: Money.create(1000000),
        outstandingAmount: Money.create(1000000),
        status: InvoiceStatus.create('pending'),
        processPayment: jest.fn()
      } as any;

      mockPayOSService.verifyWebhookSignature.mockReturnValue(true);
      mockRepository.findById.mockResolvedValue(mockInvoice);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const request = {
        webhookData: {
          code: '00',
          desc: 'Thành công',
          data: {
            orderCode: 1234567890,
            amount: 1000000,
            description: 'Thanh toán hóa đơn INV-001',
            accountNumber: '0123456789',
            reference: 'FT123456',
            transactionDateTime: '2024-01-15 10:30:00'
          },
          signature: 'valid-signature'
        },
        signature: 'valid-signature',
        invoiceId: 'inv-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(mockPayOSService.verifyWebhookSignature).toHaveBeenCalled();
      expect(mockInvoice.processPayment).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockInvoice);
      expect(mockEventBus.publish).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing PayOS webhook',
        expect.any(Object)
      );
    });

    it('should reject invalid webhook signature', async () => {
      mockPayOSService.verifyWebhookSignature.mockReturnValue(false);

      const request = {
        webhookData: {
          code: '00',
          desc: 'Thành công',
          data: {
            orderCode: 1234567890,
            amount: 1000000
          }
        },
        signature: 'invalid-signature',
        invoiceId: 'inv-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid webhook signature');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle failed payment webhook', async () => {
      mockPayOSService.verifyWebhookSignature.mockReturnValue(true);

      const request = {
        webhookData: {
          code: '01',
          desc: 'Thanh toán thất bại',
          data: {
            orderCode: 1234567890,
            amount: 1000000
          }
        },
        signature: 'valid-signature',
        invoiceId: 'inv-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Payment failed');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle invoice not found', async () => {
      mockPayOSService.verifyWebhookSignature.mockReturnValue(true);
      mockRepository.findById.mockResolvedValue(null);

      const request = {
        webhookData: {
          code: '00',
          desc: 'Thành công',
          data: {
            orderCode: 1234567890,
            amount: 1000000
          }
        },
        signature: 'valid-signature',
        invoiceId: 'inv-999'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Invoice not found');
    });
  });
});

