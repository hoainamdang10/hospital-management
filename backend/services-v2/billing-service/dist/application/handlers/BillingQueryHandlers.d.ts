/**
 * BillingQueryHandlers - Application Query Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS query handlers for billing operations with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD, Vietnamese Healthcare Standards
 */
import { GetBillingHistoryUseCase, GetBillingHistoryRequest, GetBillingHistoryResponse } from '../use-cases/GetBillingHistoryUseCase';
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { InvoiceStatus, PaymentMethod } from '../../domain/aggregates/BillingAggregate';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
export interface GetInvoiceQuery {
    invoiceId: string;
    includePaymentHistory?: boolean;
    includeRefundHistory?: boolean;
    queryId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface GetBillingHistoryQuery extends GetBillingHistoryRequest {
    queryId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface GetInvoicesByPatientQuery {
    patientId: string;
    status?: InvoiceStatus[];
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'totalAmount' | 'dueDate';
    sortOrder?: 'asc' | 'desc';
    queryId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface GetOverdueInvoicesQuery {
    daysOverdue?: number;
    minimumAmount?: number;
    patientId?: string;
    doctorId?: string;
    page?: number;
    pageSize?: number;
    queryId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface GetPaymentStatisticsQuery {
    dateFrom: Date;
    dateTo: Date;
    groupBy?: 'day' | 'week' | 'month';
    paymentMethod?: PaymentMethod[];
    doctorId?: string;
    departmentId?: string;
    queryId?: string;
    timestamp?: Date;
    userId?: string;
}
export interface GetInvoiceResponse {
    success: boolean;
    data?: {
        invoiceId: string;
        invoiceNumber: string;
        patientId: string;
        patientName?: string;
        doctorId: string;
        doctorName?: string;
        totalAmount: number;
        paidAmount: number;
        remainingBalance: number;
        insuranceCoverage: number;
        status: InvoiceStatus;
        createdAt: Date;
        dueDate: Date;
        items: Array<{
            description: string;
            vietnameseDescription: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            category: string;
        }>;
        paymentHistory?: Array<{
            paymentId: string;
            amount: number;
            method: PaymentMethod;
            processedAt: Date;
            transactionId?: string;
        }>;
        refundHistory?: Array<{
            refundId: string;
            amount: number;
            reason: string;
            processedAt: Date;
            method: PaymentMethod;
        }>;
        insurance?: {
            type: string;
            number: string;
            coverageLevel: number;
            coverageAmount: number;
        };
        notes?: string;
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export interface GetOverdueInvoicesResponse {
    success: boolean;
    data?: {
        invoices: Array<{
            invoiceId: string;
            invoiceNumber: string;
            patientId: string;
            patientName?: string;
            totalAmount: number;
            remainingBalance: number;
            dueDate: Date;
            daysOverdue: number;
            lastContactDate?: Date;
        }>;
        pagination: {
            page: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
        };
        summary: {
            totalOverdueInvoices: number;
            totalOverdueAmount: number;
            averageDaysOverdue: number;
        };
    };
    message: string;
}
export interface GetPaymentStatisticsResponse {
    success: boolean;
    data?: {
        period: {
            from: Date;
            to: Date;
            groupBy: string;
        };
        statistics: Array<{
            date: string;
            totalAmount: number;
            totalInvoices: number;
            totalPayments: number;
            averageInvoiceAmount: number;
            paymentMethodBreakdown: Record<PaymentMethod, {
                amount: number;
                count: number;
                percentage: number;
            }>;
        }>;
        summary: {
            totalRevenue: number;
            totalInvoices: number;
            totalPayments: number;
            averageInvoiceAmount: number;
            collectionRate: number;
            mostUsedPaymentMethod: PaymentMethod;
        };
    };
    message: string;
}
/**
 * Billing Query Handlers
 * Implements CQRS query handling for billing operations
 */
export declare class BillingQueryHandlers {
    private readonly getBillingHistoryUseCase;
    private readonly billingRepository;
    private readonly logger;
    constructor(getBillingHistoryUseCase: GetBillingHistoryUseCase, billingRepository: IBillingRepository, logger: ILogger);
    /**
     * Handle get invoice query
     */
    handleGetInvoice(query: GetInvoiceQuery): Promise<GetInvoiceResponse>;
    /**
     * Handle get billing history query
     */
    handleGetBillingHistory(query: GetBillingHistoryQuery): Promise<GetBillingHistoryResponse>;
    /**
     * Handle get overdue invoices query
     */
    handleGetOverdueInvoices(query: GetOverdueInvoicesQuery): Promise<GetOverdueInvoicesResponse>;
}
//# sourceMappingURL=BillingQueryHandlers.d.ts.map