/**
 * GetBillingHistoryUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for retrieving billing history with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceStatus, PaymentMethod } from '../../domain/aggregates/BillingAggregate';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
export interface GetBillingHistoryRequest {
    patientId?: string;
    doctorId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: InvoiceStatus[];
    paymentMethod?: PaymentMethod[];
    searchTerm?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'totalAmount' | 'dueDate' | 'invoiceNumber';
    sortOrder?: 'asc' | 'desc';
    includeRefunded?: boolean;
    includeInsuranceClaims?: boolean;
}
export interface BillingHistoryItem {
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
    lastPaymentDate?: Date;
    paymentMethods: PaymentMethod[];
    hasInsurance: boolean;
    isOverdue: boolean;
    refundedAmount?: number;
    notes?: string;
}
export interface GetBillingHistoryResponse {
    success: boolean;
    data?: {
        items: BillingHistoryItem[];
        pagination: {
            page: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
        summary: {
            totalInvoices: number;
            totalAmount: number;
            totalPaid: number;
            totalOutstanding: number;
            totalRefunded: number;
            overdueCount: number;
            overdueAmount: number;
        };
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Get Billing History Use Case
 * Implements billing history retrieval with Vietnamese healthcare compliance
 */
export declare class GetBillingHistoryUseCase extends BaseHealthcareUseCase<GetBillingHistoryRequest, GetBillingHistoryResponse> {
    private readonly billingRepository;
    protected readonly logger: ILogger;
    constructor(billingRepository: IBillingRepository, logger: ILogger);
    /**
     * Execute billing history retrieval
     */
    protected executeImpl(request: GetBillingHistoryRequest): Promise<GetBillingHistoryResponse>;
    /**
     * Validate get billing history request
     */
    private validateRequest;
    /**
     * Build search criteria from request
     */
    private buildSearchCriteria;
    /**
     * Transform billing aggregate to history item
     */
    private transformToHistoryItem;
    /**
     * Calculate summary statistics
     */
    private calculateSummary;
}
//# sourceMappingURL=GetBillingHistoryUseCase.d.ts.map