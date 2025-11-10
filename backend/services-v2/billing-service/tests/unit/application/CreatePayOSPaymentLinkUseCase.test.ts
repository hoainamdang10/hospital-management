/**
 * CreatePayOSPaymentLinkUseCase Unit Tests
 * Tests for PayOS payment link creation use case logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { CreatePayOSPaymentLinkUseCase } from '../../../src/application/use-cases/CreatePayOSPaymentLinkUseCase';
import { IInvoiceRepository } from '../../../src/domain/repositories/IInvoiceRepository';
import { PayOSIntegrationService } from '../../../src/infrastructure/services/PayOSIntegrationService';
import { ILogger } from '@shared/application/services/logger.interface';
import { Invoice } from '../../../src/domain/aggregates/Invoice';
import { Money } from '../../../src/domain/value-objects/Money';
import { InvoiceStatus } from '../../../src/domain/value-objects/InvoiceStatus';

describe('CreatePayOSPaymentLinkUseCase', () => {
  let useCase: CreatePayOSPaymentLinkUseCase;
  let mockRepository: jest.Mocked<IInvoiceRepository>;
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

    useCase = new CreatePayOSPaymentLinkUseCase(
      mockRepository,
      mockPayOSService,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should create PayOS payment link successfully', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-001',
        patientId: 'pat-123',
        totalAmount: Money.create(1000000),
        outstandingAmount: Money.create(1000000),
        status: InvoiceStatus.create('pending'),
        items: [
          {
            description: 'Khám tổng quát',
            quantity: 1,
            unitPrice: Money.create(1000000)
          }
        ]
      } as any;

      const mockPaymentLink = {
        checkoutUrl: 'https://payos.vn/checkout/abc123',
        qrCode: 'https://payos.vn/qr/abc123',
        paymentLinkId: 'link-123',
        orderCode: 1234567890,
        amount: 1000000
      };

      mockRepository.findById.mockResolvedValue(mockInvoice);
      mockPayOSService.createPaymentLink.mockResolvedValue(mockPaymentLink);

      const request = {
        invoiceId: 'inv-123',
        returnUrl: 'https://hospital.vn/payment/success',
        cancelUrl: 'https://hospital.vn/payment/cancel'
      };

      const result = await useCase.execute(request);

      expect(result.checkoutUrl).toBe(mockPaymentLink.checkoutUrl);
      expect(result.qrCode).toBe(mockPaymentLink.qrCode);
      expect(result.paymentLinkId).toBe(mockPaymentLink.paymentLinkId);
      expect(result.amount).toBe(1000000);
      expect(mockPayOSService.createPaymentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000000,
          description: expect.stringContaining('INV-001')
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating PayOS payment link',
        expect.any(Object)
      );
    });

    it('should fail when invoice not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const request = {
        invoiceId: 'inv-999',
        returnUrl: 'https://hospital.vn/payment/success',
        cancelUrl: 'https://hospital.vn/payment/cancel'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Invoice not found');
    });

    it('should fail when invoice is cancelled', async () => {
      const mockInvoice = {
        id: 'inv-123',
        status: InvoiceStatus.create('cancelled')
      } as any;

      mockRepository.findById.mockResolvedValue(mockInvoice);

      const request = {
        invoiceId: 'inv-123',
        returnUrl: 'https://hospital.vn/payment/success',
        cancelUrl: 'https://hospital.vn/payment/cancel'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Cannot create payment link for cancelled invoice');
    });

    it('should fail when invoice is already paid', async () => {
      const mockInvoice = {
        id: 'inv-123',
        status: InvoiceStatus.create('paid'),
        outstandingAmount: Money.create(0)
      } as any;

      mockRepository.findById.mockResolvedValue(mockInvoice);

      const request = {
        invoiceId: 'inv-123',
        returnUrl: 'https://hospital.vn/payment/success',
        cancelUrl: 'https://hospital.vn/payment/cancel'
      };

      await expect(useCase.execute(request)).rejects.toThrow('Invoice is already paid');
    });

    it('should handle PayOS service errors', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-001',
        totalAmount: Money.create(1000000),
        outstandingAmount: Money.create(1000000),
        status: InvoiceStatus.create('pending'),
        items: []
      } as any;

      mockRepository.findById.mockResolvedValue(mockInvoice);
      mockPayOSService.createPaymentLink.mockRejectedValue(new Error('PayOS API error'));

      const request = {
        invoiceId: 'inv-123',
        returnUrl: 'https://hospital.vn/payment/success',
        cancelUrl: 'https://hospital.vn/payment/cancel'
      };

      await expect(useCase.execute(request)).rejects.toThrow('PayOS API error');
    });
  });
});

