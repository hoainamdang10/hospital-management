import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "@shared/application/services/logger.interface";
import {
  mapInvoiceForPatientResponse,
  type PatientInvoiceResponse,
} from "../mappers/patient-invoice.mapper";

export interface GetPatientInvoicesRequest {
  patientId: string;
}

export interface GetPatientInvoicesResponse {
  invoices: PatientInvoiceResponse[];
  totalCount: number;
}

export class GetPatientInvoicesUseCase extends BaseHealthcareUseCase<
  GetPatientInvoicesRequest,
  GetPatientInvoicesResponse
> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    logger: ILogger,
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(
    request: GetPatientInvoicesRequest,
  ): Promise<GetPatientInvoicesResponse> {
    this.logger.info("Getting patient invoices", {
      patientId: request.patientId,
    });

    const invoices = await this.invoiceRepository.findByPatientId(
      request.patientId,
    );

    return {
      invoices: invoices.map(mapInvoiceForPatientResponse),
      totalCount: invoices.length,
    };
  }
}
