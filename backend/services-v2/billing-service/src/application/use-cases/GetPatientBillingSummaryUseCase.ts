import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "@shared/application/services/logger.interface";

export interface GetPatientBillingSummaryRequest {
  patientId: string;
}

export interface PatientBillingSummary {
  patientId: string;
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  invoicesByStatus: {
    draft: number;
    pending: number;
    partially_paid: number;
    paid: number;
    cancelled: number;
    overdue: number;
  };
  recentInvoices: Array<{
    invoiceId: string;
    invoiceNumber?: string;
    totalAmount: number;
    outstandingAmount: number;
    status: string;
    createdAt: Date;
  }>;
}

export class GetPatientBillingSummaryUseCase extends BaseHealthcareUseCase<
  GetPatientBillingSummaryRequest,
  PatientBillingSummary
> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    logger: ILogger,
  ) {
    super();
    this.logger = logger;
  }

  private calculatePaymentStats(inv: any) {
    const paidCompleted = inv.payments
      .filter((p: any) => p.method !== "refund" && p.status === "completed")
      .reduce((sum: number, p: any) => sum + p.amount.amount, 0);

    const refunds = inv.payments
      .filter(
        (p: any) =>
          p.method === "refund" &&
          (p.status === "completed" || p.status === "refund_pending"),
      )
      .reduce((sum: number, p: any) => sum + Math.abs(p.amount.amount), 0);

    const netPaid = Math.max(0, paidCompleted - refunds);
    const outstanding = Math.max(0, inv.totalAmount.amount - netPaid);

    return { paidCompleted, refunds, netPaid, outstanding };
  }

  protected async executeImpl(
    request: GetPatientBillingSummaryRequest,
  ): Promise<PatientBillingSummary> {
    this.logger.info("Getting patient billing summary", {
      patientId: request.patientId,
    });

    const invoices = await this.invoiceRepository.findByPatientId(
      request.patientId,
    );

    // Loại bỏ hóa đơn đã hủy khỏi các phép cộng tiền
    const activeInvoices = invoices.filter(
      (inv) => inv.status.value !== "cancelled",
    );

    const totalAmount = activeInvoices.reduce((sum, inv) => {
      const { refunds } = this.calculatePaymentStats(inv);
      const net = Math.max(0, inv.totalAmount.amount - refunds);
      return sum + net;
    }, 0);

    const totalPaid = activeInvoices.reduce((sum, inv) => {
      const { netPaid } = this.calculatePaymentStats(inv);
      return sum + netPaid;
    }, 0);

    const totalOutstanding = activeInvoices
      .filter((inv) =>
        ["pending", "partially_paid", "overdue", "draft"].includes(
          inv.status.value,
        ),
      )
      .reduce((sum, inv) => {
        const { outstanding } = this.calculatePaymentStats(inv);
        return sum + outstanding;
      }, 0);

    const overdueAmount = activeInvoices
      .filter((inv) => inv.status.value === "overdue")
      .reduce((sum, inv) => {
        const { outstanding } = this.calculatePaymentStats(inv);
        return sum + outstanding;
      }, 0);

    const invoicesByStatus = {
      draft: invoices.filter((inv) => inv.status.value === "draft").length,
      pending: invoices.filter((inv) => inv.status.value === "pending").length,
      partially_paid: invoices.filter(
        (inv) => inv.status.value === "partially_paid",
      ).length,
      paid: invoices.filter((inv) => inv.status.value === "paid").length,
      cancelled: invoices.filter((inv) => inv.status.value === "cancelled")
        .length,
      overdue: invoices.filter((inv) => inv.status.value === "overdue").length,
    };

    const recentInvoices = invoices.slice(0, 5).map((inv) => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount.amount,
      outstandingAmount: inv.outstandingAmount.amount,
      status: inv.status.value,
      createdAt: inv.createdAt,
    }));

    this.logger.info("Patient billing summary retrieved", {
      patientId: request.patientId,
      totalInvoices: invoices.length,
    });

    return {
      patientId: request.patientId,
      totalInvoices: invoices.length,
      totalAmount,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      invoicesByStatus,
      recentInvoices,
    };
  }
}
