/**
 * GetRevenueReportUseCase Unit Tests
 * Tests for revenue report generation use case logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetRevenueReportUseCase } from '../../../src/application/use-cases/GetRevenueReportUseCase';
import { IInvoiceRepository } from '../../../src/domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { Invoice } from '../../../src/domain/aggregates/Invoice';
import { Money } from '../../../src/domain/value-objects/Money';
import { InvoiceStatus } from '../../../src/domain/value-objects/InvoiceStatus';

describe('GetRevenueReportUseCase', () => {
  let useCase: GetRevenueReportUseCase;
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

    useCase = new GetRevenueReportUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should generate revenue report successfully', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          totalAmount: Money.create(1000000),
          status: InvoiceStatus.create('paid'),
          createdAt: new Date('2024-01-15'),
          payments: [
            {
              amount: Money.create(1000000),
              method: 'cash',
              status: 'completed'
            }
          ],
          insurance: {
            provider: 'BHYT'
          },
          insuranceCoverage: Money.create(800000)
        },
        {
          id: 'inv-2',
          totalAmount: Money.create(800000),
          status: InvoiceStatus.create('paid'),
          createdAt: new Date('2024-01-20'),
          payments: [
            {
              amount: Money.create(800000),
              method: 'card',
              status: 'completed'
            }
          ],
          insurance: null,
          insuranceCoverage: Money.create(0)
        },
        {
          id: 'inv-3',
          totalAmount: Money.create(600000),
          status: InvoiceStatus.create('pending'),
          createdAt: new Date('2024-01-25'),
          payments: [],
          insurance: null,
          insuranceCoverage: Money.create(0)
        }
      ] as any;

      mockRepository.search.mockResolvedValue(mockInvoices);

      const request = {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
        groupBy: 'month' as const
      };

      const result = await useCase.execute(request);

      expect(result.period.from).toEqual(request.fromDate);
      expect(result.period.to).toEqual(request.toDate);
      expect(result.summary.totalRevenue).toBe(1800000);
      expect(result.summary.totalInvoices).toBe(3);
      expect(result.summary.paidInvoices).toBe(2);
      expect(result.summary.pendingInvoices).toBe(1);
      expect(result.summary.averageInvoiceAmount).toBe(900000);
      expect(result.byPaymentMethod.cash).toBe(1000000);
      expect(result.byPaymentMethod.card).toBe(800000);
      expect(result.byInsuranceType.BHYT).toBe(800000);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generating revenue report',
        expect.any(Object)
      );
    });

    it('should group by day correctly', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          totalAmount: Money.create(1000000),
          status: InvoiceStatus.create('paid'),
          createdAt: new Date('2024-01-15'),
          payments: [],
          insurance: null,
          insuranceCoverage: Money.create(0)
        },
        {
          id: 'inv-2',
          totalAmount: Money.create(800000),
          status: InvoiceStatus.create('paid'),
          createdAt: new Date('2024-01-15'),
          payments: [],
          insurance: null,
          insuranceCoverage: Money.create(0)
        }
      ] as any;

      mockRepository.search.mockResolvedValue(mockInvoices);

      const request = {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
        groupBy: 'day' as const
      };

      const result = await useCase.execute(request);

      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].period).toBe('2024-01-15');
      expect(result.breakdown[0].totalRevenue).toBe(1800000);
      expect(result.breakdown[0].invoiceCount).toBe(2);
    });

    it('should group by week correctly', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          totalAmount: Money.create(1000000),
          status: InvoiceStatus.create('paid'),
          createdAt: new Date('2024-01-15'),
          payments: [],
          insurance: null,
          insuranceCoverage: Money.create(0)
        }
      ] as any;

      mockRepository.search.mockResolvedValue(mockInvoices);

      const request = {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
        groupBy: 'week' as const
      };

      const result = await useCase.execute(request);

      expect(result.breakdown.length).toBeGreaterThan(0);
    });

    it('should return empty report when no invoices', async () => {
      mockRepository.search.mockResolvedValue([]);

      const request = {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      };

      const result = await useCase.execute(request);

      expect(result.summary.totalRevenue).toBe(0);
      expect(result.summary.totalInvoices).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });
  });
});

