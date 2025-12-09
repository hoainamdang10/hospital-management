import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { ILogger } from "@shared/application/services/logger.interface";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import {
  mapInvoiceForPatientResponse,
  type PatientInvoiceResponse,
} from "../mappers/patient-invoice.mapper";

export interface GetInvoicesByAppointmentRequest {
  appointmentId: string;
}

export interface GetInvoicesByAppointmentResponse {
  invoices: PatientInvoiceResponse[];
  totalCount: number;
}

export class GetInvoicesByAppointmentUseCase extends BaseHealthcareUseCase<
  GetInvoicesByAppointmentRequest,
  GetInvoicesByAppointmentResponse
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
    request: GetInvoicesByAppointmentRequest,
  ): Promise<GetInvoicesByAppointmentResponse> {
    if (!request.appointmentId) {
      throw new Error("Appointment ID is required");
    }

    this.logger.info("Getting invoices for appointment", {
      appointmentId: request.appointmentId,
    });

    const invoices = await this.invoiceRepository.findAllByAppointmentId(
      request.appointmentId,
    );

    if (!invoices || invoices.length === 0) {
      return {
        invoices: [],
        totalCount: 0,
      };
    }

    return {
      invoices: invoices.map(mapInvoiceForPatientResponse),
      totalCount: invoices.length,
    };
  }
}
