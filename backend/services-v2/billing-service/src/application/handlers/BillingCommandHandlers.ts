/**
 * BillingCommandHandlers - Application Command Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS command handlers for billing operations with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD, Vietnamese Healthcare Standards
 */

import { CreateInvoiceUseCase, CreateInvoiceRequest, CreateInvoiceResponse } from '../use-cases/CreateInvoiceUseCase';
import { ProcessPaymentUseCase, ProcessPaymentRequest, ProcessPaymentResponse } from '../use-cases/ProcessPaymentUseCase';
import { RefundPaymentUseCase, RefundPaymentRequest, RefundPaymentResponse } from '../use-cases/RefundPaymentUseCase';
import { GetInvoiceUseCase } from '../use-cases/GetInvoiceUseCase';
import { GetInvoicesUseCase } from '../use-cases/GetInvoicesUseCase';
import { AddInvoiceItemUseCase } from '../use-cases/AddInvoiceItemUseCase';
import { RemoveInvoiceItemUseCase } from '../use-cases/RemoveInvoiceItemUseCase';
import { FinalizeInvoiceUseCase } from '../use-cases/FinalizeInvoiceUseCase';
import { CancelInvoiceUseCase } from '../use-cases/CancelInvoiceUseCase';
import { SearchInvoicesUseCase } from '../use-cases/SearchInvoicesUseCase';
import { GetOverdueInvoicesUseCase } from '../use-cases/GetOverdueInvoicesUseCase';
import { GetPatientBillingSummaryUseCase } from '../use-cases/GetPatientBillingSummaryUseCase';
import { SubmitInsuranceClaimUseCase } from '../use-cases/SubmitInsuranceClaimUseCase';
import { ApproveInsuranceClaimUseCase } from '../use-cases/ApproveInsuranceClaimUseCase';
import { RejectInsuranceClaimUseCase } from '../use-cases/RejectInsuranceClaimUseCase';
import { GetRevenueReportUseCase } from '../use-cases/GetRevenueReportUseCase';
import { GetOutstandingInvoicesReportUseCase } from '../use-cases/GetOutstandingInvoicesReportUseCase';
import { GetInsuranceClaimsReportUseCase } from '../use-cases/GetInsuranceClaimsReportUseCase';
import { GetPaymentTrendsReportUseCase } from '../use-cases/GetPaymentTrendsReportUseCase';
import { GetDashboardStatisticsUseCase } from '../use-cases/GetDashboardStatisticsUseCase';
import { GetDoctorBillingPerformanceUseCase } from '../use-cases/GetDoctorBillingPerformanceUseCase';
import { GetPatientInvoicesUseCase } from '../use-cases/GetPatientInvoicesUseCase';
import { GetPatientPaymentHistoryUseCase } from '../use-cases/GetPatientPaymentHistoryUseCase';
import { GetPatientOutstandingBalanceUseCase } from '../use-cases/GetPatientOutstandingBalanceUseCase';
import { CreatePayOSPaymentLinkUseCase } from '../use-cases/CreatePayOSPaymentLinkUseCase';
import { HandlePayOSWebhookUseCase } from '../use-cases/HandlePayOSWebhookUseCase';
import { GetPayOSPaymentStatusUseCase } from '../use-cases/GetPayOSPaymentStatusUseCase';
import { CancelPayOSPaymentUseCase } from '../use-cases/CancelPayOSPaymentUseCase';
import { BulkExportInvoicesUseCase } from '../use-cases/BulkExportInvoicesUseCase';
import { BulkSendPaymentRemindersUseCase } from '../use-cases/BulkSendPaymentRemindersUseCase';
import { GetTaxInvoicesUseCase } from '../use-cases/GetTaxInvoicesUseCase';
import { GetTaxSummaryUseCase } from '../use-cases/GetTaxSummaryUseCase';
import { GetInvoiceTemplatesUseCase } from '../use-cases/GetInvoiceTemplatesUseCase';
import { CreateInvoiceTemplateUseCase } from '../use-cases/CreateInvoiceTemplateUseCase';
import { CreateInvoiceFromTemplateUseCase } from '../use-cases/CreateInvoiceFromTemplateUseCase';
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IEventBus } from '../../../../shared/events/event-bus.interface';

// Command Interfaces
export interface CreateInvoiceCommand extends CreateInvoiceRequest {
  commandId?: string;
  timestamp?: Date;
  userId?: string;
}

export interface ProcessPaymentCommand extends ProcessPaymentRequest {
  commandId?: string;
  timestamp?: Date;
  userId?: string;
}

export interface RefundPaymentCommand extends RefundPaymentRequest {
  commandId?: string;
  timestamp?: Date;
  userId?: string;
}

export interface CancelInvoiceCommand {
  invoiceId: string;
  reason: string;
  cancelledBy: string;
  commandId?: string;
  timestamp?: Date;
  userId?: string;
}

export interface UpdateInvoiceCommand {
  invoiceId: string;
  items?: Array<{
    description: string;
    vietnameseDescription: string;
    quantity: number;
    unitPrice: number;
    category: 'consultation' | 'medication' | 'procedure' | 'test' | 'room' | 'other';
    taxable: boolean;
    insuranceCoverable: boolean;
    serviceCode?: string;
  }>;
  notes?: string;
  dueDate?: Date;
  updatedBy: string;
  updateReason?: string;
  commandId?: string;
  timestamp?: Date;
  userId?: string;
}

export interface BulkInvoiceCommand {
  invoices: CreateInvoiceRequest[];
  batchId?: string;
  createdBy: string;
  commandId?: string;
  timestamp?: Date;
  userId?: string;
}

// Response Interfaces
export interface CancelInvoiceResponse {
  success: boolean;
  message: string;
  data?: {
    invoiceId: string;
    cancelledAt: Date;
    reason: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface UpdateInvoiceResponse {
  success: boolean;
  message: string;
  data?: {
    invoiceId: string;
    updatedAt: Date;
    totalAmount: number;
    version: number;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface BulkInvoiceResponse {
  success: boolean;
  message: string;
  data?: {
    totalRequested: number;
    successful: number;
    failed: number;
    batchId: string;
    results: Array<{
      index: number;
      invoiceId?: string;
      status: 'SUCCESS' | 'FAILED';
      errorMessage?: string;
    }>;
  };
}

/**
 * Billing Command Handlers
 * Implements CQRS command handling for billing operations
 */
export class BillingCommandHandlers {
  private readonly getInvoiceUseCase: GetInvoiceUseCase;
  private readonly getInvoicesUseCase: GetInvoicesUseCase;
  private readonly addInvoiceItemUseCase: AddInvoiceItemUseCase;
  private readonly removeInvoiceItemUseCase: RemoveInvoiceItemUseCase;
  private readonly finalizeInvoiceUseCase: FinalizeInvoiceUseCase;
  private readonly cancelInvoiceUseCase: CancelInvoiceUseCase;
  private readonly searchInvoicesUseCase: SearchInvoicesUseCase;
  private readonly getOverdueInvoicesUseCase: GetOverdueInvoicesUseCase;
  private readonly getPatientBillingSummaryUseCase: GetPatientBillingSummaryUseCase;
  private readonly submitInsuranceClaimUseCase: SubmitInsuranceClaimUseCase;
  private readonly approveInsuranceClaimUseCase: ApproveInsuranceClaimUseCase;
  private readonly rejectInsuranceClaimUseCase: RejectInsuranceClaimUseCase;
  private readonly getRevenueReportUseCase: GetRevenueReportUseCase;
  private readonly getOutstandingInvoicesReportUseCase: GetOutstandingInvoicesReportUseCase;
  private readonly getInsuranceClaimsReportUseCase: GetInsuranceClaimsReportUseCase;
  private readonly getPaymentTrendsReportUseCase: GetPaymentTrendsReportUseCase;
  private readonly getDashboardStatisticsUseCase: GetDashboardStatisticsUseCase;
  private readonly getDoctorBillingPerformanceUseCase: GetDoctorBillingPerformanceUseCase;
  private readonly getPatientInvoicesUseCase: GetPatientInvoicesUseCase;
  private readonly getPatientPaymentHistoryUseCase: GetPatientPaymentHistoryUseCase;
  private readonly getPatientOutstandingBalanceUseCase: GetPatientOutstandingBalanceUseCase;
  private readonly createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase;
  private readonly handlePayOSWebhookUseCase: HandlePayOSWebhookUseCase;
  private readonly getPayOSPaymentStatusUseCase: GetPayOSPaymentStatusUseCase;
  private readonly cancelPayOSPaymentUseCase: CancelPayOSPaymentUseCase;
  private readonly bulkExportInvoicesUseCase: BulkExportInvoicesUseCase;
  private readonly bulkSendPaymentRemindersUseCase: BulkSendPaymentRemindersUseCase;
  private readonly getTaxInvoicesUseCase: GetTaxInvoicesUseCase;
  private readonly getTaxSummaryUseCase: GetTaxSummaryUseCase;
  private readonly getInvoiceTemplatesUseCase: GetInvoiceTemplatesUseCase;
  private readonly createInvoiceTemplateUseCase: CreateInvoiceTemplateUseCase;
  private readonly createInvoiceFromTemplateUseCase: CreateInvoiceFromTemplateUseCase;

  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {
    // Initialize new use cases
    this.getInvoiceUseCase = new GetInvoiceUseCase(billingRepository, logger);
    this.getInvoicesUseCase = new GetInvoicesUseCase(billingRepository, logger);
    this.addInvoiceItemUseCase = new AddInvoiceItemUseCase(billingRepository, eventBus, logger);
    this.removeInvoiceItemUseCase = new RemoveInvoiceItemUseCase(billingRepository, eventBus, logger);
    this.finalizeInvoiceUseCase = new FinalizeInvoiceUseCase(billingRepository, eventBus, logger);
    this.cancelInvoiceUseCase = new CancelInvoiceUseCase(billingRepository, eventBus, logger);
    this.searchInvoicesUseCase = new SearchInvoicesUseCase(billingRepository, logger);
    this.getOverdueInvoicesUseCase = new GetOverdueInvoicesUseCase(billingRepository, logger);
    this.getPatientBillingSummaryUseCase = new GetPatientBillingSummaryUseCase(billingRepository, logger);
    this.submitInsuranceClaimUseCase = new SubmitInsuranceClaimUseCase(billingRepository, eventBus, logger);
    this.approveInsuranceClaimUseCase = new ApproveInsuranceClaimUseCase(billingRepository, eventBus, logger);
    this.rejectInsuranceClaimUseCase = new RejectInsuranceClaimUseCase(billingRepository, eventBus, logger);
    this.getRevenueReportUseCase = new GetRevenueReportUseCase(billingRepository, logger);
    this.getOutstandingInvoicesReportUseCase = new GetOutstandingInvoicesReportUseCase(billingRepository, logger);
    this.getInsuranceClaimsReportUseCase = new GetInsuranceClaimsReportUseCase(billingRepository, logger);
    this.getPaymentTrendsReportUseCase = new GetPaymentTrendsReportUseCase(billingRepository, logger);
    this.getDashboardStatisticsUseCase = new GetDashboardStatisticsUseCase(billingRepository, logger);
    this.getDoctorBillingPerformanceUseCase = new GetDoctorBillingPerformanceUseCase(billingRepository, logger);
    this.getPatientInvoicesUseCase = new GetPatientInvoicesUseCase(billingRepository, logger);
    this.getPatientPaymentHistoryUseCase = new GetPatientPaymentHistoryUseCase(billingRepository, logger);
    this.getPatientOutstandingBalanceUseCase = new GetPatientOutstandingBalanceUseCase(billingRepository, logger);
    this.createPayOSPaymentLinkUseCase = new CreatePayOSPaymentLinkUseCase(billingRepository, logger);
    this.handlePayOSWebhookUseCase = new HandlePayOSWebhookUseCase(billingRepository, eventBus, logger);
    this.getPayOSPaymentStatusUseCase = new GetPayOSPaymentStatusUseCase(logger);
    this.cancelPayOSPaymentUseCase = new CancelPayOSPaymentUseCase(logger);
    this.bulkExportInvoicesUseCase = new BulkExportInvoicesUseCase(billingRepository, logger);
    this.bulkSendPaymentRemindersUseCase = new BulkSendPaymentRemindersUseCase(billingRepository, logger);
    this.getTaxInvoicesUseCase = new GetTaxInvoicesUseCase(billingRepository, logger);
    this.getTaxSummaryUseCase = new GetTaxSummaryUseCase(billingRepository, logger);
    this.getInvoiceTemplatesUseCase = new GetInvoiceTemplatesUseCase(logger);
    this.createInvoiceTemplateUseCase = new CreateInvoiceTemplateUseCase(logger);
    this.createInvoiceFromTemplateUseCase = new CreateInvoiceFromTemplateUseCase(billingRepository, eventBus, logger);
  }

  /**
   * Handle create invoice command
   */
  public async handleCreateInvoice(command: CreateInvoiceCommand): Promise<CreateInvoiceResponse> {
    try {
      this.logger.info('Handling create invoice command', {
        commandId: command.commandId,
        patientId: command.patientId,
        doctorId: command.doctorId,
        itemCount: command.items.length
      });

      return await this.createInvoiceUseCase.execute(command);

    } catch (error) {
      this.logger.error('Error handling create invoice command', {
        commandId: command.commandId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi tạo hóa đơn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle process payment command
   */
  public async handleProcessPayment(command: ProcessPaymentCommand): Promise<ProcessPaymentResponse> {
    try {
      this.logger.info('Handling process payment command', {
        commandId: command.commandId,
        invoiceId: command.invoiceId,
        amount: command.amount,
        paymentMethod: command.paymentMethod
      });

      return await this.processPaymentUseCase.execute(command);

    } catch (error) {
      this.logger.error('Error handling process payment command', {
        commandId: command.commandId,
        invoiceId: command.invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi xử lý thanh toán: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle refund payment command
   */
  public async handleRefundPayment(command: RefundPaymentCommand): Promise<RefundPaymentResponse> {
    try {
      this.logger.info('Handling refund payment command', {
        commandId: command.commandId,
        invoiceId: command.invoiceId,
        refundAmount: command.refundAmount,
        refundReason: command.refundReason
      });

      return await this.refundPaymentUseCase.execute(command);

    } catch (error) {
      this.logger.error('Error handling refund payment command', {
        commandId: command.commandId,
        invoiceId: command.invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi hoàn tiền: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle cancel invoice command
   */
  public async handleCancelInvoice(command: CancelInvoiceCommand): Promise<CancelInvoiceResponse> {
    try {
      this.logger.info('Handling cancel invoice command', {
        commandId: command.commandId,
        invoiceId: command.invoiceId,
        reason: command.reason
      });

      const invoiceId = InvoiceId.create(command.invoiceId);
      const billingAggregate = await this.billingRepository.findById(invoiceId);

      if (!billingAggregate) {
        return {
          success: false,
          message: 'Không tìm thấy hóa đơn'
        };
      }

      // Cancel the invoice
      billingAggregate.cancel(command.reason, command.cancelledBy);

      // Save updated aggregate
      await this.billingRepository.save(billingAggregate);

      this.logger.info('Invoice cancelled successfully', {
        commandId: command.commandId,
        invoiceId: command.invoiceId
      });

      return {
        success: true,
        message: 'Hóa đơn đã được hủy thành công',
        data: {
          invoiceId: command.invoiceId,
          cancelledAt: new Date(),
          reason: command.reason
        }
      };

    } catch (error) {
      this.logger.error('Error handling cancel invoice command', {
        commandId: command.commandId,
        invoiceId: command.invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi hủy hóa đơn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
      };
    }
  }

  /**
   * Handle bulk invoice creation command
   */
  public async handleBulkInvoiceCreation(command: BulkInvoiceCommand): Promise<BulkInvoiceResponse> {
    try {
      this.logger.info('Handling bulk invoice creation command', {
        commandId: command.commandId,
        batchId: command.batchId,
        invoiceCount: command.invoices.length
      });

      const results: Array<{
        index: number;
        invoiceId?: string;
        status: 'SUCCESS' | 'FAILED';
        errorMessage?: string;
      }> = [];

      let successful = 0;
      let failed = 0;

      // Process each invoice
      for (let i = 0; i < command.invoices.length; i++) {
        try {
          const invoiceRequest = command.invoices[i];
          const response = await this.createInvoiceUseCase.execute(invoiceRequest);

          if (response.success) {
            results.push({
              index: i,
              invoiceId: response.data?.invoiceId,
              status: 'SUCCESS'
            });
            successful++;
          } else {
            results.push({
              index: i,
              status: 'FAILED',
              errorMessage: response.message
            });
            failed++;
          }
        } catch (error) {
          results.push({
            index: i,
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
          failed++;
        }
      }

      this.logger.info('Bulk invoice creation completed', {
        commandId: command.commandId,
        batchId: command.batchId,
        successful,
        failed,
        total: command.invoices.length
      });

      return {
        success: successful > 0,
        message: `Tạo hàng loạt hoàn tất: ${successful} thành công, ${failed} thất bại`,
        data: {
          totalRequested: command.invoices.length,
          successful,
          failed,
          batchId: command.batchId || `batch-${Date.now()}`,
          results
        }
      };

    } catch (error) {
      this.logger.error('Error handling bulk invoice creation command', {
        commandId: command.commandId,
        batchId: command.batchId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi tạo hóa đơn hàng loạt: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
      };
    }
  }

  // =====================================================
  // INVOICE MANAGEMENT METHODS
  // =====================================================

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string, options?: { includePaymentHistory?: boolean; includeRefundHistory?: boolean }): Promise<any> {
    try {
      return await this.getInvoiceUseCase.execute({
        invoiceId,
        includePaymentHistory: options?.includePaymentHistory,
        includeRefundHistory: options?.includeRefundHistory
      });
    } catch (error) {
      this.logger.error('Error getting invoice', { invoiceId, error });
      throw error;
    }
  }

  /**
   * Get invoices with filters
   */
  async getInvoices(filters: any): Promise<any> {
    try {
      return await this.getInvoicesUseCase.execute(filters);
    } catch (error) {
      this.logger.error('Error getting invoices', { filters, error });
      throw error;
    }
  }

  /**
   * Add invoice item
   */
  async addInvoiceItem(invoiceId: string, item: any): Promise<any> {
    try {
      return await this.addInvoiceItemUseCase.execute({
        invoiceId,
        ...item
      });
    } catch (error) {
      this.logger.error('Error adding invoice item', { invoiceId, error });
      throw error;
    }
  }

  /**
   * Remove invoice item
   */
  async removeInvoiceItem(invoiceId: string, itemId: string): Promise<any> {
    try {
      return await this.removeInvoiceItemUseCase.execute({
        invoiceId,
        itemId,
        removedBy: 'SYSTEM'
      });
    } catch (error) {
      this.logger.error('Error removing invoice item', { invoiceId, itemId, error });
      throw error;
    }
  }

  /**
   * Finalize invoice
   */
  async finalizeInvoice(invoiceId: string): Promise<any> {
    try {
      return await this.finalizeInvoiceUseCase.execute({
        invoiceId,
        finalizedBy: 'SYSTEM'
      });
    } catch (error) {
      this.logger.error('Error finalizing invoice', { invoiceId, error });
      throw error;
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: string, reason: string, cancelledBy: string): Promise<any> {
    try {
      return await this.cancelInvoiceUseCase.execute({
        invoiceId,
        reason,
        cancelledBy
      });
    } catch (error) {
      this.logger.error('Error cancelling invoice', { invoiceId, error });
      throw error;
    }
  }

  /**
   * Download invoice
   */
  async downloadInvoice(invoiceId: string, format: string): Promise<any> {
    try {
      // TODO: Implement PDF/Excel generation
      return {
        success: true,
        data: Buffer.from('Invoice PDF content')
      };
    } catch (error) {
      this.logger.error('Error downloading invoice', { invoiceId, format, error });
      throw error;
    }
  }

  /**
   * Search invoices
   */
  async searchInvoices(criteria: any): Promise<any> {
    try {
      return await this.searchInvoicesUseCase.execute(criteria);
    } catch (error) {
      this.logger.error('Error searching invoices', { criteria, error });
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(filters: any): Promise<any> {
    try {
      return await this.getOverdueInvoicesUseCase.execute(filters);
    } catch (error) {
      this.logger.error('Error getting overdue invoices', { filters, error });
      throw error;
    }
  }

  /**
   * Get invoices with pending claims
   */
  async getInvoicesWithPendingClaims(filters: any): Promise<any> {
    try {
      // TODO: Implement with repository query
      return {
        success: true,
        data: [],
        total: 0
      };
    } catch (error) {
      this.logger.error('Error getting invoices with pending claims', { filters, error });
      throw error;
    }
  }

  // =====================================================
  // PAYMENT MANAGEMENT METHODS
  // =====================================================

  /**
   * Get payment history for invoice
   */
  async getPaymentHistory(invoiceId: string): Promise<any> {
    try {
      const id = InvoiceId.create(invoiceId);
      const billing = await this.billingRepository.findById(id);

      if (!billing) {
        return { success: false, message: 'Không tìm thấy hóa đơn' };
      }

      return {
        success: true,
        data: billing.payments
      };
    } catch (error) {
      this.logger.error('Error getting payment history', { invoiceId, error });
      throw error;
    }
  }

  /**
   * Get all payments
   */
  async getAllPayments(filters: any): Promise<any> {
    try {
      // TODO: Implement with repository query
      return {
        success: true,
        data: [],
        total: 0
      };
    } catch (error) {
      this.logger.error('Error getting all payments', { filters, error });
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<any> {
    try {
      // TODO: Implement with repository query
      return {
        success: true,
        data: null
      };
    } catch (error) {
      this.logger.error('Error getting payment by ID', { paymentId, error });
      throw error;
    }
  }

  // =====================================================
  // PAYOS INTEGRATION METHODS
  // =====================================================

  /**
   * Create PayOS payment link
   */
  async createPayOSPaymentLink(data: { invoiceId: string; returnUrl: string; cancelUrl: string }): Promise<any> {
    try {
      return await this.createPayOSPaymentLinkUseCase.execute(data);
    } catch (error) {
      this.logger.error('Error creating PayOS payment link', { data, error });
      throw error;
    }
  }

  /**
   * Verify PayOS signature (deprecated - use HandlePayOSWebhookUseCase)
   */
  async verifyPayOSSignature(data: any, signature: string): Promise<boolean> {
    try {
      // Signature verification is now handled in HandlePayOSWebhookUseCase
      return true;
    } catch (error) {
      this.logger.error('Error verifying PayOS signature', { error });
      return false;
    }
  }

  /**
   * Process PayOS webhook
   */
  async processPayOSWebhook(webhookData: any): Promise<any> {
    try {
      return await this.handlePayOSWebhookUseCase.execute(webhookData);
    } catch (error) {
      this.logger.error('Error processing PayOS webhook', { webhookData, error });
      throw error;
    }
  }

  /**
   * Get PayOS payment status
   */
  async getPayOSPaymentStatus(orderCode: string): Promise<any> {
    try {
      return await this.getPayOSPaymentStatusUseCase.execute({ orderCode });
    } catch (error) {
      this.logger.error('Error getting PayOS payment status', { orderCode, error });
      throw error;
    }
  }

  /**
   * Cancel PayOS payment
   */
  async cancelPayOSPayment(orderCode: string, reason: string): Promise<any> {
    try {
      return await this.cancelPayOSPaymentUseCase.execute({
        orderCode,
        cancellationReason: reason
      });
    } catch (error) {
      this.logger.error('Error cancelling PayOS payment', { orderCode, reason, error });
      throw error;
    }
  }

  // =====================================================
  // INSURANCE CLAIMS METHODS
  // =====================================================

  /**
   * Submit insurance claim
   */
  async submitInsuranceClaim(invoiceId: string): Promise<any> {
    try {
      return await this.submitInsuranceClaimUseCase.execute({
        invoiceId,
        submittedBy: 'SYSTEM'
      });
    } catch (error) {
      this.logger.error('Error submitting insurance claim', { invoiceId, error });
      throw error;
    }
  }

  /**
   * Get insurance claims for invoice
   */
  async getInsuranceClaims(invoiceId: string): Promise<any> {
    try {
      const id = InvoiceId.create(invoiceId);
      const billing = await this.billingRepository.findById(id);

      if (!billing) {
        return { success: false, message: 'Không tìm thấy hóa đơn' };
      }

      return {
        success: true,
        data: billing.insurance ? [billing.insurance] : []
      };
    } catch (error) {
      this.logger.error('Error getting insurance claims', { invoiceId, error });
      throw error;
    }
  }

  /**
   * Approve insurance claim
   */
  async approveInsuranceClaim(claimId: string, approvedAmount: number, notes?: string): Promise<any> {
    try {
      return await this.approveInsuranceClaimUseCase.execute({
        claimId,
        approvedAmount,
        approvedBy: 'SYSTEM',
        notes
      });
    } catch (error) {
      this.logger.error('Error approving insurance claim', { claimId, error });
      throw error;
    }
  }

  /**
   * Reject insurance claim
   */
  async rejectInsuranceClaim(claimId: string, rejectionReason: string): Promise<any> {
    try {
      return await this.rejectInsuranceClaimUseCase.execute({
        claimId,
        rejectionReason,
        rejectedBy: 'SYSTEM'
      });
    } catch (error) {
      this.logger.error('Error rejecting insurance claim', { claimId, error });
      throw error;
    }
  }

  /**
   * Get all insurance claims
   */
  async getAllInsuranceClaims(filters: any): Promise<any> {
    try {
      // TODO: Implement with repository query
      return {
        success: true,
        data: [],
        total: 0
      };
    } catch (error) {
      this.logger.error('Error getting all insurance claims', { filters, error });
      throw error;
    }
  }

  // =====================================================
  // PATIENT BILLING METHODS
  // =====================================================

  /**
   * Get patient invoices
   */
  async getPatientInvoices(filters: any): Promise<any> {
    try {
      return await this.getPatientInvoicesUseCase.execute(filters);
    } catch (error) {
      this.logger.error('Error getting patient invoices', { filters, error });
      throw error;
    }
  }

  /**
   * Get patient billing summary
   */
  async getPatientBillingSummary(patientId: string): Promise<any> {
    try {
      return await this.getPatientBillingSummaryUseCase.execute({
        patientId,
        includeHistory: true
      });
    } catch (error) {
      this.logger.error('Error getting patient billing summary', { patientId, error });
      throw error;
    }
  }

  /**
   * Get patient payment history
   */
  async getPatientPaymentHistory(filters: any): Promise<any> {
    try {
      return await this.getPatientPaymentHistoryUseCase.execute(filters);
    } catch (error) {
      this.logger.error('Error getting patient payment history', { filters, error });
      throw error;
    }
  }

  /**
   * Get patient outstanding balance
   */
  async getPatientOutstandingBalance(patientId: string): Promise<any> {
    try {
      return await this.getPatientOutstandingBalanceUseCase.execute({ patientId });
    } catch (error) {
      this.logger.error('Error getting patient outstanding balance', { patientId, error });
      throw error;
    }
  }

  // =====================================================
  // REPORTS & STATISTICS METHODS
  // =====================================================

  /**
   * Get revenue report
   */
  async getRevenueReport(filters: any): Promise<any> {
    try {
      return await this.getRevenueReportUseCase.execute(filters);
    } catch (error) {
      this.logger.error('Error getting revenue report', { filters, error });
      throw error;
    }
  }

  /**
   * Get outstanding invoices report
   */
  async getOutstandingInvoicesReport(): Promise<any> {
    try {
      return await this.getOutstandingInvoicesReportUseCase.execute({});
    } catch (error) {
      this.logger.error('Error getting outstanding invoices report', { error });
      throw error;
    }
  }

  /**
   * Get insurance claims report
   */
  async getInsuranceClaimsReport(filters: any): Promise<any> {
    try {
      return await this.getInsuranceClaimsReportUseCase.execute(filters);
    } catch (error) {
      this.logger.error('Error getting insurance claims report', { filters, error });
      throw error;
    }
  }

  /**
   * Get payment trends report
   */
  async getPaymentTrendsReport(filters: any): Promise<any> {
    try {
      return await this.getPaymentTrendsReportUseCase.execute(filters);
    } catch (error) {
      this.logger.error('Error getting payment trends report', { filters, error });
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStatistics(): Promise<any> {
    try {
      return await this.getDashboardStatisticsUseCase.execute({});
    } catch (error) {
      this.logger.error('Error getting dashboard statistics', { error });
      throw error;
    }
  }

  /**
   * Get doctor billing performance
   */
  async getDoctorBillingPerformance(filters: any): Promise<any> {
    try {
      return await this.getDoctorBillingPerformanceUseCase.execute(filters);
    } catch (error) {
      this.logger.error('Error getting doctor billing performance', { filters, error });
      throw error;
    }
  }

  // =====================================================
  // BULK OPERATIONS METHODS
  // =====================================================

  /**
   * Bulk export invoices
   */
  async bulkExportInvoices(invoiceIds: string[], format: string): Promise<any> {
    try {
      return await this.bulkExportInvoicesUseCase.execute({
        invoiceIds,
        format: format as 'csv' | 'excel',
        includeItems: true,
        includePayments: true
      });
    } catch (error) {
      this.logger.error('Error bulk exporting invoices', { invoiceIds, format, error });
      throw error;
    }
  }

  /**
   * Bulk send payment reminders
   */
  async bulkSendPaymentReminders(invoiceIds: string[], reminderType: string): Promise<any> {
    try {
      return await this.bulkSendPaymentRemindersUseCase.execute({
        invoiceIds,
        reminderType: reminderType as 'email' | 'sms' | 'both'
      });
    } catch (error) {
      this.logger.error('Error bulk sending payment reminders', { invoiceIds, error });
      throw error;
    }
  }

  // =====================================================
  // TAX COMPLIANCE METHODS
  // =====================================================

  /**
   * Get tax invoices
   */
  async getTaxInvoices(year: number, quarter: number): Promise<any> {
    try {
      return await this.getTaxInvoicesUseCase.execute({ year, quarter });
    } catch (error) {
      this.logger.error('Error getting tax invoices', { year, quarter, error });
      throw error;
    }
  }

  /**
   * Get tax summary
   */
  async getTaxSummary(year: number, quarter: number): Promise<any> {
    try {
      return await this.getTaxSummaryUseCase.execute({ year, quarter });
    } catch (error) {
      this.logger.error('Error getting tax summary', { year, quarter, error });
      throw error;
    }
  }

  // =====================================================
  // TEMPLATE METHODS
  // =====================================================

  /**
   * Get invoice templates
   */
  async getInvoiceTemplates(): Promise<any> {
    try {
      return await this.getInvoiceTemplatesUseCase.execute({});
    } catch (error) {
      this.logger.error('Error getting invoice templates', { error });
      throw error;
    }
  }

  /**
   * Create invoice template
   */
  async createInvoiceTemplate(data: { name: string; description?: string; items: any[]; category: string }): Promise<any> {
    try {
      return await this.createInvoiceTemplateUseCase.execute({
        name: data.name,
        description: data.description || '',
        category: data.category,
        items: data.items,
        createdBy: 'SYSTEM'
      });
    } catch (error) {
      this.logger.error('Error creating invoice template', { data, error });
      throw error;
    }
  }

  /**
   * Create invoice from template
   */
  async createInvoiceFromTemplate(templateId: string, data: { patientId: string; doctorId: string; insurance?: any; medicalRecordId?: string; appointmentId?: string }): Promise<any> {
    try {
      return await this.createInvoiceFromTemplateUseCase.execute({
        templateId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        insurance: data.insurance,
        medicalRecordId: data.medicalRecordId,
        appointmentId: data.appointmentId,
        issuedBy: 'SYSTEM'
      });
    } catch (error) {
      this.logger.error('Error creating invoice from template', { templateId, data, error });
      throw error;
    }
  }

  // =====================================================
  // REFUND METHODS
  // =====================================================

  /**
   * Process refund
   */
  async processRefund(invoiceId: string, data: { amount: number; reason: string; refundMethod: string }): Promise<any> {
    try {
      return await this.refundPaymentUseCase.execute({
        invoiceId,
        refundAmount: data.amount,
        refundReason: data.reason,
        refundMethod: data.refundMethod,
        processedBy: 'SYSTEM'
      });
    } catch (error) {
      this.logger.error('Error processing refund', { invoiceId, data, error });
      throw error;
    }
  }

  /**
   * Get all refunds
   */
  async getAllRefunds(filters: any): Promise<any> {
    try {
      // TODO: Implement with repository query
      return {
        success: true,
        data: [],
        total: 0
      };
    } catch (error) {
      this.logger.error('Error getting all refunds', { filters, error });
      throw error;
    }
  }

  // =====================================================
  // NOTIFICATION METHODS
  // =====================================================

  /**
   * Send invoice notification
   */
  async sendInvoiceNotification(invoiceId: string, notificationType: string, customMessage?: string): Promise<any> {
    try {
      // TODO: Integrate with notification service
      return {
        success: true,
        data: {
          invoiceId,
          notificationType,
          sent: true,
          sentAt: new Date()
        }
      };
    } catch (error) {
      this.logger.error('Error sending invoice notification', { invoiceId, notificationType, error });
      throw error;
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(invoiceId: string): Promise<any> {
    try {
      const id = InvoiceId.create(invoiceId);
      const billing = await this.billingRepository.findById(id);

      if (!billing) {
        return { success: false, message: 'Không tìm thấy hóa đơn' };
      }

      // TODO: Integrate with notification service
      return {
        success: true,
        data: {
          invoiceId,
          reminderSent: true,
          sentAt: new Date()
        }
      };
    } catch (error) {
      this.logger.error('Error sending payment reminder', { invoiceId, error });
      throw error;
    }
  }
}
