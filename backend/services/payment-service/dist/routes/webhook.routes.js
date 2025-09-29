"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = void 0;
const express_1 = require("express");
const payos_service_1 = require("../services/payos.service");
const payment_repository_1 = require("../repositories/payment.repository");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.webhookRoutes = router;
const payOSService = new payos_service_1.PayOSService();
const paymentRepository = new payment_repository_1.PaymentRepository();
router.post('/payos', async (req, res) => {
    try {
        logger_1.logger.info('PayOS webhook received', {
            body: req.body,
            headers: req.headers
        });
        const webhookData = req.body;
        const signature = req.headers['x-payos-signature'];
        if (signature) {
            const isValid = payOSService.validateWebhookSignature(JSON.stringify(webhookData), signature);
            if (!isValid) {
                logger_1.logger.warn('Invalid PayOS webhook signature', {
                    signature,
                    body: webhookData
                });
                return res.status(401).json({
                    success: false,
                    message: 'Invalid webhook signature'
                });
            }
        }
        const verificationResult = await payOSService.verifyPaymentWebhook(webhookData);
        if (verificationResult.success) {
            const paymentRecord = await paymentRepository.getPaymentByOrderCode(verificationResult.orderCode);
            if (paymentRecord) {
                await paymentRepository.updatePayment(paymentRecord.id, {
                    status: verificationResult.status,
                    transactionId: verificationResult.transactionId,
                    paidAt: verificationResult.status === 'success' ? new Date().toISOString() : undefined,
                    failureReason: verificationResult.failureReason
                });
                logger_1.logger.info('Payment status updated via webhook', {
                    orderCode: verificationResult.orderCode,
                    status: verificationResult.status,
                    transactionId: verificationResult.transactionId
                });
            }
            else {
                logger_1.logger.warn('Payment record not found for webhook', {
                    orderCode: verificationResult.orderCode
                });
            }
        }
        else {
            logger_1.logger.warn('PayOS webhook verification failed', {
                orderCode: verificationResult.orderCode,
                failureReason: verificationResult.failureReason
            });
        }
        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing PayOS webhook', {
            error: error?.message || 'Unknown error',
            body: req.body
        });
        res.json({
            success: true,
            message: 'Webhook received but processing failed'
        });
    }
});
router.get('/payos/test', (req, res) => {
    res.json({
        success: true,
        message: 'PayOS webhook endpoint is working',
        timestamp: new Date().toISOString(),
        environment: payOSService.getEnvironmentInfo()
    });
});
//# sourceMappingURL=webhook.routes.js.map