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

      // 2. Find invoice by appointmentId using dedicated repository method
      const invoice = await this.invoiceRepository.findByAppointmentId(
        request.appointmentId,
      );

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

      // 5. Process refund
      const refundAmount = invoice.processRefund(
        request.refundPercentage,
        request.reason,
        request.refundedBy,
      );

      // Nếu không tích hợp gateway, coi như refund đã hoàn tất ngay
      // Đánh dấu refund complete để invoice về trạng thái refunded (net 0 outstanding)
      try {
        const refundPayment = invoice.payments.find(
          (p) => p.method === "refund",
        );
        if (refundPayment) {
          invoice.completeRefund(refundPayment.id, "gateway-mock");
        }
      } catch (e) {
        this.logger.warn("Refund completion skipped (no payment found)", {
          appointmentId: request.appointmentId,
          error: e instanceof Error ? e.message : "Unknown",
        });
      }

      // 6. Save invoice (will publish PaymentRefundedEvent)
      await this.invoiceRepository.save(invoice);

      // 7. Publish domain events
      const events = invoice.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      invoice.markEventsAsCommitted();

      this.logger.info("Refund processed successfully", {
        invoiceId: invoice.id,
        refundAmount,
        refundPercentage: request.refundPercentage,
      });

      return {
        success: true,
        message: "Hoàn tiền thành công",
        refundId: invoice.id, // Using invoice ID as refund ID for now
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
}
