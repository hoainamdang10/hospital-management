"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandlePayOSWebhookUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const Payment_1 = require("../../domain/entities/Payment");
const Money_1 = require("../../domain/value-objects/Money");
class HandlePayOSWebhookUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, payosService, logger, walletService) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.payosService = payosService;
        this.walletService = walletService;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info("Handling PayOS webhook", {
            orderCode: request.webhookData.orderCode,
        });
        const isPing = this.isPingWebhook(request.rawPayload);
        // Verify webhook signature
        if (!request.signature) {
            if (isPing) {
                this.logger.info("PayOS ping received without signature, acknowledging");
                return {
                    success: true,
                    message: "Webhook acknowledged (ping)",
                };
            }
            throw new Error("Missing webhook signature");
        }
        const isValid = this.payosService.verifyIpnSignature(request.rawPayload || {}, request.signature);
        if (!isValid) {
            if (isPing) {
                this.logger.warn("PayOS ping failed signature verification, acknowledging anyway", {
                    orderCode: request.webhookData.orderCode,
                });
                return {
                    success: true,
                    message: "Webhook acknowledged (ping)",
                };
            }
            this.logger.error("Invalid webhook signature", {
                orderCode: request.webhookData.orderCode,
            });
            throw new Error("Invalid webhook signature");
        }
        // Check payment status
        if (request.webhookData.code !== "00") {
            this.logger.warn("Payment not successful", {
                orderCode: request.webhookData.orderCode,
                code: request.webhookData.code,
                desc: request.webhookData.desc,
            });
            return {
                success: false,
                message: `Payment failed: ${request.webhookData.desc}`,
            };
        }
        // Find invoice by description (contains invoice ID or invoice number)
        // Try multiple strategies to find the invoice:
        // 1. Try invoice number pattern (INV-YYYYMM-XXXX)
        // 2. Try UUID pattern (fallback for invoices created before auto-generation)
        // 3. Try direct UUID if description contains it
        const description = request.webhookData.description;
        let invoice = null;
        // Strategy 1: Try invoice number pattern
        const invoiceNumberMatch = description.match(/INV-\d{6}-\d{4}/);
        if (invoiceNumberMatch) {
            this.logger.debug("Attempting to find invoice by invoice number", {
                invoiceNumber: invoiceNumberMatch[0],
            });
            invoice = await this.invoiceRepository.findByInvoiceNumber(invoiceNumberMatch[0]);
        }
        // Strategy 2: Fallback to UUID pattern if invoice number search failed
        if (!invoice) {
            const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
            const uuidMatch = description.match(uuidPattern);
            if (uuidMatch) {
                this.logger.debug("Invoice number search failed, attempting to find by UUID", {
                    invoiceId: uuidMatch[0],
                });
                invoice = await this.invoiceRepository.findById(uuidMatch[0]);
            }
        }
        if (!invoice) {
            this.logger.error("Invoice not found from webhook (tried invoice number and UUID)", {
                description,
                orderCode: request.webhookData.orderCode,
            });
            throw new Error("Invoice not found");
        }
        // Extract VNPAY transaction data from webhook payload
        let vnpayData;
        if (request.rawPayload) {
            const vnpTxnRef = request.rawPayload.vnp_TxnRef;
            const vnpTransactionNo = request.rawPayload.vnp_TransactionNo;
            const vnpPayDate = request.rawPayload.vnp_PayDate;
            if (vnpTxnRef && vnpTransactionNo && vnpPayDate) {
                vnpayData = {
                    vnpTxnRef,
                    vnpTransactionNo,
                    vnpPayDate,
                };
                this.logger.info("VNPAY transaction data extracted from webhook", {
                    vnpTxnRef,
                    vnpTransactionNo,
                    vnpPayDate,
                });
            }
        }
        // Create payment with VNPAY data
        const payment = Payment_1.Payment.create(Money_1.Money.create(request.webhookData.amount), "payos", request.webhookData.reference, undefined, // id
        vnpayData);
        // Process payment
        invoice.processPayment(payment);
        const metadata = this.getInvoiceMetadata(invoice);
        const requiresWalletTopUp = this.isWalletTopUpInvoice(metadata);
        const walletAlreadyProcessed = this.isWalletTopUpProcessed(metadata) === true;
        if (requiresWalletTopUp && !walletAlreadyProcessed) {
            invoice.setMetadata({
                ...metadata,
                walletTopUpPending: true,
                walletTopUpProcessed: false,
            });
        }
        await this.invoiceRepository.save(invoice);
        // Publish events
        const events = invoice.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
        if (requiresWalletTopUp && !walletAlreadyProcessed) {
            await this.handleWalletTopUp(invoice, payment, request);
            await this.invoiceRepository.save(invoice);
        }
        this.logger.info("PayOS webhook processed successfully", {
            invoiceId: invoice.id,
            paymentId: payment.id,
            amount: request.webhookData.amount,
        });
        return {
            success: true,
            message: "Payment processed successfully",
            invoiceId: invoice.id,
            paymentId: payment.id,
        };
    }
    isPingWebhook(payload) {
        if (!payload) {
            return true;
        }
        const eventName = (payload.event ||
            payload.type ||
            payload?.data?.event);
        if (eventName && typeof eventName === "string") {
            const normalized = eventName.toLowerCase();
            if (normalized.includes("ping") || normalized.includes("test")) {
                return true;
            }
        }
        const desc = (payload.desc || payload?.data?.desc);
        if (desc && desc.toLowerCase().includes("ping")) {
            return true;
        }
        const data = payload.data ?? payload;
        const orderCode = data?.orderCode;
        if (typeof orderCode === "number" && orderCode < 100000000) {
            return true;
        }
        return false;
    }
    getInvoiceMetadata(invoice) {
        const metadata = invoice.metadata || {};
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
            return {};
        }
        return metadata;
    }
    isWalletTopUpInvoice(metadata) {
        const flag = metadata.walletTopUp ?? metadata.wallet_top_up;
        if (typeof flag === "string") {
            return flag.toLowerCase() === "true";
        }
        return Boolean(flag);
    }
    isWalletTopUpProcessed(metadata) {
        const flag = metadata.walletTopUpProcessed ?? metadata.wallet_top_up_processed;
        if (typeof flag === "string") {
            return flag.toLowerCase() === "true";
        }
        return Boolean(flag);
    }
    async handleWalletTopUp(invoice, payment, request) {
        if (!this.walletService) {
            this.logger.warn("Wallet service not configured, skipping wallet top-up credit", { invoiceId: invoice.id });
            return;
        }
        const metadata = this.getInvoiceMetadata(invoice);
        if (this.isWalletTopUpProcessed(metadata)) {
            this.logger.info("Wallet top-up already processed for invoice", {
                invoiceId: invoice.id,
            });
            return;
        }
        const amount = Number(metadata.walletTopUpAmount ?? payment.amount.amount) || 0;
        if (amount <= 0) {
            throw new Error(`Invalid wallet top-up amount for invoice ${invoice.id}`);
        }
        const description = metadata.walletTopUpDescription ||
            metadata.description ||
            "Wallet top-up via online payment";
        const createdBy = metadata.walletTopUpCreatedBy || "system";
        const referenceId = metadata.walletTopUpReferenceId || payment.id || invoice.id;
        const walletTransaction = await this.walletService.topUp(invoice.getPatientId(), amount, description, referenceId, createdBy, {
            invoiceId: invoice.id,
            paymentId: payment.id,
            orderCode: request.webhookData.orderCode,
            reference: request.webhookData.reference,
            description: request.webhookData.description,
            vnpTxnRef: request.rawPayload?.vnp_TxnRef,
        });
        invoice.setMetadata({
            ...metadata,
            walletTopUpProcessed: true,
            walletTopUpPending: false,
            walletTopUpTransactionId: walletTransaction.id,
            walletTopUpProcessedAt: new Date().toISOString(),
        });
        this.logger.info("Wallet top-up credited from webhook", {
            invoiceId: invoice.id,
            patientId: invoice.getPatientId(),
            walletTransactionId: walletTransaction.id,
            amount,
        });
    }
}
exports.HandlePayOSWebhookUseCase = HandlePayOSWebhookUseCase;
//# sourceMappingURL=HandlePayOSWebhookUseCase.js.map