/**
 * GetPatientOutstandingBalanceUseCase - Application Layer
 * Use case for retrieving patient outstanding balance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
export interface GetPatientOutstandingBalanceRequest {
    patientId: string;
}
export interface GetPatientOutstandingBalanceResponse {
    success: boolean;
    data?: {
        patientId: string;
        balance: {
            totalOutstanding: number;
            overdueAmount: number;
            currentAmount: number;
            currency: string;
        };
        breakdown: {
            pendingInvoices: number;
            partiallyPaidInvoices: number;
            overdueInvoices: number;
        };
        oldestUnpaidInvoice?: {
            invoiceId: string;
            invoiceNumber: string;
            amount: number;
            issuedAt: Date;
            dueDate?: Date;
            daysOverdue: number;
        };
        upcomingDue?: Array<{
            invoiceId: string;
            invoiceNumber: string;
            amount: number;
            dueDate: Date;
            daysUntilDue: number;
        }>;
        paymentPlan?: {
            hasActivePlan: boolean;
            nextPaymentDue?: Date;
            nextPaymentAmount?: number;
        };
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GetPatientOutstandingBalanceUseCase extends BaseHealthcareUseCase<GetPatientOutstandingBalanceRequest, GetPatientOutstandingBalanceResponse> {
    private readonly billingRepository;
    protected readonly logger: ILogger;
    constructor(billingRepository: IBillingRepository, logger: ILogger);
    protected executeImpl(request: GetPatientOutstandingBalanceRequest): Promise<GetPatientOutstandingBalanceResponse>;
    private calculateBalance;
    private calculateBreakdown;
    private getOldestUnpaidInvoice;
    private getUpcomingDue;
}
//# sourceMappingURL=GetPatientOutstandingBalanceUseCase.d.ts.map