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
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
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
export declare class BillingCommandHandlers {
    private readonly createInvoiceUseCase;
    private readonly processPaymentUseCase;
    private readonly refundPaymentUseCase;
    private readonly billingRepository;
    private readonly logger;
    constructor(createInvoiceUseCase: CreateInvoiceUseCase, processPaymentUseCase: ProcessPaymentUseCase, refundPaymentUseCase: RefundPaymentUseCase, billingRepository: IBillingRepository, logger: ILogger);
    /**
     * Handle create invoice command
     */
    handleCreateInvoice(command: CreateInvoiceCommand): Promise<CreateInvoiceResponse>;
    /**
     * Handle process payment command
     */
    handleProcessPayment(command: ProcessPaymentCommand): Promise<ProcessPaymentResponse>;
    /**
     * Handle refund payment command
     */
    handleRefundPayment(command: RefundPaymentCommand): Promise<RefundPaymentResponse>;
    /**
     * Handle cancel invoice command
     */
    handleCancelInvoice(command: CancelInvoiceCommand): Promise<CancelInvoiceResponse>;
    /**
     * Handle bulk invoice creation command
     */
    handleBulkInvoiceCreation(command: BulkInvoiceCommand): Promise<BulkInvoiceResponse>;
}
//# sourceMappingURL=BillingCommandHandlers.d.ts.map