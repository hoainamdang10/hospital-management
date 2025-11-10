import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';

export interface GetOverdueInvoicesRequest {
  patientId?: string;
  daysOverdue?: number;
}

export interface OverdueInvoice {
  invoiceId: string;
  invoiceNumber?: string;
  patientId: string;
  totalAmount: number;
  outstandingAmount: number;
  daysOverdue: number;
  createdAt: Date;
  finalizedAt?: Date;
}

export interface GetOverdueInvoicesResponse {
  invoices: OverdueInvoice[];
  totalOverdue: number;
  totalAmount: number;
}

export class GetOverdueInvoicesUseCase extends BaseHealthcareUseCase<GetOverdueInvoicesRequest, GetOverdueInvoicesResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: GetOverdueInvoicesRequest): Promise<GetOverdueInvoicesResponse> {
    this.logger.info('Getting overdue invoices', { criteria: request });

    // Pass daysOverdue to repository for filtering
    const invoices = await this.invoiceRepository.findOverdueInvoices(request.daysOverdue);

    const now = new Date();
    const overdueInvoices: OverdueInvoice[] = invoices
      .filter(invoice => {
        if (request.patientId && invoice.patientId !== request.patientId) {
          return false;
        }
        return true;
      })
      .map(invoice => {
        const createdDate = new Date(invoice.createdAt);
        const daysOverdue = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          patientId: invoice.patientId,
          totalAmount: invoice.totalAmount.amount,
          outstandingAmount: invoice.outstandingAmount.amount,
          daysOverdue,
          createdAt: invoice.createdAt,
          finalizedAt: undefined // Will be added when we expose this property
        };
      })
      .filter(invoice => {
        if (request.daysOverdue && invoice.daysOverdue < request.daysOverdue) {
          return false;
        }
        return true;
      });

    const totalAmount = overdueInvoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);

    this.logger.info('Overdue invoices retrieved', { count: overdueInvoices.length });

    return {
      invoices: overdueInvoices,
      totalOverdue: overdueInvoices.length,
      totalAmount
    };
  }
}
