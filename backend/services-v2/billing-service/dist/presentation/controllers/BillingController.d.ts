/**
 * BillingController - Presentation Layer
 * REST API controller for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Standards, Vietnamese Healthcare
 */
import { Request, Response } from "express";
import { BillingCommandHandlers } from "../../application/commands/handlers/BillingCommandHandlers";
export interface BillingControllerDependencies {
    billingCommandHandlers: BillingCommandHandlers;
}
/**
 * BillingController
 * Handles HTTP requests for billing operations
 */
export declare class BillingController {
    private readonly commandHandlers;
    constructor(dependencies: BillingControllerDependencies);
    /**
     * Generate invoice for medical services
     * POST /api/v1/billing/invoices
     */
    generateInvoice(req: Request, res: Response): Promise<void>;
    /**
     * Process payment for invoice
     * POST /api/v1/billing/payments
     */
    processPayment(req: Request, res: Response): Promise<void>;
    /**
     * Validate insurance information
     * POST /api/v1/billing/insurance/validate
     */
    validateInsurance(req: Request, res: Response): Promise<void>;
    /**
     * Get invoice by ID
     * GET /api/v1/billing/invoices/:invoiceId
     */
    getInvoice(req: Request, res: Response): Promise<void>;
    /**
     * Get invoices by patient ID
     * GET /api/v1/billing/patients/:patientId/invoices
     */
    getInvoicesByPatient(req: Request, res: Response): Promise<void>;
    /**
     * Generate Vietnamese invoice PDF
     * GET /api/v1/billing/invoices/:invoiceId/pdf
     */
    generateInvoicePDF(req: Request, res: Response): Promise<void>;
    /**
     * Process insurance claim
     * POST /api/v1/billing/insurance/claims
     */
    processInsuranceClaim(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=BillingController.d.ts.map