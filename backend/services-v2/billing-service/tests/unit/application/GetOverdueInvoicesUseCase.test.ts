/**
 * GetOverdueInvoicesUseCase Unit Tests
 * Tests for overdue invoices retrieval use case logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetOverdueInvoicesUseCase } from '../../../src/application/use-cases/GetOverdueInvoicesUseCase';
import { IInvoiceRepository } from '../../../src/domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { Invoice } from '../../../src/domain/aggregates/Invoice';
import { Money } from '../../../src/domain/value-objects/Money';
import { InvoiceStatus } from '../../../src/domain/value-objects/InvoiceStatus';

describe('GetOverdueInvoicesUseCase', () => {
  let useCase: GetOverdueInvoicesUseCase;
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

    useCase = new GetOverdueInvoicesUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should get overdue invoices successfully', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          patientId: 'pat-123',
          totalAmount: Money.create(1000000),
          outstandingAmount: Money.create(500000),
          status: InvoiceStatus.create('pending'),
          createdAt: thirtyDaysAgo
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-002',
          patientId: 'pat-456',
          totalAmount: Money.create(800000),
          outstandingAmount: Money.create(800000),
          status: InvoiceStatus.create('pending'),
          createdAt: thirtyDaysAgo
        }
      ] as any;

      mockRepository.findOverdueInvoices.mockResolvedValue(mockInvoices);

      const request = {};

      const result = await useCase.execute(request);

      expect(result.invoices).toHaveLength(2);
      expect(result.totalOverdue).toBe(2);
      expect(result.totalAmount).toBe(1300000);
      expect(result.invoices[0].daysOverdue).toBeGreaterThanOrEqual(30);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting overdue invoices',
        expect.any(Object)
      );
    });

    it('should filter by patient ID', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          patientId: 'pat-123',
          totalAmount: Money.create(1000000),
          outstandingAmount: Money.create(500000),
          status: InvoiceStatus.create('pending'),
          createdAt: new Date()
        },
        {
          id: 'inv-2',
          patientId: 'pat-456',
          totalAmount: Money.create(800000),
          outstandingAmount: Money.create(800000),
          status: InvoiceStatus.create('pending'),
          createdAt: new Date()
        }
      ] as any;

      mockRepository.findOverdueInvoices.mockResolvedValue(mockInvoices);

      const request = {
        patientId: 'pat-123'
      };

      const result = await useCase.execute(request);

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].patientId).toBe('pat-123');
    });

    it('should filter by days overdue', async () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const mockInvoices = [
        {
          id: 'inv-1',
          patientId: 'pat-123',
          totalAmount: Money.create(1000000),
          outstandingAmount: Money.create(500000),
          status: InvoiceStatus.create('pending'),
          createdAt: sixtyDaysAgo
        }
      ] as any;

      mockRepository.findOverdueInvoices.mockResolvedValue(mockInvoices);

      const request = {
        daysOverdue: 30
      };

      const result = await useCase.execute(request);

      expect(mockRepository.findOverdueInvoices).toHaveBeenCalledWith(30);
      expect(result.invoices[0].daysOverdue).toBeGreaterThanOrEqual(30);
    });

    it('should return empty when no overdue invoices', async () => {
      mockRepository.findOverdueInvoices.mockResolvedValue([]);

      const request = {};

      const result = await useCase.execute(request);

      expect(result.invoices).toHaveLength(0);
      expect(result.totalOverdue).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });
});

