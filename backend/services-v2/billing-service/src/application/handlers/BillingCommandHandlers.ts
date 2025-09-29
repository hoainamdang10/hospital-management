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
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

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
  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly billingRepository: IBillingRepository,
    private readonly logger: ILogger
  ) {}

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
}
