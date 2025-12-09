import { BaseHealthcareUseCase } from "../../../../shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { IEventBus } from "../../../../shared/application/services/event-bus.interface";
import { ILogger } from "../../../../shared/application/services/logger.interface";
export interface CreateInvoiceRequest {
    patientId: string;
    appointmentId?: string;
    staffId?: string;
    metadata?: any;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
    }>;
    insurance?: {
        provider: string;
        policyNumber: string;
        coveragePercentage: number;
    };
    insuranceCoverageAmount?: number;
}
export interface CreateInvoiceResponse {
    invoiceId: string;
    invoiceNumber?: string;
    totalAmount: number;
    outstandingAmount: number;
    status: string;
}
export declare class CreateInvoiceUseCase extends BaseHealthcareUseCase<CreateInvoiceRequest, CreateInvoiceResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, logger: ILogger);
    protected executeImpl(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse>;
}
//# sourceMappingURL=CreateInvoiceUseCase.d.ts.map