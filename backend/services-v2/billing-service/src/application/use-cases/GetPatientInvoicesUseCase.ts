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

    const computeNetPaid = (invoice: any): number => {
      const paid = invoice.payments
        .filter((p: any) => p.method !== "refund" && p.status === "completed")
        .reduce((sum: number, p: any) => sum + p.amount.amount, 0);
      const refunded = invoice.payments
        .filter(
          (p: any) =>
            p.method === "refund" &&
            (p.status === "completed" || p.status === "refund_pending"),
        )
        .reduce((sum: number, p: any) => sum + Math.abs(p.amount.amount), 0);
      return Math.max(0, paid - refunded);
    };

    return {
      invoices: invoices.map((invoice) => {
        const createdAt = invoice.createdAt;
        const dueDate = new Date(createdAt.getTime() + 30 * 60 * 1000);
        const netPaid = computeNetPaid(invoice);

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceCode: invoice.invoiceNumber,
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
          totalAmount: invoice.totalAmount.amount,
          outstandingAmount: Math.max(0, invoice.totalAmount.amount - netPaid),
          paidAmount: netPaid,
          status: invoice.payments.some(
            (p) =>
              p.method === "refund" &&
              (p.status === "completed" || p.status === "refund_pending") &&
              Math.abs(p.amount.amount) >= invoice.totalAmount.amount,
          )
            ? "refunded"
            : invoice.status.value,
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
