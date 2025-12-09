import { BaseHealthcareUseCase } from "../../../../shared/application/base/base-healthcare-use-case";
import { ILogger } from "../../../../shared/application/services/logger.interface";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { type PatientInvoiceResponse } from "../mappers/patient-invoice.mapper";
export interface GetInvoicesByAppointmentRequest {
    appointmentId: string;
}
export interface GetInvoicesByAppointmentResponse {
    invoices: PatientInvoiceResponse[];
    totalCount: number;
}
export declare class GetInvoicesByAppointmentUseCase extends BaseHealthcareUseCase<GetInvoicesByAppointmentRequest, GetInvoicesByAppointmentResponse> {
    private readonly invoiceRepository;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, logger: ILogger);
    protected executeImpl(request: GetInvoicesByAppointmentRequest): Promise<GetInvoicesByAppointmentResponse>;
}
//# sourceMappingURL=GetInvoicesByAppointmentUseCase.d.ts.map