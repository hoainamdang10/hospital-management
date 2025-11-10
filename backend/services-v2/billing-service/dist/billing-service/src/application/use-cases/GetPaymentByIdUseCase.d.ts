/**
 * GetPaymentByIdUseCase - Application Layer
 * Use case for retrieving payment by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
export interface GetPaymentByIdRequest {
    paymentId: string;
}
export interface GetPaymentByIdResponse {
    success: boolean;
    data?: {
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
        notes?: string;
        payosData?: any;
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GetPaymentByIdUseCase extends BaseHealthcareUseCase<GetPaymentByIdRequest, GetPaymentByIdResponse> {
    private readonly billingRepository;
    protected readonly logger: ILogger;
    constructor(billingRepository: IBillingRepository, logger: ILogger);
    protected executeImpl(request: GetPaymentByIdRequest): Promise<GetPaymentByIdResponse>;
}
//# sourceMappingURL=GetPaymentByIdUseCase.d.ts.map