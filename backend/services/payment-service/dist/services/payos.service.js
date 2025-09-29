"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayOSService = void 0;
const node_1 = __importDefault(require("@payos/node"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
class PayOSService {
    constructor() {
        const clientId = process.env.PAYOS_CLIENT_ID;
        const apiKey = process.env.PAYOS_API_KEY;
        const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
        if (!clientId || !apiKey || !checksumKey) {
            throw new Error('PayOS credentials are not configured properly');
        }
        this.payOS = new node_1.default(clientId, apiKey, checksumKey);
        this.returnUrl = `${process.env.FRONTEND_URL}/patient/payment/result`;
        this.cancelUrl = `${process.env.FRONTEND_URL}/patient/payment/result`;
        logger_1.logger.info('PayOS Service initialized', {
            environment: process.env.PAYOS_ENVIRONMENT || 'sandbox',
            returnUrl: this.returnUrl,
            cancelUrl: this.cancelUrl
        });
    }
    async createPaymentLink(paymentData) {
        try {
            logger_1.logger.info('Creating PayOS payment link', {
                orderCode: paymentData.orderCode,
                amount: paymentData.amount,
                appointmentId: paymentData.appointmentId
            });
            const order = {
                orderCode: parseInt(paymentData.orderCode.replace(/\D/g, '')),
                amount: paymentData.amount,
                description: paymentData.description,
                items: [
                    {
                        name: paymentData.serviceName,
                        quantity: 1,
                        price: paymentData.amount
                    }
                ],
                returnUrl: `${this.returnUrl}?orderCode=${paymentData.orderCode}&appointmentId=${paymentData.appointmentId}`,
                cancelUrl: `${this.cancelUrl}?orderCode=${paymentData.orderCode}&status=CANCELLED`
            };
            const paymentLinkResponse = await this.payOS.createPaymentLink(order);
            logger_1.logger.info('PayOS payment link created successfully', {
                orderCode: paymentData.orderCode,
                paymentLinkId: paymentLinkResponse.paymentLinkId,
                checkoutUrl: paymentLinkResponse.checkoutUrl
            });
            return paymentLinkResponse;
        }
        catch (error) {
            logger_1.logger.error('PayOS payment creation failed', {
                error: error?.message || 'Unknown error',
                orderCode: paymentData.orderCode,
                amount: paymentData.amount
            });
            throw new Error(`PayOS payment creation failed: ${error?.message || 'Unknown error'}`);
        }
    }
    async verifyPaymentWebhook(webhookData) {
        try {
            logger_1.logger.info('Verifying PayOS webhook', {
                orderCode: webhookData.orderCode,
                amount: webhookData.amount
            });
            const verifiedData = this.payOS.verifyPaymentWebhookData(webhookData);
            const result = {
                success: verifiedData.code === '00',
                orderCode: verifiedData.orderCode.toString(),
                amount: verifiedData.amount,
                transactionId: verifiedData.id || verifiedData.orderCode.toString(),
                status: this.mapPayOSStatusToInternal(verifiedData.code, verifiedData.desc)
            };
            if (!result.success) {
                result.failureReason = verifiedData.desc;
            }
            logger_1.logger.info('PayOS webhook verified', {
                orderCode: result.orderCode,
                status: result.status,
                success: result.success
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('PayOS webhook verification failed', {
                error: error?.message || 'Unknown error',
                webhookData
            });
            throw new Error(`PayOS verification failed: ${error?.message || 'Unknown error'}`);
        }
    }
    async getPaymentInfo(orderCode) {
        try {
            logger_1.logger.info('Getting PayOS payment info', { orderCode });
            const numericOrderCode = parseInt(orderCode.replace(/\D/g, ''));
            const paymentInfo = await this.payOS.getPaymentLinkInformation(numericOrderCode);
            logger_1.logger.info('PayOS payment info retrieved', {
                orderCode,
                status: paymentInfo.status,
                amount: paymentInfo.amount
            });
            return paymentInfo;
        }
        catch (error) {
            logger_1.logger.error('PayOS get payment info failed', {
                error: error?.message || 'Unknown error',
                orderCode
            });
            throw new Error(`PayOS get payment info failed: ${error?.message || 'Unknown error'}`);
        }
    }
    async cancelPaymentLink(orderCode, reason) {
        try {
            logger_1.logger.info('Cancelling PayOS payment link', { orderCode, reason });
            const numericOrderCode = parseInt(orderCode.replace(/\D/g, ''));
            await this.payOS.cancelPaymentLink(numericOrderCode, reason);
            logger_1.logger.info('PayOS payment link cancelled successfully', { orderCode });
            return true;
        }
        catch (error) {
            logger_1.logger.error('PayOS payment cancellation failed', {
                error: error?.message || 'Unknown error',
                orderCode
            });
            throw new Error(`PayOS payment cancellation failed: ${error?.message || 'Unknown error'}`);
        }
    }
    generateOrderCode() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `HOS${timestamp}${random}`;
    }
    validateWebhookSignature(payload, signature) {
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
                .update(payload)
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        }
        catch (error) {
            logger_1.logger.error('Webhook signature validation failed', { error: error?.message || 'Unknown error' });
            return false;
        }
    }
    mapPayOSStatusToInternal(code, description) {
        switch (code) {
            case '00':
                return 'success';
            case '01':
            case '02':
                return 'pending';
            case '03':
                return 'cancelled';
            default:
                return 'failed';
        }
    }
    formatAmount(amount) {
        return Math.round(amount);
    }
    validateAmount(amount) {
        return amount > 0 && amount <= 500000000;
    }
    getEnvironmentInfo() {
        const environment = process.env.PAYOS_ENVIRONMENT || 'sandbox';
        return {
            environment,
            isProduction: environment === 'production'
        };
    }
}
exports.PayOSService = PayOSService;
//# sourceMappingURL=payos.service.js.map