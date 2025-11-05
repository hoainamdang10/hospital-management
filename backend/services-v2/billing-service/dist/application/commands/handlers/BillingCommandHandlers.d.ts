/**
 * BillingCommandHandlers - Application Layer
 * Command handlers for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Command Pattern
 */
import { IBillingRepository } from '../../../domain/repositories/IBillingRepository';
import { IDomainEventPublisher } from '../../../../../shared/domain/events/IDomainEventPublisher';
import { GenerateInvoiceRequest, GenerateInvoiceResponse } from '../../use-cases/GenerateInvoiceUseCase';
import { ProcessPaymentRequest, ProcessPaymentResponse } from '../../use-cases/ProcessPaymentUseCase';
import { ValidateInsuranceRequest, ValidateInsuranceResponse } from '../../use-cases/ValidateInsuranceUseCase';
export interface GenerateInvoiceCommand extends GenerateInvoiceRequest {
    commandId: string;
    timestamp: Date;
    userId: string;
}
export interface ProcessPaymentCommand extends ProcessPaymentRequest {
    commandId: string;
    timestamp: Date;
    userId: string;
}
export interface ValidateInsuranceCommand extends ValidateInsuranceRequest {
    commandId: string;
    timestamp: Date;
    userId: string;
}
export interface CreatePayOSPaymentCommand {
    commandId: string;
    timestamp: Date;
    userId: string;
    invoiceId: string;
    amount: number;
    description: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    returnUrl?: string;
    cancelUrl?: string;
}
export interface ProcessPayOSWebhookCommand {
    commandId: string;
    timestamp: Date;
    webhookData: any;
    signature: string;
}
/**
 * BillingCommandHandlers
 * Handles all billing-related commands
 */
export declare class BillingCommandHandlers {
    private readonly billingRepository;
    private readonly eventPublisher;
    private readonly generateInvoiceUseCase;
    private readonly processPaymentUseCase;
    private readonly validateInsuranceUseCase;
    private readonly payosService;
    constructor(billingRepository: IBillingRepository, eventPublisher: IDomainEventPublisher, payosConfig: {
        apiUrl: string;
        clientId: string;
        apiKey: string;
        checksumKey: string;
    });
    /**
     * Handle generate invoice command
     */
    handleGenerateInvoice(command: GenerateInvoiceCommand): Promise<GenerateInvoiceResponse>;
    /**
     * Handle process payment command
     */
    handleProcessPayment(command: ProcessPaymentCommand): Promise<ProcessPaymentResponse>;
    /**
     * Handle validate insurance command
     */
    handleValidateInsurance(command: ValidateInsuranceCommand): Promise<ValidateInsuranceResponse>;
    /**
     * Handle create PayOS payment command
     */
    handleCreatePayOSPayment(command: CreatePayOSPaymentCommand): Promise<{
        success: boolean;
        data?: any;
        error?: {
            code: string;
            desc: string;
        };
        message: string;
    }>;
    /**
     * Handle process PayOS webhook command
     */
    handleProcessPayOSWebhook(command: ProcessPayOSWebhookCommand): Promise<{
        success: boolean;
        data?: any;
        error?: {
            code: string;
            desc: string;
        };
        message: string;
    }>;
    /**
     * Generate command ID
     */
    static generateCommandId(prefix?: string): string;
    /**
     * Create generate invoice command
     */
    static createGenerateInvoiceCommand(request: GenerateInvoiceRequest, userId: string): GenerateInvoiceCommand;
    /**
     * Create process payment command
     */
    static createProcessPaymentCommand(request: ProcessPaymentRequest, userId: string): ProcessPaymentCommand;
    /**
     * Create validate insurance command
     */
    static createValidateInsuranceCommand(request: ValidateInsuranceRequest, userId: string): ValidateInsuranceCommand;
    /**
     * Create PayOS payment command
     */
    static createPayOSPaymentCommand(invoiceId: string, amount: number, description: string, userId: string, buyerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
    }, urls?: {
        returnUrl?: string;
        cancelUrl?: string;
    }): CreatePayOSPaymentCommand;
    /**
     * Create PayOS webhook command
     */
    static createPayOSWebhookCommand(webhookData: any, signature: string): ProcessPayOSWebhookCommand;
}
//# sourceMappingURL=BillingCommandHandlers.d.ts.map