/**
 * BillingController - Presentation Layer
 * REST API controller for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Standards, Vietnamese Healthcare
 */

import { Request, Response } from "express";
import { CreateInvoiceUseCase } from "../../application/use-cases/CreateInvoiceUseCase";
import { ProcessPaymentUseCase } from "../../application/use-cases/ProcessPaymentUseCase";
import { RefundPaymentUseCase } from "../../application/use-cases/RefundPaymentUseCase";
import { GetInvoiceUseCase } from "../../application/use-cases/GetInvoiceUseCase";
import { GetBillingHistoryUseCase } from "../../application/use-cases/GetBillingHistoryUseCase";
import { GetPatientOutstandingBalanceUseCase } from "../../application/use-cases/GetPatientOutstandingBalanceUseCase";
import { DownloadInvoiceUseCase } from "../../application/use-cases/DownloadInvoiceUseCase";
import { ILogger } from "../../../../shared/infrastructure/logging/logger.interface";

export interface BillingControllerDependencies {
  createInvoiceUseCase: CreateInvoiceUseCase;
  processPaymentUseCase: ProcessPaymentUseCase;
  refundPaymentUseCase: RefundPaymentUseCase;
  getInvoiceUseCase: GetInvoiceUseCase;
  getBillingHistoryUseCase: GetBillingHistoryUseCase;
  getPatientOutstandingBalanceUseCase: GetPatientOutstandingBalanceUseCase;
  downloadInvoiceUseCase: DownloadInvoiceUseCase;
  logger: ILogger;
}

/**
 * BillingController
 * Handles HTTP requests for billing operations
 * Direct UseCase invocation (Clean Architecture)
 */
export class BillingController {
  private readonly createInvoiceUseCase: CreateInvoiceUseCase;
  private readonly processPaymentUseCase: ProcessPaymentUseCase;
  private readonly refundPaymentUseCase: RefundPaymentUseCase;
  private readonly getInvoiceUseCase: GetInvoiceUseCase;
  private readonly getBillingHistoryUseCase: GetBillingHistoryUseCase;
  private readonly getPatientOutstandingBalanceUseCase: GetPatientOutstandingBalanceUseCase;
  private readonly downloadInvoiceUseCase: DownloadInvoiceUseCase;
  private readonly logger: ILogger;

  constructor(dependencies: BillingControllerDependencies) {
    this.createInvoiceUseCase = dependencies.createInvoiceUseCase;
    this.processPaymentUseCase = dependencies.processPaymentUseCase;
    this.refundPaymentUseCase = dependencies.refundPaymentUseCase;
    this.getInvoiceUseCase = dependencies.getInvoiceUseCase;
    this.getBillingHistoryUseCase = dependencies.getBillingHistoryUseCase;
    this.getPatientOutstandingBalanceUseCase = dependencies.getPatientOutstandingBalanceUseCase;
    this.downloadInvoiceUseCase = dependencies.downloadInvoiceUseCase;
    this.logger = dependencies.logger;
  }

  /**
   * Create invoice for medical services
   * POST /api/v1/billing/invoices
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const {
        patientId,
        doctorId,
        medicalRecordId,
        appointmentId,
        items,
        insurance,
        notes,
        issuedBy
      } = req.body;

      // Validate required fields
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

      // Execute use case
      const result = await this.createInvoiceUseCase.execute({
        patientId,
        doctorId: doctorId || '',
        medicalRecordId,
        appointmentId,
        items: items.map((item: any) => ({
          description: item.description || item.serviceName,
          vietnameseDescription: item.vietnameseDescription || item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          category: item.category,
          taxable: item.taxable !== false,
          insuranceCoverable: item.insuranceCoverable !== false,
          serviceCode: item.serviceCode
        })),
        insurance: insurance ? {
          type: insurance.type,
          number: insurance.number || insurance.cardNumber || insurance.policyNumber,
          validFrom: insurance.validFrom ? new Date(insurance.validFrom) : undefined,
          validUntil: insurance.validUntil || insurance.validTo ? new Date(insurance.validUntil || insurance.validTo) : undefined,
          beneficiaryName: insurance.beneficiaryName,
          region: insurance.region,
          coverageLevel: insurance.coverageLevel || insurance.coveragePercentage
        } : undefined,
        notes,
        issuedBy
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Return success response
      res.status(201).json(result);
    } catch (error) {
      this.logger.error('Error creating invoice', { error });
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi tạo hóa đơn",
        errors: [{ field: 'system', message: error instanceof Error ? error.message : 'Unknown error' }]
      });
    }
  }

  /**
   * Process payment for invoice
   * POST /api/v1/billing/payments
   */
  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const {
        invoiceId,
        paymentMethod,
        amount,
        currency = "VND",
        processedBy,
        transactionId,
        notes
      } = req.body;

      // Validate required fields
      if (!invoiceId || !paymentMethod || !amount || !processedBy) {
        res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc",
          errors: [
            !invoiceId && { field: 'invoiceId', message: 'Mã hóa đơn không được để trống' },
            !paymentMethod && { field: 'paymentMethod', message: 'Phương thức thanh toán không được để trống' },
            !amount && { field: 'amount', message: 'Số tiền thanh toán không được để trống' },
            !processedBy && { field: 'processedBy', message: 'Người xử lý không được để trống' }
          ].filter(Boolean)
        });
        return;
      }

      // Execute use case
      const result = await this.processPaymentUseCase.execute({
        invoiceId,
        amount,
        currency,
        paymentMethod,
        transactionId,
        notes,
        processedBy
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error processing payment', { error });
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi xử lý thanh toán",
        errors: [{ field: 'system', message: error instanceof Error ? error.message : 'Unknown error' }]
      });
    }
  }

  /**
   * Get invoice by ID
   * GET /api/v1/billing/invoices/:id
   */
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.getInvoiceUseCase.execute({ invoiceId: id });

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error getting invoice', { error });
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy hóa đơn"
      });
    }
  }

  /**
   * Get billing history
   * GET /api/v1/billing/history
   */
  async getBillingHistory(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, doctorId, dateFrom, dateTo, status, page, pageSize } = req.query;

      const result = await this.getBillingHistoryUseCase.execute({
        patientId: patientId as string,
        doctorId: doctorId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        status: status as any,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20
      });

      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error getting billing history', { error });
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy lịch sử thanh toán"
      });
    }
  }

  /**
   * Get patient outstanding balance
   * GET /api/v1/billing/patients/:patientId/outstanding
   */
  async getPatientOutstandingBalance(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      const result = await this.getPatientOutstandingBalanceUseCase.execute({ patientId });

      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error getting patient outstanding balance', { error });
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy số dư nợ"
      });
    }
  }

  /**
   * Download invoice
   * GET /api/v1/billing/invoices/:id/download
   */
  async downloadInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { format = 'pdf', language = 'vi' } = req.query;

      const result = await this.downloadInvoiceUseCase.execute({
        invoiceId: id,
        format: format as 'pdf' | 'html',
        language: language as 'vi' | 'en'
      });

      if (!result.success || !result.data) {
        res.status(404).json(result);
        return;
      }

      // Set headers for file download
      const contentType = format === 'pdf' ? 'application/pdf' : 'text/html';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.${format}"`);
      res.send(result.data.fileContent);
    } catch (error) {
      this.logger.error('Error downloading invoice', { error });
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi tải hóa đơn"
      });
    }
  }

  /**
   * Refund payment
   * POST /api/v1/billing/refunds
   */
  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId, refundAmount, refundReason, refundMethod, refundedBy } = req.body;

      if (!invoiceId || !refundAmount || !refundReason || !refundedBy) {
        res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc",
          errors: [
            !invoiceId && { field: 'invoiceId', message: 'Mã hóa đơn không được để trống' },
            !refundAmount && { field: 'refundAmount', message: 'Số tiền hoàn không được để trống' },
            !refundReason && { field: 'refundReason', message: 'Lý do hoàn tiền không được để trống' },
            !refundedBy && { field: 'refundedBy', message: 'Người xử lý không được để trống' }
          ].filter(Boolean)
        });
        return;
      }

      const result = await this.refundPaymentUseCase.execute({
        invoiceId,
        refundAmount,
        refundReason,
        refundMethod,
        refundedBy
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error refunding payment', { error });
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi hoàn tiền"
      });
    }
  }
}
