/**
 * RefundPaymentUseCase - Application Layer
 * Handles payment refunds for cancelled appointments
 *
 * Flow:
 * 1. Find invoice by appointmentId
 * 2. Validate invoice is paid
 * 3. Calculate refund amount based on policy
 * 4. Process refund via Invoice.processRefund()
 * 5. Publish PaymentRefundedEvent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { BaseHealthcareUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import { ILogger } from "@shared/application/services/logger.interface";
import { UseCaseContext } from "@shared/application/use-cases/base/use-case.interface";
import type { Invoice } from "../../domain/aggregates/Invoice";
import { WalletService } from "../services/WalletService";
import { WalletTransaction } from "../../domain/entities/Wallet";

export interface RefundPaymentRequest {
  appointmentId: string;
  patientId: string;
  refundPercentage: number; // 0-100 (e.g., 100 = full refund, 80 = 80% refund)
  reason: string;
  refundedBy: string;
}

export interface RefundPaymentResponse {
  success: boolean;
  message: string;
  refundId?: string;
  refundAmount?: number;
  errors?: string[];
}

export class RefundPaymentUseCase extends BaseHealthcareUseCase<
  RefundPaymentRequest,
  RefundPaymentResponse
> {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger,
    private readonly config: { useGatewayRefund: boolean },
    private readonly walletService?: WalletService,
  ) {
    super();
  }

  protected async executeInternal(
    request: RefundPaymentRequest,
  ): Promise<RefundPaymentResponse> {
    try {
      // Ensure context exists for auditing (consumer may not pass context)
      if (!this.context) {
        this.context = {
          userId: request.refundedBy || "system",
          role: "system",
          timestamp: new Date(),
        } as UseCaseContext;
      }

      this.logger.info("Processing refund request", {
        appointmentId: request.appointmentId,
        refundPercentage: request.refundPercentage,
      });

      // 1. Validate refund percentage
      if (request.refundPercentage < 0 || request.refundPercentage > 100) {
        return {
          success: false,
          message: "Invalid refund percentage",
          errors: ["Refund percentage must be between 0 and 100"],
        };
      }

      // 2. Find invoice(s) by appointmentId (there may be multiple fee invoices)
      const invoices = await this.invoiceRepository.findAllByAppointmentId(
        request.appointmentId,
      );

      if (!invoices || invoices.length === 0) {
        this.logger.warn("No invoices found for appointment", {
          appointmentId: request.appointmentId,
        });
        return {
          success: false,
          message: "Không tìm thấy hóa đơn cho lịch hẹn này",
          errors: ["Invoice not found for appointment"],
        };
      }

      const invoice = this.selectPrimaryInvoice(invoices);
      if (!invoice) {
        this.logger.warn("Invoice not found for appointment", {
          appointmentId: request.appointmentId,
        });
        return {
          success: false,
          message: "Không tìm thấy hóa đơn cho lịch hẹn này",
          errors: ["Invoice not found for appointment"],
        };
      }

      // 3. Validate invoice status - Use value object methods
      if (!invoice.status.isPaid()) {
        this.logger.warn("Cannot refund unpaid invoice", {
          invoiceId: invoice.id,
          status: invoice.status.value,
        });
        return {
          success: false,
          message: "Không thể hoàn tiền cho hóa đơn chưa thanh toán",
          errors: ["Invoice is not paid"],
        };
      }

      // 4. Check if already refunded - Use value object method
      if (invoice.status.isRefunded()) {
        this.logger.warn("Invoice already refunded", {
          invoiceId: invoice.id,
          status: invoice.status.value,
        });
        return {
          success: false,
          message: "Hóa đơn đã được hoàn tiền",
          errors: ["Invoice already refunded"],
        };
      }

      // 4. Prevent duplicate refunds (pending or completed)
      const existingRefund = invoice.payments.find(
        (p) =>
          p.method === "refund" &&
          (p.status === "refund_pending" || p.status === "completed"),
      );
      if (existingRefund) {
        this.logger.warn("Refund already in progress or completed", {
          invoiceId: invoice.id,
          refundPaymentId: existingRefund.id,
          status: existingRefund.status,
        });
        return {
          success: false,
          message: "Hoàn tiền đã được yêu cầu hoặc hoàn tất trước đó",
          errors: ["Refund already requested or completed"],
          refundId: existingRefund.id,
        };
      }

      const hadWalletPayment = invoice.payments.some(
        (p) => p.method === "wallet",
      );

      // 5. Process refund
      const refundAmount = invoice.processRefund(
        request.refundPercentage,
        request.reason,
        request.refundedBy,
      );
      const refundPayment = invoice.payments.find(
        (p) => p.method === "refund" && p.status === "refund_pending",
      );

      // 6. Save invoice (will publish PaymentRefundRequestedEvent)
      await this.invoiceRepository.save(invoice);

      // 7. Publish domain events
      const events = invoice.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      invoice.markEventsAsCommitted();

      let refundCompleted = false;
      if (hadWalletPayment && this.walletService && refundPayment) {
        await this.refundWallet(
          invoice,
          refundAmount,
          refundPayment.id,
          request.refundedBy,
          request.reason,
        );
        try {
          invoice.completeRefund(
            refundPayment.id,
            `WALLET-REFUND-${Date.now()}`,
          );
          refundCompleted = true;
        } catch (e) {
          this.logger.error("Wallet refund completion failed", {
            invoiceId: invoice.id,
            error: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }

      // Nếu không dùng gateway refund, complete ngay để tránh pending
      if (!this.config.useGatewayRefund && !refundCompleted) {
        if (refundPayment) {
          try {
            invoice.completeRefund(
              refundPayment.id,
              `REFUND-SYSTEM-${Date.now()}`,
            );
            refundCompleted = true;
          } catch (e) {
            this.logger.error("Auto-complete refund failed", {
              invoiceId: invoice.id,
              error: e instanceof Error ? e.message : "Unknown error",
            });
          }
        }
      }

      if (refundCompleted) {
        await this.invoiceRepository.save(invoice);
        const completeEvents = invoice.getUncommittedEvents();
        for (const event of completeEvents) {
          await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
      }

      this.logger.info("Refund request recorded", {
        invoiceId: invoice.id,
        refundAmount,
        refundPercentage: request.refundPercentage,
      });

      return {
        success: true,
        message: "Yêu cầu hoàn tiền đã được ghi nhận",
        refundId: refundPayment?.id || invoice.id,
        refundAmount,
      };
    } catch (error) {
      this.logger.error("Error processing refund", {
        error: error instanceof Error ? error.message : "Unknown error",
        appointmentId: request.appointmentId,
      });

      return {
        success: false,
        message: "Hoàn tiền thất bại",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async authorize(
    request: RefundPaymentRequest,
    userId: string,
  ): Promise<boolean> {
    // Authorization logic - for now, allow all authenticated users
    return !!userId;
  }

  involvesPHI(request: RefundPaymentRequest): boolean {
    return true; // Refunds involve patient financial data
  }

  getPatientId(request: RefundPaymentRequest): string | null {
    return request.patientId;
  }

  private selectPrimaryInvoice(invoices: Invoice[]): Invoice | null {
    if (!invoices || invoices.length === 0) {
      return null;
    }

    const primary = invoices.find((inv) => {
      const invoiceType = (inv.metadata?.invoiceType ||
        inv.metadata?.invoice_type ||
        "") as string | undefined;
      return invoiceType?.toString().toLowerCase() === "appointment_booking";
    });
    if (primary) {
      return primary;
    }

    const serviceNameMatch = invoices.find((inv) => {
      const serviceName = (inv.metadata?.serviceName ||
        inv.metadata?.service_name ||
        "") as string;
      return serviceName.toLowerCase().includes("đặt lịch");
    });
    if (serviceNameMatch) {
      return serviceNameMatch;
    }

    return invoices[0];
  }

  private async refundWallet(
    invoice: Invoice,
    refundAmount: number,
    refundPaymentId: string,
    refundedBy: string,
    reason?: string,
  ): Promise<WalletTransaction | null> {
    if (!this.walletService) {
      this.logger.warn("Wallet service not configured for refunds");
      return null;
    }

    const patientId = invoice.getPatientId();
    if (!patientId) {
      this.logger.warn("Unable to refund wallet: missing patientId", {
        invoiceId: invoice.id,
      });
      return null;
    }

    if (refundAmount <= 0) {
      return null;
    }

    const walletContribution = invoice.payments
      .filter((payment) => payment.method === "wallet")
      .reduce((sum, payment) => sum + Math.max(0, payment.amount.amount), 0);

    const normalizedAmount = Math.min(refundAmount, walletContribution);
    if (normalizedAmount <= 0) {
      this.logger.info("No wallet contribution to refund", {
        invoiceId: invoice.id,
        walletContribution,
      });
      return null;
    }

    const descriptionParts = [
      `Hoàn tiền ví cho hóa đơn ${invoice.invoiceNumber || invoice.id}`,
    ];
    if (reason) {
      descriptionParts.push(`(${reason})`);
    }

    const description = descriptionParts.join(" ");

    try {
      const transaction = await this.walletService.refund(
        patientId,
        normalizedAmount,
        description,
        refundPaymentId,
        refundedBy,
        {
          invoiceId: invoice.id,
          appointmentId: invoice.getAppointmentId(),
          refundPaymentId,
          type: "invoice_refund",
        },
      );

      this.logger.info("Wallet refund processed", {
        invoiceId: invoice.id,
        refundPaymentId,
        transactionId: transaction.id,
        amount: normalizedAmount,
      });

      return transaction;
    } catch (error) {
      this.logger.error("Wallet refund failed", {
        invoiceId: invoice.id,
        refundPaymentId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
