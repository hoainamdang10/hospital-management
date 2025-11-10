import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { ILogger } from '@shared/application/services/logger.interface';

export interface GetInvoiceRequest {
  invoiceId: string;
}

export interface GetInvoiceResponse {
  invoiceId: string;
  patientId: string;
  invoiceNumber?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  insuranceCoverage: number;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
  insurance?: {
    provider: string;
    policyNumber: string;
    coveragePercentage: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    paidAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class GetInvoiceUseCase extends BaseHealthcareUseCase<GetInvoiceRequest, GetInvoiceResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: GetInvoiceRequest): Promise<GetInvoiceResponse> {
    this.logger.info('Getting invoice', { invoiceId: request.invoiceId });

    const invoice = await this.invoiceRepository.findById(request.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return {
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      invoiceNumber: invoice.invoiceNumber,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        totalPrice: item.totalPrice.amount
      })),
      subtotal: invoice.subtotal.amount,
      tax: invoice.tax.amount,
      insuranceCoverage: invoice.insuranceCoverage.amount,
      totalAmount: invoice.totalAmount.amount,
      outstandingAmount: invoice.outstandingAmount.amount,
      status: invoice.status.value,
      insurance: invoice.insurance ? {
        provider: invoice.insurance.provider,
        policyNumber: invoice.insurance.policyNumber,
        coveragePercentage: invoice.insurance.coveragePercentage
      } : undefined,
      payments: invoice.payments.map(p => ({
        id: p.id,
        amount: p.amount.amount,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };
  }
}
