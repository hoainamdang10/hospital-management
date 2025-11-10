"use strict";
/**
 * BillingCommandHandlers - Simplified for Academic Project
 * CQRS command handlers for billing operations
 * Reduced from 40+ handlers to 15 core handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0 (Simplified)
 * @compliance Clean Architecture, CQRS, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingCommandHandlers = void 0;
const GetInvoiceUseCase_1 = require("../use-cases/GetInvoiceUseCase");
const GetInvoicesUseCase_1 = require("../use-cases/GetInvoicesUseCase");
const FinalizeInvoiceUseCase_1 = require("../use-cases/FinalizeInvoiceUseCase");
const CancelInvoiceUseCase_1 = require("../use-cases/CancelInvoiceUseCase");
const SearchInvoicesUseCase_1 = require("../use-cases/SearchInvoicesUseCase");
const GetOverdueInvoicesUseCase_1 = require("../use-cases/GetOverdueInvoicesUseCase");
const GetPatientBillingSummaryUseCase_1 = require("../use-cases/GetPatientBillingSummaryUseCase");
const ProcessInsuranceClaimUseCase_1 = require("../use-cases/ProcessInsuranceClaimUseCase");
const ValidateInsuranceUseCase_1 = require("../use-cases/ValidateInsuranceUseCase");
const GetRevenueReportUseCase_1 = require("../use-cases/GetRevenueReportUseCase");
const GetBillingHistoryUseCase_1 = require("../use-cases/GetBillingHistoryUseCase");
const GetPatientInvoicesUseCase_1 = require("../use-cases/GetPatientInvoicesUseCase");
const GetPatientPaymentHistoryUseCase_1 = require("../use-cases/GetPatientPaymentHistoryUseCase");
const GetPatientOutstandingBalanceUseCase_1 = require("../use-cases/GetPatientOutstandingBalanceUseCase");
const CreatePayOSPaymentLinkUseCase_1 = require("../use-cases/CreatePayOSPaymentLinkUseCase");
const HandlePayOSWebhookUseCase_1 = require("../use-cases/HandlePayOSWebhookUseCase");
/**
 * Billing Command Handlers (Simplified)
 * 15 core handlers for academic project
 */
class BillingCommandHandlers {
    constructor(createInvoiceUseCase, processPaymentUseCase, refundPaymentUseCase, billingRepository, eventBus, logger) {
        this.createInvoiceUseCase = createInvoiceUseCase;
        this.processPaymentUseCase = processPaymentUseCase;
        this.refundPaymentUseCase = refundPaymentUseCase;
        this.billingRepository = billingRepository;
        this.eventBus = eventBus;
        this.logger = logger;
        // Initialize use cases
        this.getInvoiceUseCase = new GetInvoiceUseCase_1.GetInvoiceUseCase(billingRepository, logger);
        this.getInvoicesUseCase = new GetInvoicesUseCase_1.GetInvoicesUseCase(billingRepository, logger);
        this.finalizeInvoiceUseCase = new FinalizeInvoiceUseCase_1.FinalizeInvoiceUseCase(billingRepository, eventBus, logger);
        this.cancelInvoiceUseCase = new CancelInvoiceUseCase_1.CancelInvoiceUseCase(billingRepository, eventBus, logger);
        this.searchInvoicesUseCase = new SearchInvoicesUseCase_1.SearchInvoicesUseCase(billingRepository, logger);
        this.getOverdueInvoicesUseCase = new GetOverdueInvoicesUseCase_1.GetOverdueInvoicesUseCase(billingRepository, logger);
        this.getPatientBillingSummaryUseCase = new GetPatientBillingSummaryUseCase_1.GetPatientBillingSummaryUseCase(billingRepository, logger);
        this.processInsuranceClaimUseCase = new ProcessInsuranceClaimUseCase_1.ProcessInsuranceClaimUseCase(billingRepository, eventBus, logger);
        this.validateInsuranceUseCase = new ValidateInsuranceUseCase_1.ValidateInsuranceUseCase(logger);
        this.getRevenueReportUseCase = new GetRevenueReportUseCase_1.GetRevenueReportUseCase(billingRepository, logger);
        this.getBillingHistoryUseCase = new GetBillingHistoryUseCase_1.GetBillingHistoryUseCase(billingRepository, logger);
        this.getPatientInvoicesUseCase = new GetPatientInvoicesUseCase_1.GetPatientInvoicesUseCase(billingRepository, logger);
        this.getPatientPaymentHistoryUseCase = new GetPatientPaymentHistoryUseCase_1.GetPatientPaymentHistoryUseCase(billingRepository, logger);
        this.getPatientOutstandingBalanceUseCase = new GetPatientOutstandingBalanceUseCase_1.GetPatientOutstandingBalanceUseCase(billingRepository, logger);
        this.createPayOSPaymentLinkUseCase = new CreatePayOSPaymentLinkUseCase_1.CreatePayOSPaymentLinkUseCase(billingRepository, logger);
        this.handlePayOSWebhookUseCase = new HandlePayOSWebhookUseCase_1.HandlePayOSWebhookUseCase(billingRepository, eventBus, logger);
    }
    // =====================================================
    // INVOICE MANAGEMENT (5 handlers)
    // =====================================================
    /**
     * 1. Create invoice
     */
    async handleCreateInvoice(command) {
        try {
            this.logger.info('Handling create invoice command', {
                commandId: command.commandId,
                patientId: command.patientId,
                itemCount: command.items.length
            });
            return await this.createInvoiceUseCase.execute(command);
        }
        catch (error) {
            this.logger.error('Error handling create invoice command', { error });
            throw new Error(`Lỗi tạo hóa đơn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * 2. Get invoice by ID
     */
    async getInvoice(invoiceId) {
        try {
            return await this.getInvoiceUseCase.execute({ invoiceId });
        }
        catch (error) {
            this.logger.error('Error getting invoice', { invoiceId, error });
            throw error;
        }
    }
    /**
     * 3. Get invoices with filters
     */
    async getInvoices(filters) {
        try {
            return await this.getInvoicesUseCase.execute(filters);
        }
        catch (error) {
            this.logger.error('Error getting invoices', { filters, error });
            throw error;
        }
    }
    /**
     * 4. Finalize invoice
     */
    async finalizeInvoice(invoiceId, finalizedBy) {
        try {
            return await this.finalizeInvoiceUseCase.execute({ invoiceId, finalizedBy });
        }
        catch (error) {
            this.logger.error('Error finalizing invoice', { invoiceId, error });
            throw error;
        }
    }
    /**
     * 5. Cancel invoice
     */
    async handleCancelInvoice(command) {
        try {
            this.logger.info('Handling cancel invoice command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId
            });
            return await this.cancelInvoiceUseCase.execute({
                invoiceId: command.invoiceId,
                reason: command.reason,
                cancelledBy: command.cancelledBy
            });
        }
        catch (error) {
            this.logger.error('Error handling cancel invoice command', { error });
            return {
                success: false,
                message: `Lỗi hủy hóa đơn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
            };
        }
    }
    // =====================================================
    // PAYMENT MANAGEMENT (4 handlers)
    // =====================================================
    /**
     * 6. Process payment
     */
    async handleProcessPayment(command) {
        try {
            this.logger.info('Handling process payment command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                amount: command.amount
            });
            return await this.processPaymentUseCase.execute(command);
        }
        catch (error) {
            this.logger.error('Error handling process payment command', { error });
            throw new Error(`Lỗi xử lý thanh toán: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * 7. Process refund
     */
    async handleRefundPayment(command) {
        try {
            this.logger.info('Handling refund payment command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                refundAmount: command.refundAmount
            });
            return await this.refundPaymentUseCase.execute(command);
        }
        catch (error) {
            this.logger.error('Error handling refund payment command', { error });
            throw new Error(`Lỗi hoàn tiền: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * 8. Get patient payment history
     */
    async getPatientPaymentHistory(filters) {
        try {
            return await this.getPatientPaymentHistoryUseCase.execute(filters);
        }
        catch (error) {
            this.logger.error('Error getting patient payment history', { filters, error });
            throw error;
        }
    }
    /**
     * 9. Get patient outstanding balance
     */
    async getPatientOutstandingBalance(patientId) {
        try {
            return await this.getPatientOutstandingBalanceUseCase.execute({ patientId });
        }
        catch (error) {
            this.logger.error('Error getting patient outstanding balance', { patientId, error });
            throw error;
        }
    }
    // =====================================================
    // INSURANCE (2 handlers)
    // =====================================================
    /**
     * 10. Validate insurance
     */
    async validateInsurance(data) {
        try {
            return await this.validateInsuranceUseCase.execute(data);
        }
        catch (error) {
            this.logger.error('Error validating insurance', { data, error });
            throw error;
        }
    }
    /**
     * 11. Process insurance claim (submit/approve/reject)
     */
    async handleProcessInsuranceClaim(command) {
        try {
            this.logger.info('Handling process insurance claim command', {
                commandId: command.commandId,
                invoiceId: command.invoiceId,
                action: command.action
            });
            return await this.processInsuranceClaimUseCase.execute({
                invoiceId: command.invoiceId,
                action: command.action,
                processedBy: command.processedBy,
                approvedAmount: command.approvedAmount,
                rejectionReason: command.rejectionReason,
                notes: command.notes
            });
        }
        catch (error) {
            this.logger.error('Error handling process insurance claim command', { error });
            throw error;
        }
    }
    // =====================================================
    // PAYOS INTEGRATION (2 handlers)
    // =====================================================
    /**
     * 12. Create PayOS payment link
     */
    async createPayOSPaymentLink(data) {
        try {
            return await this.createPayOSPaymentLinkUseCase.execute(data);
        }
        catch (error) {
            this.logger.error('Error creating PayOS payment link', { data, error });
            throw error;
        }
    }
    /**
     * 13. Handle PayOS webhook
     */
    async handlePayOSWebhook(webhookData) {
        try {
            return await this.handlePayOSWebhookUseCase.execute(webhookData);
        }
        catch (error) {
            this.logger.error('Error handling PayOS webhook', { webhookData, error });
            throw error;
        }
    }
    // =====================================================
    // PATIENT BILLING (2 handlers)
    // =====================================================
    /**
     * 14. Get patient invoices
     */
    async getPatientInvoices(filters) {
        try {
            return await this.getPatientInvoicesUseCase.execute(filters);
        }
        catch (error) {
            this.logger.error('Error getting patient invoices', { filters, error });
            throw error;
        }
    }
    /**
     * 15. Get patient billing summary
     */
    async getPatientBillingSummary(patientId) {
        try {
            return await this.getPatientBillingSummaryUseCase.execute({
                patientId,
                includeHistory: true
            });
        }
        catch (error) {
            this.logger.error('Error getting patient billing summary', { patientId, error });
            throw error;
        }
    }
    // =====================================================
    // REPORTS (2 handlers)
    // =====================================================
    /**
     * 16. Get revenue report
     */
    async getRevenueReport(filters) {
        try {
            return await this.getRevenueReportUseCase.execute(filters);
        }
        catch (error) {
            this.logger.error('Error getting revenue report', { filters, error });
            throw error;
        }
    }
    /**
     * 17. Get billing history
     */
    async getBillingHistory(filters) {
        try {
            return await this.getBillingHistoryUseCase.execute(filters);
        }
        catch (error) {
            this.logger.error('Error getting billing history', { filters, error });
            throw error;
        }
    }
    // =====================================================
    // SEARCH & FILTERS (2 handlers)
    // =====================================================
    /**
     * 18. Search invoices
     */
    async searchInvoices(criteria) {
        try {
            return await this.searchInvoicesUseCase.execute(criteria);
        }
        catch (error) {
            this.logger.error('Error searching invoices', { criteria, error });
            throw error;
        }
    }
    /**
     * 19. Get overdue invoices
     */
    async getOverdueInvoices(filters) {
        try {
            return await this.getOverdueInvoicesUseCase.execute(filters);
        }
        catch (error) {
            this.logger.error('Error getting overdue invoices', { filters, error });
            throw error;
        }
    }
}
exports.BillingCommandHandlers = BillingCommandHandlers;
//# sourceMappingURL=BillingCommandHandlers.js.map