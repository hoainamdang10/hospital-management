/**
 * GetInvoicesWithPendingClaimsUseCase - Application Layer
 * Use case for retrieving invoices with pending insurance claims
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
export interface GetInvoicesWithPendingClaimsRequest {
    page?: number;
    limit?: number;
    insuranceType?: string;
}
export interface GetInvoicesWithPendingClaimsResponse {
    success: boolean;
    data?: Array<{
        invoiceId: string;
        invoiceNumber: string;
        patientId: string;
        totalAmount: number;
        insuranceCoverage: number;
        insuranceType: string;
        claimId?: string;
        claimSubmittedAt?: Date;
        daysPending: number;
    }>;
    total: number;
    summary: {
        totalPendingClaims: number;
        totalClaimAmount: number;
        averageDaysPending: number;
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GetInvoicesWithPendingClaimsUseCase extends BaseHealthcareUseCase<GetInvoicesWithPendingClaimsRequest, GetInvoicesWithPendingClaimsResponse> {
    private readonly billingRepository;
    protected readonly logger: ILogger;
    constructor(billingRepository: IBillingRepository, logger: ILogger);
    protected executeImpl(request: GetInvoicesWithPendingClaimsRequest): Promise<GetInvoicesWithPendingClaimsResponse>;
}
//# sourceMappingURL=GetInvoicesWithPendingClaimsUseCase.d.ts.map