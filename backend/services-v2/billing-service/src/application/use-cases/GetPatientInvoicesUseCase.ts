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
    appointmentId?: string;
    totalAmount: number;
    outstandingAmount: number;
    paidAmount: number;
    status: string;
    createdAt: Date;
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

    return {
      invoices: invoices.map((invoice) => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        appointmentId: invoice.getAppointmentId?.() ?? undefined,
        totalAmount: invoice.totalAmount.amount,
        outstandingAmount: Math.max(
          0,
          invoice.totalAmount.amount -
            Math.max(
              0,
              invoice.payments
                .filter(
                  (p) => p.method !== "refund" && p.status === "completed",
                )
                .reduce((sum, p) => sum + p.amount.amount, 0) -
                invoice.payments
                  .filter(
                    (p) =>
                      p.method === "refund" &&
                      (p.status === "completed" ||
                        p.status === "refund_pending"),
                  )
                  .reduce((sum, p) => sum + Math.abs(p.amount.amount), 0),
            ),
        ),
        paidAmount: Math.max(
          0,
          invoice.payments
            .filter((p) => p.method !== "refund" && p.status === "completed")
            .reduce((sum, p) => sum + p.amount.amount, 0) -
            invoice.payments
              .filter(
                (p) =>
                  p.method === "refund" &&
                  (p.status === "completed" || p.status === "refund_pending"),
              )
              .reduce((sum, p) => sum + Math.abs(p.amount.amount), 0),
        ),
        status: invoice.payments.some(
          (p) =>
            p.method === "refund" &&
            (p.status === "completed" || p.status === "refund_pending") &&
            Math.abs(p.amount.amount) >= invoice.totalAmount.amount,
        )
          ? "refunded"
          : invoice.status.value,
        createdAt: invoice.createdAt,
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
      })),
      totalCount: invoices.length,
    };
  }
}
