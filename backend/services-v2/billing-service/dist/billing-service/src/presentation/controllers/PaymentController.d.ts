/**
 * Payment Controller
 * Handles payment operations with PayOS
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { Request, Response } from 'express';
import { PayOSService } from '../../infrastructure/payment/PayOSService';
export declare class PaymentController {
    private payosService;
    constructor(payosService: PayOSService);
    /**
     * Create payment link for invoice
     * POST /api/v1/billing/payments/create
     */
    createPayment(req: Request, res: Response): Promise<void>;
    /**
     * Get payment information
     * GET /api/v1/billing/payments/:orderId
     */
    getPaymentInfo(req: Request, res: Response): Promise<void>;
    /**
     * Cancel payment
     * POST /api/v1/billing/payments/:orderCode/cancel
     */
    cancelPayment(req: Request, res: Response): Promise<void>;
    /**
     * Webhook endpoint to receive payment results from PayOS
     * POST /api/v1/billing/payments/webhook
     */
    handleWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Confirm webhook URL (one-time setup)
     * POST /api/v1/billing/payments/webhook/confirm
     */
    confirmWebhook(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=PaymentController.d.ts.map