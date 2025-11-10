"use strict";
/**
 * BillingController - Simplified for Academic Project
 * REST API controller for billing operations
 * Reduced to ~20 core methods
 *
 * @author Hospital Management Team
 * @version 2.0.0 (Simplified)
 * @compliance Clean Architecture, REST API Standards, Vietnamese Healthcare
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
/**
 * BillingController (Simplified)
 * 20 core methods for academic project
 */
class BillingController {
    constructor(dependencies) {
        this.createInvoiceUseCase = dependencies.createInvoiceUseCase;
        this.processPaymentUseCase = dependencies.processPaymentUseCase;
        this.refundPaymentUseCase = dependencies.refundPaymentUseCase;
        this.getInvoiceUseCase = dependencies.getInvoiceUseCase;
        this.getInvoicesUseCase = dependencies.getInvoicesUseCase;
        this.finalizeInvoiceUseCase = dependencies.finalizeInvoiceUseCase;
        this.cancelInvoiceUseCase = dependencies.cancelInvoiceUseCase;
        this.searchInvoicesUseCase = dependencies.searchInvoicesUseCase;
        this.getOverdueInvoicesUseCase = dependencies.getOverdueInvoicesUseCase;
        this.getBillingHistoryUseCase = dependencies.getBillingHistoryUseCase;
        this.getPatientInvoicesUseCase = dependencies.getPatientInvoicesUseCase;
        this.getPatientBillingSummaryUseCase = dependencies.getPatientBillingSummaryUseCase;
        this.getPatientPaymentHistoryUseCase = dependencies.getPatientPaymentHistoryUseCase;
        this.getPatientOutstandingBalanceUseCase = dependencies.getPatientOutstandingBalanceUseCase;
        this.validateInsuranceUseCase = dependencies.validateInsuranceUseCase;
        this.processInsuranceClaimUseCase = dependencies.processInsuranceClaimUseCase;
        this.createPayOSPaymentLinkUseCase = dependencies.createPayOSPaymentLinkUseCase;
        this.handlePayOSWebhookUseCase = dependencies.handlePayOSWebhookUseCase;
        this.getRevenueReportUseCase = dependencies.getRevenueReportUseCase;
        this.logger = dependencies.logger;
    }
    // =====================================================
    // INVOICE MANAGEMENT (5 methods)
    // =====================================================
    /**
     * 1. Create invoice
     * POST /api/v1/invoices
     */
    async createInvoice(req, res) {
        try {
            const { patientId, doctorId, medicalRecordId, appointmentId, items, insurance, notes, issuedBy } = req.body;
            if (!patientId || !items || !Array.isArray(items) || items.length === 0 || !issuedBy) {
                res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc",
                    errors: [
                        !patientId && { field: 'patientId', message: 'Mã bệnh nhân không được để trống' },
                        (!items || !Array.isArray(items) || items.length === 0) && { field: 'items', message: 'Danh sách dịch vụ không được để trống' },
                        !issuedBy && { field: 'issuedBy', message: 'Người lập hóa đơn không được để trống' }
                    ].filter(Boolean)
                });
                return;
            }
            const result = await this.createInvoiceUseCase.execute({
                patientId,
                doctorId: doctorId || '',
                medicalRecordId,
                appointmentId,
                items: items.map((item) => ({
                    description: item.description || item.serviceName,
                    vietnameseDescription: item.vietnameseDescription || item.serviceName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    category: item.category,
                    taxable: item.taxable !== false,
                    insuranceCoverable: item.insuranceCoverable !== false,
                    serviceCode: item.serviceCode
                })),
                insurance,
                notes,
                issuedBy
            });
            res.status(result.success ? 201 : 400).json(result);
        }
        catch (error) {
            this.logger.error('Error creating invoice', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo hóa đơn" });
        }
    }
    /**
     * 2. Get invoice by ID
     * GET /api/v1/invoices/:id
     */
    async getInvoiceById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.getInvoiceUseCase.execute({ invoiceId: id });
            res.status(result.success ? 200 : 404).json(result);
        }
        catch (error) {
            this.logger.error('Error getting invoice', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy hóa đơn" });
        }
    }
    /**
     * 3. Get invoices with filters
     * GET /api/v1/invoices
     */
    async getInvoices(req, res) {
        try {
            const { page, limit, status, patientId, doctorId, dateFrom, dateTo } = req.query;
            const result = await this.getInvoicesUseCase.execute({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                status: status,
                patientId: patientId,
                doctorId: doctorId,
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined
            });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting invoices', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    /**
     * 4. Finalize invoice
     * PUT /api/v1/invoices/:id/finalize
     */
    async finalizeInvoice(req, res) {
        try {
            const { id } = req.params;
            const { finalizedBy } = req.body;
            const result = await this.finalizeInvoiceUseCase.execute({ invoiceId: id, finalizedBy: finalizedBy || 'SYSTEM' });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            this.logger.error('Error finalizing invoice', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    /**
     * 5. Cancel invoice
     * PUT /api/v1/invoices/:id/cancel
     */
    async cancelInvoice(req, res) {
        try {
            const { id } = req.params;
            const { reason, cancelledBy } = req.body;
            const result = await this.cancelInvoiceUseCase.execute({ invoiceId: id, reason, cancelledBy });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            this.logger.error('Error cancelling invoice', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    // =====================================================
    // PAYMENT MANAGEMENT (4 methods)
    // =====================================================
    /**
     * 6. Process payment
     * POST /api/v1/invoices/:id/payments
     */
    async processPayment(req, res) {
        try {
            const { id } = req.params;
            const { amount, paymentMethod, transactionId, notes, processedBy } = req.body;
            const result = await this.processPaymentUseCase.execute({
                invoiceId: id,
                amount,
                currency: 'VND',
                paymentMethod,
                transactionId,
                notes,
                processedBy
            });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            this.logger.error('Error processing payment', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi xử lý thanh toán" });
        }
    }
    /**
     * 7. Process refund
     * POST /api/v1/invoices/:id/refund
     */
    async processRefund(req, res) {
        try {
            const { id } = req.params;
            const { amount, reason, refundMethod } = req.body;
            const result = await this.refundPaymentUseCase.execute({
                invoiceId: id,
                refundAmount: amount,
                refundReason: reason,
                refundMethod,
                processedBy: req.body.processedBy || 'SYSTEM'
            });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            this.logger.error('Error processing refund', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi hoàn tiền" });
        }
    }
    /**
     * 8. Get patient payment history
     * GET /api/v1/patients/:patientId/payment-history
     */
    async getPatientPaymentHistory(req, res) {
        try {
            const { patientId } = req.params;
            const { page, limit, dateFrom, dateTo } = req.query;
            const result = await this.getPatientPaymentHistoryUseCase.execute({
                patientId,
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined
            });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting patient payment history', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    /**
     * 9. Get patient outstanding balance
     * GET /api/v1/patients/:patientId/outstanding-balance
     */
    async getPatientOutstandingBalance(req, res) {
        try {
            const { patientId } = req.params;
            const result = await this.getPatientOutstandingBalanceUseCase.execute({ patientId });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting patient outstanding balance', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    // =====================================================
    // INSURANCE (2 methods)
    // =====================================================
    /**
     * 10. Validate insurance
     * POST /api/v1/insurance/validate
     */
    async validateInsurance(req, res) {
        try {
            const result = await this.validateInsuranceUseCase.execute(req.body);
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error validating insurance', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    /**
     * 11. Process insurance claim (submit/approve/reject)
     * POST /api/v1/invoices/:id/insurance-claim
     */
    async processInsuranceClaim(req, res) {
        try {
            const { id } = req.params;
            const { action, approvedAmount, rejectionReason, notes, processedBy } = req.body;
            const result = await this.processInsuranceClaimUseCase.execute({
                invoiceId: id,
                action,
                processedBy,
                approvedAmount,
                rejectionReason,
                notes
            });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            this.logger.error('Error processing insurance claim', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    // =====================================================
    // PAYOS INTEGRATION (2 methods)
    // =====================================================
    /**
     * 12. Create PayOS payment link
     * POST /api/v1/payos/create-payment-link
     */
    async createPayOSPaymentLink(req, res) {
        try {
            const { invoiceId, returnUrl, cancelUrl } = req.body;
            const result = await this.createPayOSPaymentLinkUseCase.execute({ invoiceId, returnUrl, cancelUrl });
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            this.logger.error('Error creating PayOS payment link', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    /**
     * 13. Handle PayOS webhook
     * POST /api/v1/payos/webhook
     */
    async handlePayOSWebhook(req, res) {
        try {
            const result = await this.handlePayOSWebhookUseCase.execute(req.body);
            res.status(result.success ? 200 : 400).json(result);
        }
        catch (error) {
            this.logger.error('Error handling PayOS webhook', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    // =====================================================
    // PATIENT BILLING (2 methods)
    // =====================================================
    /**
     * 14. Get patient invoices
     * GET /api/v1/patients/:patientId/invoices
     */
    async getPatientInvoices(req, res) {
        try {
            const { patientId } = req.params;
            const { page, limit, status } = req.query;
            const result = await this.getPatientInvoicesUseCase.execute({
                patientId,
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                status: status
            });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting patient invoices', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    /**
     * 15. Get patient billing summary
     * GET /api/v1/patients/:patientId/billing-summary
     */
    async getPatientBillingSummary(req, res) {
        try {
            const { patientId } = req.params;
            const result = await this.getPatientBillingSummaryUseCase.execute({ patientId, includeHistory: true });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting patient billing summary', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    // =====================================================
    // REPORTS (2 methods)
    // =====================================================
    /**
     * 16. Get revenue report
     * GET /api/v1/reports/revenue
     */
    async getRevenueReport(req, res) {
        try {
            const { dateFrom, dateTo, groupBy } = req.query;
            const result = await this.getRevenueReportUseCase.execute({
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined,
                groupBy: groupBy
            });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting revenue report', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    /**
     * 17. Get billing history
     * GET /api/v1/reports/billing-history
     */
    async getBillingHistory(req, res) {
        try {
            const { patientId, doctorId, dateFrom, dateTo, status, page, pageSize } = req.query;
            const result = await this.getBillingHistoryUseCase.execute({
                patientId: patientId,
                doctorId: doctorId,
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined,
                status: status,
                page: page ? parseInt(page) : 1,
                pageSize: pageSize ? parseInt(pageSize) : 20
            });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting billing history', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    // =====================================================
    // SEARCH & FILTERS (2 methods)
    // =====================================================
    /**
     * 18. Search invoices
     * POST /api/v1/invoices/search
     */
    async searchInvoices(req, res) {
        try {
            const result = await this.searchInvoicesUseCase.execute(req.body);
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error searching invoices', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
    /**
     * 19. Get overdue invoices
     * GET /api/v1/invoices/overdue
     */
    async getOverdueInvoices(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await this.getOverdueInvoicesUseCase.execute({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20
            });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting overdue invoices', { error });
            res.status(500).json({ success: false, message: "Lỗi hệ thống" });
        }
    }
}
exports.BillingController = BillingController;
//# sourceMappingURL=BillingController.js.map