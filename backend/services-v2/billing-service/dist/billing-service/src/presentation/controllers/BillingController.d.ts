/**
 * BillingController - Simplified for Academic Project
 * REST API controller for billing operations
 * Reduced to ~20 core methods
 *
 * @author Hospital Management Team
 * @version 2.0.0 (Simplified)
 * @compliance Clean Architecture, REST API Standards, Vietnamese Healthcare
 */
import { Request, Response } from "express";
import { CreateInvoiceUseCase } from "../../application/use-cases/CreateInvoiceUseCase";
import { ProcessPaymentUseCase } from "../../application/use-cases/ProcessPaymentUseCase";
import { RefundPaymentUseCase } from "../../application/use-cases/RefundPaymentUseCase";
import { GetInvoiceUseCase } from "../../application/use-cases/GetInvoiceUseCase";
import { GetInvoicesUseCase } from "../../application/use-cases/GetInvoicesUseCase";
import { FinalizeInvoiceUseCase } from "../../application/use-cases/FinalizeInvoiceUseCase";
import { CancelInvoiceUseCase } from "../../application/use-cases/CancelInvoiceUseCase";
import { SearchInvoicesUseCase } from "../../application/use-cases/SearchInvoicesUseCase";
import { GetOverdueInvoicesUseCase } from "../../application/use-cases/GetOverdueInvoicesUseCase";
import { GetBillingHistoryUseCase } from "../../application/use-cases/GetBillingHistoryUseCase";
import { GetPatientInvoicesUseCase } from "../../application/use-cases/GetPatientInvoicesUseCase";
import { GetPatientBillingSummaryUseCase } from "../../application/use-cases/GetPatientBillingSummaryUseCase";
import { GetPatientPaymentHistoryUseCase } from "../../application/use-cases/GetPatientPaymentHistoryUseCase";
import { GetPatientOutstandingBalanceUseCase } from "../../application/use-cases/GetPatientOutstandingBalanceUseCase";
import { ValidateInsuranceUseCase } from "../../application/use-cases/ValidateInsuranceUseCase";
import { ProcessInsuranceClaimUseCase } from "../../application/use-cases/ProcessInsuranceClaimUseCase";
import { CreatePayOSPaymentLinkUseCase } from "../../application/use-cases/CreatePayOSPaymentLinkUseCase";
import { HandlePayOSWebhookUseCase } from "../../application/use-cases/HandlePayOSWebhookUseCase";
import { GetRevenueReportUseCase } from "../../application/use-cases/GetRevenueReportUseCase";
import { ILogger } from "../../../../shared/infrastructure/logging/logger.interface";
export interface BillingControllerDependencies {
    createInvoiceUseCase: CreateInvoiceUseCase;
    processPaymentUseCase: ProcessPaymentUseCase;
    refundPaymentUseCase: RefundPaymentUseCase;
    getInvoiceUseCase: GetInvoiceUseCase;
    getInvoicesUseCase: GetInvoicesUseCase;
    finalizeInvoiceUseCase: FinalizeInvoiceUseCase;
    cancelInvoiceUseCase: CancelInvoiceUseCase;
    searchInvoicesUseCase: SearchInvoicesUseCase;
    getOverdueInvoicesUseCase: GetOverdueInvoicesUseCase;
    getBillingHistoryUseCase: GetBillingHistoryUseCase;
    getPatientInvoicesUseCase: GetPatientInvoicesUseCase;
    getPatientBillingSummaryUseCase: GetPatientBillingSummaryUseCase;
    getPatientPaymentHistoryUseCase: GetPatientPaymentHistoryUseCase;
    getPatientOutstandingBalanceUseCase: GetPatientOutstandingBalanceUseCase;
    validateInsuranceUseCase: ValidateInsuranceUseCase;
    processInsuranceClaimUseCase: ProcessInsuranceClaimUseCase;
    createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase;
    handlePayOSWebhookUseCase: HandlePayOSWebhookUseCase;
    getRevenueReportUseCase: GetRevenueReportUseCase;
    logger: ILogger;
}
/**
 * BillingController (Simplified)
 * 20 core methods for academic project
 */
export declare class BillingController {
    private readonly createInvoiceUseCase;
    private readonly processPaymentUseCase;
    private readonly refundPaymentUseCase;
    private readonly getInvoiceUseCase;
    private readonly getInvoicesUseCase;
    private readonly finalizeInvoiceUseCase;
    private readonly cancelInvoiceUseCase;
    private readonly searchInvoicesUseCase;
    private readonly getOverdueInvoicesUseCase;
    private readonly getBillingHistoryUseCase;
    private readonly getPatientInvoicesUseCase;
    private readonly getPatientBillingSummaryUseCase;
    private readonly getPatientPaymentHistoryUseCase;
    private readonly getPatientOutstandingBalanceUseCase;
    private readonly validateInsuranceUseCase;
    private readonly processInsuranceClaimUseCase;
    private readonly createPayOSPaymentLinkUseCase;
    private readonly handlePayOSWebhookUseCase;
    private readonly getRevenueReportUseCase;
    private readonly logger;
    constructor(dependencies: BillingControllerDependencies);
    /**
     * 1. Create invoice
     * POST /api/v1/invoices
     */
    createInvoice(req: Request, res: Response): Promise<void>;
    /**
     * 2. Get invoice by ID
     * GET /api/v1/invoices/:id
     */
    getInvoiceById(req: Request, res: Response): Promise<void>;
    /**
     * 3. Get invoices with filters
     * GET /api/v1/invoices
     */
    getInvoices(req: Request, res: Response): Promise<void>;
    /**
     * 4. Finalize invoice
     * PUT /api/v1/invoices/:id/finalize
     */
    finalizeInvoice(req: Request, res: Response): Promise<void>;
    /**
     * 5. Cancel invoice
     * PUT /api/v1/invoices/:id/cancel
     */
    cancelInvoice(req: Request, res: Response): Promise<void>;
    /**
     * 6. Process payment
     * POST /api/v1/invoices/:id/payments
     */
    processPayment(req: Request, res: Response): Promise<void>;
    /**
     * 7. Process refund
     * POST /api/v1/invoices/:id/refund
     */
    processRefund(req: Request, res: Response): Promise<void>;
    /**
     * 8. Get patient payment history
     * GET /api/v1/patients/:patientId/payment-history
     */
    getPatientPaymentHistory(req: Request, res: Response): Promise<void>;
    /**
     * 9. Get patient outstanding balance
     * GET /api/v1/patients/:patientId/outstanding-balance
     */
    getPatientOutstandingBalance(req: Request, res: Response): Promise<void>;
    /**
     * 10. Validate insurance
     * POST /api/v1/insurance/validate
     */
    validateInsurance(req: Request, res: Response): Promise<void>;
    /**
     * 11. Process insurance claim (submit/approve/reject)
     * POST /api/v1/invoices/:id/insurance-claim
     */
    processInsuranceClaim(req: Request, res: Response): Promise<void>;
    /**
     * 12. Create PayOS payment link
     * POST /api/v1/payos/create-payment-link
     */
    createPayOSPaymentLink(req: Request, res: Response): Promise<void>;
    /**
     * 13. Handle PayOS webhook
     * POST /api/v1/payos/webhook
     */
    handlePayOSWebhook(req: Request, res: Response): Promise<void>;
    /**
     * 14. Get patient invoices
     * GET /api/v1/patients/:patientId/invoices
     */
    getPatientInvoices(req: Request, res: Response): Promise<void>;
    /**
     * 15. Get patient billing summary
     * GET /api/v1/patients/:patientId/billing-summary
     */
    getPatientBillingSummary(req: Request, res: Response): Promise<void>;
    /**
     * 16. Get revenue report
     * GET /api/v1/reports/revenue
     */
    getRevenueReport(req: Request, res: Response): Promise<void>;
    /**
     * 17. Get billing history
     * GET /api/v1/reports/billing-history
     */
    getBillingHistory(req: Request, res: Response): Promise<void>;
    /**
     * 18. Search invoices
     * POST /api/v1/invoices/search
     */
    searchInvoices(req: Request, res: Response): Promise<void>;
    /**
     * 19. Get overdue invoices
     * GET /api/v1/invoices/overdue
     */
    getOverdueInvoices(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=BillingController.d.ts.map