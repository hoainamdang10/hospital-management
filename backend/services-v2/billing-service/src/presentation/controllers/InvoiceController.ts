import { Request, Response } from 'express';
import { CreateInvoiceUseCase } from '../../application/use-cases/CreateInvoiceUseCase';
import { GetInvoiceUseCase } from '../../application/use-cases/GetInvoiceUseCase';
import { FinalizeInvoiceUseCase } from '../../application/use-cases/FinalizeInvoiceUseCase';
import { CancelInvoiceUseCase } from '../../application/use-cases/CancelInvoiceUseCase';
import { ProcessPaymentUseCase } from '../../application/use-cases/ProcessPaymentUseCase';
import { GetPatientInvoicesUseCase } from '../../application/use-cases/GetPatientInvoicesUseCase';
import { ProcessInsuranceClaimUseCase } from '../../application/use-cases/ProcessInsuranceClaimUseCase';
import { RefundPaymentUseCase } from '../../application/use-cases/RefundPaymentUseCase';
import { SearchInvoicesUseCase } from '../../application/use-cases/SearchInvoicesUseCase';
import { GetOverdueInvoicesUseCase } from '../../application/use-cases/GetOverdueInvoicesUseCase';
import { GetPatientBillingSummaryUseCase } from '../../application/use-cases/GetPatientBillingSummaryUseCase';
import { GetRevenueReportUseCase } from '../../application/use-cases/GetRevenueReportUseCase';
import { CreatePayOSPaymentLinkUseCase } from '../../application/use-cases/CreatePayOSPaymentLinkUseCase';
import { HandlePayOSWebhookUseCase } from '../../application/use-cases/HandlePayOSWebhookUseCase';
import { SendInvoiceEmailUseCase } from '../../application/use-cases/SendInvoiceEmailUseCase';
import { CreatePaymentReminderUseCase } from '../../application/use-cases/CreatePaymentReminderUseCase';
import { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';

export class InvoiceController {
  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly getInvoiceUseCase: GetInvoiceUseCase,
    private readonly finalizeInvoiceUseCase: FinalizeInvoiceUseCase,
    private readonly cancelInvoiceUseCase: CancelInvoiceUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly getPatientInvoicesUseCase: GetPatientInvoicesUseCase,
    private readonly processInsuranceClaimUseCase: ProcessInsuranceClaimUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly searchInvoicesUseCase: SearchInvoicesUseCase,
    private readonly getOverdueInvoicesUseCase: GetOverdueInvoicesUseCase,
    private readonly getPatientBillingSummaryUseCase: GetPatientBillingSummaryUseCase,
    private readonly getRevenueReportUseCase: GetRevenueReportUseCase,
    private readonly createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase,
    private readonly handlePayOSWebhookUseCase: HandlePayOSWebhookUseCase,
    private readonly sendInvoiceEmailUseCase: SendInvoiceEmailUseCase,
    private readonly createPaymentReminderUseCase: CreatePaymentReminderUseCase
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

  public finalizeInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.finalizeInvoiceUseCase.execute({ invoiceId: req.params.id });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public cancelInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reason } = req.body;
      const result = await this.cancelInvoiceUseCase.execute({ 
        invoiceId: req.params.id, 
        reason 
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

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

  public processInsuranceClaim = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.processInsuranceClaimUseCase.execute({ 
        invoiceId: req.params.id 
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public refundPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { paymentId, reason } = req.body;
      const result = await this.refundPaymentUseCase.execute({
        invoiceId: req.params.id,
        paymentId,
        reason
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

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

  public sendInvoiceEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.sendInvoiceEmailUseCase.execute({
        invoiceId: req.params.id,
        recipientEmail: req.body.recipientEmail
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public createPaymentReminder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.createPaymentReminderUseCase.execute({
        invoiceId: req.params.id,
        reminderDays: req.body.reminderDays
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
