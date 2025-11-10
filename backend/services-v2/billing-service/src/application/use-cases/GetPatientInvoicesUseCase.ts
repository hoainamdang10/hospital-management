import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';

export interface GetPatientInvoicesRequest {
  patientId: string;
}

export interface GetPatientInvoicesResponse {
  invoices: Array<{
    invoiceId: string;
    invoiceNumber?: string;
    totalAmount: number;
    outstandingAmount: number;
    status: string;
    createdAt: Date;
  }>;
  totalCount: number;
}

export class GetPatientInvoicesUseCase extends BaseHealthcareUseCase<GetPatientInvoicesRequest, GetPatientInvoicesResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: GetPatientInvoicesRequest): Promise<GetPatientInvoicesResponse> {
    this.logger.info('Getting patient invoices', { patientId: request.patientId });

    const invoices = await this.invoiceRepository.findByPatientId(request.patientId);

    return {
      invoices: invoices.map(invoice => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount.amount,
        outstandingAmount: invoice.outstandingAmount.amount,
        status: invoice.status.value,
        createdAt: invoice.createdAt
      })),
      totalCount: invoices.length
    };
  }
}
