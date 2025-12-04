import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import { ILogger } from "@shared/application/services/logger.interface";
import { WalletService } from "../services/WalletService";
import { WalletTransaction } from "../../domain/entities/Wallet";
import { Payment } from "../../domain/entities/Payment";
import { Money } from "../../domain/value-objects/Money";

export interface PayInvoiceWithWalletRequest {
  invoiceId: string;
  patientId?: string;
  description?: string;
  initiatedBy?: string;
}

export interface PayInvoiceWithWalletResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
  paymentId?: string;
  walletTransaction?: WalletTransaction;
  errors?: string[];
}

export class PayInvoiceWithWalletUseCase extends BaseHealthcareUseCase<
  PayInvoiceWithWalletRequest,
  PayInvoiceWithWalletResponse
> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    private readonly walletService: WalletService,
    logger: ILogger,
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(
    request: PayInvoiceWithWalletRequest,
  ): Promise<PayInvoiceWithWalletResponse> {
    try {
      const invoice = await this.invoiceRepository.findById(request.invoiceId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const invoicePatientId = invoice.getPatientId();
      if (
        request.patientId &&
        invoicePatientId &&
        !this.isSameIdentifier(request.patientId, invoicePatientId)
      ) {
        throw new Error(
          "Bạn không có quyền thanh toán hóa đơn không thuộc sở hữu của mình",
        );
      }

      const expiryResult = await this.preventPaymentIfExpired(invoice, request);
      if (expiryResult) {
        return expiryResult;
      }

      if (invoice.status.isCancelled()) {
        throw new Error("Không thể thanh toán hóa đơn đã bị hủy");
      }

      if (invoice.status.isPaid() || invoice.outstandingAmount.amount <= 0) {
        return {
          success: false,
          message: "Hóa đơn đã được thanh toán",
          errors: ["Invoice already paid"],
        };
      }

      const outstandingAmount = invoice.outstandingAmount.amount;
      const description =
        request.description ||
        `Thanh toán hóa đơn ${invoice.invoiceNumber || invoice.id}`;

      const walletTransaction = await this.walletService.charge(
        invoicePatientId,
        outstandingAmount,
        description,
        invoice.id,
        request.initiatedBy || request.patientId || "system",
        {
          invoiceId: invoice.id,
          appointmentId: invoice.getAppointmentId(),
          type: "invoice_payment",
        },
      );

      const payment = Payment.create(
        Money.create(outstandingAmount, invoice.totalAmount.currency),
        "wallet",
        walletTransaction.id,
      );

      invoice.processPayment(payment);
      await this.invoiceRepository.save(invoice);

      await this.publishInvoiceEvents(invoice);

      this.logger.info("Invoice paid with wallet", {
        invoiceId: invoice.id,
        paymentId: payment.id,
        walletTransactionId: walletTransaction.id,
      });

      return {
        success: true,
        message: "Thanh toán bằng ví thành công",
        invoiceId: invoice.id,
        paymentId: payment.id,
        walletTransaction,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wallet payment failed";
      this.logger.error("Wallet payment failed", {
        invoiceId: request.invoiceId,
        error: message,
      });

      return {
        success: false,
        message,
        errors: [message],
      };
    }
  }

  async authorize(
    request: PayInvoiceWithWalletRequest,
    userId: string,
  ): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: PayInvoiceWithWalletRequest): boolean {
    return true;
  }

  getPatientId(request: PayInvoiceWithWalletRequest): string | null {
    return request.patientId ?? null;
  }

  private isSameIdentifier(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  private async preventPaymentIfExpired(
    invoice: Awaited<ReturnType<IInvoiceRepository["findById"]>>,
    request: PayInvoiceWithWalletRequest,
  ): Promise<PayInvoiceWithWalletResponse | null> {
    if (!invoice) {
      return null;
    }

    const alreadyExpired = invoice.status.isExpired();
    const pastDue =
      Boolean(invoice.dueDate) && invoice.dueDate.getTime() <= Date.now();

    if (!alreadyExpired && !pastDue) {
      return null;
    }

    if (!alreadyExpired && pastDue) {
      await this.expireInvoice(invoice, request);
    }

    return {
      success: false,
      message: "Hóa đơn đã hết hạn thanh toán",
      invoiceId: invoice.id,
      errors: ["Invoice expired"],
    };
  }

  private async expireInvoice(
    invoice: NonNullable<Awaited<ReturnType<IInvoiceRepository["findById"]>>>,
    request: PayInvoiceWithWalletRequest,
  ): Promise<void> {
    invoice.markAsExpired(
      "Payment attempted after due date",
      request.initiatedBy || request.patientId || "system",
    );
    await this.invoiceRepository.save(invoice);
    await this.publishInvoiceEvents(invoice);
  }

  private async publishInvoiceEvents(
    invoice: NonNullable<Awaited<ReturnType<IInvoiceRepository["findById"]>>>,
  ): Promise<void> {
    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    invoice.markEventsAsCommitted();
  }
}
