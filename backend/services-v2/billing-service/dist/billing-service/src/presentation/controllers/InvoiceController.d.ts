import { Request, Response } from 'express';
import { CreateInvoiceUseCase } from '../../application/use-cases/CreateInvoiceUseCase';
import { GetInvoiceUseCase } from '../../application/use-cases/GetInvoiceUseCase';
import { ProcessPaymentUseCase } from '../../application/use-cases/ProcessPaymentUseCase';
import { GetPatientInvoicesUseCase } from '../../application/use-cases/GetPatientInvoicesUseCase';
import { SearchInvoicesUseCase } from '../../application/use-cases/SearchInvoicesUseCase';
import { GetOverdueInvoicesUseCase } from '../../application/use-cases/GetOverdueInvoicesUseCase';
import { GetPatientBillingSummaryUseCase } from '../../application/use-cases/GetPatientBillingSummaryUseCase';
import { GetRevenueReportUseCase } from '../../application/use-cases/GetRevenueReportUseCase';
import { CreatePayOSPaymentLinkUseCase } from '../../application/use-cases/CreatePayOSPaymentLinkUseCase';
import { HandlePayOSWebhookUseCase } from '../../application/use-cases/HandlePayOSWebhookUseCase';
import { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';
export declare class InvoiceController {
    private readonly createInvoiceUseCase;
    private readonly getInvoiceUseCase;
    private readonly processPaymentUseCase;
    private readonly getPatientInvoicesUseCase;
    private readonly searchInvoicesUseCase;
    private readonly getOverdueInvoicesUseCase;
    private readonly getPatientBillingSummaryUseCase;
    private readonly getRevenueReportUseCase;
    private readonly createPayOSPaymentLinkUseCase;
    private readonly handlePayOSWebhookUseCase;
    constructor(createInvoiceUseCase: CreateInvoiceUseCase, getInvoiceUseCase: GetInvoiceUseCase, processPaymentUseCase: ProcessPaymentUseCase, getPatientInvoicesUseCase: GetPatientInvoicesUseCase, searchInvoicesUseCase: SearchInvoicesUseCase, getOverdueInvoicesUseCase: GetOverdueInvoicesUseCase, getPatientBillingSummaryUseCase: GetPatientBillingSummaryUseCase, getRevenueReportUseCase: GetRevenueReportUseCase, createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase, handlePayOSWebhookUseCase: HandlePayOSWebhookUseCase);
    createInvoice: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getInvoice: (req: Request, res: Response) => Promise<void>;
    processPayment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getPatientInvoices: (req: Request, res: Response) => Promise<void>;
    searchInvoices: (req: Request, res: Response) => Promise<void>;
    getOverdueInvoices: (req: Request, res: Response) => Promise<void>;
    getPatientBillingSummary: (req: Request, res: Response) => Promise<void>;
    getRevenueReport: (req: Request, res: Response) => Promise<void>;
    createPayOSPaymentLink: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    handlePayOSWebhook: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=InvoiceController.d.ts.map