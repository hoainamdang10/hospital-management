"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const express_validator_1 = require("express-validator");
const payos_service_1 = require("../services/payos.service");
const payment_repository_1 = require("../repositories/payment.repository");
const shared_1 = require("@hospital/shared");
class PaymentController {
    constructor() {
        this.payOSService = new payos_service_1.PayOSService();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
    }
    async createPayOSPayment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { appointmentId, amount, description, serviceName, patientInfo } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            if (!this.payOSService.validateAmount(amount)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid payment amount'
                });
                return;
            }
            const orderCode = this.payOSService.generateOrderCode();
            const paymentRecord = await this.paymentRepository.createPayment({
                orderCode,
                appointmentId,
                amount: this.payOSService.formatAmount(amount),
                description,
                paymentMethod: 'payos',
                status: 'pending',
                userId,
                patientInfo
            });
            const paymentData = {
                orderCode,
                amount: this.payOSService.formatAmount(amount),
                description,
                serviceName,
                appointmentId,
                patientInfo
            };
            const paymentLink = await this.payOSService.createPaymentLink(paymentData);
            await this.paymentRepository.updatePayment(paymentRecord.id, {
                paymentLinkId: paymentLink.paymentLinkId,
                checkoutUrl: paymentLink.checkoutUrl,
                qrCode: paymentLink.qrCode
            });
            shared_1.logger.info('PayOS payment created successfully', {
                orderCode,
                appointmentId,
                amount,
                userId
            });
            res.json({
                success: true,
                message: 'Payment link created successfully',
                data: {
                    orderCode,
                    checkoutUrl: paymentLink.checkoutUrl,
                    qrCode: paymentLink.qrCode,
                    amount: paymentLink.amount,
                    paymentLinkId: paymentLink.paymentLinkId
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating PayOS payment', {
                error: error?.message || 'Unknown error',
                body: req.body,
                userId: req.user?.id
            });
            res.status(500).json({
                success: false,
                message: 'Failed to create payment link',
                error: process.env.NODE_ENV === 'development' ? error?.message : undefined
            });
        }
    }
    async createCashPayment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { appointmentId, amount, description } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const orderCode = `CASH${Date.now()}`;
            const paymentRecord = await this.paymentRepository.createPayment({
                orderCode,
                appointmentId,
                amount,
                description: description || `Thanh toán tiền mặt - ${appointmentId}`,
                paymentMethod: 'cash',
                status: 'pending',
                userId
            });
            shared_1.logger.info('Cash payment record created', {
                orderCode,
                appointmentId,
                amount,
                userId
            });
            res.json({
                success: true,
                message: 'Cash payment record created successfully',
                data: {
                    orderCode,
                    amount,
                    status: 'pending',
                    paymentMethod: 'cash',
                    id: paymentRecord.id
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating cash payment', {
                error: error?.message || 'Unknown error',
                body: req.body,
                userId: req.user?.id
            });
            res.status(500).json({
                success: false,
                message: 'Failed to create cash payment record',
                error: process.env.NODE_ENV === 'development' ? error?.message : undefined
            });
        }
    }
    async verifyPayment(req, res) {
        try {
            const { orderCode } = req.query;
            const userId = req.user?.id;
            if (!orderCode || !userId) {
                res.status(400).json({
                    success: false,
                    message: 'Order code and user authentication required'
                });
                return;
            }
            const paymentRecord = await this.paymentRepository.getPaymentByOrderCode(orderCode);
            if (!paymentRecord) {
                res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
                return;
            }
            if (paymentRecord.userId !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            let paymentInfo = null;
            if (paymentRecord.paymentMethod === 'payos' && paymentRecord.status === 'pending') {
                try {
                    paymentInfo = await this.payOSService.getPaymentInfo(orderCode);
                    if (paymentInfo && paymentInfo.status === 'PAID') {
                        await this.paymentRepository.updatePayment(paymentRecord.id, {
                            status: 'success',
                            transactionId: paymentInfo.transactions?.[0]?.reference,
                            paidAt: new Date().toISOString()
                        });
                        paymentRecord.status = 'success';
                    }
                    else if (paymentInfo && paymentInfo.status === 'CANCELLED') {
                        await this.paymentRepository.updatePayment(paymentRecord.id, {
                            status: 'cancelled'
                        });
                        paymentRecord.status = 'cancelled';
                    }
                }
                catch (error) {
                    shared_1.logger.warn('Failed to get PayOS payment info', {
                        orderCode,
                        error: error?.message || 'Unknown error'
                    });
                }
            }
            shared_1.logger.info('Payment verification completed', {
                orderCode,
                status: paymentRecord.status,
                userId
            });
            res.json({
                success: true,
                data: {
                    id: paymentRecord.id,
                    orderCode: paymentRecord.orderCode,
                    amount: paymentRecord.amount,
                    status: paymentRecord.status,
                    paymentMethod: paymentRecord.paymentMethod,
                    transactionId: paymentRecord.transactionId,
                    createdAt: paymentRecord.createdAt,
                    appointmentId: paymentRecord.appointmentId,
                    description: paymentRecord.description,
                    payosInfo: paymentInfo
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error verifying payment', {
                error: error?.message || 'Unknown error',
                orderCode: req.query.orderCode,
                userId: req.user?.id
            });
            res.status(500).json({
                success: false,
                message: 'Failed to verify payment',
                error: process.env.NODE_ENV === 'development' ? error?.message : undefined
            });
        }
    }
    async getPaymentHistory(req, res) {
        try {
            const userId = req.user?.id;
            const { page = 1, limit = 20, status, method } = req.query;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const filters = {
                status: status,
                paymentMethod: method
            };
            const payments = await this.paymentRepository.getPaymentsByUserId(userId, parseInt(page), parseInt(limit), filters);
            shared_1.logger.info('Payment history retrieved', {
                userId,
                count: payments.length,
                page,
                limit
            });
            res.json({
                success: true,
                data: payments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: payments.length
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error getting payment history', {
                error: error?.message || 'Unknown error',
                userId: req.user?.id
            });
            res.status(500).json({
                success: false,
                message: 'Failed to get payment history',
                error: process.env.NODE_ENV === 'development' ? error?.message : undefined
            });
        }
    }
    async getPaymentReceipt(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const receipt = await this.paymentRepository.getPaymentReceiptById(id, userId);
            if (!receipt) {
                res.status(404).json({
                    success: false,
                    message: 'Receipt not found'
                });
                return;
            }
            shared_1.logger.info('Payment receipt retrieved', {
                receiptId: id,
                userId
            });
            res.json({
                success: true,
                data: receipt
            });
        }
        catch (error) {
            shared_1.logger.error('Error getting payment receipt', {
                error: error?.message || 'Unknown error',
                receiptId: req.params.id,
                userId: req.user?.id
            });
            res.status(500).json({
                success: false,
                message: 'Failed to get payment receipt',
                error: process.env.NODE_ENV === 'development' ? error?.message : undefined
            });
        }
    }
    async cancelPayment(req, res) {
        try {
            const { orderCode } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const paymentRecord = await this.paymentRepository.getPaymentByOrderCode(orderCode);
            if (!paymentRecord) {
                res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
                return;
            }
            if (paymentRecord.userId !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            if (paymentRecord.status !== 'pending') {
                res.status(400).json({
                    success: false,
                    message: 'Payment cannot be cancelled'
                });
                return;
            }
            if (paymentRecord.paymentMethod === 'payos') {
                await this.payOSService.cancelPaymentLink(orderCode, reason);
            }
            await this.paymentRepository.updatePayment(paymentRecord.id, {
                status: 'cancelled',
                cancelReason: reason
            });
            shared_1.logger.info('Payment cancelled successfully', {
                orderCode,
                reason,
                userId
            });
            res.json({
                success: true,
                message: 'Payment cancelled successfully'
            });
        }
        catch (error) {
            shared_1.logger.error('Error cancelling payment', {
                error: error?.message || 'Unknown error',
                orderCode: req.params.orderCode,
                userId: req.user?.id
            });
            res.status(500).json({
                success: false,
                message: 'Failed to cancel payment',
                error: process.env.NODE_ENV === 'development' ? error?.message : undefined
            });
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=payment.controller.js.map