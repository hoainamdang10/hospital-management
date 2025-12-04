import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "@shared/application/services/logger.interface";

export interface GetPatientInvoicesRequest {
  patientId: string;
}

export interface GetPatientInvoicesResponse {
  invoices: Array<{
    invoiceId: string;
    invoiceNumber?: string;
    invoiceCode?: string;
    patientName?: string;
    appointmentId?: string;
    appointmentCode?: string;
    doctorName?: string;
    doctorDepartment?: string;
    cancellationReason?: string;
    metadata?: Record<string, any>;
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    tax: number;
    totalAmount: number;
    outstandingAmount: number;
    paidAmount: number;
    status: string;
    createdAt: Date;
    issuedAt: Date;
    issueDate: Date;
    dueDate: Date;
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      method: string;
      status: string;
      transactionId?: string;
      paidAt?: Date;
      refundedAt?: Date;
      refundReason?: string;
      refundedBy?: string;
      gatewayRefundId?: string;
    }>;
  }>;
  totalCount: number;
}

export class GetPatientInvoicesUseCase extends BaseHealthcareUseCase<
  GetPatientInvoicesRequest,
  GetPatientInvoicesResponse
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
    request: GetPatientInvoicesRequest,
  ): Promise<GetPatientInvoicesResponse> {
    this.logger.info("Getting patient invoices", {
      patientId: request.patientId,
    });

    const invoices = await this.invoiceRepository.findByPatientId(
      request.patientId,
    );

    const computePaymentStats = (invoice: any) => {
      const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
      return payments.reduce(
        (acc: { paid: number; refunded: number }, payment: any) => {
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
    };

    return {
      invoices: invoices.map((invoice) => {
        const createdAt = invoice.createdAt;
        const dueDate = invoice.dueDate;
        const { paid: totalPaid, refunded: totalRefunded } =
          computePaymentStats(invoice);
        const hasRefund = totalRefunded > 0;

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceCode: invoice.invoiceNumber,
          patientName: invoice.metadata?.patientName,
          appointmentId: invoice.getAppointmentId?.() ?? undefined,
          appointmentCode: invoice.getAppointmentId?.() ?? undefined,
          doctorName: invoice.metadata?.doctorName,
          doctorDepartment: invoice.metadata?.doctorDepartment,
          cancellationReason: invoice.metadata?.cancellationReason,
          metadata: invoice.metadata,
          items: (invoice.items || []).map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.amount,
            totalPrice: item.totalPrice.amount,
          })),
          subtotal: invoice.subtotal.amount,
          tax: invoice.tax.amount,
          totalAmount: invoice.totalAmount.amount,
          outstandingAmount: Math.max(
            0,
            invoice.totalAmount.amount - totalPaid,
          ),
          paidAmount: totalPaid,
          status: hasRefund ? "refunded" : invoice.status.value,
          createdAt,
          issuedAt: createdAt,
          issueDate: createdAt,
          dueDate,
          payments: invoice.payments.map((p) => ({
            id: p.id,
            amount: p.amount.amount,
            currency: p.amount.currency,
            method: p.method,
            status: p.status,
            transactionId: p.transactionId,
            paidAt: p.paidAt,
            refundedAt: p.refundedAt,
            refundReason: p.refundReason,
            refundedBy: p.refundedBy,
            gatewayRefundId: p.gatewayRefundId,
          })),
        };
      }),
      totalCount: invoices.length,
    };
  }
}
