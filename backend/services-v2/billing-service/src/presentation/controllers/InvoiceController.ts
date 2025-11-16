import { Request, Response } from 'express';
import { CreateInvoiceUseCase } from '../../application/use-cases/CreateInvoiceUseCase';
import { GetInvoiceUseCase } from '../../application/use-cases/GetInvoiceUseCase';
// REMOVED (Phase 1 Out-of-Scope): FinalizeInvoiceUseCase, CancelInvoiceUseCase
import { ProcessPaymentUseCase } from '../../application/use-cases/ProcessPaymentUseCase';
import { GetPatientInvoicesUseCase } from '../../application/use-cases/GetPatientInvoicesUseCase';
// REMOVED (Phase 1 Out-of-Scope): ProcessInsuranceClaimUseCase, RefundPaymentUseCase
import { SearchInvoicesUseCase } from '../../application/use-cases/SearchInvoicesUseCase';
import { GetOverdueInvoicesUseCase } from '../../application/use-cases/GetOverdueInvoicesUseCase';
import { GetPatientBillingSummaryUseCase } from '../../application/use-cases/GetPatientBillingSummaryUseCase';
import { GetRevenueReportUseCase } from '../../application/use-cases/GetRevenueReportUseCase';
import { CreatePayOSPaymentLinkUseCase } from '../../application/use-cases/CreatePayOSPaymentLinkUseCase';
import { HandlePayOSWebhookUseCase } from '../../application/use-cases/HandlePayOSWebhookUseCase';
// REMOVED: SendInvoiceEmailUseCase, CreatePaymentReminderUseCase - Out of scope for Phase 1
import { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';

export class InvoiceController {
  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly getInvoiceUseCase: GetInvoiceUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly getPatientInvoicesUseCase: GetPatientInvoicesUseCase,
    private readonly searchInvoicesUseCase: SearchInvoicesUseCase,
    private readonly getOverdueInvoicesUseCase: GetOverdueInvoicesUseCase,
    private readonly getPatientBillingSummaryUseCase: GetPatientBillingSummaryUseCase,
    private readonly getRevenueReportUseCase: GetRevenueReportUseCase,
    private readonly createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase,
    private readonly handlePayOSWebhookUseCase: HandlePayOSWebhookUseCase
    // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase, processInsuranceClaimUseCase, refundPaymentUseCase, sendInvoiceEmailUseCase, createPaymentReminderUseCase
  ) {}

  public createInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.createInvoiceUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.getInvoiceUseCase.execute({ invoiceId: req.params.id });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  // REMOVED (Phase 1 Out-of-Scope): finalizeInvoice(), cancelInvoice() methods

  public processPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { amount, method, transactionId } = req.body;
      const result = await this.processPaymentUseCase.execute({
        invoiceId: req.params.id,
        amount,
        method,
        transactionId
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getPatientInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.getPatientInvoicesUseCase.execute({ 
        patientId: req.params.patientId 
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // REMOVED (Phase 1 Out-of-Scope): processInsuranceClaim(), refundPayment() methods

  public searchInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.searchInvoicesUseCase.execute(req.query as any);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getOverdueInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.getOverdueInvoicesUseCase.execute(req.query as any);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getPatientBillingSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.getPatientBillingSummaryUseCase.execute({ 
        patientId: req.params.patientId 
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getRevenueReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromDate, toDate, groupBy } = req.query;
      const result = await this.getRevenueReportUseCase.execute({
        fromDate: new Date(fromDate as string),
        toDate: new Date(toDate as string),
        groupBy: groupBy as any
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public createPayOSPaymentLink = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.createPayOSPaymentLinkUseCase.execute({
        invoiceId: req.params.id,
        ...req.body
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public handlePayOSWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['x-payos-signature'] as string;
      const result = await this.handlePayOSWebhookUseCase.execute({
        webhookData: req.body,
        signature
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // REMOVED: sendInvoiceEmail, createPaymentReminder methods - Out of scope for Phase 1
}
