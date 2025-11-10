/**
 * DownloadInvoiceUseCase - Application Layer
 * Use case for downloading invoice as PDF
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
export interface DownloadInvoiceRequest {
    invoiceId: string;
    format: 'pdf' | 'html';
    language?: 'vi' | 'en';
}
export interface DownloadInvoiceResponse {
    success: boolean;
    data?: {
        fileContent: Buffer;
        fileName: string;
        mimeType: string;
        fileSize: number;
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class DownloadInvoiceUseCase extends BaseHealthcareUseCase<DownloadInvoiceRequest, DownloadInvoiceResponse> {
    private readonly billingRepository;
    protected readonly logger: ILogger;
    constructor(billingRepository: IBillingRepository, logger: ILogger);
    protected executeImpl(request: DownloadInvoiceRequest): Promise<DownloadInvoiceResponse>;
    private generatePDF;
    private generateHTML;
}
//# sourceMappingURL=DownloadInvoiceUseCase.d.ts.map