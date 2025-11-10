/**
 * GetInvoicesUseCase - Application Layer
 * Use case for retrieving invoices with filters and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
export interface GetInvoicesRequest {
    page: number;
    limit: number;
    status?: string[];
    patientId?: string;
    doctorId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface GetInvoicesResponse {
    success: boolean;
    data?: Array<{
        invoiceId: string;
        invoiceNumber: string;
        patientId: string;
        doctorId: string;
        status: string;
        totalAmount: number;
        insuranceCoverage: number;
        patientPayable: number;
        currency: string;
        dueDate?: Date;
        issuedAt: Date;
        isOverdue: boolean;
    }>;
    total: number;
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GetInvoicesUseCase extends BaseHealthcareUseCase<GetInvoicesRequest, GetInvoicesResponse> {
    private readonly billingRepository;
    protected readonly logger: ILogger;
    constructor(billingRepository: IBillingRepository, logger: ILogger);
    protected executeImpl(request: GetInvoicesRequest): Promise<GetInvoicesResponse>;
}
//# sourceMappingURL=GetInvoicesUseCase.d.ts.map