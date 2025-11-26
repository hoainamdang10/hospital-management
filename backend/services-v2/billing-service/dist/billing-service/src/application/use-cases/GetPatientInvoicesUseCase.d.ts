import { BaseHealthcareUseCase } from "../../../../shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "../../../../shared/application/services/logger.interface";
export interface GetPatientInvoicesRequest {
    patientId: string;
}
export interface GetPatientInvoicesResponse {
    invoices: Array<{
        invoiceId: string;
        invoiceNumber?: string;
        appointmentId?: string;
        doctorName?: string;
        doctorDepartment?: string;
        cancellationReason?: string;
        totalAmount: number;
        outstandingAmount: number;
        paidAmount: number;
        status: string;
        createdAt: Date;
        payments: Array<{
            id: string;
            amount: number;
            currency: string;
            method: string;
            status: string;
            transactionId?: string;
            paidAt?: Date;
            refundedAt?: Date;
            refundReason?: string;
            refundedBy?: string;
            gatewayRefundId?: string;
        }>;
    }>;
    totalCount: number;
}
export declare class GetPatientInvoicesUseCase extends BaseHealthcareUseCase<GetPatientInvoicesRequest, GetPatientInvoicesResponse> {
    private readonly invoiceRepository;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, logger: ILogger);
    protected executeImpl(request: GetPatientInvoicesRequest): Promise<GetPatientInvoicesResponse>;
}
//# sourceMappingURL=GetPatientInvoicesUseCase.d.ts.map