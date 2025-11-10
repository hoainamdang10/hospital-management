/**
 * SearchInvoicesUseCase Unit Tests
 * Tests for invoice search use case logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SearchInvoicesUseCase } from '../../../src/application/use-cases/SearchInvoicesUseCase';
import { IInvoiceRepository } from '../../../src/domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { Invoice } from '../../../src/domain/aggregates/Invoice';
import { Money } from '../../../src/domain/value-objects/Money';
import { InvoiceStatus } from '../../../src/domain/value-objects/InvoiceStatus';

describe('SearchInvoicesUseCase', () => {
  let useCase: SearchInvoicesUseCase;
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

    useCase = new SearchInvoicesUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should search invoices successfully with all criteria', async () => {
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
        }
      ] as any;

      mockRepository.search.mockResolvedValue(mockInvoices);

      const request = {
        patientId: 'pat-123',
        status: 'pending',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
        minAmount: 500000,
        maxAmount: 2000000
      };

      const result = await useCase.execute(request);

      expect(result.invoices).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockRepository.search).toHaveBeenCalledWith(request);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Searching invoices',
        expect.any(Object)
      );
    });

    it('should return empty results when no invoices found', async () => {
      mockRepository.search.mockResolvedValue([]);

      const request = {
        patientId: 'pat-999'
      };

      const result = await useCase.execute(request);

      expect(result.invoices).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should search by invoice number', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        patientId: 'pat-123',
        totalAmount: Money.create(1000000),
        outstandingAmount: Money.create(0),
        status: InvoiceStatus.create('paid'),
        createdAt: new Date()
      } as any;

      mockRepository.search.mockResolvedValue([mockInvoice]);

      const request = {
        invoiceNumber: 'INV-001'
      };

      const result = await useCase.execute(request);

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].invoiceNumber).toBe('INV-001');
    });

    it('should search by date range only', async () => {
      mockRepository.search.mockResolvedValue([]);

      const request = {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      };

      const result = await useCase.execute(request);

      expect(mockRepository.search).toHaveBeenCalledWith(request);
      expect(result.total).toBe(0);
    });

    it('should search by amount range', async () => {
      mockRepository.search.mockResolvedValue([]);

      const request = {
        minAmount: 500000,
        maxAmount: 1000000
      };

      const result = await useCase.execute(request);

      expect(mockRepository.search).toHaveBeenCalledWith(request);
    });
  });
});

