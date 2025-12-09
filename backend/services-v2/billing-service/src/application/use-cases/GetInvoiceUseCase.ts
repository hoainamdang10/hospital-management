import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "@shared/application/services/logger.interface";

export interface GetInvoiceRequest {
  invoiceId: string;
}

export interface GetInvoiceResponse {
  invoiceId: string;
  patientId: string;
  patientName?: string;
  invoiceNumber?: string;
  appointmentId?: string;
  doctorName?: string;
  doctorDepartment?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  metadata?: Record<string, any>;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    paidAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  insuranceCoverage: number;
  insurance?: {
    provider: string;
    policyNumber: string;
    coveragePercentage: number;
  };
}

export class GetInvoiceUseCase extends BaseHealthcareUseCase<
  GetInvoiceRequest,
  GetInvoiceResponse
> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    logger: ILogger,
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(
    request: GetInvoiceRequest,
  ): Promise<GetInvoiceResponse> {
    this.logger.info("Getting invoice", { invoiceId: request.invoiceId });

    const invoice = await this.invoiceRepository.findById(request.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
    const paymentStats = payments.reduce(
      (acc: { paid: number; refunded: number }, payment) => {
        const amount = payment?.amount?.amount ?? 0;
        if (payment.method === "refund") {
          acc.refunded += Math.abs(amount);
        } else if (payment.status === "completed") {
          acc.paid += amount;
        }
        return acc;
      },
      { paid: 0, refunded: 0 },
    );

    const insuranceCoverageAmount = invoice.insuranceCoverage?.amount ?? 0;
    const outstandingAmount = Math.max(
      0,
      invoice.totalAmount.amount - insuranceCoverageAmount - paymentStats.paid,
    );
    const status =
      paymentStats.refunded > 0 ? "refunded" : invoice.status.value;

    return {
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      patientName: invoice.metadata?.patientName,
      invoiceNumber: invoice.invoiceNumber,
      appointmentId: invoice.metadata?.appointmentId,
      doctorName: invoice.metadata?.doctorName,
      doctorDepartment: invoice.metadata?.doctorDepartment,
      cancellationReason: invoice.metadata?.cancellationReason,
      cancelledBy: invoice.metadata?.cancelledBy,
      metadata: invoice.metadata,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        totalPrice: item.totalPrice.amount,
      })),
      subtotal: invoice.subtotal.amount,
      tax: invoice.tax.amount,
      totalAmount: invoice.totalAmount.amount,
      outstandingAmount,
      status,
      insuranceCoverage: insuranceCoverageAmount,
      insurance: invoice.insurance ? {
        provider: invoice.insurance.provider,
        policyNumber: invoice.insurance.policyNumber,
        coveragePercentage: invoice.insurance.coveragePercentage,
      } : undefined,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount.amount,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt,
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      dueDate: invoice.dueDate,
    };
  }
}
