import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';

export interface SearchInvoicesRequest {
  patientId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  invoiceNumber?: string;
}

export interface InvoiceSummary {
  invoiceId: string;
  invoiceNumber?: string;
  patientId: string;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
  createdAt: Date;
  finalizedAt?: Date;
}

export interface SearchInvoicesResponse {
  invoices: InvoiceSummary[];
  total: number;
}

export class SearchInvoicesUseCase extends BaseHealthcareUseCase<SearchInvoicesRequest, SearchInvoicesResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: SearchInvoicesRequest): Promise<SearchInvoicesResponse> {
    this.logger.info('Searching invoices', { criteria: request });

    const invoices = await this.invoiceRepository.search(request);

    const invoiceSummaries: InvoiceSummary[] = invoices.map(invoice => ({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      totalAmount: invoice.totalAmount.amount,
      outstandingAmount: invoice.outstandingAmount.amount,
      status: invoice.status.value,
      createdAt: invoice.createdAt,
      finalizedAt: undefined // Will be added when we expose this property
    }));

    this.logger.info('Search completed', { count: invoiceSummaries.length });

    return {
      invoices: invoiceSummaries,
      total: invoiceSummaries.length
    };
  }
}
