import { BaseHealthcareUseCase } from "@shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { ILogger } from "@shared/application/services/logger.interface";

export interface SearchInvoicesRequest {
  patientId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  invoiceNumber?: string;
  dateField?: "created_at" | "paid_at" | "updated_at";
}

export interface InvoiceSummary {
  invoiceId: string;
  invoiceNumber?: string;
  patientId: string;
  patientName?: string;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
  createdAt: Date;
  paidAt?: Date;
  finalizedAt?: Date;
}

export interface SearchInvoicesResponse {
  invoices: InvoiceSummary[];
  total: number;
}

export class SearchInvoicesUseCase extends BaseHealthcareUseCase<
  SearchInvoicesRequest,
  SearchInvoicesResponse
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
    request: SearchInvoicesRequest,
  ): Promise<SearchInvoicesResponse> {
    this.logger.info("Searching invoices", { criteria: request });

    const invoices = await this.invoiceRepository.search(request);

    const invoiceSummaries: InvoiceSummary[] = invoices.map((invoice) => {
      const metadata = invoice.metadata || {};
      const patientName =
        metadata.patientName ||
        metadata.patient_name ||
        metadata.patientFullName ||
        metadata.patient_full_name ||
        metadata.patientDisplayName ||
        metadata.patient_display_name ||
        metadata.patient?.fullName ||
        metadata.patient?.name ||
        metadata.patientInfo?.fullName ||
        metadata.patient_info?.fullName ||
        metadata.patientInfo?.name ||
        metadata.patient_info?.name;

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientId: invoice.patientId,
        patientName,
        totalAmount: invoice.totalAmount.amount,
        outstandingAmount: invoice.outstandingAmount.amount,
        status: invoice.status.value,
        createdAt: invoice.createdAt,
        paidAt: invoice.paidAt,
        finalizedAt: undefined, // Will be added when we expose this property
      };
    });

    this.logger.info("Search completed", { count: invoiceSummaries.length });

    return {
      invoices: invoiceSummaries,
      total: invoiceSummaries.length,
    };
  }
}
