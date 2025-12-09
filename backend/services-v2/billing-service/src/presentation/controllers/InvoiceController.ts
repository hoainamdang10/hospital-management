import { Request, Response } from "express";
import { CreateInvoiceUseCase } from "../../application/use-cases/CreateInvoiceUseCase";
import { GetInvoiceUseCase } from "../../application/use-cases/GetInvoiceUseCase";
// REMOVED (Phase 1 Out-of-Scope): FinalizeInvoiceUseCase, CancelInvoiceUseCase
import { ProcessPaymentUseCase } from "../../application/use-cases/ProcessPaymentUseCase";
import { GetPatientInvoicesUseCase } from "../../application/use-cases/GetPatientInvoicesUseCase";
import { GetInvoicesByAppointmentUseCase } from "../../application/use-cases/GetInvoicesByAppointmentUseCase";
// REMOVED (Phase 1 Out-of-Scope): ProcessInsuranceClaimUseCase, RefundPaymentUseCase
import { SearchInvoicesUseCase } from "../../application/use-cases/SearchInvoicesUseCase";
import { GetOverdueInvoicesUseCase } from "../../application/use-cases/GetOverdueInvoicesUseCase";
import { GetPatientBillingSummaryUseCase } from "../../application/use-cases/GetPatientBillingSummaryUseCase";
import { GetRevenueReportUseCase } from "../../application/use-cases/GetRevenueReportUseCase";
import { CreatePayOSPaymentLinkUseCase } from "../../application/use-cases/CreatePayOSPaymentLinkUseCase";
import { HandlePayOSWebhookUseCase } from "../../application/use-cases/HandlePayOSWebhookUseCase";
import { PayInvoiceWithWalletUseCase } from "../../application/use-cases/PayInvoiceWithWalletUseCase";
// REMOVED: SendInvoiceEmailUseCase, CreatePaymentReminderUseCase - Out of scope for Phase 1
import { AuthenticatedRequest } from "../middleware/AuthenticationMiddleware";
import { SupabasePatientRepository } from "../../infrastructure/repositories/SupabasePatientRepository";
import { OptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";
import { logger } from "@infrastructure/logging/logger";

export class InvoiceController {
  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly getInvoiceUseCase: GetInvoiceUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly getPatientInvoicesUseCase: GetPatientInvoicesUseCase,
    private readonly getInvoicesByAppointmentUseCase: GetInvoicesByAppointmentUseCase,
    private readonly searchInvoicesUseCase: SearchInvoicesUseCase,
    private readonly getOverdueInvoicesUseCase: GetOverdueInvoicesUseCase,
    private readonly getPatientBillingSummaryUseCase: GetPatientBillingSummaryUseCase,
    private readonly getRevenueReportUseCase: GetRevenueReportUseCase,
    private readonly createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase,
    private readonly handlePayOSWebhookUseCase: HandlePayOSWebhookUseCase,
    private readonly payInvoiceWithWalletUseCase: PayInvoiceWithWalletUseCase,
    private readonly patientRepository?: SupabasePatientRepository,
    // REMOVED (Phase 1 Out-of-Scope): finalizeInvoiceUseCase, cancelInvoiceUseCase, processInsuranceClaimUseCase, refundPaymentUseCase, sendInvoiceEmailUseCase, createPaymentReminderUseCase
  ) {}

  public createInvoice = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const payload = { ...req.body };

      // Fallback: nếu không có insurance input thì tự fetch từ patient
      if (
        !payload.insurance &&
        !payload.insuranceCoverageAmount &&
        payload.patientId
      ) {
        try {
          if (this.patientRepository) {
            const patient = await this.patientRepository.findById(
              payload.patientId,
            );
            if (patient?.insuranceInfo) {
              payload.insurance = {
                provider:
                  patient.insuranceInfo.provider ||
                  patient.insuranceInfo.providerName,
                policyNumber: patient.insuranceInfo.policyNumber,
                coveragePercentage:
                  patient.insuranceInfo.coveragePercentage ||
                  patient.insuranceInfo.coverage?.consultationCoverage ||
                  80,
              };
              const coveragePct = payload.insurance.coveragePercentage || 0;
              // Nếu có đơn giá line item, tính sơ bộ coverageAmount
              if (payload.items?.[0]?.unitPrice && coveragePct > 0) {
                payload.insuranceCoverageAmount = Math.round(
                  payload.items[0].unitPrice * (coveragePct / 100),
                );
              }
            }
          } else {
            logger.warn(
              "Patient repository not available for insurance fallback",
              {
                patientId: payload.patientId,
              },
            );
          }
        } catch (err) {
          logger.warn(
            "Failed to fetch insurance info in createInvoice fallback",
            {
              patientId: payload.patientId,
              error: err instanceof Error ? err.message : "Unknown error",
            },
          );
        }
      }

      const result = await this.createInvoiceUseCase.execute(payload);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.getInvoiceUseCase.execute({
        invoiceId: req.params.id,
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  // REMOVED (Phase 1 Out-of-Scope): finalizeInvoice(), cancelInvoice() methods

  public processPayment = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { amount, method, transactionId } = req.body;
      const result = await this.processPaymentUseCase.execute({
        invoiceId: req.params.id,
        amount,
        method,
        transactionId,
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public payWithWallet = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.payInvoiceWithWalletUseCase.execute({
        invoiceId: req.params.id,
        patientId: req.authenticatedUser?.patientId,
        initiatedBy: req.authenticatedUser?.userId,
        description: req.body?.description,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getPatientInvoices = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.getPatientInvoicesUseCase.execute({
        patientId: req.params.patientId,
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getInvoicesByAppointment = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.getInvoicesByAppointmentUseCase.execute({
        appointmentId: req.params.appointmentId,
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // REMOVED (Phase 1 Out-of-Scope): processInsuranceClaim(), refundPayment() methods

  public searchInvoices = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.searchInvoicesUseCase.execute(req.query as any);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getOverdueInvoices = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.getOverdueInvoicesUseCase.execute(
        req.query as any,
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getPatientBillingSummary = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.getPatientBillingSummaryUseCase.execute({
        patientId: req.params.patientId,
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getRevenueReport = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { fromDate, toDate, groupBy } = req.query;
      const result = await this.getRevenueReportUseCase.execute({
        fromDate: new Date(fromDate as string),
        toDate: new Date(toDate as string),
        groupBy: groupBy as any,
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public createPayOSPaymentLink = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.createPayOSPaymentLinkUseCase.execute({
        invoiceId: req.params.id,
        ...req.body,
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public handlePayOSWebhook = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const payloadSource =
        Object.keys(req.body || {}).length > 0 ? req.body : req.query;
      const rawPayload = { ...payloadSource };
      const signatureHeader = (req.headers["x-payos-signature"] ||
        req.headers["x-vnpay-signature"]) as string | undefined;
      const payloadSignature =
        (rawPayload["vnp_SecureHash"] as string | undefined) ||
        signatureHeader ||
        (rawPayload["signature"] as string | undefined);

      // LOG RAW WEBHOOK DATA FOR DEBUGGING
      console.log("\n========================================");
      console.log("VNPAY WEBHOOK RAW DATA (Production Endpoint)");
      console.log("========================================");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Method:", req.method);
      console.log("\nHeaders:");
      console.log(JSON.stringify(req.headers, null, 2));
      console.log("\nQuery Parameters:");
      console.log(JSON.stringify(req.query, null, 2));
      console.log("\nBody:");
      console.log(JSON.stringify(req.body, null, 2));
      console.log("\nExtracted Signature:");
      console.log(payloadSignature);

      // Build query string for signature verification
      const params = { ...rawPayload };
      delete params.vnp_SecureHash;
      delete params.vnp_SecureHashType;
      const sortedKeys = Object.keys(params).sort();
      const queryString = sortedKeys
        .map((key) => `${key}=${params[key]}`)
        .join("&");
      console.log(
        "\nQuery String for Signature (sorted, excluding vnp_SecureHash & vnp_SecureHashType):",
      );
      console.log(queryString);
      console.log("========================================\n");

      const normalizedPayload =
        this.normalizeWebhookPayload(rawPayload) || rawPayload;

      const result = await this.handlePayOSWebhookUseCase.execute({
        webhookData: normalizedPayload,
        signature: payloadSignature,
        rawPayload,
      });
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Webhook processing error:", error.message);
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Test endpoint to log raw VNPAY webhook data
   * This helps debug signature verification issues
   */
  public logRawWebhookData = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const timestamp = new Date().toISOString();
      const method = req.method;
      const headers = req.headers;
      const query = req.query;
      const body = req.body;

      // Log everything
      console.log("\n========================================");
      console.log("VNPAY WEBHOOK RAW DATA");
      console.log("========================================");
      console.log("Timestamp:", timestamp);
      console.log("Method:", method);
      console.log("\nHeaders:");
      console.log(JSON.stringify(headers, null, 2));
      console.log("\nQuery Parameters:");
      console.log(JSON.stringify(query, null, 2));
      console.log("\nBody:");
      console.log(JSON.stringify(body, null, 2));
      console.log("\nQuery String (raw):");
      console.log(req.url);

      // Extract signature
      const vnpSecureHash = query.vnp_SecureHash || body.vnp_SecureHash;
      console.log("\nExtracted Signature:");
      console.log(vnpSecureHash);

      // Build query string for signature verification (excluding vnp_SecureHash and vnp_SecureHashType)
      const params = { ...query, ...body };
      delete params.vnp_SecureHash;
      delete params.vnp_SecureHashType;

      const sortedKeys = Object.keys(params).sort();
      const queryString = sortedKeys
        .map((key) => `${key}=${params[key]}`)
        .join("&");

      console.log(
        "\nQuery String for Signature (sorted, excluding vnp_SecureHash):",
      );
      console.log(queryString);

      console.log("========================================\n");

      res.status(200).json({
        success: true,
        message: "Webhook data logged successfully",
        timestamp,
        method,
        hasQuery: Object.keys(query).length > 0,
        hasBody: Object.keys(body).length > 0,
        signature: vnpSecureHash,
        queryString,
      });
    } catch (error: any) {
      console.error("Error logging webhook data:", error);
      res.status(500).json({ error: error.message });
    }
  };

  private normalizeWebhookPayload(payload: any) {
    if (payload?.vnp_TxnRef) {
      const amount =
        payload.vnp_Amount !== undefined ? Number(payload.vnp_Amount) / 100 : 0;
      return {
        orderCode: Number(payload.vnp_TxnRef),
        amount,
        description: payload.vnp_OrderInfo || "",
        reference: payload.vnp_TransactionNo || "",
        transactionDateTime: payload.vnp_PayDate || new Date().toISOString(),
        currency: payload.vnp_CurrCode || "VND",
        code: payload.vnp_ResponseCode || payload.vnp_TransactionStatus || "",
        desc: payload.vnp_Message || "",
        bankCode: payload.vnp_BankCode,
        bankTranNo: payload.vnp_BankTranNo,
      };
    }
    return payload;
  }

  // REMOVED: sendInvoiceEmail, createPaymentReminder methods - Out of scope for Phase 1
}
