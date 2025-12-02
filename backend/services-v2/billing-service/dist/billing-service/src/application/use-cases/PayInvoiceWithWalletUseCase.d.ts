import { BaseHealthcareUseCase } from "../../../../shared/application/base/base-healthcare-use-case";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { IEventBus } from "../../../../shared/application/services/event-bus.interface";
import { ILogger } from "../../../../shared/application/services/logger.interface";
import { WalletService } from "../services/WalletService";
import { WalletTransaction } from "../../domain/entities/Wallet";
export interface PayInvoiceWithWalletRequest {
    invoiceId: string;
    patientId?: string;
    description?: string;
    initiatedBy?: string;
}
export interface PayInvoiceWithWalletResponse {
    success: boolean;
    message: string;
    invoiceId?: string;
    paymentId?: string;
    walletTransaction?: WalletTransaction;
    errors?: string[];
}
export declare class PayInvoiceWithWalletUseCase extends BaseHealthcareUseCase<PayInvoiceWithWalletRequest, PayInvoiceWithWalletResponse> {
    private readonly invoiceRepository;
    private readonly eventBus;
    private readonly walletService;
    protected readonly logger: ILogger;
    constructor(invoiceRepository: IInvoiceRepository, eventBus: IEventBus, walletService: WalletService, logger: ILogger);
    protected executeImpl(request: PayInvoiceWithWalletRequest): Promise<PayInvoiceWithWalletResponse>;
    authorize(request: PayInvoiceWithWalletRequest, userId: string): Promise<boolean>;
    involvesPHI(request: PayInvoiceWithWalletRequest): boolean;
    getPatientId(request: PayInvoiceWithWalletRequest): string | null;
    private isSameIdentifier;
}
//# sourceMappingURL=PayInvoiceWithWalletUseCase.d.ts.map