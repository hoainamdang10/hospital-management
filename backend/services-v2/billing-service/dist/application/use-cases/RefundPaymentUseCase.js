"use strict";
/**
 * RefundPaymentUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for processing payment refunds with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundPaymentUseCase = void 0;
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
const Money_1 = require("../../domain/value-objects/Money");
const BillingAggregate_1 = require("../../domain/aggregates/BillingAggregate");
const BaseHealthcareUseCase_1 = require("../../../../shared/application/base/BaseHealthcareUseCase");
/**
 * Refund Payment Use Case
 * Implements payment refund processing with Vietnamese healthcare compliance
 */
class RefundPaymentUseCase extends BaseHealthcareUseCase_1.BaseHealthcareUseCase {
    constructor(billingRepository, eventBus, logger) {
        super(logger);
        this.billingRepository = billingRepository;
        this.eventBus = eventBus;
    }
    /**
     * Execute payment refund
     */
    async executeCore(request) {
        try {
            this.logger.info('Processing payment refund', {
                invoiceId: request.invoiceId,
                refundAmount: request.refundAmount,
                refundReason: request.refundReason,
                processedBy: request.processedBy
            });
            // 1. Validate request
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // 2. Get billing aggregate
            const invoiceId = InvoiceId_1.InvoiceId.create(request.invoiceId);
            const billingAggregate = await this.billingRepository.findById(invoiceId);
            if (!billingAggregate) {
                return {
                    success: false,
                    message: 'Không tìm thấy hóa đơn'
                };
            }
            // 3. Validate refund eligibility
            const eligibilityCheck = this.validateRefundEligibility(billingAggregate, request.refundAmount);
            if (!eligibilityCheck.isValid) {
                return {
                    success: false,
                    message: eligibilityCheck.message,
                    errors: eligibilityCheck.errors
                };
            }
            // 4. Process refund
            const refundAmount = Money_1.Money.create(request.refundAmount, 'VND');
            const refundId = this.generateRefundId();
            billingAggregate.processRefund(refundId, refundAmount, request.refundReason, request.refundMethod, request.processedBy, {
                notes: request.notes,
                refundToOriginalMethod: request.refundToOriginalMethod
            });
            // 5. Save updated aggregate
            await this.billingRepository.save(billingAggregate);
            // 6. Publish domain events
            const events = billingAggregate.getUncommittedEvents();
            for (const event of events) {
                await this.eventBus.publish(event);
            }
            billingAggregate.markEventsAsCommitted();
            this.logger.info('Payment refund processed successfully', {
                invoiceId: request.invoiceId,
                refundId,
                refundAmount: request.refundAmount,
                newStatus: billingAggregate.status
            });
            return {
                success: true,
                message: 'Hoàn tiền thành công',
                data: {
                    invoiceId: request.invoiceId,
                    refundId,
                    refundAmount: request.refundAmount,
                    refundMethod: request.refundMethod,
                    refundDate: new Date(),
                    remainingBalance: billingAggregate.remainingBalance.amount,
                    status: billingAggregate.status
                }
            };
        }
        catch (error) {
            this.logger.error('Error processing payment refund', {
                invoiceId: request.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi xử lý hoàn tiền: ' + (error instanceof Error ? error.message : 'Unknown error')
            };
        }
    }
    /**
     * Validate refund payment request
     */
    validateRequest(request) {
        const errors = [];
        if (!request.invoiceId) {
            errors.push({
                field: 'invoiceId',
                message: 'Invoice ID là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.refundAmount || request.refundAmount <= 0) {
            errors.push({
                field: 'refundAmount',
                message: 'Số tiền hoàn phải lớn hơn 0',
                code: 'INVALID_VALUE'
            });
        }
        if (!request.refundReason) {
            errors.push({
                field: 'refundReason',
                message: 'Lý do hoàn tiền là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.refundMethod) {
            errors.push({
                field: 'refundMethod',
                message: 'Phương thức hoàn tiền là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.processedBy) {
            errors.push({
                field: 'processedBy',
                message: 'Người xử lý hoàn tiền là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate refund eligibility
     */
    validateRefundEligibility(billingAggregate, refundAmount) {
        const errors = [];
        // Check if invoice is paid
        if (billingAggregate.status !== BillingAggregate_1.InvoiceStatus.PAID &&
            billingAggregate.status !== BillingAggregate_1.InvoiceStatus.PARTIALLY_PAID) {
            errors.push({
                field: 'status',
                message: 'Chỉ có thể hoàn tiền cho hóa đơn đã thanh toán',
                code: 'INVALID_STATUS'
            });
        }
        // Check if refund amount is valid
        const totalPaid = billingAggregate.totalPaid?.amount || 0;
        const totalRefunded = billingAggregate.totalRefunded?.amount || 0;
        const availableForRefund = totalPaid - totalRefunded;
        if (refundAmount > availableForRefund) {
            errors.push({
                field: 'refundAmount',
                message: `Số tiền hoàn không thể vượt quá ${availableForRefund.toLocaleString('vi-VN')} VND`,
                code: 'EXCEEDS_AVAILABLE_AMOUNT'
            });
        }
        // Check refund time limit (e.g., 30 days)
        const daysSincePayment = Math.floor((Date.now() - billingAggregate.lastPaymentDate?.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSincePayment > 30) {
            errors.push({
                field: 'timeLimit',
                message: 'Đã quá thời hạn hoàn tiền (30 ngày)',
                code: 'REFUND_TIME_EXPIRED'
            });
        }
        return {
            isValid: errors.length === 0,
            message: errors.length > 0 ? errors[0].message : undefined,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    /**
     * Generate unique refund ID
     */
    generateRefundId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `RF-${timestamp}-${random}`;
    }
}
exports.RefundPaymentUseCase = RefundPaymentUseCase;
//# sourceMappingURL=RefundPaymentUseCase.js.map