/**
 * GetPatientPaymentHistoryUseCase - Application Layer
 * Use case for retrieving patient payment history
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
export interface GetPatientPaymentHistoryRequest {
    patientId: string;
    page: number;
    limit: number;
    dateFrom?: Date;
    dateTo?: Date;
    paymentMethod?: string;
}
export interface GetPatientPaymentHistoryResponse {
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
        notes?: string;
        payosData?: any;
    }>;
    total: number;
    summary: {
        totalPaid: number;
        paymentCount: number;
        averagePayment: number;
        byMethod: {
            cash: number;
            card: number;
            bankTransfer: number;
            payos: number;
            insurance: number;
        };
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GetPatientPaymentHistoryUseCase extends BaseHealthcareUseCase<GetPatientPaymentHistoryRequest, GetPatientPaymentHistoryResponse> {
    private readonly billingRepository;
    protected readonly logger: ILogger;
    constructor(billingRepository: IBillingRepository, logger: ILogger);
    protected executeImpl(request: GetPatientPaymentHistoryRequest): Promise<GetPatientPaymentHistoryResponse>;
    private calculateSummary;
}
//# sourceMappingURL=GetPatientPaymentHistoryUseCase.d.ts.map