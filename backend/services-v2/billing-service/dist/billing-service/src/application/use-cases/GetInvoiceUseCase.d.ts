import { BaseHealthcareUseCase } from "../../../../shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "../../../../shared/application/services/logger.interface";
export interface GetInvoiceRequest {
    invoiceId: string;
}
export interface GetInvoiceResponse {
    invoiceId: string;
    patientId: string;
    invoiceNumber?: string;
    appointmentId?: string;
    doctorName?: string;
    doctorDepartment?: string;
    cancellationReason?: string;
    cancelledBy?: string;
    metadata?: Record<string, any>;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    subtotal: number;
    tax: number;
    totalAmount: number;
    outstandingAmount: number;
    status: string;
    payments: Array<{
        id: string;
        amount: number;
        method: string;
        status: string;
        paidAt?: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class GetInvoiceUseCase extends BaseHealthcareUseCase<GetInvoiceRequest, GetInvoiceResponse> {
    private readonly invoiceRepository;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, logger: ILogger);
    protected executeImpl(request: GetInvoiceRequest): Promise<GetInvoiceResponse>;
}
//# sourceMappingURL=GetInvoiceUseCase.d.ts.map