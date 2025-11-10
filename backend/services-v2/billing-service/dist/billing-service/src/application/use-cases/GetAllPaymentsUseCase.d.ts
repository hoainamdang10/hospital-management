/**
 * GetAllPaymentsUseCase - Application Layer
 * Use case for retrieving all payments with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
export interface GetAllPaymentsRequest {
    page: number;
    limit: number;
    dateFrom?: Date;
    dateTo?: Date;
    paymentMethod?: string;
    status?: string;
}
export interface GetAllPaymentsResponse {
    success: boolean;
    data?: Array<{
        paymentId: string;
        invoiceId: string;
        invoiceNumber: string;
        amount: number;
        currency: string;
        method: string;
        transactionId?: string;
        processedAt: Date;
        processedBy: string;
        status: string;
    }>;
    total: number;
    summary: {
        totalAmount: number;
        paymentCount: number;
        byMethod: Record<string, number>;
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GetAllPaymentsUseCase extends BaseHealthcareUseCase<GetAllPaymentsRequest, GetAllPaymentsResponse> {
    private readonly billingRepository;
    protected readonly logger: ILogger;
    constructor(billingRepository: IBillingRepository, logger: ILogger);
    protected executeImpl(request: GetAllPaymentsRequest): Promise<GetAllPaymentsResponse>;
}
//# sourceMappingURL=GetAllPaymentsUseCase.d.ts.map