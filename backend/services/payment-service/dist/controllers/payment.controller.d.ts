import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class PaymentController {
    private payOSService;
    private paymentRepository;
    constructor();
    createPayOSPayment(req: AuthenticatedRequest, res: Response): Promise<void>;
    createCashPayment(req: AuthenticatedRequest, res: Response): Promise<void>;
    verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPaymentHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPaymentReceipt(req: AuthenticatedRequest, res: Response): Promise<void>;
    cancelPayment(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=payment.controller.d.ts.map