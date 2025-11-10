"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePayOSPaymentLinkUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const PayOSIntegrationService_1 = require("../../infrastructure/services/PayOSIntegrationService");
class CreatePayOSPaymentLinkUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, payosService, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.payosService = payosService;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Creating PayOS payment link', { invoiceId: request.invoiceId });
        const invoice = await this.invoiceRepository.findById(request.invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        if (invoice.status.value === 'cancelled') {
            throw new Error('Cannot create payment link for cancelled invoice');
        }
        if (invoice.status.value === 'paid') {
            throw new Error('Invoice is already paid');
        }
        const orderCode = PayOSIntegrationService_1.PayOSIntegrationService.generateOrderCode();
        const paymentLink = await this.payosService.createPaymentLink({
            orderCode,
            amount: invoice.outstandingAmount.amount,
            description: `Thanh toán hóa đơn ${invoice.invoiceNumber || invoice.id}`,
            items: invoice.items.map(item => ({
                name: item.description,
                quantity: item.quantity,
                price: item.unitPrice.amount
            })),
            buyerName: request.buyerName,
            buyerEmail: request.buyerEmail,
            buyerPhone: request.buyerPhone,
            returnUrl: request.returnUrl || `${process.env.FRONTEND_URL}/billing/payment/success`,
            cancelUrl: request.cancelUrl || `${process.env.FRONTEND_URL}/billing/payment/cancel`
        });
        this.logger.info('PayOS payment link created', {
            invoiceId: request.invoiceId,
            orderCode,
            paymentLinkId: paymentLink.paymentLinkId
        });
        return {
            success: true,
            checkoutUrl: paymentLink.checkoutUrl,
            qrCode: paymentLink.qrCode,
            paymentLinkId: paymentLink.paymentLinkId,
            orderCode: paymentLink.orderCode,
            amount: paymentLink.amount
        };
    }
}
exports.CreatePayOSPaymentLinkUseCase = CreatePayOSPaymentLinkUseCase;
//# sourceMappingURL=CreatePayOSPaymentLinkUseCase.js.map