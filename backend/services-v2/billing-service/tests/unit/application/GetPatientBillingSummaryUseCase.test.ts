/**
 * GetPatientBillingSummaryUseCase Unit Tests
 * Tests for patient billing summary use case logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetPatientBillingSummaryUseCase } from '../../../src/application/use-cases/GetPatientBillingSummaryUseCase';
import { IInvoiceRepository } from '../../../src/domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { Invoice } from '../../../src/domain/aggregates/Invoice';
import { Money } from '../../../src/domain/value-objects/Money';
import { InvoiceStatus } from '../../../src/domain/value-objects/InvoiceStatus';

describe('GetPatientBillingSummaryUseCase', () => {
  let useCase: GetPatientBillingSummaryUseCase;
  let mockRepository: jest.Mocked<IInvoiceRepository>;
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

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn()
    } as any;

    useCase = new GetPatientBillingSummaryUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should get patient billing summary successfully', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          patientId: 'pat-123',
          totalAmount: Money.create(1000000),
          outstandingAmount: Money.create(500000),
          status: InvoiceStatus.create('pending'),
          createdAt: new Date('2024-01-15')
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-002',
          patientId: 'pat-123',
          totalAmount: Money.create(800000),
          outstandingAmount: Money.create(0),
          status: InvoiceStatus.create('paid'),
          createdAt: new Date('2024-01-20')
        },
        {
          id: 'inv-3',
          invoiceNumber: 'INV-003',
          patientId: 'pat-123',
          totalAmount: Money.create(600000),
          outstandingAmount: Money.create(300000),
          status: InvoiceStatus.create('partially_paid'),
          createdAt: new Date('2024-01-25')
        }
      ] as any;

      mockRepository.findByPatientId.mockResolvedValue(mockInvoices);

      const request = {
        patientId: 'pat-123'
      };

      const result = await useCase.execute(request);

      expect(result.patientId).toBe('pat-123');
      expect(result.totalInvoices).toBe(3);
      expect(result.totalAmount).toBe(2400000);
      expect(result.totalPaid).toBe(1600000);
      expect(result.totalOutstanding).toBe(800000);
      expect(result.statusBreakdown.pending).toBe(1);
      expect(result.statusBreakdown.paid).toBe(1);
      expect(result.statusBreakdown.partially_paid).toBe(1);
      expect(result.recentInvoices).toHaveLength(3);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting patient billing summary',
        expect.any(Object)
      );
    });

    it('should return empty summary when patient has no invoices', async () => {
      mockRepository.findByPatientId.mockResolvedValue([]);

      const request = {
        patientId: 'pat-999'
      };

      const result = await useCase.execute(request);

      expect(result.patientId).toBe('pat-999');
      expect(result.totalInvoices).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.totalPaid).toBe(0);
      expect(result.totalOutstanding).toBe(0);
      expect(result.recentInvoices).toHaveLength(0);
    });

    it('should limit recent invoices to 5', async () => {
      const mockInvoices = Array.from({ length: 10 }, (_, i) => ({
        id: `inv-${i}`,
        invoiceNumber: `INV-${String(i).padStart(3, '0')}`,
        patientId: 'pat-123',
        totalAmount: Money.create(100000),
        outstandingAmount: Money.create(0),
        status: InvoiceStatus.create('paid'),
        createdAt: new Date(2024, 0, i + 1)
      })) as any;

      mockRepository.findByPatientId.mockResolvedValue(mockInvoices);

      const request = {
        patientId: 'pat-123'
      };

      const result = await useCase.execute(request);

      expect(result.totalInvoices).toBe(10);
      expect(result.recentInvoices).toHaveLength(5);
    });

    it('should calculate overdue amount correctly', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const mockInvoices = [
        {
          id: 'inv-1',
          patientId: 'pat-123',
          totalAmount: Money.create(1000000),
          outstandingAmount: Money.create(500000),
          status: InvoiceStatus.create('pending'),
          createdAt: thirtyDaysAgo
        }
      ] as any;

      mockRepository.findByPatientId.mockResolvedValue(mockInvoices);

      const request = {
        patientId: 'pat-123'
      };

      const result = await useCase.execute(request);

      expect(result.overdueAmount).toBeGreaterThan(0);
    });
  });
});

